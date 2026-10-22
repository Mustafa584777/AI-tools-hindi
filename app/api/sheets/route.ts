import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { BlogPost } from '@/lib/types';
import { 
  convertPostsToCsv, 
  parseCsvToBlogPosts, 
  normalizeGoogleSheetUrl, 
  GoogleSheetsConfig 
} from '@/lib/google-sheets';

const DATA_DIR = path.join(process.cwd(), 'data');
const BACKUP_FILE = path.join(DATA_DIR, 'articles-backup.json');
const CONFIG_FILE = path.join(DATA_DIR, 'sheets-config.json');

function getLocalPosts(): BlogPost[] {
  try {
    if (fs.existsSync(BACKUP_FILE)) {
      const content = fs.readFileSync(BACKUP_FILE, 'utf-8');
      const parsed = JSON.parse(content);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.error('Error reading backup posts:', e);
  }
  return [];
}

function saveLocalPosts(posts: BlogPost[]): void {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(BACKUP_FILE, JSON.stringify(posts, null, 2), 'utf-8');
  } catch (e) {
    console.error('Error saving local posts:', e);
  }
}

function getSheetsConfig(): GoogleSheetsConfig {
  try {
    if (fs.existsSync(CONFIG_FILE)) {
      const content = fs.readFileSync(CONFIG_FILE, 'utf-8');
      return JSON.parse(content);
    }
  } catch (e) {
    console.error('Error reading sheets config:', e);
  }
  return {
    publishedCsvUrl: process.env.NEXT_PUBLIC_GOOGLE_SHEET_CSV_URL || '',
    appsScriptUrl: process.env.GOOGLE_APPS_SCRIPT_URL || '',
    lastSyncedAt: 0,
    articleCount: 0
  };
}

function saveSheetsConfig(config: GoogleSheetsConfig): void {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2), 'utf-8');
  } catch (e) {
    console.error('Error saving sheets config:', e);
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const action = searchParams.get('action') || 'export';

  // 1. Export CSV
  if (action === 'export') {
    const posts = getLocalPosts();
    const csvContent = convertPostsToCsv(posts);
    // Add UTF-8 BOM so Hindi unicode characters render properly in Excel & Google Sheets
    const utf8BomCsv = '\uFEFF' + csvContent;

    return new NextResponse(utf8BomCsv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="aitoolhindi-articles-backup-${new Date().toISOString().slice(0, 10)}.csv"`,
        'Cache-Control': 'no-cache'
      }
    });
  }

  // 2. Get Current Config
  if (action === 'config') {
    const config = getSheetsConfig();
    const posts = getLocalPosts();
    return NextResponse.json({
      success: true,
      config,
      localArticleCount: posts.length
    });
  }

  // 3. Test & Sync from Google Sheets URL
  if (action === 'sync') {
    let url = searchParams.get('url') || '';
    if (!url) {
      const config = getSheetsConfig();
      url = config.publishedCsvUrl;
    }

    if (!url) {
      return NextResponse.json({
        success: false,
        error: 'Google Sheet CSV URL provided nahi hai.'
      }, { status: 400 });
    }

    const normalizedUrl = normalizeGoogleSheetUrl(url);

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000);

      const res = await fetch(normalizedUrl, {
        signal: controller.signal,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AI-Tool-Hindi/1.0'
        },
        cache: 'no-store'
      });
      clearTimeout(timeoutId);

      if (!res.ok) {
        return NextResponse.json({
          success: false,
          error: `Google Sheets se data fetch nahi ho paya. HTTP Status: ${res.status} (${res.statusText})`
        }, { status: 400 });
      }

      const csvData = await res.text();
      if (!csvData || csvData.trim().length === 0) {
        return NextResponse.json({
          success: false,
          error: 'Google Sheet se khali response aaya. Kripya check karein ki sheet me data hai ya nahi.'
        }, { status: 400 });
      }

      // Check if it's HTML login error from Google
      if (csvData.includes('<!DOCTYPE html>') || csvData.includes('accounts.google.com')) {
        return NextResponse.json({
          success: false,
          error: 'Google Sheet private hai ya access restricted hai. Kripya sheet ko "Anyone with the link can view" karein ya "File > Share > Publish to web > CSV" se publish karein.'
        }, { status: 400 });
      }

      const parsedPosts = parseCsvToBlogPosts(csvData);

      if (parsedPosts.length === 0) {
        return NextResponse.json({
          success: false,
          error: 'Google Sheet CSV parse hua lekin koi valid articles nahi mile. Kripya ensure karein headers id, title, slug, content match karte hain.'
        }, { status: 400 });
      }

      // If shouldApply is true, update local backup and config
      const shouldApply = searchParams.get('apply') === 'true';
      if (shouldApply) {
        saveLocalPosts(parsedPosts);
        const currentConfig = getSheetsConfig();
        currentConfig.publishedCsvUrl = normalizedUrl;
        currentConfig.lastSyncedAt = Date.now();
        currentConfig.articleCount = parsedPosts.length;
        saveSheetsConfig(currentConfig);
      }

      return NextResponse.json({
        success: true,
        count: parsedPosts.length,
        normalizedUrl,
        sampleTitles: parsedPosts.slice(0, 3).map(p => p.title),
        message: `Kamyabi se ${parsedPosts.length} articles load ho gaye!`
      });

    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      return NextResponse.json({
        success: false,
        error: `Sync error: ${errorMessage}`
      }, { status: 500 });
    }
  }

  return NextResponse.json({ success: false, error: 'Unknown action' }, { status: 400 });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const action = body.action || 'save_config';

    if (action === 'save_config') {
      const currentConfig = getSheetsConfig();
      if (body.publishedCsvUrl !== undefined) {
        currentConfig.publishedCsvUrl = normalizeGoogleSheetUrl(body.publishedCsvUrl);
      }
      if (body.appsScriptUrl !== undefined) {
        currentConfig.appsScriptUrl = body.appsScriptUrl.trim();
      }
      saveSheetsConfig(currentConfig);

      return NextResponse.json({
        success: true,
        message: 'Google Sheets configuration successfully saved!',
        config: currentConfig
      });
    }

    if (action === 'pull_from_sheets') {
      const config = getSheetsConfig();
      const targetUrl = normalizeGoogleSheetUrl(body.publishedCsvUrl || config.publishedCsvUrl);

      if (!targetUrl) {
        return NextResponse.json({ success: false, error: 'No Google Sheet CSV URL configured' }, { status: 400 });
      }

      const res = await fetch(targetUrl, { cache: 'no-store' });
      if (!res.ok) {
        return NextResponse.json({ success: false, error: `Failed to fetch from sheet: HTTP ${res.status}` }, { status: 400 });
      }

      const csvData = await res.text();
      const parsed = parseCsvToBlogPosts(csvData);
      if (parsed.length > 0) {
        saveLocalPosts(parsed);
        config.publishedCsvUrl = targetUrl;
        config.lastSyncedAt = Date.now();
        config.articleCount = parsed.length;
        saveSheetsConfig(config);

        return NextResponse.json({
          success: true,
          count: parsed.length,
          posts: parsed
        });
      } else {
        return NextResponse.json({ success: false, error: 'No articles found in CSV' }, { status: 400 });
      }
    }

    if (action === 'webhook_save') {
      const config = getSheetsConfig();
      const webhookUrl = body.appsScriptUrl || config.appsScriptUrl;
      if (!webhookUrl) {
        return NextResponse.json({ success: true, message: 'No Apps Script webhook configured, skipped webhook push.' });
      }

      try {
        const response = await fetch(webhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'save', post: body.post }),
          redirect: 'follow'
        });
        const resText = await response.text();
        return NextResponse.json({ success: true, webhookResponse: resText });
      } catch (webhookErr) {
        console.warn('Apps Script webhook save error:', webhookErr);
        return NextResponse.json({ success: false, error: String(webhookErr) }, { status: 502 });
      }
    }

    if (action === 'webhook_delete') {
      const config = getSheetsConfig();
      const webhookUrl = body.appsScriptUrl || config.appsScriptUrl;
      if (!webhookUrl) {
        return NextResponse.json({ success: true, message: 'No Apps Script webhook configured, skipped webhook delete.' });
      }

      try {
        const response = await fetch(webhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'delete', id: body.id, slug: body.slug }),
          redirect: 'follow'
        });
        const resText = await response.text();
        return NextResponse.json({ success: true, webhookResponse: resText });
      } catch (webhookErr) {
        console.warn('Apps Script webhook delete error:', webhookErr);
        return NextResponse.json({ success: false, error: String(webhookErr) }, { status: 502 });
      }
    }

    return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 });
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ success: false, error: errorMessage }, { status: 500 });
  }
}

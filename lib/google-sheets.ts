import { BlogPost } from './types';

export interface GoogleSheetsConfig {
  publishedCsvUrl: string;
  appsScriptUrl?: string;
  lastSyncedAt?: number;
  articleCount?: number;
}

/**
 * Standard CSV escaping for a single field according to RFC 4180
 */
export function escapeCsvCell(value: unknown): string {
  if (value === null || value === undefined) return '""';
  let str = String(value);
  // If field contains quotes, commas, or newlines, quote it and escape internal quotes
  if (str.includes('"') || str.includes(',') || str.includes('\n') || str.includes('\r')) {
    str = '"' + str.replace(/"/g, '""') + '"';
  } else {
    str = `"${str}"`;
  }
  return str;
}

/**
 * Converts a list of BlogPosts to a Google Sheets-ready CSV string.
 * Handles the 50,000 character limit of Google Sheets cells by splitting
 * content exceeding 40,000 characters into content and content2 columns.
 */
export function convertPostsToCsv(posts: BlogPost[]): string {
  const headers = [
    'id',
    'slug',
    'title',
    'excerpt',
    'metaDescription',
    'category',
    'author',
    'date',
    'readTime',
    'image',
    'imageAlt',
    'imageSlug',
    'status',
    'createdAt',
    'content',
    'content2'
  ];

  const rows: string[] = [headers.map(h => `"${h}"`).join(',')];

  posts.forEach((post) => {
    let contentPart1 = post.content || '';
    let contentPart2 = '';

    // Google Sheets cell character limit is 50,000 chars.
    // Safely split at 40,000 chars at a clean boundary (e.g. </p> or newline)
    if (contentPart1.length > 40000) {
      let splitIdx = contentPart1.lastIndexOf('</p>', 40000);
      if (splitIdx === -1 || splitIdx < 20000) {
        splitIdx = contentPart1.lastIndexOf('\n', 40000);
      }
      if (splitIdx === -1 || splitIdx < 20000) {
        splitIdx = 40000;
      } else {
        splitIdx += 4; // include </p>
      }
      contentPart2 = contentPart1.substring(splitIdx);
      contentPart1 = contentPart1.substring(0, splitIdx);
    }

    const row = [
      escapeCsvCell(post.id || `blog-${post.slug}`),
      escapeCsvCell(post.slug || ''),
      escapeCsvCell(post.title || ''),
      escapeCsvCell(post.excerpt || ''),
      escapeCsvCell(post.metaDescription || post.excerpt || ''),
      escapeCsvCell(post.category || 'AI Guides'),
      escapeCsvCell(post.author || 'Anwar'),
      escapeCsvCell(post.date || ''),
      escapeCsvCell(post.readTime || '5 min read'),
      escapeCsvCell(post.image || ''),
      escapeCsvCell(post.imageAlt || post.title || ''),
      escapeCsvCell(post.imageSlug || `${post.slug}-featured`),
      escapeCsvCell(post.status || 'published'),
      escapeCsvCell(post.createdAt || Date.now()),
      escapeCsvCell(contentPart1),
      escapeCsvCell(contentPart2)
    ];

    rows.push(row.join(','));
  });

  return rows.join('\r\n');
}

/**
 * Robust RFC 4180 compliant CSV parser that handles:
 * - Multiline strings within quotes
 * - Escaped double quotes ("")
 * - Trailing newlines
 */
export function parseCsvRows(csvText: string): string[][] {
  const cleanText = csvText.replace(/^\uFEFF/, ''); // Strip BOM
  const rows: string[][] = [];
  let currentRow: string[] = [];
  let currentField = '';
  let insideQuote = false;

  for (let i = 0; i < cleanText.length; i++) {
    const char = cleanText[i];
    const nextChar = cleanText[i + 1];

    if (insideQuote) {
      if (char === '"') {
        if (nextChar === '"') {
          // Escaped quote: "" -> "
          currentField += '"';
          i++;
        } else {
          // End of quoted cell
          insideQuote = false;
        }
      } else {
        currentField += char;
      }
    } else {
      if (char === '"') {
        insideQuote = true;
      } else if (char === ',') {
        currentRow.push(currentField);
        currentField = '';
      } else if (char === '\r') {
        if (nextChar === '\n') {
          i++;
        }
        currentRow.push(currentField);
        rows.push(currentRow);
        currentRow = [];
        currentField = '';
      } else if (char === '\n') {
        currentRow.push(currentField);
        rows.push(currentRow);
        currentRow = [];
        currentField = '';
      } else {
        currentField += char;
      }
    }
  }

  // Push last field & row if remaining
  if (currentField.length > 0 || currentRow.length > 0) {
    currentRow.push(currentField);
    rows.push(currentRow);
  }

  return rows;
}

/**
 * Converts parsed CSV rows into BlogPost array
 */
export function parseCsvToBlogPosts(csvText: string): BlogPost[] {
  const rows = parseCsvRows(csvText);
  if (rows.length < 2) return [];

  const headers = rows[0].map(h => h.trim().toLowerCase());
  const headerMap = new Map<string, number>();
  headers.forEach((h, idx) => headerMap.set(h, idx));

  const getCol = (row: string[], name: string, keepWhitespace = false): string => {
    const idx = headerMap.get(name.toLowerCase());
    if (idx === undefined || row[idx] === undefined) return '';
    return keepWhitespace ? row[idx] : row[idx].trim();
  };

  const posts: BlogPost[] = [];

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    if (row.length === 0 || (row.length === 1 && !row[0].trim())) continue;

    const title = getCol(row, 'title');
    const slug = getCol(row, 'slug');
    if (!title && !slug) continue;

    const content1 = getCol(row, 'content', true);
    const content2 = getCol(row, 'content2', true);
    const combinedContent = (content1 || '') + (content2 || '');

    const createdAtVal = parseInt(getCol(row, 'createdat'), 10);
    const createdAt = !isNaN(createdAtVal) && createdAtVal > 0 ? createdAtVal : Date.now();

    const post: BlogPost = {
      id: getCol(row, 'id') || `blog-${slug || Math.random().toString(36).substring(7)}`,
      slug: slug || title.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      title,
      excerpt: getCol(row, 'excerpt') || getCol(row, 'metadescription'),
      metaDescription: getCol(row, 'metadescription') || getCol(row, 'excerpt'),
      category: getCol(row, 'category') || 'AI Guides',
      author: getCol(row, 'author') || 'Anwar',
      date: getCol(row, 'date') || new Date(createdAt).toLocaleDateString('hi-IN'),
      readTime: getCol(row, 'readtime') || '5 min read',
      image: getCol(row, 'image') || 'https://picsum.photos/seed/blog/800/450',
      imageAlt: getCol(row, 'imagealt') || title,
      imageSlug: getCol(row, 'imageslug') || `${slug}-featured`,
      status: (getCol(row, 'status') === 'draft' ? 'draft' : 'published') as 'published' | 'draft',
      content: combinedContent,
      createdAt
    };

    posts.push(post);
  }

  posts.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
  return posts;
}

/**
 * Normalizes user-entered Google Sheet URL to an export CSV URL if needed.
 * Supports:
 * - Direct published URL: https://docs.google.com/spreadsheets/d/e/2PACX-.../pub?output=csv
 * - Standard edit URL: https://docs.google.com/spreadsheets/d/SPREADSHEET_ID/edit#gid=0 -> export?format=csv
 * - Direct export URL: https://docs.google.com/spreadsheets/d/SPREADSHEET_ID/export?format=csv
 */
export function normalizeGoogleSheetUrl(url: string): string {
  if (!url || typeof url !== 'string') return '';
  const trimmed = url.trim();

  // If already a published CSV link
  if (trimmed.includes('pub?output=csv') || trimmed.includes('export?format=csv') || trimmed.includes('tqx=out:csv')) {
    return trimmed;
  }

  // If it's a published web link without output=csv
  if (trimmed.includes('/pub') && !trimmed.includes('output=csv')) {
    const separator = trimmed.includes('?') ? '&' : '?';
    return `${trimmed}${separator}output=csv`;
  }

  // If user pasted normal Google Sheet edit link: /spreadsheets/d/{ID}/edit...
  const match = trimmed.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  if (match && match[1]) {
    const sheetId = match[1];
    // Check if gid is present
    const gidMatch = trimmed.match(/[?#&]gid=([0-9]+)/);
    const gid = gidMatch ? gidMatch[1] : '0';
    return `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv&gid=${gid}`;
  }

  return trimmed;
}

/**
 * Google Apps Script Web App Template
 * Users can paste this into Google Sheets > Extensions > Apps Script and deploy as Web App.
 */
export const GOOGLE_APPS_SCRIPT_TEMPLATE = `/**
 * AI Tool Hindi - Google Sheets Blog Database Webhook
 * 
 * Instructions:
 * 1. Go to Extensions > Apps Script in your Google Sheet
 * 2. Delete all existing code and paste this entire code
 * 3. Click Save (floppy disk icon)
 * 4. Click 'Deploy' > 'New deployment'
 * 5. Select type: 'Web app'
 * 6. Set Description: 'AI Tool Hindi Blog Sync'
 * 7. Set 'Execute as': 'Me'
 * 8. Set 'Who has access': 'Anyone' (IMPORTANT!)
 * 9. Click 'Deploy', authorize permissions, and copy the Web App URL
 * 10. Paste the Web App URL into Admin Panel
 */

const HEADERS = [
  'id', 'slug', 'title', 'excerpt', 'metaDescription',
  'category', 'author', 'date', 'readTime', 'image',
  'imageAlt', 'imageSlug', 'status', 'createdAt', 'content', 'content2'
];

function setupSheetIfNeeded(sheet) {
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(HEADERS);
    sheet.getRange(1, 1, 1, HEADERS.length).setFontWeight('bold').setBackground('#f1f5f9');
    sheet.setFrozenRows(1);
  }
}

function doGet(e) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getActiveSheet();
    setupSheetIfNeeded(sheet);

    const data = sheet.getDataRange().getValues();
    if (data.length <= 1) {
      return ContentService.createTextOutput(JSON.stringify({ success: true, count: 0, posts: [] }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    const headers = data[0].map(h => String(h).trim().toLowerCase());
    const posts = [];

    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      const post = {};
      headers.forEach((h, colIdx) => {
        post[h] = row[colIdx];
      });

      // Merge content and content2
      post.content = (post.content || '') + (post.content2 || '');
      delete post.content2;

      if (post.title || post.slug) {
        posts.push(post);
      }
    }

    return ContentService.createTextOutput(JSON.stringify({ success: true, count: posts.length, posts: posts }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ success: false, error: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function doPost(e) {
  try {
    const rawData = e.postData.contents;
    const body = JSON.parse(rawData);
    const action = body.action || 'save';

    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getActiveSheet();
    setupSheetIfNeeded(sheet);

    if (action === 'delete') {
      const targetId = body.id || body.slug;
      if (!targetId) {
        return ContentService.createTextOutput(JSON.stringify({ success: false, error: 'Missing ID/slug' }))
          .setMimeType(ContentService.MimeType.JSON);
      }

      const data = sheet.getDataRange().getValues();
      const idIdx = 0; // 'id' column
      const slugIdx = 1; // 'slug' column

      let deleted = false;
      for (let i = data.length - 1; i >= 1; i--) {
        const rowId = String(data[i][idIdx]);
        const rowSlug = String(data[i][slugIdx]);
        if (rowId === targetId || rowSlug === targetId) {
          sheet.deleteRow(i + 1);
          deleted = true;
          break;
        }
      }

      return ContentService.createTextOutput(JSON.stringify({ success: true, deleted: deleted, id: targetId }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    // Default action: 'save'
    const post = body.post || body;
    if (!post || (!post.title && !post.slug)) {
      return ContentService.createTextOutput(JSON.stringify({ success: false, error: 'Invalid post data' }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    // Split content safely under 40,000 characters for Google Sheets limits
    let content1 = post.content || '';
    let content2 = '';
    if (content1.length > 40000) {
      let splitIdx = content1.lastIndexOf('</p>', 40000);
      if (splitIdx === -1 || splitIdx < 20000) {
        splitIdx = 40000;
      } else {
        splitIdx += 4;
      }
      content2 = content1.substring(splitIdx);
      content1 = content1.substring(0, splitIdx);
    }

    const rowValues = [
      post.id || ('blog-' + post.slug),
      post.slug || '',
      post.title || '',
      post.excerpt || '',
      post.metaDescription || post.excerpt || '',
      post.category || 'AI Guides',
      post.author || 'Anwar',
      post.date || new Date().toLocaleDateString('hi-IN'),
      post.readTime || '5 min read',
      post.image || '',
      post.imageAlt || post.title || '',
      post.imageSlug || (post.slug + '-featured'),
      post.status || 'published',
      post.createdAt || Date.now(),
      content1,
      content2
    ];

    const data = sheet.getDataRange().getValues();
    const idIdx = 0;
    const slugIdx = 1;
    let existingRowIndex = -1;

    for (let i = 1; i < data.length; i++) {
      const rowId = String(data[i][idIdx]);
      const rowSlug = String(data[i][slugIdx]);
      if ((post.id && rowId === post.id) || (post.slug && rowSlug === post.slug)) {
        existingRowIndex = i + 1; // 1-based index in Sheet
        break;
      }
    }

    if (existingRowIndex > 0) {
      // Update existing row
      sheet.getRange(existingRowIndex, 1, 1, rowValues.length).setValues([rowValues]);
    } else {
      // Append new row
      sheet.appendRow(rowValues);
    }

    return ContentService.createTextOutput(JSON.stringify({
      success: true,
      action: existingRowIndex > 0 ? 'updated' : 'inserted',
      id: post.id || post.slug
    })).setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ success: false, error: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}
`;

import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  let url = req.nextUrl.searchParams.get('url');
  const isDownload = req.nextUrl.searchParams.get('download') === '1';

  if (!url) {
    return NextResponse.json({ error: 'Missing media URL', failed: true }, { status: 400 });
  }

  // Normalize protocol-relative URLs
  if (url.startsWith('//')) {
    url = 'https:' + url;
  }

  // If already a base64 data URL
  if (url.startsWith('data:')) {
    if (isDownload) {
      const match = url.match(/^data:([^;]+);base64,(.+)$/);
      if (match) {
        const mime = match[1];
        const buffer = Buffer.from(match[2], 'base64');
        const ext = mime.split('/')[1] || 'bin';
        return new Response(buffer, {
          headers: {
            'Content-Type': mime,
            'Content-Disposition': `attachment; filename="downloaded-media.${ext}"`,
          },
        });
      }
    }
    return NextResponse.json({ dataUrl: url, success: true });
  }

  try {
    const cleanUrl = url.trim();
    const response = await fetch(cleanUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        'Accept': 'image/avif,image/webp,image/apng,image/svg+xml,image/*,video/mp4,video/*,*/*;q=0.8',
        'Referer': new URL(cleanUrl).origin
      },
      signal: AbortSignal.timeout(45000), // 45 seconds timeout for large assets / videos
      redirect: 'follow',
    });

    if (!response.ok) {
      throw new Error(`Remote server returned HTTP ${response.status} (${response.statusText})`);
    }

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    // Determine content type
    let contentType = response.headers.get('content-type') || '';
    const urlLower = cleanUrl.toLowerCase().split('?')[0];

    if (urlLower.endsWith('.mp4') || contentType.includes('mp4')) {
      contentType = 'video/mp4';
    } else if (urlLower.endsWith('.webm') || contentType.includes('webm')) {
      contentType = 'video/webm';
    } else if (urlLower.endsWith('.png')) {
      contentType = 'image/png';
    } else if (urlLower.endsWith('.jpg') || urlLower.endsWith('.jpeg')) {
      contentType = 'image/jpeg';
    } else if (urlLower.endsWith('.webp')) {
      contentType = 'image/webp';
    } else if (urlLower.endsWith('.gif')) {
      contentType = 'image/gif';
    } else if (urlLower.endsWith('.svg')) {
      contentType = 'image/svg+xml';
    }

    if (!contentType || contentType === 'application/octet-stream') {
      contentType = urlLower.endsWith('.mp4') ? 'video/mp4' : 'image/jpeg';
    }

    // Direct binary download mode
    if (isDownload) {
      const parsedPath = new URL(cleanUrl).pathname;
      const rawName = parsedPath.split('/').pop() || 'media-download';
      const filename = rawName.includes('.') ? rawName : `${rawName}.${contentType.split('/')[1] || 'jpg'}`;
      return new Response(buffer, {
        headers: {
          'Content-Type': contentType,
          'Content-Length': buffer.length.toString(),
          'Content-Disposition': `attachment; filename="${encodeURIComponent(filename)}"`,
        },
      });
    }

    const base64 = buffer.toString('base64');
    const dataUrl = `data:${contentType};base64,${base64}`;

    return NextResponse.json({
      dataUrl,
      contentType,
      size: buffer.length,
      success: true,
      originalUrl: cleanUrl,
    });
  } catch (err) {
    const errorMsg = (err as Error).message || 'Failed to fetch media';
    console.error('Error fetching media for local conversion:', cleanUrlSafe(url), errorMsg);
    return NextResponse.json({
      failed: true,
      error: errorMsg,
      originalUrl: url,
    }, { status: 200 });
  }
}

function cleanUrlSafe(u: string): string {
  try {
    return new URL(u).pathname;
  } catch {
    return u.substring(0, 50);
  }
}

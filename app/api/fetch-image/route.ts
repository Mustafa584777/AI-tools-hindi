import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get('url');
  if (!url) {
    return NextResponse.json({ error: 'Missing image URL' }, { status: 400 });
  }

  try {
    // If it's already a data URL, return it as is
    if (url.startsWith('data:')) {
      return NextResponse.json({ dataUrl: url });
    }

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AI-Tool-Hindi-Importer'
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.status} ${response.statusText}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const contentType = response.headers.get('content-type') || 'image/jpeg';
    const base64 = buffer.toString('base64');
    const dataUrl = `data:${contentType};base64,${base64}`;

    return NextResponse.json({ dataUrl });
  } catch (err) {
    console.error('Error fetching image for local conversion:', err);
    // Fallback to original URL if fetch fails due to firewall/CORS
    return NextResponse.json({ dataUrl: url, warning: (err as Error).message });
  }
}

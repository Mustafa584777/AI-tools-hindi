import { NextRequest, NextResponse } from 'next/server';
import { fetchMediaImageBySlug } from '@/lib/storage';

export async function GET(req: NextRequest, context: { params: Promise<{ slug: string }> }) {
  try {
    const params = await context.params;
    let slug = params?.slug;
    if (!slug) {
      return new NextResponse('Image not found', { status: 404 });
    }

    slug = decodeURIComponent(slug);
    const baseSlug = slug.replace(/\.[^/.]+$/, '');

    let base64 = await fetchMediaImageBySlug(baseSlug);
    if (!base64) {
      base64 = await fetchMediaImageBySlug(slug);
    }

    if (!base64) {
      return new NextResponse('Image not found', { status: 404 });
    }

    const matches = base64.match(/^data:([^;]+);base64,(.+)$/);
    if (!matches) {
      return new NextResponse('Invalid image data', { status: 500 });
    }

    const contentType = matches[1];
    const buffer = Buffer.from(matches[2], 'base64');

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000, immutable'
      }
    });
  } catch (err) {
    console.error('Media serve error:', err);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

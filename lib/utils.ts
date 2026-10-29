import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Resolves an image URL for display in Next.js Image or img components.
 * - WordPress URLs on aitoolhindi.online are mapped to local /wp-content/... so they load instantly from the repository without mixed-content or external network failures.
 * - Insecure http://aitoolhindi.online URLs are safely handled.
 * - Local relative paths, base64 data URIs, and Cloudinary URLs are preserved.
 * - Empty or missing URLs fall back to a clean placeholder.
 */
export function resolveDisplayImageUrl(url: string | undefined | null): string {
  if (!url || typeof url !== 'string') {
    return 'https://picsum.photos/seed/blogdefault/800/450';
  }

  // Clean trailing backslashes, quotes, or accidental whitespace from json imports
  const cleanUrl = url.trim().replace(/[\\\"\']+$/, '');
  if (!cleanUrl) {
    return 'https://picsum.photos/seed/blogdefault/800/450';
  }

  // Base64 data URIs or blob URIs can be rendered directly
  if (cleanUrl.startsWith('data:') || cleanUrl.startsWith('blob:')) {
    return cleanUrl;
  }

  // Already local relative path (e.g. /wp-content/...)
  if (cleanUrl.startsWith('/')) {
    return cleanUrl;
  }

  // WordPress upload URL on aitoolhindi.online (HTTP or HTTPS, with or without www)
  // Map directly to local static path so it serves with zero CORS / mixed-content issues
  const wpMatch = cleanUrl.match(/^https?:\/\/(?:www\.)?aitoolhindi\.online(\/wp-content\/.+)$/i);
  if (wpMatch && wpMatch[1]) {
    return wpMatch[1];
  }

  // If another URL has http://aitoolhindi.online, upgrade to https
  if (cleanUrl.startsWith('http://aitoolhindi.online/')) {
    return cleanUrl.replace('http://aitoolhindi.online/', 'https://aitoolhindi.online/');
  }

  return cleanUrl;
}

export interface TocItem {
  id: string;
  text: string;
  level: number;
}

/**
 * Strips hardcoded Table of Contents containers, markers, and residual markup from article content.
 * This ensures posts.json and Firebase never store bloated or broken hardcoded TOC markup.
 */
export function stripTableOfContents(html: string | undefined | null): string {
  if (!html || typeof html !== 'string') return '';

  let cleaned = html;

  // 1. Remove ez-toc-container and variants with balanced div parsing
  let matchIdx = -1;
  while ((matchIdx = cleaned.search(/<div\b[^>]*\b(?:id=["']ez-toc-container["']|class=["'][^"']*\bez-toc\b[^"']*["'])/i)) !== -1) {
    let depth = 0;
    let endIdx = -1;
    const sub = cleaned.substring(matchIdx);
    const regex = /<\/?div\b[^>]*>/gi;
    let m;
    while ((m = regex.exec(sub)) !== null) {
      if (m[0].startsWith('</')) {
        depth--;
        if (depth === 0) {
          endIdx = matchIdx + m.index + m[0].length;
          break;
        }
      } else {
        depth++;
      }
    }
    if (endIdx !== -1) {
      cleaned = cleaned.substring(0, matchIdx) + cleaned.substring(endIdx);
    } else {
      cleaned = cleaned.replace(/<div\b[^>]*\bid=["']ez-toc-container["'][\s\S]*?<\/nav>\s*<\/div>/gi, '');
      break;
    }
  }

  // 2. Remove any auto-toc-box that might have been accidentally saved
  cleaned = cleaned.replace(/<div\b[^>]*class=["'][^"']*auto-toc-box[^"']*["'][\s\S]*?<\/ul>\s*<\/div>/gi, '');

  // 3. Remove ez-toc section marker spans inside headings
  cleaned = cleaned.replace(/<span\b[^>]*class=["'][^"']*ez-toc-section[^"']*["'][^>]*><\/span>/gi, '');
  cleaned = cleaned.replace(/<span\b[^>]*class=["'][^"']*ez-toc-section-end[^"']*["'][^>]*><\/span>/gi, '');

  // 4. Remove empty paragraph tags that were left over around TOC
  cleaned = cleaned.replace(/<p>\s*<\/p>/gi, '');

  return cleaned.trim();
}

/**
 * Extracts h2 and h3 headings to generate dynamic Table of Contents items.
 */
export function extractTocFromHtml(html: string | undefined | null): TocItem[] {
  if (!html || typeof html !== 'string') return [];
  const items: TocItem[] = [];
  const headingRegex = /<h([23])\b[^>]*>([\s\S]*?)<\/h\1>/gi;
  let match;
  let index = 0;

  while ((match = headingRegex.exec(html)) !== null) {
    const level = parseInt(match[1], 10);
    const rawText = match[2].replace(/<[^>]*>/g, '').trim();
    if (!rawText) continue;

    const slugId = rawText
      .toLowerCase()
      .replace(/[^a-z0-9\u0900-\u097F]+/g, '-')
      .replace(/^-+|-+$/g, '') || `section-${index}`;

    items.push({
      id: `toc-${index}-${slugId}`,
      text: rawText,
      level
    });
    index++;
  }

  return items;
}

/**
 * Injects matching ID and scroll offset classes onto h2 and h3 headings in the HTML content.
 */
export function injectHeadingIdsForToc(html: string | undefined | null): string {
  if (!html || typeof html !== 'string') return '';
  let headingIdx = 0;
  return html.replace(/<h([23])\b([^>]*)>([\s\S]*?)<\/h\1>/gi, (match, tag, attrs, inner) => {
    const text = inner.replace(/<[^>]*>/g, '').trim();
    const slugId = text
      .toLowerCase()
      .replace(/[^a-z0-9\u0900-\u097F]+/g, '-')
      .replace(/^-+|-+$/g, '') || `section-${headingIdx}`;
    const id = `toc-${headingIdx}-${slugId}`;
    headingIdx++;

    let cleanAttrs = attrs.replace(/\bid=["'][^"']*["']/i, '');
    if (/class=["']([^"']*)["']/i.test(cleanAttrs)) {
      cleanAttrs = cleanAttrs.replace(/class=["']([^"']*)["']/i, 'class="$1 scroll-mt-24"');
    } else {
      cleanAttrs = ` class="scroll-mt-24" ${cleanAttrs}`;
    }

    return `<h${tag} id="${id}" ${cleanAttrs}>${inner}</h${tag}>`;
  });
}

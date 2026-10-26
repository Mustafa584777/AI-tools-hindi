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


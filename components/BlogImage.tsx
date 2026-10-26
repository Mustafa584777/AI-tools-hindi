'use client';

import { useState } from 'react';
import Image from 'next/image';
import { resolveDisplayImageUrl } from '@/lib/utils';

interface BlogImageProps {
  src: string | undefined | null;
  alt: string;
  fill?: boolean;
  width?: number;
  height?: number;
  className?: string;
  sizes?: string;
  priority?: boolean;
  fallbackSrc?: string;
}

export default function BlogImage({
  src,
  alt,
  fill = false,
  width,
  height,
  className = '',
  sizes,
  priority = false,
  fallbackSrc = 'https://picsum.photos/seed/articledefault/800/450',
}: BlogImageProps) {
  const resolved = resolveDisplayImageUrl(src);
  const [overrideSrc, setOverrideSrc] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  const currentSrc = overrideSrc || resolved;
  const isDataUrl = currentSrc.startsWith('data:') || currentSrc.startsWith('blob:');

  const handleError = () => {
    if (retryCount === 0) {
      setRetryCount(1);
      // If local /wp-content/... failed, try remote https://aitoolhindi.online/wp-content/...
      if (currentSrc.startsWith('/wp-content/')) {
        setOverrideSrc(`https://aitoolhindi.online${currentSrc}`);
        return;
      }
      // If remote aitoolhindi.online failed, try local
      if (currentSrc.includes('aitoolhindi.online/wp-content/')) {
        const local = currentSrc.replace(/^https?:\/\/[^/]+(\/wp-content\/.+)$/, '$1');
        if (local !== currentSrc) {
          setOverrideSrc(local);
          return;
        }
      }
    }

    // Otherwise fallback to safe placeholder
    if (currentSrc !== fallbackSrc) {
      setOverrideSrc(fallbackSrc);
    }
  };

  return (
    <Image
      src={currentSrc}
      alt={alt || 'AI tutorial thumbnail'}
      fill={fill}
      width={!fill ? width : undefined}
      height={!fill ? height : undefined}
      className={className}
      sizes={sizes}
      priority={priority}
      unoptimized={isDataUrl}
      referrerPolicy="no-referrer"
      onError={handleError}
    />
  );
}

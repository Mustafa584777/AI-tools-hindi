'use client';

import { useMemo, useRef, useEffect } from 'react';
import { stripTableOfContents, injectHeadingIdsForToc, extractTocFromHtml } from '@/lib/utils';
import TableOfContents from '@/components/TableOfContents';

function getProcessedContent(html: string): string {
  if (!html) return '';

  // 1. Strip any hardcoded TOC elements from legacy or WordPress content
  let cleaned = stripTableOfContents(html);

  // 2. Ensure all aitoolhindi.online wp-content images and videos resolve to local static path
  cleaned = cleaned.replace(/https?:\/\/(?:www\.)?aitoolhindi\.online(\/wp-content\/[^\s"'>]+)/gi, '$1');

  // 3. Inject matching heading IDs with scroll offset for smooth Table of Contents navigation
  cleaned = injectHeadingIdsForToc(cleaned);

  return cleaned;
}

export default function ArticleContent({ content }: { content: string }) {
  const containerRef = useRef<HTMLDivElement>(null);

  const tocItems = useMemo(() => extractTocFromHtml(content), [content]);

  const { firstPart, secondPart } = useMemo(() => {
    const html = getProcessedContent(content);
    if (!html) return { firstPart: '', secondPart: '' };

    const pCloseRegex = /<\/p>/gi;
    let match;
    let pCount = 0;
    let splitIndex = -1;

    while ((match = pCloseRegex.exec(html)) !== null) {
      pCount++;
      if (pCount === 3) {
        splitIndex = pCloseRegex.lastIndex;
        break;
      }
    }

    if (splitIndex !== -1) {
      return {
        firstPart: html.substring(0, splitIndex),
        secondPart: html.substring(splitIndex),
      };
    }

    // Fallback if fewer than 3 paragraphs
    pCloseRegex.lastIndex = 0;
    let lastPIndex = -1;
    while ((match = pCloseRegex.exec(html)) !== null) {
      lastPIndex = pCloseRegex.lastIndex;
    }

    if (lastPIndex !== -1) {
      return {
        firstPart: html.substring(0, lastPIndex),
        secondPart: html.substring(lastPIndex),
      };
    }

    return { firstPart: html, secondPart: '' };
  }, [content]);

  const processedContentForEffect = useMemo(() => {
    return firstPart + (secondPart ? '\n' + secondPart : '');
  }, [firstPart, secondPart]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const embeds = container.querySelectorAll('.lite-youtube-embed');
    const handlers: { el: Element; handler: () => void }[] = [];

    embeds.forEach((embed) => {
      const videoId = embed.getAttribute('data-video-id');
      if (!videoId) return;

      const handler = () => {
        const iframe = document.createElement('iframe');
        iframe.setAttribute('src', `https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1`);
        iframe.setAttribute('title', 'YouTube video player');
        iframe.setAttribute('frameborder', '0');
        iframe.setAttribute('allow', 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share');
        iframe.setAttribute('allowfullscreen', 'true');
        iframe.className = 'w-full h-full absolute inset-0';
        embed.innerHTML = '';
        embed.appendChild(iframe);
      };

      embed.addEventListener('click', handler);
      handlers.push({ el: embed, handler });
    });

    const mediaVideoContainers = container.querySelectorAll('[data-media-video-id]');
    mediaVideoContainers.forEach(async (el) => {
      const mediaId = el.getAttribute('data-media-video-id');
      if (!mediaId) return;

      const videoEl = el.tagName === 'VIDEO' ? (el as HTMLVideoElement) : el.querySelector('video');
      const sourceEl = el.querySelector('source');
      const currentSrc = sourceEl?.getAttribute('src') || videoEl?.getAttribute('src');

      if (!currentSrc || !currentSrc.startsWith('data:video/')) {
        try {
          const { fetchMediaVideoFromFirestore } = await import('@/lib/storage');
          const base64 = await fetchMediaVideoFromFirestore(mediaId);
          if (base64) {
            if (sourceEl) {
              sourceEl.setAttribute('src', base64);
            } else if (videoEl) {
              videoEl.setAttribute('src', base64);
            }
            if (videoEl) {
              videoEl.load();
            }
          }
        } catch (e) {
          console.warn('Failed to load video chunk from Firestore:', mediaId, e);
        }
      }
    });

    const allImages = container.querySelectorAll('img');
    allImages.forEach((imgEl) => {
      imgEl.setAttribute('referrerpolicy', 'no-referrer');
      imgEl.classList.add('max-w-full', 'w-full', 'h-auto', 'object-cover', 'rounded-xl', 'my-4', 'mx-auto');
      imgEl.style.maxWidth = '100%';
      imgEl.style.height = 'auto';

      let attempts = 0;
      imgEl.onerror = () => {
        attempts++;
        const currentSrc = imgEl.getAttribute('src') || '';

        imgEl.removeAttribute('srcset');
        imgEl.removeAttribute('sizes');

        if (attempts === 1) {
          if (currentSrc.startsWith('/wp-content/')) {
            imgEl.src = `https://aitoolhindi.online${currentSrc}`;
            return;
          }
          if (currentSrc.includes('aitoolhindi.online/wp-content/')) {
            const localSrc = currentSrc.replace(/^https?:\/\/[^/]+(\/wp-content\/.+)$/, '$1');
            if (localSrc !== currentSrc) {
              imgEl.src = localSrc;
              return;
            }
          }
        }

        if (attempts === 2 && currentSrc.startsWith('http')) {
          fetch(`/api/fetch-image?url=${encodeURIComponent(currentSrc)}`)
            .then(res => res.json())
            .then(data => {
              if (data.dataUrl) {
                imgEl.src = data.dataUrl;
              } else {
                imgEl.src = `https://picsum.photos/seed/${encodeURIComponent(imgEl.alt || 'aitoolhindi')}/800/450`;
              }
            })
            .catch(() => {
              imgEl.src = `https://picsum.photos/seed/${encodeURIComponent(imgEl.alt || 'aitoolhindi')}/800/450`;
            });
          return;
        }

        if (!imgEl.src.includes('picsum.photos')) {
          imgEl.src = `https://picsum.photos/seed/${encodeURIComponent(imgEl.alt || 'aitoolhindi')}/800/450`;
          imgEl.classList.add('opacity-90');
        }
      };
    });

    const iframes = container.querySelectorAll('iframe');
    iframes.forEach((iframe) => {
      iframe.style.maxWidth = '100%';
      iframe.removeAttribute('width');
      iframe.classList.add('w-full', 'max-w-full', 'aspect-video', 'rounded-xl');
      const parent = iframe.parentElement;
      if (parent && (parent.classList.contains('wp-block-embed__wrapper') || parent.tagName === 'FIGURE')) {
        parent.style.maxWidth = '100%';
        parent.style.overflow = 'hidden';
      }
    });

    const tables = container.querySelectorAll('table');
    tables.forEach((table) => {
      if (!table.parentElement?.classList.contains('table-responsive-wrapper')) {
        const wrapper = document.createElement('div');
        wrapper.className = 'table-responsive-wrapper w-full max-w-full overflow-x-auto my-6 border border-slate-200 rounded-xl shadow-sm';
        table.parentNode?.insertBefore(wrapper, table);
        wrapper.appendChild(table);
      }
    });

    const pres = container.querySelectorAll('pre');
    pres.forEach((pre) => {
      pre.classList.add('max-w-full', 'overflow-x-auto', 'whitespace-pre-wrap', 'break-words');
    });

    const mediaImages = container.querySelectorAll('img[data-media-image-id]');
    mediaImages.forEach(async (imgEl) => {
      const mediaId = imgEl.getAttribute('data-media-image-id');
      if (!mediaId) return;
      const currentSrc = imgEl.getAttribute('src');
      if (!currentSrc || !currentSrc.startsWith('data:image/')) {
        try {
          const { fetchMediaImageFromFirestore } = await import('@/lib/storage');
          const base64 = await fetchMediaImageFromFirestore(mediaId);
          if (base64) {
            imgEl.setAttribute('src', base64);
          }
        } catch (e) {
          console.warn('Failed to load image chunk from Firestore:', mediaId, e);
        }
      }
    });

    return () => {
      handlers.forEach(({ el, handler }) => {
        el.removeEventListener('click', handler);
      });
    };
  }, [processedContentForEffect]);

  return (
    <div 
      ref={containerRef}
      className="prose prose-slate max-w-none text-black leading-relaxed space-y-4 text-base md:text-lg font-medium w-full max-w-full break-words [overflow-wrap:anywhere] overflow-hidden [&_p]:mb-[15px] [&>h1]:text-2xl [&>h1]:md:text-3xl [&>h1]:font-extrabold [&>h1]:text-black [&>h1]:pt-4 [&>h2]:text-xl [&>h2]:md:text-2xl [&>h2]:font-bold [&>h2]:text-black [&>h2]:pt-3 [&>h3]:text-lg [&>h3]:font-bold [&>h3]:text-black [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:space-y-2 [&_ul]:my-4 [&_ol]:list-decimal [&_ol]:pl-6 [&_ol]:space-y-2 [&_ol]:my-4 [&_li]:my-1 [&>blockquote]:border-l-4 [&>blockquote]:border-orange-600 [&>blockquote]:pl-4 [&>blockquote]:italic [&>blockquote]:text-black [&>blockquote]:my-4 [&>blockquote]:bg-orange-50/50 [&>blockquote]:py-3 [&>blockquote]:rounded-r-xl"
    >
      <div dangerouslySetInnerHTML={{ __html: firstPart }} />
      <TableOfContents items={tocItems} />
      {secondPart && <div dangerouslySetInnerHTML={{ __html: secondPart }} />}
    </div>
  );
}

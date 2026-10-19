'use client';

import { useMemo, useRef, useEffect } from 'react';
import { fetchMediaVideoFromFirestore, fetchMediaImageFromFirestore } from '@/lib/storage';

function getProcessedContentWithTOC(html: string) {
  if (typeof window === 'undefined') return html;

  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');

  // Find h2 and h3 headings for Table of Contents without modifying the author's tags
  const headings = Array.from(doc.querySelectorAll('h2, h3'));
  if (headings.length === 0) return doc.body.innerHTML;

  const tocHeadings: { id: string; text: string; tag: string }[] = [];
  headings.forEach((h, idx) => {
    const id = `toc-heading-${idx}-${h.textContent?.toLowerCase().replace(/[^a-z0-9]+/g, '-') || idx}`;
    h.id = id;
    tocHeadings.push({ id, text: h.textContent || '', tag: h.tagName.toLowerCase() });
  });

  if (doc.querySelector('.auto-toc-box')) return doc.body.innerHTML;

  const paragraphs = Array.from(doc.querySelectorAll('p'));
  const tocHtml = `
    <div class="auto-toc-box my-8 p-6 bg-orange-50/70 border border-orange-200 rounded-2xl shadow-sm space-y-3">
      <div class="flex items-center gap-2 font-extrabold text-black text-base">
        <svg class="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h7"/></svg>
        <span>Table of Contents (विषय सूची)</span>
      </div>
      <ul class="space-y-1.5 pl-5 list-disc text-sm font-bold text-orange-600">
        ${tocHeadings.map(h => `<li class="${h.tag === 'h3' ? 'ml-4' : ''}"><a href="#${h.id}" class="no-underline hover:text-orange-800 text-orange-600">${h.text}</a></li>`).join('')}
      </ul>
    </div>
  `;

  if (paragraphs.length >= 3) {
    const thirdP = paragraphs[2];
    const tempContainer = doc.createElement('div');
    tempContainer.innerHTML = tocHtml;
    thirdP.after(tempContainer.firstElementChild!);
  } else if (doc.body.firstChild) {
    const tempContainer = doc.createElement('div');
    tempContainer.innerHTML = tocHtml;
    doc.body.insertBefore(tempContainer.firstElementChild!, doc.body.firstChild);
  }

  return doc.body.innerHTML;
}

export default function ArticleContent({ content }: { content: string }) {
  const containerRef = useRef<HTMLDivElement>(null);

  const processedContent = useMemo(() => {
    return getProcessedContentWithTOC(content);
  }, [content]);

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

    const mediaImages = container.querySelectorAll('img[data-media-image-id]');
    mediaImages.forEach(async (imgEl) => {
      const mediaId = imgEl.getAttribute('data-media-image-id');
      if (!mediaId) return;
      const currentSrc = imgEl.getAttribute('src');
      if (!currentSrc || !currentSrc.startsWith('data:image/')) {
        try {
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
  }, [processedContent]);

  return (
    <div 
      ref={containerRef}
      className="prose prose-slate max-w-none text-black leading-relaxed space-y-4 text-base md:text-lg font-medium [&>h1]:text-2xl [&>h1]:md:text-3xl [&>h1]:font-extrabold [&>h1]:text-black [&>h1]:pt-4 [&>h2]:text-xl [&>h2]:md:text-2xl [&>h2]:font-bold [&>h2]:text-black [&>h2]:pt-3 [&>h3]:text-lg [&>h3]:font-bold [&>h3]:text-black [&>ul]:list-disc [&>ul]:ml-6 [&>ol]:list-decimal [&>ol]:ml-6 [&>blockquote]:border-l-4 [&>blockquote]:border-orange-600 [&>blockquote]:pl-4 [&>blockquote]:italic [&>blockquote]:text-black [&>blockquote]:my-4 [&>blockquote]:bg-orange-50/50 [&>blockquote]:py-3 [&>blockquote]:rounded-r-xl"
      dangerouslySetInnerHTML={{ __html: processedContent }}
    />
  );
}

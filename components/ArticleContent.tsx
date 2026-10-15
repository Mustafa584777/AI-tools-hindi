'use client';

import { useMemo } from 'react';

function getProcessedContentWithTOC(html: string) {
  if (typeof window === 'undefined') return html;

  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');

  const h2s = Array.from(doc.querySelectorAll('h2'));
  if (h2s.length === 0) return html;

  const headings: { id: string; text: string }[] = [];
  h2s.forEach((h2, idx) => {
    const id = `toc-heading-${idx}-${h2.textContent?.toLowerCase().replace(/[^a-z0-9]+/g, '-') || idx}`;
    h2.id = id;
    headings.push({ id, text: h2.textContent || '' });
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
        ${headings.map(h => `<li><a href="#${h.id}" class="no-underline hover:text-orange-800 text-orange-600">${h.text}</a></li>`).join('')}
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
  const processedContent = useMemo(() => {
    return getProcessedContentWithTOC(content);
  }, [content]);

  return (
    <div 
      className="prose prose-slate max-w-none text-black leading-relaxed space-y-4 text-base md:text-lg font-medium [&>h1]:text-2xl [&>h1]:md:text-3xl [&>h1]:font-extrabold [&>h1]:text-black [&>h1]:pt-4 [&>h2]:text-xl [&>h2]:md:text-2xl [&>h2]:font-bold [&>h2]:text-black [&>h2]:pt-3 [&>h3]:text-lg [&>h3]:font-bold [&>h3]:text-black [&>ul]:list-disc [&>ul]:ml-6 [&>ol]:list-decimal [&>ol]:ml-6 [&>blockquote]:border-l-4 [&>blockquote]:border-orange-600 [&>blockquote]:pl-4 [&>blockquote]:italic [&>blockquote]:text-black [&>blockquote]:my-4 [&>blockquote]:bg-orange-50/50 [&>blockquote]:py-3 [&>blockquote]:rounded-r-xl"
      dangerouslySetInnerHTML={{ __html: processedContent }}
    />
  );
}

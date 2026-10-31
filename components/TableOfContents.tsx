'use client';

import { TocItem } from '@/lib/utils';

export default function TableOfContents({ items }: { items: TocItem[] }) {
  if (!items || items.length < 2) return null;

  const scrollToHeading = (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      if (typeof window !== 'undefined' && window.history?.pushState) {
        window.history.pushState(null, '', `#${id}`);
      }
    }
  };

  return (
    <div className="my-6 sm:my-8 bg-orange-50/70 border border-orange-200/90 rounded-2xl p-4 sm:p-6 shadow-xs transition-all">
      <nav aria-label="Table of Contents">
        <ul className="space-y-2 list-none p-0 m-0">
          {items.map((item) => {
            const isH3 = item.level === 3;
            return (
              <li
                key={item.id}
                className={`${isH3 ? 'ml-4 sm:ml-6 text-xs sm:text-sm' : 'text-sm sm:text-base font-semibold'}`}
              >
                <a
                  href={`#${item.id}`}
                  onClick={(e) => scrollToHeading(item.id, e)}
                  className="text-slate-800 hover:text-orange-600 transition-colors py-0.5 no-underline"
                >
                  {item.text}
                </a>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
}

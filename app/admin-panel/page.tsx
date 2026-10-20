'use client';
/* eslint-disable react-hooks/immutability */

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { 
  Plus, Edit, Trash2, Database, CheckCircle, ExternalLink, Sparkles, FileText, ArrowLeft, 
  Image as ImageIcon, Link as LinkIcon, Bold, Italic, Heading1, Heading2, Heading3, Code, 
  Wand2, Upload, X, RefreshCw, Eye, Code2, HelpCircle, Bot, AlertTriangle, TrendingUp, 
  Award, Folder, List, Table, Undo, Redo, Settings, Loader2, Download, Copy, Check, 
  Video, Search, AlertCircle 
} from 'lucide-react';
import { 
  fetchBlogPostsFromFirestore, 
  saveBlogPostToFirestore, 
  deleteBlogPostFromFirestore,
  getStoredBlogPostsSync,
  clearClientCache,
  restoreBackupPosts,
  saveMediaVideoToFirestore,
  fetchMediaVideoFromFirestore,
  saveMediaImageToFirestore,
  fetchMediaImageFromFirestore,
  compressImageBase64
} from '@/lib/storage';
import { BlogPost } from '@/lib/types';

export interface UnmigratedMediaItem {
  id: string;
  articleId: string;
  articleTitle: string;
  articleSlug: string;
  mediaType: 'featured' | 'image' | 'video';
  wpUrl: string;
  reason?: string;
  failed?: boolean;
}

interface ArticleImage {
  id: string;
  base64: string;
  alt: string;
  slug: string;
}

interface FAQItem {
  question: string;
  answer: string;
}

interface AIAnalysis {
  seoScore: number;
  eeatScore: number;
  rankingChances: string;
  mistakes: string[];
  competitorComparison: string;
}

const CATEGORIES_KEY = 'aitoolhindi_categories_v1';

export default function AdminPanelPage() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'tutorials' | 'categories' | 'unmigrated'>('tutorials');
  const [tutorialSubTab, setTutorialSubTab] = useState<'published' | 'draft'>('published');
  const [isMigratingImages, setIsMigratingImages] = useState(false);
  const [migrationProgress, setMigrationProgress] = useState<{ current: number; total: number; text: string }>({ current: 0, total: 0, text: '' });
  const [failedMigrationImages, setFailedMigrationImages] = useState<{ articleTitle: string; articleSlug: string; imageUrl: string }[]>([]);
  
  // Unmigrated / Pending WordPress Media State
  const [unmigratedMedia, setUnmigratedMedia] = useState<UnmigratedMediaItem[]>([]);
  const [mediaSearchQuery, setMediaSearchQuery] = useState('');
  const [mediaTypeFilter, setMediaTypeFilter] = useState<'all' | 'image' | 'video' | 'featured'>('all');
  const [copiedUrlId, setCopiedUrlId] = useState<string | null>(null);
  const [migratingSingleId, setMigratingSingleId] = useState<string | null>(null);
  const [isScanningMedia, setIsScanningMedia] = useState(false);

  // Categories list state
  const [customCategories, setCustomCategories] = useState<string[]>(['AI Guides', 'Image Tutorials', 'Video Tutorials', 'ChatGPT Guides']);
  const [newCatInput, setNewCatInput] = useState('');

  // Full-page Editor View State for Blog (Author removed per user request)
  const [isEditingBlog, setIsEditingBlog] = useState(false);
  const [editingBlogId, setEditingBlogId] = useState<string | null>(null);
  const [blogTitle, setBlogTitle] = useState('');
  const [blogSlug, setBlogSlug] = useState('');
  const [isSlugManual, setIsSlugManual] = useState(false);
  const [blogExcerpt, setBlogExcerpt] = useState('');
  const [blogMetaDescription, setBlogMetaDescription] = useState('');
  const [blogContent, setBlogContent] = useState('');
  const [blogCategory, setBlogCategory] = useState('AI Guides');
  const [isNewCategoryMode, setIsNewCategoryMode] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [blogImage, setBlogImage] = useState('https://picsum.photos/seed/blogdefault/800/450');
  const [blogImageAlt, setBlogImageAlt] = useState('');
  const [blogImageSlug, setBlogImageSlug] = useState('');
  const [blogStatus, setBlogStatus] = useState<'published' | 'draft'>('published');
  const [blogNoIndex, setBlogNoIndex] = useState(false);

  // Post Settings Toggle State
  const [showPostSettings, setShowPostSettings] = useState(true);

  // Editor Mode: Visual vs HTML Code Mode
  const [editorMode, setEditorMode] = useState<'visual' | 'html'>('visual');
  const selectedBlockElementRef = useRef<HTMLElement | null>(null);

  // Active formatting state for toolbar highlights
  const [activeBold, setActiveBold] = useState(false);
  const [activeItalic, setActiveItalic] = useState(false);
  const [activeLink, setActiveLink] = useState(false);
  const [activeBlockType, setActiveBlockType] = useState('P');

  // Article Media Library
  const [articleImages, setArticleImages] = useState<ArticleImage[]>([]);

  // FAQ Builder State
  const [faqs, setFaqs] = useState<FAQItem[]>([]);
  const [newFaqQ, setNewFaqQ] = useState('');
  const [newFaqA, setNewFaqA] = useState('');

  // AI Supervisor State
  const [aiKeyword, setAiKeyword] = useState('');
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);
  const [isAnalyzingAi, setIsAnalyzingAi] = useState(false);
  const [isOptimizingAi, setIsOptimizingAi] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AIAnalysis | null>(null);

  // WordPress Code Importer State
  const [wpRawCode, setWpRawCode] = useState('');
  const [showWpImporter, setShowWpImporter] = useState(false);

  const visualContentRef = useRef<HTMLDivElement>(null);
  const savedRangeRef = useRef<Range | null>(null);
  const contentImageInputRef = useRef<HTMLInputElement>(null);
  const contentVideoInputRef = useRef<HTMLInputElement>(null);
  const featuredImageInputRef = useRef<HTMLInputElement>(null);
  const restoreFileInputRef = useRef<HTMLInputElement>(null);

  const [isSavingPost, setIsSavingPost] = useState(false);
  const [showImageModal, setShowImageModal] = useState(false);
  const [selectedImageEl, setSelectedImageEl] = useState<HTMLImageElement | null>(null);
  const [showVideoModal, setShowVideoModal] = useState(false);
  const [selectedVideoEl, setSelectedVideoEl] = useState<HTMLElement | null>(null);
  const [editVideoSlug, setEditVideoSlug] = useState('');
  const [editVideoTitle, setEditVideoTitle] = useState('');
  const [editVideoMediaId, setEditVideoMediaId] = useState('');
  const [editVideoSrc, setEditVideoSrc] = useState('');
  const [isUploadingReplacementVideo, setIsUploadingReplacementVideo] = useState(false);
  const [replaceVideoUrlInput, setReplaceVideoUrlInput] = useState('');
  const replaceVideoInputRef = useRef<HTMLInputElement>(null);
  const replaceImageInputRef = useRef<HTMLInputElement>(null);
  const [isReplacingImage, setIsReplacingImage] = useState(false);
  const [editImageAlt, setEditImageAlt] = useState('');
  const [editImageSlug, setEditImageSlug] = useState('');
  const [showEditLinkModal, setShowEditLinkModal] = useState(false);
  const [selectedLinkEl, setSelectedLinkEl] = useState<HTMLAnchorElement | null>(null);
  const [editLinkUrl, setEditLinkUrl] = useState('');
  const [editLinkText, setEditLinkText] = useState('');

  // Link Addition Popup Modal State
  const [showLinkAddModal, setShowLinkAddModal] = useState(false);
  const [linkModalUrl, setLinkModalUrl] = useState('https://');
  const [linkModalText, setLinkModalText] = useState('');

  const [notification, setNotification] = useState<string | null>(null);

  const scanAllArticlesForExternalMedia = (currentPosts: BlogPost[]): UnmigratedMediaItem[] => {
    const items: UnmigratedMediaItem[] = [];

    currentPosts.forEach(post => {
      // 1. Featured image check
      if (post.image && post.image.startsWith('http') && !post.image.startsWith('data:') && !post.image.includes('picsum.photos')) {
        items.push({
          id: `unmig-feat-${post.id}`,
          articleId: post.id,
          articleTitle: post.title,
          articleSlug: post.slug,
          mediaType: 'featured',
          wpUrl: post.image,
          reason: 'Featured banner image still points to external WordPress URL'
        });
      }

      // 2. In-content check
      if (post.content && (post.content.includes('<img') || post.content.includes('<video') || post.content.includes('<source'))) {
        try {
          const parser = new DOMParser();
          const doc = parser.parseFromString(post.content, 'text/html');

          // Check Images
          const imgs = Array.from(doc.querySelectorAll('img'));
          imgs.forEach((img, idx) => {
            let src = img.getAttribute('src') || '';
            if (src.startsWith('//')) src = 'https:' + src;
            if (src && src.startsWith('http') && !src.startsWith('data:') && !src.includes('picsum.photos')) {
              items.push({
                id: `unmig-img-${post.id}-${idx}`,
                articleId: post.id,
                articleTitle: post.title,
                articleSlug: post.slug,
                mediaType: 'image',
                wpUrl: src,
                reason: img.getAttribute('alt') ? `Alt: "${img.getAttribute('alt')}"` : 'In-content image on external WordPress URL'
              });
            }
          });

          // Check Videos & Sources
          const sources = Array.from(doc.querySelectorAll('video, source'));
          sources.forEach((el, idx) => {
            let src = el.getAttribute('src') || '';
            if (src.startsWith('//')) src = 'https:' + src;
            const wrapper = el.closest('div.my-6') || el.parentElement;
            const mediaId = wrapper?.getAttribute('data-media-video-id') || el.getAttribute('data-media-video-id');

            if (src && src.startsWith('http') && !src.startsWith('data:') && !mediaId) {
              items.push({
                id: `unmig-vid-${post.id}-${idx}`,
                articleId: post.id,
                articleTitle: post.title,
                articleSlug: post.slug,
                mediaType: 'video',
                wpUrl: src,
                reason: 'MP4 Video on external WordPress URL'
              });
            }
          });
        } catch (e) {
          console.warn('DOMParser error scanning post:', post.slug, e);
        }
      }
    });

    return items;
  };

  const loadData = async (force = false) => {
    setLoading(true);
    try {
      const data = await fetchBlogPostsFromFirestore(force);
      setPosts(data);
      const scanned = scanAllArticlesForExternalMedia(data);
      setUnmigratedMedia(scanned);

      if (typeof window !== 'undefined') {
        const storedCats = localStorage.getItem(CATEGORIES_KEY);
        const derivedCats = Array.from(new Set(data.map(p => p.category).filter(Boolean)));
        if (storedCats) {
          const parsed = JSON.parse(storedCats);
          setCustomCategories(Array.from(new Set([...parsed, ...derivedCats])));
        } else {
          setCustomCategories(Array.from(new Set(['AI Guides', 'Image Tutorials', 'Video Tutorials', ...derivedCats])));
        }
      }
    } catch {
      const fallback = getStoredBlogPostsSync();
      setPosts(fallback);
      setUnmigratedMedia(scanAllArticlesForExternalMedia(fallback));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadData();
  }, []);

  const hydrateEditorVideos = async (container: HTMLElement) => {
    if (!container) return;
    const videoContainers = Array.from(container.querySelectorAll('video, [data-media-video-id], .wp-block-video'));
    for (const rawEl of videoContainers) {
      const el = (rawEl.tagName === 'VIDEO' ? (rawEl.closest('div.my-6') || rawEl.parentElement || rawEl) : rawEl) as HTMLElement;
      if (el === container) continue;

      const mediaId = el.getAttribute('data-media-video-id') || 
                      el.querySelector('video')?.getAttribute('data-media-video-id') || 
                      el.querySelector('source')?.getAttribute('data-media-id');

      el.classList.add('relative', 'group');

      if (!el.querySelector('.video-overlay-helper')) {
        const helper = document.createElement('div');
        helper.className = 'video-overlay-helper absolute top-3 right-3 z-10 pointer-events-auto bg-black/85 hover:bg-orange-600 text-white text-xs font-bold px-3 py-1.5 rounded-xl cursor-pointer shadow-lg flex items-center gap-1.5 transition-all';
        helper.innerHTML = `
          <svg class="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24"><path d="M17 10.5V7c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.55 0 1-.45 1-1v-3.5l4 4v-11l-4 4z"/></svg>
          <span>Edit MP4 (Replace / Slug / Delete)</span>
        `;
        el.prepend(helper);
      }

      if (mediaId) {
        const videoEl = el.tagName === 'VIDEO' ? (el as HTMLVideoElement) : el.querySelector('video');
        const sourceEl = el.querySelector('source');
        const currentSrc = sourceEl?.getAttribute('src') || videoEl?.getAttribute('src');

        if (!currentSrc || !currentSrc.startsWith('data:video/')) {
          try {
            const base64 = await fetchMediaVideoFromFirestore(mediaId);
            if (base64) {
              if (sourceEl) sourceEl.setAttribute('src', base64);
              else if (videoEl) videoEl.setAttribute('src', base64);
              if (videoEl) videoEl.load();
            }
          } catch (e) {
            console.warn('Hydration error for video:', mediaId, e);
          }
        }
      }
    }
  };

  const openVideoModal = async (container: HTMLElement) => {
    setSelectedVideoEl(container);

    const videoEl = container.tagName === 'VIDEO' ? (container as HTMLVideoElement) : container.querySelector('video');
    const sourceEl = container.querySelector('source');

    const mediaId = container.getAttribute('data-media-video-id') || 
                    videoEl?.getAttribute('data-media-video-id') || 
                    sourceEl?.getAttribute('data-media-id') || '';

    const existingSlug = container.getAttribute('data-video-slug') || 
                         videoEl?.getAttribute('data-video-slug') || 
                         videoEl?.getAttribute('title') || 
                         container.getAttribute('title') || '';

    const existingTitle = videoEl?.getAttribute('title') || 
                          container.getAttribute('data-video-title') || '';

    const currentSrc = sourceEl?.getAttribute('src') || videoEl?.getAttribute('src') || '';

    setEditVideoMediaId(mediaId);
    setEditVideoSlug(existingSlug || 'tutorial-video-clip');
    setEditVideoTitle(existingTitle);
    setReplaceVideoUrlInput('');
    setShowVideoModal(true);

    if ((!currentSrc || !currentSrc.startsWith('data:video/')) && mediaId) {
      setEditVideoSrc('');
      try {
        const base64 = await fetchMediaVideoFromFirestore(mediaId);
        if (base64) {
          setEditVideoSrc(base64);
        } else if (currentSrc) {
          setEditVideoSrc(currentSrc);
        }
      } catch (err) {
        console.warn('Error fetching video preview:', err);
        if (currentSrc) setEditVideoSrc(currentSrc);
      }
    } else {
      setEditVideoSrc(currentSrc);
    }
  };

  const hydrateEditorImages = async (container: HTMLElement) => {
    if (!container) return;
    const images = Array.from(container.querySelectorAll('img[data-media-image-id]'));
    for (const imgEl of images) {
      const mediaId = imgEl.getAttribute('data-media-image-id');
      if (!mediaId) continue;
      const currentSrc = imgEl.getAttribute('src');
      if (!currentSrc || !currentSrc.startsWith('data:image/')) {
        try {
          const base64 = await fetchMediaImageFromFirestore(mediaId);
          if (base64) {
            imgEl.setAttribute('src', base64);
          }
        } catch (e) {
          console.warn('Hydration error for image:', mediaId, e);
        }
      }
    }
  };

  useEffect(() => {
    if (editorMode === 'visual' && visualContentRef.current) {
      if (visualContentRef.current.innerHTML !== blogContent) {
        visualContentRef.current.innerHTML = blogContent;
      }
      hydrateEditorVideos(visualContentRef.current);
      hydrateEditorImages(visualContentRef.current);
    }
  }, [blogContent, editorMode, isEditingBlog]);

  const updateActiveStates = (el?: HTMLElement | null) => {
    const targetEl = el || selectedBlockElementRef.current;
    if (targetEl) {
      setActiveBold(targetEl.innerHTML.includes('<strong>') || targetEl.innerHTML.includes('<b>') || !!targetEl.querySelector('strong, b'));
      setActiveItalic(targetEl.innerHTML.includes('<em>') || targetEl.innerHTML.includes('<i>') || !!targetEl.querySelector('em, i'));
      setActiveLink(targetEl.innerHTML.includes('<a ') || !!targetEl.querySelector('a'));
      setActiveBlockType(targetEl.tagName.toUpperCase());
    }
  };

  const showNotify = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3500);
  };

  const handleClearCacheAndRefresh = () => {
    clearClientCache();
    loadData(true);
    showNotify('24-hour cache cleared successfully! Fetched fresh data from Firebase.');
  };

  const handleAddGlobalCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatInput.trim()) return;
    const trimmed = newCatInput.trim();
    if (!customCategories.includes(trimmed)) {
      const updated = [...customCategories, trimmed];
      setCustomCategories(updated);
      if (typeof window !== 'undefined') {
        localStorage.setItem(CATEGORIES_KEY, JSON.stringify(updated));
      }
      showNotify(`Category "${trimmed}" added successfully!`);
    }
    setNewCatInput('');
  };

  const handleDeleteGlobalCategory = (catName: string) => {
    if (confirm(`Are you sure you want to delete category "${catName}"?`)) {
      const updated = customCategories.filter(c => c !== catName);
      setCustomCategories(updated);
      if (typeof window !== 'undefined') {
        localStorage.setItem(CATEGORIES_KEY, JSON.stringify(updated));
      }
      showNotify(`Category "${catName}" removed.`);
    }
  };

  const handleTitleChange = (val: string) => {
    setBlogTitle(val);
    if (!isSlugManual) {
      const generated = val.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
      setBlogSlug(generated);
    }
  };

  const applyFormatting = (command: string, value: string = '') => {
    document.execCommand(command, false, value);
    if (visualContentRef.current) {
      setBlogContent(visualContentRef.current.innerHTML);
    }
  };

  const insertHtmlAtSelection = (html: string) => {
    if (!visualContentRef.current) return;
    visualContentRef.current.focus();
    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0) {
      const range = sel.getRangeAt(0);
      if (visualContentRef.current.contains(range.commonAncestorContainer)) {
        range.deleteContents();
        const frag = range.createContextualFragment(html);
        range.insertNode(frag);
        sel.removeAllRanges();
        setBlogContent(visualContentRef.current.innerHTML);
        showNotify('Inserted successfully into visual editor!');
        return;
      }
    }
    visualContentRef.current.innerHTML += '\n' + html;
    setBlogContent(visualContentRef.current.innerHTML);
    showNotify('Inserted successfully into visual editor!');
  };

  const applyBlockFormatting = (type: 'H1' | 'H2' | 'H3' | 'P' | 'bold' | 'italic' | 'link') => {
    const sel = window.getSelection();
    const hasTextSelection = sel && sel.toString().trim().length > 0;

    if (hasTextSelection) {
      if (type === 'bold') {
        document.execCommand('bold', false, '');
        showNotify('Bold toggled on text');
      } else if (type === 'italic') {
        document.execCommand('italic', false, '');
        showNotify('Italic toggled on text');
      } else if (type === 'link') {
        const url = prompt('Enter URL (Link):', 'https://');
        if (url) {
          document.execCommand('createLink', false, url);
          showNotify('Link applied to text');
        }
      } else if (type === 'H1' || type === 'H2' || type === 'H3' || type === 'P') {
        const tag = type === 'H1' ? 'h1' : type === 'H2' ? 'h2' : type === 'H3' ? 'h3' : 'p';
        document.execCommand('formatBlock', false, tag);
        showNotify(`Format changed to ${tag.toUpperCase()}`);
      }
      if (visualContentRef.current) {
        setBlogContent(visualContentRef.current.innerHTML);
      }
      return;
    }

    let el = selectedBlockElementRef.current;

    if (!el || !visualContentRef.current?.contains(el)) {
      if (sel && sel.rangeCount > 0) {
        let node = sel.anchorNode;
        if (node && node.nodeType === Node.TEXT_NODE) node = node.parentNode;
        if (node && node instanceof HTMLElement) {
          el = node.closest('p, h1, h2, h3, blockquote, ul, li, table, tr, div') as HTMLElement;
        }
      }
    }

    if (!el || !visualContentRef.current?.contains(el) || el === visualContentRef.current) {
      el = visualContentRef.current?.querySelector('p, h1, h2, h3, li') as HTMLElement;
    }

    if (!el && visualContentRef.current) {
      const p = document.createElement('p');
      p.className = 'mb-6 text-slate-700 leading-relaxed text-lg';
      p.innerHTML = visualContentRef.current.innerHTML || 'New paragraph';
      visualContentRef.current.appendChild(p);
      el = p;
    }

    if (!el) {
      alert('कृपया एडिटर में पहले किसी भी पैराग्राफ या हेडिंग ब्लॉक पर क्लिक करें!');
      return;
    }

    if (type === 'H1' || type === 'H2' || type === 'H3' || type === 'P') {
      const tag = type === 'H1' ? 'h1' : type === 'H2' ? 'h2' : type === 'H3' ? 'h3' : 'p';
      const targetTag = el.tagName.toLowerCase() === tag.toLowerCase() ? 'p' : tag;
      const newEl = document.createElement(targetTag);
      newEl.innerHTML = el.innerHTML;
      newEl.className = targetTag === 'h1' ? 'text-3xl font-extrabold text-black mt-6 mb-4' :
                        targetTag === 'h2' ? 'text-2xl font-bold text-black mt-6 mb-3' :
                        targetTag === 'h3' ? 'text-xl font-semibold text-black mt-4 mb-2' :
                        'mb-6 text-slate-700 leading-relaxed text-lg';
      el.replaceWith(newEl);
      newEl.classList.add('ring-2', 'ring-blue-400', 'bg-blue-50/20', 'rounded-xl', 'p-2', 'editor-selected-block');
      selectedBlockElementRef.current = newEl;
      el = newEl;
      showNotify(`Block formatted to ${targetTag.toUpperCase()}`);
    } else if (type === 'bold') {
      if (el.innerHTML.includes('<strong>') || el.innerHTML.includes('<b>')) {
        el.innerHTML = el.innerHTML.replace(/<\/?(strong|b)>/gi, '');
        showNotify('Bold removed from block');
      } else {
        el.innerHTML = `<strong>${el.innerHTML}</strong>`;
        showNotify('Bold applied to block');
      }
    } else if (type === 'italic') {
      if (el.innerHTML.includes('<em>') || el.innerHTML.includes('<i>')) {
        el.innerHTML = el.innerHTML.replace(/<\/?(em|i)>/gi, '');
        showNotify('Italic removed from block');
      } else {
        el.innerHTML = `<em>${el.innerHTML}</em>`;
        showNotify('Italic applied to block');
      }
    } else if (type === 'link') {
      handleOpenLinkModal();
    }

    updateActiveStates(el);

    if (visualContentRef.current) {
      setBlogContent(visualContentRef.current.innerHTML);
    }
  };

  const insertList = () => {
    const listHtml = `<ul class="list-disc pl-6 space-y-2 mb-6 text-slate-700"><li>List item 1</li><li>List item 2</li><li>List item 3</li></ul>\n`;
    insertHtmlAtSelection(listHtml);
  };

  const insertTable = () => {
    const tableHtml = `<div class="overflow-x-auto my-6"><table class="w-full border-collapse border border-slate-300"><thead><tr class="bg-slate-100"><th class="border border-slate-300 p-3 text-left font-bold text-black">Header 1</th><th class="border border-slate-300 p-3 text-left font-bold text-black">Header 2</th></tr></thead><tbody><tr><td class="border border-slate-300 p-3 text-black">Row 1 Cell 1</td><td class="border border-slate-300 p-3 text-black">Row 1 Cell 2</td></tr><tr><td class="border border-slate-300 p-3 text-black">Row 2 Cell 1</td><td class="border border-slate-300 p-3 text-black">Row 2 Cell 2</td></tr></tbody></table></div>\n`;
    insertHtmlAtSelection(tableHtml);
  };

  const insertYouTubeEmbed = () => {
    const input = prompt('Enter YouTube Video URL or Video ID (e.g., https://www.youtube.com/watch?v=dQw4w9WgXcQ):', '');
    if (!input) return;

    let videoId = input.trim();
    if (videoId.includes('youtube.com/watch?v=')) {
      const urlParams = new URLSearchParams(videoId.split('?')[1]);
      videoId = urlParams.get('v') || videoId;
    } else if (videoId.includes('youtu.be/')) {
      const parts = videoId.split('youtu.be/');
      videoId = parts[1]?.split('?')[0] || videoId;
    }

    if (!videoId) {
      alert('Invalid YouTube URL or Video ID.');
      return;
    }

    const youtubeEmbedHtml = `
      <div class="lite-youtube-embed my-6 relative rounded-2xl overflow-hidden shadow-md bg-black aspect-video cursor-pointer group" data-video-id="${videoId}">
        <img src="https://img.youtube.com/vi/${videoId}/hqdefault.jpg" alt="YouTube video thumbnail" class="w-full h-full object-cover group-hover:opacity-90 transition-opacity" />
        <div class="absolute inset-0 flex items-center justify-center">
          <div class="w-16 h-16 bg-red-600 hover:bg-red-700 text-white rounded-full flex items-center justify-center shadow-xl group-hover:scale-110 transition-transform">
            <svg class="w-8 h-8 fill-current ml-1" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
          </div>
        </div>
        <div class="absolute bottom-3 left-3 bg-black/75 text-white text-xs px-3 py-1 rounded-lg font-bold">YouTube Video (Click to Play)</div>
      </div>
    `;

    insertHtmlAtSelection(youtubeEmbedHtml);
    showNotify('YouTube video embed inserted (Click-to-load optimized)!');
  };

  const handleContentVideoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 25 * 1024 * 1024) {
      alert('Video file size is quite large (>25MB). Please use compressed MP4 clips for web performance.');
    }

    const cleanSlug = file.name.replace(/\.[^/.]+$/, "").toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'tutorial-video';

    showNotify('Uploading and encoding MP4 video into Firestore storage...');
    const reader = new FileReader();
    reader.onload = async (uploadEvent) => {
      const base64VideoUrl = uploadEvent.target?.result as string;
      const mediaId = 'vid-' + Date.now() + '-' + Math.random().toString(36).substring(7);

      try {
        await saveMediaVideoToFirestore(mediaId, base64VideoUrl);
      } catch (err) {
        console.warn('Media upload warning:', err);
      }

      const mp4EmbedHtml = `
        <div class="my-6 rounded-2xl overflow-hidden shadow-md bg-black relative group" data-media-video-id="${mediaId}" data-video-slug="${cleanSlug}" data-video-title="${cleanSlug}">
          <div class="video-overlay-helper absolute top-3 right-3 z-10 pointer-events-auto bg-black/85 hover:bg-orange-600 text-white text-xs font-bold px-3 py-1.5 rounded-xl cursor-pointer shadow-lg flex items-center gap-1.5 transition-all">
            <svg class="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24"><path d="M17 10.5V7c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.55 0 1-.45 1-1v-3.5l4 4v-11l-4 4z"/></svg>
            <span>Edit MP4 (Replace / Slug / Delete)</span>
          </div>
          <video controls class="w-full h-auto max-h-[500px]" preload="metadata" data-video-slug="${cleanSlug}" title="${cleanSlug}">
            <source src="${base64VideoUrl}" type="video/mp4" data-media-id="${mediaId}" />
            Your browser does not support the video tag.
          </video>
        </div>
      `;

      if (selectedBlockElementRef.current && visualContentRef.current?.contains(selectedBlockElementRef.current)) {
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = mp4EmbedHtml.trim();
        const videoNode = tempDiv.firstChild;
        if (videoNode) {
          selectedBlockElementRef.current.after(videoNode);
          setBlogContent(visualContentRef.current.innerHTML);
          showNotify('MP4 video safely saved to Firebase & inserted after selected block!');
          return;
        }
      }

      if (savedRangeRef.current && visualContentRef.current) {
        insertHtmlAtSavedRange(mp4EmbedHtml);
      } else {
        insertHtmlAtSelection(mp4EmbedHtml);
      }
    };
    reader.onerror = () => {
      alert('Error reading video file.');
    };
    reader.readAsDataURL(file);
    if (contentVideoInputRef.current) contentVideoInputRef.current.value = '';
  };

  const handleOpenLinkModal = () => {
    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0) {
      const range = sel.getRangeAt(0);
      if (visualContentRef.current && visualContentRef.current.contains(range.commonAncestorContainer)) {
        savedRangeRef.current = range.cloneRange();
      } else {
        savedRangeRef.current = null;
      }
      const selectedText = sel.toString().trim();
      setLinkModalText(selectedText);
    } else {
      savedRangeRef.current = null;
      setLinkModalText('');
    }
    setLinkModalUrl('https://');
    setShowLinkAddModal(true);
  };

  const insertHtmlAtSavedRange = (html: string) => {
    if (!visualContentRef.current) return;
    visualContentRef.current.focus();

    const sel = window.getSelection();
    if (savedRangeRef.current && sel) {
      sel.removeAllRanges();
      sel.addRange(savedRangeRef.current);
      const range = savedRangeRef.current;
      range.deleteContents();
      const frag = range.createContextualFragment(html);
      range.insertNode(frag);
      sel.removeAllRanges();
      savedRangeRef.current = null;
    } else {
      if (sel && sel.rangeCount > 0) {
        const range = sel.getRangeAt(0);
        if (visualContentRef.current.contains(range.commonAncestorContainer)) {
          range.deleteContents();
          const frag = range.createContextualFragment(html);
          range.insertNode(frag);
          sel.removeAllRanges();
        } else {
          visualContentRef.current.innerHTML += '\n' + html;
        }
      } else {
        visualContentRef.current.innerHTML += '\n' + html;
      }
    }
    setBlogContent(visualContentRef.current.innerHTML);
    showNotify('Link inserted successfully on selected text!');
  };

  const handleConfirmLinkModal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!linkModalUrl.trim()) return;

    const anchorText = linkModalText.trim() || linkModalUrl;
    const linkHtml = `<a href="${linkModalUrl}" target="_blank" rel="noopener noreferrer" class="text-orange-600 underline font-bold hover:text-orange-700 transition-colors">${anchorText}</a>`;
    
    insertHtmlAtSavedRange(linkHtml);
    setShowLinkAddModal(false);
  };

  const handleInsertLink = () => {
    handleOpenLinkModal();
  };

  const handleReplaceVideoFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedVideoEl) return;

    if (file.size > 25 * 1024 * 1024) {
      alert('Video file size is quite large (>25MB). Please use compressed MP4 clips for web performance.');
    }

    setIsUploadingReplacementVideo(true);
    showNotify('Encoding and saving replacement video locally in Firebase...');

    const reader = new FileReader();
    reader.onload = async (uploadEvent) => {
      try {
        const base64VideoUrl = uploadEvent.target?.result as string;
        const newMediaId = 'vid-replace-' + Date.now() + '-' + Math.random().toString(36).substring(7);

        await saveMediaVideoToFirestore(newMediaId, base64VideoUrl);

        const fileSlug = file.name.replace(/\.[^/.]+$/, "").toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
        const updatedSlug = editVideoSlug || fileSlug || 'tutorial-video';
        setEditVideoSlug(updatedSlug);
        setEditVideoMediaId(newMediaId);
        setEditVideoSrc(base64VideoUrl);

        selectedVideoEl.setAttribute('data-media-video-id', newMediaId);
        selectedVideoEl.setAttribute('data-video-slug', updatedSlug);

        let videoEl = selectedVideoEl.tagName === 'VIDEO' ? (selectedVideoEl as HTMLVideoElement) : selectedVideoEl.querySelector('video');
        if (!videoEl) {
          videoEl = document.createElement('video');
          videoEl.setAttribute('controls', 'true');
          videoEl.className = 'w-full h-auto max-h-[500px]';
          selectedVideoEl.appendChild(videoEl);
        }

        videoEl.setAttribute('data-video-slug', updatedSlug);
        videoEl.setAttribute('title', updatedSlug);

        let sourceEl = videoEl.querySelector('source');
        if (!sourceEl) {
          sourceEl = document.createElement('source');
          sourceEl.setAttribute('type', 'video/mp4');
          videoEl.appendChild(sourceEl);
        }

        sourceEl.setAttribute('src', base64VideoUrl);
        sourceEl.setAttribute('data-media-id', newMediaId);
        videoEl.load();

        if (visualContentRef.current) {
          setBlogContent(visualContentRef.current.innerHTML);
        }

        showNotify('New MP4 video successfully uploaded and saved locally in Firebase!');
      } catch (err) {
        alert('Failed to replace video: ' + (err as Error).message);
      } finally {
        setIsUploadingReplacementVideo(false);
      }
    };

    reader.onerror = () => {
      alert('Error reading video file.');
      setIsUploadingReplacementVideo(false);
    };

    reader.readAsDataURL(file);
    if (replaceVideoInputRef.current) replaceVideoInputRef.current.value = '';
  };

  const handleReplaceWithVideoUrl = async () => {
    if (!replaceVideoUrlInput.trim() || !selectedVideoEl) return;
    const url = replaceVideoUrlInput.trim();
    setIsUploadingReplacementVideo(true);
    showNotify('Downloading remote video & saving locally to Firebase...');
    try {
      const res = await fetch(`/api/fetch-image?url=${encodeURIComponent(url)}`);
      const data = await res.json();
      if (!data.dataUrl || !data.dataUrl.startsWith('data:video/')) {
        throw new Error(data.error || 'Failed to download valid MP4 video from remote URL');
      }

      const newMediaId = 'vid-url-' + Date.now() + '-' + Math.random().toString(36).substring(7);
      await saveMediaVideoToFirestore(newMediaId, data.dataUrl);

      setEditVideoMediaId(newMediaId);
      setEditVideoSrc(data.dataUrl);

      selectedVideoEl.setAttribute('data-media-video-id', newMediaId);
      let videoEl = selectedVideoEl.tagName === 'VIDEO' ? (selectedVideoEl as HTMLVideoElement) : selectedVideoEl.querySelector('video');
      if (videoEl) {
        let sourceEl = videoEl.querySelector('source');
        if (!sourceEl) {
          sourceEl = document.createElement('source');
          sourceEl.setAttribute('type', 'video/mp4');
          videoEl.appendChild(sourceEl);
        }
        sourceEl.setAttribute('src', data.dataUrl);
        sourceEl.setAttribute('data-media-id', newMediaId);
        videoEl.load();
      }

      if (visualContentRef.current) {
        setBlogContent(visualContentRef.current.innerHTML);
      }

      setReplaceVideoUrlInput('');
      showNotify('Remote video fetched and saved locally in Firebase!');
    } catch (err) {
      alert('Failed: ' + (err as Error).message);
    } finally {
      setIsUploadingReplacementVideo(false);
    }
  };

  const handleSaveExternalVideoToFirebase = async () => {
    if (!selectedVideoEl) return;
    const videoEl = selectedVideoEl.tagName === 'VIDEO' ? (selectedVideoEl as HTMLVideoElement) : selectedVideoEl.querySelector('video');
    const sourceEl = selectedVideoEl.querySelector('source');
    const extUrl = sourceEl?.getAttribute('src') || videoEl?.getAttribute('src') || editVideoSrc;

    if (!extUrl || !extUrl.startsWith('http')) {
      alert('This video does not have an external URL to convert.');
      return;
    }

    setIsUploadingReplacementVideo(true);
    showNotify('Downloading external video and saving to Firebase...');
    try {
      const res = await fetch(`/api/fetch-image?url=${encodeURIComponent(extUrl)}`);
      const data = await res.json();
      if (!data.dataUrl || !data.dataUrl.startsWith('data:video/')) {
        throw new Error(data.error || 'Could not fetch video from remote server');
      }

      const newMediaId = 'vid-mig-' + Date.now() + '-' + Math.random().toString(36).substring(7);
      await saveMediaVideoToFirestore(newMediaId, data.dataUrl);

      setEditVideoMediaId(newMediaId);
      setEditVideoSrc(data.dataUrl);

      selectedVideoEl.setAttribute('data-media-video-id', newMediaId);
      if (sourceEl) {
        sourceEl.setAttribute('src', data.dataUrl);
        sourceEl.setAttribute('data-media-id', newMediaId);
      } else if (videoEl) {
        videoEl.setAttribute('src', data.dataUrl);
        videoEl.setAttribute('data-media-id', newMediaId);
      }

      if (visualContentRef.current) {
        setBlogContent(visualContentRef.current.innerHTML);
      }

      showNotify('Video successfully saved locally to Firebase!');
    } catch (e) {
      alert('Conversion failed: ' + (e as Error).message);
    } finally {
      setIsUploadingReplacementVideo(false);
    }
  };

  const handleSaveVideoModalChanges = () => {
    if (!selectedVideoEl) return;

    const cleanSlug = editVideoSlug.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'tutorial-video';

    selectedVideoEl.setAttribute('data-video-slug', cleanSlug);
    if (editVideoTitle.trim()) {
      selectedVideoEl.setAttribute('data-video-title', editVideoTitle.trim());
      selectedVideoEl.setAttribute('title', editVideoTitle.trim());
    }

    const videoEl = selectedVideoEl.tagName === 'VIDEO' ? (selectedVideoEl as HTMLVideoElement) : selectedVideoEl.querySelector('video');
    if (videoEl) {
      videoEl.setAttribute('data-video-slug', cleanSlug);
      if (editVideoTitle.trim()) {
        videoEl.setAttribute('title', editVideoTitle.trim());
      }
    }

    if (visualContentRef.current) {
      setBlogContent(visualContentRef.current.innerHTML);
    }
    setShowVideoModal(false);
    showNotify('Video slug & settings updated successfully!');
  };

  const handleDeleteVideo = () => {
    if (!selectedVideoEl) return;
    if (confirm('Are you sure you want to delete this MP4 video from the article?')) {
      selectedVideoEl.remove();
      if (visualContentRef.current) {
        setBlogContent(visualContentRef.current.innerHTML);
      }
      setShowVideoModal(false);
      setSelectedVideoEl(null);
      showNotify('Video deleted from article.');
    }
  };

  const handleVisualClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement;

    // 1. Check for Link click
    const linkTarget = target.tagName === 'A' ? (target as HTMLAnchorElement) : target.closest('a');
    if (linkTarget && visualContentRef.current?.contains(linkTarget)) {
      e.preventDefault();
      setSelectedLinkEl(linkTarget);
      setEditLinkUrl(linkTarget.getAttribute('href') || 'https://');
      setEditLinkText(linkTarget.textContent || '');
      setShowEditLinkModal(true);
      return;
    }

    // 2. Check for Image click
    const imgTarget = target.tagName === 'IMG' ? (target as HTMLImageElement) : target.closest('img');
    if (imgTarget && visualContentRef.current?.contains(imgTarget)) {
      setSelectedImageEl(imgTarget);
      let currentAlt = imgTarget.getAttribute('alt') || '';
      const imgTitle = imgTarget.getAttribute('title') || imgTarget.getAttribute('data-img-slug') || '';
      if (!currentAlt.trim() && imgTitle.trim()) {
        currentAlt = imgTitle.trim();
        imgTarget.setAttribute('alt', currentAlt);
      }
      setEditImageAlt(currentAlt);
      setEditImageSlug(imgTarget.getAttribute('data-img-slug') || '');
      setShowImageModal(true);
      return;
    }

    // 3. Check for MP4 Video or Video Overlay Helper click
    const isVideoRelated = target.tagName === 'VIDEO' || 
                           target.tagName === 'SOURCE' || 
                           !!target.closest('video') || 
                           !!target.closest('[data-media-video-id]') || 
                           !!target.closest('.video-overlay-helper') ||
                           !!target.closest('.wp-block-video') || 
                           !!target.closest('.video-container');

    if (isVideoRelated && visualContentRef.current?.contains(target)) {
      e.preventDefault();
      e.stopPropagation();

      let videoContainer: HTMLElement | null = target.closest('[data-media-video-id]');
      if (!videoContainer) {
        videoContainer = target.closest('.video-container') || target.closest('.wp-block-video');
      }
      if (!videoContainer) {
        const vid = target.tagName === 'VIDEO' ? (target as HTMLVideoElement) : target.closest('video');
        if (vid) {
          const parent = vid.parentElement;
          if (parent && parent !== visualContentRef.current && (parent.tagName === 'FIGURE' || parent.tagName === 'DIV' || parent.classList.contains('my-6'))) {
            videoContainer = parent;
          } else {
            videoContainer = vid;
          }
        }
      }

      if (videoContainer && videoContainer !== visualContentRef.current) {
        openVideoModal(videoContainer);
        return;
      }
    }

    // 4. Block selection for formatting
    const blockEl = target.closest('p, h1, h2, h3, blockquote, ul, table, li, tr') as HTMLElement;
    if (blockEl && visualContentRef.current?.contains(blockEl) && blockEl !== visualContentRef.current) {
      visualContentRef.current.querySelectorAll('.editor-selected-block').forEach(el => {
        el.classList.remove('ring-2', 'ring-blue-400', 'bg-blue-50/20', 'rounded-xl', 'p-2', 'editor-selected-block');
      });
      blockEl.classList.add('ring-2', 'ring-blue-400', 'bg-blue-50/20', 'rounded-xl', 'p-2', 'editor-selected-block');
      selectedBlockElementRef.current = blockEl;
      updateActiveStates(blockEl);
    }
  };

  const handleContentImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (uploadEvent) => {
      const base64String = uploadEvent.target?.result as string;
      const alt = prompt('Enter Image Alt Text (SEO):', 'Tutorial illustration image');
      const cleanAlt = alt || 'Tutorial image';
      const imgSlug = cleanAlt.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

      const newImg: ArticleImage = {
        id: 'img-' + (articleImages.length + 1),
        base64: base64String,
        alt: cleanAlt,
        slug: imgSlug
      };

      setArticleImages(prev => [...prev, newImg]);

      const imgHtml = `<img src="${base64String}" alt="${cleanAlt}" data-img-slug="${imgSlug}" class="w-full rounded-2xl my-6 shadow-md object-cover cursor-pointer hover:ring-2 hover:ring-orange-500 transition-all" />\n`;

      if (selectedBlockElementRef.current && visualContentRef.current?.contains(selectedBlockElementRef.current)) {
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = imgHtml;
        const imgNode = tempDiv.firstChild;
        selectedBlockElementRef.current.after(imgNode!);
        setBlogContent(visualContentRef.current.innerHTML);
        showNotify('Image inserted right after selected block!');
      } else {
        insertHtmlAtSelection(imgHtml);
      }
    };
    reader.readAsDataURL(file);
    if (contentImageInputRef.current) contentImageInputRef.current.value = '';
  };

  const handleFeaturedImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (uploadEvent) => {
      const base64String = uploadEvent.target?.result as string;
      setBlogImage(base64String);
      if (!blogImageSlug) {
        const cleanSlug = file.name.replace(/\.[^/.]+$/, "").toLowerCase().replace(/[^a-z0-9]+/g, '-');
        setBlogImageSlug(cleanSlug);
      }
      showNotify('Featured image uploaded locally successfully!');
    };
    reader.readAsDataURL(file);
    if (featuredImageInputRef.current) featuredImageInputRef.current.value = '';
  };

  const handleConvertWpCode = async () => {
    if (!wpRawCode.trim()) return;

    let cleaned = wpRawCode
      .replace(/<!-- wp:.*?-->/g, '')
      .replace(/<!-- \/wp:.*?-->/g, '')
      .trim();

    if (!cleaned.includes('<p>') && !cleaned.includes('<h1>')) {
      cleaned = cleaned
        .split('\n\n')
        .map(p => p.trim() ? `<p class="mb-6 text-slate-700 leading-relaxed text-lg">${p.trim()}</p>` : '')
        .join('\n');
    }

    const parser = new DOMParser();
    const doc = parser.parseFromString(cleaned, 'text/html');
    const imgs = doc.querySelectorAll('img');
    let firstLocalImgSrc = '';
    let firstImgSlug = '';

    for (let idx = 0; idx < imgs.length; idx++) {
      const img = imgs[idx];
      const oldSrc = img.getAttribute('src') || '';
      const oldAlt = img.getAttribute('alt') || `Tutorial image ${idx + 1}`;
      
      let imgSlug = `wp-image-${idx + 1}`;
      if (oldSrc) {
        try {
          const urlObj = new URL(oldSrc, window.location.origin);
          let pathname = urlObj.pathname;
          if (pathname.startsWith('/')) {
            pathname = pathname.substring(1);
          }
          if (pathname) {
            imgSlug = pathname;
          }
        } catch {
          let cleanPath = oldSrc.replace(/^https?:\/\/[^\/]+\//, '');
          if (cleanPath) {
            imgSlug = cleanPath;
          }
        }
      }

      let localSrc = oldSrc;
      if (oldSrc && !oldSrc.startsWith('data:')) {
        try {
          const res = await fetch(`/api/fetch-image?url=${encodeURIComponent(oldSrc)}`);
          const data = await res.json();
          if (data.dataUrl) {
            localSrc = data.dataUrl;
          }
        } catch (e) {
          console.warn('Failed to convert image to local base64:', e);
        }
      }

      if (idx === 0) {
        firstLocalImgSrc = localSrc;
        firstImgSlug = imgSlug;
      }

      img.setAttribute('src', localSrc);
      img.setAttribute('alt', oldAlt);
      img.setAttribute('data-img-slug', imgSlug);
      img.className = 'w-full rounded-2xl my-6 shadow-md object-cover cursor-pointer hover:ring-2 hover:ring-orange-500 transition-all';
    }

    cleaned = doc.body.innerHTML;

    const updated = blogContent ? blogContent + '\n\n' + cleaned : cleaned;
    setBlogContent(updated);
    if (visualContentRef.current) {
      visualContentRef.current.innerHTML = updated;
    }

    if (firstLocalImgSrc && (blogImage.includes('picsum.photos/seed/newpost') || blogImage.includes('blogdefault'))) {
      setBlogImage(firstLocalImgSrc);
      setBlogImageSlug(firstImgSlug);
    }

    setWpRawCode('');
    setShowWpImporter(false);
    showNotify('WordPress code imported & all images successfully converted to local permanent storage (Base64)!');
  };

  // FAQ Builder Handlers
  const handleAddFaq = () => {
    if (!newFaqQ.trim() || !newFaqA.trim()) return;
    setFaqs(prevFaqs => {
      const updatedFaqs = [...prevFaqs, { question: newFaqQ.trim(), answer: newFaqA.trim() }];
      updateContentWithFaqs(updatedFaqs);
      return updatedFaqs;
    });
    setNewFaqQ('');
    setNewFaqA('');
    showNotify('FAQ added and Schema automatically generated!');
  };

  const handleDeleteFaq = (index: number) => {
    setFaqs(prevFaqs => {
      const updatedFaqs = prevFaqs.filter((_, i) => i !== index);
      updateContentWithFaqs(updatedFaqs);
      return updatedFaqs;
    });
  };

  const updateContentWithFaqs = (currentFaqs: FAQItem[]) => {
    if (currentFaqs.length === 0) return;

    let faqHtml = `<div class="my-8 p-6 bg-slate-50 border border-slate-200 rounded-3xl space-y-4">\n  <h3 class="text-xl font-bold text-black">Frequently Asked Questions (FAQs)</h3>\n  <div class="space-y-3">\n`;

    currentFaqs.forEach((faq) => {
      faqHtml += `    <details class="group bg-white border border-slate-200 rounded-2xl p-4 shadow-sm hover:border-orange-400 transition-colors">\n      <summary class="font-bold text-black text-base cursor-pointer flex items-center justify-between">${faq.question} <span class="text-orange-600 group-open:rotate-180 transition-transform">▼</span></summary>\n      <p class="mt-3 text-slate-700 text-sm font-medium pt-3 border-t border-slate-100">${faq.answer}</p>\n    </details>\n`;
    });

    faqHtml += `  </div>\n</div>\n`;

    const schemaData = {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      "mainEntity": currentFaqs.map(f => ({
        "@type": "Question",
        "name": f.question,
        "acceptedAnswer": {
          "@type": "Answer",
          "text": f.answer
        }
      }))
    };

    const schemaScript = `<script type="application/ld+json">\n${JSON.stringify(schemaData, null, 2)}\n</script>`;

    const currentHtml = visualContentRef.current ? visualContentRef.current.innerHTML : blogContent;
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = currentHtml;
    tempDiv.querySelectorAll('div, script').forEach(el => {
      if (
        (el.innerHTML && el.innerHTML.includes('FAQPage')) || 
        (el.className && typeof el.className === 'string' && el.className.includes('bg-slate-50') && el.innerHTML.includes('Frequently Asked Questions'))
      ) {
        el.remove();
      }
    });

    const cleanHtml = tempDiv.innerHTML.trim();
    const updated = cleanHtml + '\n\n' + faqHtml + '\n\n' + schemaScript;
    setBlogContent(updated);
    if (visualContentRef.current) visualContentRef.current.innerHTML = updated;
  };

  // AI Supervisor Actions
  const handleAiGeneratePost = async () => {
    if (!aiKeyword.trim()) return;
    setIsGeneratingAi(true);
    try {
      const res = await fetch('/api/ai-supervisor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'generate', keywordOrTitle: aiKeyword })
      });
      const data = await res.json();
      if (data.title) {
        setBlogTitle(data.title);
        setBlogSlug(data.slug || data.title.toLowerCase().replace(/[^a-z0-9]+/g, '-'));
        const cat = data.category || 'AI Guides';
        setBlogCategory(cat);
        if (!customCategories.includes(cat)) {
          const updatedCats = [...customCategories, cat];
          setCustomCategories(updatedCats);
          if (typeof window !== 'undefined') localStorage.setItem(CATEGORIES_KEY, JSON.stringify(updatedCats));
        }
        setBlogExcerpt(data.excerpt || '');
        setBlogContent(data.content || '');
        if (visualContentRef.current) visualContentRef.current.innerHTML = data.content || '';
        showNotify('Full Hindi article generated successfully by AI Supervisor!');
      } else {
        alert('Failed to generate article.');
      }
    } catch (err) {
      alert('Error generating article: ' + (err as Error).message);
    } finally {
      setIsGeneratingAi(false);
    }
  };

  const handleAiAnalyzePost = async () => {
    const currentContent = visualContentRef.current ? visualContentRef.current.innerHTML : blogContent;
    if (!blogTitle.trim() || !currentContent.trim()) {
      alert('Please enter a title and content to analyze.');
      return;
    }
    setIsAnalyzingAi(true);
    try {
      const res = await fetch('/api/ai-supervisor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'analyze', keywordOrTitle: blogTitle, content: currentContent })
      });
      const data = await res.json();
      if (data.seoScore !== undefined) {
        setAnalysisResult(data);
        showNotify('AI Supervisor analysis complete!');
      } else {
        alert('Failed to analyze article.');
      }
    } catch (err) {
      alert('Error analyzing article: ' + (err as Error).message);
    } finally {
      setIsAnalyzingAi(false);
    }
  };

  const handleAiOptimizePost = async () => {
    const currentContent = visualContentRef.current ? visualContentRef.current.innerHTML : blogContent;
    if (!blogTitle.trim() || !currentContent.trim()) {
      alert('Please enter a title and content to optimize.');
      return;
    }
    setIsOptimizingAi(true);
    try {
      const res = await fetch('/api/ai-supervisor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'optimize', keywordOrTitle: blogTitle, content: currentContent })
      });
      const data = await res.json();
      if (data.title && data.content) {
        setBlogTitle(data.title);
        if (data.excerpt) setBlogExcerpt(data.excerpt);
        setBlogContent(data.content);
        if (visualContentRef.current) visualContentRef.current.innerHTML = data.content;
        showNotify('Content successfully optimized by AI Supervisor! Mistakes fixed & SEO boosted.');
      } else {
        alert('Failed to optimize article.');
      }
    } catch (err) {
      alert('Error optimizing article: ' + (err as Error).message);
    } finally {
      setIsOptimizingAi(false);
    }
  };

  const handleExportBackup = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(posts, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `aitoolhindi-backup-${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    showNotify('All site articles backup exported successfully!');
  };

  const handleImportBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (uploadEvent) => {
      try {
        const content = uploadEvent.target?.result as string;
        const importedPosts: BlogPost[] = JSON.parse(content);
        if (!Array.isArray(importedPosts)) {
          alert('Invalid backup format. Must be an array of articles.');
          return;
        }

        if (confirm(`Are you sure you want to restore ${importedPosts.length} articles? This will sync them to Firestore and update existing items.`)) {
          await restoreBackupPosts(importedPosts);
          await loadData(true);
          showNotify(`Successfully restored ${importedPosts.length} articles!`);
        }
      } catch (err) {
        console.error(err);
        alert('Failed to parse backup JSON file.');
      } finally {
        if (restoreFileInputRef.current) restoreFileInputRef.current.value = '';
      }
    };
    reader.readAsText(file);
  };

  const handleManualScan = () => {
    setIsScanningMedia(true);
    const scanned = scanAllArticlesForExternalMedia(posts);
    setUnmigratedMedia(scanned);
    setTimeout(() => {
      setIsScanningMedia(false);
      showNotify(`Scan completed! Found ${scanned.length} external WordPress media items.`);
    }, 300);
  };

  const handleDownloadMedia = (wpUrl: string, mediaType: string) => {
    const downloadUrl = `/api/fetch-image?url=${encodeURIComponent(wpUrl)}&download=1`;
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.setAttribute('download', '');
    document.body.appendChild(link);
    link.click();
    link.remove();
    showNotify(`Downloading ${mediaType} from WordPress...`);
  };

  const handleCopyWpUrl = (id: string, url: string) => {
    navigator.clipboard.writeText(url);
    setCopiedUrlId(id);
    setTimeout(() => setCopiedUrlId(null), 2500);
    showNotify('WordPress URL copied to clipboard!');
  };

  const handleEditArticleFromMedia = (articleSlug: string, articleId: string) => {
    const targetPost = posts.find(p => p.id === articleId || p.slug === articleSlug);
    if (targetPost) {
      handleOpenEditBlog(targetPost);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      alert('Article not found.');
    }
  };

  const handleMigrateSingleItem = async (item: UnmigratedMediaItem) => {
    setMigratingSingleId(item.id);
    try {
      const res = await fetch(`/api/fetch-image?url=${encodeURIComponent(item.wpUrl)}`);
      const data = await res.json();

      if (!data.dataUrl || !data.dataUrl.startsWith('data:')) {
        throw new Error(data.error || 'Failed to fetch media from WordPress');
      }

      const targetPost = posts.find(p => p.id === item.articleId || p.slug === item.articleSlug);
      if (!targetPost) throw new Error('Post not found in database');

      let updatedPost = { ...targetPost };

      if (item.mediaType === 'featured') {
        updatedPost.image = data.dataUrl;
      } else if (item.mediaType === 'image') {
        const mediaId = 'img-single-' + Date.now() + '-' + Math.random().toString(36).substring(7);
        const compressed = await compressImageBase64(data.dataUrl, 800, 0.7);
        let useRemote = true;
        try {
          await saveMediaImageToFirestore(mediaId, compressed);
        } catch {
          useRemote = false;
        }

        const parser = new DOMParser();
        const doc = parser.parseFromString(updatedPost.content, 'text/html');
        const imgs = Array.from(doc.querySelectorAll('img'));
        let matched = false;
        imgs.forEach(img => {
          let src = img.getAttribute('src') || '';
          if (src.startsWith('//')) src = 'https:' + src;
          if (src === item.wpUrl || src.includes(item.wpUrl) || item.wpUrl.includes(src)) {
            if (useRemote) {
              img.setAttribute('src', '');
              img.setAttribute('data-media-image-id', mediaId);
            } else {
              img.setAttribute('src', compressed);
            }
            img.removeAttribute('srcset');
            img.removeAttribute('data-src');
            img.removeAttribute('data-orig-file');
            matched = true;
          }
        });
        if (matched) {
          updatedPost.content = doc.body.innerHTML;
        }
      } else if (item.mediaType === 'video') {
        const mediaId = 'vid-single-' + Date.now() + '-' + Math.random().toString(36).substring(7);
        await saveMediaVideoToFirestore(mediaId, data.dataUrl);
        const parser = new DOMParser();
        const doc = parser.parseFromString(updatedPost.content, 'text/html');
        const vids = Array.from(doc.querySelectorAll('video, source'));
        let matched = false;
        vids.forEach(v => {
          let src = v.getAttribute('src') || '';
          if (src.startsWith('//')) src = 'https:' + src;
          if (src === item.wpUrl || src.includes(item.wpUrl) || item.wpUrl.includes(src)) {
            v.setAttribute('src', '');
            v.setAttribute('data-media-id', mediaId);
            const wrapper = v.closest('div.my-6') || v.parentElement;
            if (wrapper) wrapper.setAttribute('data-media-video-id', mediaId);
            matched = true;
          }
        });
        if (matched) {
          updatedPost.content = doc.body.innerHTML;
        }
      }

      await saveBlogPostToFirestore(updatedPost);
      await loadData(true);
      showNotify(`Successfully migrated ${item.mediaType} to local database!`);
      setUnmigratedMedia(prev => prev.filter(m => m.id !== item.id));
    } catch (err) {
      alert(`Could not migrate this item: ${(err as Error).message}\nPlease click "Download Media" to download manually and replace it in the article editor.`);
    } finally {
      setMigratingSingleId(null);
    }
  };

  const handleMigrateAllImages = async () => {
    if (!confirm('Are you sure you want to scan all articles and convert remaining external WordPress image & MP4 video URLs into local database storage? Already secured Base64 images and videos will remain 100% untouched.')) {
      return;
    }

    setIsMigratingImages(true);
    setMigrationProgress({ current: 0, total: 100, text: 'Fetching articles from database...' });
    const failedList: UnmigratedMediaItem[] = [];

    try {
      const currentPosts = await fetchBlogPostsFromFirestore(true);
      const total = currentPosts.length;
      let updatedCount = 0;

      for (let i = 0; i < total; i++) {
        const post = currentPosts[i];
        const percent = Math.round(((i + 1) / total) * 100);
        setMigrationProgress({ current: percent, total, text: `Migrating article ${i + 1} of ${total}: "${post.title.substring(0, 25)}..."` });

        let contentChanged = false;
        let newContent = post.content || '';
        let newFeaturedImage = post.image;

        // 1. Featured image migration
        if (newFeaturedImage && newFeaturedImage.startsWith('http') && !newFeaturedImage.includes('picsum.photos') && !newFeaturedImage.startsWith('data:')) {
          try {
            const res = await fetch(`/api/fetch-image?url=${encodeURIComponent(newFeaturedImage)}`);
            const data = await res.json();
            if (data.dataUrl && data.dataUrl.startsWith('data:')) {
              newFeaturedImage = data.dataUrl;
              contentChanged = true;
            } else {
              failedList.push({
                id: `unmig-feat-${post.id}`,
                articleId: post.id,
                articleTitle: post.title,
                articleSlug: post.slug,
                mediaType: 'featured',
                wpUrl: newFeaturedImage,
                reason: data.error || 'Failed to fetch featured image',
                failed: true
              });
            }
          } catch (e) {
            console.warn('Featured image fetch error:', e);
            failedList.push({
              id: `unmig-feat-${post.id}`,
              articleId: post.id,
              articleTitle: post.title,
              articleSlug: post.slug,
              mediaType: 'featured',
              wpUrl: newFeaturedImage,
              reason: (e as Error).message,
              failed: true
            });
          }
        }

        // 2. In-content images and MP4 videos migration
        if (newContent && (newContent.includes('<img') || newContent.includes('<video') || newContent.includes('<source'))) {
          const parser = new DOMParser();
          const doc = parser.parseFromString(newContent, 'text/html');
          const imgs = Array.from(doc.querySelectorAll('img'));
          const sources = Array.from(doc.querySelectorAll('source, video'));
          let mediaUpdated = false;

          // Process content images
          await Promise.all(imgs.map(async (img, imgIdx) => {
            let src = img.getAttribute('src') || '';
            if (src.startsWith('//')) src = 'https:' + src;
            if (src && src.startsWith('http') && !src.startsWith('data:') && !src.includes('picsum.photos')) {
              try {
                const res = await fetch(`/api/fetch-image?url=${encodeURIComponent(src)}`);
                const data = await res.json();
                if (data.dataUrl && data.dataUrl.startsWith('data:')) {
                  const mediaId = 'img-mig-' + Date.now() + '-' + imgIdx + '-' + Math.random().toString(36).substring(7);
                  const compressed = await compressImageBase64(data.dataUrl, 800, 0.7);
                  try {
                    await saveMediaImageToFirestore(mediaId, compressed);
                    img.setAttribute('src', '');
                    img.setAttribute('data-media-image-id', mediaId);
                  } catch {
                    img.setAttribute('src', compressed);
                  }
                  img.removeAttribute('srcset');
                  img.removeAttribute('data-src');
                  img.removeAttribute('data-orig-file');
                  mediaUpdated = true;
                } else {
                  failedList.push({
                    id: `unmig-img-${post.id}-${imgIdx}`,
                    articleId: post.id,
                    articleTitle: post.title,
                    articleSlug: post.slug,
                    mediaType: 'image',
                    wpUrl: src,
                    reason: data.error || 'WordPress server rejected image fetch',
                    failed: true
                  });
                }
              } catch (e) {
                console.warn('Content image fetch error:', e);
                failedList.push({
                  id: `unmig-img-${post.id}-${imgIdx}`,
                  articleId: post.id,
                  articleTitle: post.title,
                  articleSlug: post.slug,
                  mediaType: 'image',
                  wpUrl: src,
                  reason: (e as Error).message,
                  failed: true
                });
              }
            }
          }));

          // Process content MP4 videos
          for (let sIdx = 0; sIdx < sources.length; sIdx++) {
            const srcEl = sources[sIdx];
            let src = srcEl.getAttribute('src') || '';
            if (src.startsWith('//')) src = 'https:' + src;
            const wrapper = srcEl.closest('div.my-6') || srcEl.parentElement;
            const existingMediaId = wrapper?.getAttribute('data-media-video-id') || srcEl.getAttribute('data-media-video-id');

            // External video URL that hasn't been migrated into mediaVideos
            if (src && src.startsWith('http') && !src.startsWith('data:') && !existingMediaId) {
              try {
                const res = await fetch(`/api/fetch-image?url=${encodeURIComponent(src)}`);
                const data = await res.json();
                if (data.dataUrl && data.dataUrl.startsWith('data:')) {
                  const mediaId = 'vid-mig-' + Date.now() + '-' + sIdx + '-' + Math.random().toString(36).substring(7);
                  await saveMediaVideoToFirestore(mediaId, data.dataUrl);
                  // Set src to empty to keep blog post document size lightweight (<1MB)
                  srcEl.setAttribute('src', '');
                  srcEl.setAttribute('data-media-id', mediaId);
                  if (wrapper) {
                    wrapper.setAttribute('data-media-video-id', mediaId);
                  } else {
                    srcEl.setAttribute('data-media-video-id', mediaId);
                  }
                  mediaUpdated = true;
                } else {
                  failedList.push({
                    id: `unmig-vid-${post.id}-${sIdx}`,
                    articleId: post.id,
                    articleTitle: post.title,
                    articleSlug: post.slug,
                    mediaType: 'video',
                    wpUrl: src,
                    reason: data.error || 'Video could not be downloaded from remote host',
                    failed: true
                  });
                }
              } catch (e) {
                console.warn('Content video fetch error:', e);
                failedList.push({
                  id: `unmig-vid-${post.id}-${sIdx}`,
                  articleId: post.id,
                  articleTitle: post.title,
                  articleSlug: post.slug,
                  mediaType: 'video',
                  wpUrl: src,
                  reason: (e as Error).message,
                  failed: true
                });
              }
            } else if (src && src.startsWith('data:video/')) {
              // Repair legacy bloated videos: chunk them into mediaVideos and strip from post HTML
              try {
                let mediaId = existingMediaId;
                if (!mediaId) {
                  mediaId = 'vid-mig-repair-' + Date.now() + '-' + sIdx + '-' + Math.random().toString(36).substring(7);
                  await saveMediaVideoToFirestore(mediaId, src);
                }
                srcEl.setAttribute('src', '');
                srcEl.setAttribute('data-media-id', mediaId);
                if (wrapper) {
                  wrapper.setAttribute('data-media-video-id', mediaId);
                } else {
                  srcEl.setAttribute('data-media-video-id', mediaId);
                }
                mediaUpdated = true;
              } catch (err) {
                console.warn('Repair error for video:', err);
              }
            }
          }

          if (mediaUpdated) {
            newContent = doc.body.innerHTML;
            contentChanged = true;
          }
        }

        if (contentChanged) {
          const migratedPost: BlogPost = {
            ...post,
            image: newFeaturedImage,
            content: newContent
          };
          await saveBlogPostToFirestore(migratedPost);
          updatedCount++;
        }
      }

      setFailedMigrationImages(failedList.map(f => ({ articleTitle: f.articleTitle, articleSlug: f.articleSlug, imageUrl: f.wpUrl })));
      setMigrationProgress({ current: 100, total, text: 'Migration completed! Rescanning articles...' });
      const freshData = await fetchBlogPostsFromFirestore(true);
      setPosts(freshData);
      const remainingUnmigrated = scanAllArticlesForExternalMedia(freshData);
      
      const combined = remainingUnmigrated.map(item => {
        const foundFailed = failedList.find(f => f.wpUrl === item.wpUrl || f.id === item.id);
        return foundFailed ? { ...item, reason: foundFailed.reason, failed: true } : item;
      });
      setUnmigratedMedia(combined);

      if (combined.length > 0) {
        showNotify(`Migration completed! ${updatedCount} articles updated. ${combined.length} media items remain pending (view list below).`);
      } else {
        showNotify(`All remaining images & MP4 videos successfully migrated! 100% Secured.`);
      }
    } catch (err) {
      alert('Error migrating images: ' + (err as Error).message);
    } finally {
      setIsMigratingImages(false);
      setTimeout(() => setMigrationProgress({ current: 0, total: 0, text: '' }), 5000);
    }
  };

  const handleOpenNewBlog = () => {
    setEditingBlogId(null);
    setBlogTitle('');
    setBlogSlug('');
    setIsSlugManual(false);
    setBlogExcerpt('');
    setBlogMetaDescription('');
    const defaultNewContent = '';
    setBlogContent(defaultNewContent);
    if (visualContentRef.current) visualContentRef.current.innerHTML = defaultNewContent;
    setBlogCategory(customCategories[0] || 'AI Guides');
    setIsNewCategoryMode(false);
    setNewCategoryName('');
    setBlogImage('https://picsum.photos/seed/newpost/800/450');
    setBlogImageAlt('AI tutorial featured image');
    setBlogImageSlug('ai-tutorial-featured');
    setBlogStatus('published');
    setBlogNoIndex(false);
    setArticleImages([]);
    setFaqs([]);
    setAnalysisResult(null);
    setEditorMode('visual');
    setShowPostSettings(true);
    setIsEditingBlog(true);
  };

  const handleOpenEditBlog = (b: BlogPost) => {
    setEditingBlogId(b.id);
    setBlogTitle(b.title);
    setBlogSlug(b.slug);
    setIsSlugManual(true);
    setBlogExcerpt(b.excerpt || '');
    setBlogMetaDescription(b.metaDescription || b.excerpt || '');
    setBlogContent(b.content);
    if (visualContentRef.current) {
      visualContentRef.current.innerHTML = b.content;
      setTimeout(() => {
        if (visualContentRef.current) hydrateEditorVideos(visualContentRef.current);
      }, 50);
    }
    const cat = b.category || 'AI Guides';
    if (!customCategories.includes(cat)) {
      setCustomCategories(prev => [...prev, cat]);
    }
    setBlogCategory(cat);
    setIsNewCategoryMode(false);
    setNewCategoryName('');
    setBlogImage(b.image);
    setBlogImageAlt(b.imageAlt || '');
    setBlogImageSlug(b.imageSlug || '');
    setBlogStatus(b.status || 'published');
    setBlogNoIndex(!!b.noIndex);
    setArticleImages([]);
    const parsedFaqs: FAQItem[] = [];
    if (b.content) {
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = b.content;
      tempDiv.querySelectorAll('details').forEach(details => {
        const summary = details.querySelector('summary');
        const p = details.querySelector('p');
        if (summary && p) {
          const qText = summary.textContent?.replace('▼', '').trim() || '';
          const aText = p.textContent?.trim() || '';
          if (qText && aText) {
            parsedFaqs.push({ question: qText, answer: aText });
          }
        }
      });
    }
    setFaqs(parsedFaqs);
    setAnalysisResult(null);
    setEditorMode('visual');
    setShowPostSettings(false);
    setIsEditingBlog(true);
  };

  const handleSaveBlog = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!blogTitle.trim()) {
      alert('कृपया आर्टिकल का टाइटल (Title) भरें!');
      return;
    }
    if (!blogSlug.trim()) {
      alert('कृपया URL Slug भरें!');
      return;
    }

    setIsSavingPost(true);

    try {
      let finalCategory = blogCategory;
      if (isNewCategoryMode && newCategoryName.trim()) {
        finalCategory = newCategoryName.trim();
        if (!customCategories.includes(finalCategory)) {
          const updatedCats = [...customCategories, finalCategory];
          setCustomCategories(updatedCats);
          if (typeof window !== 'undefined') localStorage.setItem(CATEGORIES_KEY, JSON.stringify(updatedCats));
        }
      }

      if (visualContentRef.current) {
        visualContentRef.current.querySelectorAll('.editor-selected-block').forEach(el => {
          el.classList.remove('ring-2', 'ring-blue-400', 'bg-blue-50/20', 'rounded-xl', 'p-2', 'editor-selected-block');
        });
      }

      let processedHtmlContent = visualContentRef.current ? visualContentRef.current.innerHTML : blogContent;
      if (processedHtmlContent && (processedHtmlContent.includes('<video') || processedHtmlContent.includes('<source') || processedHtmlContent.includes('video-overlay-helper') || processedHtmlContent.includes('data-media-video-id') || processedHtmlContent.includes('<img') || processedHtmlContent.includes('data:image/'))) {
        const parser = new DOMParser();
        const doc = parser.parseFromString(processedHtmlContent, 'text/html');

        // Clean up any temporary editor overlay badges
        doc.querySelectorAll('.video-overlay-helper').forEach(h => h.remove());

        // Process content images in parallel
        const imgEls = Array.from(doc.querySelectorAll('img'));
        const imagePromises = imgEls.map(async (img, idx) => {
          const src = img.getAttribute('src') || '';
          if (src && src.startsWith('data:image/')) {
            let mediaId = img.getAttribute('data-media-image-id');
            if (!mediaId) {
              mediaId = 'img-save-' + Date.now() + '-' + idx + '-' + Math.random().toString(36).substring(7);
            }
            try {
              await saveMediaImageToFirestore(mediaId, src);
              img.setAttribute('src', '');
              img.setAttribute('data-media-image-id', mediaId);
              img.removeAttribute('srcset');
              img.removeAttribute('data-src');
              img.removeAttribute('data-orig-file');
            } catch (e) {
              console.warn('Failed to save image chunk:', e);
            }
          }
        });

        // Process videos in parallel
        const videoEls = Array.from(doc.querySelectorAll('video'));
        const videoPromises = videoEls.map(async (vid, idx) => {
          const source = vid.querySelector('source');
          const src = source ? source.getAttribute('src') || '' : vid.getAttribute('src') || '';
          const wrapper = vid.closest('div.my-6') || vid.closest('[data-media-video-id]') || vid.parentElement;

          if (src && src.startsWith('data:video/')) {
            let mediaId = wrapper?.getAttribute('data-media-video-id') || vid.getAttribute('data-media-video-id');
            if (!mediaId) {
              mediaId = 'vid-save-' + Date.now() + '-' + idx + '-' + Math.random().toString(36).substring(7);
            }
            try {
              await saveMediaVideoToFirestore(mediaId, src);
              if (wrapper && wrapper !== doc.body) {
                wrapper.setAttribute('data-media-video-id', mediaId);
              } else {
                vid.setAttribute('data-media-video-id', mediaId);
              }
              if (source) {
                source.setAttribute('src', '');
                source.setAttribute('data-media-id', mediaId);
              } else {
                vid.setAttribute('src', '');
                vid.setAttribute('data-media-id', mediaId);
              }
            } catch (e) {
              console.warn('Failed to chunk/save video to Firestore mediaVideos:', e);
            }
          }
        });

        await Promise.all([...imagePromises, ...videoPromises]);
        processedHtmlContent = doc.body.innerHTML;
      }

      const formattedSlug = blogSlug.toLowerCase().replace(/\s+/g, '-');
      const postId = editingBlogId || ('blog-' + formattedSlug);

      let finalMetaDesc = blogMetaDescription.trim();
      if (!finalMetaDesc) {
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = processedHtmlContent;
        const plainText = tempDiv.textContent || tempDiv.innerText || '';
        finalMetaDesc = plainText.trim().substring(0, 160);
      }

      let finalBlogImage = blogImage;

      const postToSave: BlogPost = {
        id: postId,
        title: blogTitle,
        slug: formattedSlug,
        excerpt: finalMetaDesc,
        metaDescription: finalMetaDesc,
        content: processedHtmlContent,
        category: finalCategory,
        author: 'Anwar',
        date: new Date().toLocaleDateString('hi-IN', { day: 'numeric', month: 'short', year: 'numeric' }),
        readTime: '5 min read',
        image: finalBlogImage,
        imageAlt: blogImageAlt,
        imageSlug: blogImageSlug,
        status: blogStatus,
        noIndex: blogNoIndex
      };

      await saveBlogPostToFirestore(postToSave);
      await loadData(true);
      showNotify(editingBlogId ? 'Tutorial updated & synced with Firebase!' : 'New tutorial published to Firebase!');
      setIsEditingBlog(false);
    } catch (err) {
      alert('Error saving to Firebase: ' + (err as Error).message);
    } finally {
      setIsSavingPost(false);
    }
  };

  const handleDeleteBlog = async (id: string) => {
    if (confirm('Are you sure you want to delete this tutorial post?')) {
      try {
        await deleteBlogPostFromFirestore(id);
        await loadData(true);
        showNotify('Tutorial deleted.');
      } catch (err) {
        alert('Error deleting: ' + (err as Error).message);
      }
    }
  };

  // ==========================================
  // RENDER CONTINUOUS VISUAL EDITOR
  // ==========================================
  if (isEditingBlog) {
    const calculateArticleSize = () => {
      const contentHtml = blogContent;
      const samplePost = {
        id: editingBlogId || 'preview',
        title: blogTitle,
        slug: blogSlug,
        content: contentHtml,
        category: blogCategory,
        image: blogImage,
        imageAlt: blogImageAlt,
        imageSlug: blogImageSlug,
        status: blogStatus
      };
      const jsonStr = JSON.stringify(samplePost);
      const bytes = new Blob([jsonStr]).size;
      const kb = (bytes / 1024).toFixed(1);
      const isSafe = bytes < 950000;
      return { kb, bytes, isSafe };
    };

    const articleSizeInfo = calculateArticleSize();

    return (
      <div className="min-h-screen bg-slate-100 flex flex-col">
        {/* Fixed Position Article Size Popup at Top Right */}
        <div className="fixed top-20 right-6 z-40 bg-slate-900/95 backdrop-blur-md text-white px-4 py-2.5 rounded-2xl shadow-2xl border border-slate-700 text-xs font-medium flex items-center gap-3">
          <Database className="w-4 h-4 text-orange-400 shrink-0" />
          <div>
            <div className="font-bold flex items-center gap-2">
              <span>Size: {articleSizeInfo.kb} KB</span>
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${articleSizeInfo.isSafe ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-red-500/20 text-red-400 border border-red-500/30'}`}>
                {articleSizeInfo.isSafe ? 'Safe (< 1 MB)' : 'Limit Exceeded!'}
              </span>
            </div>
            <div className="text-[10px] text-slate-400">Firestore 1MB Max Document Limit</div>
          </div>
        </div>

        {/* Minimal Admin Header Bar */}
        <header className="bg-slate-900 text-white px-4 py-3 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsEditingBlog(false)}
              className="inline-flex items-center gap-2 text-xs font-bold text-slate-300 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Admin Dashboard</span>
            </button>
            <span className="text-slate-600">|</span>
            <span className="text-xs font-bold text-orange-400">Anwar&apos;s Article Studio</span>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs font-bold text-slate-300">Status:</span>
            <select
              value={blogStatus}
              onChange={(e) => setBlogStatus(e.target.value as any)}
              className="px-3 py-1 bg-slate-800 rounded-lg text-xs font-bold text-white border border-slate-700"
            >
              <option value="published">Published</option>
              <option value="draft">Draft</option>
            </select>
          </div>
        </header>

        <main className="flex-1 max-w-full px-[10px] py-6 space-y-6">
          <div className="bg-white rounded-3xl border border-slate-200 p-4 sm:p-8 shadow-sm space-y-8">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="space-y-1">
                <h1 className="text-2xl font-extrabold text-black tracking-tight">
                  {editingBlogId ? 'WordPress Visual Editor (Edit Post)' : 'WordPress Visual Editor (New Post)'}
                </h1>
                <p className="text-black text-sm font-medium">
                  Select text manually or click any block to format. Active formatting icons glow orange and can be clicked again to undo!
                </p>
              </div>

              <button
                type="button"
                onClick={() => setShowPostSettings(!showPostSettings)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-black font-bold rounded-xl text-xs inline-flex items-center gap-2 transition-colors border border-slate-300 shadow-sm"
              >
                <Settings className="w-4 h-4 text-orange-600" />
                <span>{showPostSettings ? '▲ Hide Post Settings' : '▼ Show Post Settings (Title, Slug, Category, Image)'}</span>
              </button>
            </div>

            {/* Collapsible Post Settings Section */}
            {showPostSettings && (
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-xs font-bold text-black mb-2">Article Title *</label>
                    <input
                      type="text"
                      required
                      value={blogTitle}
                      onChange={(e) => handleTitleChange(e.target.value)}
                      placeholder="उदा: Top 10 AI Tools in Hindi"
                      className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm text-black font-medium focus:ring-2 focus:ring-orange-600/20"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-black mb-2">URL Slug (Auto-generated) *</label>
                    <input
                      type="text"
                      required
                      value={blogSlug}
                      onChange={(e) => {
                        setBlogSlug(e.target.value);
                        setIsSlugManual(true);
                      }}
                      placeholder="top-ai-tools-in-hindi"
                      className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-mono text-orange-600 font-bold"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-1 gap-6">
                  <div>
                    <label className="block text-xs font-bold text-black mb-2">Category *</label>
                    {!isNewCategoryMode ? (
                      <div className="flex gap-2">
                        <select
                          value={blogCategory}
                          onChange={(e) => {
                            if (e.target.value === '__new__') {
                              setIsNewCategoryMode(true);
                            } else {
                              setBlogCategory(e.target.value);
                            }
                          }}
                          className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm text-black font-medium"
                        >
                          {customCategories.map(cat => (
                            <option key={cat} value={cat}>{cat}</option>
                          ))}
                          <option value="__new__">+ Add New Category...</option>
                        </select>
                      </div>
                    ) : (
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={newCategoryName}
                          onChange={(e) => setNewCategoryName(e.target.value)}
                          placeholder="Enter new category name..."
                          className="w-full px-4 py-3 bg-white border border-orange-300 rounded-xl text-sm text-black font-medium focus:ring-2 focus:ring-orange-600/20"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            if (newCategoryName.trim()) {
                              const name = newCategoryName.trim();
                              if (!customCategories.includes(name)) {
                                setCustomCategories([...customCategories, name]);
                              }
                              setBlogCategory(name);
                              setIsNewCategoryMode(false);
                              setNewCategoryName('');
                            }
                          }}
                          className="px-4 py-3 bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-xl text-xs shrink-0"
                        >
                          Add
                        </button>
                        <button
                          type="button"
                          onClick={() => setIsNewCategoryMode(false)}
                          className="px-3 py-3 bg-slate-200 hover:bg-slate-300 text-black font-bold rounded-xl text-xs shrink-0"
                        >
                          Cancel
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Featured Image Section */}
                <div className="space-y-3 bg-white border border-slate-200 p-6 rounded-2xl">
                  <label className="block text-xs font-bold text-black">Featured Image (Local Upload or URL)</label>
                  <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
                    <div className="w-32 h-20 relative rounded-xl overflow-hidden bg-slate-200 border border-slate-300 shrink-0">
                      <Image
                        src={blogImage}
                        alt="Featured preview"
                        fill
                        sizes="128px"
                        className="object-cover"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                    <div className="space-y-2 flex-1 w-full">
                      <div className="flex items-center gap-2">
                        <input
                          type="file"
                          accept="image/*"
                          ref={featuredImageInputRef}
                          onChange={handleFeaturedImageUpload}
                          className="hidden"
                          id="featuredImgUploadInput"
                        />
                        <label
                          htmlFor="featuredImgUploadInput"
                          className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-xs font-bold cursor-pointer inline-flex items-center gap-1.5 shadow-sm"
                        >
                          <Upload className="w-3.5 h-3.5" />
                          <span>Upload Featured Image</span>
                        </label>
                      </div>
                      <input
                        type="text"
                        value={blogImage.startsWith('data:image/') ? (blogImageSlug ? `[Image Slug: ${blogImageSlug}] (Local Base64 Upload)` : '[Local Uploaded Base64 Image]') : blogImage}
                        onChange={(e) => {
                          const val = e.target.value;
                          if (!val.startsWith('[') && !val.startsWith('📁')) {
                            setBlogImage(val);
                          }
                        }}
                        placeholder="Or paste image URL here..."
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs text-black font-medium font-mono"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
                    <div>
                      <label className="block text-xs font-bold text-black mb-1">Featured Image Alt Text (SEO)</label>
                      <input
                        type="text"
                        value={blogImageAlt}
                        onChange={(e) => setBlogImageAlt(e.target.value)}
                        placeholder="उदा: AI tutorial banner image alt text"
                        className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-black font-medium"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-black mb-1">Featured Image Slug / Identifier</label>
                      <input
                        type="text"
                        value={blogImageSlug}
                        onChange={(e) => setBlogImageSlug(e.target.value)}
                        placeholder="उदा: ai-tutorial-banner-slug"
                        className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-mono text-black font-medium"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-black mb-2">SEO Meta Description (RankMath Style)</label>
                  <textarea
                    rows={2}
                    value={blogMetaDescription}
                    onChange={(e) => setBlogMetaDescription(e.target.value)}
                    placeholder="Enter RankMath style meta description for search engines and social sharing..."
                    className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm text-black font-medium"
                  />
                </div>

                <div className="flex items-center gap-3 pt-2">
                  <input
                    type="checkbox"
                    id="blogNoIndexCheck"
                    checked={blogNoIndex}
                    onChange={(e) => setBlogNoIndex(e.target.checked)}
                    className="w-4 h-4 text-orange-600 rounded border-slate-300 focus:ring-orange-500"
                  />
                  <label htmlFor="blogNoIndexCheck" className="text-xs font-bold text-black cursor-pointer">
                    🚫 NoIndex / NoFollow (Hide this tutorial from Google search index & robots)
                  </label>
                </div>
              </div>
            )}

            {/* AI Supervisor Widget */}
            <div className="bg-gradient-to-br from-orange-600 to-amber-600 text-white rounded-2xl p-6 shadow-lg space-y-6">
              <div className="flex items-center gap-2 font-bold text-lg">
                <Bot className="w-6 h-6 text-amber-200" />
                <span>AI Supervisor & SEO Auditor</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-white/90">Generate Post from Keyword / Title</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={aiKeyword}
                      onChange={(e) => setAiKeyword(e.target.value)}
                      placeholder="उदा: ChatGPT se time table kaise banaye"
                      className="w-full px-4 py-2.5 bg-white/10 backdrop-blur-md border border-white/30 rounded-xl text-xs text-white placeholder-white/70 font-medium focus:outline-none"
                    />
                    <button
                      type="button"
                      disabled={isGeneratingAi}
                      onClick={handleAiGeneratePost}
                      className="px-5 py-2.5 bg-white text-orange-600 hover:bg-orange-50 font-bold rounded-xl text-xs shadow-md transition-colors shrink-0 disabled:opacity-50"
                    >
                      {isGeneratingAi ? 'Generating...' : 'Generate Post'}
                    </button>
                  </div>
                </div>

                <div className="space-y-2 flex flex-col justify-end">
                  <label className="block text-xs font-bold text-white/90">Analyze & Optimize Existing Article</label>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      disabled={isAnalyzingAi}
                      onClick={handleAiAnalyzePost}
                      className="flex-1 py-2.5 bg-black/30 hover:bg-black/40 text-white border border-white/30 font-bold rounded-xl text-xs shadow-md transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      <Award className="w-4 h-4 text-amber-200" />
                      <span>{isAnalyzingAi ? 'Analyzing...' : 'Analyze SEO'}</span>
                    </button>
                    <button
                      type="button"
                      disabled={isOptimizingAi}
                      onClick={handleAiOptimizePost}
                      className="flex-1 py-2.5 bg-white text-orange-600 hover:bg-orange-50 font-bold rounded-xl text-xs shadow-md transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      <Sparkles className="w-4 h-4 text-orange-600" />
                      <span>{isOptimizingAi ? 'Optimizing...' : 'Optimize Content'}</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Analysis Results Box */}
              {analysisResult && (
                <div className="mt-6 p-6 bg-white/10 backdrop-blur-md border border-white/25 rounded-2xl space-y-4 text-white">
                  <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/20 pb-4">
                    <div>
                      <div className="text-xs text-amber-200 font-bold">SEO Score</div>
                      <div className="text-2xl font-extrabold">{analysisResult.seoScore} / 100</div>
                    </div>
                    <div>
                      <div className="text-xs text-amber-200 font-bold">E-E-A-T Score</div>
                      <div className="text-2xl font-extrabold">{analysisResult.eeatScore} / 100</div>
                    </div>
                    <div>
                      <div className="text-xs text-amber-200 font-bold">Ranking Chances</div>
                      <div className="text-xl font-bold">{analysisResult.rankingChances}</div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="text-xs font-bold text-amber-200 flex items-center gap-1.5">
                      <AlertTriangle className="w-4 h-4" />
                      <span>Identified Mistakes & Recommendations:</span>
                    </div>
                    <ul className="list-disc pl-5 space-y-1 text-xs text-white/90">
                      {analysisResult.mistakes.map((m, idx) => (
                        <li key={idx}>{m}</li>
                      ))}
                    </ul>
                  </div>

                  <div className="space-y-1 pt-2 border-t border-white/20">
                    <div className="text-xs font-bold text-amber-200">Competitor Comparison & Outranking Strategy:</div>
                    <p className="text-xs text-white/90 leading-relaxed">{analysisResult.competitorComparison}</p>
                  </div>
                </div>
              )}
            </div>

            {/* WordPress Code Importer Widget */}
            <div className="bg-orange-50/70 border border-orange-200 rounded-2xl p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-black font-bold text-sm">
                  <Code className="w-4 h-4 text-orange-600" />
                  <span>WordPress Code Importer (Gutenberg / HTML)</span>
                </div>
                <button
                  type="button"
                  onClick={() => setShowWpImporter(!showWpImporter)}
                  className="px-3.5 py-1.5 bg-orange-600 text-white rounded-lg text-xs font-bold hover:bg-orange-700 transition-colors"
                >
                  {showWpImporter ? 'Hide Importer' : 'Open Importer'}
                </button>
              </div>

              {showWpImporter && (
                <div className="space-y-3 pt-2">
                  <p className="text-xs text-black leading-relaxed font-medium">
                    अपने पुराने WordPress पोस्ट का HTML या Gutenberg ब्लॉक कोड यहाँ पेस्ट करें। &ldquo;Convert &amp; Insert&rdquo; पर क्लिक करते ही यह विजुअल एडिटर में आ जाएगा।
                  </p>
                  <textarea
                    rows={15}
                    value={wpRawCode}
                    onChange={(e) => setWpRawCode(e.target.value)}
                    placeholder="Paste WordPress post code here (supports 5000+ words)..."
                    className="w-full p-4 bg-white border border-orange-200 rounded-xl text-xs font-mono text-black font-medium focus:ring-2 focus:ring-orange-600/20"
                  />
                  <button
                    type="button"
                    onClick={handleConvertWpCode}
                    className="px-5 py-2.5 bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-xl text-xs inline-flex items-center gap-2 shadow-sm"
                  >
                    <Wand2 className="w-3.5 h-3.5" />
                    <span>Convert & Insert into Editor</span>
                  </button>
                </div>
              )}
            </div>

            <form onSubmit={handleSaveBlog} className="space-y-6">
              {/* ========================================== */}
              {/* CONTINUOUS VISUAL EDITOR & STICKY TOOLBAR */}
              {/* ========================================== */}
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <label className="text-sm font-extrabold text-black">WordPress Visual Editor (Fully Editable Document)</label>
                  
                  <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-xl">
                    <button
                      type="button"
                      onClick={() => setEditorMode('visual')}
                      className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                        editorMode === 'visual' ? 'bg-white text-orange-600 shadow-sm' : 'text-black hover:text-orange-600'
                      }`}
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Visual Editor (Normal)</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditorMode('html')}
                      className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                        editorMode === 'html' ? 'bg-white text-orange-600 shadow-sm' : 'text-black hover:text-orange-600'
                      }`}
                    >
                      <Code2 className="w-3.5 h-3.5" />
                      <span>HTML Code Mode</span>
                    </button>
                  </div>
                </div>

                {/* Sticky Formatting Toolbar with Active Orange Highlights & Toggle/Undo */}
                <div className="sticky top-12 z-20 bg-white/95 backdrop-blur-md p-3.5 rounded-2xl border border-slate-200 shadow-lg flex flex-wrap items-center gap-2">
                  <button type="button" onClick={() => applyFormatting('undo')} className="px-3 py-1.5 bg-slate-100 hover:bg-orange-50 hover:text-orange-600 rounded-lg text-xs font-bold text-black transition-colors flex items-center gap-1" title="Undo">
                    <Undo className="w-3.5 h-3.5" /> Undo
                  </button>
                  <button type="button" onClick={() => applyFormatting('redo')} className="px-3 py-1.5 bg-slate-100 hover:bg-orange-50 hover:text-orange-600 rounded-lg text-xs font-bold text-black transition-colors flex items-center gap-1" title="Redo">
                    <Redo className="w-3.5 h-3.5" /> Redo
                  </button>
                  <span className="text-slate-300">|</span>
                  <button
                    type="button"
                    onClick={() => applyBlockFormatting('H1')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors flex items-center gap-1 ${
                      activeBlockType === 'H1'
                        ? 'bg-orange-100 text-orange-700 border border-orange-300 font-extrabold shadow-sm'
                        : 'bg-slate-100 text-black hover:bg-orange-50 hover:text-orange-600'
                    }`}
                  >
                    <Heading1 className="w-3.5 h-3.5" /> H1
                  </button>
                  <button
                    type="button"
                    onClick={() => applyBlockFormatting('H2')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors flex items-center gap-1 ${
                      activeBlockType === 'H2'
                        ? 'bg-orange-100 text-orange-700 border border-orange-300 font-extrabold shadow-sm'
                        : 'bg-slate-100 text-black hover:bg-orange-50 hover:text-orange-600'
                    }`}
                  >
                    <Heading2 className="w-3.5 h-3.5" /> H2
                  </button>
                  <button
                    type="button"
                    onClick={() => applyBlockFormatting('H3')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors flex items-center gap-1 ${
                      activeBlockType === 'H3'
                        ? 'bg-orange-100 text-orange-700 border border-orange-300 font-extrabold shadow-sm'
                        : 'bg-slate-100 text-black hover:bg-orange-50 hover:text-orange-600'
                    }`}
                  >
                    <Heading3 className="w-3.5 h-3.5" /> H3
                  </button>
                  <span className="text-slate-300">|</span>
                  <button
                    type="button"
                    onClick={() => applyBlockFormatting('P')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                      activeBlockType === 'P'
                        ? 'bg-orange-100 text-orange-700 border border-orange-300 font-extrabold shadow-sm'
                        : 'bg-slate-100 text-black hover:bg-orange-50 hover:text-orange-600'
                    }`}
                  >
                    Paragraph
                  </button>
                  <button
                    type="button"
                    onClick={() => applyBlockFormatting('bold')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors flex items-center gap-1 ${
                      activeBold
                        ? 'bg-orange-100 text-orange-700 border border-orange-300 font-extrabold shadow-sm'
                        : 'bg-slate-100 text-black hover:bg-orange-50 hover:text-orange-600'
                    }`}
                  >
                    <Bold className="w-3.5 h-3.5" /> Bold
                  </button>
                  <button
                    type="button"
                    onClick={() => applyBlockFormatting('italic')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors flex items-center gap-1 ${
                      activeItalic
                        ? 'bg-orange-100 text-orange-700 border border-orange-300 font-extrabold shadow-sm'
                        : 'bg-slate-100 text-black hover:bg-orange-50 hover:text-orange-600'
                    }`}
                  >
                    <Italic className="w-3.5 h-3.5" /> Italic
                  </button>
                  <span className="text-slate-300">|</span>
                  <button
                    type="button"
                    onClick={handleInsertLink}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors flex items-center gap-1 ${
                      activeLink
                        ? 'bg-orange-100 text-orange-700 border border-orange-300 font-extrabold shadow-sm'
                        : 'bg-slate-100 text-black hover:bg-orange-50 hover:text-orange-600'
                    }`}
                  >
                    <LinkIcon className="w-3.5 h-3.5" /> Insert Link
                  </button>
                  <button type="button" onClick={insertList} className="px-3 py-1.5 bg-slate-100 hover:bg-orange-50 hover:text-orange-600 rounded-lg text-xs font-bold text-black transition-colors flex items-center gap-1">
                    <List className="w-3.5 h-3.5" /> Insert List
                  </button>
                  <button type="button" onClick={insertTable} className="px-3 py-1.5 bg-slate-100 hover:bg-orange-50 hover:text-orange-600 rounded-lg text-xs font-bold text-black transition-colors flex items-center gap-1">
                    <Table className="w-3.5 h-3.5" /> Insert Table
                  </button>
                  <span className="text-slate-300">|</span>
                  <input
                    type="file"
                    accept="image/*"
                    ref={contentImageInputRef}
                    onChange={handleContentImageUpload}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (visualContentRef.current) {
                        const sel = window.getSelection();
                        if (sel && sel.rangeCount > 0 && visualContentRef.current.contains(sel.getRangeAt(0).commonAncestorContainer)) {
                          savedRangeRef.current = sel.getRangeAt(0).cloneRange();
                        }
                      }
                      contentImageInputRef.current?.click();
                    }}
                    className="px-3.5 py-1.5 bg-orange-600 hover:bg-orange-700 text-white rounded-lg text-xs font-bold shadow-md inline-flex items-center gap-1.5 cursor-pointer transition-colors"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>+ Insert Image</span>
                  </button>
                  <button
                    type="button"
                    onClick={insertYouTubeEmbed}
                    className="px-3.5 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-bold shadow-md inline-flex items-center gap-1.5 transition-colors"
                  >
                    <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>
                    <span>+ YouTube</span>
                  </button>
                  <input
                    type="file"
                    accept="video/mp4"
                    ref={contentVideoInputRef}
                    onChange={handleContentVideoUpload}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (visualContentRef.current) {
                        const sel = window.getSelection();
                        if (sel && sel.rangeCount > 0 && visualContentRef.current.contains(sel.getRangeAt(0).commonAncestorContainer)) {
                          savedRangeRef.current = sel.getRangeAt(0).cloneRange();
                        }
                      }
                      contentVideoInputRef.current?.click();
                    }}
                    className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold shadow-md inline-flex items-center gap-1.5 cursor-pointer transition-colors"
                  >
                    <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24"><path d="M17 10.5V7c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.55 0 1-.45 1-1v-3.5l4 4v-11l-4 4z"/></svg>
                    <span>+ MP4 Video</span>
                  </button>
                </div>

                {/* Continuous Visual Editor or HTML Code Mode */}
                {editorMode === 'visual' ? (
                  <div
                    ref={visualContentRef}
                    contentEditable={true}
                    suppressContentEditableWarning={true}
                    onClick={handleVisualClick}
                    onKeyUp={() => {
                      const sel = window.getSelection();
                      if (sel && sel.rangeCount > 0) {
                        let node = sel.anchorNode;
                        if (node && node.nodeType === Node.TEXT_NODE) node = node.parentNode;
                        if (node && node instanceof HTMLElement) {
                          const block = node.closest('p, h1, h2, h3, blockquote, ul, li, table, tr, div');
                          if (block) updateActiveStates(block as HTMLElement);
                        }
                      }
                    }}
                    className="w-full min-h-[700px] p-6 sm:p-10 bg-slate-50 border border-slate-200 rounded-2xl text-black font-medium focus:outline-none focus:ring-2 focus:ring-orange-600/20 prose max-w-none [&>*]:cursor-text [&>*]:select-text [&>h1]:text-3xl [&>h1]:font-extrabold [&>h1]:mt-6 [&>h1]:mb-4 [&>h2]:text-2xl [&>h2]:font-bold [&>h2]:mt-6 [&>h2]:mb-3 [&>h3]:text-xl [&>h3]:font-semibold [&>h3]:mt-4 [&>h3]:mb-2 [&>p]:mb-6 [&>p]:leading-relaxed [&>p]:text-lg [&>img]:w-full [&>img]:rounded-2xl [&>img]:my-6 [&>img]:shadow-md [&>img]:object-cover"
                  />
                ) : (
                  <textarea
                    rows={35}
                    value={blogContent}
                    onChange={(e) => setBlogContent(e.target.value)}
                    className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-mono text-black font-medium focus:ring-2 focus:ring-orange-600/20"
                  />
                )}
              </div>

              {/* FAQ Builder Section */}
              <div className="space-y-4 bg-orange-50/50 border border-orange-200 p-6 rounded-2xl">
                <div className="flex items-center gap-2 text-black font-bold text-sm">
                  <HelpCircle className="w-4 h-4 text-orange-600" />
                  <span>FAQ Builder & Schema Generator (FAQ Schema)</span>
                </div>
                <p className="text-xs text-black font-medium">Add frequently asked questions at the end of the article. They will automatically be formatted as toggle accordions on the frontend and include Google FAQ JSON-LD Schema.</p>

                <div className="space-y-3">
                  <input
                    type="text"
                    value={newFaqQ}
                    onChange={(e) => setNewFaqQ(e.target.value)}
                    placeholder="FAQ Question (उदा: What is ChatGPT in Hindi?)"
                    className="w-full px-4 py-2.5 bg-white border border-orange-200 rounded-xl text-xs text-black font-medium"
                  />
                  <textarea
                    rows={2}
                    value={newFaqA}
                    onChange={(e) => setNewFaqA(e.target.value)}
                    placeholder="FAQ Answer..."
                    className="w-full px-4 py-2.5 bg-white border border-orange-200 rounded-xl text-xs text-black font-medium"
                  />
                  <button
                    type="button"
                    onClick={handleAddFaq}
                    className="px-5 py-2 bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-xl text-xs shadow-sm transition-colors"
                  >
                    + Add FAQ & Generate Schema Block
                  </button>
                </div>

                {faqs.length > 0 && (
                  <div className="space-y-2 pt-3 border-t border-orange-200">
                    <div className="text-xs font-bold text-black">Added FAQs ({faqs.length}):</div>
                    {faqs.map((f, idx) => (
                      <div key={idx} className="bg-white p-3 rounded-xl border border-orange-200 flex items-center justify-between gap-4 text-xs">
                        <div>
                          <strong className="text-black">{f.question}</strong>
                          <p className="text-slate-600 line-clamp-1">{f.answer}</p>
                        </div>
                        <button type="button" onClick={() => handleDeleteFaq(idx)} className="text-red-600 hover:text-red-800 font-bold shrink-0">
                          Delete
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end gap-4 pt-6 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsEditingBlog(false)}
                  className="px-6 py-3 text-xs font-bold text-black hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingPost}
                  className="px-8 py-3 bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-xl text-xs shadow-md inline-flex items-center gap-2 disabled:opacity-75"
                >
                  {isSavingPost ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Saving & Publishing...</span>
                    </>
                  ) : (
                    <span>Save & Publish to Firebase</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </main>

        {/* Image Alt Text & Slug Edit Modal */}
        {showImageModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-6 shadow-2xl border border-slate-200">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div className="flex items-center gap-2 font-bold text-black text-lg">
                  <ImageIcon className="w-5 h-5 text-orange-600" />
                  <span>Edit Image SEO & Alt Text</span>
                </div>
                <button
                  onClick={() => setShowImageModal(false)}
                  className="p-2 hover:bg-slate-100 rounded-xl text-slate-500 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="h-40 relative rounded-xl overflow-hidden bg-slate-100 border border-slate-200">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={selectedImageEl?.src || ''}
                      alt="Preview"
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                  <div className="flex items-center justify-between pt-1">
                    <span className="text-xs font-bold text-slate-700">Replace Image File:</span>
                    <input
                      type="file"
                      ref={replaceImageInputRef}
                      className="hidden"
                      accept="image/*"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file || !selectedImageEl) return;
                        setIsReplacingImage(true);
                        try {
                          const reader = new FileReader();
                          reader.onload = async (event) => {
                            const resBase64 = event.target?.result as string;
                            if (resBase64) {
                              selectedImageEl.src = resBase64;
                              if (visualContentRef.current) setBlogContent(visualContentRef.current.innerHTML);
                              showNotify('Image replaced successfully at original high quality! Alt text & slug preserved.');
                            }
                            setIsReplacingImage(false);
                          };
                          reader.readAsDataURL(file);
                        } catch (err) {
                          console.error(err);
                          setIsReplacingImage(false);
                          alert('Failed to replace image.');
                        }
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => replaceImageInputRef.current?.click()}
                      disabled={isReplacingImage}
                      className="px-3.5 py-1.5 bg-slate-900 hover:bg-black text-white font-bold rounded-xl text-xs inline-flex items-center gap-1.5 transition-colors disabled:opacity-50 shadow-sm"
                    >
                      {isReplacingImage ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
                      <span>Choose New Image File</span>
                    </button>
                  </div>
                  <p className="text-[10px] text-slate-500">Replacing image updates the visual graphic while keeping your Alt Text and Slug 100% unchanged.</p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-black mb-1.5">Image Alt Text (for SEO & Accessibility)</label>
                  <input
                    type="text"
                    value={editImageAlt}
                    onChange={(e) => setEditImageAlt(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-black focus:ring-2 focus:ring-orange-600/20"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-black mb-1.5">Image URL Slug / Identifier</label>
                  <input
                    type="text"
                    value={editImageSlug}
                    onChange={(e) => setEditImageSlug(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-black font-medium focus:ring-2 focus:ring-orange-600/20"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    if (selectedImageEl && confirm('Are you sure you want to delete this image?')) {
                      selectedImageEl.remove();
                      if (visualContentRef.current) setBlogContent(visualContentRef.current.innerHTML);
                      setShowImageModal(false);
                      showNotify('Image deleted.');
                    }
                  }}
                  className="px-4 py-2.5 bg-red-50 hover:bg-red-100 text-red-600 font-bold rounded-xl text-xs transition-colors"
                >
                  Delete Image
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowImageModal(false)}
                    className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-black font-bold rounded-xl text-xs transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (selectedImageEl) {
                        selectedImageEl.setAttribute('alt', editImageAlt);
                        selectedImageEl.setAttribute('data-img-slug', editImageSlug);
                        if (visualContentRef.current) setBlogContent(visualContentRef.current.innerHTML);
                        setShowImageModal(false);
                        showNotify('Image alt text & slug updated successfully!');
                      }
                    }}
                    className="px-5 py-2.5 bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-xl text-xs shadow-sm transition-colors"
                  >
                    Save Image Changes
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Video Management, Slug Editing, Replacement & Deletion Modal */}
        {showVideoModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-5 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div className="flex items-center gap-2.5 font-bold text-black text-lg">
                  <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
                    <Video className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="leading-tight">Manage MP4 Video</h3>
                    <p className="text-xs text-slate-500 font-medium">Replace, change slug, or delete video in Firebase</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowVideoModal(false)}
                  className="p-2 hover:bg-slate-100 rounded-xl text-slate-500 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Video Player Preview */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-black">Video Player Preview</label>
                <div className="bg-black rounded-2xl overflow-hidden aspect-video relative flex items-center justify-center border border-slate-800 shadow-inner">
                  {isUploadingReplacementVideo ? (
                    <div className="flex flex-col items-center justify-center gap-2 text-white">
                      <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
                      <span className="text-xs font-bold">Uploading & Saving to Firebase...</span>
                    </div>
                  ) : editVideoSrc ? (
                    <video controls src={editVideoSrc} className="w-full h-full object-contain" preload="metadata" />
                  ) : (
                    <div className="text-center text-slate-400 text-xs p-4 font-medium flex flex-col items-center gap-2">
                      <Video className="w-8 h-8 text-slate-600" />
                      <span>Video loaded from Firebase storage</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Storage Status Banner */}
              {editVideoMediaId ? (
                <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-3 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 font-bold text-emerald-800">
                    <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Saved Locally in Firebase Database</span>
                  </div>
                  <span className="font-mono text-[10px] bg-emerald-100 px-2.5 py-1 rounded-lg text-emerald-800 font-bold truncate max-w-[150px]">
                    {editVideoMediaId}
                  </span>
                </div>
              ) : editVideoSrc && editVideoSrc.startsWith('http') ? (
                <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-2 font-bold text-amber-800">
                    <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>External WordPress Video URL</span>
                  </div>
                  <button
                    type="button"
                    onClick={handleSaveExternalVideoToFirebase}
                    disabled={isUploadingReplacementVideo}
                    className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-bold text-[11px] transition-colors shadow-sm disabled:opacity-50"
                  >
                    {isUploadingReplacementVideo ? 'Saving...' : 'Save to Firebase Now'}
                  </button>
                </div>
              ) : null}

              {/* Slug & Identifier Input */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-black">
                  Video Slug / Identifier (SEO URL Slug) *
                </label>
                <input
                  type="text"
                  required
                  value={editVideoSlug}
                  onChange={(e) => setEditVideoSlug(e.target.value)}
                  placeholder="tutorial-demo-video"
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-black font-medium focus:ring-2 focus:ring-orange-600/20"
                />
                <p className="text-[11px] text-slate-500 font-medium">
                  Ye slug video element ko identify karta hai and SEO/schema attributes me save hota hai.
                </p>
              </div>

              {/* Video Title / Caption Input */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-black">
                  Video Title / Caption (Optional)
                </label>
                <input
                  type="text"
                  value={editVideoTitle}
                  onChange={(e) => setEditVideoTitle(e.target.value)}
                  placeholder="Demo Tutorial Video Clip"
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-black font-medium focus:ring-2 focus:ring-orange-600/20"
                />
              </div>

              {/* Replace Video Section */}
              <div className="space-y-3 pt-3 border-t border-slate-100">
                <div className="flex items-center justify-between">
                  <div className="text-xs font-extrabold text-black flex items-center gap-1.5">
                    <RefreshCw className="w-3.5 h-3.5 text-orange-600" />
                    <span>Replace Video (नया MP4 बदलें)</span>
                  </div>
                  <span className="text-[10px] text-slate-400 font-medium">Auto-saves to Firebase</span>
                </div>

                <input
                  type="file"
                  accept="video/mp4,video/*"
                  ref={replaceVideoInputRef}
                  onChange={handleReplaceVideoFile}
                  className="hidden"
                  id="replaceVideoFileField"
                />
                
                <button
                  type="button"
                  onClick={() => replaceVideoInputRef.current?.click()}
                  disabled={isUploadingReplacementVideo}
                  className="w-full px-4 py-2.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold rounded-xl text-xs border border-indigo-200 inline-flex items-center justify-center gap-2 transition-colors disabled:opacity-50 shadow-sm"
                >
                  <Upload className="w-4 h-4" />
                  <span>Choose New MP4 File from Computer</span>
                </button>

                <div className="flex gap-2">
                  <input
                    type="url"
                    value={replaceVideoUrlInput}
                    onChange={(e) => setReplaceVideoUrlInput(e.target.value)}
                    placeholder="Or paste direct MP4 URL to download..."
                    className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-black focus:ring-2 focus:ring-orange-600/20"
                  />
                  <button
                    type="button"
                    onClick={handleReplaceWithVideoUrl}
                    disabled={isUploadingReplacementVideo || !replaceVideoUrlInput.trim()}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold disabled:opacity-50 transition-colors shrink-0"
                  >
                    Fetch & Store
                  </button>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={handleDeleteVideo}
                  className="px-4 py-2.5 bg-red-50 hover:bg-red-100 text-red-600 font-bold rounded-xl text-xs inline-flex items-center gap-1.5 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Delete Video</span>
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowVideoModal(false)}
                    className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-black font-bold rounded-xl text-xs transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveVideoModalChanges}
                    className="px-5 py-2.5 bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-xl text-xs shadow-sm transition-colors"
                  >
                    Save Changes
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Edit Clicked Link Popup Modal */}
        {showEditLinkModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-6 shadow-2xl border border-slate-200">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div className="flex items-center gap-2 font-bold text-black text-lg">
                  <LinkIcon className="w-5 h-5 text-orange-600" />
                  <span>Edit Inserted Link</span>
                </div>
                <button
                  onClick={() => setShowEditLinkModal(false)}
                  className="p-2 hover:bg-slate-100 rounded-xl text-slate-500 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-black mb-1.5">Link URL (Target)</label>
                  <input
                    type="url"
                    value={editLinkUrl}
                    onChange={(e) => setEditLinkUrl(e.target.value)}
                    placeholder="https://example.com"
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-black font-medium focus:ring-2 focus:ring-orange-600/20"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-black mb-1.5">Link Text (Anchor Text)</label>
                  <input
                    type="text"
                    value={editLinkText}
                    onChange={(e) => setEditLinkText(e.target.value)}
                    placeholder="Link text..."
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-black focus:ring-2 focus:ring-orange-600/20"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    if (selectedLinkEl && confirm('Are you sure you want to remove this link (keep text)?')) {
                      const textContent = selectedLinkEl.textContent || '';
                      const textNode = document.createTextNode(textContent);
                      selectedLinkEl.replaceWith(textNode);
                      if (visualContentRef.current) setBlogContent(visualContentRef.current.innerHTML);
                      setShowEditLinkModal(false);
                      showNotify('Link removed successfully.');
                    }
                  }}
                  className="px-4 py-2.5 bg-red-50 hover:bg-red-100 text-red-600 font-bold rounded-xl text-xs transition-colors"
                >
                  Remove Link
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowEditLinkModal(false)}
                    className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-black font-bold rounded-xl text-xs transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      /* eslint-disable react-hooks/immutability */
                      if (selectedLinkEl) {
                        selectedLinkEl.setAttribute('href', editLinkUrl);
                        selectedLinkEl.textContent = editLinkText;
                        if (visualContentRef.current) setBlogContent(visualContentRef.current.innerHTML);
                        setShowEditLinkModal(false);
                        showNotify('Link updated successfully!');
                      }
                      /* eslint-enable react-hooks/immutability */
                    }}
                    className="px-5 py-2.5 bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-xl text-xs shadow-sm transition-colors"
                  >
                    Save Link Changes
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Link Addition Popup Modal */}
        {showLinkAddModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-6 shadow-2xl border border-slate-200">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div className="flex items-center gap-2 font-bold text-black text-lg">
                  <LinkIcon className="w-5 h-5 text-orange-600" />
                  <span>Insert Hyperlink (Orange Highlight)</span>
                </div>
                <button
                  onClick={() => setShowLinkAddModal(false)}
                  className="p-2 hover:bg-slate-100 rounded-xl text-slate-500 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleConfirmLinkModal} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-black mb-1.5">Target URL (Link)</label>
                  <input
                    type="url"
                    required
                    value={linkModalUrl}
                    onChange={(e) => setLinkModalUrl(e.target.value)}
                    placeholder="https://example.com"
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-black font-medium focus:ring-2 focus:ring-orange-600/20"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-black mb-1.5">Link Text (Anchor Text)</label>
                  <input
                    type="text"
                    required
                    value={linkModalText}
                    onChange={(e) => setLinkModalText(e.target.value)}
                    placeholder="Click here or selected text"
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-black focus:ring-2 focus:ring-orange-600/20"
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setShowLinkAddModal(false)}
                    className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-black font-bold rounded-xl text-xs transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2.5 bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-xl text-xs shadow-sm transition-colors"
                  >
                    Insert Link
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col">
      {/* Minimal Admin Header Bar */}
      <header className="bg-slate-900 text-white px-4 py-3 flex items-center justify-between border-b border-slate-800">
        <div className="flex items-center gap-3">
          <Link href="/" className="inline-flex items-center gap-2 text-xs font-bold text-slate-300 hover:text-white transition-colors">
            <ArrowLeft className="w-4 h-4" />
            <span>View Live Site</span>
          </Link>
          <span className="text-slate-600">|</span>
          <span className="text-xs font-bold text-orange-400">Anwar&apos;s Admin Dashboard</span>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleClearCacheAndRefresh}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-bold inline-flex items-center gap-1.5 border border-slate-700"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Clear Cache</span>
          </button>
        </div>
      </header>

      <main className="flex-1 max-w-full px-[10px] py-6 space-y-6">
        {/* Admin Dashboard Header */}
        <div className="bg-gradient-to-r from-orange-600 to-amber-600 rounded-3xl p-6 sm:p-10 text-white shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-white/20 backdrop-blur-md rounded-full text-xs font-bold">
              <Database className="w-3.5 h-3.5 text-amber-200" />
              <span>Admin Management Hub (Anwar)</span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight">AI Tool Hindi Admin Panel</h1>
            <p className="text-white/90 text-sm max-w-xl font-medium">
              Manage all tutorials, categories, backups, and 24-hour caching seamlessly with Firebase synchronization.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={handleExportBackup}
              className="px-4 py-2.5 bg-white text-orange-600 hover:bg-orange-50 rounded-xl text-xs font-bold inline-flex items-center gap-2 shadow-md transition-all"
            >
              <Database className="w-4 h-4" />
              <span>Backup All Articles (JSON)</span>
            </button>

            <input
              type="file"
              accept=".json"
              ref={restoreFileInputRef}
              onChange={handleImportBackup}
              className="hidden"
              id="restoreJsonInput"
            />
            <label
              htmlFor="restoreJsonInput"
              className="px-4 py-2.5 bg-black/30 hover:bg-black/40 border border-white/35 text-white rounded-xl text-xs font-bold inline-flex items-center gap-2 cursor-pointer shadow-md transition-all"
            >
              <Upload className="w-4 h-4" />
              <span>Restore Backup</span>
            </label>

            <button
              onClick={handleMigrateAllImages}
              disabled={isMigratingImages}
              className="px-4 py-2.5 bg-black/40 hover:bg-black/50 border border-white/35 text-white rounded-xl text-xs font-bold inline-flex items-center gap-2 shadow-md transition-all disabled:opacity-50"
            >
              {isMigratingImages ? <Loader2 className="w-4 h-4 animate-spin text-amber-200" /> : <ImageIcon className="w-4 h-4 text-amber-200" />}
              <span>{isMigratingImages ? `Migrating... ${migrationProgress.current}%` : 'Migrate WP Images to Local'}</span>
            </button>
          </div>
          {isMigratingImages && (
            <div className="mt-3 bg-black/30 backdrop-blur-md px-4 py-2 rounded-xl text-xs text-white font-medium flex items-center justify-between">
              <span className="truncate max-w-[280px]">{migrationProgress.text}</span>
              <span className="font-extrabold text-amber-300">{migrationProgress.current}%</span>
            </div>
          )}
        </div>

        {/* Local Image Database Stats Screen */}
        {(() => {
          let totalImagesCount = 0;
          let localBase64ImagesCount = 0;
          let externalWpImagesCount = 0;

          posts.forEach(p => {
            if (p.image) {
              totalImagesCount++;
              if (p.image.startsWith('data:')) localBase64ImagesCount++;
              else externalWpImagesCount++;
            }
            if (p.content) {
              const matches = p.content.match(/<img[^>]+src="([^">]+)"/g);
              if (matches) {
                matches.forEach(m => {
                  totalImagesCount++;
                  if (m.includes('src="data:')) localBase64ImagesCount++;
                  else externalWpImagesCount++;
                });
              }
            }
          });

          const migrationPercentage = totalImagesCount > 0 ? Math.round((localBase64ImagesCount / totalImagesCount) * 100) : 100;

          return (
            <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6">
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-slate-100 pb-4">
                <div>
                  <h2 className="text-lg font-extrabold text-black flex items-center gap-2">
                    <Database className="w-5 h-5 text-orange-600" />
                    <span>Local Image Database & Vercel Migration Stats</span>
                  </h2>
                  <p className="text-xs text-slate-500 font-medium mt-1">
                    Real-time metrics showing how many images are securely stored locally (Base64) across your articles.
                  </p>
                </div>
                <button
                  onClick={handleMigrateAllImages}
                  disabled={isMigratingImages}
                  className="px-4 py-2.5 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-xs font-bold inline-flex items-center gap-2 shadow-sm transition-all disabled:opacity-50"
                >
                  {isMigratingImages ? <Loader2 className="w-4 h-4 animate-spin text-white" /> : <ImageIcon className="w-4 h-4 text-white" />}
                  <span>{isMigratingImages ? `Migrating Images (${migrationProgress.current}%)...` : 'Run WP Image Migration Again (100% Safe)'}</span>
                </button>
              </div>
              {isMigratingImages && (
                <div className="space-y-1.5 bg-slate-50 border border-slate-200 p-3 rounded-2xl">
                  <div className="flex items-center justify-between text-xs font-bold text-black">
                    <span>{migrationProgress.text}</span>
                    <span className="text-orange-600 font-extrabold">{migrationProgress.current}%</span>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                    <div className="bg-orange-600 h-2 rounded-full transition-all duration-300" style={{ width: `${migrationProgress.current}%` }}></div>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-1">
                  <div className="text-xs font-bold text-slate-500">Total Articles</div>
                  <div className="text-2xl font-extrabold text-black">{posts.length}</div>
                </div>
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-1">
                  <div className="text-xs font-bold text-slate-500">Total Images Tracked</div>
                  <div className="text-2xl font-extrabold text-black">{totalImagesCount}</div>
                </div>
                <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-5 space-y-1">
                  <div className="text-xs font-bold text-emerald-800">Locally Secured (Base64)</div>
                  <div className="text-2xl font-extrabold text-emerald-600">{localBase64ImagesCount}</div>
                </div>
                <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 space-y-1">
                  <div className="text-xs font-bold text-amber-800">External WP URLs</div>
                  <div className="text-2xl font-extrabold text-amber-600">{externalWpImagesCount}</div>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-black">
                  <span>Vercel Migration Readiness</span>
                  <span className={migrationPercentage === 100 ? 'text-emerald-600' : 'text-amber-600'}>{migrationPercentage}% Secured</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
                  <div className="bg-emerald-600 h-3 rounded-full transition-all duration-500" style={{ width: `${migrationPercentage}%` }}></div>
                </div>
                <p className="text-[11px] text-slate-500 italic">
                  Note: Running &quot;Migrate WP Images to Local&quot; multiple times is 100% safe and idempotent. Already converted Base64 images are skipped automatically, and exact WordPress slugs remain untouched.
                </p>
              </div>
            </div>
          );
        })()}

        {/* Unmigrated Media Alert Banner */}
        {unmigratedMedia.length > 0 && activeTab !== 'unmigrated' && (
          <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-300 rounded-3xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm">
            <div className="flex items-start gap-3">
              <div className="p-3 bg-amber-100 text-amber-800 rounded-2xl shrink-0 mt-0.5">
                <AlertTriangle className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <h3 className="text-sm font-extrabold text-black flex items-center gap-2">
                  <span>{unmigratedMedia.length} WordPress Media Files Pending Local Migration</span>
                  <span className="px-2 py-0.5 text-[10px] bg-amber-500 text-white rounded-full font-bold">Action Required</span>
                </h3>
                <p className="text-xs text-slate-600 mt-1 font-medium">
                  Ye images ya MP4 videos abhi bhi external WordPress URLs se link hain. Aap inhe dekh kar download kar sakte hain aur article me manually upload kar sakte hain.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2.5 shrink-0">
              <button
                onClick={() => setActiveTab('unmigrated')}
                className="px-4 py-2.5 bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold rounded-xl shadow-md transition-all flex items-center gap-1.5"
              >
                <Eye className="w-4 h-4" />
                <span>View Pending Media ({unmigratedMedia.length})</span>
              </button>
            </div>
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="flex flex-wrap items-center gap-3 border-b border-slate-200 pb-3">
          <button
            onClick={() => setActiveTab('tutorials')}
            className={`px-5 py-2.5 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === 'tutorials' ? 'bg-orange-600 text-white shadow-md' : 'bg-white text-black hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Tutorials Manager ({posts.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('unmigrated')}
            className={`px-5 py-2.5 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === 'unmigrated' ? 'bg-orange-600 text-white shadow-md' : 'bg-white text-black hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <AlertTriangle className={`w-4 h-4 ${unmigratedMedia.length > 0 ? 'text-amber-500' : 'text-slate-400'}`} />
            <span>Pending WP Media</span>
            {unmigratedMedia.length > 0 ? (
              <span className="px-2 py-0.5 text-[10px] bg-amber-500 text-white rounded-full font-black animate-pulse">
                {unmigratedMedia.length}
              </span>
            ) : (
              <span className="px-2 py-0.5 text-[10px] bg-emerald-100 text-emerald-800 rounded-full font-bold">
                0
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('categories')}
            className={`px-5 py-2.5 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === 'categories' ? 'bg-orange-600 text-white shadow-md' : 'bg-white text-black hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <Folder className="w-4 h-4" />
            <span>Categories Manager ({customCategories.length})</span>
          </button>
        </div>

        {/* Tab 1: Tutorials Manager (Author column completely removed) */}
        {activeTab === 'tutorials' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setTutorialSubTab('published')}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                    tutorialSubTab === 'published' ? 'bg-emerald-600 text-white shadow-md' : 'bg-white text-black hover:bg-slate-100 border border-slate-200'
                  }`}
                >
                  <span>Published ({posts.filter(p => !p.status || p.status === 'published').length})</span>
                </button>
                <button
                  onClick={() => setTutorialSubTab('draft')}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                    tutorialSubTab === 'draft' ? 'bg-amber-600 text-white shadow-md' : 'bg-white text-black hover:bg-slate-100 border border-slate-200'
                  }`}
                >
                  <span>Drafts ({posts.filter(p => p.status === 'draft').length})</span>
                </button>
              </div>

              <button
                onClick={handleOpenNewBlog}
                className="px-5 py-2.5 bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-xl text-xs shadow-md inline-flex items-center gap-2 transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>Create New Tutorial</span>
              </button>
            </div>

            <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
              {loading ? (
                <div className="p-12 text-center text-slate-500 font-medium text-sm">Loading tutorials from Firebase...</div>
              ) : (tutorialSubTab === 'published' ? posts.filter(p => !p.status || p.status === 'published') : posts.filter(p => p.status === 'draft')).length === 0 ? (
                <div className="p-12 text-center text-slate-500 font-medium text-sm">
                  {tutorialSubTab === 'published' ? 'No published tutorial articles found.' : 'No draft articles found.'}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-xs font-extrabold text-black">
                        <th className="p-4">Title & Slug</th>
                        <th className="p-4">Category</th>
                        <th className="p-4">Status</th>
                        <th className="p-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-xs">
                      {(tutorialSubTab === 'published' ? posts.filter(p => !p.status || p.status === 'published') : posts.filter(p => p.status === 'draft')).map((p) => (
                        <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="p-4 space-y-1">
                            <div className="font-bold text-black text-sm">{p.title}</div>
                            <div className="text-orange-600 font-mono text-[11px]">/{p.slug}</div>
                          </td>
                          <td className="p-4 font-semibold text-black">
                            <span className="px-2.5 py-1 bg-orange-50 text-orange-700 rounded-lg">{p.category || 'AI Guides'}</span>
                          </td>
                          <td className="p-4 font-bold">
                            <span className={`px-2.5 py-1 rounded-lg ${p.status === 'draft' ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'}`}>
                              {p.status || 'published'}
                            </span>
                          </td>
                          <td className="p-4 text-right space-x-2">
                            <Link
                              href={`/${p.slug}`}
                              target="_blank"
                              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-black font-bold rounded-lg text-xs inline-flex items-center gap-1 transition-colors"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                              View
                            </Link>
                            <button
                              onClick={() => handleOpenEditBlog(p)}
                              className="px-3 py-1.5 bg-orange-50 hover:bg-orange-100 text-orange-700 font-bold rounded-lg text-xs transition-colors"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDeleteBlog(p.id)}
                              className="px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-700 font-bold rounded-lg text-xs transition-colors"
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab 2: Categories Management */}
        {activeTab === 'categories' && (
          <div className="space-y-8">
            <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-4">
              <h2 className="text-lg font-bold text-black">Add New Category (नई कैटेगरी जोड़ें)</h2>
              <form onSubmit={handleAddGlobalCategory} className="flex flex-col sm:flex-row gap-3">
                <input
                  type="text"
                  value={newCatInput}
                  onChange={(e) => setNewCatInput(e.target.value)}
                  placeholder="Category Name (उदा: Prompt Engineering)..."
                  className="flex-1 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-black font-medium focus:ring-2 focus:ring-orange-600/20"
                />
                <button
                  type="submit"
                  className="px-6 py-3 bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-xl text-sm shadow-md transition-colors"
                >
                  Add Category
                </button>
              </form>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {customCategories.map((cat) => {
                const catSlug = cat.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
                const catPosts = posts.filter(p => p.category?.toLowerCase() === cat.toLowerCase());
                return (
                  <div key={cat} className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-4 flex flex-col justify-between">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Folder className="w-5 h-5 text-orange-600" />
                          <h3 className="font-extrabold text-black text-lg">{cat}</h3>
                        </div>
                        <button
                          onClick={() => handleDeleteGlobalCategory(cat)}
                          className="p-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl text-xs font-bold transition-colors"
                          title="Delete Category"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="text-xs text-orange-600 font-mono font-bold">
                        Archive URL: /{catSlug}
                      </div>

                      <div className="space-y-1.5 pt-2 border-t border-slate-100">
                        <div className="text-xs font-bold text-black/70">Articles in this category ({catPosts.length}):</div>
                        {catPosts.length === 0 ? (
                          <div className="text-xs text-slate-400 italic">No articles assigned yet.</div>
                        ) : (
                          <ul className="space-y-1">
                            {catPosts.map(p => (
                              <li key={p.id} className="text-xs text-slate-700 font-medium flex items-center justify-between">
                                <Link href={`/${p.slug}`} target="_blank" className="hover:text-orange-600 truncate max-w-[220px]">
                                  • {p.title}
                                </Link>
                                <span className="text-[10px] text-slate-400 font-mono">/{p.slug}</span>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    </div>

                    <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-slate-500">
                      <span>Total Tutorials: {catPosts.length}</span>
                      <Link href={`/${catSlug}`} target="_blank" className="text-orange-600 hover:underline inline-flex items-center gap-1">
                        View Archive <ExternalLink className="w-3 h-3" />
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Tab 3: Unmigrated / Pending WordPress Media Fallback Hub */}
        {activeTab === 'unmigrated' && (
          <div className="space-y-6">
            {/* Top Overview & Action Header Card */}
            <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6">
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-slate-100 pb-5">
                <div className="space-y-1">
                  <div className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-amber-50 text-amber-800 rounded-full text-xs font-bold border border-amber-200">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                    <span>WP Media Fallback & Manual Download Hub</span>
                  </div>
                  <h2 className="text-xl font-extrabold text-black flex items-center gap-2 pt-1">
                    <span>Unmigrated WordPress Media Items ({unmigratedMedia.length})</span>
                  </h2>
                  <p className="text-xs text-slate-500 font-medium">
                    यहाँ वो सभी WordPress Images और MP4 Videos सूचीबद्ध हैं जो अभी तक locally save नहीं हो पाई हैं। आप &quot;Download Media&quot; पर क्लिक करके सीधे इमेज/वीडियो डाउनलोड कर सकते हैं और &quot;Edit Article&quot; में जाकर अपलोड कर सकते हैं।
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2.5">
                  <button
                    onClick={handleManualScan}
                    disabled={isScanningMedia}
                    className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-black font-bold rounded-xl text-xs inline-flex items-center gap-2 transition-colors disabled:opacity-50"
                  >
                    <RefreshCw className={`w-4 h-4 ${isScanningMedia ? 'animate-spin' : ''}`} />
                    <span>{isScanningMedia ? 'Scanning Articles...' : 'Scan All Articles Now'}</span>
                  </button>

                  <button
                    onClick={handleMigrateAllImages}
                    disabled={isMigratingImages}
                    className="px-4 py-2.5 bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-xl text-xs inline-flex items-center gap-2 shadow-sm transition-all disabled:opacity-50"
                  >
                    {isMigratingImages ? <Loader2 className="w-4 h-4 animate-spin" /> : <ImageIcon className="w-4 h-4" />}
                    <span>{isMigratingImages ? `Migrating (${migrationProgress.current}%)...` : 'Run WP Migration Again'}</span>
                  </button>
                </div>
              </div>

              {/* Stats Counters */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4">
                  <div className="text-xs font-bold text-slate-500">Total Pending Media</div>
                  <div className="text-2xl font-extrabold text-black mt-1">{unmigratedMedia.length}</div>
                </div>
                <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4">
                  <div className="text-xs font-bold text-blue-800">Article Content Images</div>
                  <div className="text-2xl font-extrabold text-blue-600 mt-1">
                    {unmigratedMedia.filter(m => m.mediaType === 'image').length}
                  </div>
                </div>
                <div className="bg-purple-50 border border-purple-200 rounded-2xl p-4">
                  <div className="text-xs font-bold text-purple-800">MP4 Videos</div>
                  <div className="text-2xl font-extrabold text-purple-600 mt-1">
                    {unmigratedMedia.filter(m => m.mediaType === 'video').length}
                  </div>
                </div>
                <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
                  <div className="text-xs font-bold text-amber-800">Featured Banner Images</div>
                  <div className="text-2xl font-extrabold text-amber-600 mt-1">
                    {unmigratedMedia.filter(m => m.mediaType === 'featured').length}
                  </div>
                </div>
              </div>

              {/* Search and Filter Controls */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2">
                <div className="relative flex-1 max-w-md">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={mediaSearchQuery}
                    onChange={(e) => setMediaSearchQuery(e.target.value)}
                    placeholder="Search by article title, slug, or image URL..."
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-black focus:ring-2 focus:ring-orange-600/20"
                  />
                  {mediaSearchQuery && (
                    <button
                      onClick={() => setMediaSearchQuery('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl shrink-0 overflow-x-auto text-xs font-bold">
                  {(['all', 'image', 'video', 'featured'] as const).map(type => (
                    <button
                      key={type}
                      onClick={() => setMediaTypeFilter(type)}
                      className={`px-3 py-1.5 rounded-lg transition-all capitalize ${
                        mediaTypeFilter === type ? 'bg-white text-orange-600 shadow-sm' : 'text-slate-600 hover:text-black'
                      }`}
                    >
                      {type === 'all' ? `All (${unmigratedMedia.length})` : 
                       type === 'image' ? `Images (${unmigratedMedia.filter(m => m.mediaType === 'image').length})` :
                       type === 'video' ? `Videos (${unmigratedMedia.filter(m => m.mediaType === 'video').length})` :
                       `Featured (${unmigratedMedia.filter(m => m.mediaType === 'featured').length})`}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Media Items Table / Grid */}
            <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
              {(() => {
                const filtered = unmigratedMedia.filter(item => {
                  const q = mediaSearchQuery.toLowerCase().trim();
                  const matchesSearch = !q || 
                    item.articleTitle.toLowerCase().includes(q) ||
                    item.articleSlug.toLowerCase().includes(q) ||
                    item.wpUrl.toLowerCase().includes(q);
                  const matchesType = mediaTypeFilter === 'all' || item.mediaType === mediaTypeFilter;
                  return matchesSearch && matchesType;
                });

                if (unmigratedMedia.length === 0) {
                  return (
                    <div className="p-12 text-center space-y-3">
                      <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
                        <CheckCircle className="w-8 h-8" />
                      </div>
                      <h3 className="font-extrabold text-black text-lg">100% Secured! No External WordPress Media Pending</h3>
                      <p className="text-xs text-slate-500 max-w-md mx-auto">
                        All images and MP4 videos across all your articles are stored locally in the database.
                      </p>
                    </div>
                  );
                }

                if (filtered.length === 0) {
                  return (
                    <div className="p-12 text-center text-slate-500 text-xs font-medium">
                      No media items match your search &quot;{mediaSearchQuery}&quot;.
                    </div>
                  );
                }

                return (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-200 text-xs font-extrabold text-black">
                          <th className="p-4 w-28">Preview</th>
                          <th className="p-4 w-64">Article Title & Live Link</th>
                          <th className="p-4 min-w-[280px]">WordPress URL</th>
                          <th className="p-4 w-52 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-xs">
                        {filtered.map(item => (
                          <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                            {/* Preview Cell */}
                            <td className="p-4 align-top">
                              <div className="space-y-1.5">
                                {item.mediaType === 'video' ? (
                                  <div className="w-20 h-14 bg-slate-900 rounded-xl flex flex-col items-center justify-center text-amber-300 shadow-sm border border-slate-700">
                                    <Video className="w-6 h-6" />
                                    <span className="text-[9px] font-bold mt-0.5 text-white">MP4 Video</span>
                                  </div>
                                ) : (
                                  <div className="relative w-20 h-14 rounded-xl overflow-hidden border border-slate-200 bg-slate-100 shadow-sm">
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img
                                      src={item.wpUrl}
                                      alt={item.articleTitle}
                                      className="w-full h-full object-cover"
                                      loading="lazy"
                                      onError={(e) => {
                                        (e.target as HTMLElement).style.display = 'none';
                                        const parent = (e.target as HTMLElement).parentElement;
                                        if (parent) {
                                          parent.innerHTML = '<div class="w-full h-full flex flex-col items-center justify-center text-slate-400 text-[9px] font-bold p-1 text-center bg-slate-100">Image Preview</div>';
                                        }
                                      }}
                                    />
                                  </div>
                                )}
                                <div>
                                  <span className={`inline-block px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase ${
                                    item.mediaType === 'featured' ? 'bg-amber-100 text-amber-800' :
                                    item.mediaType === 'video' ? 'bg-purple-100 text-purple-800' :
                                    'bg-blue-100 text-blue-800'
                                  }`}>
                                    {item.mediaType}
                                  </span>
                                </div>
                              </div>
                            </td>

                            {/* Article Details Cell */}
                            <td className="p-4 align-top space-y-1.5">
                              <div className="font-bold text-black text-sm leading-snug">
                                {item.articleTitle}
                              </div>
                              <div className="flex items-center gap-1.5">
                                <Link
                                  href={`/${item.articleSlug}`}
                                  target="_blank"
                                  className="text-orange-600 hover:text-orange-700 font-mono text-[11px] inline-flex items-center gap-1 font-semibold"
                                >
                                  <span>/{item.articleSlug}</span>
                                  <ExternalLink className="w-3 h-3" />
                                </Link>
                              </div>
                              {item.reason && (
                                <div className="text-[11px] text-amber-800 bg-amber-50/80 px-2 py-1 rounded-lg border border-amber-200/60 inline-flex items-center gap-1">
                                  <AlertCircle className="w-3 h-3 shrink-0 text-amber-600" />
                                  <span className="truncate max-w-[260px]">{item.reason}</span>
                                </div>
                              )}
                            </td>

                            {/* WordPress URL Cell */}
                            <td className="p-4 align-top space-y-2">
                              <div className="bg-slate-50 border border-slate-200 rounded-xl p-2.5 font-mono text-[11px] text-slate-700 break-all select-all flex items-start justify-between gap-2">
                                <span className="line-clamp-2">{item.wpUrl.replace(/^https?:\/\/(www\.)?aitoolhindi\.online\/?/i, '').replace(/^\//, '')}</span>
                                <button
                                  onClick={() => handleCopyWpUrl(item.id, item.wpUrl)}
                                  className="shrink-0 p-1.5 bg-white hover:bg-slate-100 rounded-lg border border-slate-200 text-slate-600 hover:text-black transition-colors"
                                  title="Copy URL"
                                >
                                  {copiedUrlId === item.id ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                                </button>
                              </div>
                              <div className="flex items-center gap-2 text-[11px]">
                                <a
                                  href={item.wpUrl}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="text-slate-500 hover:text-black inline-flex items-center gap-1 font-medium"
                                >
                                  <ExternalLink className="w-3 h-3" />
                                  <span>Open WordPress Link in new tab</span>
                                </a>
                              </div>
                            </td>

                            {/* Action Buttons Cell */}
                            <td className="p-4 align-top text-right space-y-2">
                              <div className="flex flex-col items-end gap-1.5">
                                <button
                                  onClick={() => handleDownloadMedia(item.wpUrl, item.mediaType)}
                                  className="w-full sm:w-auto px-3 py-1.5 bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-xl text-xs inline-flex items-center justify-center gap-1.5 shadow-sm transition-colors"
                                  title="Download media file directly to your computer"
                                >
                                  <Download className="w-3.5 h-3.5" />
                                  <span>Download Media</span>
                                </button>

                                <button
                                  onClick={() => handleEditArticleFromMedia(item.articleSlug, item.articleId)}
                                  className="w-full sm:w-auto px-3 py-1.5 bg-slate-800 hover:bg-slate-900 text-white font-bold rounded-xl text-xs inline-flex items-center justify-center gap-1.5 shadow-sm transition-colors"
                                  title="Open article in admin editor to upload new image"
                                >
                                  <Edit className="w-3.5 h-3.5" />
                                  <span>Edit Article</span>
                                </button>

                                <button
                                  onClick={() => handleMigrateSingleItem(item)}
                                  disabled={migratingSingleId === item.id}
                                  className="w-full sm:w-auto px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 font-bold rounded-xl text-xs inline-flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50"
                                  title="Retry converting this item into local database"
                                >
                                  {migratingSingleId === item.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
                                  <span>{migratingSingleId === item.id ? 'Migrating...' : 'Retry Single'}</span>
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                );
              })()}
            </div>
          </div>
        )}
      </main>

      {/* Floating Notification Toast */}
      {notification && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-5 py-3 rounded-2xl shadow-2xl border border-slate-800 text-xs font-bold animate-bounce flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-emerald-400" />
          <span>{notification}</span>
        </div>
      )}
    </div>
  );
}

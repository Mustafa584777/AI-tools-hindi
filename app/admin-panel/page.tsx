'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Plus, Edit, Trash2, Database, CheckCircle, ExternalLink, Sparkles, FileText, ArrowLeft, Image as ImageIcon, Link as LinkIcon, Bold, Italic, Heading1, Heading2, Heading3, Code, Wand2, Upload, X, RefreshCw, Eye, Code2, HelpCircle, Bot, AlertTriangle, TrendingUp, Award, Folder, List, Table, Undo, Redo, Settings, ArrowUp, ArrowDown, Copy } from 'lucide-react';
import { 
  fetchBlogPostsFromFirestore, 
  saveBlogPostToFirestore, 
  deleteBlogPostFromFirestore,
  getStoredBlogPostsSync,
  clearClientCache
} from '@/lib/storage';
import { BlogPost } from '@/lib/types';

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

interface EditorBlock {
  id: string;
  type: 'p' | 'h1' | 'h2' | 'h3' | 'quote' | 'ul' | 'img';
  content: string;
  src?: string;
  alt?: string;
  slug?: string;
}

const CATEGORIES_KEY = 'aitoolhindi_categories_v1';

export default function AdminPanelPage() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'tutorials' | 'categories'>('tutorials');

  // Categories list state
  const [customCategories, setCustomCategories] = useState<string[]>(['AI Guides', 'Image Tutorials', 'Video Tutorials', 'ChatGPT Guides']);
  const [newCatInput, setNewCatInput] = useState('');

  // Full-page Editor View State for Blog
  const [isEditingBlog, setIsEditingBlog] = useState(false);
  const [editingBlogId, setEditingBlogId] = useState<string | null>(null);
  const [blogTitle, setBlogTitle] = useState('');
  const [blogSlug, setBlogSlug] = useState('');
  const [isSlugManual, setIsSlugManual] = useState(false);
  const [blogExcerpt, setBlogExcerpt] = useState('');
  const [blogCategory, setBlogCategory] = useState('AI Guides');
  const [isNewCategoryMode, setIsNewCategoryMode] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [blogAuthor, setBlogAuthor] = useState('Anwar');
  const [blogImage, setBlogImage] = useState('https://picsum.photos/seed/blogdefault/800/450');
  const [blogImageAlt, setBlogImageAlt] = useState('');
  const [blogStatus, setBlogStatus] = useState<'published' | 'draft'>('published');

  // Post Settings Toggle State
  const [showPostSettings, setShowPostSettings] = useState(true);

  // WordPress Seamless Block Editor State
  const [blocks, setBlocks] = useState<EditorBlock[]>([
    { id: 'b-title', type: 'h1', content: 'Article Title' },
    { id: 'b-start', type: 'p', content: 'Start writing your tutorial here...' }
  ]);
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>('b-start');

  // Editor History for Undo / Redo
  const [history, setHistory] = useState<EditorBlock[][]>([]);
  const [historyIndex, setHistoryIndex] = useState<number>(-1);

  // Editor Mode: Block vs HTML Code Mode
  const [editorMode, setEditorMode] = useState<'block' | 'html'>('block');
  const [rawHtmlContent, setRawHtmlContent] = useState('');

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

  const contentImageInputRef = useRef<HTMLInputElement>(null);
  const featuredImageInputRef = useRef<HTMLInputElement>(null);
  const restoreFileInputRef = useRef<HTMLInputElement>(null);

  const [notification, setNotification] = useState<string | null>(null);

  const loadData = async (force = false) => {
    setLoading(true);
    try {
      const data = await fetchBlogPostsFromFirestore(force);
      setPosts(data);

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
      setPosts(getStoredBlogPostsSync());
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadData();
  }, []);

  const showNotify = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3500);
  };

  const pushHistory = (newBlocks: EditorBlock[]) => {
    const updatedHistory = history.slice(0, historyIndex + 1);
    updatedHistory.push(newBlocks);
    setHistory(updatedHistory);
    setHistoryIndex(updatedHistory.length - 1);
  };

  const handleUndo = () => {
    if (historyIndex > 0) {
      const prevIndex = historyIndex - 1;
      setBlocks(history[prevIndex]);
      setHistoryIndex(prevIndex);
      showNotify('Undo applied');
    }
  };

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      const nextIndex = historyIndex + 1;
      setBlocks(history[nextIndex]);
      setHistoryIndex(nextIndex);
      showNotify('Redo applied');
    }
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

  // Parse HTML to Block array (Pure helper)
  const parseHtmlToBlocks = (html: string): EditorBlock[] => {
    if (!html || !html.trim()) {
      return [
        { id: 'b-title', type: 'h1', content: 'Article Title' },
        { id: 'b-start', type: 'p', content: 'Start writing your tutorial here...' }
      ];
    }

    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    const children = Array.from(doc.body.children);
    const result: EditorBlock[] = [];

    if (children.length === 0) {
      return [{ id: 'b-0', type: 'p', content: html }];
    }

    children.forEach((el, idx) => {
      const tag = el.tagName.toLowerCase();
      const text = el.textContent || '';
      const uniqueId = 'b-' + idx + '-' + Math.random().toString(36).substring(2, 8);
      if (tag === 'h1') {
        result.push({ id: uniqueId, type: 'h1', content: text });
      } else if (tag === 'h2') {
        result.push({ id: uniqueId, type: 'h2', content: text });
      } else if (tag === 'h3') {
        result.push({ id: uniqueId, type: 'h3', content: text });
      } else if (tag === 'blockquote') {
        result.push({ id: uniqueId, type: 'quote', content: text });
      } else if (tag === 'ul') {
        const items = Array.from(el.querySelectorAll('li')).map(li => li.textContent || '').join('\n');
        result.push({ id: uniqueId, type: 'ul', content: items });
      } else if (tag === 'img') {
        result.push({
          id: el.getAttribute('data-img-id') || uniqueId,
          type: 'img',
          content: '',
          src: el.getAttribute('src') || '',
          alt: el.getAttribute('alt') || '',
          slug: el.getAttribute('data-img-slug') || ''
        });
      } else {
        result.push({ id: uniqueId, type: 'p', content: el.innerHTML || text });
      }
    });

    return result.length > 0 ? result : [{ id: 'b-fallback', type: 'p', content: html }];
  };

  // Serialize blocks to HTML string with proper paragraph spacing (mb-6)
  const serializeBlocksToHtml = (blocksList: EditorBlock[]): string => {
    return blocksList.map(block => {
      switch (block.type) {
        case 'h1':
          return `<h1 class="text-3xl font-extrabold text-black mt-6 mb-4">${block.content}</h1>`;
        case 'h2':
          return `<h2 class="text-2xl font-bold text-black mt-6 mb-3">${block.content}</h2>`;
        case 'h3':
          return `<h3 class="text-xl font-semibold text-black mt-4 mb-2">${block.content}</h3>`;
        case 'quote':
          return `<blockquote class="border-l-4 border-orange-500 pl-4 py-3 my-6 italic bg-slate-50 text-slate-800 rounded-r-2xl">${block.content}</blockquote>`;
        case 'ul':
          return `<ul class="list-disc pl-6 space-y-2 mb-6 text-slate-700">${block.content.split('\n').filter(Boolean).map(li => `<li>${li}</li>`).join('')}</ul>`;
        case 'img':
          return `<img src="${block.src || ''}" alt="${block.alt || 'Tutorial image'}" data-img-slug="${block.slug || 'tutorial-image'}" class="w-full rounded-2xl my-6 shadow-md object-cover" />`;
        case 'p':
        default:
          return `<p class="mb-6 text-slate-700 leading-relaxed text-lg">${block.content}</p>`;
      }
    }).join('\n');
  };

  // Block management functions
  const handleAddBlock = (type: EditorBlock['type'] = 'p') => {
    const newBlock: EditorBlock = {
      id: 'b-' + Math.random().toString(36).substring(2, 9),
      type,
      content: type === 'img' ? '' : 'New content here...',
      ...(type === 'img' ? { src: 'https://picsum.photos/seed/newimg/800/450', alt: 'Tutorial illustration', slug: 'tutorial-illustration' } : {})
    };
    const updated = [...blocks, newBlock];
    setBlocks(updated);
    pushHistory(updated);
    setSelectedBlockId(newBlock.id);
  };

  const handleUpdateBlockContent = (id: string, content: string) => {
    const updated = blocks.map(b => b.id === id ? { ...b, content } : b);
    setBlocks(updated);
    pushHistory(updated);
  };

  const handleMoveBlock = (index: number, direction: 'up' | 'down') => {
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= blocks.length) return;
    const updated = [...blocks];
    const temp = updated[index];
    updated[index] = updated[newIndex];
    updated[newIndex] = temp;
    setBlocks(updated);
    pushHistory(updated);
  };

  const handleDeleteBlock = (id: string) => {
    if (blocks.length <= 1) {
      alert('Article must have at least one block.');
      return;
    }
    const updated = blocks.filter(b => b.id !== id);
    setBlocks(updated);
    pushHistory(updated);
  };

  // Formatting toolbar actions applied to the currently SELECTED block automatically!
  const handleFormatSelectedBlock = (action: 'h1' | 'h2' | 'h3' | 'p' | 'bold' | 'italic' | 'link') => {
    const targetId = selectedBlockId || (blocks.length > 0 ? blocks[0].id : null);
    if (!targetId) {
      alert('Please click on a block first to select it.');
      return;
    }

    const updated = blocks.map(b => {
      if (b.id !== targetId) return b;
      if (action === 'h1' || action === 'h2' || action === 'h3' || action === 'p') {
        return { ...b, type: action as EditorBlock['type'] };
      }
      let updatedContent = b.content;
      if (action === 'bold') {
        updatedContent = `<strong>${updatedContent}</strong>`;
      } else if (action === 'italic') {
        updatedContent = `<em>${updatedContent}</em>`;
      } else if (action === 'link') {
        const url = prompt('Enter URL:', 'https://');
        if (url) {
          updatedContent = `<a href="${url}" target="_blank" rel="noopener noreferrer" class="text-orange-600 underline font-bold">${updatedContent}</a>`;
        }
      }
      return { ...b, content: updatedContent };
    });

    setBlocks(updated);
    pushHistory(updated);
    setSelectedBlockId(targetId);
    showNotify(`Formatting applied to selected block!`);
  };

  const insertListBlock = () => {
    const newBlock: EditorBlock = {
      id: 'b-' + Math.random().toString(36).substring(2, 9),
      type: 'ul',
      content: 'List item 1\nList item 2\nList item 3'
    };
    const updated = [...blocks, newBlock];
    setBlocks(updated);
    pushHistory(updated);
    setSelectedBlockId(newBlock.id);
  };

  const insertTableBlock = () => {
    const tableHtml = `<div class="overflow-x-auto my-6"><table class="w-full border-collapse border border-slate-300"><thead><tr class="bg-slate-100"><th class="border border-slate-300 p-3 text-left font-bold text-black">Header 1</th><th class="border border-slate-300 p-3 text-left font-bold text-black">Header 2</th></tr></thead><tbody><tr><td class="border border-slate-300 p-3 text-black">Row 1 Cell 1</td><td class="border border-slate-300 p-3 text-black">Row 1 Cell 2</td></tr><tr><td class="border border-slate-300 p-3 text-black">Row 2 Cell 1</td><td class="border border-slate-300 p-3 text-black">Row 2 Cell 2</td></tr></tbody></table></div>`;
    const newBlock: EditorBlock = {
      id: 'b-' + Math.random().toString(36).substring(2, 9),
      type: 'p',
      content: tableHtml
    };
    const updated = [...blocks, newBlock];
    setBlocks(updated);
    pushHistory(updated);
    setSelectedBlockId(newBlock.id);
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
        id: 'img-' + Math.random().toString(36).substring(2, 8),
        base64: base64String,
        alt: cleanAlt,
        slug: imgSlug
      };

      setArticleImages(prev => [...prev, newImg]);

      const imageBlock: EditorBlock = {
        id: newImg.id,
        type: 'img',
        content: '',
        src: base64String,
        alt: cleanAlt,
        slug: imgSlug
      };

      const updated = [...blocks, imageBlock];
      setBlocks(updated);
      pushHistory(updated);
      setSelectedBlockId(imageBlock.id);
      showNotify('Image block added successfully!');
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
      showNotify('Featured image uploaded locally successfully!');
    };
    reader.readAsDataURL(file);
    if (featuredImageInputRef.current) featuredImageInputRef.current.value = '';
  };

  const handleConvertWpCode = () => {
    if (!wpRawCode.trim()) return;

    let cleaned = wpRawCode
      .replace(/<!-- wp:.*?-->/g, '')
      .replace(/<!-- \/wp:.*?-->/g, '')
      .trim();

    if (!cleaned.includes('<p>') && !cleaned.includes('<h1>')) {
      cleaned = cleaned
        .split('\n\n')
        .map(p => p.trim() ? `<p>${p.trim()}</p>` : '')
        .join('\n');
    }

    const parsedBlocks = parseHtmlToBlocks(cleaned);
    const updated = [...blocks, ...parsedBlocks];
    setBlocks(updated);
    pushHistory(updated);
    setWpRawCode('');
    setShowWpImporter(false);
    showNotify('WordPress code successfully converted into blocks!');
  };

  // FAQ Builder Handlers
  const handleAddFaq = () => {
    if (!newFaqQ.trim() || !newFaqA.trim()) return;
    const updatedFaqs = [...faqs, { question: newFaqQ.trim(), answer: newFaqA.trim() }];
    setFaqs(updatedFaqs);
    setNewFaqQ('');
    setNewFaqA('');
    updateBlocksWithFaqs(updatedFaqs);
    showNotify('FAQ added and Schema automatically generated!');
  };

  const handleDeleteFaq = (index: number) => {
    const updatedFaqs = faqs.filter((_, i) => i !== index);
    setFaqs(updatedFaqs);
    updateBlocksWithFaqs(updatedFaqs);
  };

  const updateBlocksWithFaqs = (currentFaqs: FAQItem[]) => {
    if (currentFaqs.length === 0) return;

    let faqHtml = `<div class="my-8 p-6 bg-slate-50 border border-slate-200 rounded-3xl space-y-4">\n  <h3 class="text-xl font-bold text-black">Frequently Asked Questions (FAQs)</h3>\n  <div class="space-y-3">\n`;

    currentFaqs.forEach((faq) => {
      faqHtml += `    <div class="faq-item p-4 bg-white border border-slate-200 rounded-2xl space-y-1.5 cursor-pointer hover:border-orange-400 transition-colors">\n      <h4 class="faq-question font-bold text-black text-base flex items-center justify-between"><span>${faq.question}</span> <span class="faq-icon text-orange-600 font-extrabold text-lg">+</span></h4>\n      <p class="faq-answer hidden text-black text-sm font-medium pt-2 border-t border-slate-100">${faq.answer}</p>\n    </div>\n`;
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

    const scriptTag = `<script type="application/ld+json">\n${JSON.stringify(schemaData, null, 2)}\n</script>`;
    const fullContent = faqHtml + '\n' + scriptTag;

    const faqBlock: EditorBlock = {
      // eslint-disable-next-line react-hooks/purity
      id: 'b-faq-' + Date.now(),
      type: 'p',
      content: fullContent
    };

    const updated = [...blocks, faqBlock];
    setBlocks(updated);
    pushHistory(updated);
  };

  // AI Generator & Auditor
  const handleAiGeneratePost = async () => {
    if (!aiKeyword.trim()) {
      alert('Please enter a keyword or title for AI post generation.');
      return;
    }

    setIsGeneratingAi(true);
    try {
      const res = await fetch('/api/ai-supervisor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'generate', keyword: aiKeyword })
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);

      if (data.title) setBlogTitle(data.title);
      if (data.slug) {
        setBlogSlug(data.slug);
        setIsSlugManual(true);
      }
      if (data.excerpt) setBlogExcerpt(data.excerpt);
      if (data.category && customCategories.includes(data.category)) {
        setBlogCategory(data.category);
      }
      if (data.content) {
        const parsed = parseHtmlToBlocks(data.content);
        setBlocks(parsed);
        pushHistory(parsed);
      }
      showNotify('AI successfully generated complete post from keyword!');
    } catch (err) {
      alert('AI Generation error: ' + (err as Error).message);
    } finally {
      setIsGeneratingAi(false);
    }
  };

  const handleAiAnalyzePost = async () => {
    if (!blogTitle.trim()) {
      alert('Please provide an article title first.');
      return;
    }

    setIsAnalyzingAi(true);
    try {
      const currentHtml = serializeBlocksToHtml(blocks);
      const res = await fetch('/api/ai-supervisor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'analyze', title: blogTitle, content: currentHtml })
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);

      setAnalysisResult(data.analysis);
      showNotify('AI Supervisor audit completed successfully!');
    } catch (err) {
      alert('AI Audit error: ' + (err as Error).message);
    } finally {
      setIsAnalyzingAi(false);
    }
  };

  const handleAiOptimizePost = async () => {
    if (!blogTitle.trim()) {
      alert('Please provide an article title first.');
      return;
    }

    setIsOptimizingAi(true);
    try {
      const currentHtml = serializeBlocksToHtml(blocks);
      const res = await fetch('/api/ai-supervisor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'optimize', title: blogTitle, content: currentHtml })
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);

      if (data.optimizedTitle) setBlogTitle(data.optimizedTitle);
      if (data.optimizedExcerpt) setBlogExcerpt(data.optimizedExcerpt);
      if (data.optimizedContent) {
        const parsed = parseHtmlToBlocks(data.optimizedContent);
        setBlocks(parsed);
        pushHistory(parsed);
      }
      showNotify('AI successfully optimized your existing content!');
    } catch (err) {
      alert('AI Optimization error: ' + (err as Error).message);
    } finally {
      setIsOptimizingAi(false);
    }
  };

  // Save Blog handler
  const handleSaveBlog = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!blogTitle.trim() || !blogSlug.trim()) {
      alert('Please fill in Article Title and Slug.');
      return;
    }

    try {
      const finalHtml = editorMode === 'html' ? rawHtmlContent : serializeBlocksToHtml(blocks);
      const postData: BlogPost = {
        id: editingBlogId || ('post-' + Date.now()),
        title: blogTitle.trim(),
        slug: blogSlug.trim().toLowerCase().replace(/[^a-z0-9-]/g, '-'),
        excerpt: blogExcerpt.trim() || blogTitle.trim(),
        content: finalHtml,
        category: blogCategory,
        author: blogAuthor || 'Anwar',
        image: blogImage,
        date: new Date().toLocaleDateString('hi-IN', { day: 'numeric', month: 'long', year: 'numeric' }),
        status: blogStatus,
        faqs: faqs.length > 0 ? faqs : undefined
      };

      await saveBlogPostToFirestore(postData);
      await loadData(true);
      setIsEditingBlog(false);
      showNotify('Tutorial successfully saved & published to Firebase!');
    } catch (err) {
      alert('Error saving post: ' + (err as Error).message);
    }
  };

  const handleOpenNewBlog = () => {
    setEditingBlogId(null);
    setBlogTitle('');
    setBlogSlug('');
    setIsSlugManual(false);
    setBlogExcerpt('');
    setBlogCategory(customCategories[0] || 'AI Guides');
    setBlogAuthor('Anwar');
    setBlogImage('https://picsum.photos/seed/blogdefault/800/450');
    setBlogImageAlt('');
    setBlogStatus('published');
    const initialBlocks: EditorBlock[] = [
      { id: 'b-' + Math.random().toString(36).substring(2, 8), type: 'h1', content: 'New Article Title' },
      { id: 'b-' + Math.random().toString(36).substring(2, 8), type: 'p', content: 'Start writing your amazing tutorial here...' }
    ];
    setBlocks(initialBlocks);
    setHistory([initialBlocks]);
    setHistoryIndex(0);
    setSelectedBlockId(initialBlocks[0].id);
    setRawHtmlContent(serializeBlocksToHtml(initialBlocks));
    setFaqs([]);
    setAnalysisResult(null);
    setIsEditingBlog(true);
  };

  const handleOpenEditBlog = (post: BlogPost) => {
    setEditingBlogId(post.id);
    setBlogTitle(post.title);
    setBlogSlug(post.slug);
    setIsSlugManual(true);
    setBlogExcerpt(post.excerpt || '');
    setBlogCategory(post.category || 'AI Guides');
    setBlogAuthor(post.author || 'Anwar');
    setBlogImage(post.image || 'https://picsum.photos/seed/blogdefault/800/450');
    setBlogImageAlt('');
    setBlogStatus(post.status || 'published');
    const parsedBlocks = parseHtmlToBlocks(post.content || '');
    setBlocks(parsedBlocks);
    setHistory([parsedBlocks]);
    setHistoryIndex(0);
    setSelectedBlockId(parsedBlocks.length > 0 ? parsedBlocks[0].id : null);
    setRawHtmlContent(post.content || '');
    setFaqs(post.faqs || []);
    setAnalysisResult(null);
    setIsEditingBlog(true);
  };

  const handleExportBackup = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(posts, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `aitoolhindi_backup_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    showNotify('All articles backup downloaded successfully!');
  };

  const handleImportBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        if (Array.isArray(json)) {
          for (const p of json) {
            await saveBlogPostToFirestore(p);
          }
          await loadData(true);
          showNotify(`Successfully restored ${json.length} articles from backup!`);
        } else {
          alert('Invalid backup JSON format.');
        }
      } catch (err) {
        alert('Error restoring backup: ' + (err as Error).message);
      }
    };
    reader.readAsText(file);
    if (restoreFileInputRef.current) restoreFileInputRef.current.value = '';
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
  // RENDER SEAMLESS WORDPRESS BLOCK EDITOR
  // ==========================================
  if (isEditingBlog) {
    return (
      <div className="min-h-screen bg-slate-100 flex flex-col">
        {/* Admin panel screen spacing: just 10px spacing on left and right side */}
        <main className="flex-1 max-w-full px-[10px] py-6 space-y-6">
          <div className="bg-white rounded-3xl border border-slate-200 p-4 sm:p-8 shadow-sm space-y-8">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="space-y-1">
                <button
                  onClick={() => setIsEditingBlog(false)}
                  className="inline-flex items-center gap-2 text-xs font-bold text-orange-600 hover:text-orange-700 transition-colors mb-2"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Back to Admin Dashboard</span>
                </button>
                <h1 className="text-2xl font-extrabold text-black tracking-tight">
                  {editingBlogId ? 'WordPress Seamless Block Editor (Edit Post)' : 'WordPress Seamless Block Editor (New Post)'}
                </h1>
                <p className="text-black text-sm font-medium">
                  Click any block below to select it and apply formatting instantly. Every block is fully editable.
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

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                  <div>
                    <label className="block text-xs font-bold text-black mb-2">Author (Default: Anwar)</label>
                    <input
                      type="text"
                      value={blogAuthor}
                      onChange={(e) => setBlogAuthor(e.target.value)}
                      placeholder="Anwar"
                      className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm text-black font-medium"
                    />
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
                        type="url"
                        value={blogImage}
                        onChange={(e) => setBlogImage(e.target.value)}
                        placeholder="Or paste image URL here..."
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs text-black font-medium"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-black mb-1 mt-2">Image Alt Text & Slug (SEO)</label>
                    <input
                      type="text"
                      value={blogImageAlt}
                      onChange={(e) => setBlogImageAlt(e.target.value)}
                      placeholder="उदा: AI tutorial banner image"
                      className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-black font-medium"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-black mb-2">Excerpt (Short Summary)</label>
                  <textarea
                    rows={2}
                    value={blogExcerpt}
                    onChange={(e) => setBlogExcerpt(e.target.value)}
                    className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm text-black font-medium"
                  />
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
                    अपने पुराने WordPress पोस्ट का HTML या Gutenberg ब्लॉक कोड यहाँ पेस्ट करें। &ldquo;Convert &amp; Insert&rdquo; पर क्लिक करते ही यह ब्लॉक एडिटर में कन्वर्ट हो जाएगा।
                  </p>
                  <textarea
                    rows={5}
                    value={wpRawCode}
                    onChange={(e) => setWpRawCode(e.target.value)}
                    placeholder="Paste WordPress post code here..."
                    className="w-full p-4 bg-white border border-orange-200 rounded-xl text-xs font-mono text-black font-medium focus:ring-2 focus:ring-orange-600/20"
                  />
                  <button
                    type="button"
                    onClick={handleConvertWpCode}
                    className="px-5 py-2.5 bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-xl text-xs inline-flex items-center gap-2 shadow-sm"
                  >
                    <Wand2 className="w-3.5 h-3.5" />
                    <span>Convert into Blocks</span>
                  </button>
                </div>
              )}
            </div>

            <form onSubmit={handleSaveBlog} className="space-y-6">
              {/* ========================================== */}
              {/* SEAMLESS WORDPRESS BLOCK EDITOR */}
              {/* ========================================== */}
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <label className="text-sm font-extrabold text-black">WordPress Seamless Block Editor (Click any block to select & format)</label>
                  
                  <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-xl">
                    <button
                      type="button"
                      onClick={() => {
                        if (editorMode === 'html') {
                          setBlocks(parseHtmlToBlocks(rawHtmlContent));
                        }
                        setEditorMode('block');
                      }}
                      className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                        editorMode === 'block' ? 'bg-white text-orange-600 shadow-sm' : 'text-black hover:text-orange-600'
                      }`}
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Seamless Block Mode</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setRawHtmlContent(serializeBlocksToHtml(blocks));
                        setEditorMode('html');
                      }}
                      className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                        editorMode === 'html' ? 'bg-white text-orange-600 shadow-sm' : 'text-black hover:text-orange-600'
                      }`}
                    >
                      <Code2 className="w-3.5 h-3.5" />
                      <span>HTML Code Mode</span>
                    </button>
                  </div>
                </div>

                {/* Sticky Formatting Toolbar with Instant Block Formatting */}
                <div className="sticky top-4 z-20 bg-white/95 backdrop-blur-md p-3.5 rounded-2xl border border-slate-200 shadow-lg flex flex-wrap items-center gap-2">
                  <button type="button" onClick={() => handleFormatSelectedBlock('h1')} className="px-3 py-1.5 bg-slate-100 hover:bg-orange-50 hover:text-orange-600 rounded-lg text-xs font-bold text-black transition-colors flex items-center gap-1" title="Format selected block as H1">
                    <Heading1 className="w-3.5 h-3.5" /> H1
                  </button>
                  <button type="button" onClick={() => handleFormatSelectedBlock('h2')} className="px-3 py-1.5 bg-slate-100 hover:bg-orange-50 hover:text-orange-600 rounded-lg text-xs font-bold text-black transition-colors flex items-center gap-1" title="Format selected block as H2">
                    <Heading2 className="w-3.5 h-3.5" /> H2
                  </button>
                  <button type="button" onClick={() => handleFormatSelectedBlock('h3')} className="px-3 py-1.5 bg-slate-100 hover:bg-orange-50 hover:text-orange-600 rounded-lg text-xs font-bold text-black transition-colors flex items-center gap-1" title="Format selected block as H3">
                    <Heading3 className="w-3.5 h-3.5" /> H3
                  </button>
                  <span className="text-slate-300">|</span>
                  <button type="button" onClick={() => handleFormatSelectedBlock('p')} className="px-3 py-1.5 bg-slate-100 hover:bg-orange-50 hover:text-orange-600 rounded-lg text-xs font-bold text-black transition-colors">
                    Paragraph
                  </button>
                  <button type="button" onClick={() => handleFormatSelectedBlock('bold')} className="px-3 py-1.5 bg-slate-100 hover:bg-orange-50 hover:text-orange-600 rounded-lg text-xs font-bold text-black transition-colors flex items-center gap-1" title="Apply bold to selected block">
                    <Bold className="w-3.5 h-3.5" /> Bold
                  </button>
                  <button type="button" onClick={() => handleFormatSelectedBlock('italic')} className="px-3 py-1.5 bg-slate-100 hover:bg-orange-50 hover:text-orange-600 rounded-lg text-xs font-bold text-black transition-colors flex items-center gap-1" title="Apply italic to selected block">
                    <Italic className="w-3.5 h-3.5" /> Italic
                  </button>
                  <span className="text-slate-300">|</span>
                  <button type="button" onClick={() => handleFormatSelectedBlock('link')} className="px-3 py-1.5 bg-slate-100 hover:bg-orange-50 hover:text-orange-600 rounded-lg text-xs font-bold text-black transition-colors flex items-center gap-1">
                    <LinkIcon className="w-3.5 h-3.5" /> Insert Link
                  </button>
                  <button type="button" onClick={insertListBlock} className="px-3 py-1.5 bg-slate-100 hover:bg-orange-50 hover:text-orange-600 rounded-lg text-xs font-bold text-black transition-colors flex items-center gap-1">
                    <List className="w-3.5 h-3.5" /> Insert List
                  </button>
                  <button type="button" onClick={insertTableBlock} className="px-3 py-1.5 bg-slate-100 hover:bg-orange-50 hover:text-orange-600 rounded-lg text-xs font-bold text-black transition-colors flex items-center gap-1">
                    <Table className="w-3.5 h-3.5" /> Insert Table
                  </button>
                  <span className="text-slate-300">|</span>
                  <button type="button" onClick={handleUndo} disabled={historyIndex <= 0} className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 rounded-lg text-xs font-bold text-black transition-colors disabled:opacity-30 flex items-center gap-1" title="Undo">
                    <Undo className="w-3.5 h-3.5" /> Undo
                  </button>
                  <button type="button" onClick={handleRedo} disabled={historyIndex >= history.length - 1} className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 rounded-lg text-xs font-bold text-black transition-colors disabled:opacity-30 flex items-center gap-1" title="Redo">
                    <Redo className="w-3.5 h-3.5" /> Redo
                  </button>
                  <span className="text-slate-300">|</span>
                  <input
                    type="file"
                    accept="image/*"
                    ref={contentImageInputRef}
                    onChange={handleContentImageUpload}
                    className="hidden"
                    id="stickyImgUpload"
                  />
                  <label
                    htmlFor="stickyImgUpload"
                    className="px-3.5 py-1.5 bg-orange-600 hover:bg-orange-700 text-white rounded-lg text-xs font-bold shadow-md inline-flex items-center gap-1.5 cursor-pointer transition-colors"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>+ Image Block</span>
                  </label>
                </div>

                {/* Seamless Blocks Container or HTML Code Mode */}
                {editorMode === 'block' ? (
                  <div className="space-y-3 bg-slate-50 border border-slate-200 rounded-2xl p-4 sm:p-6">
                    {blocks.map((block, index) => {
                      const isSelected = selectedBlockId === block.id;
                      return (
                        <div
                          key={block.id}
                          onClick={() => setSelectedBlockId(block.id)}
                          onFocus={() => setSelectedBlockId(block.id)}
                          tabIndex={0}
                          className={`p-3 rounded-xl transition-all cursor-pointer relative group outline-none ${
                            isSelected 
                              ? 'ring-2 ring-blue-400 bg-blue-50/30 border border-blue-300 shadow-sm' 
                              : 'bg-white border border-slate-200 hover:border-orange-300'
                          }`}
                        >
                          <div className="flex items-center justify-between pb-1 mb-2 border-b border-slate-100">
                            <span className="text-[10px] font-extrabold uppercase bg-orange-100 text-orange-700 px-2 py-0.5 rounded">
                              #{index + 1} ({block.type.toUpperCase()})
                            </span>
                            <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100">
                              <button
                                type="button"
                                onClick={(e) => { e.stopPropagation(); handleMoveBlock(index, 'up'); }}
                                disabled={index === 0}
                                className="p-1 bg-slate-100 hover:bg-slate-200 rounded text-slate-700 disabled:opacity-30 text-xs font-bold"
                                title="Move Up"
                              >
                                ▲
                              </button>
                              <button
                                type="button"
                                onClick={(e) => { e.stopPropagation(); handleMoveBlock(index, 'down'); }}
                                disabled={index === blocks.length - 1}
                                className="p-1 bg-slate-100 hover:bg-slate-200 rounded text-slate-700 disabled:opacity-30 text-xs font-bold"
                                title="Move Down"
                              >
                                ▼
                              </button>
                              <button
                                type="button"
                                onClick={(e) => { e.stopPropagation(); handleDeleteBlock(block.id); }}
                                className="p-1 bg-red-50 hover:bg-red-100 rounded text-red-600 font-bold text-xs"
                                title="Delete Block"
                              >
                                ✕
                              </button>
                            </div>
                          </div>

                          {block.type === 'img' ? (
                            <div className="space-y-2">
                              <div className="w-full h-40 relative rounded-xl overflow-hidden bg-slate-200">
                                <Image src={block.src || ''} alt={block.alt || ''} fill className="object-cover" referrerPolicy="no-referrer" />
                              </div>
                              <input
                                type="text"
                                value={block.alt || ''}
                                onClick={(e) => { e.stopPropagation(); setSelectedBlockId(block.id); }}
                                onChange={(e) => {
                                  const alt = e.target.value;
                                  const slug = alt.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
                                  const updated = blocks.map(b => b.id === block.id ? { ...b, alt, slug } : b);
                                  setBlocks(updated);
                                  pushHistory(updated);
                                }}
                                placeholder="Image Alt Text..."
                                className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-black font-medium"
                              />
                            </div>
                          ) : (
                            <textarea
                              rows={block.type === 'p' ? 3 : 2}
                              value={block.content}
                              onClick={(e) => { e.stopPropagation(); setSelectedBlockId(block.id); }}
                              onChange={(e) => handleUpdateBlockContent(block.id, e.target.value)}
                              className={`w-full p-2 bg-transparent text-black font-medium focus:outline-none resize-y ${
                                block.type === 'h1' ? 'text-2xl font-extrabold' :
                                block.type === 'h2' ? 'text-xl font-bold' :
                                block.type === 'h3' ? 'text-lg font-bold' : 'text-base'
                              }`}
                            />
                          )}
                        </div>
                      );
                    })}

                    <div className="pt-3 flex flex-wrap gap-2">
                      <button type="button" onClick={() => handleAddBlock('p')} className="px-4 py-2 bg-orange-600 text-white rounded-xl text-xs font-bold hover:bg-orange-700 transition-colors">
                        + Add Paragraph Block
                      </button>
                      <button type="button" onClick={() => handleAddBlock('h2')} className="px-4 py-2 bg-slate-800 text-white rounded-xl text-xs font-bold hover:bg-slate-900 transition-colors">
                        + Add Heading Block
                      </button>
                      <button type="button" onClick={insertListBlock} className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-black rounded-xl text-xs font-bold transition-colors">
                        + Add List Block
                      </button>
                    </div>
                  </div>
                ) : (
                  <textarea
                    rows={20}
                    value={rawHtmlContent}
                    onChange={(e) => setRawHtmlContent(e.target.value)}
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
                  className="px-8 py-3 bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-xl text-xs shadow-md"
                >
                  Save & Publish to Firebase
                </button>
              </div>
            </form>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col">
      {/* Admin panel screen spacing: just 10px spacing on left and right side */}
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
              onClick={handleClearCacheAndRefresh}
              className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold inline-flex items-center gap-2 border border-slate-700 shadow-md"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Clear Cache</span>
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-3 border-b border-slate-200 pb-3">
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
            onClick={() => setActiveTab('categories')}
            className={`px-5 py-2.5 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === 'categories' ? 'bg-orange-600 text-white shadow-md' : 'bg-white text-black hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <Folder className="w-4 h-4" />
            <span>Categories Manager ({customCategories.length})</span>
          </button>
        </div>

        {/* Tab 1: Tutorials Manager */}
        {activeTab === 'tutorials' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-extrabold text-black">All Tutorial Articles</h2>
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
              ) : posts.length === 0 ? (
                <div className="p-12 text-center text-slate-500 font-medium text-sm">No tutorial articles found. Click &quot;Create New Tutorial&quot; above.</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-xs font-extrabold text-black">
                        <th className="p-4">Title & Slug</th>
                        <th className="p-4">Category</th>
                        <th className="p-4">Author</th>
                        <th className="p-4">Status</th>
                        <th className="p-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-xs">
                      {posts.map((p) => (
                        <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="p-4 space-y-1">
                            <div className="font-bold text-black text-sm">{p.title}</div>
                            <div className="text-orange-600 font-mono text-[11px]">/{p.slug}</div>
                          </td>
                          <td className="p-4 font-semibold text-black">
                            <span className="px-2.5 py-1 bg-orange-50 text-orange-700 rounded-lg">{p.category || 'AI Guides'}</span>
                          </td>
                          <td className="p-4 font-bold text-black">{p.author || 'Anwar'}</td>
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
                              <li key={p.id} className="text-xs font-medium text-black truncate flex items-center justify-between">
                                <Link href={`/${p.slug}`} target="_blank" className="hover:text-orange-600 truncate flex-1">
                                  • {p.title}
                                </Link>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    </div>

                    <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs font-bold">
                      <Link href={`/${catSlug}`} target="_blank" className="text-orange-600 hover:underline inline-flex items-center gap-1">
                        <span>View Archive Page</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </Link>
                      <span className="text-slate-500">{catPosts.length} posts</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

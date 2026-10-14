'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Plus, Edit, Trash2, Database, CheckCircle, ExternalLink, Sparkles, FileText, ArrowLeft, Image as ImageIcon, Link as LinkIcon, Bold, Italic, Heading1, Heading2, Heading3, Code, Wand2, Upload, X, RefreshCw } from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { 
  fetchBlogPostsFromFirestore, 
  saveBlogPostToFirestore, 
  deleteBlogPostFromFirestore,
  getStoredBlogPostsSync,
  clearClientCache
} from '@/lib/storage';
import { BlogPost } from '@/lib/types';

export default function AdminPanelPage() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);

  // Full-page Editor View State for Blog
  const [isEditingBlog, setIsEditingBlog] = useState(false);
  const [editingBlogId, setEditingBlogId] = useState<string | null>(null);
  const [blogTitle, setBlogTitle] = useState('');
  const [blogSlug, setBlogSlug] = useState('');
  const [blogExcerpt, setBlogExcerpt] = useState('');
  const [blogContent, setBlogContent] = useState('');
  const [blogCategory, setBlogCategory] = useState('AI Guides');
  const [blogAuthor, setBlogAuthor] = useState('Admin');
  const [blogImage, setBlogImage] = useState('https://picsum.photos/seed/blogdefault/800/450');
  const [blogImageAlt, setBlogImageAlt] = useState('');
  const [blogStatus, setBlogStatus] = useState<'published' | 'draft'>('published');

  // WordPress Code Importer State
  const [wpRawCode, setWpRawCode] = useState('');
  const [showWpImporter, setShowWpImporter] = useState(false);

  // Link Insertion Popup Modal State
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [linkInputUrl, setLinkInputUrl] = useState('https://');
  const [linkInputText, setLinkInputText] = useState('');

  const contentRef = useRef<HTMLTextAreaElement>(null);
  const contentImageInputRef = useRef<HTMLInputElement>(null);
  const featuredImageInputRef = useRef<HTMLInputElement>(null);
  const restoreFileInputRef = useRef<HTMLInputElement>(null);

  const [notification, setNotification] = useState<string | null>(null);

  const loadData = async (force = false) => {
    setLoading(true);
    try {
      const data = await fetchBlogPostsFromFirestore(force);
      setPosts(data);
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

  const handleClearCacheAndRefresh = () => {
    clearClientCache();
    loadData(true);
    showNotify('24-hour cache cleared successfully! Fetched fresh data from Firebase.');
  };

  const insertTag = (tagOpen: string, tagClose: string = '') => {
    const textarea = contentRef.current;
    if (!textarea) return;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = textarea.value;
    const selectedText = text.substring(start, end) || 'Text here';
    const replacement = tagOpen + selectedText + tagClose;
    
    const newContent = text.substring(0, start) + replacement + text.substring(end);
    setBlogContent(newContent);
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + tagOpen.length, start + tagOpen.length + selectedText.length);
    }, 0);
  };

  // Local Image Upload for Article Content (Mid-article WordPress style)
  const handleContentImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (uploadEvent) => {
      const base64String = uploadEvent.target?.result as string;
      const alt = prompt('Enter Image Alt Text (for SEO & accessibility):', 'Tutorial illustration image');
      const imgHtml = `<img src="${base64String}" alt="${alt || 'Tutorial image'}" class="w-full rounded-2xl my-4 shadow-md" />\n`;
      insertTag(imgHtml, '');
    };
    reader.readAsDataURL(file);
    if (contentImageInputRef.current) contentImageInputRef.current.value = '';
  };

  // Local Featured Image Upload
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

  // Link Popup Handlers
  const handleOpenLinkModal = () => {
    const textarea = contentRef.current;
    if (textarea) {
      const selected = textarea.value.substring(textarea.selectionStart, textarea.selectionEnd);
      setLinkInputText(selected || '');
    }
    setLinkInputUrl('https://');
    setShowLinkModal(true);
  };

  const handleConfirmInsertLink = (e: React.FormEvent) => {
    e.preventDefault();
    if (!linkInputUrl.trim()) return;

    const anchorText = linkInputText.trim() || linkInputUrl;
    const linkHtml = `<a href="${linkInputUrl}" target="_blank" rel="noopener noreferrer" class="text-orange-600 underline font-bold">${anchorText}</a>`;
    insertTag(linkHtml, '');
    setShowLinkModal(false);
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

    setBlogContent(prev => (prev ? prev + '\n\n' + cleaned : cleaned));
    setWpRawCode('');
    setShowWpImporter(false);
    showNotify('WordPress code successfully converted and inserted into editor!');
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
          for (const post of importedPosts) {
            await saveBlogPostToFirestore(post);
          }
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

  const handleOpenNewBlog = () => {
    setEditingBlogId(null);
    setBlogTitle('');
    setBlogSlug('');
    setBlogExcerpt('');
    setBlogContent('<h1>Article Title</h1>\n<p>Start writing your tutorial here...</p>');
    setBlogCategory('AI Guides');
    setBlogAuthor('Admin');
    setBlogImage('https://picsum.photos/seed/newpost/800/450');
    setBlogImageAlt('AI tutorial featured image');
    setBlogStatus('published');
    setIsEditingBlog(true);
  };

  const handleOpenEditBlog = (b: BlogPost) => {
    setEditingBlogId(b.id);
    setBlogTitle(b.title);
    setBlogSlug(b.slug);
    setBlogExcerpt(b.excerpt);
    setBlogContent(b.content);
    setBlogCategory(b.category);
    setBlogAuthor(b.author);
    setBlogImage(b.image);
    setBlogImageAlt(b.imageAlt || '');
    setBlogStatus(b.status || 'published');
    setIsEditingBlog(true);
  };

  const handleSaveBlog = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!blogTitle.trim() || !blogSlug.trim()) return;

    const formattedSlug = blogSlug.toLowerCase().replace(/\s+/g, '-');
    const postId = editingBlogId || ('blog-' + Date.now());

    const postToSave: BlogPost = {
      id: postId,
      title: blogTitle,
      slug: formattedSlug,
      excerpt: blogExcerpt,
      content: blogContent,
      category: blogCategory,
      author: blogAuthor,
      date: new Date().toLocaleDateString('hi-IN', { day: 'numeric', month: 'short', year: 'numeric' }),
      readTime: '5 min read',
      image: blogImage,
      imageAlt: blogImageAlt,
      status: blogStatus
    };

    try {
      await saveBlogPostToFirestore(postToSave);
      await loadData(true);
      showNotify(editingBlogId ? 'Tutorial updated & synced with Firebase!' : 'New tutorial published to Firebase!');
      setIsEditingBlog(false);
    } catch (err) {
      alert('Error saving to Firebase: ' + (err as Error).message);
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
  // RENDER FULL-PAGE BLOG EDITOR
  // ==========================================
  if (isEditingBlog) {
    return (
      <>
        <Navbar />
        <main className="flex-1 max-w-5xl mx-auto px-4 sm:px-6 py-10 space-y-8">
          <div className="flex items-center justify-between">
            <button
              onClick={() => setIsEditingBlog(false)}
              className="inline-flex items-center gap-2 text-sm font-bold text-black hover:text-orange-600 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Tutorials Dashboard</span>
            </button>

            <div className="flex items-center gap-3">
              <span className="text-xs font-bold text-black">Post Status:</span>
              <select
                value={blogStatus}
                onChange={(e) => setBlogStatus(e.target.value as any)}
                className="px-3 py-1.5 bg-slate-100 rounded-xl text-xs font-bold text-black"
              >
                <option value="published">Published</option>
                <option value="draft">Draft</option>
              </select>
            </div>
          </div>

          <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-12 shadow-sm space-y-8">
            <div className="space-y-2">
              <h1 className="text-2xl md:text-3xl font-extrabold text-black tracking-tight">
                {editingBlogId ? 'Edit WordPress Tutorial Post' : 'Create New WordPress Tutorial Post'}
              </h1>
              <p className="text-black text-sm font-medium">
                Write or paste your WordPress article below. Mid-article local image uploads and popup link insertion supported.
              </p>
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
                    अपने पुराने WordPress पोस्ट का HTML या Gutenberg ब्लॉक कोड यहाँ पेस्ट करें। &ldquo;Convert &amp; Insert&rdquo; पर क्लिक करते ही यह साफ HTML फॉर्मेट में नीचे एडिटर में आ जाएगा।
                  </p>
                  <textarea
                    rows={5}
                    value={wpRawCode}
                    onChange={(e) => setWpRawCode(e.target.value)}
                    placeholder="Paste WordPress post code here (<!-- wp:paragraph --> ...)"
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-bold text-black mb-2">Article Title *</label>
                  <input
                    type="text"
                    required
                    value={blogTitle}
                    onChange={(e) => setBlogTitle(e.target.value)}
                    placeholder="उदा: Top 10 AI Tools in Hindi"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-black font-medium focus:ring-2 focus:ring-orange-600/20"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-black mb-2">Exact WordPress Slug (URL) *</label>
                  <input
                    type="text"
                    required
                    value={blogSlug}
                    onChange={(e) => setBlogSlug(e.target.value)}
                    placeholder="top-ai-tools-in-hindi"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono text-orange-600 font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-bold text-black mb-2">Category (e.g. Image Tutorials, AI Guides)</label>
                  <input
                    type="text"
                    value={blogCategory}
                    onChange={(e) => setBlogCategory(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-black font-medium"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-black mb-2">Author</label>
                  <input
                    type="text"
                    value={blogAuthor}
                    onChange={(e) => setBlogAuthor(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-black font-medium"
                  />
                </div>
              </div>

              {/* Featured Image Local Upload Section */}
              <div className="space-y-3 bg-slate-50 border border-slate-200 p-6 rounded-2xl">
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
                        <span>Upload Featured Image from Computer</span>
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
                  <label className="block text-xs font-bold text-black mb-1 mt-2">Image Alt Text (SEO)</label>
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
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-black font-medium"
                />
              </div>

              {/* WordPress-Style Formatting Toolbar with Mid-Article Image Upload */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-black">Rich HTML Content Editor (WordPress Style)</label>
                  <span className="text-xs text-orange-600 font-bold">💡 Tip: Place cursor in text and click &quot;Upload Mid-Article Image&quot;</span>
                </div>

                <div className="flex flex-wrap items-center gap-1.5 p-2.5 bg-slate-100 rounded-xl border border-slate-200">
                  <button type="button" onClick={() => insertTag('<h1>', '</h1>')} className="px-3 py-1.5 bg-white hover:bg-orange-50 hover:text-orange-600 rounded-lg text-xs font-bold text-black shadow-sm flex items-center gap-1">
                    <Heading1 className="w-3.5 h-3.5" /> H1
                  </button>
                  <button type="button" onClick={() => insertTag('<h2>', '</h2>')} className="px-3 py-1.5 bg-white hover:bg-orange-50 hover:text-orange-600 rounded-lg text-xs font-bold text-black shadow-sm flex items-center gap-1">
                    <Heading2 className="w-3.5 h-3.5" /> H2
                  </button>
                  <button type="button" onClick={() => insertTag('<h3>', '</h3>')} className="px-3 py-1.5 bg-white hover:bg-orange-50 hover:text-orange-600 rounded-lg text-xs font-bold text-black shadow-sm flex items-center gap-1">
                    <Heading3 className="w-3.5 h-3.5" /> H3
                  </button>
                  <span className="text-slate-300">|</span>
                  <button type="button" onClick={() => insertTag('<p>', '</p>')} className="px-3 py-1.5 bg-white hover:bg-orange-50 hover:text-orange-600 rounded-lg text-xs font-bold text-black shadow-sm">
                    Paragraph
                  </button>
                  <button type="button" onClick={() => insertTag('<strong>', '</strong>')} className="px-3 py-1.5 bg-white hover:bg-orange-50 hover:text-orange-600 rounded-lg text-xs font-bold text-black shadow-sm flex items-center gap-1">
                    <Bold className="w-3.5 h-3.5" /> Bold
                  </button>
                  <button type="button" onClick={() => insertTag('<em>', '</em>')} className="px-3 py-1.5 bg-white hover:bg-orange-50 hover:text-orange-600 rounded-lg text-xs font-bold text-black shadow-sm flex items-center gap-1">
                    <Italic className="w-3.5 h-3.5" /> Italic
                  </button>
                  <span className="text-slate-300">|</span>
                  {/* Link Popup Button */}
                  <button type="button" onClick={handleOpenLinkModal} className="px-3 py-1.5 bg-white hover:bg-orange-50 hover:text-orange-600 rounded-lg text-xs font-bold text-black shadow-sm flex items-center gap-1">
                    <LinkIcon className="w-3.5 h-3.5" /> Insert Link
                  </button>
                  {/* Mid-Article Content Image Upload Button */}
                  <input
                    type="file"
                    accept="image/*"
                    ref={contentImageInputRef}
                    onChange={handleContentImageUpload}
                    className="hidden"
                    id="contentImgUploadInput"
                  />
                  <label
                    htmlFor="contentImgUploadInput"
                    className="px-3.5 py-1.5 bg-orange-600 hover:bg-orange-700 text-white rounded-lg text-xs font-bold shadow-sm flex items-center gap-1.5 cursor-pointer"
                  >
                    <Upload className="w-3.5 h-3.5" /> Upload Mid-Article Image
                  </label>
                  <button type="button" onClick={() => insertTag('<ul>\n  <li>', '</li>\n</ul>')} className="px-3 py-1.5 bg-white hover:bg-orange-50 hover:text-orange-600 rounded-lg text-xs font-bold text-black shadow-sm">
                    List
                  </button>
                </div>

                <textarea
                  ref={contentRef}
                  rows={16}
                  required
                  value={blogContent}
                  onChange={(e) => setBlogContent(e.target.value)}
                  placeholder="Write or paste HTML article content here..."
                  className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-mono text-black font-medium focus:ring-2 focus:ring-orange-600/20"
                />
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

        {/* Link Insertion Popup Modal */}
        {showLinkModal && (
          <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl max-w-md w-full p-8 space-y-6 shadow-2xl">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="text-lg font-bold text-black">Insert Hyperlink</h3>
                <button onClick={() => setShowLinkModal(false)} className="text-slate-400 hover:text-black">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleConfirmInsertLink} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-black mb-1">Target URL *</label>
                  <input
                    type="url"
                    required
                    value={linkInputUrl}
                    onChange={(e) => setLinkInputUrl(e.target.value)}
                    placeholder="https://example.com"
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-black font-medium focus:ring-2 focus:ring-orange-600/20"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-black mb-1">Link Text (Anchor Text)</label>
                  <input
                    type="text"
                    value={linkInputText}
                    onChange={(e) => setLinkInputText(e.target.value)}
                    placeholder="Click here or selected text"
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-black font-medium focus:ring-2 focus:ring-orange-600/20"
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setShowLinkModal(false)}
                    className="px-4 py-2 text-xs font-bold text-black hover:bg-slate-100 rounded-xl"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2.5 bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-xl text-xs shadow-md"
                  >
                    Insert Link
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        <Footer />
      </>
    );
  }

  // ==========================================
  // RENDER MAIN ADMIN DASHBOARD (Tutorials + Backup & Restore & Clear Cache)
  // ==========================================
  return (
    <>
      <Navbar />

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 py-12 space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-orange-50 border border-orange-200 text-orange-700 text-xs font-bold">
              <Database className="w-3.5 h-3.5 text-orange-600" />
              <span>Firebase Firestore + WordPress Admin</span>
            </div>
            <h1 className="text-3xl font-extrabold text-black tracking-tight">Tutorials Content Management</h1>
            <p className="text-black text-sm font-medium">
              Manage your high-traffic Hindi AI tutorials, 24-hr cache, backup data, and publish instantly to Firebase.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={handleClearCacheAndRefresh}
              className="px-4 py-2.5 bg-amber-100 hover:bg-amber-200 text-amber-900 font-bold rounded-xl text-xs shadow-sm transition-colors inline-flex items-center gap-1.5"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Clear Cache (कैश साफ़ करें)</span>
            </button>

            <button
              onClick={handleOpenNewBlog}
              className="px-5 py-2.5 bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-xl text-xs shadow-md transition-colors inline-flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              <span>Add New Tutorial Post</span>
            </button>
          </div>
        </div>

        {notification && (
          <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl text-sm font-bold flex items-center gap-2 shadow-sm">
            <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>{notification}</span>
          </div>
        )}

        {/* Backup & Restore Section */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-black">Site Data Backup & Restore (बैकअप और रीस्टोर)</h2>
              <p className="text-xs text-black font-medium mt-0.5">Export all tutorial articles as a JSON backup file or restore/import articles into Firebase.</p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={handleExportBackup}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-black font-bold rounded-xl text-xs inline-flex items-center gap-2 transition-colors"
              >
                <Upload className="w-4 h-4 rotate-180" />
                <span>Export JSON Backup</span>
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
                className="px-4 py-2.5 bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-xl text-xs cursor-pointer inline-flex items-center gap-2 shadow-sm transition-colors"
              >
                <Upload className="w-4 h-4" />
                <span>Restore from Backup</span>
              </label>
            </div>
          </div>
        </div>

        {/* Posts Table */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <h2 className="text-lg font-bold text-black">All Tutorial Articles ({posts.length})</h2>
            <span className="text-xs font-semibold text-slate-500">24-Hour Cached & Synced with Firebase</span>
          </div>

          {loading ? (
            <div className="py-16 text-center text-black font-medium">Loading from Firebase...</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-black font-bold text-xs uppercase tracking-wider">
                    <th className="py-4 px-6">Title & WordPress Slug</th>
                    <th className="py-4 px-6">Category</th>
                    <th className="py-4 px-6">Status</th>
                    <th className="py-4 px-6">Date</th>
                    <th className="py-4 px-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {posts.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-4 px-6">
                        <div className="font-bold text-black line-clamp-1">{p.title}</div>
                        <div className="text-xs font-mono text-orange-600 font-bold mt-0.5">/{p.slug}</div>
                      </td>
                      <td className="py-4 px-6 text-black font-medium">
                        <Link href={`/${p.category.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')}`} className="hover:text-orange-600 underline">
                          {p.category}
                        </Link>
                      </td>
                      <td className="py-4 px-6">
                        <span className={`px-2.5 py-1 text-xs font-bold rounded-full ${
                          p.status === 'draft' ? 'bg-amber-50 text-amber-800 border border-amber-200' : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                        }`}>
                          {p.status === 'draft' ? 'Draft' : 'Published'}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-black/75 text-xs font-medium">{p.date}</td>
                      <td className="py-4 px-6 text-right space-x-2 whitespace-nowrap">
                        <button
                          onClick={() => handleOpenEditBlog(p)}
                          className="px-3 py-1.5 bg-slate-100 hover:bg-orange-50 hover:text-orange-600 text-black font-bold rounded-lg text-xs transition-colors"
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
      </main>

      <Footer />
    </>
  );
}

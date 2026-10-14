# Aitoolhindi.online - Next.js Migration & Hindi AI Tools Directory

Migrate `aitoolhindi.online` from WordPress to a high-performance Next.js app with exact URL preservation for existing blog articles, an expanded Hindi AI Tools Directory, Hindi/English search & category filtering, AI tool submission and review system, and a dynamic Admin Panel at `/admin-panel`.

## User Review & Critical Decisions

> [!IMPORTANT]
> - **URL Preservation**: Existing blog posts will be hosted at their exact WordPress URLs (e.g., `/[slug]`) on the main domain `aitoolhindi.online`, ensuring zero SEO harm or broken links during Vercel deployment.
> - **Admin Panel**: Accessible at `/admin-panel` without authentication gating (per user preference), allowing full dynamic CRUD operations on blog posts and AI tools with persistent storage (localStorage + initial seed data).
> - **Directory & Blog**: Rich Hindi/English bilingual UI, category filtering, search, AI tool submissions, and review ratings.

- **Confirmed Decision 1**: Exact URL parity with WordPress for blog posts on the main domain.
- **Confirmed Decision 2**: Dedicated admin panel at `/admin-panel` for managing tools and blog posts.
- **Confirmed Decision 3**: Client-side robust state persistence with pre-seeded popular Hindi AI articles and tools.

---

### 1. Overview & Core Concept

- **What It Does**: A comprehensive bilingual (Hindi & English) portal combining the existing informational AI blog tutorials from WordPress with a modern AI Tools Directory, tool submission system, user reviews, and an admin content management dashboard.
- **Target Audience**: Hindi speakers, students, creators, and professionals searching for AI tools and tutorials in Hindi.
- **Key Value**: Preserves all existing blog URLs for seamless SEO migration while expanding into a top-tier AI tools directory with instant search, filters, and admin management.

### 2. User Experience & Visual Design

- **Key User Flows**:
  1. *Visitors landing on homepage*: Browse featured AI tools, latest Hindi blog articles, category filters, and search bar.
  2. *Exploring AI Tools Directory*: Filter tools by category (Text, Image, Video, Coding, etc.), view tool cards with pricing/ratings, and read detailed tool info or submit a new tool.
  3. *Reading Blog Posts*: Access articles at their exact WordPress URLs (`/[slug]`), complete with clean typography, share buttons, related tools, and breadcrumbs.
  4. *Admin Panel (`/admin-panel`)*: Switch between "Manage Blog Posts" and "Manage AI Tools" tabs to add new items, edit existing entries, or delete records.
- **Visual Identity & Theme**:
  - *Aesthetic Direction*: Modern editorial & tech directory (clean neutral slate canvas, deep indigo/emerald accents, high legibility for Hindi Devanagari script and English text).
  - *Color Palette*: Slate neutrals (`--background: #f8fafc`, `--foreground: #0f172a`), Primary Indigo (`#4f46e5`), Accent Emerald (`#10b981`).
  - *Typography*: `Plus Jakarta Sans` for headings and clean bilingual body prose with proper line height (`1.7`).

### 3. Key Product Decisions & Trade-Offs

- **Decision 1**: Client-side storage with pre-seeded realistic data & localStorage persistence.
  - *Why*: Instantly functional and testable without requiring an external database setup, while the Admin Panel allows immediate adding/editing of live items.
- **Decision 2**: Dynamic routing for blog posts (`/[slug]`) and tools (`/tools/[id]`).
  - *Why*: Matches exact WordPress URL slugs to protect search engine rankings and organic traffic.

### 4. Technical Architecture & Data Strategy *(Technical Reference)*

```
┌────────────────────────────────────────────────────────┐
│                        Next.js                         │
├──────────────────────┬─────────────────────────────────┤
│  Public Routes       │  Admin & Management             │
│  - / (Home)          │  - /admin-panel (CRUD Dashboard)│
│  - /blog             │  - /submit-tool (User Submission│
│  - /[slug] (Blog WP) │                                 │
│  - /tools            │                                 │
│  - /tools/[id]       │                                 │
├──────────────────────┴─────────────────────────────────┤
│                  React State / LocalStorage             │
│                  (Blog Posts & AI Tools Store)          │
└────────────────────────────────────────────────────────┘
```

- **Data Models**:
  - *Blog Post*: id, slug, title, excerpt, content, category, author, date, readTime, image.
  - *AI Tool*: id, name, tagline, description, category, pricing (Free, Freemium, Paid), rating, url, image, featured.
- **SEO Implementation**:
  - Next.js Metadata API for page titles, descriptions, OpenGraph cards, and JSON-LD Schema (`Article` and `SoftwareApplication`) for rich Google search snippets.

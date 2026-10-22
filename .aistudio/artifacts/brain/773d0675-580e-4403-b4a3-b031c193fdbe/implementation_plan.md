# Aitoolhindi.online - Next.js Migration & Google Sheets Headless CMS

Migrate `aitoolhindi.online` to a high-performance Next.js app with zero database read quotas by leveraging Google Sheets as a Headless CMS (via Published Web CSV & Google Apps Script 2-way Webhooks), with Cloudinary as the next phase for media assets.

## Database & Architecture Milestone: Google Sheets Integration (Completed)

### 1. The Core Problem Solved
- **Firebase Read Quota Problem**: Firebase Firestore has a daily quota limit of 50,000 reads which exhausted within hours, even with 1 user.
- **The Google Sheets Solution**:
  1. Google Sheets Published to Web CSV (`https://docs.google.com/spreadsheets/d/e/.../pub?output=csv`) provides **0-auth, 0-cost, unlimited CDN-cached reads**.
  2. Local disk & browser caching (24-hour TTL) ensures visitors load pages in milliseconds without repeated network hits.
  3. Cell limit protection: Google Sheets has a strict 50,000 character limit per cell. Long articles (> 40,000 characters) are automatically split between `content` and `content2` columns upon export and seamlessly reassembled upon fetch, ensuring 100% data integrity without Google Sheets errors.

---

### 2. Implemented Features & Endpoints

1. **Google Sheets Helper (`/lib/google-sheets.ts`)**:
   - `convertPostsToCsv`: Generates RFC 4180 compliant CSV with UTF-8 BOM (`\uFEFF`) for perfect Hindi unicode rendering in Excel and Google Sheets.
   - `parseCsvToBlogPosts`: Robust multiline CSV parser handling quotes, line breaks, and auto-joining `content` + `content2`.
   - `normalizeGoogleSheetUrl`: Automatically detects and converts standard Google Sheets URLs (`/edit#gid=0` -> `/export?format=csv`).
   - `GOOGLE_APPS_SCRIPT_TEMPLATE`: Complete copy-paste Google Apps Script code for `doGet` and `doPost` to enable 2-way live sync (auto-save and auto-delete from Admin Panel).

2. **Google Sheets API Route (`/app/api/sheets/route.ts`)**:
   - `GET /api/sheets?action=export`: 1-click download of all 35 articles as a Google Sheets-ready CSV.
   - `GET /api/sheets?action=config`: Returns persistent configuration (`sheets-config.json`).
   - `GET /api/sheets?action=sync&url=...`: Server-side connection test and live sync of articles from Google Sheet.
   - `POST /api/sheets`: Updates configuration and proxies `webhook_save` and `webhook_delete` requests to Google Apps Script (bypassing browser CORS).

3. **Storage Pipeline (`/lib/storage.ts`)**:
   - `fetchBlogPostsFromFirestore`: Checks 24-hr local cache -> pulls from Google Sheets CSV (if configured) -> merges with local disk backup (`/api/articles`).
   - `saveBlogPostToFirestore`: Saves to localStorage, server disk (`/api/articles`), and fires background webhook to Google Sheets.
   - `deleteBlogPostFromFirestore`: Deletes from localStorage, server disk, and fires background webhook to Google Sheets.

4. **Admin Panel UI (`/app/admin-panel/page.tsx`)**:
   - **Google Sheets Database Tab**:
     - Quick status badges: Active Database Source, 0 Reads / Free Forever, 100% Safe Cell Limits.
     - **Step 1 Card**: "Download CSV" with clear 4-step import instructions.
     - **Step 2 Card**: Input for Published Google Sheet CSV URL + "Test & Sync Articles Now" button.
     - **Step 3 Card**: 2-Way Webhook setup with 1-click "Copy Apps Script Code" and setup instructions.
     - **Live Inspection Table**: Real-time overview of articles, character counts, and cell limit safety status.

---

### 3. Next Milestone: Cloudinary Integration
- As requested by the user, now that the Google Sheets database migration is complete and tested, the next phase will implement Cloudinary media storage while preserving original WordPress image URL slugs.

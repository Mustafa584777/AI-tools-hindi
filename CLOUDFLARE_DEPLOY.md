# Cloudflare Deployment Guide for Aitoolhindi.online

This Next.js application is fully configured for seamless deployment to **Cloudflare Workers / Pages** using **OpenNext** (`@opennextjs/cloudflare`).

## 📁 Cloudflare Configuration Files Created:
1. **`wrangler.jsonc`**: Defines worker settings, `nodejs_compat` compatibility flags, and static asset bindings (`.open-next/assets`).
2. **`open-next.config.ts`**: Configures the OpenNext Cloudflare adapter.
3. **`package.json`**: Updated with build, preview, and deploy scripts.

---

## 🚀 How to Build and Deploy

### 1. Build for Cloudflare
To build your Next.js application into Cloudflare worker format:
```bash
npm run build
```
*(This runs `npx opennextjs-cloudflare build`)*

### 2. Preview Locally (Wrangler Runtime)
To test and preview the production build locally inside Cloudflare's `workerd` runtime:
```bash
npm run preview
```

### 3. Deploy to Cloudflare
To deploy live to Cloudflare Workers:
1. Log in to your Cloudflare account via Wrangler (if not already logged in):
   ```bash
   npx wrangler login
   ```
2. Run the deployment command:
   ```bash
   npm run deploy
   ```

---

### 🌐 Deploying via Cloudflare Dashboard (Pages)
If you prefer connecting your GitHub repository to **Cloudflare Pages**:
- **Framework preset**: `Next.js (OpenNext)`
- **Build command**: `npm run build`
- **Build output directory**: `.open-next`
- **Node.js version**: `20+` or `22+`

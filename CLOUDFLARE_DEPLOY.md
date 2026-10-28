# Cloudflare Pages Deployment Guide

To deploy `aitoolhindi.online` successfully to Cloudflare Pages, use these exact settings in your Cloudflare dashboard:

## ⚙️ Cloudflare Pages Dashboard Settings:

1. **Framework preset**: `None`
2. **Build command**: `npm run build`
3. **Build output directory**: `.open-next`
4. **Root directory**: `/` (Leave empty)

---

## 🛠️ How It Works:
- **`package.json` `"build"` script** runs `next build && npx opennextjs-cloudflare build` sequentially.
- This compiles Next.js first and then bundles it into the `.open-next` output directory expected by Cloudflare Pages, completely avoiding any infinite recursion loops.

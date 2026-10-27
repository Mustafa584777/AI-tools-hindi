# Cloudflare Pages & Workers Deployment Guide

To deploy `aitoolhindi.online` successfully to Cloudflare Pages, use the exact configuration below (as seen in your Cloudflare dashboard):

## ⚙️ Cloudflare Pages Dashboard Settings:

1. **Framework preset**: `None` (or custom)
2. **Build command**: `npm run build`
3. **Build output directory**: `.open-next`
4. **Root directory**: `/` (Leave empty)

---

## 📄 Required Files Configured:
- **`wrangler.toml`**: Configured with `pages_build_output_dir = ".open-next"` and `nodejs_compat`.
- **`open-next.config.ts`**: OpenNext Cloudflare adapter settings.
- **`package.json`**: `"build"` script is set to `npx opennextjs-cloudflare build` which automatically compiles Next.js and generates the `.open-next` output directory.

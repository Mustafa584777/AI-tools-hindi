# Cloudflare Pages Deployment Guide (Fixed)

To prevent infinite build recursion loops on Cloudflare Pages, follow these exact settings:

## ⚙️ Cloudflare Pages Dashboard Settings:

1. **Framework preset**: `None`
2. **Build command**: `npx @opennextjs/cloudflare` *(DO NOT use `npm run build` here)*
3. **Build output directory**: `.open-next`
4. **Root directory**: `/` (Leave empty)

---

## 🛠️ How It Works:
- **`package.json` `"build"` script** is set to `"next build"`.
- When Cloudflare runs `npx @opennextjs/cloudflare`, OpenNext triggers `"next build"` safely once, packages the output into `.open-next`, and deploys successfully without infinite looping.

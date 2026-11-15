# Ghanam Rang

Storefront for **Ghanam Rang** — abaya and khimar sets in deep colour. Built with Next.js 15, React 19, Tailwind CSS 4, Framer Motion and three.js.

## What's in it

- **Home** — floating cluster of the models over a real-3D (WebGL) silk that takes the colour of the piece in front; click a figure for a focus view with colour swatches. Scroll effects: the hero tips back into the distance, a statement lights up word by word, a scroll-driven marquee, and a progress line.
- **The Rail** — the collection on hangers; scrolling slides the rack, pieces swing, tap one for a quick view.
- **Try the Style** (`/try-the-style`) — swipeable 3D photo carousel with the full set and sizes.
- **Shop** (`/shop`) and **product pages** (`/product/[id]`) — colourways, size chart, 3D card tilt.
- **Bag + checkout** (`/checkout`) — cash on delivery or bank / JazzCash / Easypaisa transfer; prices are always re-calculated on the server from the catalog.
- **Order confirmation** (`/order/[token]`) — with a one-tap "confirm on WhatsApp" message.
- **Admin** (`/admin`) — password-protected list of orders with status updates.

## Run locally

```bash
npm install
cp .env.example .env.local   # then set ADMIN_PASSWORD and ADMIN_SECRET
npm run dev
```

Open http://localhost:3000. The admin page is at http://localhost:3000/admin.

## Things to fill in before going live

| What | Where |
| --- | --- |
| Real prices, names, fabrics | `src/data/catalog.ts` (prices are placeholders) |
| Size chart ↔ product pairing | `src/data/catalog.ts` |
| Delivery fee, free-delivery threshold | `src/lib/checkout.ts` |
| Bank / JazzCash / Easypaisa account details | `src/lib/checkout.ts` (`TRANSFER_ACCOUNTS`) |
| Admin password and cookie secret | `.env.local` (never commit it) |

## Deploying on Vercel

1. Merge into `main` (Vercel deploys `main` to production).
2. **Storage → Create → Upstash for Redis** (free plan), and connect it to this project. Vercel adds `KV_REST_API_URL` and `KV_REST_API_TOKEN` automatically.
3. **Settings → Environment Variables:** add `ADMIN_PASSWORD` and `ADMIN_SECRET` (a long random string).
4. Redeploy.

Where orders are stored (`src/lib/orders.ts`):

- **Upstash Redis** whenever `KV_REST_API_URL` + `KV_REST_API_TOKEN` (or `UPSTASH_REDIS_REST_URL` + `UPSTASH_REDIS_REST_TOKEN`) are set — use this on Vercel.
- Otherwise **`.data/orders.json`** (git-ignored — it holds customer details), for local development or a single VPS.
- On Vercel without Redis, placing an order fails with a clear message rather than losing it, and `/admin` explains what's missing.

# SEO Auditor

A full-featured SEO crawler and audit tool. Crawl any website and get a detailed SEO audit covering meta tags, content quality, external links, and sitemap coverage.

## Features

- **Meta & Tags Audit** — titles, descriptions, OG tags, canonical URLs, robots meta, character length warnings
- **Content Audit** — H1/H2/H3 analysis, word count, thin content detection, load times, indexability
- **External Links Audit** — all outbound links, broken link detection, nofollow status, domain breakdown
- **Sitemap Audit** — sitemap vs. crawl comparison, orphan pages, redirected sitemap URLs, noindex pages in sitemap
- **CSV Export** — export any audit type as a CSV
- **Real-time progress** — live crawl progress with page count and status

## Architecture

```
seo-auditor/
├── backend/          # Express + TypeScript crawler API
│   └── src/
│       ├── index.ts         # Express server & routes
│       ├── crawler.ts       # Crawl orchestration
│       ├── types.ts         # Shared types
│       └── utils/
│           ├── fetcher.ts   # HTTP fetching & sitemap parsing
│           ├── parser.ts    # HTML parsing & issue detection
│           └── urls.ts      # URL utilities
└── frontend/         # Next.js 14 app
    └── src/
        ├── app/             # Next.js app router pages
        ├── components/      # Audit tab components
        └── lib/             # API client, types, summary logic
```

## Getting Started

### Prerequisites

- Node.js 18+
- npm 9+

### Install dependencies

```bash
# Install everything from the root
npm install
cd backend && npm install
cd ../frontend && npm install
```

### Run locally

**Terminal 1 — Backend:**
```bash
cd backend
cp .env.example .env
npm run dev
# Runs on http://localhost:3001
```

**Terminal 2 — Frontend:**
```bash
cd frontend
cp .env.example .env.local
npm run dev
# Runs on http://localhost:3000
```

Then open http://localhost:3000 and enter a URL to audit.

---

## Deployment

### Frontend → Vercel

1. Push to GitHub
2. Import the repo in Vercel
3. Set **Root Directory** to `frontend`
4. Add environment variable: `NEXT_PUBLIC_API_URL=https://your-backend-url.com`
5. Deploy

### Backend → Railway

1. In Railway, create a new project from GitHub
2. Set **Root Directory** to `backend`
3. Add environment variable: `FRONTEND_URL=https://your-vercel-app.vercel.app`
4. Railway will auto-detect the Dockerfile and deploy

### Backend → Render

1. Create a new **Web Service** in Render
2. Connect your GitHub repo, set root to `backend`
3. Build command: `npm install && npm run build`
4. Start command: `npm start`
5. Add env var: `FRONTEND_URL=https://your-vercel-app.vercel.app`

---

## API Reference

### `POST /api/crawl`
Start a new crawl.
```json
{ "url": "https://example.com", "maxPages": 500 }
```
Returns: `{ "id": "uuid" }`

### `GET /api/crawl/:id/status`
Poll crawl progress.
```json
{
  "id": "...",
  "status": "crawling | checking_externals | complete | error",
  "crawled": 42,
  "queued": 18,
  "total": 60
}
```

### `GET /api/crawl/:id/results`
Get full results (all page data).

### `GET /api/crawl/:id/export/:type`
Download CSV. Types: `meta`, `content`, `external`, `sitemap`

---

## Limitations & Future Improvements

- **No persistence** — crawl jobs live in memory and are lost on server restart. Swap the `Map` in `crawler.ts` for Redis or a database.
- **No JS rendering** — uses `node-fetch`, not a headless browser. SPAs that render content client-side won't be fully audited.
- **External link checking** — capped at 100 external URLs per crawl to avoid slow audits.
- **Single server** — concurrency is limited to the server's resources. For production scale, use a job queue (BullMQ + Redis).

## License

MIT

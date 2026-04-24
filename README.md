# Catch Crawl

A free, open-source SEO crawler and audit tool. Crawl any website and get a full SEO audit.

## Features

- **Meta & Tags** — titles, descriptions, OG tags, canonical URLs, robots meta
- **Content Audit** — H1/H2/H3, word count, thin content, load times
- **External Links** — broken link detection, nofollow, domain breakdown
- **Sitemap Audit** — sitemap vs crawl comparison, orphan pages
- **CSV Export** — export any audit as a CSV

## Deploy to Vercel (free)

1. Fork or clone this repo
2. Go to [vercel.com](https://vercel.com) → New Project → Import this repo
3. No environment variables needed
4. Deploy — that's it

## Run locally

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Tech stack

- Next.js 14 (App Router)
- Cheerio (HTML parsing)
- Tailwind CSS
- TypeScript

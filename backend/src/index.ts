import express from 'express'
import cors from 'cors'
import { startCrawl, jobs } from './crawler'
import { CrawlStatus } from './types'

const app = express()
const PORT = process.env.PORT ?? 3001

app.use(cors({ origin: process.env.FRONTEND_URL ?? 'http://localhost:3000' }))
app.use(express.json())

// ── POST /api/crawl ───────────────────────────────────────────────────────────
// Start a new crawl
app.post('/api/crawl', async (req, res) => {
  const { url, maxPages } = req.body as { url?: string; maxPages?: number }

  if (!url) {
    return res.status(400).json({ error: 'url is required' })
  }

  try {
    const id = await startCrawl(url, Math.min(maxPages ?? 500, 500))
    return res.json({ id })
  } catch (err: any) {
    return res.status(400).json({ error: err.message })
  }
})

// ── GET /api/crawl/:id/status ─────────────────────────────────────────────────
// Poll crawl progress
app.get('/api/crawl/:id/status', (req, res) => {
  const job = jobs.get(req.params.id)
  if (!job) return res.status(404).json({ error: 'Job not found' })

  const status: CrawlStatus = {
    id: job.id,
    rootUrl: job.rootUrl,
    status: job.status,
    crawled: job.visited.length,
    queued: job.queue.length,
    total: job.visited.length + job.queue.length,
    startedAt: job.startedAt,
    completedAt: job.completedAt,
    errorMessage: job.errorMessage,
  }

  return res.json(status)
})

// ── GET /api/crawl/:id/results ────────────────────────────────────────────────
// Get full results (once complete)
app.get('/api/crawl/:id/results', (req, res) => {
  const job = jobs.get(req.params.id)
  if (!job) return res.status(404).json({ error: 'Job not found' })

  return res.json({
    id: job.id,
    rootUrl: job.rootUrl,
    status: job.status,
    startedAt: job.startedAt,
    completedAt: job.completedAt,
    sitemapUrls: job.sitemapUrls,
    pages: job.pages,
  })
})

// ── GET /api/crawl/:id/export ─────────────────────────────────────────────────
// Export as CSV
app.get('/api/crawl/:id/export/:type', (req, res) => {
  const job = jobs.get(req.params.id)
  if (!job) return res.status(404).json({ error: 'Job not found' })

  const type = req.params.type as 'meta' | 'content' | 'external' | 'sitemap' | 'all'
  const csv = generateCsv(job.pages, type, job.sitemapUrls)

  res.setHeader('Content-Type', 'text/csv')
  res.setHeader('Content-Disposition', `attachment; filename="seo-audit-${type}-${job.id.slice(0, 8)}.csv"`)
  return res.send(csv)
})

function generateCsv(pages: any[], type: string, sitemapUrls: string[]): string {
  if (type === 'meta' || type === 'all') {
    const headers = ['URL','Status','Title','Title Length','Meta Description','Description Length','Canonical','Meta Robots','OG Title','OG Description','OG Image','H1','H2 Count','H3 Count','Issues']
    const rows = pages.map(p => [
      p.url,
      p.statusCode,
      `"${(p.title ?? '').replace(/"/g, '""')}"`,
      p.titleLength,
      `"${(p.metaDescription ?? '').replace(/"/g, '""')}"`,
      p.metaDescriptionLength,
      p.canonicalUrl,
      p.metaRobots,
      `"${(p.ogTitle ?? '').replace(/"/g, '""')}"`,
      `"${(p.ogDescription ?? '').replace(/"/g, '""')}"`,
      p.ogImage,
      `"${(p.h1 ?? []).join(' | ').replace(/"/g, '""')}"`,
      (p.h2 ?? []).length,
      (p.h3 ?? []).length,
      `"${(p.issues ?? []).map((i: any) => i.message).join(' | ').replace(/"/g, '""')}"`,
    ])
    return [headers.join(','), ...rows.map(r => r.join(','))].join('\n')
  }

  if (type === 'content') {
    const headers = ['URL','Status','Word Count','H1','H2 Tags','H3 Tags','Indexable','In Sitemap','Load Time (ms)','Issues']
    const rows = pages.map(p => [
      p.url,
      p.statusCode,
      p.wordCount,
      `"${(p.h1 ?? []).join(' | ').replace(/"/g, '""')}"`,
      `"${(p.h2 ?? []).join(' | ').replace(/"/g, '""')}"`,
      `"${(p.h3 ?? []).join(' | ').replace(/"/g, '""')}"`,
      p.isIndexable ? 'Yes' : 'No',
      p.inSitemap ? 'Yes' : 'No',
      p.loadTimeMs,
      `"${(p.issues ?? []).map((i: any) => i.message).join(' | ').replace(/"/g, '""')}"`,
    ])
    return [headers.join(','), ...rows.map(r => r.join(','))].join('\n')
  }

  if (type === 'external') {
    const headers = ['Source Page','External URL','Anchor Text','NoFollow','Status Code']
    const rows: string[][] = []
    for (const page of pages) {
      for (const link of (page.externalLinks ?? [])) {
        rows.push([
          page.url,
          link.href,
          `"${(link.anchorText ?? '').replace(/"/g, '""')}"`,
          link.isNoFollow ? 'Yes' : 'No',
          link.statusCode ?? '',
        ])
      }
    }
    return [headers.join(','), ...rows.map(r => r.join(','))].join('\n')
  }

  if (type === 'sitemap') {
    const headers = ['URL','In Sitemap','Status','Indexable','Canonical','Redirect Chain']
    const rows = pages.map(p => [
      p.url,
      p.inSitemap ? 'Yes' : 'No',
      p.statusCode,
      p.isIndexable ? 'Yes' : 'No',
      p.canonicalUrl,
      `"${(p.redirectChain ?? []).join(' → ').replace(/"/g, '""')}"`,
    ])
    return [headers.join(','), ...rows.map(r => r.join(','))].join('\n')
  }

  // all — meta export by default
  return generateCsv(pages, 'meta', sitemapUrls)
}

app.listen(PORT, () => {
  console.log(`SEO Auditor backend running on http://localhost:${PORT}`)
})

export default app

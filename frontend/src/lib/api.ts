import { CrawlStatus, CrawlResults } from './types'

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001'

export async function startCrawl(url: string, maxPages = 500): Promise<string> {
  const res = await fetch(`${API_BASE}/api/crawl`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url, maxPages }),
  })
  if (!res.ok) {
    const err = await res.json()
    throw new Error(err.error ?? 'Failed to start crawl')
  }
  const data = await res.json()
  return data.id
}

export async function getCrawlStatus(id: string): Promise<CrawlStatus> {
  const res = await fetch(`${API_BASE}/api/crawl/${id}/status`)
  if (!res.ok) throw new Error('Failed to get status')
  return res.json()
}

export async function getCrawlResults(id: string): Promise<CrawlResults> {
  const res = await fetch(`${API_BASE}/api/crawl/${id}/results`)
  if (!res.ok) throw new Error('Failed to get results')
  return res.json()
}

export function getExportUrl(id: string, type: string): string {
  return `${API_BASE}/api/crawl/${id}/export/${type}`
}

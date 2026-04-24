import { NextRequest, NextResponse } from 'next/server'

const USER_AGENT = 'CatchCrawl/1.0 SEO Auditor'

export async function POST(req: NextRequest) {
  const { rootUrl } = await req.json()
  if (!rootUrl) return NextResponse.json({ urls: [] })

  const candidates = [
    `${rootUrl}/sitemap.xml`,
    `${rootUrl}/sitemap_index.xml`,
    `${rootUrl}/sitemap/sitemap.xml`,
  ]

  for (const candidate of candidates) {
    try {
      const res = await fetch(candidate, {
        headers: { 'User-Agent': USER_AGENT },
        signal: AbortSignal.timeout(8000),
      })
      if (res.ok) {
        const text = await res.text()
        const urls: string[] = []
        const re = /<loc>(.*?)<\/loc>/gi
        let m
        while ((m = re.exec(text)) !== null) {
          const u = m[1].trim()
          if (!u.endsWith('.xml')) urls.push(u)
        }
        return NextResponse.json({ urls })
      }
    } catch { /* try next */ }
  }

  return NextResponse.json({ urls: [] })
}

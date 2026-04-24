import { NextRequest, NextResponse } from 'next/server'

const USER_AGENT = 'CatchCrawl/1.0 SEO Auditor'

export async function POST(req: NextRequest) {
  const { urls } = await req.json() as { urls: string[] }
  if (!urls?.length) return NextResponse.json({ results: {} })

  const results: Record<string, number> = {}

  await Promise.all(urls.slice(0, 20).map(async (url) => {
    try {
      const res = await fetch(url, {
        method: 'HEAD',
        redirect: 'follow',
        headers: { 'User-Agent': USER_AGENT },
        signal: AbortSignal.timeout(8000),
      })
      results[url] = res.status
    } catch {
      results[url] = 0
    }
  }))

  return NextResponse.json({ results })
}

'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { PageData } from '@/lib/types'
import { computeSummary } from '@/lib/summary'
import { normalizeUrl, isInternal, isCrawlable, getRootUrl } from '@/lib/urls'
import SummaryCards from '@/components/SummaryCards'
import MetaAudit from '@/components/MetaAudit'
import ContentAudit from '@/components/ContentAudit'
import ExternalAudit from '@/components/ExternalAudit'
import SitemapAudit from '@/components/SitemapAudit'
import { ArrowLeft, CheckCircle, Loader, Download } from 'lucide-react'

type Tab = 'overview' | 'meta' | 'content' | 'external' | 'sitemap'
type Phase = 'idle' | 'sitemap' | 'crawling' | 'externals' | 'done' | 'error'

export default function AuditPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const inputUrl = searchParams.get('url') ?? ''
  const maxPages = parseInt(searchParams.get('max') ?? '100')

  const [phase, setPhase] = useState<Phase>('idle')
  const [pages, setPages] = useState<PageData[]>([])
  const [sitemapUrls, setSitemapUrls] = useState<string[]>([])
  const [crawledCount, setCrawledCount] = useState(0)
  const [queueSize, setQueueSize] = useState(0)
  const [tab, setTab] = useState<Tab>('overview')
  const [error, setError] = useState('')

  const visitedRef = useRef<Set<string>>(new Set())
  const queueRef = useRef<string[]>([])
  const pagesRef = useRef<PageData[]>([])
  const runningRef = useRef(false)

  const rootUrl = inputUrl ? getRootUrl(inputUrl.startsWith('http') ? inputUrl : `https://${inputUrl}`) : ''
  const startUrl = normalizeUrl(inputUrl.startsWith('http') ? inputUrl : `https://${inputUrl}`)

  const crawlPage = useCallback(async (url: string, sitemap: string[]): Promise<PageData | null> => {
    try {
      const res = await fetch('/api/crawl-page', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url, rootUrl, sitemapUrls: sitemap }),
      })
      return await res.json()
    } catch { return null }
  }, [rootUrl])

  useEffect(() => {
    if (!inputUrl || runningRef.current) return
    runningRef.current = true

    async function run() {
      setPhase('sitemap')

      // 1. Fetch sitemap
      let sitemap: string[] = []
      try {
        const r = await fetch('/api/fetch-sitemap', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ rootUrl }),
        })
        const d = await r.json()
        sitemap = d.urls ?? []
        setSitemapUrls(sitemap)
      } catch {}

      // 2. Seed queue
      const queue = [startUrl]
      for (const u of sitemap) {
        const n = normalizeUrl(u)
        if (!queue.includes(n)) queue.push(n)
      }
      queueRef.current = queue
      setPhase('crawling')

      // 3. Crawl
      const CONCURRENCY = 3
      while (queueRef.current.length > 0 && visitedRef.current.size < maxPages) {
        const batch = queueRef.current.splice(0, CONCURRENCY)
        setQueueSize(queueRef.current.length)

        await Promise.all(batch.map(async (url) => {
          if (visitedRef.current.has(url)) return
          if (!isCrawlable(url)) return
          visitedRef.current.add(url)

          const page = await crawlPage(url, sitemap)
          if (!page) return

          pagesRef.current = [...pagesRef.current, page]
          setPages([...pagesRef.current])
          setCrawledCount(pagesRef.current.length)

          // Enqueue new internal links
          for (const link of page.internalLinks ?? []) {
            const n = normalizeUrl(link.href)
            if (isInternal(n, rootUrl) && !visitedRef.current.has(n) && !queueRef.current.includes(n) && isCrawlable(n)) {
              queueRef.current.push(n)
            }
          }
          setQueueSize(queueRef.current.length)
        }))
      }

      // 4. Check external links
      setPhase('externals')
      const allExt = new Map<string, number>()
      for (const p of pagesRef.current) {
        for (const l of p.externalLinks ?? []) {
          if (!allExt.has(l.href)) allExt.set(l.href, -1)
        }
      }

      const extUrls = Array.from(allExt.keys()).slice(0, 60)
      for (let i = 0; i < extUrls.length; i += 20) {
        const batch = extUrls.slice(i, i + 20)
        try {
          const r = await fetch('/api/check-externals', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ urls: batch }),
          })
          const { results } = await r.json()
          // Write status codes back
          const updated = pagesRef.current.map(p => ({
            ...p,
            externalLinks: p.externalLinks.map(l => ({
              ...l,
              statusCode: results[l.href] ?? l.statusCode,
            }))
          }))
          pagesRef.current = updated
          setPages([...updated])
        } catch {}
      }

      setPhase('done')
    }

    run().catch(err => {
      setError(err.message)
      setPhase('error')
    })
  }, [])

  const summary = pages.length > 0 ? computeSummary(pages) : null
  const progress = maxPages > 0 ? Math.min(100, Math.round((crawledCount / maxPages) * 100)) : 0

  function exportCsv(type: string) {
    let csv = ''
    if (type === 'meta') {
      csv = ['URL,Status,Title,Title Length,Meta Description,Desc Length,Canonical,Robots,OG Title,OG Image,Issues']
        .concat(pages.map(p => [p.url, p.statusCode, `"${p.title.replace(/"/g, '""')}"`, p.titleLength, `"${p.metaDescription.replace(/"/g, '""')}"`, p.metaDescriptionLength, p.canonicalUrl, p.metaRobots, `"${p.ogTitle.replace(/"/g, '""')}"`, p.ogImage, `"${p.issues.map(i => i.message).join(' | ').replace(/"/g, '""')}"`].join(','))).join('\n')
    } else if (type === 'content') {
      csv = ['URL,Status,Word Count,H1,H2 Count,H3 Count,Indexable,In Sitemap,Load Time (ms)']
        .concat(pages.map(p => [p.url, p.statusCode, p.wordCount, `"${p.h1.join(' | ').replace(/"/g, '""')}"`, p.h2.length, p.h3.length, p.isIndexable ? 'Yes' : 'No', p.inSitemap ? 'Yes' : 'No', p.loadTimeMs].join(','))).join('\n')
    } else if (type === 'external') {
      const rows: string[] = ['Source,External URL,Anchor,NoFollow,Status']
      for (const p of pages) for (const l of p.externalLinks) rows.push([p.url, l.href, `"${l.anchorText.replace(/"/g, '""')}"`, l.isNoFollow ? 'Yes' : 'No', l.statusCode ?? ''].join(','))
      csv = rows.join('\n')
    } else if (type === 'sitemap') {
      csv = ['URL,In Sitemap,Status,Indexable,Canonical,Redirect Hops']
        .concat(pages.map(p => [p.url, p.inSitemap ? 'Yes' : 'No', p.statusCode, p.isIndexable ? 'Yes' : 'No', p.canonicalUrl, p.redirectChain.length].join(','))).join('\n')
    }
    const blob = new Blob([csv], { type: 'text/csv' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `catch-crawl-${type}.csv`
    a.click()
  }

  const tabs: { id: Tab; label: string }[] = [
    { id: 'overview', label: 'Overview' },
    { id: 'meta', label: 'Meta & Tags' },
    { id: 'content', label: 'Content' },
    { id: 'external', label: 'External Links' },
    { id: 'sitemap', label: 'Sitemap' },
  ]

  const phaseLabel = phase === 'sitemap' ? 'Fetching sitemap...' : phase === 'crawling' ? `Crawling pages...` : phase === 'externals' ? 'Checking external links...' : ''

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <header style={{ borderBottom: '1px solid var(--border)', background: 'var(--surface)', padding: '0 20px', height: 54, display: 'flex', alignItems: 'center', gap: 14, flexShrink: 0 }}>
        <button className="btn btn-ghost" onClick={() => router.push('/')} style={{ padding: '5px 10px', fontSize: 12 }}>
          <ArrowLeft size={13} /> Back
        </button>
        <div style={{ flex: 1, fontFamily: 'IBM Plex Mono', fontSize: 13, color: 'var(--text2)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {rootUrl}
        </div>
        {phase === 'done' ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <CheckCircle size={13} color="var(--green)" />
            <span style={{ fontSize: 12, color: 'var(--green)', fontFamily: 'IBM Plex Mono' }}>{pages.length} pages</span>
          </div>
        ) : phase !== 'error' ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Loader size={13} color="var(--accent)" className="spin" />
            <span style={{ fontSize: 12, color: 'var(--text2)', fontFamily: 'IBM Plex Mono' }}>{phaseLabel}</span>
          </div>
        ) : null}
        {pages.length > 0 && (
          <div style={{ display: 'flex', gap: 5 }}>
            {(['meta','content','external','sitemap'] as const).map(t => (
              <button key={t} className="btn btn-ghost" onClick={() => exportCsv(t)} style={{ padding: '5px 9px', fontSize: 11, fontFamily: 'IBM Plex Mono' }}>
                <Download size={11} /> {t}
              </button>
            ))}
          </div>
        )}
      </header>

      {/* Progress bar */}
      {(phase === 'crawling' || phase === 'sitemap') && (
        <div className="progress-bar" style={{ borderRadius: 0, height: 2 }}>
          <div className="progress-fill" style={{ width: `${Math.max(progress, 3)}%` }} />
        </div>
      )}

      {/* Crawling state */}
      {phase !== 'done' && phase !== 'error' && pages.length === 0 && (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
          <div style={{ fontFamily: 'IBM Plex Mono', fontSize: 56, fontWeight: 600, color: 'var(--accent)', lineHeight: 1 }}>
            {crawledCount}
          </div>
          <div style={{ color: 'var(--text2)' }}>{phaseLabel || 'Starting...'}</div>
          {queueSize > 0 && <div style={{ color: 'var(--text3)', fontSize: 12, fontFamily: 'IBM Plex Mono' }}>{queueSize} in queue</div>}
          <div style={{ width: 200, marginTop: 8 }}>
            <div className="progress-bar"><div className="progress-fill" style={{ width: `${Math.max(progress, 3)}%` }} /></div>
          </div>
        </div>
      )}

      {error && (
        <div style={{ margin: 24, background: 'rgba(255,68,68,0.1)', border: '1px solid var(--red)', borderRadius: 6, padding: '14px 18px', color: 'var(--red)' }}>
          {error}
        </div>
      )}

      {/* Results */}
      {pages.length > 0 && (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <div style={{ padding: '10px 20px', borderBottom: '1px solid var(--border)', background: 'var(--surface)', flexShrink: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
            {tabs.map(t => (
              <button key={t.id} className={`tab ${tab === t.id ? 'active' : ''}`} onClick={() => setTab(t.id)}>
                {t.label}
              </button>
            ))}
            {phase === 'crawling' && (
              <span style={{ marginLeft: 'auto', fontSize: 11, color: 'var(--text3)', fontFamily: 'IBM Plex Mono' }}>
                {crawledCount} crawled · {queueSize} queued
              </span>
            )}
          </div>
          <div style={{ flex: 1, overflow: 'auto', padding: 20 }}>
            {summary && tab === 'overview' && <SummaryCards summary={summary} pages={pages} onTabChange={setTab} />}
            {tab === 'meta' && <MetaAudit pages={pages} />}
            {tab === 'content' && <ContentAudit pages={pages} />}
            {tab === 'external' && <ExternalAudit pages={pages} />}
            {tab === 'sitemap' && <SitemapAudit pages={pages} sitemapUrls={sitemapUrls} />}
          </div>
        </div>
      )}
    </div>
  )
}

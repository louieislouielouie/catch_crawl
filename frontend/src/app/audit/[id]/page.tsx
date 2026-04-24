'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { getCrawlStatus, getCrawlResults, getExportUrl } from '@/lib/api'
import { CrawlStatus, CrawlResults } from '@/lib/types'
import { computeSummary } from '@/lib/summary'
import SummaryCards from '@/components/SummaryCards'
import MetaAudit from '@/components/MetaAudit'
import ContentAudit from '@/components/ContentAudit'
import ExternalAudit from '@/components/ExternalAudit'
import SitemapAudit from '@/components/SitemapAudit'
import IssuesList from '@/components/IssuesList'
import { ArrowLeft, Download, RefreshCw, CheckCircle, Loader, AlertCircle } from 'lucide-react'

type Tab = 'overview' | 'meta' | 'content' | 'external' | 'sitemap'

export default function AuditPage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string

  const [status, setStatus] = useState<CrawlStatus | null>(null)
  const [results, setResults] = useState<CrawlResults | null>(null)
  const [tab, setTab] = useState<Tab>('overview')
  const [error, setError] = useState('')

  const poll = useCallback(async () => {
    try {
      const s = await getCrawlStatus(id)
      setStatus(s)

      if (s.status === 'complete') {
        const r = await getCrawlResults(id)
        setResults(r)
      } else if (s.status === 'error') {
        setError(s.errorMessage ?? 'Crawl failed')
      }
    } catch (err: any) {
      setError(err.message)
    }
  }, [id])

  useEffect(() => {
    poll()
    const interval = setInterval(() => {
      if (status?.status === 'complete' || status?.status === 'error') return
      poll()
    }, 2000)
    return () => clearInterval(interval)
  }, [poll, status?.status])

  const summary = results ? computeSummary(results.pages) : null
  const isRunning = status && status.status !== 'complete' && status.status !== 'error'
  const progress = status && status.total > 0 ? Math.round((status.crawled / status.total) * 100) : 0

  const tabs: { id: Tab; label: string }[] = [
    { id: 'overview', label: 'Overview' },
    { id: 'meta', label: 'Meta & Tags' },
    { id: 'content', label: 'Content' },
    { id: 'external', label: 'External Links' },
    { id: 'sitemap', label: 'Sitemap' },
  ]

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <header style={{ borderBottom: '1px solid var(--border)', background: 'var(--surface)', padding: '0 24px', height: 56, display: 'flex', alignItems: 'center', gap: 16, flexShrink: 0 }}>
        <button className="btn btn-ghost" onClick={() => router.push('/')} style={{ padding: '6px 10px', fontSize: 12 }}>
          <ArrowLeft size={14} />
          Back
        </button>

        <div style={{ flex: 1, overflow: 'hidden' }}>
          <div style={{ fontFamily: 'IBM Plex Mono', fontSize: 13, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {status?.rootUrl ?? '...'}
          </div>
        </div>

        {/* Status indicator */}
        {status && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
            {isRunning ? (
              <>
                <Loader size={14} color="var(--accent)" className="spin" />
                <span style={{ fontSize: 12, color: 'var(--text2)', fontFamily: 'IBM Plex Mono' }}>
                  {status.status === 'checking_externals' ? 'Checking externals...' : `${status.crawled} / ${status.total} pages`}
                </span>
              </>
            ) : status.status === 'complete' ? (
              <>
                <CheckCircle size={14} color="var(--green)" />
                <span style={{ fontSize: 12, color: 'var(--green)', fontFamily: 'IBM Plex Mono' }}>
                  {results?.pages.length ?? 0} pages crawled
                </span>
              </>
            ) : (
              <>
                <AlertCircle size={14} color="var(--red)" />
                <span style={{ fontSize: 12, color: 'var(--red)' }}>Error</span>
              </>
            )}
          </div>
        )}

        {/* Export menu */}
        {results && (
          <div style={{ display: 'flex', gap: 6 }}>
            {(['meta', 'content', 'external', 'sitemap'] as const).map(type => (
              <a
                key={type}
                href={getExportUrl(id, type)}
                download
                className="btn btn-ghost"
                style={{ padding: '6px 10px', fontSize: 11, textDecoration: 'none', fontFamily: 'IBM Plex Mono' }}
              >
                <Download size={12} />
                {type}
              </a>
            ))}
          </div>
        )}
      </header>

      {/* Progress bar */}
      {isRunning && (
        <div className="progress-bar" style={{ borderRadius: 0, height: 2 }}>
          <div className="progress-fill" style={{ width: `${Math.max(progress, 5)}%` }} />
        </div>
      )}

      {error && (
        <div style={{ background: 'rgba(255,68,68,0.1)', border: '1px solid var(--red)', borderRadius: 6, margin: 24, padding: '14px 18px', color: 'var(--red)' }}>
          <strong>Crawl failed:</strong> {error}
        </div>
      )}

      {/* Crawling state */}
      {isRunning && !results && (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16 }}>
          <div style={{ fontFamily: 'IBM Plex Mono', fontSize: 48, fontWeight: 600, color: 'var(--accent)', lineHeight: 1 }}>
            {status.crawled}
          </div>
          <div style={{ color: 'var(--text2)', fontSize: 14 }}>
            {status.status === 'checking_externals' ? 'Checking external links...' : 'pages crawled'}
          </div>
          {status.queued > 0 && (
            <div style={{ color: 'var(--text3)', fontSize: 12, fontFamily: 'IBM Plex Mono' }}>
              {status.queued} in queue
            </div>
          )}
          <div style={{ width: 240 }}>
            <div className="progress-bar">
              <div className="progress-fill" style={{ width: `${Math.max(progress, 5)}%` }} />
            </div>
          </div>
        </div>
      )}

      {/* Results */}
      {results && summary && (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          {/* Tab bar */}
          <div style={{ padding: '12px 24px', borderBottom: '1px solid var(--border)', background: 'var(--surface)', flexShrink: 0 }}>
            <div className="tab-bar" style={{ display: 'inline-flex' }}>
              {tabs.map(t => (
                <button key={t.id} className={`tab ${tab === t.id ? 'active' : ''}`} onClick={() => setTab(t.id)}>
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Tab content */}
          <div style={{ flex: 1, overflow: 'auto', padding: 24 }}>
            {tab === 'overview' && <SummaryCards summary={summary} pages={results.pages} onTabChange={setTab} />}
            {tab === 'meta' && <MetaAudit pages={results.pages} />}
            {tab === 'content' && <ContentAudit pages={results.pages} />}
            {tab === 'external' && <ExternalAudit pages={results.pages} />}
            {tab === 'sitemap' && <SitemapAudit pages={results.pages} sitemapUrls={results.sitemapUrls} />}
          </div>
        </div>
      )}
    </div>
  )
}

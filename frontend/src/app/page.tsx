'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { startCrawl } from '@/lib/api'
import { Search, Globe, Zap, FileText, ExternalLink, Map } from 'lucide-react'

export default function HomePage() {
  const router = useRouter()
  const [url, setUrl] = useState('')
  const [maxPages, setMaxPages] = useState(500)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!url.trim()) return
    setError('')
    setLoading(true)
    try {
      const id = await startCrawl(url.trim(), maxPages)
      router.push(`/audit/${id}`)
    } catch (err: any) {
      setError(err.message ?? 'Failed to start crawl')
      setLoading(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 20px' }}>
      {/* Logo */}
      <div style={{ marginBottom: '48px', textAlign: 'center' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
          <div style={{ width: 36, height: 36, background: 'var(--accent)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Search size={18} color="var(--bg)" strokeWidth={2.5} />
          </div>
          <span style={{ fontFamily: 'IBM Plex Mono', fontSize: 22, fontWeight: 600, color: 'var(--text)', letterSpacing: '-0.02em' }}>
            SEO Auditor
          </span>
        </div>
        <p style={{ color: 'var(--text2)', fontSize: 15, maxWidth: 400, margin: '0 auto' }}>
          Crawl any website and get a full SEO audit — meta, content, external links, and sitemap coverage.
        </p>
      </div>

      {/* Form */}
      <div className="card" style={{ width: '100%', maxWidth: 560, padding: '28px' }}>
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: 'var(--text2)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.07em' }}>
              Website URL
            </label>
            <input
              className="input"
              type="text"
              placeholder="https://example.com"
              value={url}
              onChange={e => setUrl(e.target.value)}
              disabled={loading}
              autoFocus
            />
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: 'var(--text2)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.07em' }}>
              Max pages to crawl
            </label>
            <div style={{ display: 'flex', gap: 8 }}>
              {[50, 100, 250, 500].map(n => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setMaxPages(n)}
                  className="btn btn-ghost"
                  style={{
                    flex: 1,
                    padding: '8px',
                    fontSize: 13,
                    background: maxPages === n ? 'var(--surface2)' : 'transparent',
                    color: maxPages === n ? 'var(--accent)' : 'var(--text2)',
                    borderColor: maxPages === n ? 'var(--accent)' : 'var(--border2)',
                  }}
                  disabled={loading}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>

          {error && (
            <div style={{ background: 'rgba(255,68,68,0.1)', border: '1px solid var(--red)', borderRadius: 6, padding: '10px 14px', marginBottom: 16, color: 'var(--red)', fontSize: 13 }}>
              {error}
            </div>
          )}

          <button
            className="btn btn-accent"
            type="submit"
            disabled={loading || !url.trim()}
            style={{ width: '100%', justifyContent: 'center', padding: '12px' }}
          >
            {loading ? (
              <>
                <div style={{ width: 14, height: 14, border: '2px solid var(--bg)', borderTopColor: 'transparent', borderRadius: '50%' }} className="spin" />
                Starting crawl...
              </>
            ) : (
              <>
                <Zap size={15} />
                Start Audit
              </>
            )}
          </button>
        </form>
      </div>

      {/* Feature pills */}
      <div style={{ display: 'flex', gap: 12, marginTop: 32, flexWrap: 'wrap', justifyContent: 'center' }}>
        {[
          { icon: Globe, label: 'Meta & Titles' },
          { icon: FileText, label: 'Content Audit' },
          { icon: ExternalLink, label: 'External Links' },
          { icon: Map, label: 'Sitemap Audit' },
        ].map(({ icon: Icon, label }) => (
          <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text3)', fontSize: 12, fontFamily: 'IBM Plex Mono' }}>
            <Icon size={12} />
            {label}
          </div>
        ))}
      </div>

      <p style={{ marginTop: 48, color: 'var(--text3)', fontSize: 12, fontFamily: 'IBM Plex Mono' }}>
        Backend must be running on port 3001 — see README
      </p>
    </div>
  )
}

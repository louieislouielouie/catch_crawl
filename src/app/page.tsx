'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Search, Zap, Globe, FileText, ExternalLink, Map } from 'lucide-react'

export default function HomePage() {
  const router = useRouter()
  const [url, setUrl] = useState('')
  const [maxPages, setMaxPages] = useState(100)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!url.trim()) return
    const encoded = encodeURIComponent(url.trim())
    router.push(`/audit?url=${encoded}&max=${maxPages}`)
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 20px' }}>
      <div style={{ marginBottom: '48px', textAlign: 'center' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
          <div style={{ width: 38, height: 38, background: 'var(--accent)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Search size={18} color="var(--bg)" strokeWidth={2.5} />
          </div>
          <span style={{ fontFamily: 'IBM Plex Mono', fontSize: 24, fontWeight: 600, letterSpacing: '-0.02em' }}>
            Catch Crawl
          </span>
        </div>
        <p style={{ color: 'var(--text2)', fontSize: 15, maxWidth: 420, margin: '0 auto' }}>
          Crawl any website and get a full SEO audit — meta tags, content, external links, and sitemap coverage.
        </p>
      </div>

      <div className="card" style={{ width: '100%', maxWidth: 560, padding: '28px' }}>
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: 'var(--text2)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              Website URL
            </label>
            <input
              className="input"
              type="text"
              placeholder="https://example.com"
              value={url}
              onChange={e => setUrl(e.target.value)}
              autoFocus
            />
          </div>

          <div style={{ marginBottom: '24px' }}>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: 'var(--text2)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              Max pages
            </label>
            <div style={{ display: 'flex', gap: 8 }}>
              {[25, 50, 100, 250].map(n => (
                <button key={n} type="button" onClick={() => setMaxPages(n)} className="btn btn-ghost"
                  style={{ flex: 1, padding: '8px', fontSize: 13, justifyContent: 'center',
                    color: maxPages === n ? 'var(--accent)' : 'var(--text2)',
                    borderColor: maxPages === n ? 'var(--accent)' : 'var(--border2)',
                    background: maxPages === n ? 'rgba(232,255,71,0.06)' : 'transparent' }}>
                  {n}
                </button>
              ))}
            </div>
          </div>

          <button className="btn btn-accent" type="submit" disabled={!url.trim()}
            style={{ width: '100%', justifyContent: 'center', padding: '13px', fontSize: 14 }}>
            <Zap size={15} />
            Start Audit
          </button>
        </form>
      </div>

      <div style={{ display: 'flex', gap: 20, marginTop: 32, flexWrap: 'wrap', justifyContent: 'center' }}>
        {[
          { icon: Globe, label: 'Meta & Titles' },
          { icon: FileText, label: 'Content Audit' },
          { icon: ExternalLink, label: 'External Links' },
          { icon: Map, label: 'Sitemap Audit' },
        ].map(({ icon: Icon, label }) => (
          <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text3)', fontSize: 12, fontFamily: 'IBM Plex Mono' }}>
            <Icon size={12} /> {label}
          </div>
        ))}
      </div>
    </div>
  )
}

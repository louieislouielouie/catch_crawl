'use client'

import { AuditSummary } from '@/lib/summary'
import { PageData } from '@/lib/types'
import { AlertCircle, AlertTriangle, Info, CheckCircle } from 'lucide-react'

interface Props {
  summary: AuditSummary
  pages: PageData[]
  onTabChange: (tab: any) => void
}

export default function SummaryCards({ summary, pages, onTabChange }: Props) {
  const health = Math.max(0, 100 - (summary.totalErrors * 5) - (summary.totalWarnings * 2) - summary.totalInfos)

  const statGroups = [
    {
      title: 'Pages',
      stats: [
        { label: '200 OK', value: summary.okPages, color: 'var(--green)' },
        { label: 'Redirects', value: summary.redirectPages, color: 'var(--orange)' },
        { label: '4xx / 5xx', value: summary.errorPages, color: 'var(--red)' },
        { label: 'Indexable', value: summary.indexablePages, color: 'var(--blue)' },
      ]
    },
    {
      title: 'Titles',
      stats: [
        { label: 'Missing', value: summary.missingTitles, color: 'var(--red)' },
        { label: 'Duplicate', value: summary.duplicateTitles, color: 'var(--orange)' },
        { label: 'Too long', value: summary.longTitles, color: 'var(--orange)' },
        { label: 'Too short', value: summary.shortTitles, color: 'var(--orange)' },
      ]
    },
    {
      title: 'Descriptions',
      stats: [
        { label: 'Missing', value: summary.missingDescriptions, color: 'var(--red)' },
        { label: 'Duplicate', value: summary.duplicateDescriptions, color: 'var(--orange)' },
        { label: 'Too long', value: summary.longDescriptions, color: 'var(--orange)' },
        { label: 'Too short', value: summary.shortDescriptions, color: 'var(--orange)' },
      ]
    },
    {
      title: 'Content',
      stats: [
        { label: 'No H1', value: summary.missingH1, color: 'var(--red)' },
        { label: 'Multiple H1', value: summary.multipleH1, color: 'var(--orange)' },
        { label: 'Thin content', value: summary.thinContent, color: 'var(--orange)' },
        { label: 'Not in sitemap', value: summary.notInSitemap, color: 'var(--blue)' },
      ]
    },
    {
      title: 'External Links',
      stats: [
        { label: 'Total', value: summary.totalExternalLinks, color: 'var(--text)' },
        { label: 'Broken', value: summary.brokenExternalLinks, color: 'var(--red)' },
        { label: 'Domains', value: summary.uniqueExternalDomains, color: 'var(--blue)' },
        { label: 'In sitemap', value: summary.inSitemap, color: 'var(--green)' },
      ]
    },
  ]

  // Top issues
  const allIssues = pages.flatMap(p => p.issues.map(i => ({ ...i, url: p.url })))
  const errors = allIssues.filter(i => i.type === 'error').slice(0, 8)
  const warnings = allIssues.filter(i => i.type === 'warning').slice(0, 8)

  return (
    <div className="fade-in">
      {/* Health score */}
      <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: 20, marginBottom: 24, alignItems: 'center' }}>
        <div className="card" style={{ padding: '20px 28px', display: 'flex', alignItems: 'center', gap: 20, flexShrink: 0 }}>
          <div style={{ position: 'relative', width: 80, height: 80 }}>
            <svg width="80" height="80" viewBox="0 0 80 80">
              <circle cx="40" cy="40" r="34" fill="none" stroke="var(--border)" strokeWidth="6" />
              <circle
                cx="40" cy="40" r="34" fill="none"
                stroke={health >= 80 ? 'var(--green)' : health >= 50 ? 'var(--orange)' : 'var(--red)'}
                strokeWidth="6"
                strokeDasharray={`${(health / 100) * 213.6} 213.6`}
                strokeLinecap="round"
                transform="rotate(-90 40 40)"
              />
            </svg>
            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'IBM Plex Mono', fontSize: 18, fontWeight: 600, color: 'var(--text)' }}>
              {health}
            </div>
          </div>
          <div>
            <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--text)' }}>SEO Health</div>
            <div style={{ fontSize: 12, color: 'var(--text2)', marginTop: 2 }}>{summary.totalPages} pages crawled</div>
            <div style={{ display: 'flex', gap: 12, marginTop: 10 }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: 'var(--red)' }}>
                <AlertCircle size={12} /> {summary.totalErrors} errors
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: 'var(--orange)' }}>
                <AlertTriangle size={12} /> {summary.totalWarnings} warnings
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: 'var(--blue)' }}>
                <Info size={12} /> {summary.totalInfos} info
              </span>
            </div>
          </div>
        </div>

        {/* Quick stat row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
          {[
            { label: 'Total Pages', value: summary.totalPages },
            { label: 'Indexable', value: summary.indexablePages },
            { label: 'Errors', value: summary.totalErrors, red: true },
            { label: 'Warnings', value: summary.totalWarnings, orange: true },
          ].map(s => (
            <div key={s.label} className="stat-card">
              <div className="stat-value" style={{ color: s.red ? 'var(--red)' : s.orange ? 'var(--orange)' : 'var(--accent)' }}>
                {s.value}
              </div>
              <div className="stat-label">{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Stat groups */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 12, marginBottom: 24 }}>
        {statGroups.map(group => (
          <div key={group.title} className="card" style={{ padding: 16 }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>
              {group.title}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {group.stats.map(s => (
                <div key={s.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 12, color: 'var(--text2)' }}>{s.label}</span>
                  <span style={{ fontFamily: 'IBM Plex Mono', fontSize: 13, fontWeight: 600, color: s.value > 0 ? s.color : 'var(--text3)' }}>
                    {s.value}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Top issues */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <div className="card">
          <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 8 }}>
            <AlertCircle size={14} color="var(--red)" />
            <span style={{ fontSize: 13, fontWeight: 600 }}>Top Errors</span>
          </div>
          <div style={{ padding: '8px 0' }}>
            {errors.length === 0 ? (
              <div style={{ padding: '16px', color: 'var(--text3)', fontSize: 13, display: 'flex', alignItems: 'center', gap: 8 }}>
                <CheckCircle size={14} color="var(--green)" /> No errors found
              </div>
            ) : errors.map((issue, i) => (
              <div key={i} style={{ padding: '8px 16px', borderBottom: i < errors.length - 1 ? '1px solid var(--border)' : 'none' }}>
                <div style={{ fontSize: 12, color: 'var(--text)', marginBottom: 2 }}>{issue.message}</div>
                <div style={{ fontSize: 11, color: 'var(--text3)', fontFamily: 'IBM Plex Mono', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {issue.url}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 8 }}>
            <AlertTriangle size={14} color="var(--orange)" />
            <span style={{ fontSize: 13, fontWeight: 600 }}>Top Warnings</span>
          </div>
          <div style={{ padding: '8px 0' }}>
            {warnings.length === 0 ? (
              <div style={{ padding: '16px', color: 'var(--text3)', fontSize: 13, display: 'flex', alignItems: 'center', gap: 8 }}>
                <CheckCircle size={14} color="var(--green)" /> No warnings found
              </div>
            ) : warnings.map((issue, i) => (
              <div key={i} style={{ padding: '8px 16px', borderBottom: i < warnings.length - 1 ? '1px solid var(--border)' : 'none' }}>
                <div style={{ fontSize: 12, color: 'var(--text)', marginBottom: 2 }}>{issue.message}</div>
                <div style={{ fontSize: 11, color: 'var(--text3)', fontFamily: 'IBM Plex Mono', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {issue.url}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

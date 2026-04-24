import { Suspense } from 'react'
import AuditPage from './page'

export default function AuditLayout() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text2)' }}>
        Loading...
      </div>
    }>
      <AuditPage />
    </Suspense>
  )
}

import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Catch Crawl — SEO Auditor',
  description: 'Crawl any website and get a full SEO audit',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}

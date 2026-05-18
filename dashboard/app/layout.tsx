import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'STOA Command',
  description: 'Multi-agent swarm operations dashboard',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
      </body>
    </html>
  )
}

'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const links = [
  { href: '/', label: 'Cellar' },
  { href: '/wishlist', label: 'Wishlist' },
  { href: '/add', label: '+ Add Wine' },
  { href: '/sommelier', label: 'Sommelier' },
  { href: '/stats', label: 'Stats' },
]

export default function Nav() {
  const pathname = usePathname()
  return (
    <header style={{ background: 'var(--wine)' }} className="sticky top-0 z-50 shadow-md">
      <div className="max-w-7xl mx-auto px-4 flex items-center h-14 gap-1">
        <Link href="/" className="mr-6 font-bold text-lg tracking-wide" style={{ color: 'var(--cream)' }}>
          🍷 The Cellar
        </Link>
        <nav className="flex gap-1 flex-1">
          {links.map(l => (
            <Link
              key={l.href}
              href={l.href}
              className="px-3 py-1.5 rounded text-sm font-medium transition-colors"
              style={{
                color: pathname === l.href ? 'var(--gold)' : 'var(--wine-pale)',
                background: pathname === l.href ? 'rgba(0,0,0,0.2)' : undefined,
              }}
            >
              {l.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  )
}

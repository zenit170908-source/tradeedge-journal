
'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { TrendingUp, LayoutDashboard, BookOpen, BarChart2 } from 'lucide-react'

const NAV = [
  { href: '/',          label: 'Dashboard', icon: LayoutDashboard },
  { href: '/journal',   label: 'Journal',   icon: BookOpen },
  { href: '/analytics', label: 'Analytics', icon: BarChart2 },
]

export default function MobileNav() {
  const pathname = usePathname()
  return (
    <>
      {/* Mobile top bar */}
      <header className="md:hidden flex items-center gap-2 px-4 py-3 border-b border-border bg-card">
        <div className="w-7 h-7 bg-primary rounded-md flex items-center justify-center">
          <TrendingUp className="w-4 h-4 text-primary-foreground" />
        </div>
        <span className="font-bold text-sm">TradeEdge</span>
      </header>
      {/* Mobile bottom tabs */}
      <nav className="md:hidden flex border-t border-border bg-card">
        {NAV.map(({ href, label, icon: Icon }) => {
          const active = pathname === href
          return (
            <Link key={href} href={href}
              className={`flex-1 flex flex-col items-center gap-1 py-2.5 text-[10px] font-medium transition-colors ${active ? 'text-primary' : 'text-muted-foreground hover:text-foreground'}`}>
              <Icon className="w-4 h-4" />
              {label}
            </Link>
          )
        })}
      </nav>
    </>
  )
}



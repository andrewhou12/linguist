'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import type { ReactNode } from 'react'
import {
  BookOpen,
  MessageCircle,
  Clock,
  Settings,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { UserMenu } from '@/components/user-menu'

interface NavItem {
  href: string
  label: string
  icon: LucideIcon
}

const NAV_ITEMS: NavItem[] = [
  { href: '/conversation', label: 'Conversation', icon: MessageCircle },
  { href: '/knowledge', label: 'Knowledge Base', icon: BookOpen },
  { href: '/history', label: 'History', icon: Clock },
]

function NavLink({ href, label, icon: Icon, isActive }: NavItem & { isActive: boolean }) {
  return (
    <Link
      href={href}
      className={`flex items-center gap-2 px-3 py-2 rounded-md no-underline transition-colors ${
        isActive
          ? 'text-blue-700 bg-blue-50 font-semibold'
          : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100 font-normal'
      }`}
    >
      <Icon size={18} />
      {label}
    </Link>
  )
}

export default function AppLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname()

  return (
    <div className="flex h-screen">
      <nav className="w-60 border-r border-gray-200 shrink-0 flex flex-col">
        <div className="p-4 flex-1 flex flex-col">
          <h1 className="text-xl font-bold mb-4">Linguist</h1>
          <div className="flex flex-col gap-1 mt-4 flex-1">
            {NAV_ITEMS.map((item) => (
              <NavLink key={item.href} {...item} isActive={pathname === item.href} />
            ))}
          </div>
          <NavLink href="/settings" label="Settings" icon={Settings} isActive={pathname === '/settings'} />
        </div>
      </nav>

      <div className="flex flex-col flex-1 overflow-hidden">
        <div className="flex items-center justify-end px-6 h-12 shrink-0">
          <UserMenu />
        </div>
        <div className="px-6 pb-6 flex-1 overflow-auto">
          {children}
        </div>
      </div>
    </div>
  )
}

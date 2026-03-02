'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState, useEffect } from 'react'
import type { ReactNode } from 'react'
import {
  MoreHorizontal,
  LogOut,
  MessageCircle,
  Zap,
  BookOpen,
  PenLine,
  BookMarked,
  Clock,
  Flame,
  Settings,
  BarChart3,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Separator } from '@/components/ui/separator'
import { createClient } from '@/lib/supabase/client'
import { api } from '@/lib/api'
import { cn } from '@/lib/utils'
import { useRouter } from 'next/navigation'
import { ConversationView } from '@/components/conversation-view'

/* ── Types ── */

interface NavItem {
  href: string
  label: string
  icon: LucideIcon
  badge?: string
}

/* ── Nav Config ── */

const LEARN_ITEMS: NavItem[] = [
  { href: '/conversation', label: 'Practice', icon: MessageCircle },
  { href: '/review', label: 'Flashcards', icon: Zap },
  { href: '/knowledge?tab=reading', label: 'Reading', icon: BookOpen },
  { href: '/knowledge?tab=grammar', label: 'Grammar', icon: PenLine },
]

const MY_STUFF_ITEMS: NavItem[] = [
  { href: '/knowledge', label: 'Vocabulary', icon: BookMarked },
  { href: '/history', label: 'History', icon: Clock },
  { href: '/insights', label: 'Study Streak', icon: Flame },
  { href: '/settings', label: 'Settings', icon: Settings },
]

/* ── Breadcrumb label map ── */

const BREADCRUMB_MAP: Record<string, [string, string]> = {
  '/conversation': ['Learn', 'Practice'],
  '/review': ['Learn', 'Flashcards'],
  '/knowledge': ['My Stuff', 'Vocabulary'],
  '/insights': ['My Stuff', 'Study Streak'],
  '/settings': ['My Stuff', 'Settings'],
  '/history': ['My Stuff', 'History'],
  '/dashboard': ['Home', 'Dashboard'],
}

/* ── Subcomponents ── */

function LogoIcon() {
  return (
    <div className="w-8 h-8 bg-accent-brand rounded-[7px] flex items-center justify-center shrink-0">
      <svg width="17" height="17" viewBox="0 0 32 32" fill="none">
        <path d="M24 3 C24 3, 18 5, 14 10 C10 15, 8 21, 8 26 C9 24, 11 19, 14 14 C17 9, 21 5, 24 3 Z" stroke="white" strokeWidth="2" strokeLinejoin="round" fill="none"/>
        <path d="M24 3 C24 3, 26 7, 24 13 C22 19, 17 24, 12 27 C14 23, 17 18, 20 13 C23 8, 25 5, 24 3 Z" stroke="white" strokeWidth="2" strokeLinejoin="round" fill="none"/>
        <path d="M8 26 L7 29" stroke="white" strokeWidth="2" strokeLinecap="round"/>
      </svg>
    </div>
  )
}

function NavLink({ href, label, icon: Icon, badge, isActive }: NavItem & { isActive: boolean }) {
  return (
    <Link
      href={href}
      className={cn(
        'flex items-center gap-3 px-3 py-1.5 rounded-md text-[14px] font-medium no-underline transition-[background,color] duration-100',
        isActive
          ? 'text-text-primary bg-bg-active'
          : 'text-text-secondary bg-transparent hover:bg-bg-hover hover:text-text-primary'
      )}
    >
      <Icon size={16} className="shrink-0" />
      <span className="flex-1 truncate">{label}</span>
      {badge !== undefined && badge !== '' && (
        <span className="inline-flex items-center justify-center min-w-[20px] h-[20px] px-1 rounded-full bg-accent-warm text-white text-[10.5px] font-bold leading-none">
          {badge}
        </span>
      )}
    </Link>
  )
}

function SectionLabel({ children }: { children: ReactNode }) {
  return (
    <div className="text-[11px] uppercase tracking-[.07em] text-text-muted px-2.5 pt-5 pb-2 font-medium">
      {children}
    </div>
  )
}

function ProgressWidget() {
  return (
    <div className="mx-2.5 mt-auto mb-2.5 p-4 rounded-xl bg-bg-hover/60">
      <div className="flex items-center justify-between mb-2.5">
        <span className="text-[13px] font-medium text-text-secondary">Today&apos;s Goal</span>
        <span className="text-[13px] font-bold text-text-primary">0/100 XP</span>
      </div>
      <div className="h-2 rounded-full bg-bg-active overflow-hidden">
        <div className="h-full rounded-full bg-accent-brand transition-[width] duration-300" style={{ width: '0%' }} />
      </div>
      <div className="flex items-center gap-2.5 mt-3">
        <span className="flex items-center gap-1 text-[12px] text-text-muted"><BarChart3 size={12} /> Level 1</span>
        <span className="flex items-center gap-1 text-[12px] text-text-muted"><Flame size={12} /> 0 day streak</span>
      </div>
    </div>
  )
}

function UserFooter() {
  const router = useRouter()
  const [user, setUser] = useState<{ email?: string; name?: string } | null>(null)

  useEffect(() => {
    api.userGetMe().then((u) => {
      if (u) setUser({ email: u.email ?? undefined, name: u.name ?? undefined })
    }).catch(() => {})
  }, [])

  const displayName = user?.name || user?.email || 'Learner'
  const initials = displayName.charAt(0).toUpperCase()

  const handleSignOut = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/sign-in')
  }

  return (
    <div className="px-2.5 pb-3">
      <Popover>
        <PopoverTrigger asChild>
          <button className="flex items-center gap-3 w-full px-2.5 py-2.5 rounded-lg bg-transparent border-none cursor-pointer transition-colors duration-100 hover:bg-bg-hover">
            <div className="w-9 h-9 rounded-full flex items-center justify-center shrink-0 bg-accent-brand">
              <span className="text-[13px] font-bold text-white leading-none">{initials}</span>
            </div>
            <div className="flex flex-col min-w-0 flex-1 text-left">
              <span className="text-[14px] font-medium text-text-primary truncate">{displayName}</span>
              <span className="text-[12px] text-text-muted truncate">Level 1</span>
            </div>
            <MoreHorizontal size={16} className="text-text-muted shrink-0" />
          </button>
        </PopoverTrigger>
        <PopoverContent side="top" align="start" className="w-[200px] p-1.5">
          <button
            onClick={handleSignOut}
            className="flex items-center gap-2 py-2 px-3 rounded-md cursor-pointer w-full bg-transparent border-none text-text-secondary text-[13px] transition-colors duration-100 hover:bg-bg-hover hover:text-text-primary"
          >
            <LogOut size={14} />
            Sign out
          </button>
        </PopoverContent>
      </Popover>
    </div>
  )
}

/* ── Layout ── */

export default function AppLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname()

  // Prefetch all page data on first mount so every page is instant
  useEffect(() => { api.prefetch() }, [])

  const isActive = (href: string) => {
    const basePath = href.split('?')[0]
    return pathname === basePath
  }

  const breadcrumb = BREADCRUMB_MAP[pathname] ?? ['', '']

  return (
    <div className="flex h-screen bg-bg">
      {/* Sidebar */}
      <nav className="w-[240px] border-r border-border bg-bg-secondary shrink-0 flex flex-col">
        {/* Logo header */}
        <div className="flex items-center gap-2.5 px-3.5 pt-4 pb-3">
          <LogoIcon />
          <span className="font-serif text-[18px] font-normal italic text-text-primary tracking-tight">
            Lingle
          </span>
        </div>

        {/* Learn section */}
        <SectionLabel>Learn</SectionLabel>
        <div className="flex flex-col gap-1 px-2.5">
          {LEARN_ITEMS.map((item) => (
            <NavLink key={item.href} {...item} isActive={isActive(item.href)} />
          ))}
        </div>

        {/* My Stuff section */}
        <SectionLabel>My Stuff</SectionLabel>
        <div className="flex flex-col gap-1 px-2.5">
          {MY_STUFF_ITEMS.map((item) => (
            <NavLink key={item.href} {...item} isActive={isActive(item.href)} />
          ))}
        </div>

        {/* Progress widget */}
        <ProgressWidget />

        {/* User footer */}
        <Separator />
        <UserFooter />
      </nav>

      {/* Main content */}
      <div className="flex flex-col flex-1 overflow-hidden">
        {/* Top bar */}
        <div className="flex items-center px-6 h-[48px] border-b border-border shrink-0 relative z-10 bg-bg">
          <div className="flex items-center gap-1.5 text-[14px]">
            {breadcrumb[0] && (
              <>
                <span className="text-text-muted">{breadcrumb[0]}</span>
                <span className="text-text-muted">/</span>
              </>
            )}
            <span className="text-text-primary font-medium">{breadcrumb[1] || 'Home'}</span>
          </div>
        </div>

        {/* Content — regular pages */}
        <div className={cn('p-6 flex-1 overflow-auto calligraphy-grid', pathname === '/conversation' && 'hidden')}>
          <div className="relative z-[1]">
            {children}
          </div>
        </div>

        {/* Persistent conversation view — stays mounted across navigations */}
        <div className={cn('p-6 flex-1 overflow-auto', pathname !== '/conversation' && 'hidden')}>
          <div className="relative z-[1] h-full">
            <ConversationView />
          </div>
        </div>
      </div>
    </div>
  )
}

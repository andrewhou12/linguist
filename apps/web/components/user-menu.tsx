'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Popover, Separator } from '@radix-ui/themes'
import { LogOut, CircleUser } from 'lucide-react'
import type { ExpandedLearnerProfile } from '@linguist/shared/types'
import { createClient } from '@/lib/supabase/client'
import { api } from '@/lib/api'

export function UserMenu() {
  const router = useRouter()
  const [user, setUser] = useState<{ email?: string; name?: string; avatarUrl?: string } | null>(null)
  const [profile, setProfile] = useState<ExpandedLearnerProfile | null>(null)

  useEffect(() => {
    api.userGetMe().then((u) => {
      if (u) setUser({ email: u.email ?? undefined, name: u.name ?? undefined, avatarUrl: u.avatarUrl ?? undefined })
    }).catch(() => {})
    api.profileGet().then(setProfile).catch(() => {})
  }, [])

  const displayName = user?.name || user?.email || 'Learner'
  const initials = displayName.charAt(0).toUpperCase()

  const handleSignOut = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/sign-in')
  }

  return (
    /* Keep Radix Popover for now - complex interactive component */
    <Popover.Root>
      <Popover.Trigger>
        <button className="w-8 h-8 rounded-full bg-transparent border-none cursor-pointer flex items-center justify-center shrink-0 p-0 text-gray-600 hover:text-gray-900 transition-colors">
          <CircleUser size={20} />
        </button>
      </Popover.Trigger>
      <Popover.Content
        side="bottom"
        align="end"
        style={{ width: 280, padding: 0 }}
      >
        {/* User header */}
        <div className="flex items-center gap-3 p-4">
          <div className="w-10 min-w-[40px] h-10 min-h-[40px] rounded-full overflow-hidden flex items-center justify-center"
            style={{ backgroundColor: user?.avatarUrl ? 'transparent' : '#2563eb' }}
          >
            {user?.avatarUrl ? (
              <img
                src={user.avatarUrl}
                alt={displayName}
                width={40}
                height={40}
                className="rounded-full object-cover block"
              />
            ) : (
              <span className="text-lg font-bold text-white leading-none">
                {initials}
              </span>
            )}
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-sm font-bold truncate">{displayName}</span>
            <span className="text-xs text-gray-500 truncate">
              {profile
                ? `${profile.targetLanguage} (${profile.computedLevel})`
                : user?.email || 'Loading...'}
            </span>
          </div>
        </div>

        <Separator size="4" />

        {/* Stats */}
        <div className="flex flex-col gap-2 p-4">
          <div className="flex justify-between items-center">
            <span className="text-sm">Current level</span>
            <span className="text-sm font-medium">{profile?.computedLevel ?? '—'}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm">Streak</span>
            <span className="text-sm font-medium">
              {profile?.currentStreak ?? 0} day{(profile?.currentStreak ?? 0) !== 1 ? 's' : ''}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm">Total reviews</span>
            <span className="text-sm font-medium">{profile?.totalReviewEvents ?? 0}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm">Sessions</span>
            <span className="text-sm font-medium">{profile?.totalSessions ?? 0}</span>
          </div>
        </div>

        <Separator size="4" />

        {/* Sign out */}
        <div className="p-2">
          <button
            onClick={handleSignOut}
            className="flex items-center gap-2 px-3 py-2 rounded-md cursor-pointer w-full bg-transparent border-none text-gray-600 text-sm hover:bg-gray-100 transition-colors"
          >
            <LogOut size={16} />
            Sign out
          </button>
        </div>
      </Popover.Content>
    </Popover.Root>
  )
}

'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Flex, Text, Popover, Separator, Box } from '@radix-ui/themes'
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
    <Popover.Root>
      <Popover.Trigger>
        <button
          style={{
            width: 32,
            height: 32,
            borderRadius: '50%',
            backgroundColor: 'transparent',
            border: 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            padding: 0,
            color: 'var(--gray-11)',
          }}
        >
          <CircleUser size={20} />
        </button>
      </Popover.Trigger>
      <Popover.Content
        side="bottom"
        align="end"
        style={{ width: 280, padding: 0 }}
      >
        {/* User header */}
        <Flex align="center" gap="3" p="4">
          <div
            style={{
              width: 40,
              minWidth: 40,
              height: 40,
              minHeight: 40,
              borderRadius: '50%',
              backgroundColor: user?.avatarUrl ? 'transparent' : 'var(--accent-9)',
              overflow: 'hidden',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {user?.avatarUrl ? (
              <img
                src={user.avatarUrl}
                alt={displayName}
                width={40}
                height={40}
                style={{ borderRadius: '50%', objectFit: 'cover', display: 'block' }}
              />
            ) : (
              <Text size="4" weight="bold" style={{ color: 'white', lineHeight: 1 }}>
                {initials}
              </Text>
            )}
          </div>
          <Flex direction="column" style={{ minWidth: 0 }}>
            <Text size="2" weight="bold" truncate>
              {displayName}
            </Text>
            <Text size="1" color="gray" truncate>
              {profile
                ? `${profile.targetLanguage} (${profile.computedLevel})`
                : user?.email || 'Loading...'}
            </Text>
          </Flex>
        </Flex>

        <Separator size="4" />

        {/* Stats */}
        <Flex direction="column" gap="2" p="4">
          <Flex justify="between" align="center">
            <Text size="2">Current level</Text>
            <Text size="2" weight="medium">
              {profile?.computedLevel ?? '—'}
            </Text>
          </Flex>
          <Flex justify="between" align="center">
            <Text size="2">Streak</Text>
            <Text size="2" weight="medium">
              {profile?.currentStreak ?? 0} day{(profile?.currentStreak ?? 0) !== 1 ? 's' : ''}
            </Text>
          </Flex>
          <Flex justify="between" align="center">
            <Text size="2">Total reviews</Text>
            <Text size="2" weight="medium">
              {profile?.totalReviewEvents ?? 0}
            </Text>
          </Flex>
          <Flex justify="between" align="center">
            <Text size="2">Sessions</Text>
            <Text size="2" weight="medium">
              {profile?.totalSessions ?? 0}
            </Text>
          </Flex>
        </Flex>

        <Separator size="4" />

        {/* Sign out */}
        <Box p="2">
          <button
            onClick={handleSignOut}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '8px 12px',
              borderRadius: 'var(--radius-2)',
              cursor: 'pointer',
              width: '100%',
              background: 'none',
              border: 'none',
              color: 'var(--gray-11)',
              fontSize: 'var(--font-size-2)',
            }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.backgroundColor = 'var(--gray-3)')
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.backgroundColor = 'transparent')
            }
          >
            <LogOut size={16} />
            Sign out
          </button>
        </Box>
      </Popover.Content>
    </Popover.Root>
  )
}

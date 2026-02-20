import { useState, useEffect } from 'react'
import { Flex, Text, Popover, Separator, Box } from '@radix-ui/themes'
import { User, LogOut } from 'lucide-react'
import type { ExpandedLearnerProfile } from '@shared/types'

export function UserMenu() {
  const [profile, setProfile] = useState<ExpandedLearnerProfile | null>(null)

  useEffect(() => {
    window.linguist.profileGet().then(setProfile)
  }, [])

  const initials = profile
    ? profile.targetLanguage.charAt(0).toUpperCase()
    : '?'

  return (
    <Popover.Root>
      <Popover.Trigger>
        <button
          style={{
            width: 32,
            height: 32,
            borderRadius: '50%',
            backgroundColor: 'var(--accent-9)',
            border: 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <Text size="2" weight="bold" style={{ color: 'white', lineHeight: 1 }}>
            {initials}
          </Text>
        </button>
      </Popover.Trigger>
      <Popover.Content
        side="bottom"
        align="end"
        style={{ width: 280, padding: 0 }}
      >
        {/* User header */}
        <Flex align="center" gap="3" p="4">
          <Flex
            align="center"
            justify="center"
            style={{
              width: 40,
              height: 40,
              borderRadius: '50%',
              backgroundColor: 'var(--accent-9)',
              flexShrink: 0,
            }}
          >
            <Text size="4" weight="bold" style={{ color: 'white', lineHeight: 1 }}>
              {initials}
            </Text>
          </Flex>
          <Flex direction="column" style={{ minWidth: 0 }}>
            <Text size="2" weight="bold">
              Learner
            </Text>
            <Text size="1" color="gray" truncate>
              {profile
                ? `${profile.targetLanguage} (${profile.computedLevel})`
                : 'Loading...'}
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

        {/* Actions */}
        <Box p="2">
          <Text
            size="2"
            color="gray"
            style={{
              display: 'block',
              padding: '8px 12px',
              borderRadius: 'var(--radius-2)',
              cursor: 'default',
            }}
          >
            Sign in coming soon
          </Text>
        </Box>
      </Popover.Content>
    </Popover.Root>
  )
}

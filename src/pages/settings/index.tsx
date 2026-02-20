import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router'
import {
  Box,
  Flex,
  Text,
  Card,
  Button,
  Select,
  TextField,
  Separator,
} from '@radix-ui/themes'
import { ArrowLeft, Globe, BookOpen, Target, Flame } from 'lucide-react'
import type { ExpandedLearnerProfile } from '@shared/types'

export function SettingsPage() {
  const navigate = useNavigate()
  const [profile, setProfile] = useState<ExpandedLearnerProfile | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    window.linguist.profileGet().then((p) => {
      setProfile(p)
      setIsLoading(false)
    })
  }, [])

  const handleUpdate = async (
    updates: Partial<{
      dailyNewItemLimit: number
      targetRetention: number
      targetLanguage: string
      nativeLanguage: string
    }>
  ) => {
    const updated = await window.linguist.profileUpdate(updates)
    setProfile(updated)
  }

  if (isLoading || !profile) {
    return (
      <Box>
        <Text>Loading settings...</Text>
      </Box>
    )
  }

  return (
    <Box style={{ maxWidth: 640, margin: '0 auto' }}>
      <Flex align="center" gap="3" mb="6">
        <Button
          variant="ghost"
          size="2"
          onClick={() => navigate(-1)}
          style={{ padding: 6 }}
        >
          <ArrowLeft size={18} />
        </Button>
        <Text size="7" weight="bold">
          Settings
        </Text>
      </Flex>

      {/* General section */}
      <Text size="1" weight="medium" color="gray" mb="3" style={{ textTransform: 'uppercase', letterSpacing: '0.05em' }}>
        General
      </Text>

      <Card mb="5">
        <Flex direction="column">
          <SettingsRow
            icon={<Globe size={16} />}
            label="Target Language"
            description={profile.targetLanguage}
          >
            <Select.Root
              value={profile.targetLanguage}
              onValueChange={(v) => handleUpdate({ targetLanguage: v })}
              size="2"
            >
              <Select.Trigger variant="soft" />
              <Select.Content>
                <Select.Item value="Japanese">Japanese</Select.Item>
                <Select.Item value="Korean">Korean</Select.Item>
                <Select.Item value="Chinese">Chinese</Select.Item>
                <Select.Item value="Spanish">Spanish</Select.Item>
                <Select.Item value="French">French</Select.Item>
                <Select.Item value="German">German</Select.Item>
              </Select.Content>
            </Select.Root>
          </SettingsRow>

          <Separator size="4" />

          <SettingsRow
            icon={<Globe size={16} />}
            label="Native Language"
            description={profile.nativeLanguage}
          >
            <Select.Root
              value={profile.nativeLanguage}
              onValueChange={(v) => handleUpdate({ nativeLanguage: v })}
              size="2"
            >
              <Select.Trigger variant="soft" />
              <Select.Content>
                <Select.Item value="English">English</Select.Item>
                <Select.Item value="Japanese">Japanese</Select.Item>
                <Select.Item value="Korean">Korean</Select.Item>
                <Select.Item value="Chinese">Chinese</Select.Item>
                <Select.Item value="Spanish">Spanish</Select.Item>
              </Select.Content>
            </Select.Root>
          </SettingsRow>
        </Flex>
      </Card>

      {/* Learning section */}
      <Text size="1" weight="medium" color="gray" mb="3" style={{ textTransform: 'uppercase', letterSpacing: '0.05em' }}>
        Learning
      </Text>

      <Card mb="5">
        <Flex direction="column">
          <SettingsRow
            icon={<BookOpen size={16} />}
            label="Daily New Items"
            description={`${profile.dailyNewItemLimit} new items per day`}
          >
            <Select.Root
              value={String(profile.dailyNewItemLimit)}
              onValueChange={(v) =>
                handleUpdate({ dailyNewItemLimit: parseInt(v) })
              }
              size="2"
            >
              <Select.Trigger variant="soft" />
              <Select.Content>
                <Select.Item value="5">5</Select.Item>
                <Select.Item value="10">10</Select.Item>
                <Select.Item value="15">15</Select.Item>
                <Select.Item value="20">20</Select.Item>
                <Select.Item value="25">25</Select.Item>
                <Select.Item value="30">30</Select.Item>
              </Select.Content>
            </Select.Root>
          </SettingsRow>

          <Separator size="4" />

          <SettingsRow
            icon={<Target size={16} />}
            label="Target Retention"
            description={`${Math.round(profile.targetRetention * 100)}% target`}
          >
            <Select.Root
              value={String(profile.targetRetention)}
              onValueChange={(v) =>
                handleUpdate({ targetRetention: parseFloat(v) })
              }
              size="2"
            >
              <Select.Trigger variant="soft" />
              <Select.Content>
                <Select.Item value="0.80">80%</Select.Item>
                <Select.Item value="0.85">85%</Select.Item>
                <Select.Item value="0.90">90%</Select.Item>
                <Select.Item value="0.95">95%</Select.Item>
                <Select.Item value="0.97">97%</Select.Item>
              </Select.Content>
            </Select.Root>
          </SettingsRow>
        </Flex>
      </Card>

      {/* Stats section */}
      <Text size="1" weight="medium" color="gray" mb="3" style={{ textTransform: 'uppercase', letterSpacing: '0.05em' }}>
        Progress
      </Text>

      <Card>
        <Flex direction="column">
          <SettingsRow
            icon={<Flame size={16} />}
            label="Current Level"
            description={profile.computedLevel}
          />

          <Separator size="4" />

          <SettingsRow
            icon={<Flame size={16} />}
            label="Streak"
            description={`${profile.currentStreak} day${profile.currentStreak !== 1 ? 's' : ''} (longest: ${profile.longestStreak})`}
          />

          <Separator size="4" />

          <SettingsRow
            icon={<BookOpen size={16} />}
            label="Total Reviews"
            description={String(profile.totalReviewEvents)}
          />

          <Separator size="4" />

          <SettingsRow
            icon={<Target size={16} />}
            label="Comprehension Ceiling"
            description={profile.comprehensionCeiling}
          />

          <Separator size="4" />

          <SettingsRow
            icon={<Target size={16} />}
            label="Production Ceiling"
            description={profile.productionCeiling}
          />
        </Flex>
      </Card>
    </Box>
  )
}

function SettingsRow({
  icon,
  label,
  description,
  children,
}: {
  icon: React.ReactNode
  label: string
  description: string
  children?: React.ReactNode
}) {
  return (
    <Flex align="center" justify="between" py="3" px="1" gap="3">
      <Flex align="center" gap="3" style={{ flex: 1, minWidth: 0 }}>
        <Flex
          align="center"
          justify="center"
          style={{
            width: 28,
            height: 28,
            borderRadius: 'var(--radius-2)',
            backgroundColor: 'var(--gray-3)',
            flexShrink: 0,
            color: 'var(--gray-11)',
          }}
        >
          {icon}
        </Flex>
        <Flex direction="column" gap="0" style={{ minWidth: 0 }}>
          <Text size="2" weight="medium">
            {label}
          </Text>
          <Text size="1" color="gray" truncate>
            {description}
          </Text>
        </Flex>
      </Flex>
      {children && <Box style={{ flexShrink: 0 }}>{children}</Box>}
    </Flex>
  )
}

'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Select } from '@radix-ui/themes'
import { ArrowLeft, Globe, BookOpen, Target, Flame } from 'lucide-react'
import type { ExpandedLearnerProfile } from '@linguist/shared/types'
import { Spinner } from '@/components/spinner'
import { api } from '@/lib/api'

export default function SettingsPage() {
  const router = useRouter()
  const [profile, setProfile] = useState<ExpandedLearnerProfile | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    api.profileGet().then((p) => {
      setProfile(p)
      setIsLoading(false)
    })
  }, [])

  const handleUpdate = async (
    updates: Partial<{ dailyNewItemLimit: number; targetRetention: number }>
  ) => {
    const updated = await api.profileUpdate(updates)
    setProfile(updated)
  }

  if (isLoading || !profile) {
    return (
      <div className="max-w-[640px] mx-auto">
        <div className="flex items-center gap-3 mt-6 justify-center">
          <Spinner size={18} />
          <span className="text-sm text-gray-500">Loading settings...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-[640px] mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <button
          className="p-1.5 rounded-md text-gray-600 hover:bg-gray-100 transition-colors"
          onClick={() => router.back()}
        >
          <ArrowLeft size={18} />
        </button>
        <h1 className="text-3xl font-bold">Settings</h1>
      </div>

      <span className="text-xs font-medium text-gray-500 uppercase tracking-wide block mb-3">
        General
      </span>

      <div className="rounded-xl border border-gray-200 bg-white mb-5">
        <div className="flex flex-col">
          <SettingsRow icon={<Globe size={16} />} label="Target Language" description={profile.targetLanguage} />
          <hr className="border-gray-200" />
          <SettingsRow icon={<Globe size={16} />} label="Native Language" description={profile.nativeLanguage} />
        </div>
      </div>

      <span className="text-xs font-medium text-gray-500 uppercase tracking-wide block mb-3">
        Learning
      </span>

      <div className="rounded-xl border border-gray-200 bg-white mb-5">
        <div className="flex flex-col">
          <SettingsRow
            icon={<BookOpen size={16} />}
            label="Daily New Items"
            description={`${profile.dailyNewItemLimit} new items per day`}
          >
            {/* Keep Radix Select for now - complex interactive component */}
            <Select.Root
              value={String(profile.dailyNewItemLimit)}
              onValueChange={(v) => handleUpdate({ dailyNewItemLimit: parseInt(v) })}
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

          <hr className="border-gray-200" />

          <SettingsRow
            icon={<Target size={16} />}
            label="Target Retention"
            description={`${Math.round(profile.targetRetention * 100)}% target`}
          >
            <Select.Root
              value={String(profile.targetRetention)}
              onValueChange={(v) => handleUpdate({ targetRetention: parseFloat(v) })}
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
        </div>
      </div>

      <span className="text-xs font-medium text-gray-500 uppercase tracking-wide block mb-3">
        Progress
      </span>

      <div className="rounded-xl border border-gray-200 bg-white">
        <div className="flex flex-col">
          <SettingsRow icon={<Flame size={16} />} label="Current Level" description={profile.computedLevel} />
          <hr className="border-gray-200" />
          <SettingsRow icon={<Flame size={16} />} label="Streak" description={`${profile.currentStreak} day${profile.currentStreak !== 1 ? 's' : ''} (longest: ${profile.longestStreak})`} />
          <hr className="border-gray-200" />
          <SettingsRow icon={<BookOpen size={16} />} label="Total Reviews" description={String(profile.totalReviewEvents)} />
          <hr className="border-gray-200" />
          <SettingsRow icon={<Target size={16} />} label="Comprehension Ceiling" description={profile.comprehensionCeiling} />
          <hr className="border-gray-200" />
          <SettingsRow icon={<Target size={16} />} label="Production Ceiling" description={profile.productionCeiling} />
        </div>
      </div>
    </div>
  )
}

function SettingsRow({
  icon, label, description, children,
}: {
  icon: React.ReactNode; label: string; description: string; children?: React.ReactNode
}) {
  return (
    <div className="flex items-center justify-between py-3 px-1 gap-3">
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <div className="w-7 h-7 rounded-md bg-gray-100 shrink-0 text-gray-600 flex items-center justify-center">
          {icon}
        </div>
        <div className="flex flex-col min-w-0">
          <span className="text-sm font-medium">{label}</span>
          <span className="text-xs text-gray-500 truncate">{description}</span>
        </div>
      </div>
      {children && <div className="shrink-0">{children}</div>}
    </div>
  )
}

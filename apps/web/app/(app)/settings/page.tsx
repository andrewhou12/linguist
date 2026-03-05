'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Globe, GraduationCap } from 'lucide-react'
import type { LearnerProfile } from '@lingle/shared/types'
import { Spinner } from '@/components/spinner'
import { api } from '@/lib/api'
import { DIFFICULTY_LEVELS } from '@/lib/difficulty-levels'

export default function SettingsPage() {
  const router = useRouter()
  const [profile, setProfile] = useState<LearnerProfile | null>(() => api.peekCache<LearnerProfile>('/profile') ?? null)
  const [isLoading, setIsLoading] = useState(() => !api.peekCache('/profile'))
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    api.profileGet().then((p) => {
      setProfile(p)
      setIsLoading(false)
    })
  }, [])

  const handleDifficultyChange = async (level: number) => {
    if (!profile || isSaving) return
    setIsSaving(true)
    setProfile({ ...profile, difficultyLevel: level })
    try {
      const updated = await api.profilePatch({ difficultyLevel: level })
      setProfile(updated)
    } catch (err) {
      console.error('Failed to update difficulty:', err)
      // Revert on error
      setProfile(profile)
    }
    setIsSaving(false)
  }

  if (isLoading || !profile) {
    return (
      <div className="max-w-[640px] mx-auto">
        <div className="flex items-center gap-3 mt-6 justify-center">
          <Spinner size={18} />
          <span className="text-[13px] text-text-muted">Loading settings...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-[640px] mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <button
          className="p-1.5 rounded-md text-text-secondary bg-transparent border-none cursor-pointer transition-colors duration-150 hover:bg-bg-hover"
          onClick={() => router.back()}
        >
          <ArrowLeft size={18} />
        </button>
        <h1 className="text-[28px] font-bold">Settings</h1>
      </div>

      <span className="text-[11px] font-medium text-text-muted uppercase tracking-wide block mb-3">
        Language
      </span>

      <div className="rounded-xl border border-border bg-bg mb-6">
        <div className="flex flex-col">
          <SettingsRow icon={<Globe size={16} />} label="Target Language" value={profile.targetLanguage} />
          <hr className="border-t border-border m-0" />
          <SettingsRow icon={<Globe size={16} />} label="Native Language" value={profile.nativeLanguage} />
        </div>
      </div>

      <span className="text-[11px] font-medium text-text-muted uppercase tracking-wide block mb-3">
        Difficulty
      </span>

      <div className="rounded-xl border border-border bg-bg">
        <div className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-7 h-7 rounded-md bg-bg-secondary shrink-0 text-text-secondary flex items-center justify-center">
              <GraduationCap size={16} />
            </div>
            <span className="text-[13px] font-medium">Level</span>
          </div>
          <div className="flex flex-col gap-2">
            {DIFFICULTY_LEVELS.map((level) => (
              <button
                key={level.level}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg border text-left cursor-pointer transition-all ${
                  profile.difficultyLevel === level.level
                    ? 'border-accent-brand bg-bg-hover'
                    : 'border-border-subtle bg-bg-pure hover:border-border-strong hover:bg-bg-hover'
                }`}
                onClick={() => handleDifficultyChange(level.level)}
                disabled={isSaving}
              >
                <span className={`w-6 h-6 rounded-full text-[12px] font-semibold flex items-center justify-center shrink-0 ${
                  profile.difficultyLevel === level.level
                    ? 'bg-accent-brand text-white'
                    : 'bg-bg-secondary text-text-secondary'
                }`}>
                  {level.level}
                </span>
                <div className="flex flex-col gap-0.5 min-w-0">
                  <span className="text-[13px] font-medium text-text-primary">{level.label}</span>
                  <span className="text-[11px] text-text-muted leading-snug">{level.shortDescription}</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

function SettingsRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-3 px-4 gap-3">
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <div className="w-7 h-7 rounded-md bg-bg-secondary shrink-0 text-text-secondary flex items-center justify-center">
          {icon}
        </div>
        <span className="text-[13px] font-medium">{label}</span>
      </div>
      <span className="text-[13px] text-text-secondary">{value}</span>
    </div>
  )
}

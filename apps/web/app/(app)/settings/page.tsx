'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Globe } from 'lucide-react'
import type { LearnerProfile } from '@lingle/shared/types'
import { Spinner } from '@/components/spinner'
import { api } from '@/lib/api'

export default function SettingsPage() {
  const router = useRouter()
  const [profile, setProfile] = useState<LearnerProfile | null>(() => api.peekCache<LearnerProfile>('/profile') ?? null)
  const [isLoading, setIsLoading] = useState(() => !api.peekCache('/profile'))

  useEffect(() => {
    api.profileGet().then((p) => {
      setProfile(p)
      setIsLoading(false)
    })
  }, [])

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

      <div className="rounded-xl border border-border bg-bg">
        <div className="flex flex-col">
          <SettingsRow icon={<Globe size={16} />} label="Target Language" value={profile.targetLanguage} />
          <hr className="border-t border-border m-0" />
          <SettingsRow icon={<Globe size={16} />} label="Native Language" value={profile.nativeLanguage} />
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

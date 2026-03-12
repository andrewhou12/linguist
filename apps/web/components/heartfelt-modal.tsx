'use client'

import { useRouter } from 'next/navigation'

interface HeartfeltModalProps {
  open: boolean
  onClose: () => void
}

export function HeartfeltModal({ open, onClose }: HeartfeltModalProps) {
  const router = useRouter()

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-bg-pure rounded-2xl shadow-pop border border-border-subtle max-w-[480px] w-full mx-4 overflow-hidden">
        <div className="p-8">
          <p className="text-[14px] text-text-secondary leading-[1.75] mb-4">
            Hey — thanks for trying your first session! I hope it felt different from the usual language apps.
          </p>
          <p className="text-[14px] text-text-secondary leading-[1.75] mb-4">
            I want to be honest with you. Lingle is really early — it&apos;s just me and a tiny team, and we&apos;re building this because we genuinely believe language learning can be so much better than what&apos;s out there right now. We want to build something that learners actually <em>want</em> to use every day.
          </p>
          <p className="text-[14px] text-text-secondary leading-[1.75] mb-4">
            We&apos;re shipping improvements every week, and we&apos;re extremely responsive — if something feels off or you have ideas, please tell us. We genuinely want to hear it. This is your product as much as ours.
          </p>
          <p className="text-[14px] text-text-secondary leading-[1.75] mb-4">
            If you become an early adopter, you lock in $5/mo forever — even as the product gets better. That&apos;s our promise to the people who believed in us early.
          </p>
          <p className="text-[14px] text-text-primary font-medium leading-[1.75] mb-1">
            Either way, thank you for being here. It means a lot.
          </p>
          <p className="text-[13px] text-text-muted mb-6">— Andrew & the Lingle team</p>
          <div className="flex flex-col gap-2.5">
            <button
              onClick={() => router.push('/upgrade')}
              className="w-full py-2.5 px-4 rounded-lg bg-accent-brand text-white text-[14px] font-medium transition-colors hover:bg-accent-brand/90 cursor-pointer border-none"
            >
              Become an Early Adopter — $5/mo
            </button>
            <button
              onClick={onClose}
              className="w-full py-2.5 px-4 rounded-lg bg-transparent text-text-secondary text-[14px] font-medium transition-colors hover:bg-bg-hover cursor-pointer border-none"
            >
              Maybe later
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

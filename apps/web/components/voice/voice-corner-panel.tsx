'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { XMarkIcon } from '@heroicons/react/24/outline'
import { cn } from '@/lib/utils'

interface VoiceCornerPanelProps {
  isOpen: boolean
  title: string
  onClose: () => void
  extraHeader?: React.ReactNode
  children: React.ReactNode
  className?: string
}

/**
 * Floating corner panel — positioned at bottom-right.
 * Uses the app's standard card patterns:
 * - rounded-xl, border-border, shadow-pop
 * - Standard header with text-[13px] font-semibold
 * - Close button matches app's close button size (w-7 h-7)
 */
export function VoiceCornerPanel({
  isOpen,
  title,
  onClose,
  extraHeader,
  children,
  className,
}: VoiceCornerPanelProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 8 }}
          transition={{ duration: 0.2, ease: [0.2, 0.85, 0.4, 1] }}
          className={cn(
            'absolute bottom-[148px] right-[18px] w-[290px] z-20',
            'bg-bg-pure border border-border rounded-xl shadow-pop overflow-hidden',
            className,
          )}
        >
          {/* Header — matches app's panel header pattern */}
          <div className="flex items-center justify-between px-4 pt-3.5 pb-2.5 border-b border-border shrink-0">
            <span className="text-[13px] font-semibold text-text-primary tracking-[-0.01em]">{title}</span>
            <div className="flex items-center gap-2">
              {extraHeader}
              <button
                onClick={onClose}
                className="w-7 h-7 rounded-lg flex items-center justify-center bg-transparent border-none cursor-pointer text-text-muted transition-colors hover:bg-bg-hover hover:text-text-primary"
              >
                <XMarkIcon className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="max-h-[320px] overflow-y-auto [&::-webkit-scrollbar]:w-[3px] [&::-webkit-scrollbar-thumb]:bg-border-strong [&::-webkit-scrollbar-thumb]:rounded-sm">
            {children}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

'use client'

import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { Spinner } from '@/components/spinner'

const STEPS = [
  { label: 'Analyzing your level', duration: 1200 },
  { label: 'Picking vocabulary targets', duration: 1800 },
  { label: 'Writing conversation plan', duration: 2400 },
  { label: 'Setting the scene', duration: 3200 },
]

function StepIndicator() {
  const [activeStep, setActiveStep] = useState(0)

  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = []
    for (let i = 1; i < STEPS.length; i++) {
      timers.push(setTimeout(() => setActiveStep(i), STEPS[i - 1].duration))
    }
    return () => timers.forEach(clearTimeout)
  }, [])

  return (
    <div className="flex flex-col gap-3 w-full">
      {STEPS.map((step, i) => {
        const state = i < activeStep ? 'done' : i === activeStep ? 'active' : 'pending'
        return (
          <div
            key={i}
            className="flex items-center gap-3 transition-opacity duration-300"
            style={{ opacity: state === 'pending' ? 0.35 : 1 }}
          >
            <div className="relative w-5 h-5 flex items-center justify-center shrink-0">
              {state === 'done' ? (
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="text-accent-brand">
                  <path
                    d="M3.5 8.5L6.5 11.5L12.5 4.5"
                    stroke="currentColor"
                    strokeWidth="1.75"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              ) : state === 'active' ? (
                <Spinner size={16} />
              ) : (
                <div className="w-[6px] h-[6px] rounded-full bg-border-strong" />
              )}
            </div>
            <span
              className={`text-[13.5px] leading-[1.4] transition-colors duration-300 ${
                state === 'active'
                  ? 'text-text-primary font-medium'
                  : state === 'done'
                    ? 'text-text-secondary'
                    : 'text-text-muted'
              }`}
            >
              {step.label}
            </span>
          </div>
        )
      })}
    </div>
  )
}

function PulsingDots() {
  return (
    <div className="flex gap-1.5 items-center justify-center">
      {[0, 1, 2].map(i => (
        <div
          key={i}
          className="w-[5px] h-[5px] rounded-full bg-border-strong animate-pulse"
          style={{ animationDelay: `${i * 200}ms` }}
        />
      ))}
    </div>
  )
}

export function LoadingScreen() {
  const [show, setShow] = useState(false)

  useEffect(() => {
    const t = requestAnimationFrame(() => setShow(true))
    return () => cancelAnimationFrame(t)
  }, [])

  return createPortal(
    <div className="fixed inset-0 z-[99999] bg-bg flex flex-col items-center justify-center">
      <div
        className="flex flex-col items-center gap-8 max-w-[280px] w-full transition-all duration-500"
        style={{
          opacity: show ? 1 : 0,
          transform: show ? 'translateY(0)' : 'translateY(12px)',
        }}
      >
        {/* Header */}
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-bg-pure border border-border flex items-center justify-center shadow-[0_1px_3px_rgba(0,0,0,.04)]">
            <Spinner size={20} />
          </div>
          <div className="flex flex-col items-center gap-1">
            <p className="text-[16px] font-semibold text-text-primary tracking-[-0.02em]">
              Building your session
            </p>
            <PulsingDots />
          </div>
        </div>

        {/* Step list */}
        <div className="w-full px-4 py-4 rounded-xl bg-bg-pure border border-border shadow-[0_1px_2px_rgba(0,0,0,.04)]">
          <StepIndicator />
        </div>

        {/* Hint */}
        <p className="text-[12px] text-text-muted text-center leading-[1.6]">
          Tailoring difficulty and topics to your level
        </p>
      </div>
    </div>,
    document.body,
  )
}

'use client'

import { useRef, useEffect, useCallback } from 'react'
import { cn } from '@/lib/utils'
import type { VoiceState } from '@/hooks/use-voice-conversation'

interface VoiceCentralOrbProps {
  state: VoiceState
  size?: number
  className?: string
}

const VOICE_TO_ORB: Record<VoiceState, string> = {
  IDLE: 'idle',
  LISTENING: 'listening',
  THINKING: 'thinking',
  SPEAKING: 'speaking',
  INTERRUPTED: 'listening',
}

const BAR_COUNT = 11
const BAR_WIDTH = 2
const BAR_GAP = 4
const BASE_R = 50

export function VoiceCentralOrb({ state, size = 220, className }: VoiceCentralOrbProps) {
  const orbState = VOICE_TO_ORB[state] || 'idle'
  const barsRef = useRef<SVGGElement>(null)
  const glowRef = useRef<SVGCircleElement>(null)
  const orbRef = useRef<SVGCircleElement>(null)
  const thinkArcsRef = useRef<SVGGElement>(null)
  const ripplesRef = useRef<SVGGElement>(null)
  const animRef = useRef<number>(0)
  const stateRef = useRef(orbState)
  const rippleDataRef = useRef<Array<{ r: number; a: number }>>([])
  const ripTimerRef = useRef(0)
  const thinkRotRef = useRef(0)

  stateRef.current = orbState

  // Bar heights driven by rAF
  const barHeightsRef = useRef(new Array(BAR_COUNT).fill(0))
  const barTargetsRef = useRef(new Array(BAR_COUNT).fill(0))

  useEffect(() => {
    const tick = (ts: number) => {
      const st = stateRef.current
      const t = ts / 1000
      const showBars = st === 'listening' || st === 'speaking'

      // Update bar targets
      if (showBars) {
        for (let i = 0; i < BAR_COUNT; i++) {
          const x = (i / BAR_COUNT) * Math.PI * 2
          barTargetsRef.current[i] = 4 + Math.abs(
            Math.sin(x * 2.4 + t * 3.3) * 12 +
            Math.sin(x * 5.1 - t * 2.1) * 6 +
            Math.sin(x * 1.3 + t * 4.6) * 4,
          ) * 0.4
        }
      } else {
        barTargetsRef.current.fill(0)
      }

      // Lerp bars
      for (let i = 0; i < BAR_COUNT; i++) {
        barHeightsRef.current[i] += (barTargetsRef.current[i] - barHeightsRef.current[i]) * 0.18
      }

      // Apply bar heights to DOM
      if (barsRef.current) {
        const rects = barsRef.current.querySelectorAll('rect')
        const totalW = BAR_COUNT * BAR_WIDTH + (BAR_COUNT - 1) * BAR_GAP
        const startX = 110 - totalW / 2
        rects.forEach((rect, i) => {
          const h = barHeightsRef.current[i]
          const x = startX + i * (BAR_WIDTH + BAR_GAP)
          rect.setAttribute('x', String(x))
          rect.setAttribute('y', String(110 - h / 2))
          rect.setAttribute('height', String(h))
          rect.setAttribute('opacity', showBars ? String(0.25 + (h / 30) * 0.45) : '0')
        })
      }

      // Amplitude for orb radius
      const amp = showBars
        ? barHeightsRef.current.reduce((a, b) => a + b, 0) / BAR_COUNT
        : 0
      const dynamicR = BASE_R + amp * 0.12

      // Update orb radius (breathing handled by CSS when idle)
      if (orbRef.current && st !== 'idle') {
        orbRef.current.setAttribute('r', String(dynamicR))
      }

      // Glow
      if (glowRef.current) {
        const glowR = dynamicR + 12
        glowRef.current.setAttribute('r', String(glowR))
        glowRef.current.setAttribute('opacity', st === 'idle' ? '0.06' : '0.1')
      }

      // Thinking arcs
      if (thinkArcsRef.current) {
        if (st === 'thinking') {
          thinkRotRef.current += 1.4
          thinkArcsRef.current.setAttribute('transform', `rotate(${thinkRotRef.current} 110 110)`)
          thinkArcsRef.current.style.opacity = '1'
        } else {
          thinkArcsRef.current.style.opacity = '0'
        }
      }

      // Ripples (speaking)
      if (ripplesRef.current) {
        ripTimerRef.current++
        if (st === 'speaking' && ripTimerRef.current % 55 === 0) {
          rippleDataRef.current.push({ r: dynamicR + 5, a: 0.3 })
        }
        rippleDataRef.current = rippleDataRef.current.filter(r => r.a > 0.005)
        rippleDataRef.current.forEach(r => { r.r += 1.2; r.a *= 0.97 })

        const circles = ripplesRef.current.children
        for (let i = 0; i < 4; i++) {
          const el = circles[i] as SVGCircleElement
          if (!el) continue
          const d = rippleDataRef.current[i]
          if (d) {
            el.setAttribute('r', String(d.r))
            el.setAttribute('opacity', String(d.a * 0.25))
            el.style.display = ''
          } else {
            el.style.display = 'none'
          }
        }
      }

      animRef.current = requestAnimationFrame(tick)
    }

    animRef.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(animRef.current)
  }, [])

  const isUser = orbState === 'listening'
  const gradId = 'orb-grad'
  const glowId = 'orb-glow-blur'
  const clipId = 'orb-clip'

  return (
    <div className={className} style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 220 220"
        style={{ display: 'block', overflow: 'visible' }}
      >
        <defs>
          {/* Radial gradient for orb fill */}
          <radialGradient id={gradId} cx="42%" cy="38%" r="58%">
            {isUser ? (
              <>
                <stop offset="0%" stopColor="rgba(255,252,248,.97)" />
                <stop offset="50%" stopColor="rgba(252,244,236,.93)" />
                <stop offset="100%" stopColor="rgba(238,222,208,.86)" />
              </>
            ) : (
              <>
                <stop offset="0%" stopColor="rgba(255,255,255,.97)" />
                <stop offset="60%" stopColor="rgba(248,247,245,.93)" />
                <stop offset="100%" stopColor="rgba(235,233,230,.86)" />
              </>
            )}
          </radialGradient>

          {/* Glow filter */}
          <filter id={glowId} x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="14" />
          </filter>

          {/* Clip path for wave bars */}
          <clipPath id={clipId}>
            <circle cx="110" cy="110" r={BASE_R} />
          </clipPath>
        </defs>

        {/* Glow circle behind orb */}
        <circle
          ref={glowRef}
          cx="110"
          cy="110"
          r={BASE_R + 12}
          fill={isUser ? 'rgba(200,87,42,.08)' : 'rgba(180,178,175,.1)'}
          filter={`url(#${glowId})`}
          opacity="0.06"
        />

        {/* Ripple circles (speaking) */}
        <g ref={ripplesRef}>
          {[0, 1, 2, 3].map(i => (
            <circle
              key={i}
              cx="110"
              cy="110"
              r={BASE_R}
              fill="none"
              stroke="rgba(47,47,47,.2)"
              strokeWidth="1"
              opacity="0"
              style={{ display: 'none' }}
            />
          ))}
        </g>

        {/* Thinking arcs */}
        <g ref={thinkArcsRef} style={{ opacity: 0, transition: 'opacity 0.3s' }}>
          {[0, 1, 2].map(i => {
            const startAngle = i * 120
            const endAngle = startAngle + 50
            const r = BASE_R + 14
            const x1 = 110 + r * Math.cos((startAngle * Math.PI) / 180)
            const y1 = 110 + r * Math.sin((startAngle * Math.PI) / 180)
            const x2 = 110 + r * Math.cos((endAngle * Math.PI) / 180)
            const y2 = 110 + r * Math.sin((endAngle * Math.PI) / 180)
            return (
              <path
                key={i}
                d={`M ${x1} ${y1} A ${r} ${r} 0 0 1 ${x2} ${y2}`}
                fill="none"
                stroke={`rgba(47,47,47,${0.08 + i * 0.05})`}
                strokeWidth="2"
                strokeLinecap="round"
              />
            )
          })}
        </g>

        {/* Main orb circle */}
        <circle
          ref={orbRef}
          cx="110"
          cy="110"
          r={BASE_R}
          fill={`url(#${gradId})`}
          stroke={isUser ? 'rgba(200,87,42,.18)' : 'rgba(185,182,178,.2)'}
          strokeWidth="1.5"
          className={cn(orbState === 'idle' && 'animate-[orb-breathe_3.8s_ease-in-out_infinite]')}
        />

        {/* Wave bars (clipped to orb) */}
        <g ref={barsRef} clipPath={`url(#${clipId})`}>
          {Array.from({ length: BAR_COUNT }).map((_, i) => (
            <rect
              key={i}
              x="0"
              y="110"
              width={BAR_WIDTH}
              height="0"
              rx="1"
              fill={isUser ? 'rgba(200,87,42,.5)' : 'rgba(47,47,47,.4)'}
              opacity="0"
            />
          ))}
        </g>

        {/* Highlight ellipse at upper-left */}
        <ellipse
          cx={110 - BASE_R * 0.22}
          cy={110 - BASE_R * 0.26}
          rx={BASE_R * 0.32}
          ry={BASE_R * 0.24}
          fill="rgba(255,255,255,.18)"
        />
      </svg>
    </div>
  )
}

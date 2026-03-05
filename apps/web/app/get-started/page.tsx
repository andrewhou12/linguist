'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'

function LogoSVG({ size = 22 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <path d="M24 4C24 4, 18 7, 14 12C10 17, 8 23, 8 28C9 26, 11 21, 14 16C17 11, 21 7, 24 4Z" stroke="white" strokeWidth="2.2" strokeLinejoin="round" fill="none"/>
      <path d="M24 4C24 4, 27 9, 24 15C21 21, 16 26, 11 29C13 25, 17 20, 20 15C23 10, 26 7, 24 4Z" stroke="white" strokeWidth="2.2" strokeLinejoin="round" fill="none"/>
    </svg>
  )
}

function GoogleLogo() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden>
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    </svg>
  )
}

export default function GetStartedPage() {
  const router = useRouter()
  const [showAuth, setShowAuth] = useState(false)
  const [signingIn, setSigningIn] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [prompt, setPrompt] = useState('')

  useEffect(() => {
    try {
      const stored = localStorage.getItem('lingle_pending_prompt')
      if (stored) {
        const { prompt: p } = JSON.parse(stored)
        setPrompt(p)
      }
    } catch {}
  }, [])

  // Check if user is already authenticated
  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) {
        router.push('/conversation')
      }
    })
  }, [router])

  const handleGoogleSignIn = async () => {
    setSigningIn(true)
    setError(null)
    try {
      const supabase = createClient()
      const { error: authError } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback?next=/onboarding`,
        },
      })
      if (authError) {
        setError(authError.message)
        setSigningIn(false)
      }
    } catch {
      setError('Something went wrong. Please try again.')
      setSigningIn(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden bg-[#1a1a1a]">
      {/* Ambient glow */}
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_80%_60%_at_50%_40%,rgba(200,87,42,.08)_0%,transparent_70%)]" />

      {/* Nav */}
      <nav className="flex items-center justify-between px-8 h-[54px] relative z-10">
        <a href="/" className="flex items-center gap-2 no-underline">
          <div className="w-[30px] h-[30px] bg-accent-brand rounded-lg flex items-center justify-center">
            <LogoSVG />
          </div>
          <span className="font-serif text-[18px] font-normal italic text-[#f0ede8]">
            Lingle
          </span>
        </a>
        <div className="flex gap-2 items-center">
          <button
            onClick={() => setShowAuth(true)}
            className="text-[13.5px] text-[rgba(240,237,232,.5)] bg-transparent border-none px-3 py-1.5 rounded-md cursor-pointer hover:text-[rgba(240,237,232,.7)] transition-colors duration-150"
          >
            Sign In
          </button>
          <button
            onClick={() => setShowAuth(true)}
            className="text-[13.5px] font-medium text-white bg-accent-brand border-none rounded-[10px] px-4 py-[7px] cursor-pointer hover:bg-[#444] transition-colors duration-150"
          >
            Sign Up
          </button>
        </div>
      </nav>

      {/* Main content */}
      <div className="flex-1 flex flex-col items-center justify-center text-center px-6 relative z-[1]">
        <h1 className="text-[clamp(36px,5vw,64px)] font-bold text-[#f0ede8] tracking-[-0.04em] leading-[1.12] mb-6 idle-entrance">
          Your learning experience<br />is{' '}
          <span className="font-serif italic font-light">almost ready</span>
        </h1>

        {/* Preview cards */}
        <div className="flex gap-4 mb-10 idle-entrance" style={{ animationDelay: '.1s' }}>
          {/* Blurred chat preview */}
          <div className="w-[200px] h-[140px] rounded-2xl border border-[rgba(255,255,255,.1)] backdrop-blur-[10px] p-4 flex flex-col gap-2 overflow-hidden bg-[linear-gradient(135deg,rgba(255,255,255,.08)_0%,rgba(255,255,255,.03)_100%)]">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-[rgba(255,255,255,.1)] flex items-center justify-center text-[11px] text-[rgba(255,255,255,.5)] font-semibold">
                AI
              </div>
              <div>
                <div className="text-[11px] text-[rgba(255,255,255,.6)] font-semibold">Lingle Agent</div>
                <div className="text-[9px] text-[rgba(255,255,255,.3)]">Ready to chat</div>
              </div>
            </div>
            <div className="flex-1 rounded-lg bg-[rgba(255,255,255,.05)] blur-[4px] flex flex-col gap-1.5 p-2">
              <div className="h-2 w-4/5 bg-[rgba(255,255,255,.1)] rounded" />
              <div className="h-2 w-3/5 bg-[rgba(255,255,255,.1)] rounded" />
              <div className="h-2 w-[70%] bg-[rgba(255,255,255,.1)] rounded self-end" />
            </div>
          </div>

          <div className="w-[200px] h-[140px] rounded-2xl border border-[rgba(255,255,255,.1)] backdrop-blur-[10px] p-4 flex flex-col gap-2 overflow-hidden bg-[linear-gradient(135deg,rgba(200,87,42,.12)_0%,rgba(255,255,255,.03)_100%)]">
            <div className="text-[11px] text-[rgba(255,255,255,.5)] font-semibold tracking-[.06em] uppercase">
              Your prompt
            </div>
            <div className="flex-1 rounded-lg text-[13px] text-[rgba(255,255,255,.7)] leading-relaxed overflow-hidden">
              {prompt || 'Your conversation awaits...'}
            </div>
          </div>
        </div>

        {/* CTA */}
        <button
          onClick={() => setShowAuth(true)}
          className="text-[16px] font-semibold text-white bg-accent-warm border-none rounded-[14px] px-9 py-3.5 cursor-pointer shadow-[0_2px_12px_rgba(200,87,42,.4),0_8px_32px_rgba(200,87,42,.2)] transition-all duration-150 hover:-translate-y-0.5 hover:shadow-[0_4px_20px_rgba(200,87,42,.5),0_12px_40px_rgba(200,87,42,.25)] idle-entrance"
          style={{ animationDelay: '.2s' }}
        >
          Sign up for free to start
        </button>

        <p className="text-[13px] text-[rgba(240,237,232,.35)] mt-4 idle-entrance" style={{ animationDelay: '.3s' }}>
          Free forever. No credit card required.
        </p>
      </div>

      {/* Auth Modal Overlay */}
      {showAuth && (
        <div
          className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center animate-in fade-in duration-200"
          onClick={(e) => { if (e.target === e.currentTarget) setShowAuth(false) }}
        >
          <div className="w-full max-w-[420px] bg-[#1a1a1a] border border-[rgba(255,255,255,.12)] rounded-[20px] p-8 relative animate-in zoom-in-95 duration-200">
            {/* Close */}
            <button
              onClick={() => setShowAuth(false)}
              className="absolute top-4 right-4 w-7 h-7 rounded-lg bg-[rgba(255,255,255,.06)] border border-[rgba(255,255,255,.1)] cursor-pointer flex items-center justify-center text-[rgba(255,255,255,.4)] text-[14px] hover:bg-[rgba(255,255,255,.1)] transition-colors duration-150"
            >
              ✕
            </button>

            {/* Logo */}
            <div className="text-center mb-6">
              <span className="font-serif text-[28px] font-normal italic text-[#f0ede8]">
                Lingle
              </span>
              <div className="text-[15px] font-semibold text-[#f0ede8] mt-2">
                Create your account
              </div>
              <div className="text-[13px] text-[rgba(240,237,232,.5)] mt-1">
                Welcome! Sign in to get started.
              </div>
            </div>

            {error && (
              <div className="p-3 rounded-lg bg-[rgba(200,87,42,.1)] border border-[rgba(200,87,42,.2)] text-accent-warm text-[13px] mb-4">
                {error}
              </div>
            )}

            {/* Google Sign In */}
            <button
              onClick={handleGoogleSignIn}
              disabled={signingIn}
              className={cn(
                "flex items-center justify-center gap-2.5 w-full py-3 px-4 bg-white border-none rounded-[10px] text-[14px] font-medium text-text-primary transition-colors duration-150 hover:bg-bg-secondary",
                signingIn ? "cursor-wait opacity-60" : "cursor-pointer"
              )}
            >
              <GoogleLogo />
              {signingIn ? 'Signing in...' : 'Continue with Google'}
            </button>

            <p className="text-[11px] text-[rgba(240,237,232,.3)] text-center mt-5 leading-normal">
              By continuing, you accept our Privacy Policy and Terms of Use.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}

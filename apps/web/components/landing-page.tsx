'use client'

import Link from 'next/link'
import NeuralCanvas from './neural-canvas'
import KanaFloat from './kana-float'
import styles from './landing.module.css'

export default function LandingPage() {
  return (
    <div className={styles.page}>
      <NeuralCanvas />
      <div className={styles.vignette} />
      <div className={styles.grain} />
      <KanaFloat />

      {/* ── Header ── */}
      <header className={styles.header}>
        <Link href="/" className={styles.logo}>
          語 Linguist
        </Link>
        <nav className={styles.navLinks}>
          <a href="#about" className={styles.navLink}>
            About
          </a>
          <a href="mailto:hello@linguist.app" className={styles.navLink}>
            Contact
          </a>
        </nav>
      </header>

      {/* ── Main ── */}
      <main className={styles.main}>
        <p className={styles.eyebrow}>Japanese · Adaptive · Personal</p>

        <div className={styles.titleWrap}>
          <div className={styles.titleGhost} aria-hidden="true">
            Linguist
          </div>
          <h1 className={styles.title}>Linguist</h1>
        </div>

        <div className={styles.accentBar} />

        <p className={styles.tagline}>
          Japanese that learns how your mind works.
        </p>
        <p className={styles.sub}>
          Every conversation, review, and lookup updates a living model of what
          you know — and what you&apos;re ready to learn next.
        </p>

        <div className={styles.ctaWrap}>
          <Link href="/sign-in" className={styles.ctaPrimary}>
            <svg
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M13 7l5 5m0 0l-5 5m5-5H6"
              />
            </svg>
            Start Learning
          </Link>
          <span className={styles.ctaNote}>V1 · Japanese · Text</span>
        </div>
      </main>

      {/* ── Stats strip ── */}
      <div className={styles.stats}>
        <div className={styles.stat}>
          <span className={styles.statVal}>FSRS</span>
          <span className={styles.statLabel}>SRS Engine</span>
        </div>
        <div className={styles.statDivider} />
        <div className={styles.stat}>
          <span className={styles.statVal}>∞</span>
          <span className={styles.statLabel}>Adaptive model</span>
        </div>
        <div className={styles.statDivider} />
        <div className={styles.stat}>
          <span className={styles.statVal}>Web + Desktop</span>
          <span className={styles.statLabel}>Available on</span>
        </div>
      </div>

      {/* ── Footer ── */}
      <footer className={styles.footer}>
        <Link href="/faq" className={styles.footerLink}>
          FAQ
        </Link>
        <a href="mailto:hello@linguist.app" className={styles.footerLink}>
          Support
        </a>
        <Link href="/privacy" className={styles.footerLink}>
          Privacy
        </Link>
      </footer>
    </div>
  )
}

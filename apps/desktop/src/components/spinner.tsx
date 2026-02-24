import type { CSSProperties } from 'react'

export function Spinner({ size = 20 }: { size?: number }) {
  const style: CSSProperties = {
    width: size,
    height: size,
    animation: 'spin 0.8s linear infinite',
  }

  const stroke = size < 20 ? 2.5 : 2

  return (
    <svg
      style={style}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <circle
        cx="12"
        cy="12"
        r="10"
        stroke="var(--gray-a4)"
        strokeWidth={stroke}
      />
      <path
        d="M12 2a10 10 0 0 1 10 10"
        stroke="var(--accent-9)"
        strokeWidth={stroke}
        strokeLinecap="round"
      />
    </svg>
  )
}

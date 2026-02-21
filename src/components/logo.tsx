export function Logo({ size = 28 }: { size?: number }) {
  const r = size * 0.38
  const offset = size * 0.18
  const cx = size / 2
  const cy = size / 2

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Left circle */}
      <circle
        cx={cx - offset}
        cy={cy}
        r={r}
        fill="var(--accent-a5)"
        stroke="var(--accent-8)"
        strokeWidth={1.2}
      />
      {/* Right circle */}
      <circle
        cx={cx + offset}
        cy={cy}
        r={r}
        fill="var(--accent-a5)"
        stroke="var(--accent-8)"
        strokeWidth={1.2}
      />
      {/* Overlap highlight — use a clip to isolate the intersection */}
      <defs>
        <clipPath id={`logo-clip-l-${size}`}>
          <circle cx={cx - offset} cy={cy} r={r} />
        </clipPath>
      </defs>
      <circle
        cx={cx + offset}
        cy={cy}
        r={r}
        fill="var(--accent-9)"
        clipPath={`url(#logo-clip-l-${size})`}
      />
    </svg>
  )
}

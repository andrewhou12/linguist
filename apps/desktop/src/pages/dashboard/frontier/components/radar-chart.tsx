interface RadarChartProps {
  reading: number
  writing: number
  listening: number
  speaking: number
}

const SIZE = 200
const CENTER = SIZE / 2
const RADIUS = 75
const AXES = [
  { key: 'reading', label: 'Reading', angle: -Math.PI / 2 },
  { key: 'writing', label: 'Writing', angle: 0 },
  { key: 'speaking', label: 'Speaking', angle: Math.PI / 2 },
  { key: 'listening', label: 'Listening', angle: Math.PI },
] as const

function pointOnAxis(angle: number, fraction: number): { x: number; y: number } {
  return {
    x: CENTER + Math.cos(angle) * RADIUS * fraction,
    y: CENTER + Math.sin(angle) * RADIUS * fraction,
  }
}

function polygonPoints(values: number[]): string {
  return AXES.map((axis, i) => {
    const pt = pointOnAxis(axis.angle, values[i])
    return `${pt.x},${pt.y}`
  }).join(' ')
}

export function RadarChart({ reading, writing, listening, speaking }: RadarChartProps) {
  const values = [reading, writing, speaking, listening]
  const guideLines = [0.25, 0.5, 0.75, 1.0]

  return (
    <svg
      viewBox={`0 0 ${SIZE} ${SIZE}`}
      width="100%"
      height="100%"
      style={{ maxWidth: 220, maxHeight: 220 }}
    >
      {/* Guide polygons */}
      {guideLines.map((frac) => (
        <polygon
          key={frac}
          points={polygonPoints([frac, frac, frac, frac])}
          fill="none"
          stroke="var(--gray-5)"
          strokeWidth={0.5}
        />
      ))}

      {/* Axis lines */}
      {AXES.map((axis) => {
        const end = pointOnAxis(axis.angle, 1)
        return (
          <line
            key={axis.key}
            x1={CENTER}
            y1={CENTER}
            x2={end.x}
            y2={end.y}
            stroke="var(--gray-5)"
            strokeWidth={0.5}
          />
        )
      })}

      {/* Data polygon */}
      <polygon
        points={polygonPoints(values)}
        fill="var(--accent-3)"
        stroke="var(--accent-9)"
        strokeWidth={1.5}
        opacity={0.8}
      />

      {/* Data points */}
      {AXES.map((axis, i) => {
        const pt = pointOnAxis(axis.angle, values[i])
        return (
          <circle
            key={axis.key}
            cx={pt.x}
            cy={pt.y}
            r={3}
            fill="var(--accent-9)"
          />
        )
      })}

      {/* Labels */}
      {AXES.map((axis) => {
        const pt = pointOnAxis(axis.angle, 1.22)
        return (
          <text
            key={axis.key}
            x={pt.x}
            y={pt.y}
            textAnchor="middle"
            dominantBaseline="central"
            fill="var(--gray-11)"
            fontSize={11}
            fontFamily="inherit"
          >
            {axis.label}
          </text>
        )
      })}
    </svg>
  )
}

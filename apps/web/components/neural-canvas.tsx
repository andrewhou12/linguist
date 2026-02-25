'use client'

import { useEffect, useRef, useCallback } from 'react'

interface Node {
  x: number
  y: number
  vx: number
  vy: number
  r: number
  activation: number
  pulsePhase: number
  pulseSpeed: number
  cluster: number
}

interface Edge {
  a: number
  b: number
  baseDist: number
}

const CLUSTER_COLORS: [number, number, number][] = [
  [201, 169, 110], // gold
  [74, 127, 165],  // blue
  [160, 120, 180], // soft purple
]

function randBetween(a: number, b: number) {
  return a + Math.random() * (b - a)
}

function colorOf(node: Node, alpha: number) {
  const [r, g, b] = CLUSTER_COLORS[node.cluster]
  return `rgba(${r},${g},${b},${alpha})`
}

export default function NeuralCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const nodesRef = useRef<Node[]>([])
  const edgesRef = useRef<Edge[]>([])
  const mouseRef = useRef({ x: -9999, y: -9999 })
  const animRef = useRef<number>(0)

  const initNodes = useCallback((W: number, H: number) => {
    const count = Math.floor((W * H) / 14000)
    const nodes: Node[] = Array.from({ length: count }, () => ({
      x: Math.random() * W,
      y: Math.random() * H,
      vx: randBetween(-0.12, 0.12),
      vy: randBetween(-0.12, 0.12),
      r: randBetween(1.5, 3.5),
      activation: Math.random(),
      pulsePhase: Math.random() * Math.PI * 2,
      pulseSpeed: randBetween(0.008, 0.02),
      cluster: Math.floor(Math.random() * 3),
    }))

    const edges: Edge[] = []
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const dx = nodes[i].x - nodes[j].x
        const dy = nodes[i].y - nodes[j].y
        const dist = Math.sqrt(dx * dx + dy * dy)
        if (dist < 140) {
          edges.push({ a: i, b: j, baseDist: dist })
        }
      }
    }

    nodesRef.current = nodes
    edgesRef.current = edges
  }, [])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let W = 0
    let H = 0

    function resize() {
      W = canvas!.width = window.innerWidth
      H = canvas!.height = window.innerHeight
      initNodes(W, H)
    }

    function draw() {
      ctx!.clearRect(0, 0, W, H)
      const nodes = nodesRef.current
      const edges = edgesRef.current
      const mouse = mouseRef.current

      // Update nodes
      for (const n of nodes) {
        n.pulsePhase += n.pulseSpeed
        n.x += n.vx
        n.y += n.vy
        if (n.x < 0 || n.x > W) n.vx *= -1
        if (n.y < 0 || n.y > H) n.vy *= -1

        // Mouse repulsion
        const mdx = n.x - mouse.x
        const mdy = n.y - mouse.y
        const md = Math.sqrt(mdx * mdx + mdy * mdy)
        if (md < 120) {
          n.vx += (mdx / md) * 0.04
          n.vy += (mdy / md) * 0.04
          n.vx *= 0.97
          n.vy *= 0.97
        }
      }

      // Draw edges
      for (const e of edges) {
        const a = nodes[e.a]
        const b = nodes[e.b]
        const dx = a.x - b.x
        const dy = a.y - b.y
        const dist = Math.sqrt(dx * dx + dy * dy)
        if (dist > 180) continue

        const strength = (1 - dist / 180) * 0.6
        const act = (a.activation + b.activation) / 2
        const pulse = Math.sin(a.pulsePhase) * 0.5 + 0.5
        const alpha = strength * (0.08 + act * 0.12 + pulse * 0.06)

        const [r1, g1, b1] = CLUSTER_COLORS[a.cluster]
        const grad = ctx!.createLinearGradient(a.x, a.y, b.x, b.y)
        grad.addColorStop(0, `rgba(${r1},${g1},${b1},${alpha})`)
        const [r2, g2, b2] = CLUSTER_COLORS[b.cluster]
        grad.addColorStop(1, `rgba(${r2},${g2},${b2},${alpha * 0.6})`)

        ctx!.beginPath()
        ctx!.moveTo(a.x, a.y)
        ctx!.lineTo(b.x, b.y)
        ctx!.strokeStyle = grad
        ctx!.lineWidth = 0.8 + act * 0.6
        ctx!.stroke()
      }

      // Draw nodes
      for (const n of nodes) {
        const pulse = Math.sin(n.pulsePhase) * 0.5 + 0.5
        const glowR = n.r * (2.5 + pulse * 1.5)
        const baseAlpha = 0.25 + n.activation * 0.35 + pulse * 0.15

        // Outer glow
        const glow = ctx!.createRadialGradient(n.x, n.y, 0, n.x, n.y, glowR * 3)
        glow.addColorStop(0, colorOf(n, baseAlpha * 0.5))
        glow.addColorStop(1, colorOf(n, 0))
        ctx!.beginPath()
        ctx!.arc(n.x, n.y, glowR * 3, 0, Math.PI * 2)
        ctx!.fillStyle = glow
        ctx!.fill()

        // Core
        ctx!.beginPath()
        ctx!.arc(n.x, n.y, n.r + pulse * 0.5, 0, Math.PI * 2)
        ctx!.fillStyle = colorOf(n, 0.7 + pulse * 0.3)
        ctx!.fill()
      }

      animRef.current = requestAnimationFrame(draw)
    }

    function handleMouse(e: MouseEvent) {
      mouseRef.current = { x: e.clientX, y: e.clientY }
    }

    resize()
    animRef.current = requestAnimationFrame(draw)

    window.addEventListener('resize', resize)
    window.addEventListener('mousemove', handleMouse)

    return () => {
      cancelAnimationFrame(animRef.current)
      window.removeEventListener('resize', resize)
      window.removeEventListener('mousemove', handleMouse)
    }
  }, [initNodes])

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 0,
        pointerEvents: 'none',
      }}
    />
  )
}

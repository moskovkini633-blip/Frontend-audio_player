// @ts-nocheck
import { useEffect, useRef } from 'react'
import './ContourBackground.css'
import { getEnergy } from './audioEnergy'
import { useThemeStore } from './themeStore'

const LEVELS = [
  -0.87, -0.725, -0.58, -0.435, -0.29, -0.145, 0,
   0.145, 0.29,  0.435,  0.58,   0.725,  0.87,
]

const FRAME_MS = 1000 / 30

// The pattern lives in a fixed world space (CSS px), so growing the viewport
// reveals more of it instead of stretching the existing one.
const WORLD_SCALE = 1 / 900
const BASE_STEP = 14
const MAX_CELLS = 14000
const MAX_RENDER_PIXELS = 1200000

// Reused buffers so we don't allocate every frame.
let values = new Float32Array(0)
const segmentsByLevel = LEVELS.map(() => [])
const pathsByLevel = new Array(LEVELS.length)

function field(x, y, t) {
  const nx = x * WORLD_SCALE
  const ny = y * WORLD_SCALE
  const a = Math.sin(nx * 8.1 + Math.sin(ny * 5.4 + t * 0.28) * 0.8 + t * 0.34)
  const b = Math.cos(ny * 9.2 - Math.sin(nx * 4.6 - t * 0.24) * 0.75 - t * 0.29)
  const c = Math.sin((nx * 5.4 + ny * 6.7) + t * 0.22 + Math.sin(ny * 8 + t * 0.2) * 0.45)
  const d = Math.cos((nx * 10.5 - ny * 4.1) - t * 0.18)
  return a * 0.36 + b * 0.34 + c * 0.20 + d * 0.10
}

function interp(a, b, va, vb, level) {
  const den = vb - va
  const u = Math.abs(den) < 1e-6 ? 0.5 : (level - va) / den
  return a + (b - a) * Math.max(0, Math.min(1, u))
}

function addSegments(x1, y1, v1, x2, y2, v2, x3, y3, v3, x4, y4, v4, level, out) {
  const pts = []
  if ((v1 < level) !== (v2 < level)) pts.push([interp(x1, x2, v1, v2, level), interp(y1, y2, v1, v2, level)])
  if ((v2 < level) !== (v3 < level)) pts.push([interp(x2, x3, v2, v3, level), interp(y2, y3, v2, v3, level)])
  if ((v3 < level) !== (v4 < level)) pts.push([interp(x3, x4, v3, v4, level), interp(y3, y4, v3, v4, level)])
  if ((v4 < level) !== (v1 < level)) pts.push([interp(x4, x1, v4, v1, level), interp(y4, y1, v4, v1, level)])

  if (pts.length === 2) {
    out.push(pts)
  } else if (pts.length === 4) {
    const centre = (v1 + v2 + v3 + v4) / 4
    if ((centre < level) === (v1 < level)) out.push([pts[0], pts[3]], [pts[1], pts[2]])
    else out.push([pts[0], pts[1]], [pts[2], pts[3]])
  }
}

function smoothPaths(segments) {
  const adjacency = new Map()

  // Numeric keys are far cheaper than template strings.
  const key = (p) => Math.round(p[0] * 10) * 100000 + Math.round(p[1] * 10)

  segments.forEach((segment, index) => {
    for (let end = 0; end < 2; end += 1) {
      const pointKey = key(segment[end])
      const list = adjacency.get(pointKey)
      if (list === undefined) adjacency.set(pointKey, [[index, end]])
      else list.push([index, end])
    }
  })

  const used = new Uint8Array(segments.length)
  const paths = []

  function walk(firstIndex, firstEnd) {
    const points = []
    let index = firstIndex
    let end = firstEnd
    points.push(segments[index][end])

    while (!used[index]) {
      used[index] = 1
      const nextPoint = segments[index][1 - end]
      points.push(nextPoint)
      const links = adjacency.get(key(nextPoint)) || []
      const next = links.find(([candidateIndex]) => !used[candidateIndex])
      if (!next) break
      index = next[0]
      end = next[1]
    }

    if (points.length >= 2) {
      const first = points[0]
      const last = points[points.length - 1]
      const closed = Math.hypot(first[0] - last[0], first[1] - last[1]) < 0.2
      paths.push({ points, closed })
    }
  }

  for (let i = 0; i < segments.length; i += 1) {
    if (used[i]) continue
    let started = false
    for (const end of [0, 1]) {
      const links = adjacency.get(key(segments[i][end])) || []
      if (links.length === 1) {
        walk(i, end)
        started = true
        break
      }
    }
    if (!started && !used[i]) walk(i, 0)
  }
  return paths
}

function tracePaths(ctx, paths) {
  for (let k = 0; k < paths.length; k += 1) {
    const points = paths[k].points
    if (points.length < 2) continue
    ctx.moveTo(points[0][0], points[0][1])

    if (points.length === 2) {
      ctx.lineTo(points[1][0], points[1][1])
      continue
    }

    for (let j = 1; j < points.length - 1; j += 1) {
      const midX = (points[j][0] + points[j + 1][0]) / 2
      const midY = (points[j][1] + points[j + 1][1]) / 2
      ctx.quadraticCurveTo(points[j][0], points[j][1], midX, midY)
    }

    const last = points[points.length - 1]
    ctx.lineTo(last[0], last[1])
    if (paths[k].closed) ctx.closePath()
  }
}

function strokeGroup(ctx, indices, alpha, lineWidth, theme, energy) {
  const boost = 1 + energy * 0.9
  const alphaBoost = 1 + energy * 0.5
  ctx.beginPath()
  for (let k = 0; k < indices.length; k += 1) {
    tracePaths(ctx, pathsByLevel[indices[k]])
  }
  if (theme === 'light') {
    ctx.strokeStyle = `rgba(34, 197, 94, ${Math.min(1, alpha * 0.6 * alphaBoost)})`
  } else {
    ctx.strokeStyle = `rgba(27, 153, 76, ${Math.min(1, alpha * alphaBoost)})`
  }
  ctx.lineWidth = lineWidth * boost
  ctx.stroke()
}

function drawContours(ctx, width, height, time, theme, energy = 0) {
  if (theme === 'light') {
    ctx.fillStyle = '#f7f8fa'
  } else {
    ctx.fillStyle = '#000000'
  }
  ctx.fillRect(0, 0, width, height)

  const step = Math.max(
    BASE_STEP,
    Math.round(Math.sqrt((width * height) / MAX_CELLS)),
  )
  const cols = Math.ceil(width / step) + 1
  const rows = Math.ceil(height / step) + 1

  if (values.length !== cols * rows) values = new Float32Array(cols * rows)

  for (let gy = 0; gy < rows; gy += 1) {
    for (let gx = 0; gx < cols; gx += 1) {
      values[gy * cols + gx] = field(gx * step, gy * step, time)
    }
  }

  for (let li = 0; li < LEVELS.length; li += 1) segmentsByLevel[li].length = 0

  for (let gy = 0; gy < rows - 1; gy += 1) {
    for (let gx = 0; gx < cols - 1; gx += 1) {
      const x = gx * step
      const y = gy * step
      const v1 = values[gy * cols + gx]
      const v2 = values[gy * cols + gx + 1]
      const v3 = values[(gy + 1) * cols + gx + 1]
      const v4 = values[(gy + 1) * cols + gx]

      for (let li = 0; li < LEVELS.length; li += 1) {
        addSegments(
          x, y, v1,
          x + step, y, v2,
          x + step, y + step, v3,
          x, y + step, v4,
          LEVELS[li], segmentsByLevel[li],
        )
      }
    }
  }

  const group0 = []
  const group1 = []
  const group2 = []

  for (let li = 0; li < LEVELS.length; li += 1) {
    pathsByLevel[li] = smoothPaths(segmentsByLevel[li])
    const bucket = li % 3
    if (bucket === 0) group0.push(li)
    else if (bucket === 1) group1.push(li)
    else group2.push(li)
  }

  ctx.lineJoin = 'round'
  ctx.lineCap = 'round'

  // Soft glow: two wide translucent strokes on the same path, no shadowBlur.
  ctx.beginPath()
  for (let li = 0; li < LEVELS.length; li += 1) tracePaths(ctx, pathsByLevel[li])
  if (theme === 'light') {
    ctx.strokeStyle = 'rgba(34, 197, 94, 0.05)'
  } else {
    ctx.strokeStyle = 'rgba(12, 165, 67, 0.06)'
  }
  ctx.lineWidth = 7 + energy * 7
  ctx.stroke()

  if (theme === 'light') {
    ctx.strokeStyle = 'rgba(34, 197, 94, 0.10)'
  } else {
    ctx.strokeStyle = 'rgba(12, 165, 67, 0.10)'
  }
  ctx.lineWidth = 4.2 + energy * 3.5
  ctx.stroke()

  // Three crisp passes, batched by shared style.
  strokeGroup(ctx, group0, 0.60, 1.65, theme, energy)
  strokeGroup(ctx, group1, 0.67, 1.85, theme, energy)
  strokeGroup(ctx, group2, 0.74, 1.85, theme, energy)
}

export default function ContourBackground() {
  const canvasRef = useRef(null)
  const theme = useThemeStore((s) => s.theme)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return undefined

    const ctx = canvas.getContext('2d', { alpha: false })
    if (!ctx) return undefined

    const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    let width = 1
    let height = 1
    let dpr = 1
    let rafId = 0
    let lastFrame = 0
    let lastNow = 0
    let fieldTime = 0
    let isVisible = document.visibilityState === 'visible'

    function resize() {
      width = Math.max(1, window.innerWidth)
      height = Math.max(1, window.innerHeight)
      const budgetScale = Math.sqrt(
        MAX_RENDER_PIXELS / Math.max(width * height, 1),
      )
      dpr = Math.max(
        0.5,
        Math.min(window.devicePixelRatio || 1, 1, budgetScale),
      )
      canvas.width = Math.round(width * dpr)
      canvas.height = Math.round(height * dpr)
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      if (motionQuery.matches) drawContours(ctx, width, height, 0.7, theme)
    }

    function animate(now) {
      if (!isVisible) return

      if (motionQuery.matches) {
        drawContours(ctx, width, height, 0.7, theme)
        return
      }

      if (now - lastFrame >= FRAME_MS) {
        const delta = lastNow ? Math.min(now - lastNow, 120) : FRAME_MS
        lastNow = now
        lastFrame = now

        const { bass, level } = getEnergy()
        fieldTime += delta * 0.00046 * (1 + bass * 2.5)
        drawContours(ctx, width, height, fieldTime, theme, level)
      }
      rafId = requestAnimationFrame(animate)
    }

    function handleMotionChange() {
      if (motionQuery.matches) {
        cancelAnimationFrame(rafId)
        drawContours(ctx, width, height, 0.7, theme)
      } else {
        lastFrame = 0
        lastNow = 0
        rafId = requestAnimationFrame(animate)
      }
    }

    function handleVisibilityChange() {
      isVisible = document.visibilityState === 'visible'
      if (isVisible && !motionQuery.matches) {
        lastFrame = 0
        lastNow = 0
        cancelAnimationFrame(rafId)
        rafId = requestAnimationFrame(animate)
      }
    }

    resize()
    window.addEventListener('resize', resize, { passive: true })
    document.addEventListener('visibilitychange', handleVisibilityChange)
    motionQuery.addEventListener?.('change', handleMotionChange)
    rafId = requestAnimationFrame(animate)

    return () => {
      cancelAnimationFrame(rafId)
      window.removeEventListener('resize', resize)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      motionQuery.removeEventListener?.('change', handleMotionChange)
    }
  }, [theme])

  return <canvas ref={canvasRef} className="contour-background" aria-hidden="true" />
}

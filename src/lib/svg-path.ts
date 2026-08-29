export type Poly = { points: { x: number; y: number }[]; closed: boolean }

const NUM = /[-+]?(?:\d+\.?\d*|\.\d+)(?:[eE][-+]?\d+)?/g

function nums(chunk: string): number[] {
  const out: number[] = []
  const re = new RegExp(NUM, 'g')
  let m: RegExpExecArray | null
  while ((m = re.exec(chunk))) out.push(Number(m[0]))
  return out
}

function sampleCubic(
  p0: { x: number; y: number },
  p1: { x: number; y: number },
  p2: { x: number; y: number },
  p3: { x: number; y: number },
  steps = 8,
): { x: number; y: number }[] {
  const pts: { x: number; y: number }[] = []
  for (let i = 1; i <= steps; i++) {
    const t = i / steps
    const u = 1 - t
    pts.push({
      x: u * u * u * p0.x + 3 * u * u * t * p1.x + 3 * u * t * t * p2.x + t * t * t * p3.x,
      y: u * u * u * p0.y + 3 * u * u * t * p1.y + 3 * u * t * t * p2.y + t * t * t * p3.y,
    })
  }
  return pts
}

/** Parse SVG path `d` into polylines. Supports M/L/H/V/C/Q/Z (absolute and relative). */
export function parseSvgPath(d: string): Poly[] {
  const parts = d.replace(/,/g, ' ').match(/[MmLlHhVvCcQqTtSsAaZz][^MmLlHhVvCcQqTtSsAaZz]*/g)
  if (!parts) return []
  const polys: Poly[] = []
  let cx = 0
  let cy = 0
  let sx = 0
  let sy = 0
  let cur: { x: number; y: number }[] = []

  const flush = (closed: boolean) => {
    if (cur.length >= 2) polys.push({ points: cur, closed })
    cur = []
  }

  for (const part of parts) {
    const raw = part[0]
    const rel = raw === raw.toLowerCase()
    const c = raw.toUpperCase()
    const v = nums(part.slice(1))

    if (c === 'Z') {
      if (cur.length) {
        cur.push({ x: sx, y: sy })
        flush(true)
      }
      cx = sx
      cy = sy
      continue
    }

    if (c === 'M') {
      flush(false)
      for (let i = 0; i + 1 < v.length; i += 2) {
        const x = rel ? cx + v[i] : v[i]
        const y = rel ? cy + v[i + 1] : v[i + 1]
        cx = x
        cy = y
        if (i === 0) {
          sx = cx
          sy = cy
          cur = [{ x: cx, y: cy }]
        } else {
          cur.push({ x: cx, y: cy })
        }
      }
      continue
    }

    if (c === 'L') {
      for (let i = 0; i + 1 < v.length; i += 2) {
        cx = rel ? cx + v[i] : v[i]
        cy = rel ? cy + v[i + 1] : v[i + 1]
        cur.push({ x: cx, y: cy })
      }
    } else if (c === 'H') {
      for (const x of v) {
        cx = rel ? cx + x : x
        cur.push({ x: cx, y: cy })
      }
    } else if (c === 'V') {
      for (const y of v) {
        cy = rel ? cy + y : y
        cur.push({ x: cx, y: cy })
      }
    } else if (c === 'C') {
      for (let i = 0; i + 5 < v.length; i += 6) {
        const p0 = { x: cx, y: cy }
        const p1 = { x: rel ? cx + v[i] : v[i], y: rel ? cy + v[i + 1] : v[i + 1] }
        const p2 = { x: rel ? cx + v[i + 2] : v[i + 2], y: rel ? cy + v[i + 3] : v[i + 3] }
        const p3 = { x: rel ? cx + v[i + 4] : v[i + 4], y: rel ? cy + v[i + 5] : v[i + 5] }
        cur.push(...sampleCubic(p0, p1, p2, p3))
        cx = p3.x
        cy = p3.y
      }
    } else if (c === 'Q') {
      for (let i = 0; i + 3 < v.length; i += 4) {
        const p0 = { x: cx, y: cy }
        const c1 = { x: rel ? cx + v[i] : v[i], y: rel ? cy + v[i + 1] : v[i + 1] }
        const p3 = { x: rel ? cx + v[i + 2] : v[i + 2], y: rel ? cy + v[i + 3] : v[i + 3] }
        const p1 = { x: p0.x + (2 / 3) * (c1.x - p0.x), y: p0.y + (2 / 3) * (c1.y - p0.y) }
        const p2 = { x: p3.x + (2 / 3) * (c1.x - p3.x), y: p3.y + (2 / 3) * (c1.y - p3.y) }
        cur.push(...sampleCubic(p0, p1, p2, p3))
        cx = p3.x
        cy = p3.y
      }
    }
  }
  flush(false)
  return polys
}

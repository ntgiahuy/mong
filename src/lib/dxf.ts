import { parseSvgPath } from './svg-path'

const LAYERS = ['KHUNG', 'BE_TONG', 'THEP', 'KICH_THUOC', 'TRUC', 'CHU', 'BANG'] as const
type Layer = (typeof LAYERS)[number]

function f(n: number): string {
  if (!Number.isFinite(n)) return '0'
  return (Math.round(n * 1000) / 1000).toString()
}

function dxfText(s: string): string {
  return s.replace(/\r?\n/g, ' ').replace(/^\s+|\s+$/g, '').slice(0, 250)
}

class Dxf {
  private body: string[] = []

  pair(code: number, value: string | number) {
    this.body.push(String(code), String(value))
  }

  line(layer: Layer, x1: number, y1: number, x2: number, y2: number) {
    if (Math.hypot(x2 - x1, y2 - y1) < 0.05) return
    this.pair(0, 'LINE')
    this.pair(8, layer)
    this.pair(10, f(x1))
    this.pair(20, f(y1))
    this.pair(11, f(x2))
    this.pair(21, f(y2))
  }

  circle(layer: Layer, x: number, y: number, r: number) {
    if (r < 0.05) return
    this.pair(0, 'CIRCLE')
    this.pair(8, layer)
    this.pair(10, f(x))
    this.pair(20, f(y))
    this.pair(40, f(r))
  }

  polyline(layer: Layer, pts: { x: number; y: number }[], closed: boolean) {
    if (pts.length < 2) return
    this.pair(0, 'POLYLINE')
    this.pair(8, layer)
    this.pair(66, 1)
    this.pair(70, closed ? 1 : 0)
    for (const p of pts) {
      this.pair(0, 'VERTEX')
      this.pair(8, layer)
      this.pair(10, f(p.x))
      this.pair(20, f(p.y))
    }
    this.pair(0, 'SEQEND')
  }

  text(
    layer: Layer,
    x: number,
    y: number,
    height: number,
    value: string,
    align: 'left' | 'center' | 'right',
    rotation = 0,
  ) {
    const t = dxfText(value)
    if (!t) return
    const h = Math.max(1.2, height)
    this.pair(0, 'TEXT')
    this.pair(8, layer)
    this.pair(10, f(x))
    this.pair(20, f(y))
    this.pair(40, f(h))
    this.pair(1, t)
    this.pair(50, f(rotation))
    this.pair(72, align === 'center' ? 1 : align === 'right' ? 2 : 0)
    this.pair(73, 2)
    this.pair(11, f(x))
    this.pair(21, f(y))
  }

  serialize(): string {
    const o: string[] = []
    const p = (c: number, v: string | number) => {
      o.push(String(c), String(v))
    }
    p(0, 'SECTION')
    p(2, 'HEADER')
    p(9, '$ACADVER')
    p(1, 'AC1009')
    p(9, '$INSUNITS')
    p(70, 4)
    p(0, 'ENDSEC')
    p(0, 'SECTION')
    p(2, 'TABLES')
    p(0, 'TABLE')
    p(2, 'LAYER')
    p(70, LAYERS.length)
    for (const name of LAYERS) {
      p(0, 'LAYER')
      p(2, name)
      p(70, 0)
      p(62, 7)
      p(6, 'CONTINUOUS')
    }
    p(0, 'ENDTAB')
    p(0, 'ENDSEC')
    p(0, 'SECTION')
    p(2, 'ENTITIES')
    o.push(...this.body)
    p(0, 'ENDSEC')
    p(0, 'EOF')
    return o.join('\n') + '\n'
  }
}

type Pt = { x: number; y: number }

function rotateAttr(el: Element): { deg: number; cx: number; cy: number } | null {
  const t = el.getAttribute('transform') || ''
  const m = t.match(/rotate\(\s*([-\d.]+)(?:[\s,]+([-\d.]+)[\s,]+([-\d.]+))?\s*\)/)
  if (!m) return null
  return { deg: Number(m[1]), cx: m[2] ? Number(m[2]) : 0, cy: m[3] ? Number(m[3]) : 0 }
}

function layerOf(el: Element, kind: 'line' | 'text' | 'rebar'): Layer {
  if (el.closest('.dim')) return 'KICH_THUOC'
  if (kind === 'text') return 'CHU'
  const dash = el.getAttribute('stroke-dasharray') || ''
  if (dash && dash !== 'none') return 'TRUC'
  if (kind === 'rebar') return 'THEP'
  const sw = Number(el.getAttribute('stroke-width') || el.getAttribute('strokeWidth') || '1')
  if (sw >= 1.7) return 'THEP'
  return 'BE_TONG'
}

function svgToWorld(
  svg: SVGSVGElement,
  x: number,
  y: number,
  sheet: DOMRect,
  s: number,
): Pt {
  const ctm = svg.getScreenCTM()
  if (!ctm) return { x: x / s, y: (sheet.height - y) / s }
  const pt = svg.createSVGPoint()
  pt.x = x
  pt.y = y
  const sp = pt.matrixTransform(ctm)
  const px = sp.x - sheet.left
  const py = sp.y - sheet.top
  return { x: px / s, y: (sheet.height - py) / s }
}

function screenToWorld(sheet: DOMRect, s: number, sx: number, sy: number): Pt {
  const px = sx - sheet.left
  const py = sy - sheet.top
  return { x: px / s, y: (sheet.height - py) / s }
}

function addSvgTree(dxf: Dxf, svg: SVGSVGElement, sheet: DOMRect, s: number) {
  const world = (x: number, y: number) => svgToWorld(svg, x, y, sheet, s)

  const lines = svg.querySelectorAll('line')
  for (const el of lines) {
    const x1 = el.x1.baseVal.value
    const y1 = el.y1.baseVal.value
    const x2 = el.x2.baseVal.value
    const y2 = el.y2.baseVal.value
    const a = world(x1, y1)
    const b = world(x2, y2)
    dxf.line(layerOf(el, 'line'), a.x, a.y, b.x, b.y)
  }

  const rects = svg.querySelectorAll('rect')
  for (const el of rects) {
    const x = el.x.baseVal.value
    const y = el.y.baseVal.value
    const w = el.width.baseVal.value
    const h = el.height.baseVal.value
    const pts = [world(x, y), world(x + w, y), world(x + w, y + h), world(x, y + h)]
    dxf.polyline(layerOf(el, 'line'), pts, true)
  }

  const polygons = svg.querySelectorAll('polygon')
  for (const el of polygons) {
    const raw = (el.getAttribute('points') || '').trim().split(/[\s,]+/).map(Number)
    const pts: Pt[] = []
    for (let i = 0; i + 1 < raw.length; i += 2) pts.push(world(raw[i], raw[i + 1]))
    dxf.polyline(layerOf(el, 'line'), pts, true)
  }

  const circles = svg.querySelectorAll('circle')
  for (const el of circles) {
    const c = world(el.cx.baseVal.value, el.cy.baseVal.value)
    const r0 = el.r.baseVal.value
    const rim = world(el.cx.baseVal.value + r0, el.cy.baseVal.value)
    const r = Math.hypot(rim.x - c.x, rim.y - c.y)
    const fill = el.getAttribute('fill') || ''
    dxf.circle(fill === '#111' || fill === '#000' ? 'THEP' : layerOf(el, 'rebar'), c.x, c.y, r)
  }

  const paths = svg.querySelectorAll('path')
  for (const el of paths) {
    const d = el.getAttribute('d')
    if (!d) continue
    const stroke = el.getAttribute('stroke')
    const fill = el.getAttribute('fill')
    const stroked = stroke !== 'none' && (stroke != null || fill === 'none')
    if (fill && fill !== 'none' && !stroked && stroke === 'none') {
      for (const poly of parseSvgPath(d)) {
        dxf.polyline(
          'BE_TONG',
          poly.points.map((p) => world(p.x, p.y)),
          true,
        )
      }
      continue
    }
    for (const poly of parseSvgPath(d)) {
      dxf.polyline(
        layerOf(el, 'line'),
        poly.points.map((p) => world(p.x, p.y)),
        poly.closed,
      )
    }
  }

  const texts = svg.querySelectorAll('text')
  for (const el of texts) {
    const raw = (el.textContent || '').replace(/\s+/g, ' ').trim()
    if (!raw) continue
    const x = el.x.baseVal.length ? el.x.baseVal.getItem(0).value : 0
    const y = el.y.baseVal.length ? el.y.baseVal.getItem(0).value : 0
    const fs = Number(el.getAttribute('font-size') || el.getAttribute('fontSize') || '10')
    const anchor = el.getAttribute('text-anchor') || 'start'
    const rot = rotateAttr(el)
    const p = world(x, y)
    const h = fs / s
    const align = anchor === 'middle' ? 'center' : anchor === 'end' ? 'right' : 'left'
    dxf.text('CHU', p.x, p.y, h, raw, align, rot ? -rot.deg : 0)
  }
}

function addHtmlTable(dxf: Dxf, table: HTMLTableElement, sheet: DOMRect, s: number) {
  const cells = table.querySelectorAll('th, td')
  for (const cell of cells) {
    const r = cell.getBoundingClientRect()
    const tl = screenToWorld(sheet, s, r.left, r.top)
    const tr = screenToWorld(sheet, s, r.right, r.top)
    const br = screenToWorld(sheet, s, r.right, r.bottom)
    const bl = screenToWorld(sheet, s, r.left, r.bottom)
    dxf.line('BANG', tl.x, tl.y, tr.x, tr.y)
    dxf.line('BANG', tr.x, tr.y, br.x, br.y)
    dxf.line('BANG', br.x, br.y, bl.x, bl.y)
    dxf.line('BANG', bl.x, bl.y, tl.x, tl.y)
    const text = (cell.textContent || '').replace(/\s+/g, ' ').trim()
    if (!text || cell.querySelector('svg')) continue
    const mid = screenToWorld(sheet, s, r.left + r.width / 2, r.top + r.height / 2)
    dxf.text('BANG', mid.x, mid.y, Math.max(12, (r.height * 0.35) / s), text, 'center')
  }
  for (const svg of table.querySelectorAll('svg')) {
    addSvgTree(dxf, svg as SVGSVGElement, sheet, s)
  }
}

function addTitle(dxf: Dxf, root: HTMLElement, sheet: DOMRect, s: number) {
  const title = root.querySelector('.shop-title')
  if (!title) return
  const r = title.getBoundingClientRect()
  const p = screenToWorld(sheet, s, r.left + r.width / 2, r.top + r.height / 2)
  dxf.text('CHU', p.x, p.y, 28, (title.textContent || '').replace(/\s+/g, ' ').trim(), 'center')
}

function addNotes(dxf: Dxf, root: HTMLElement, sheet: DOMRect, s: number) {
  const notes = root.querySelectorAll('.qty-notes li, .schedule-meta, .schedule h2')
  for (const el of notes) {
    const r = el.getBoundingClientRect()
    const p = screenToWorld(sheet, s, r.left, r.top + r.height / 2)
    const t = (el.textContent || '').replace(/\s+/g, ' ').trim()
    dxf.text('CHU', p.x, p.y, Math.max(10, (r.height * 0.7) / s), t, 'left')
  }
}

function sheetFrame(dxf: Dxf, sheet: DOMRect, s: number) {
  const w = sheet.width / s
  const h = sheet.height / s
  dxf.polyline('KHUNG', [
    { x: 0, y: 0 },
    { x: w, y: 0 },
    { x: w, y: h },
    { x: 0, y: h },
  ], true)
}

export function buildShopDxf(root: HTMLElement): string {
  const sAttr = root.querySelector('svg.cad')?.getAttribute('data-cad-scale')
  const s = Number(sAttr)
  const scale = Number.isFinite(s) && s > 0.01 ? s : 0.22
  const sheet = root.getBoundingClientRect()
  const dxf = new Dxf()
  sheetFrame(dxf, sheet, scale)
  addTitle(dxf, root, sheet, scale)
  for (const svg of root.querySelectorAll('svg.cad')) {
    addSvgTree(dxf, svg as SVGSVGElement, sheet, scale)
  }
  for (const table of root.querySelectorAll('.schedule table')) {
    addHtmlTable(dxf, table as HTMLTableElement, sheet, scale)
  }
  addNotes(dxf, root, sheet, scale)
  return dxf.serialize()
}

export function exportShopDxf(root: HTMLElement, filename: string): void {
  const inner = root.closest('.cad-space-inner') as HTMLElement | null
  const prev = inner?.style.transform
  if (inner) inner.style.transform = 'none'
  try {
    const content = buildShopDxf(root)
    const blob = new Blob([content], { type: 'application/dxf;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.rel = 'noopener'
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
  } finally {
    if (inner && prev != null) inner.style.transform = prev
  }
}

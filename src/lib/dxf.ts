import { htmlBlockLines, wrapTextByWidth } from './dxf-layout'
import { encodeDxfString } from './dxf-text'
import { parseSvgPath } from './svg-path'

const LAYERS = ['KHUNG', 'BE_TONG', 'THEP', 'KICH_THUOC', 'TRUC', 'CHU', 'BANG'] as const
type Layer = (typeof LAYERS)[number]

function f(n: number): string {
  if (!Number.isFinite(n)) return '0'
  return (Math.round(n * 1000) / 1000).toString()
}

class Dxf {
  private body: string[] = []
  private xmin = Infinity
  private ymin = Infinity
  private xmax = -Infinity
  private ymax = -Infinity

  pair(code: number, value: string | number) {
    this.body.push(String(code), String(value))
  }

  private touch(x: number, y: number) {
    if (!Number.isFinite(x) || !Number.isFinite(y)) return
    this.xmin = Math.min(this.xmin, x)
    this.ymin = Math.min(this.ymin, y)
    this.xmax = Math.max(this.xmax, x)
    this.ymax = Math.max(this.ymax, y)
  }

  line(layer: Layer, x1: number, y1: number, x2: number, y2: number) {
    if (!Number.isFinite(x1 + y1 + x2 + y2)) return
    if (Math.hypot(x2 - x1, y2 - y1) < 0.05) return
    this.touch(x1, y1)
    this.touch(x2, y2)
    this.pair(0, 'LINE')
    this.pair(8, layer)
    this.pair(10, f(x1))
    this.pair(20, f(y1))
    this.pair(30, 0)
    this.pair(11, f(x2))
    this.pair(21, f(y2))
    this.pair(31, 0)
  }

  circle(layer: Layer, x: number, y: number, r: number) {
    if (!Number.isFinite(x + y + r) || r < 0.05) return
    this.touch(x - r, y - r)
    this.touch(x + r, y + r)
    this.pair(0, 'CIRCLE')
    this.pair(8, layer)
    this.pair(10, f(x))
    this.pair(20, f(y))
    this.pair(30, 0)
    this.pair(40, f(r))
  }

  polyline(layer: Layer, pts: { x: number; y: number }[], closed: boolean) {
    const clean = pts.filter((p) => Number.isFinite(p.x) && Number.isFinite(p.y))
    if (clean.length < 2) return
    for (const p of clean) this.touch(p.x, p.y)
    this.pair(0, 'POLYLINE')
    this.pair(8, layer)
    this.pair(66, 1)
    this.pair(10, 0)
    this.pair(20, 0)
    this.pair(30, 0)
    this.pair(70, closed ? 1 : 0)
    for (const p of clean) {
      this.pair(0, 'VERTEX')
      this.pair(8, layer)
      this.pair(10, f(p.x))
      this.pair(20, f(p.y))
      this.pair(30, 0)
    }
    this.pair(0, 'SEQEND')
    this.pair(8, layer)
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
    const t = encodeDxfString(value)
    if (!t || !Number.isFinite(x + y)) return
    const h = Math.max(1.2, height)
    this.touch(x, y)
    this.pair(0, 'TEXT')
    this.pair(8, layer)
    this.pair(7, 'STANDARD')
    this.pair(10, f(x))
    this.pair(20, f(y))
    this.pair(30, 0)
    this.pair(40, f(h))
    this.pair(1, t)
    this.pair(50, f(Number.isFinite(rotation) ? rotation : 0))
    const hz = align === 'center' ? 1 : align === 'right' ? 2 : 0
    if (hz) {
      this.pair(72, hz)
      this.pair(11, f(x))
      this.pair(21, f(y))
      this.pair(31, 0)
    }
  }

  serialize(): string {
    const o: string[] = []
    const p = (c: number, v: string | number) => {
      o.push(String(c), String(v))
    }
    const pad = 20
    const x0 = Number.isFinite(this.xmin) ? this.xmin - pad : 0
    const y0 = Number.isFinite(this.ymin) ? this.ymin - pad : 0
    const x1 = Number.isFinite(this.xmax) ? this.xmax + pad : 100
    const y1 = Number.isFinite(this.ymax) ? this.ymax + pad : 100
    p(0, 'SECTION')
    p(2, 'HEADER')
    p(9, '$ACADVER')
    p(1, 'AC1009')
    p(9, '$INSUNITS')
    p(70, 4)
    p(9, '$FILLMODE')
    p(70, 0)
    p(9, '$TEXTSIZE')
    p(40, 2.5)
    p(9, '$EXTMIN')
    p(10, f(x0))
    p(20, f(y0))
    p(30, 0)
    p(9, '$EXTMAX')
    p(10, f(x1))
    p(20, f(y1))
    p(30, 0)
    p(9, '$LIMMIN')
    p(10, f(x0))
    p(20, f(y0))
    p(9, '$LIMMAX')
    p(10, f(x1))
    p(20, f(y1))
    p(0, 'ENDSEC')
    p(0, 'SECTION')
    p(2, 'TABLES')
    p(0, 'TABLE')
    p(2, 'LTYPE')
    p(70, 1)
    p(0, 'LTYPE')
    p(2, 'CONTINUOUS')
    p(70, 0)
    p(3, 'Solid line')
    p(72, 65)
    p(73, 0)
    p(40, 0)
    p(0, 'ENDTAB')
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
    p(0, 'TABLE')
    p(2, 'STYLE')
    p(70, 1)
    p(0, 'STYLE')
    p(2, 'STANDARD')
    p(70, 0)
    p(40, 0)
    p(41, 1)
    p(50, 0)
    p(71, 0)
    p(42, 2.5)
    p(3, 'arial.ttf')
    p(4, '')
    p(0, 'ENDTAB')
    p(0, 'ENDSEC')
    p(0, 'SECTION')
    p(2, 'BLOCKS')
    p(0, 'ENDSEC')
    p(0, 'SECTION')
    p(2, 'ENTITIES')
    o.push(...this.body)
    p(0, 'ENDSEC')
    p(0, 'EOF')
    return o.join('\r\n') + '\r\n'
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

function ctmScale(svg: SVGSVGElement): number {
  const ctm = svg.getScreenCTM()
  if (!ctm) return 1
  const n = Math.hypot(ctm.a, ctm.b)
  return Number.isFinite(n) && n > 0.01 ? n : 1
}

function mmFromPx(px: number, s: number): number {
  return Math.max(0.8, px / s)
}

function svgFontPx(el: SVGTextElement): number {
  const attr = Number(el.getAttribute('font-size') || el.getAttribute('fontSize') || '')
  if (Number.isFinite(attr) && attr > 0) return attr
  const cs = parseFloat(getComputedStyle(el).fontSize)
  return Number.isFinite(cs) && cs > 0 ? cs : 10
}

let measureCtx: CanvasRenderingContext2D | null = null

function canvasMeasure(): CanvasRenderingContext2D | null {
  if (measureCtx) return measureCtx
  const c = document.createElement('canvas').getContext('2d')
  measureCtx = c
  return c
}

function measurePx(text: string, fontPx: number, weight: string): number {
  const ctx = canvasMeasure()
  if (!ctx) return text.length * fontPx * 0.56
  ctx.font = `${weight} ${fontPx}px Arial, 'Segoe UI', sans-serif`
  return ctx.measureText(text).width
}

function fittedLines(text: string, fontPx: number, maxPx: number, weight: string): string[] {
  return wrapTextByWidth(text, Math.max(8, maxPx), (s) => measurePx(s, fontPx, weight))
}

function lineHeightPx(cs: CSSStyleDeclaration, fontPx: number): number {
  const raw = cs.lineHeight.trim()
  if (!raw || raw === 'normal') return fontPx * 1.25
  if (raw.endsWith('px')) {
    const px = parseFloat(raw)
    return Number.isFinite(px) && px > 0 ? px : fontPx * 1.25
  }
  const n = parseFloat(raw)
  if (!Number.isFinite(n) || n <= 0) return fontPx * 1.25
  if (n < 8) return n * fontPx
  return n
}

function addHtmlBlock(
  dxf: Dxf,
  el: Element,
  sheet: DOMRect,
  s: number,
  layer: Layer,
  align: 'left' | 'center' | 'right',
) {
  const r = el.getBoundingClientRect()
  if (r.width < 2 || r.height < 2) return
  const cs = getComputedStyle(el)
  const fontPx = parseFloat(cs.fontSize) || 10
  const weight = cs.fontWeight || '400'
  const padL = parseFloat(cs.paddingLeft) || 0
  const padR = parseFloat(cs.paddingRight) || 0
  const padT = parseFloat(cs.paddingTop) || 0
  const maxPx = Math.max(8, r.width - padL - padR)
  const linePx = lineHeightPx(cs, fontPx)
  const h = mmFromPx(fontPx, s)
  const blocks = htmlBlockLines(el)
  if (!blocks.length) return
  const lines = blocks.flatMap((b) => fittedLines(b, fontPx, maxPx, weight))
  if (!lines.length) return
  const total = lines.length * linePx
  const top = r.top + padT + Math.max(0, (r.height - padT - (parseFloat(cs.paddingBottom) || 0) - total) / 2)
  const xPx =
    align === 'center' ? r.left + r.width / 2 : align === 'right' ? r.right - padR : r.left + padL
  for (let i = 0; i < lines.length; i++) {
    const baseline = top + i * linePx + fontPx * 0.82
    const p = screenToWorld(sheet, s, xPx, baseline)
    dxf.text(layer, p.x, p.y, h, lines[i], align)
  }
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
    const a = world(x, y)
    const b = world(x + w, y)
    const c = world(x + w, y + h)
    const d = world(x, y + h)
    const layer = layerOf(el, 'line')
    dxf.line(layer, a.x, a.y, b.x, b.y)
    dxf.line(layer, b.x, b.y, c.x, c.y)
    dxf.line(layer, c.x, c.y, d.x, d.y)
    dxf.line(layer, d.x, d.y, a.x, a.y)
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
  const scale = ctmScale(svg)
  for (const el of texts) {
    const raw = (el.textContent || '').replace(/\s+/g, ' ').trim()
    if (!raw) continue
    const x = el.x.baseVal.length ? el.x.baseVal.getItem(0).value : 0
    const y = el.y.baseVal.length ? el.y.baseVal.getItem(0).value : 0
    const fs = svgFontPx(el)
    const anchor = el.getAttribute('text-anchor') || 'start'
    const rot = rotateAttr(el)
    const p = world(x, y)
    const h = mmFromPx(fs * scale, s)
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
    if (cell.querySelector('svg')) continue
    addHtmlBlock(dxf, cell, sheet, s, 'BANG', 'center')
  }
  for (const svg of table.querySelectorAll('svg')) {
    addSvgTree(dxf, svg as SVGSVGElement, sheet, s)
  }
}

function addTitle(dxf: Dxf, root: HTMLElement, sheet: DOMRect, s: number) {
  const spans = root.querySelectorAll('.shop-title span')
  const els = spans.length ? spans : root.querySelectorAll('.shop-title')
  for (const el of els) {
    addHtmlBlock(dxf, el, sheet, s, 'CHU', 'center')
  }
}

function addNotes(dxf: Dxf, root: HTMLElement, sheet: DOMRect, s: number) {
  for (const el of root.querySelectorAll('.schedule h2')) {
    addHtmlBlock(dxf, el, sheet, s, 'CHU', 'center')
  }
  for (const el of root.querySelectorAll('.schedule-meta')) {
    addHtmlBlock(dxf, el, sheet, s, 'CHU', 'left')
  }
  for (const el of root.querySelectorAll('.qty-notes li')) {
    addHtmlBlock(dxf, el, sheet, s, 'CHU', 'left')
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
    const file = new File([content], filename, { type: 'application/octet-stream' })
    const url = URL.createObjectURL(file)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.rel = 'noopener'
    document.body.appendChild(a)
    a.click()
    a.remove()
    window.setTimeout(() => URL.revokeObjectURL(url), 60_000)
  } finally {
    if (inner && prev != null) inner.style.transform = prev
  }
}

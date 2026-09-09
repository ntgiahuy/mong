import type { CalcResult, Inputs, RebarRow } from '../types'
import { t, type Lang } from '../i18n'
import { barHookSign, columnPerimeterPts, faceStations, meshStations, pedestalShoulders, staggerProjection } from '../lib/calc'
import { AxisBubble } from './AxisBubble'

type Props = {
  inp: Inputs
  result: CalcResult
  lang: Lang
}

const OX = 78
const RIGHT = 118
const CALLOUT_W = 220
const SHEET_W = 1782
/** Lean-concrete plan overhang each side (matches Xmong+0.2 / Ymong+0.2). */
const LOT_PLAN_MM = 100
/** Gap from footing bottom to view title — just below the overall X-dimension numbers. */
const SECTION_CAPTION_GAP = 68
const SECTION_CAPTION_PAD = 18
const SECTION_OY = 40
const AXIS_BUBBLE_R = 11

function fmtLevel(mm: number): string {
  const m = mm / 1000
  if (Math.abs(m) < 0.0005) return '± 0.00'
  const sign = m > 0 ? '+' : '−'
  return `${sign} ${Math.abs(m).toFixed(2)}`
}

function HDim({
  x1,
  x2,
  y,
  label,
  below = false,
}: {
  x1: number
  x2: number
  y: number
  label: string | number
  below?: boolean
}) {
  if (Math.abs(x2 - x1) < 3.5) return null
  const a = Math.min(x1, x2)
  const b = Math.max(x1, x2)
  const mid = (a + b) / 2
  const tick = 4
  return (
    <g className="dim">
      <line x1={a} y1={y} x2={b} y2={y} stroke="#111" />
      <line x1={a} y1={y - tick} x2={a} y2={y + tick} stroke="#111" />
      <line x1={b} y1={y - tick} x2={b} y2={y + tick} stroke="#111" />
      <text x={mid} y={below ? y + 12 : y - 3} textAnchor="middle" fontSize={10} fill="#111">
        {label}
      </text>
    </g>
  )
}

function VDim({
  x,
  y1,
  y2,
  label,
  left = false,
}: {
  x: number
  y1: number
  y2: number
  label: string | number
  left?: boolean
}) {
  if (Math.abs(y2 - y1) < 3.5) return null
  const a = Math.min(y1, y2)
  const b = Math.max(y1, y2)
  const mid = (a + b) / 2
  const tick = 4
  return (
    <g className="dim">
      <line x1={x} y1={a} x2={x} y2={b} stroke="#111" />
      <line x1={x - tick} y1={a} x2={x + tick} y2={a} stroke="#111" />
      <line x1={x - tick} y1={b} x2={x + tick} y2={b} stroke="#111" />
      <text x={left ? x - 6 : x + 6} y={mid + 3} fontSize={10} fill="#111" textAnchor={left ? 'end' : 'start'}>
        {label}
      </text>
    </g>
  )
}

function DrawingCaption({ x, y, title }: { x: number; y: number; title: string }) {
  const w = Math.max(96, title.length * 7.2)
  return (
    <g>
      <text x={x} y={y} textAnchor="middle" fontSize={13} fontWeight={800} fill="#111">
        {title}
      </text>
      <line
        x1={x - w / 2}
        x2={x + w / 2}
        y1={y + 4}
        y2={y + 4}
        stroke="#111"
        strokeWidth={1.2}
      />
    </g>
  )
}

function Tag({ n, x, y }: { n: number; x: number; y: number }) {
  return (
    <g>
      <circle cx={x} cy={y} r={7.5} fill="#fff" stroke="#111" strokeWidth={1.1} />
      <text x={x} y={y + 3.5} textAnchor="middle" fontSize={10} fontWeight={700} fill="#111">
        {n}
      </text>
    </g>
  )
}

type Seg = { x1: number; y1: number; x2: number; y2: number }

function hSeg(x1: number, x2: number, y: number): Seg {
  return { x1, y1: y, x2, y2: y }
}

function vSeg(x: number, y1: number, y2: number): Seg {
  return { x1: x, y1, x2: x, y2 }
}

function rectSegs(x: number, y: number, w: number, h: number): Seg[] {
  return [hSeg(x, x + w, y), hSeg(x, x + w, y + h), vSeg(x, y, y + h), vSeg(x + w, y, y + h)]
}

function pointSegDist(px: number, py: number, s: Seg): number {
  const dx = s.x2 - s.x1
  const dy = s.y2 - s.y1
  const l2 = dx * dx + dy * dy
  if (l2 < 1e-8) return Math.hypot(px - s.x1, py - s.y1)
  const t = Math.max(0, Math.min(1, ((px - s.x1) * dx + (py - s.y1) * dy) / l2))
  return Math.hypot(px - (s.x1 + t * dx), py - (s.y1 + t * dy))
}

/** True if the thin leader runs along / across another stroke, away from the landing. */
function leaderHits(seg: Seg, obstacles: Seg[], land: { x: number; y: number }, ignoreR = 12): boolean {
  const samples = 14
  for (let i = 0; i <= samples; i++) {
    const t = i / samples
    const px = seg.x1 + (seg.x2 - seg.x1) * t
    const py = seg.y1 + (seg.y2 - seg.y1) * t
    if (Math.hypot(px - land.x, py - land.y) <= ignoreR) continue
    for (const o of obstacles) {
      if (pointSegDist(px, py, o) < 1.2) return true
    }
  }
  return false
}

function labelWidth(label: string | undefined): number {
  if (!label) return 0
  return Math.max(32, label.length * 5.7)
}

function placeLeader(
  preferredX: number,
  preferredY: number,
  toX: number,
  toY: number,
  obstacles: Seg[],
  label?: string,
  avoidYs: number[] = [],
): { x: number; y: number; kind: 'h' | 'L' } {
  const MIN_H = Math.max(56, labelWidth(label) + 28)
  const land = { x: toX, y: toY }
  let tagX = preferredX
  if (Math.abs(toX - tagX) < MIN_H) {
    tagX = preferredX <= toX ? toX - MIN_H : toX + MIN_H
  }
  const onBase = avoidYs.some((ay) => Math.abs(toY - ay) < 10)
  const hTry = hSeg(tagX, toX, toY)
  if (!onBase && !leaderHits(hTry, obstacles, land)) {
    return { x: tagX, y: toY, kind: 'h' }
  }
  let tagY = preferredY
  for (const ay of avoidYs) {
    if (Math.abs(tagY - ay) < 12) tagY = ay - 16
  }
  if (onBase) tagY = Math.min(tagY, toY - 20)
  if (Math.abs(tagY - toY) < 14) tagY = toY - 22
  return { x: tagX, y: tagY, kind: 'L' }
}

/**
 * Horizontal leader when the run is clear; lying-L (H then V) when a thin
 * stroke would overlap other drawing lines.
 */
function LeaderTag({
  n,
  x,
  y,
  toX,
  toY,
  label,
  obstacles = [],
  avoidYs = [],
}: {
  n: number
  x: number
  y: number
  toX: number
  toY: number
  label?: string
  labelAlign?: 'left' | 'right'
  obstacles?: Seg[]
  avoidYs?: number[]
}) {
  const placed = placeLeader(x, y, toX, toY, obstacles, label, avoidYs)
  const tx = placed.x
  const ty = placed.y
  const r = 7.5
  const tick = 5.6
  const dir = Math.sign(toX - tx) || 1
  const startX = tx + dir * r
  const lastVert = placed.kind === 'L'
  return (
    <g>
      {placed.kind === 'h' ? (
        <line x1={startX} y1={ty} x2={toX} y2={toY} stroke="#111" strokeWidth={0.65} />
      ) : (
        <path
          d={`M ${startX} ${ty} H ${toX} V ${toY}`}
          fill="none"
          stroke="#111"
          strokeWidth={0.65}
        />
      )}
      <line
        x1={lastVert ? toX - tick : toX}
        y1={lastVert ? toY : toY - tick}
        x2={lastVert ? toX + tick : toX}
        y2={lastVert ? toY : toY + tick}
        stroke="#111"
        strokeWidth={1.15}
      />
      <Tag n={n} x={tx} y={ty} />
      {label ? (
        <text
          x={tx + dir * (r + 3)}
          y={ty - 3.2}
          textAnchor={dir >= 0 ? 'start' : 'end'}
          fontSize={10}
          fontWeight={700}
          fill="#111"
          stroke="#f3f3f3"
          strokeWidth={2.4}
          paintOrder="stroke"
          strokeLinejoin="round"
        >
          {label}
        </text>
      ) : null}
    </g>
  )
}

function Level({ x, y, text }: { x: number; y: number; text: string }) {
  const mid = x + 14
  return (
    <g>
      <line x1={x} y1={y} x2={x + 38} y2={y} stroke="#111" strokeWidth={1.05} />
      <polygon points={`${mid},${y} ${mid - 6.2},${y - 11} ${mid + 6.2},${y - 11}`} fill="#111" />
      <text x={x + 42} y={y - 3} fontSize={11} fontWeight={700} fill="#111">
        {text}
      </text>
    </g>
  )
}

function EarthGround({ x1, x2, y }: { x1: number; x2: number; y: number }) {
  const span = x2 - x1
  if (span < 16) return null
  const marks: number[] = []
  for (let x = x1 + 8; x < x2 - 16; x += 26) marks.push(x)
  return (
    <g>
      <line x1={x1} y1={y} x2={x2} y2={y} stroke="#111" strokeWidth={1.15} />
      {marks.map((x) => (
        <g key={x}>
          <line x1={x} y1={y + 1} x2={x + 7} y2={y + 9} stroke="#111" strokeWidth={0.95} />
          <line x1={x + 3.5} y1={y + 1} x2={x + 10.5} y2={y + 9} stroke="#111" strokeWidth={0.95} />
          <line x1={x + 7} y1={y + 1} x2={x + 14} y2={y + 9} stroke="#111" strokeWidth={0.95} />
        </g>
      ))}
    </g>
  )
}

function BeamStub({
  xCol,
  xEnd,
  yTop,
  h,
  side,
}: {
  xCol: number
  xEnd: number
  yTop: number
  h: number
  side: 'left' | 'right'
}) {
  if (Math.abs(xEnd - xCol) < 12 || h < 6) return null
  const yBot = yTop + h
  const zig = 7
  const outward = side === 'left' ? -1 : 1
  const fill = `M ${xCol} ${yTop} H ${xEnd} L ${xEnd + outward * zig} ${yTop + h * 0.28} L ${xEnd - outward * zig} ${yTop + h * 0.52} L ${xEnd + outward * zig} ${yTop + h * 0.76} L ${xEnd} ${yBot} H ${xCol} Z`
  const edge = `M ${xCol} ${yTop} H ${xEnd} L ${xEnd + outward * zig} ${yTop + h * 0.28} L ${xEnd - outward * zig} ${yTop + h * 0.52} L ${xEnd + outward * zig} ${yTop + h * 0.76} L ${xEnd} ${yBot} H ${xCol}`
  return (
    <g>
      <path d={fill} fill="#e8e8e8" stroke="none" />
      <path d={edge} fill="none" stroke="#111" strokeWidth={1.25} strokeLinejoin="miter" />
    </g>
  )
}

function roundedRectPath(x: number, y: number, w: number, h: number, r: number): string {
  const rr = Math.min(r, w / 2, h / 2)
  const k = 0.5522847498 * rr
  const x1 = x + rr
  const x2 = x + w - rr
  const y1 = y + rr
  const y2 = y + h - rr
  const xr = x + w
  const yb = y + h
  return [
    `M ${x1} ${y}`,
    `H ${x2}`,
    `C ${x2 + k} ${y} ${xr} ${y1 - k} ${xr} ${y1}`,
    `V ${y2}`,
    `C ${xr} ${y2 + k} ${x2 + k} ${yb} ${x2} ${yb}`,
    `H ${x1}`,
    `C ${x1 - k} ${yb} ${x} ${y2 + k} ${x} ${y2}`,
    `V ${y1}`,
    `C ${x} ${y1 - k} ${x1 - k} ${y} ${x1} ${y}`,
    'Z',
  ].join(' ')
}

function StirrupHoop({
  x,
  y,
  w,
  h,
  strokeWidth = 1.8,
  radius,
}: {
  x: number
  y: number
  w: number
  h: number
  strokeWidth?: number
  radius?: number
}) {
  const r = Math.min(radius ?? Math.min(4, w * 0.1, h * 0.1), w / 2, h / 2)
  const hook = Math.min(12, Math.max(8, Math.min(w, h) * 0.24))
  const hx = x + w - r * 0.2
  const hy = y + r * 0.2
  return (
    <g fill="none" stroke="#111" strokeWidth={strokeWidth} strokeLinejoin="round" strokeLinecap="square">
      <path d={roundedRectPath(x, y, w, h, r)} />
      <line x1={hx} y1={hy} x2={hx - hook * 0.72} y2={hy + hook * 0.72} />
    </g>
  )
}

function BarShape({ row }: { row: RebarRow }) {
  if (row.shape === 'straight') {
    const L = row.segs[0] ?? row.length
    return (
      <svg width={132} height={40} viewBox="0 0 132 40">
        <line x1={10} y1={24} x2={122} y2={24} stroke="#111" strokeWidth={1.7} />
        <text x={66} y={16} textAnchor="middle" fontSize={9}>
          {L}
        </text>
      </svg>
    )
  }
  if (row.shape === 'u') {
    const [legL, mid, legR = legL] = row.segs
    return (
      <svg width={132} height={42} viewBox="0 0 132 42">
        <path d="M16 8 V32 H116 V8" fill="none" stroke="#111" strokeWidth={1.7} />
        <text x={66} y={41} textAnchor="middle" fontSize={9}>
          {mid}
        </text>
        <text x={2} y={24} fontSize={9}>
          {legL}
        </text>
        <text x={118} y={24} fontSize={9}>
          {legR}
        </text>
      </svg>
    )
  }
  if (row.shape === 'L') {
    const [hook, straight] = row.segs
    return (
      <svg width={148} height={46} viewBox="0 0 148 46">
        <path d="M22 10 V38 M22 10 H140" fill="none" stroke="#111" strokeWidth={1.8} strokeLinecap="square" />
        <text x={2} y={30} fontSize={9}>
          {hook}
        </text>
        <text x={82} y={8} textAnchor="middle" fontSize={9}>
          {straight}
        </text>
      </svg>
    )
  }
  const [a, b, hook] = row.segs
  return (
    <svg width={148} height={50} viewBox="0 0 148 50">
      <StirrupHoop x={30} y={12} w={80} h={30} strokeWidth={1.7} radius={8} />
      <text x={70} y={31} textAnchor="middle" fontSize={9}>
        {a}
      </text>
      <text x={26} y={31} textAnchor="end" fontSize={9}>
        {b}
      </text>
      <text x={114} y={16} fontSize={9}>
        {hook}
      </text>
    </svg>
  )
}

function sheetScale(inp: Inputs): number {
  const totalH = inp.hCom + inp.hCm + inp.hDm + inp.lining + (inp.fType === 'sand' ? 80 : 0)
  const availW = SHEET_W - CALLOUT_W - 36 - (OX + RIGHT) * 2
  const sW = availW / Math.max(inp.xMong + inp.yMong, 1)
  const stackExtra = 330
  const staggerHead = staggerProjection(inp).two
  const sH = (1080 - stackExtra) / Math.max(totalH + inp.yMong + staggerHead, 1)
  return Math.min(sW, sH, 0.22)
}

function sectionSize(inp: Inputs, axis: 'x' | 'y', s: number) {
  const widthMm = axis === 'x' ? inp.xMong : inp.yMong
  const totalH = inp.hCom + inp.hCm + inp.hDm
  const sandH = inp.fType === 'sand' ? 18 : 0
  const bw = widthMm * s
  const W = OX + bw + RIGHT
  const oy = SECTION_OY + staggerProjection(inp).two * s
  const y4 = oy + (totalH + inp.lining) * s
  const captionY = y4 + sandH + SECTION_CAPTION_GAP
  const H = captionY + SECTION_CAPTION_PAD
  return { W, H, bw, oy }
}

function Callouts({
  inp,
  result,
  s,
  height,
}: {
  inp: Inputs
  result: CalcResult
  s: number
  height: number
}) {
  const colBars = result.bars.filter((b) => b.shape === 'L')
  const stirrup = result.bars.find((b) => b.shape === 'stirrup')
  const W = CALLOUT_W
  const hoopW = 30
  const hoopH = 44
  const n = colBars.length
  const y0 = SECTION_OY + staggerProjection(inp).two * s
  const yHook = y0 + (inp.hCom + inp.hCm + inp.hDm - 100) * s
  const hook = Math.min(32, Math.max(16, result.colHook * s * 0.5))
  const laid = colBars.map((b, i) => {
    const stem = Math.max(8, (b.segs[1] ?? inp.hCom + inp.hCm + inp.hDm - 100) * s)
    const x = n === 1 ? 70 : i === 0 ? 48 : 122
    const hookLeft = i === 0
    return { b, stem, x, hookLeft }
  })
  const last = laid[laid.length - 1]
  const stirX = last ? Math.min(last.x + (last.hookLeft ? 22 : hook + 6), W - hoopW - 8) : 96
  const stirY = yHook - hoopH - 4
  const specTagX = Math.min(stirX + 6, W - 118)
  const labelY = yHook + 30
  const H = Math.max(height, labelY + 16)

  return (
    <svg className="cad" data-cad-scale={s} viewBox={`0 0 ${W} ${H}`} width={W} height={H} preserveAspectRatio="xMinYMin meet">
      {laid.map(({ b, stem, x, hookLeft }) => {
        const ya = yHook - stem
        const yb = yHook
        const mid = (ya + yb) / 2
        const hookX = hookLeft ? x - hook : x + hook
        const specX = hookLeft ? x + 14 : x - 14
        const tagX = hookLeft ? x - 16 : x + 16
        const tagY = ya + 12
        return (
          <g key={b.mark}>
            <path
              d={`M ${x} ${ya} V ${yb} H ${hookX}`}
              fill="none"
              stroke="#111"
              strokeWidth={2}
              strokeLinecap="square"
            />
            <Tag n={b.mark} x={tagX} y={tagY} />
            <text
              x={specX}
              y={mid}
              fontSize={11}
              fontWeight={700}
              transform={`rotate(-90, ${specX}, ${mid})`}
              textAnchor="middle"
            >
              {b.n1}Ø{b.d}-L={b.length}
            </text>
            <text x={(x + hookX) / 2} y={yb + 12} textAnchor="middle" fontSize={9}>
              {b.segs[0]}
            </text>
          </g>
        )
      })}
      {stirrup && last && (
        <g>
          <line
            x1={last.hookLeft ? last.x : last.x + hook}
            y1={yHook}
            x2={stirX}
            y2={stirY + hoopH * 0.62}
            stroke="#111"
            strokeWidth={0.85}
          />
          <StirrupHoop x={stirX} y={stirY} w={hoopW} h={hoopH} strokeWidth={1.8} />
          <Tag n={stirrup.mark} x={specTagX} y={yHook + 26} />
          <text x={specTagX + 12} y={yHook + 30} fontSize={10} fontWeight={700}>
            {stirrup.n1}Ø{stirrup.d}-L={stirrup.length}
          </text>
        </g>
      )}
    </svg>
  )
}

function SectionDrawing({
  axis,
  inp,
  result,
  title,
  s,
}: {
  axis: 'x' | 'y'
  inp: Inputs
  result: CalcResult
  title: string
  s: number
}) {
  const widthMm = axis === 'x' ? inp.xMong : inp.yMong
  const colMm = axis === 'x' ? inp.xCo : inp.yCo
  const leftMm = axis === 'x' ? inp.x1 : inp.y1
  const nFace = Math.max(2, axis === 'x' ? inp.cx : inp.cy)
  const aDot = axis === 'x' ? inp.aFaY : inp.aFaX
  const dDot = axis === 'x' ? inp.dFaY : inp.dFaX
  const dLine = axis === 'x' ? inp.dFaX : inp.dFaY
  const aLine = axis === 'x' ? inp.aFaX : inp.aFaY
  const lineIsBottom = axis === 'x' ? inp.bottomLayerX : !inp.bottomLayerX
  const meshX = result.bars.find((b) => b.label.includes('FaX'))
  const meshY = result.bars.find((b) => b.label.includes('FaY'))
  const markLong = (axis === 'x' ? meshX : meshY)?.mark ?? (axis === 'x' ? 1 : 2)
  const markTrans = (axis === 'x' ? meshY : meshX)?.mark ?? (axis === 'x' ? 2 : 1)
  const stirMark = result.bars.find((b) => b.shape === 'stirrup')?.mark ?? 4

  const totalH = inp.hCom + inp.hCm + inp.hDm
  const ox = OX
  const { W, H, oy } = sectionSize(inp, axis, s)
  const bw = widthMm * s
  const cw = colMm * s
  const left = leftMm * s
  const lot = inp.lining * s
  const hs = { com: inp.hCom * s, cm: inp.hCm * s, dm: inp.hDm * s }
  const y0 = oy
  const y1 = y0 + hs.com
  const y2 = y1 + hs.cm
  const y3 = y2 + hs.dm
  const y4 = y3 + lot
  const colX = ox + left
  const shSides = pedestalShoulders(inp)
  const shL = (axis === 'x' ? shSides.left : shSides.top) * s
  const shR = (axis === 'x' ? shSides.right : shSides.bottom) * s
  const topL = colX - shL
  const topR = colX + cw + shR
  const sandH = inp.fType === 'sand' ? 18 : 0
  const cover = inp.coverBase * s
  const colCover = inp.coverCol * s
  const yHook = y3 - 100 * s
  const barW = Math.max(1.8, inp.dMain / 8)
  const lineW = Math.max(1.4, dLine / 10)
  const dotR = Math.max(2.0, dDot / 5)
  const hookPx = Math.min(32, Math.max(14, result.colHook * s))
  const proj = staggerProjection(inp)
  const axisMm = axis === 'x' ? inp.xCc : inp.yCc
  const axisName = axis === 'x' ? inp.axisXName : inp.axisYName
  const gridX = ox + axisMm * s

  const faceXs = faceStations(nFace, colMm, inp.coverCol).map((mm) => colX + mm * s)
  const transXs = meshStations(widthMm, inp.coverBase, aDot).map((mm) => ox + mm * s)

  const yLong = lineIsBottom ? y3 - cover : y3 - cover - dotR * 2 - 4
  const yTrans = lineIsBottom ? y3 - cover - lineW - dotR - 3 : y3 - cover
  const yTrans2 = yTrans + (lineIsBottom ? -(dotR * 2 + 3) : dotR * 2 + 3)
  const yMainLab = y0 + Math.max(28, hs.com * 0.38)
  const yStirLab = y0 + Math.max(12, hs.com * 0.14)
  const captionY = y4 + sandH + SECTION_CAPTION_GAP
  const yAtElev = (elevMm: number) => y0 - (elevMm - inp.cdn) * s
  const yBeam = yAtElev(inp.cdg)
  const yGround = yAtElev(inp.cdtn)
  const beamH = Math.max(8, inp.hBeam * s)
  const showBeam = inp.hasBeam && inp.hBeam > 0
  const lx = ox + bw + 10
  const beamLeftEnd = ox + 16
  const beamRightEnd = ox + bw - 16
  const stirYs = Array.from({ length: result.nStirrup }, (_, i) => y0 + (inp.coverCol + i * inp.aStirrup) * s).filter(
    (y) => y <= y1 - 3,
  )
  const stirYLand = stirYs[0] ?? yStirLab
  const mainLandX = faceXs[faceXs.length - 1] ?? colX + cw - colCover
  const longLandX = Math.min(colX - 8, ox + cover + Math.max(18, bw * 0.18))
  const transLandX =
    transXs.find((x) => x > colX + cw + 6) ??
    transXs[Math.floor(transXs.length * 0.72)] ??
    ox + bw * 0.78
  const meshArmY = y2 - 16
  const tagRight = Math.min(ox + bw + 62, Math.max(colX + cw + 78, ox + bw * 0.72 + 40))
  const avoidBaseYs = [y1, y2, y3]
  const sectionObstacles: Seg[] = [
    hSeg(ox, ox + bw, y2),
    hSeg(ox, ox + bw, y3),
    hSeg(ox + cover, ox + bw - cover, yLong),
    vSeg(colX, y0, y1),
    vSeg(colX + cw, y0, y1),
    hSeg(colX, colX + cw, y0),
    vSeg(gridX, y0 - 2, y4 + sandH + 8),
    ...faceXs.map((x) => vSeg(x, y0 - proj.two * s, yHook)),
    ...stirYs.map((y) => hSeg(colX + colCover, colX + cw - colCover, y)),
    hSeg(ox + cover, ox + bw - cover, yTrans),
  ]

  return (
    <svg className="cad" data-cad-scale={s} viewBox={`0 0 ${W} ${H}`} width={W} height={H} preserveAspectRatio="xMinYMin meet">
      <line
        x1={gridX}
        x2={gridX}
        y1={y0 - 2}
        y2={y4 + sandH + 8}
        stroke="#111"
        strokeWidth={0.8}
        strokeDasharray="10 4 2 4"
      />
      <AxisBubble cx={gridX} cy={AXIS_BUBBLE_R + 4} r={AXIS_BUBBLE_R} name={axisName || (axis === 'x' ? '1' : 'A')} />
      <polygon
        points={`${ox},${y2} ${ox + bw},${y2} ${topR},${y1} ${colX + cw},${y1} ${colX},${y1} ${topL},${y1}`}
        fill="#dedede"
        stroke="#111"
        strokeWidth={1.4}
      />
      <rect x={ox} y={y2} width={bw} height={hs.dm} fill="#d8d8d8" stroke="#111" strokeWidth={1.4} />
      <rect x={ox - LOT_PLAN_MM * s} y={y3} width={bw + LOT_PLAN_MM * s * 2} height={lot} fill="#c4c4c4" stroke="#111" />
      {showBeam && (
        <g>
          <BeamStub xCol={colX} xEnd={beamLeftEnd} yTop={yBeam} h={beamH} side="left" />
          <BeamStub xCol={colX + cw} xEnd={beamRightEnd} yTop={yBeam} h={beamH} side="right" />
        </g>
      )}
      <EarthGround x1={ox - 16} x2={colX - 1} y={yGround} />
      <EarthGround x1={colX + cw + 1} x2={ox + bw + 16} y={yGround} />
      <rect x={colX} y={y0} width={cw} height={hs.com} fill="#e9e9e9" stroke="#111" strokeWidth={1.4} />
      {inp.fType === 'sand' && (
        <rect x={ox - 10} y={y4} width={bw + 20} height={sandH} fill="#e6d7a8" stroke="#111" />
      )}
      {inp.fType === 'tram' &&
        Array.from({ length: 5 }).map((_, i) => (
          <line
            key={i}
            x1={ox + 20 + i * ((bw - 40) / 4)}
            y1={y4 + sandH}
            x2={ox + 20 + i * ((bw - 40) / 4)}
            y2={y4 + sandH + 22}
            stroke="#111"
            strokeWidth={3}
          />
        ))}

      {faceXs.map((x, i) => {
        const dir = barHookSign(x, colX + cw / 2, ox, ox + bw, hookPx)
        const room = dir < 0 ? x - ox : ox + bw - x
        const hook = Math.max(8, Math.min(hookPx, room - 2))
        const extra = x < colX + cw / 2 ? proj.one : proj.two
        const yTop = y0 - extra * s
        return (
          <path
            key={`v${i}`}
            d={`M ${x} ${yTop} L ${x} ${yHook} L ${x + dir * hook} ${yHook}`}
            fill="none"
            stroke="#111"
            strokeWidth={barW}
            strokeLinejoin="miter"
            strokeLinecap="square"
          />
        )
      })}
      {inp.stagger && proj.one > 0 && (
        <>
          <VDim x={colX - 10} y1={y0 - proj.one * s} y2={y0} label={proj.manual ? Math.round(proj.one) : `${proj.lap}D`} left />
          <VDim x={colX + cw + 10} y1={y0 - proj.two * s} y2={y0} label={proj.manual ? Math.round(proj.two) : `${Math.round(proj.two / Math.max(inp.dMain, 1))}D`} />
        </>
      )}

      {Array.from({ length: result.nStirrup }).map((_, i) => {
        const y = y0 + (inp.coverCol + i * inp.aStirrup) * s
        if (y > y1 - 3) return null
        return (
          <line
            key={`st${i}`}
            x1={colX + colCover}
            y1={y}
            x2={colX + cw - colCover}
            y2={y}
            stroke="#111"
            strokeWidth={Math.max(1.1, inp.dStirrup / 6)}
          />
        )
      })}

      <line x1={ox + cover} y1={yLong} x2={ox + bw - cover} y2={yLong} stroke="#111" strokeWidth={lineW} />
      {inp.hooked && (
        <>
          {inp.hookLeft > 0 && (
            <path
              d={`M ${ox + cover} ${yLong} L ${ox + cover} ${yLong - Math.max(4, inp.hookLeft * s)}`}
              fill="none"
              stroke="#111"
              strokeWidth={lineW}
            />
          )}
          {inp.hookRight > 0 && (
            <path
              d={`M ${ox + bw - cover} ${yLong} L ${ox + bw - cover} ${yLong - Math.max(4, inp.hookRight * s)}`}
              fill="none"
              stroke="#111"
              strokeWidth={lineW}
            />
          )}
        </>
      )}
      {inp.doubleLayer && (
        <line
          x1={ox + cover}
          y1={yLong - lineW - 3}
          x2={ox + bw - cover}
          y2={yLong - lineW - 3}
          stroke="#111"
          strokeWidth={lineW}
        />
      )}
      {transXs.map((x, i) => (
        <circle key={`d${i}`} cx={x} cy={yTrans} r={dotR} fill="#111" />
      ))}
      {inp.doubleLayer &&
        transXs.map((x, i) => <circle key={`d2${i}`} cx={x} cy={yTrans2} r={dotR} fill="#111" />)}

      {result.bars
        .filter((b) => b.shape === 'L')
        .map((b, i) => (
          <LeaderTag
            key={`colmark${b.mark}`}
            n={b.mark}
            x={tagRight}
            y={yMainLab + i * 20}
            toX={i === 0 ? mainLandX : (faceXs[0] ?? colX + colCover)}
            toY={yMainLab + i * 20}
            label={b.label}
            obstacles={sectionObstacles}
            avoidYs={avoidBaseYs}
          />
        ))}
      <LeaderTag
        n={stirMark}
        x={tagRight}
        y={Math.min(yStirLab, y1 - 18)}
        toX={colX + cw - colCover}
        toY={stirYLand}
        label={`Ø${inp.dStirrup}a${inp.aStirrup}`}
        obstacles={sectionObstacles}
        avoidYs={avoidBaseYs}
      />
      <LeaderTag
        n={markLong}
        x={ox + 32}
        y={meshArmY}
        toX={longLandX}
        toY={yLong}
        label={`Ø${dLine}a${aLine}`}
        obstacles={sectionObstacles}
        avoidYs={avoidBaseYs}
      />
      <LeaderTag
        n={markTrans}
        x={ox + bw - 32}
        y={meshArmY}
        toX={transLandX}
        toY={yTrans}
        label={`Ø${dDot}a${aDot}`}
        obstacles={sectionObstacles}
        avoidYs={avoidBaseYs}
      />

      {leftMm >= inp.coverBase - 0.5 && (
        <HDim x1={ox} x2={ox + cover} y={y4 + sandH + 18} label={inp.coverBase} below />
      )}
      {leftMm - inp.coverBase - shL / s > 0.5 && (
        <HDim
          x1={ox + cover}
          x2={topL}
          y={y4 + sandH + 18}
          label={Math.round(leftMm - inp.coverBase - shL / s)}
          below
        />
      )}
      {shL / s > 0.5 && (
        <HDim x1={topL} x2={colX} y={y4 + sandH + 18} label={Math.round(shL / s)} below />
      )}
      <HDim x1={colX} x2={colX + cw} y={y4 + sandH + 18} label={colMm} below />
      {shR / s > 0.5 && (
        <HDim x1={colX + cw} x2={topR} y={y4 + sandH + 18} label={Math.round(shR / s)} below />
      )}
      {widthMm - leftMm - colMm - inp.coverBase - shR / s > 0.5 && (
        <HDim
          x1={topR}
          x2={ox + bw - cover}
          y={y4 + sandH + 18}
          label={Math.round(widthMm - leftMm - colMm - inp.coverBase - shR / s)}
          below
        />
      )}
      {widthMm - leftMm - colMm >= inp.coverBase - 0.5 && (
        <HDim x1={ox + bw - cover} x2={ox + bw} y={y4 + sandH + 18} label={inp.coverBase} below />
      )}
      <HDim x1={ox} x2={ox + bw} y={y4 + sandH + 36} label={widthMm} below />

      <VDim x={ox - 22} y1={y3} y2={y4} label={inp.lining} left />
      <VDim x={ox - 22} y1={y2} y2={y3} label={inp.hDm} left />
      <VDim x={ox - 22} y1={y1} y2={y2} label={inp.hCm} left />
      <VDim x={ox - 44} y1={y0} y2={y3} label={totalH} left />

      <Level x={lx} y={y0} text={fmtLevel(inp.cdn)} />
      {showBeam && Math.abs(inp.cdg - inp.cdn) > 5 && (
        <Level x={lx} y={yBeam} text={fmtLevel(inp.cdg)} />
      )}
      <Level x={lx} y={yGround} text={fmtLevel(inp.cdtn)} />
      <text
        x={(ox + colX) / 2}
        y={yGround + 20}
        textAnchor="middle"
        fontSize={8}
        fontWeight={600}
        fill="#111"
      >
        ĐẤT TỰ NHIÊN
      </text>
      <Level x={lx} y={y3} text={fmtLevel(inp.cdn + result.cdm)} />
      <text x={ox + 6} y={y4 - 3} fontSize={9} fontWeight={700} fill="#111">
        LỚP BÊ TÔNG LÓT MÓNG
      </text>
      <DrawingCaption x={ox + bw / 2} y={captionY} title={title} />
    </svg>
  )
}

function PlanDrawing({
  inp,
  result,
  title,
  s,
}: {
  inp: Inputs
  result: CalcResult
  title: string
  s: number
}) {
  const bar1 = result.bars.find((b) => b.mark === 1)
  const bar2 = result.bars.find((b) => b.mark === 2)
  const colBars = result.bars.filter((b) => b.shape === 'L')
  const stirBar = result.bars.find((b) => b.shape === 'stirrup')
  const stirMark = stirBar?.mark ?? 4
  const ox = OX
  const lot = LOT_PLAN_MM * s
  const axisHead = AXIS_BUBBLE_R * 2 + 14
  const oy = axisHead + 12 + lot
  const w = inp.xMong * s
  const h = inp.yMong * s
  const cx = ox + inp.x1 * s
  const cy = oy + inp.y1 * s
  const cw = inp.xCo * s
  const ch = inp.yCo * s
  const gridX = ox + inp.xCc * s
  const gridY = oy + inp.yCc * s
  const sh = pedestalShoulders(inp)
  const sx = cx - sh.left * s
  const sy = cy - sh.top * s
  const sw = cw + (sh.left + sh.right) * s
  const shh = ch + (sh.top + sh.bottom) * s
  const nx = meshStations(inp.xMong, inp.coverBase, inp.aFaY)
  const ny = meshStations(inp.yMong, inp.coverBase, inp.aFaX)
  const colDots = columnPerimeterPts(inp.cx, inp.cy, inp.xCo, inp.yCo, inp.coverCol)
  const cover = inp.coverBase * s
  const dimY = oy + h + lot + 22
  const bar1Y = dimY + 50
  const captionY = bar1Y + 40
  const extraRight = 110
  const xFaY = ox + (nx[0] ?? inp.coverBase) * s
  const xFaYRight = ox + (nx[nx.length - 1] ?? inp.xMong - inp.coverBase) * s
  const yFaX = oy + (ny[0] ?? inp.coverBase) * s
  const mark1IsFaX = inp.bottomLayerX
  const mesh1To = mark1IsFaX ? { x: ox + w * 0.22, y: yFaX } : { x: xFaY, y: oy + h * 0.2 }
  const mesh2To = mark1IsFaX ? { x: xFaYRight, y: oy + h * 0.18 } : { x: ox + w * 0.78, y: yFaX }
  const leftDots = colDots.filter((p) => p.x <= inp.xCo / 2)
  const rightDots = colDots.filter((p) => p.x > inp.xCo / 2)
  const hoopL = cx + inp.coverCol * s
  const hoopT = cy + inp.coverCol * s
  const hoopR = cx + cw - inp.coverCol * s
  const hoopB = cy + ch - inp.coverCol * s
  const planObstacles: Seg[] = [
    ...rectSegs(ox, oy, w, h),
    ...rectSegs(cx, cy, cw, ch),
    ...rectSegs(sx, sy, sw, shh),
    ...rectSegs(hoopL, hoopT, hoopR - hoopL, hoopB - hoopT),
    hSeg(ox - 10, ox + w + 10, cy + ch / 2),
    vSeg(cx + cw / 2, oy - 8, oy + h + 10),
    vSeg(gridX, axisHead, oy + h + lot + 6),
    hSeg(Math.max(AXIS_BUBBLE_R * 2 + 8, ox - lot - 8), ox + w + lot + 6, gridY),
    ...nx.map((mm) => vSeg(ox + mm * s, oy + cover, oy + h - cover)),
    ...ny.map((mm) => hSeg(ox + cover, ox + w - cover, oy + mm * s)),
  ]
  const W = ox + w + lot + RIGHT + extraRight
  const H = captionY + SECTION_CAPTION_PAD

  return (
    <svg className="cad" data-cad-scale={s} viewBox={`0 0 ${W} ${H}`} width={W} height={H} preserveAspectRatio="xMinYMin meet">
      <rect
        x={ox - lot}
        y={oy - lot}
        width={w + lot * 2}
        height={h + lot * 2}
        fill="#dedede"
        stroke="#111"
        strokeWidth={1.2}
        strokeDasharray="7 4"
      />
      <text x={ox + 8} y={oy + h + lot - 6} fontSize={11} fontWeight={700} fill="#111">
        BÊ TÔNG LÓT
      </text>
      <rect x={ox} y={oy} width={w} height={h} fill="#f3f3f3" stroke="#111" strokeWidth={1.5} />
      <rect x={sx} y={sy} width={sw} height={shh} fill="#ececec" stroke="#111" strokeWidth={1.2} />
      <rect x={cx} y={cy} width={cw} height={ch} fill="#e4e4e4" stroke="#111" strokeWidth={1.5} />
      <line x1={ox} y1={oy} x2={sx} y2={sy} stroke="#666" />
      <line x1={ox + w} y1={oy} x2={sx + sw} y2={sy} stroke="#666" />
      <line x1={ox} y1={oy + h} x2={sx} y2={sy + shh} stroke="#666" />
      <line x1={ox + w} y1={oy + h} x2={sx + sw} y2={sy + shh} stroke="#666" />

      {ny.map((mm, i) => {
        const y = oy + mm * s
        return (
          <line
            key={`y${i}`}
            x1={ox + cover}
            y1={y}
            x2={ox + w - cover}
            y2={y}
            stroke="#111"
            strokeWidth={Math.max(1.1, inp.dFaX / 12)}
          />
        )
      })}
      {nx.map((mm, i) => {
        const x = ox + mm * s
        return (
          <line
            key={`x${i}`}
            x1={x}
            y1={oy + cover}
            x2={x}
            y2={oy + h - cover}
            stroke="#333"
            strokeWidth={Math.max(0.8, inp.dFaY / 14)}
          />
        )
      })}

      <StirrupHoop
        x={cx + inp.coverCol * s}
        y={cy + inp.coverCol * s}
        w={cw - 2 * inp.coverCol * s}
        h={ch - 2 * inp.coverCol * s}
        strokeWidth={Math.max(1.4, inp.dStirrup / 5)}
      />
      {colDots.map((p, i) => (
        <circle
          key={`c${i}`}
          cx={cx + p.x * s}
          cy={cy + p.y * s}
          r={Math.max(2.4, inp.dMain / 8)}
          fill="#111"
        />
      ))}

      <line
        x1={ox - 10}
        y1={cy + ch / 2}
        x2={ox + w + 10}
        y2={cy + ch / 2}
        stroke="#111"
        strokeDasharray="8 4"
      />
      <text x={ox - 20} y={cy + ch / 2 - 4} fontSize={11} fontWeight={700}>
        A
      </text>
      <text x={ox + w + 14} y={cy + ch / 2 - 4} fontSize={11} fontWeight={700}>
        A
      </text>
      <line
        x1={cx + cw / 2}
        y1={oy - 8}
        x2={cx + cw / 2}
        y2={oy + h + 10}
        stroke="#111"
        strokeDasharray="8 4"
      />
      <text x={cx + cw / 2 + 4} y={oy - 10} fontSize={11} fontWeight={700}>
        B
      </text>
      <text x={cx + cw / 2 + 4} y={oy + h + 18} fontSize={11} fontWeight={700}>
        B
      </text>

      <line
        x1={gridX}
        y1={axisHead}
        x2={gridX}
        y2={oy + h + lot + 6}
        stroke="#111"
        strokeWidth={0.85}
        strokeDasharray="10 4 2 4"
      />
      <AxisBubble cx={gridX} cy={AXIS_BUBBLE_R + 5} r={AXIS_BUBBLE_R} name={inp.axisXName || '1'} />
      <line
        x1={Math.max(AXIS_BUBBLE_R * 2 + 8, ox - lot - 8)}
        y1={gridY}
        x2={ox + w + lot + 6}
        y2={gridY}
        stroke="#111"
        strokeWidth={0.85}
        strokeDasharray="10 4 2 4"
      />
      <AxisBubble
        cx={Math.max(AXIS_BUBBLE_R + 8, ox - lot - 20)}
        cy={gridY}
        r={AXIS_BUBBLE_R}
        name={inp.axisYName || 'A'}
      />

      <LeaderTag
        n={bar1?.mark ?? 1}
        x={ox + 22}
        y={oy - 6}
        toX={mesh1To.x}
        toY={mesh1To.y}
        label={`Ø${bar1?.d ?? (mark1IsFaX ? inp.dFaX : inp.dFaY)}a${mark1IsFaX ? inp.aFaX : inp.aFaY}`}
        obstacles={planObstacles}
      />
      <LeaderTag
        n={bar2?.mark ?? 2}
        x={ox + w - 22}
        y={oy - 6}
        toX={mesh2To.x}
        toY={mesh2To.y}
        label={`Ø${bar2?.d ?? (mark1IsFaX ? inp.dFaY : inp.dFaX)}a${mark1IsFaX ? inp.aFaY : inp.aFaX}`}
        labelAlign="left"
        obstacles={planObstacles}
      />
      {colBars.map((b, i) => {
        const pts = i === 0 ? leftDots : rightDots
        const pt = pts[Math.floor(pts.length / 2)] ?? colDots[i] ?? colDots[0]
        const land = pt ? { x: cx + pt.x * s, y: cy + pt.y * s } : { x: cx + cw / 2, y: cy + ch / 2 }
        const aaY = cy + ch / 2
        const tagY = i === 0 ? cy + Math.min(22, ch * 0.22) : cy + ch - Math.min(18, ch * 0.2)
        return (
          <LeaderTag
            key={`col-lead-${b.mark}`}
            n={b.mark}
            x={i === 0 ? cx - 58 : cx + cw + 58}
            y={Math.abs(tagY - aaY) < 10 ? tagY - 14 : tagY}
            toX={land.x}
            toY={land.y}
            label={b.label}
            obstacles={planObstacles}
            avoidYs={[cy, cy + ch, aaY, gridY, oy, oy + h]}
          />
        )
      })}
      <LeaderTag
        n={stirMark}
        x={Math.min(cx + cw + 62, ox + w + 8)}
        y={Math.min(cy + ch + 24, oy + h - 6)}
        toX={hoopR}
        toY={hoopB}
        label={`Ø${inp.dStirrup}a${inp.aStirrup}`}
        obstacles={planObstacles}
        avoidYs={[cy, cy + ch, oy, oy + h, gridY]}
      />

      <HDim x1={ox - lot} x2={ox} y={dimY} label={LOT_PLAN_MM} below />
      {inp.x1 >= inp.coverBase - 0.5 && (
        <HDim x1={ox} x2={ox + cover} y={dimY} label={inp.coverBase} below />
      )}
      {inp.x1 - inp.coverBase - sh.left > 0.5 && (
        <HDim
          x1={ox + cover}
          x2={sx}
          y={dimY}
          label={Math.round(inp.x1 - inp.coverBase - sh.left)}
          below
        />
      )}
      {sh.left > 0.5 && <HDim x1={sx} x2={cx} y={dimY} label={Math.round(sh.left)} below />}
      <HDim x1={cx} x2={cx + cw} y={dimY} label={inp.xCo} below />
      {sh.right > 0.5 && <HDim x1={cx + cw} x2={sx + sw} y={dimY} label={Math.round(sh.right)} below />}
      {result.x2 - inp.coverBase - sh.right > 0.5 && (
        <HDim
          x1={sx + sw}
          x2={ox + w - cover}
          y={dimY}
          label={Math.round(result.x2 - inp.coverBase - sh.right)}
          below
        />
      )}
      {result.x2 >= inp.coverBase - 0.5 && (
        <HDim x1={ox + w - cover} x2={ox + w} y={dimY} label={inp.coverBase} below />
      )}
      <HDim x1={ox} x2={ox + w} y={dimY + 16} label={inp.xMong} below />
      <HDim x1={ox + w} x2={ox + w + lot} y={dimY} label={LOT_PLAN_MM} below />

      <VDim x={ox - 22} y1={oy - lot} y2={oy} label={LOT_PLAN_MM} left />
      {inp.y1 - sh.top > 0.5 && (
        <VDim x={ox - 22} y1={oy} y2={sy} label={Math.round(inp.y1 - sh.top)} left />
      )}
      {sh.top > 0.5 && <VDim x={ox - 22} y1={sy} y2={cy} label={Math.round(sh.top)} left />}
      <VDim x={ox - 22} y1={cy} y2={cy + ch} label={inp.yCo} left />
      {sh.bottom > 0.5 && (
        <VDim x={ox - 22} y1={cy + ch} y2={sy + shh} label={Math.round(sh.bottom)} left />
      )}
      {result.y2 - sh.bottom > 0.5 && (
        <VDim
          x={ox - 22}
          y1={sy + shh}
          y2={oy + h}
          label={Math.round(result.y2 - sh.bottom)}
          left
        />
      )}
      <VDim x={ox - 44} y1={oy} y2={oy + h} label={inp.yMong} left />

      {bar1 && (
        <g>
          <line x1={ox} y1={bar1Y} x2={ox + w} y2={bar1Y} stroke="#111" strokeWidth={2.2} />
          {inp.hooked && (
            <>
              {inp.hookLeft > 0 && (
                <path
                  d={`M ${ox} ${bar1Y} V ${bar1Y - Math.max(6, Math.min(36, inp.hookLeft * s))}`}
                  fill="none"
                  stroke="#111"
                  strokeWidth={2.2}
                />
              )}
              {inp.hookRight > 0 && (
                <path
                  d={`M ${ox + w} ${bar1Y} V ${bar1Y - Math.max(6, Math.min(36, inp.hookRight * s))}`}
                  fill="none"
                  stroke="#111"
                  strokeWidth={2.2}
                />
              )}
            </>
          )}
          <Tag n={bar1.mark} x={ox - 16} y={bar1Y} />
          <text x={ox + w / 2} y={bar1Y - 8} textAnchor="middle" fontSize={10} fontWeight={700}>
            {bar1.n1}Ø{bar1.d}-L={bar1.length}
          </text>
        </g>
      )}

      {bar2 && (
        <g>
          <line
            x1={ox + w + 56}
            y1={oy}
            x2={ox + w + 56}
            y2={oy + h}
            stroke="#111"
            strokeWidth={2.2}
          />
          {inp.hooked && (
            <>
              {inp.hookLeft > 0 && (
                <path
                  d={`M ${ox + w + 56} ${oy} H ${ox + w + 56 - Math.max(6, Math.min(36, inp.hookLeft * s))}`}
                  fill="none"
                  stroke="#111"
                  strokeWidth={2.2}
                />
              )}
              {inp.hookRight > 0 && (
                <path
                  d={`M ${ox + w + 56} ${oy + h} H ${ox + w + 56 - Math.max(6, Math.min(36, inp.hookRight * s))}`}
                  fill="none"
                  stroke="#111"
                  strokeWidth={2.2}
                />
              )}
            </>
          )}
          <Tag n={bar2.mark} x={ox + w + 56} y={oy - 12} />
          <text
            x={ox + w + 70}
            y={oy + h / 2}
            fontSize={10}
            fontWeight={700}
            transform={`rotate(90, ${ox + w + 70}, ${oy + h / 2})`}
            textAnchor="middle"
          >
            {bar2.n1}Ø{bar2.d}-L={bar2.length}
          </text>
        </g>
      )}

      {inp.fType === 'tram' &&
        Array.from({ length: result.nTram }).map((_, i) => {
          const cols = Math.max(2, Math.floor(inp.xMong / 400))
          const col = i % cols
          const row = Math.floor(i / cols)
          return (
            <circle
              key={`t${i}`}
              cx={ox + 18 + col * ((w - 36) / Math.max(cols - 1, 1))}
              cy={oy + 18 + row * 22}
              r={4}
              fill="none"
              stroke="#111"
            />
          )
        })}
      <DrawingCaption x={ox + w / 2} y={captionY} title={title} />
    </svg>
  )
}

export function ShopDrawing({ inp, result, lang }: Props) {
  const L = t[lang]
  const s = sheetScale(inp)
  const aa = sectionSize(inp, 'x', s)
  const title =
    lang === 'vi' ? 'SHOP THÉP VÀ KHỐI LƯỢNG MÓNG (BY GIAHUY.NET)' : `${L.resultTitle} (BY GIAHUY.NET)`

  return (
    <div className="shop-scroll">
      <div className="shop-sheet" id="shop-sheet">
        <h1 className="shop-title">
          <span>{title}</span>
          <span className="shop-sheet-size">KHỔ A2 NẰM</span>
        </h1>
        <div className="shop-a2">
        <div className="shop-aa">
          <SectionDrawing axis="x" inp={inp} result={result} title={L.sectionAA} s={s} />
        </div>
        <div className="shop-callouts">
          <Callouts inp={inp} result={result} s={s} height={aa.H} />
        </div>
        <div className="shop-bb">
          <SectionDrawing axis="y" inp={inp} result={result} title={L.sectionBB} s={s} />
        </div>
        <div className="shop-plan">
          <PlanDrawing inp={inp} result={result} title={L.plan(inp.name, inp.qty)} s={s} />
        </div>
        <div className="shop-sched">
          <div className="schedule">
            <h2>{L.table}</h2>
            <div className="schedule-meta">
              <strong>{inp.name}</strong>
              <span>SL: {inp.qty}</span>
            </div>
            <table>
              <thead>
                <tr>
                  <th>STT</th>
                  <th>Hình dạng, kích thước (mm)</th>
                  <th>Ø (mm)</th>
                  <th>Chiều dài thanh (mm)</th>
                  <th>1 CK</th>
                  <th>T. bộ</th>
                  <th>Tổng dài (m)</th>
                  <th>Trọng lượng (kg)</th>
                </tr>
              </thead>
              <tbody>
                {result.bars.map((b) => (
                  <tr key={b.mark}>
                    <td>{b.mark}</td>
                    <td className="shape-cell">
                      <BarShape row={b} />
                    </td>
                    <td>{b.d}</td>
                    <td>{b.length}</td>
                    <td>{b.n1}</td>
                    <td>{b.nTotal}</td>
                    <td>{b.totalM}</td>
                    <td>{b.kg}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <table className="sum-table">
              <thead>
                <tr>
                  <th>Đường kính</th>
                  <th>Trọng lượng (kg)</th>
                  <th>Chiều dài (m)</th>
                  <th>
                    Số lượng thép
                    <br />
                    11.7m (cây)
                  </th>
                </tr>
              </thead>
              <tbody>
                {result.byDia.map((d) => (
                  <tr key={d.d}>
                    <td>Ø{d.d}</td>
                    <td>{d.kg}</td>
                    <td>{d.lengthM}</td>
                    <td>{d.d <= 10 ? '—' : d.bars117}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <ul className="qty-notes">
              <li>- Tổng hợp thép D≤10: {result.kgLe10} kg</li>
              <li>- Tổng hợp thép D≤18: {result.kgLe18} kg</li>
              <li>- Tổng hợp thép D&gt;18: {result.kgGt18} kg</li>
              {result.stirrupNote.map((n) => (
                <li key={n}>- {n}</li>
              ))}
              <li>- Ván khuôn móng: {result.formworkFootingExpr}</li>
              <li>- Ván khuôn cổ cột: {result.formworkNeckExpr}</li>
              <li>- Bê tông cổ cột: {result.concreteNeckExpr}</li>
              <li>- Bê tông móng: {result.concreteFootingExpr}</li>
              <li>- Bê tông lót: {result.concreteLiningExpr}</li>
            </ul>
          </div>
        </div>
      </div>
      </div>
    </div>
  )
}

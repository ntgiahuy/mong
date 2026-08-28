import type { CalcResult, Inputs, RebarRow } from '../types'
import { t, type Lang } from '../i18n'
import { columnPerimeterPts, faceStations, meshStations } from '../lib/calc'

type Props = {
  inp: Inputs
  result: CalcResult
  lang: Lang
}

const OX = 78
const RIGHT = 96
const CALLOUT_W = 170
/** Gap from footing bottom to view title — keep below the overall X-dimension numbers. */
const SECTION_CAPTION_GAP = 114
const SECTION_CAPTION_PAD = 22

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

function Level({ x, y, text }: { x: number; y: number; text: string }) {
  return (
    <g>
      <polygon points={`${x},${y} ${x + 8},${y - 5} ${x + 8},${y + 5}`} fill="#111" />
      <line x1={x} y1={y} x2={x + 36} y2={y} stroke="#111" />
      <text x={x + 40} y={y + 3} fontSize={10} fill="#111">
        {text}
      </text>
    </g>
  )
}

function StirrupHoop({
  x,
  y,
  w,
  h,
  strokeWidth = 1.8,
}: {
  x: number
  y: number
  w: number
  h: number
  strokeWidth?: number
}) {
  const r = Math.min(6, w * 0.14, h * 0.14)
  const hook = Math.min(16, Math.max(9, Math.min(w, h) * 0.28))
  const hx = x + w - r * 0.15
  const hy = y + r * 0.15
  const dx = -hook * 0.7
  const dy = hook * 0.7
  const gap = Math.max(2.4, strokeWidth * 1.15)
  return (
    <g fill="none" stroke="#111" strokeWidth={strokeWidth} strokeLinejoin="round" strokeLinecap="round">
      <rect x={x} y={y} width={w} height={h} rx={r} ry={r} />
      <line x1={hx} y1={hy} x2={hx + dx} y2={hy + dy} />
      <line x1={hx - gap} y1={hy + gap * 0.35} x2={hx - gap + dx} y2={hy + gap * 0.35 + dy} />
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
    const [leg, mid] = row.segs
    return (
      <svg width={132} height={42} viewBox="0 0 132 42">
        <path d="M16 8 V32 H116 V8" fill="none" stroke="#111" strokeWidth={1.7} />
        <text x={66} y={41} textAnchor="middle" fontSize={9}>
          {mid}
        </text>
        <text x={2} y={24} fontSize={9}>
          {leg}
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
      <path d="M34 16 H106 V42 H34 Z" fill="none" stroke="#111" strokeWidth={1.7} />
      <path d="M106 16 H132" fill="none" stroke="#111" strokeWidth={1.7} />
      <text x={70} y={13} textAnchor="middle" fontSize={9}>
        {a}
      </text>
      <text x={4} y={32} fontSize={9}>
        {b}
      </text>
      <text x={119} y={13} textAnchor="middle" fontSize={9}>
        {hook}
      </text>
    </svg>
  )
}

function sheetScale(inp: Inputs): number {
  const totalH = inp.hCom + inp.hCm + inp.hDm + inp.lining + (inp.fType === 'sand' ? 80 : 0)
  const sheetW = 1520
  const availW = sheetW - CALLOUT_W - 16 - (OX + RIGHT) * 2
  const sW = availW / Math.max(inp.xMong + inp.yMong, 1)
  const sSec = 480 / Math.max(totalH, 1)
  const sPlan = 420 / Math.max(inp.yMong, 1)
  return Math.min(sW, sSec, sPlan, 0.26)
}

function sectionSize(inp: Inputs, axis: 'x' | 'y', s: number) {
  const widthMm = axis === 'x' ? inp.xMong : inp.yMong
  const totalH = inp.hCom + inp.hCm + inp.hDm
  const sandH = inp.fType === 'sand' ? 18 : 0
  const bw = widthMm * s
  const W = OX + bw + RIGHT
  const oy = 22
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
  const totalH = inp.hCom + inp.hCm + inp.hDm
  const oy = 22
  const stem = Math.max(80, (totalH - 100) * s)
  const hook = Math.max(16, Math.min(40, result.colHook * s * 0.5))
  const pairW = 56
  const W = CALLOUT_W
  const hoopW = 30
  const hoopH = 48
  const x2 = W - hook - 6
  const x1 = x2 - pairW
  const y1 = oy
  const y2 = y1 + stem
  const stirX = 8
  const stirY = y2 - hoopH
  const lBot = y2 + hook + 20
  const H = Math.max(height, lBot, stirY + hoopH + 26)

  return (
    <svg className="cad" viewBox={`0 0 ${W} ${H}`} width={W} height={H} preserveAspectRatio="xMinYMin meet">
      {colBars.map((b, i) => {
        const dy = i * (stem + hook + 22)
        const ya = y1 + dy
        const yb = y2 + dy
        const mid = (ya + yb) / 2
        return (
          <g key={b.mark}>
            <path
              d={`M ${x1} ${ya} V ${yb} H ${x1 - hook}`}
              fill="none"
              stroke="#111"
              strokeWidth={2.2}
              strokeLinecap="square"
            />
            <path
              d={`M ${x2} ${ya} V ${yb} H ${x2 + hook}`}
              fill="none"
              stroke="#111"
              strokeWidth={2.2}
              strokeLinecap="square"
            />
            <Tag n={b.mark} x={(x1 + x2) / 2} y={ya + 12} />
            <text
              x={(x1 + x2) / 2}
              y={mid + 8}
              fontSize={10}
              fontWeight={700}
              transform={`rotate(-90, ${(x1 + x2) / 2}, ${mid + 8})`}
              textAnchor="middle"
            >
              {inp.cx}Ø{b.d}-L={b.length}
            </text>
            <text x={x1 - hook / 2} y={yb + 12} textAnchor="middle" fontSize={8}>
              {b.segs[0]}
            </text>
            <text x={x2 + hook / 2} y={yb + 12} textAnchor="middle" fontSize={8}>
              {b.segs[0]}
            </text>
          </g>
        )
      })}
      {stirrup && (
        <g>
          <line
            x1={stirX + hoopW}
            y1={stirY + hoopH / 2}
            x2={x1}
            y2={stirY + hoopH / 2}
            stroke="#111"
            strokeWidth={0.9}
          />
          <StirrupHoop x={stirX} y={stirY} w={hoopW} h={hoopH} strokeWidth={2} />
          <Tag n={stirrup.mark} x={stirX + 8} y={stirY + hoopH + 14} />
          <text x={stirX + 20} y={stirY + hoopH + 18} fontSize={10} fontWeight={700}>
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
  const colMark = result.bars.find((b) => b.shape === 'L')?.mark ?? 3
  const stirMark = result.bars.find((b) => b.shape === 'stirrup')?.mark ?? 4

  const totalH = inp.hCom + inp.hCm + inp.hDm
  const ox = OX
  const { W, H } = sectionSize(inp, axis, s)
  const oy = 22
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
  const sandH = inp.fType === 'sand' ? 18 : 0
  const cover = inp.coverBase * s
  const colCover = inp.coverCol * s
  const yHook = y3 - 100 * s
  const barW = Math.max(1.8, inp.dMain / 8)
  const lineW = Math.max(1.4, dLine / 10)
  const dotR = Math.max(2.0, dDot / 5)
  const hookPx = Math.min(32, Math.max(14, result.colHook * s))
  const cxMid = colX + cw / 2

  const faceXs = faceStations(nFace, colMm, inp.coverCol).map((mm) => colX + mm * s)
  const transXs = meshStations(widthMm, inp.coverBase, aDot).map((mm) => ox + mm * s)

  const yLong = lineIsBottom ? y3 - cover : y3 - cover - dotR * 2 - 4
  const yTrans = lineIsBottom ? y3 - cover - lineW - dotR - 3 : y3 - cover
  const yTrans2 = yTrans + (lineIsBottom ? -(dotR * 2 + 3) : dotR * 2 + 3)
  const yMainLab = y0 + Math.max(28, hs.com * 0.38)
  const yStirLab = y0 + Math.max(12, hs.com * 0.14)
  const captionY = y4 + sandH + SECTION_CAPTION_GAP

  return (
    <svg className="cad" viewBox={`0 0 ${W} ${H}`} width={W} height={H} preserveAspectRatio="xMinYMin meet">
      <line
        x1={cxMid}
        x2={cxMid}
        y1={y0 - 8}
        y2={y4 + sandH + 8}
        stroke="#111"
        strokeWidth={0.8}
        strokeDasharray="10 4 2 4"
      />
      <rect x={colX} y={y0} width={cw} height={hs.com} fill="#e9e9e9" stroke="#111" strokeWidth={1.4} />
      <polygon
        points={`${ox},${y2} ${ox + bw},${y2} ${colX + cw},${y1} ${colX},${y1}`}
        fill="#dedede"
        stroke="#111"
        strokeWidth={1.4}
      />
      <rect x={ox} y={y2} width={bw} height={hs.dm} fill="#d8d8d8" stroke="#111" strokeWidth={1.4} />
      <rect x={ox - 8} y={y3} width={bw + 16} height={lot} fill="#c4c4c4" stroke="#111" />
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
        const dir = x < colX + cw / 2 ? -1 : 1
        return (
          <path
            key={`v${i}`}
            d={`M ${x} ${y0 + 4} L ${x} ${yHook} L ${x + dir * hookPx} ${yHook}`}
            fill="none"
            stroke="#111"
            strokeWidth={barW}
            strokeLinejoin="miter"
            strokeLinecap="square"
          />
        )
      })}

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
          <path
            d={`M ${ox + cover} ${yLong} L ${ox + cover} ${yLong - hs.dm * 0.45}`}
            fill="none"
            stroke="#111"
            strokeWidth={lineW}
          />
          <path
            d={`M ${ox + bw - cover} ${yLong} L ${ox + bw - cover} ${yLong - hs.dm * 0.45}`}
            fill="none"
            stroke="#111"
            strokeWidth={lineW}
          />
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

      <Tag n={colMark} x={colX + cw + 14} y={yMainLab} />
      <text x={colX + cw + 26} y={yMainLab + 4} fontSize={11} fontWeight={700}>
        {result.nCol}Ø{inp.dMain}
      </text>
      <Tag n={stirMark} x={colX + cw + 14} y={yStirLab} />
      <text x={colX + cw + 26} y={yStirLab + 4} fontSize={10}>
        Ø{inp.dStirrup}a{inp.aStirrup}
      </text>
      <Tag n={markLong} x={ox + bw * 0.22} y={yLong - 16} />
      <text x={ox + bw * 0.22 + 12} y={yLong - 12} fontSize={10}>
        Ø{dLine}a{aLine}
      </text>
      <Tag n={markTrans} x={ox + bw * 0.62} y={yTrans - 16} />
      <text x={ox + bw * 0.62 + 12} y={yTrans - 12} fontSize={10}>
        Ø{dDot}a{aDot}
      </text>

      <HDim x1={ox} x2={ox + cover} y={y4 + sandH + 18} label={inp.coverBase} below />
      <HDim x1={ox + cover} x2={colX} y={y4 + sandH + 18} label={Math.round(leftMm - inp.coverBase)} below />
      <HDim x1={colX} x2={colX + cw} y={y4 + sandH + 18} label={colMm} below />
      <HDim
        x1={colX + cw}
        x2={ox + bw - cover}
        y={y4 + sandH + 18}
        label={Math.round(widthMm - leftMm - colMm - inp.coverBase)}
        below
      />
      <HDim x1={ox + bw - cover} x2={ox + bw} y={y4 + sandH + 18} label={inp.coverBase} below />
      <HDim x1={ox} x2={ox + bw} y={y4 + sandH + 36} label={widthMm} below />

      <VDim x={ox - 22} y1={y3} y2={y4} label={inp.lining} left />
      <VDim x={ox - 22} y1={y2} y2={y3} label={inp.hDm} left />
      <VDim x={ox - 22} y1={y1} y2={y2} label={inp.hCm} left />
      <VDim x={ox - 44} y1={y0} y2={y3} label={totalH} left />

      <Level x={ox + bw + 8} y={y0} text={fmtLevel(0)} />
      <Level x={ox + bw + 8} y={y0 - inp.cdn * s} text={fmtLevel(inp.cdn)} />
      <line
        x1={ox}
        x2={ox + bw}
        y1={y0 - inp.cdtn * s}
        y2={y0 - inp.cdtn * s}
        stroke="#c33"
        strokeDasharray="5 3"
      />
      <text x={ox + bw + 48} y={y0 - inp.cdtn * s + 3} fontSize={10} fill="#c33">
        {fmtLevel(inp.cdtn)}
      </text>
      <Level x={ox + bw + 8} y={y3} text={fmtLevel(result.cdm)} />
      <text x={ox + bw + 8} y={y4 - 2} fontSize={9}>
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
  const colMark = result.bars.find((b) => b.shape === 'L')?.mark ?? 3
  const stirMark = result.bars.find((b) => b.shape === 'stirrup')?.mark ?? 4
  const ox = OX
  const oy = 16
  const w = inp.xMong * s
  const h = inp.yMong * s
  const cx = ox + inp.x1 * s
  const cy = oy + inp.y1 * s
  const cw = inp.xCo * s
  const ch = inp.yCo * s
  const nx = meshStations(inp.xMong, inp.coverBase, inp.aFaY)
  const ny = meshStations(inp.yMong, inp.coverBase, inp.aFaX)
  const colDots = columnPerimeterPts(inp.cx, inp.cy, inp.xCo, inp.yCo, inp.coverCol)
  const cover = inp.coverBase * s
  const dimY = oy + h + 22
  const bar1Y = dimY + 50
  const captionY = bar1Y + 40
  const extraRight = 78
  const W = ox + w + RIGHT + extraRight
  const H = captionY + SECTION_CAPTION_PAD

  return (
    <svg className="cad" viewBox={`0 0 ${W} ${H}`} width={W} height={H} preserveAspectRatio="xMinYMin meet">
      <rect x={ox} y={oy} width={w} height={h} fill="#f3f3f3" stroke="#111" strokeWidth={1.5} />
      <rect x={cx} y={cy} width={cw} height={ch} fill="#e4e4e4" stroke="#111" strokeWidth={1.5} />
      <line x1={ox} y1={oy} x2={cx} y2={cy} stroke="#666" />
      <line x1={ox + w} y1={oy} x2={cx + cw} y2={cy} stroke="#666" />
      <line x1={ox} y1={oy + h} x2={cx} y2={cy + ch} stroke="#666" />
      <line x1={ox + w} y1={oy + h} x2={cx + cw} y2={cy + ch} stroke="#666" />

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

      <Tag n={bar1?.mark ?? 1} x={ox + 18} y={oy + 16} />
      <text x={ox + 30} y={oy + 20} fontSize={10} fontWeight={700}>
        Ø{bar1?.d ?? inp.dFaX}a{inp.bottomLayerX ? inp.aFaX : inp.aFaY}
      </text>
      <Tag n={bar2?.mark ?? 2} x={ox + w - 20} y={oy + 18} />
      <text x={ox + w - 32} y={oy + 22} textAnchor="end" fontSize={10} fontWeight={700}>
        Ø{bar2?.d ?? inp.dFaY}a{inp.bottomLayerX ? inp.aFaY : inp.aFaX}
      </text>
      <Tag n={colMark} x={cx + cw / 2} y={cy + 14} />
      <text x={cx + cw / 2 + 12} y={cy + 18} fontSize={10} fontWeight={700}>
        {result.nCol}Ø{inp.dMain}
      </text>
      <Tag n={stirMark} x={cx + cw - 8} y={cy + ch - 10} />
      <text x={cx + cw + 4} y={cy + ch - 6} fontSize={10}>
        Ø{inp.dStirrup}a{inp.aStirrup}
      </text>

      <HDim x1={ox} x2={ox + cover} y={dimY} label={inp.coverBase} below />
      <HDim x1={ox + cover} x2={cx} y={dimY} label={Math.round(inp.x1 - inp.coverBase)} below />
      <HDim x1={cx} x2={cx + cw} y={dimY} label={inp.xCo} below />
      <HDim
        x1={cx + cw}
        x2={ox + w - cover}
        y={dimY}
        label={Math.round(result.x2 - inp.coverBase)}
        below
      />
      <HDim x1={ox} x2={ox + w} y={dimY + 16} label={inp.xMong} below />

      <VDim x={ox - 22} y1={oy} y2={cy} label={inp.y1} left />
      <VDim x={ox - 22} y1={cy} y2={cy + ch} label={inp.yCo} left />
      <VDim x={ox - 22} y1={cy + ch} y2={oy + h} label={Math.round(inp.yMong - inp.y1 - inp.yCo)} left />
      <VDim x={ox - 44} y1={oy} y2={oy + h} label={inp.yMong} left />

      {bar1 && (
        <g>
          <line x1={ox} y1={bar1Y} x2={ox + w} y2={bar1Y} stroke="#111" strokeWidth={2.2} />
          {inp.hooked && (
            <>
              <path d={`M ${ox} ${bar1Y} V ${bar1Y - 12}`} fill="none" stroke="#111" strokeWidth={2.2} />
              <path d={`M ${ox + w} ${bar1Y} V ${bar1Y - 12}`} fill="none" stroke="#111" strokeWidth={2.2} />
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
              <path
                d={`M ${ox + w + 56} ${oy} H ${ox + w + 42}`}
                fill="none"
                stroke="#111"
                strokeWidth={2.2}
              />
              <path
                d={`M ${ox + w + 56} ${oy + h} H ${ox + w + 42}`}
                fill="none"
                stroke="#111"
                strokeWidth={2.2}
              />
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
    <div className="shop-sheet" id="shop-sheet">
      <h1 className="shop-title">{title}</h1>
      <div className="shop-a2">
        <div className="shop-callouts">
          <Callouts inp={inp} result={result} s={s} height={aa.H} />
        </div>
        <div className="shop-aa">
          <SectionDrawing axis="x" inp={inp} result={result} title={L.sectionAA} s={s} />
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
                  <th>Số lượng thép 11.7m (cây)</th>
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
  )
}

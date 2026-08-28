import type { Inputs } from '../types'
import { faceStations, meshStations } from '../lib/calc'

type Props = {
  inp: Inputs
}

const YELLOW = '#f4e27a'
const STEEL = '#7cff6b'
const STIR = '#ff9f43'
const OUTLINE = '#e8e8e8'
const CYAN = '#9fd4ff'
const COL = '#7ec8ff'
const RED = '#e25b5b'
const SHOULDER = 50

function DimH({
  x1,
  x2,
  y,
  label,
  color,
  below = true,
}: {
  x1: number
  x2: number
  y: number
  label: string
  color: string
  below?: boolean
}) {
  if (Math.abs(x2 - x1) < 6) return null
  const a = Math.min(x1, x2)
  const b = Math.max(x1, x2)
  const mid = (a + b) / 2
  return (
    <g stroke={color} fill={color}>
      <line x1={a} y1={y - 3.5} x2={a} y2={y + 3.5} />
      <line x1={b} y1={y - 3.5} x2={b} y2={y + 3.5} />
      <line x1={a} y1={y} x2={b} y2={y} />
      <text
        x={mid}
        y={below ? y + 12 : y - 4}
        textAnchor="middle"
        fontSize={9}
        fontWeight={700}
        stroke="none"
      >
        {label}
      </text>
    </g>
  )
}

function DimV({
  x,
  y1,
  y2,
  label,
  color,
  left = true,
}: {
  x: number
  y1: number
  y2: number
  label: string
  color: string
  left?: boolean
}) {
  if (Math.abs(y2 - y1) < 6) return null
  const a = Math.min(y1, y2)
  const b = Math.max(y1, y2)
  const mid = (a + b) / 2
  return (
    <g stroke={color} fill={color}>
      <line x1={x - 3.5} y1={a} x2={x + 3.5} y2={a} />
      <line x1={x - 3.5} y1={b} x2={x + 3.5} y2={b} />
      <line x1={x} y1={a} x2={x} y2={b} />
      <text
        x={left ? x - 5 : x + 5}
        y={mid + 3}
        textAnchor={left ? 'end' : 'start'}
        fontSize={9}
        fontWeight={700}
        stroke="none"
      >
        {label}
      </text>
    </g>
  )
}

function ElevMark({
  x,
  y,
  label,
  color,
}: {
  x: number
  y: number
  label: string
  color: string
}) {
  return (
    <g>
      <line x1={x - 16} y1={y} x2={x + 10} y2={y} stroke={color} />
      <polygon points={`${x + 2},${y} ${x - 4},${y - 8} ${x + 8},${y - 8}`} fill={color} />
      <text x={x + 12} y={y - 2} fill={color} fontSize={9} fontWeight={700}>
        {label}
      </text>
    </g>
  )
}

function Tag({ n, x, y }: { n: number; x: number; y: number }) {
  return (
    <g>
      <circle cx={x} cy={y} r={6.5} fill="#2a2a2a" stroke={YELLOW} />
      <text x={x} y={y + 3.5} textAnchor="middle" fill={YELLOW} fontSize={9} fontWeight={700}>
        {n}
      </text>
    </g>
  )
}

export function Schematic({ inp }: Props) {
  const LEFT = 46
  const RIGHT = 72
  const TOP = 20
  const GAP = 24
  const BOT = 68
  const COL_W = 320
  const MAX_STACK = 560

  const totalH = inp.hCom + inp.hCm + inp.hDm
  const elevMm = totalH + inp.lining
  const planMm = inp.yMong
  const sW = (COL_W - LEFT - RIGHT) / Math.max(inp.xMong, 1)
  const sH = (MAX_STACK - TOP - GAP - BOT) / Math.max(elevMm + planMm, 1)
  const s = Math.min(Math.max(Math.min(sW, sH), 0.072), 0.16)

  const baseW = inp.xMong * s
  const colW = inp.xCo * s
  const left = inp.x1 * s
  const sh = SHOULDER * s
  const hCom = inp.hCom * s
  const hCm = inp.hCm * s
  const hDm = inp.hDm * s
  const hLot = inp.lining * s
  const hBeam = inp.hBeam * s
  const barW = Math.max(1.3, Math.min(2.4, inp.dMain * s * 0.12))
  const stirW = Math.max(0.9, Math.min(1.6, inp.dStirrup * s * 0.16))

  const x0 = LEFT
  const yColTop = TOP
  const colX = x0 + left
  const ySlopeTop = yColTop + hCom
  const yBaseTop = ySlopeTop + hCm
  const yBaseBot = yBaseTop + hDm
  const yLotBot = yBaseBot + hLot
  const yAtElev = (e: number) => yColTop - (e - inp.cdn) * s
  const yBeam = yAtElev(inp.cdg)
  const yGround = yAtElev(inp.cdtn)
  const lx = x0 + baseW + 10

  const pw = baseW
  const ph = inp.yMong * s
  const px = x0
  const py = yLotBot + GAP
  const pcx = px + inp.x1 * s
  const pcy = py + inp.y1 * s
  const pcw = inp.xCo * s
  const pch = inp.yCo * s
  const cx = px + inp.xCc * s
  const cy = py + inp.yCc * s

  const W = Math.ceil(LEFT + baseW + RIGHT)
  const H = Math.ceil(py + ph + BOT)

  const dots = meshStations(inp.xMong, inp.coverBase, inp.aFaY)
  const nStir = Math.min(7, Math.max(3, Math.floor(inp.hCom / Math.max(inp.aStirrup, 1))))
  const tickStep = Math.max(14, 22 * (s / 0.1))

  return (
    <div className="schematic-wrap">
    <svg className="schematic" viewBox={`0 0 ${W} ${H}`} width="100%" role="img" aria-label="Sơ đồ móng cùng tỉ lệ">
      <rect width={W} height={H} fill="#2f2f2f" />

      <line
        x1={colX + colW / 2}
        x2={colX + colW / 2}
        y1={yColTop - 6}
        y2={yLotBot + 6}
        stroke="#aaa"
        strokeWidth={0.8}
        strokeDasharray="6 3 2 3"
      />

      <polygon
        points={`${x0},${yBaseTop} ${x0 + baseW},${yBaseTop} ${Math.min(x0 + baseW, colX + colW + sh)},${ySlopeTop} ${Math.max(x0, colX - sh)},${ySlopeTop}`}
        fill="#525252"
        stroke={OUTLINE}
      />
      <rect x={x0} y={yBaseTop} width={baseW} height={hDm} fill="#5a5a5a" stroke={OUTLINE} />
      <rect x={x0 - 5} y={yBaseBot} width={baseW + 10} height={hLot} fill="#6b6b6b" stroke={OUTLINE} />
      {Array.from({ length: 9 }).map((_, i) => (
        <line
          key={`lot${i}`}
          x1={x0 - 4 + i * ((baseW + 8) / 8)}
          y1={yBaseBot}
          x2={x0 - 10 + i * ((baseW + 8) / 8)}
          y2={yLotBot}
          stroke="#9a9a9a"
          strokeWidth={0.8}
        />
      ))}

      {inp.hasBeam && inp.hBeam > 0 && (
        <g>
          <rect
            x={x0 + 4}
            y={yBeam}
            width={Math.max(12, colX - x0 - 6)}
            height={hBeam}
            fill="#6a6a6a"
            stroke={OUTLINE}
          />
          <rect
            x={colX + colW + 2}
            y={yBeam}
            width={Math.max(12, x0 + baseW - 4 - (colX + colW + 2))}
            height={hBeam}
            fill="#6a6a6a"
            stroke={OUTLINE}
          />
        </g>
      )}

      <g stroke={RED} fill="none">
        <line x1={x0 - 8} y1={yGround} x2={colX - 1} y2={yGround} />
        <line x1={colX + colW + 1} y1={yGround} x2={x0 + baseW + 8} y2={yGround} />
        {Array.from({ length: 6 }).map((_, i) => {
          const x = x0 + 8 + i * tickStep
          if (x > colX - 10) return null
          return (
            <g key={`gl${i}`}>
              <line x1={x} y1={yGround + 1} x2={x + 5} y2={yGround + 7} />
              <line x1={x + 3} y1={yGround + 1} x2={x + 8} y2={yGround + 7} />
              <line x1={x + 6} y1={yGround + 1} x2={x + 11} y2={yGround + 7} />
            </g>
          )
        })}
        {Array.from({ length: 6 }).map((_, i) => {
          const x = colX + colW + 10 + i * tickStep
          if (x > x0 + baseW) return null
          return (
            <g key={`gr${i}`}>
              <line x1={x} y1={yGround + 1} x2={x + 5} y2={yGround + 7} />
              <line x1={x + 3} y1={yGround + 1} x2={x + 8} y2={yGround + 7} />
              <line x1={x + 6} y1={yGround + 1} x2={x + 11} y2={yGround + 7} />
            </g>
          )
        })}
      </g>

      <rect x={colX} y={yColTop} width={colW} height={hCom} fill="#4a4a4a" stroke={OUTLINE} />

      {faceStations(Math.max(2, inp.cx), inp.xCo, inp.coverCol).map((mm, i) => {
        const x = colX + mm * s
        const dir = x < colX + colW / 2 ? -1 : 1
        return (
          <path
            key={`cy${i}`}
            d={`M ${x} ${yColTop + 5} L ${x} ${yBaseBot - 8} L ${x + dir * 11} ${yBaseBot - 8}`}
            fill="none"
            stroke={STEEL}
            strokeWidth={barW}
          />
        )
      })}
      {Array.from({ length: nStir }).map((_, i) => (
        <line
          key={`st${i}`}
          x1={colX + 5}
          x2={colX + colW - 5}
          y1={yColTop + 12 + i * ((hCom - 22) / Math.max(nStir - 1, 1))}
          y2={yColTop + 12 + i * ((hCom - 22) / Math.max(nStir - 1, 1))}
          stroke={STIR}
          strokeWidth={stirW}
        />
      ))}
      <line
        x1={x0 + 8}
        x2={x0 + baseW - 8}
        y1={yBaseBot - 9}
        y2={yBaseBot - 9}
        stroke={STEEL}
        strokeWidth={2}
      />
      {dots.map((mm, i) => (
        <circle key={`fa${i}`} cx={x0 + mm * s} cy={yBaseBot - 9} r={2.1} fill={STEEL} />
      ))}
      <Tag n={1} x={x0 + baseW * 0.28} y={yBaseBot - 24} />
      <text x={x0 + baseW * 0.28 + 10} y={yBaseBot - 21} fill={YELLOW} fontSize={10} fontWeight={700}>
        FaX
      </text>
      <Tag n={2} x={x0 + baseW * 0.62} y={yBaseBot - 24} />
      <text x={x0 + baseW * 0.62 + 10} y={yBaseBot - 21} fill={YELLOW} fontSize={10} fontWeight={700}>
        FaY
      </text>

      <DimV x={x0 - 16} y1={yColTop} y2={ySlopeTop} label="Hcom" color={YELLOW} />
      <DimV x={x0 - 16} y1={ySlopeTop} y2={yBaseTop} label="Hcm" color={YELLOW} />
      <DimV x={x0 - 16} y1={yBaseTop} y2={yBaseBot} label="Hdm" color={YELLOW} />

      <ElevMark x={lx} y={yColTop} label="CDN" color={CYAN} />
      {inp.hasBeam && <ElevMark x={lx} y={yBeam} label="CDG" color={CYAN} />}
      <ElevMark x={lx} y={yGround} label="CDTN" color={RED} />
      <ElevMark x={lx} y={yBaseBot} label="CDM" color={CYAN} />

      <rect x={px} y={py} width={pw} height={ph} fill="none" stroke={OUTLINE} />
      <rect x={pcx} y={pcy} width={pcw} height={pch} fill="none" stroke={COL} />
      <line x1={px} y1={py} x2={pcx} y2={pcy} stroke="#888" />
      <line x1={px + pw} y1={py} x2={pcx + pcw} y2={pcy} stroke="#888" />
      <line x1={px} y1={py + ph} x2={pcx} y2={pcy + pch} stroke="#888" />
      <line x1={px + pw} y1={py + ph} x2={pcx + pcw} y2={pcy + pch} stroke="#888" />
      <line
        x1={cx}
        x2={cx}
        y1={py - 4}
        y2={py + ph + 4}
        stroke={COL}
        strokeWidth={0.7}
        strokeDasharray="5 3 1 3"
      />
      <line
        x1={px - 4}
        x2={px + pw + 4}
        y1={cy}
        y2={cy}
        stroke={COL}
        strokeWidth={0.7}
        strokeDasharray="5 3 1 3"
      />
      {[
        [pcx + 4, pcy + 4],
        [pcx + pcw - 4, pcy + 4],
        [pcx + 4, pcy + pch - 4],
        [pcx + pcw - 4, pcy + pch - 4],
      ].map(([x, y], i) => (
        <circle key={`c${i}`} cx={x} cy={y} r={2.2} fill={STEEL} />
      ))}

      <DimH x1={px} x2={pcx} y={py + ph + 12} label="X1" color={YELLOW} />
      <DimH x1={pcx} x2={pcx + pcw} y={py + ph + 12} label="Xcot" color={COL} />
      <DimH x1={px} x2={cx} y={py + ph + 28} label="Xcc" color={CYAN} />
      <DimH x1={px} x2={px + pw} y={py + ph + 44} label="Xmong" color={YELLOW} />

      <DimV x={px + pw + 12} y1={py} y2={pcy} label="Y1" color={YELLOW} left={false} />
      <DimV x={px + pw + 12} y1={pcy} y2={pcy + pch} label="Ycot" color={COL} left={false} />
      <DimV x={px + pw + 28} y1={py} y2={cy} label="Ycc" color={CYAN} left={false} />
      <DimV x={px + pw + 44} y1={py} y2={py + ph} label="Ymong" color={YELLOW} left={false} />

      <text x={x0 + baseW / 2} y={yLotBot + 16} textAnchor="middle" fill="#c8c8c8" fontSize={9} fontWeight={700}>
        MẶT ĐỨNG
      </text>
      <text x={px + pw / 2} y={H - 10} textAnchor="middle" fill="#c8c8c8" fontSize={9} fontWeight={700}>
        MẶT BẰNG
      </text>
    </svg>
    </div>
  )
}

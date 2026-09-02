import type { Inputs } from '../types'
import { barHookSign, faceStations, meshStations, pedestalShoulders } from '../lib/calc'

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
const LOT_PLAN = 100

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
        fontSize={10}
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
        fontSize={10}
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
  const LEFT = 52
  const RIGHT = 96
  const TOP = 20
  const GAP = 44
  const BOT = 78
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
  const lot = LOT_PLAN * s
  const sh = pedestalShoulders(inp)
  const shL = sh.left * s
  const shR = sh.right * s
  const shT = sh.top * s
  const shB = sh.bottom * s
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
  const sx = pcx - shL
  const sy = pcy - shT
  const sw = pcw + shL + shR
  const shh = pch + shT + shB

  const W = Math.ceil(LEFT + baseW + RIGHT)
  const H = Math.ceil(py + ph + lot + BOT)

  const dots = meshStations(inp.xMong, inp.coverBase, inp.aFaY)
  const nStir = Math.min(7, Math.max(3, Math.floor(inp.hCom / Math.max(inp.aStirrup, 1))))
  const tickStep = Math.max(14, 22 * (s / 0.1))

  return (
    <div className="schematic-wrap">
    <svg
      className="schematic"
      viewBox={`0 0 ${W} ${H}`}
      width="100%"
      preserveAspectRatio="xMinYMin meet"
      style={{ aspectRatio: `${W} / ${H}` }}
      role="img"
      aria-label="Sơ đồ móng cùng tỉ lệ"
    >
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
        points={`${x0},${yBaseTop} ${x0 + baseW},${yBaseTop} ${colX + colW + shR},${ySlopeTop} ${colX - shL},${ySlopeTop}`}
        fill="#525252"
        stroke={OUTLINE}
      />
      <rect x={x0} y={yBaseTop} width={baseW} height={hDm} fill="#5a5a5a" stroke={OUTLINE} />
      <rect x={x0 - lot} y={yBaseBot} width={baseW + lot * 2} height={hLot} fill="#6b6b6b" stroke={OUTLINE} />
      {Array.from({ length: 9 }).map((_, i) => (
        <line
          key={`lot${i}`}
          x1={x0 - lot + i * ((baseW + lot * 2) / 8)}
          y1={yBaseBot}
          x2={x0 - lot - 6 + i * ((baseW + lot * 2) / 8)}
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
        const hook = 11
        const dir = barHookSign(x, colX + colW / 2, x0, x0 + baseW, hook)
        const room = dir < 0 ? x - x0 : x0 + baseW - x
        const hLen = Math.max(4, Math.min(hook, room - 2))
        return (
          <path
            key={`cy${i}`}
            d={`M ${x} ${yColTop + 5} L ${x} ${yBaseBot - 8} L ${x + dir * hLen} ${yBaseBot - 8}`}
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

      <line
        x1={x0}
        x2={x0}
        y1={yBaseTop}
        y2={py + ph}
        stroke="#6a6a6a"
        strokeWidth={0.7}
        strokeDasharray="3 5"
      />
      <line
        x1={x0 + baseW}
        x2={x0 + baseW}
        y1={yBaseTop}
        y2={py + ph}
        stroke="#6a6a6a"
        strokeWidth={0.7}
        strokeDasharray="3 5"
      />
      <DimH x1={x0} x2={x0 + baseW} y={yLotBot + 10} label="Xmong" color={YELLOW} />
      <DimV x={x0 - 16} y1={yColTop} y2={ySlopeTop} label="Hcom" color={YELLOW} />
      <DimV x={x0 - 16} y1={ySlopeTop} y2={yBaseTop} label="Hcm" color={YELLOW} />
      <DimV x={x0 - 16} y1={yBaseTop} y2={yBaseBot} label="Hdm" color={YELLOW} />

      <ElevMark x={lx} y={yColTop} label="CDN" color={CYAN} />
      {inp.hasBeam && <ElevMark x={lx} y={yBeam} label="CDG" color={CYAN} />}
      <ElevMark x={lx} y={yGround} label="CDTN" color={RED} />
      <ElevMark x={lx} y={yBaseBot} label="CDM" color={CYAN} />

      <rect
        x={px - lot}
        y={py - lot}
        width={pw + lot * 2}
        height={ph + lot * 2}
        fill="#3d3d3d"
        stroke="#c8c8c8"
        strokeDasharray="5 3"
      />
      <rect x={px} y={py} width={pw} height={ph} fill="#2f2f2f" stroke={OUTLINE} />
      <rect x={sx} y={sy} width={sw} height={shh} fill="none" stroke={YELLOW} />
      <rect x={pcx} y={pcy} width={pcw} height={pch} fill="none" stroke={COL} />
      <line x1={px} y1={py} x2={sx} y2={sy} stroke="#888" />
      <line x1={px + pw} y1={py} x2={sx + sw} y2={sy} stroke="#888" />
      <line x1={px} y1={py + ph} x2={sx} y2={sy + shh} stroke="#888" />
      <line x1={px + pw} y1={py + ph} x2={sx + sw} y2={sy + shh} stroke="#888" />
      <line
        x1={cx}
        x2={cx}
        y1={py - lot - 4}
        y2={py + ph + lot + 4}
        stroke={COL}
        strokeWidth={0.7}
        strokeDasharray="5 3 1 3"
      />
      <line
        x1={px - lot - 4}
        x2={px + pw + lot + 4}
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

      <text x={px - lot + 4} y={py + ph + lot - 5} fill="#e8e8e8" fontSize={10} fontWeight={700}>
        Lót
      </text>
      {(shL > 1 || shR > 1 || shT > 1 || shB > 1) && (
        <text
          x={shL > 1 || shT > 1 ? sx + 4 : sx + Math.max(8, sw - 28)}
          y={shT > 1 || shL > 1 ? sy - 4 : sy + shh + 12}
          fill={YELLOW}
          fontSize={10}
          fontWeight={700}
        >
          Vai
        </text>
      )}

      <DimH x1={px - lot} x2={px} y={py + ph + lot + 12} label="Lót" color="#c8c8c8" />
      <DimH x1={px} x2={pcx} y={py + ph + lot + 12} label="X1" color={YELLOW} />
      <DimH x1={pcx} x2={pcx + pcw} y={py + ph + lot + 12} label="Xcot" color={COL} />
      <DimH x1={sx} x2={pcx} y={py + ph + lot + 28} label="Vai" color={YELLOW} />
      <DimH x1={px} x2={cx} y={py + ph + lot + 28} label="Xcc" color={CYAN} />
      <DimH x1={px} x2={px + pw} y={py + ph + lot + 44} label="Xmong" color={YELLOW} />

      <DimV x={px + pw + lot + 12} y1={py - lot} y2={py} label="Lót" color="#c8c8c8" left={false} />
      <DimV x={px + pw + lot + 12} y1={py} y2={pcy} label="Y1" color={YELLOW} left={false} />
      <DimV x={px + pw + lot + 12} y1={pcy} y2={pcy + pch} label="Ycot" color={COL} left={false} />
      <DimV x={px + pw + lot + 28} y1={sy} y2={pcy} label="Vai" color={YELLOW} left={false} />
      <DimV x={px + pw + lot + 28} y1={py} y2={cy} label="Ycc" color={CYAN} left={false} />
      <DimV x={px + pw + lot + 44} y1={py} y2={py + ph} label="Ymong" color={YELLOW} left={false} />

      <text x={x0 + baseW / 2} y={yLotBot + 36} textAnchor="middle" fill="#c8c8c8" fontSize={9} fontWeight={700}>
        MẶT ĐỨNG
      </text>
      <text x={px + pw / 2} y={H - 10} textAnchor="middle" fill="#c8c8c8" fontSize={9} fontWeight={700}>
        MẶT BẰNG
      </text>
    </svg>
    </div>
  )
}

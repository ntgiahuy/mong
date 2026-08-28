import type { Inputs } from '../types'
import { faceStations, meshStations } from '../lib/calc'

type Props = {
  inp: Inputs
}

export function Schematic({ inp }: Props) {
  const W = 320
  const H = 430
  const pad = 36
  const totalH = inp.hCom + inp.hCm + inp.hDm
  const sV = 210 / Math.max(totalH + inp.lining, 1)
  const sH = 210 / Math.max(inp.yMong, inp.xMong, 1)
  const s = Math.min(sV, sH)

  const colW = inp.yCo * s
  const baseW = inp.yMong * s
  const y1s = inp.y1 * s
  const hCom = inp.hCom * s
  const hCm = inp.hCm * s
  const hDm = inp.hDm * s
  const hLot = inp.lining * s

  const x0 = (W - baseW) / 2
  const top = 28
  const colX = x0 + y1s
  const yColTop = top
  const ySlopeTop = yColTop + hCom
  const yBaseTop = ySlopeTop + hCm
  const yBaseBot = yBaseTop + hDm
  const yLotBot = yBaseBot + hLot

  const planTop = yLotBot + 48
  const ps = 150 / Math.max(inp.xMong, inp.yMong, 1)
  const pw = inp.xMong * ps
  const ph = inp.yMong * ps
  const px = (W - pw) / 2
  const py = planTop
  const pcx = px + inp.x1 * ps
  const pcy = py + inp.y1 * ps
  const pcw = inp.xCo * ps
  const pch = inp.yCo * ps

  const yellow = '#f4e27a'
  const steel = '#7cff6b'
  const outline = '#e8e8e8'

  return (
    <svg className="schematic" viewBox={`0 0 ${W} ${H}`} width="100%" role="img" aria-label="Sơ đồ móng">
      <rect width={W} height={H} fill="#2f2f2f" />
      <polygon
        points={`${x0},${yBaseTop} ${x0 + baseW},${yBaseTop} ${x0 + baseW},${yBaseBot} ${x0},${yBaseBot}`}
        fill="#5a5a5a"
        stroke={outline}
      />
      <polygon
        points={`${x0},${yBaseTop} ${colX - 50 * s},${ySlopeTop} ${colX + colW + 50 * s},${ySlopeTop} ${x0 + baseW},${yBaseTop}`}
        fill="#525252"
        stroke={outline}
      />
      <rect x={colX} y={yColTop} width={colW} height={hCom} fill="#4a4a4a" stroke={outline} />
      <rect x={x0 - 6} y={yBaseBot} width={baseW + 12} height={hLot} fill="#6b6b6b" stroke={outline} />

      {faceStations(inp.cy, inp.yCo, inp.coverCol).map((mm, i) => {
        const x = colX + mm * s
        const dir = x < colX + colW / 2 ? -1 : 1
        const hook = 12
        return (
          <path
            key={`cy${i}`}
            d={`M ${x} ${yColTop + 6} L ${x} ${yBaseBot - 8} L ${x + dir * hook} ${yBaseBot - 8}`}
            fill="none"
            stroke={steel}
            strokeWidth={2}
          />
        )
      })}
      {Array.from({ length: Math.min(6, Math.max(2, Math.floor(inp.hCom / inp.aStirrup))) }).map((_, i) => (
        <line
          key={`st${i}`}
          x1={colX + 6}
          x2={colX + colW - 6}
          y1={yColTop + 16 + i * Math.max(14, (hCom - 24) / 5)}
          y2={yColTop + 16 + i * Math.max(14, (hCom - 24) / 5)}
          stroke={steel}
          strokeWidth={1}
          opacity={0.8}
        />
      ))}
      <line x1={x0 + 10} x2={x0 + baseW - 10} y1={yBaseBot - 10} y2={yBaseBot - 10} stroke={steel} strokeWidth={2} />
      {meshStations(inp.yMong, inp.coverBase, inp.aFaX).map((mm, i) => (
        <circle key={`fa${i}`} cx={x0 + mm * s} cy={yBaseBot - 10} r={2.2} fill={steel} />
      ))}

      <text x={W - pad + 8} y={yColTop + hCom / 2} fill={yellow} fontSize={11} textAnchor="end">
        Hcom
      </text>
      <text x={W - pad + 8} y={ySlopeTop + hCm / 2} fill={yellow} fontSize={11} textAnchor="end">
        Hcm
      </text>
      <text x={W - pad + 8} y={yBaseTop + hDm / 2} fill={yellow} fontSize={11} textAnchor="end">
        Hdm
      </text>
      <text x={W - 4} y={yColTop + 4} fill="#9fd4ff" fontSize={9} textAnchor="end">
        CDN
      </text>
      <text x={W - 4} y={yColTop + 22} fill="#9fd4ff" fontSize={9} textAnchor="end">
        CDG
      </text>
      <line x1={x0} x2={x0 + baseW} y1={ySlopeTop + 8} y2={ySlopeTop + 8} stroke="#e25b5b" strokeDasharray="4 3" />
      <text x={W - 4} y={ySlopeTop + 12} fill="#e25b5b" fontSize={9} textAnchor="end">
        CDTN
      </text>
      <text x={W - 4} y={yLotBot} fill="#9fd4ff" fontSize={9} textAnchor="end">
        CDM
      </text>
      <text x={colX - 8} y={yBaseBot - 18} fill={yellow} fontSize={10} textAnchor="end">
        FaX
      </text>
      <text x={x0 + baseW + 4} y={yBaseBot - 6} fill={yellow} fontSize={10}>
        FaY
      </text>

      <rect x={px} y={py} width={pw} height={ph} fill="none" stroke={outline} />
      <rect x={pcx} y={pcy} width={pcw} height={pch} fill="none" stroke="#7ec8ff" />
      <line x1={px} y1={py} x2={pcx} y2={pcy} stroke="#888" />
      <line x1={px + pw} y1={py} x2={pcx + pcw} y2={pcy} stroke="#888" />
      <line x1={px} y1={py + ph} x2={pcx} y2={pcy + pch} stroke="#888" />
      <line x1={px + pw} y1={py + ph} x2={pcx + pcw} y2={pcy + pch} stroke="#888" />
      <text x={px + pw / 2} y={py - 6} fill={yellow} fontSize={10} textAnchor="middle">
        Xmong
      </text>
      <text x={px - 6} y={py + ph / 2} fill={yellow} fontSize={10} textAnchor="end">
        Ymong
      </text>
      <text x={px + inp.xCc * ps} y={py + ph + 14} fill="#9fd4ff" fontSize={9} textAnchor="middle">
        Xcc
      </text>
      <text x={pcx + pcw / 2} y={pcy + pch / 2 + 3} fill="#7ec8ff" fontSize={9} textAnchor="middle">
        Xcot×Ycot
      </text>
      <text x={px + inp.x1 * ps * 0.5} y={py + ph + 14} fill={yellow} fontSize={9} textAnchor="middle">
        X1
      </text>
      <text x={px + pw + 8} y={py + inp.y1 * ps} fill={yellow} fontSize={9}>
        Y1
      </text>
    </svg>
  )
}

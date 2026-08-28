import type { CalcResult, Inputs, RebarRow } from '../types'
import { t, type Lang } from '../i18n'
import { columnPerimeterPts, faceStations, meshStations } from '../lib/calc'

type Props = {
  inp: Inputs
  result: CalcResult
  lang: Lang
}

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
}: {
  x: number
  y1: number
  y2: number
  label: string | number
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
      <text x={x + 6} y={mid + 3} fontSize={10} fill="#111">
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

function BarShape({ row }: { row: RebarRow }) {
  const h = 52
  const w = 168
  if (row.shape === 'straight') {
    const L = row.segs[0] ?? row.length
    return (
      <svg width={w} height={h} viewBox="0 0 168 52">
        <line x1={16} y1={28} x2={152} y2={28} stroke="#111" strokeWidth={2} />
        <text x={84} y={22} textAnchor="middle" fontSize={10}>
          {L}
        </text>
      </svg>
    )
  }
  if (row.shape === 'u') {
    const [leg, mid] = row.segs
    return (
      <svg width={w} height={h} viewBox="0 0 168 52">
        <path d="M28 10 V38 H140 V10" fill="none" stroke="#111" strokeWidth={2} />
        <text x={84} y={50} textAnchor="middle" fontSize={9}>
          {mid}
        </text>
        <text x={18} y={28} fontSize={9}>
          {leg}
        </text>
      </svg>
    )
  }
  if (row.shape === 'L') {
    const [hook, straight] = row.segs
    return (
      <svg width={w} height={h} viewBox="0 0 168 52">
        <path d="M20 38 H52 V10" fill="none" stroke="#111" strokeWidth={2} />
        <text x={36} y={50} textAnchor="middle" fontSize={9}>
          {hook}
        </text>
        <text x={88} y={24} fontSize={9}>
          {straight}
        </text>
      </svg>
    )
  }
  const [a, b, hook] = row.segs
  return (
    <svg width={w} height={h} viewBox="0 0 168 52">
      <rect x={48} y={10} width={70} height={30} fill="none" stroke="#111" strokeWidth={2} />
      <path d="M48 16 H36" stroke="#111" strokeWidth={2} fill="none" />
      <path d="M48 40 H36" stroke="#111" strokeWidth={2} fill="none" />
      <text x={83} y={28} textAnchor="middle" fontSize={9}>
        {b}
      </text>
      <text x={130} y={28} fontSize={9}>
        {a}
      </text>
      <text x={28} y={14} fontSize={8}>
        {hook}
      </text>
    </svg>
  )
}

function SectionDrawing({
  axis,
  inp,
  result,
  title,
}: {
  axis: 'x' | 'y'
  inp: Inputs
  result: CalcResult
  title: string
}) {
  const widthMm = axis === 'x' ? inp.xMong : inp.yMong
  const colMm = axis === 'x' ? inp.xCo : inp.yCo
  const leftMm = axis === 'x' ? inp.x1 : inp.y1
  const nFace = Math.max(2, axis === 'x' ? inp.cx : inp.cy)
  const faceName = axis === 'x' ? 'Cx' : 'Cy'
  // A-A (cắt theo X): FaX là thanh nằm, FaY là chấm. B-B ngược lại.
  const aDot = axis === 'x' ? inp.aFaY : inp.aFaX
  const dDot = axis === 'x' ? inp.dFaY : inp.dFaX
  const dLine = axis === 'x' ? inp.dFaX : inp.dFaY
  const aLine = axis === 'x' ? inp.aFaX : inp.aFaY
  const nLine = axis === 'x' ? result.nMeshX : result.nMeshY
  const nDot = axis === 'x' ? result.nMeshY : result.nMeshX
  const lineIsBottom = axis === 'x' ? inp.bottomLayerX : !inp.bottomLayerX
  const meshX = result.bars.find((b) => b.label.includes('FaX'))
  const meshY = result.bars.find((b) => b.label.includes('FaY'))
  const markLong = (axis === 'x' ? meshX : meshY)?.mark ?? (axis === 'x' ? 1 : 2)
  const markTrans = (axis === 'x' ? meshY : meshX)?.mark ?? (axis === 'x' ? 2 : 1)
  const colMark = result.bars.find((b) => b.shape === 'L')?.mark ?? 3
  const stirMark = result.bars.find((b) => b.shape === 'stirrup')?.mark ?? 4

  const totalH = inp.hCom + inp.hCm + inp.hDm
  const W = 430
  const s = Math.min(250 / widthMm, 250 / (totalH + inp.lining + (inp.fType === 'sand' ? 80 : 0)))
  const ox = 70
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

  const faceXs = faceStations(nFace, colMm, inp.coverCol).map((mm) => colX + mm * s)
  const transXs = meshStations(widthMm, inp.coverBase, aDot).map((mm) => ox + mm * s)

  const yLong = lineIsBottom ? y3 - cover : y3 - cover - dotR * 2 - 4
  const yTrans = lineIsBottom ? y3 - cover - lineW - dotR - 3 : y3 - cover
  const yTrans2 = yTrans + (lineIsBottom ? -(dotR * 2 + 3) : dotR * 2 + 3)
  const labelOnRight = ox + bw - (colX + cw) >= 56
  const tagX = labelOnRight ? Math.min(colX + cw + 16, ox + bw - 8) : colX - 16
  const textX = labelOnRight ? tagX + 12 : tagX - 12
  const textAnchor = labelOnRight ? 'start' : 'end'
  const yMainLab = y0 + Math.max(22, hs.com * 0.32)
  const yStirLab = y0 + Math.max(10, hs.com * 0.12)
  const captionY = y4 + sandH + 58
  const H = captionY + 16

  return (
    <svg className="cad" viewBox={`0 0 ${W} ${H}`} width="100%">
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

      <line
        x1={ox + cover}
        y1={yLong}
        x2={ox + bw - cover}
        y2={yLong}
        stroke="#111"
        strokeWidth={lineW}
      />
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
        transXs.map((x, i) => (
          <circle key={`d2${i}`} cx={x} cy={yTrans2} r={dotR} fill="#111" />
        ))}

      <Tag n={colMark} x={tagX} y={yMainLab} />
      <text x={textX} y={yMainLab + 4} textAnchor={textAnchor} fontSize={11} fontWeight={700}>
        {faceName} {nFace}Ø{inp.dMain}
      </text>
      <text x={textX} y={yMainLab + 17} textAnchor={textAnchor} fontSize={10} fontWeight={700}>
        Σ {result.nCol}Ø{inp.dMain}
      </text>
      <Tag n={stirMark} x={tagX} y={yStirLab} />
      <text x={textX} y={yStirLab + 4} textAnchor={textAnchor} fontSize={10}>
        Ø{inp.dStirrup}a{inp.aStirrup}
      </text>
      <Tag n={markLong} x={ox + bw * 0.22} y={yLong - 16} />
      <text x={ox + bw * 0.22 + 12} y={yLong - 12} fontSize={10}>
        {axis === 'x' ? 'FaX' : 'FaY'} {nLine}Ø{dLine}a{aLine}
      </text>
      <Tag n={markTrans} x={ox + bw * 0.62} y={yTrans - 16} />
      <text x={ox + bw * 0.62 + 12} y={yTrans - 12} fontSize={10}>
        {axis === 'x' ? 'FaY' : 'FaX'} {nDot}Ø{dDot}a{aDot}
      </text>

      <text x={ox + bw + 8} y={y4 - 2} fontSize={9}>
        LỚP BÊ TÔNG LÓT MÓNG
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

      <VDim x={ox - 22} y1={y3} y2={y4} label={inp.lining} />
      <VDim x={ox - 22} y1={y2} y2={y3} label={inp.hDm} />
      <VDim x={ox - 22} y1={y1} y2={y2} label={inp.hCm} />
      <VDim x={ox - 44} y1={y0} y2={y3} label={totalH} />

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
      <DrawingCaption x={ox + bw / 2} y={captionY} title={title} />
    </svg>
  )
}


function PlanDrawing({
  inp,
  result,
  title,
}: {
  inp: Inputs
  result: CalcResult
  title: string
}) {
  const W = 430
  const s = Math.min(300 / inp.xMong, 250 / inp.yMong)
  const ox = 55
  const oy = 28
  const w = inp.xMong * s
  const h = inp.yMong * s
  const cx = ox + inp.x1 * s
  const cy = oy + inp.y1 * s
  const cw = inp.xCo * s
  const ch = inp.yCo * s
  const nx = meshStations(inp.xMong, inp.coverBase, inp.aFaY)
  const ny = meshStations(inp.yMong, inp.coverBase, inp.aFaX)
  const colDots = columnPerimeterPts(inp.cx, inp.cy, inp.xCo, inp.yCo, inp.coverCol)
  const captionY = oy + h + 68
  const H = captionY + 16

  return (
    <svg className="cad" viewBox={`0 0 ${W} ${H}`} width="100%">
      <rect x={ox} y={oy} width={w} height={h} fill="#f3f3f3" stroke="#111" strokeWidth={1.5} />
      <rect x={cx} y={cy} width={cw} height={ch} fill="#e4e4e4" stroke="#111" strokeWidth={1.5} />
      <line x1={ox} y1={oy} x2={cx} y2={cy} stroke="#666" />
      <line x1={ox + w} y1={oy} x2={cx + cw} y2={cy} stroke="#666" />
      <line x1={ox} y1={oy + h} x2={cx} y2={cy + ch} stroke="#666" />
      <line x1={ox + w} y1={oy + h} x2={cx + cw} y2={cy + ch} stroke="#666" />

      {nx.map((mm, i) => {
        const x = ox + mm * s
        return (
          <line
            key={`x${i}`}
            x1={x}
            y1={oy + inp.coverBase * s}
            x2={x}
            y2={oy + h - inp.coverBase * s}
            stroke="#333"
            strokeWidth={Math.max(0.7, inp.dFaY / 16)}
          />
        )
      })}
      {ny.map((mm, i) => {
        const y = oy + mm * s
        return (
          <line
            key={`y${i}`}
            x1={ox + inp.coverBase * s}
            y1={y}
            x2={ox + w - inp.coverBase * s}
            y2={y}
            stroke="#333"
            strokeWidth={Math.max(0.7, inp.dFaX / 16)}
          />
        )
      })}

      {colDots.map((p, i) => (
        <circle
          key={`c${i}`}
          cx={cx + p.x * s}
          cy={cy + p.y * s}
          r={Math.max(2.4, inp.dMain / 8)}
          fill="#111"
        />
      ))}

      <line x1={ox - 8} y1={oy + h / 2} x2={ox + w + 8} y2={oy + h / 2} stroke="#111" strokeDasharray="8 4" />
      <text x={ox - 18} y={oy + h / 2 - 4} fontSize={11} fontWeight={700}>
        A
      </text>
      <text x={ox + w + 12} y={oy + h / 2 - 4} fontSize={11} fontWeight={700}>
        A
      </text>
      <line x1={ox + w / 2} y1={oy - 8} x2={ox + w / 2} y2={oy + h + 8} stroke="#111" strokeDasharray="8 4" />
      <text x={ox + w / 2 + 4} y={oy - 10} fontSize={11} fontWeight={700}>
        B
      </text>
      <text x={ox + w / 2 + 4} y={oy + h + 18} fontSize={11} fontWeight={700}>
        B
      </text>

      <HDim x1={ox} x2={ox + inp.coverBase * s} y={oy + h + 28} label={inp.coverBase} below />
      <HDim x1={ox + inp.coverBase * s} x2={cx} y={oy + h + 28} label={Math.round(inp.x1 - inp.coverBase)} below />
      <HDim x1={cx} x2={cx + cw} y={oy + h + 28} label={inp.xCo} below />
      <HDim
        x1={cx + cw}
        x2={ox + w - inp.coverBase * s}
        y={oy + h + 28}
        label={Math.round(result.x2 - inp.coverBase)}
        below
      />
      <HDim x1={ox} x2={ox + w} y={oy + h + 46} label={inp.xMong} below />

      <VDim x={ox + w + 18} y1={oy} y2={cy} label={inp.y1} />
      <VDim x={ox + w + 18} y1={cy} y2={cy + ch} label={inp.yCo} />
      <VDim x={ox + w + 40} y1={oy} y2={oy + h} label={inp.yMong} />

      <Tag n={1} x={ox + 24} y={oy + 22} />
      <text x={ox + 36} y={oy + 26} fontSize={10}>
        FaX {result.nMeshX}Ø{inp.dFaX}a{inp.aFaX}
      </text>
      <Tag n={2} x={ox + w - 90} y={oy + 22} />
      <text x={ox + w - 78} y={oy + 26} fontSize={10}>
        FaY {result.nMeshY}Ø{inp.dFaY}a{inp.aFaY}
      </text>
      <Tag n={3} x={cx + cw / 2} y={cy + ch / 2} />
      <text x={cx + cw / 2 + 12} y={cy + ch / 2 + 4} fontSize={10}>
        Cx×Cy {inp.cx}×{inp.cy} = {result.nCol}Ø{inp.dMain}
      </text>

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

function DetailCallouts({ inp, result }: { inp: Inputs; result: CalcResult }) {
  const meshX = result.bars[0]
  const meshY = result.bars[1]
  const col = result.bars[2]
  const stirrup = result.bars.find((b) => b.shape === 'stirrup')
  return (
    <svg className="cad" viewBox="0 0 220 430" width="100%">
      {meshX && (
        <g transform="translate(10,20)">
          <Tag n={meshX.mark} x={12} y={12} />
          <text x={24} y={16} fontSize={11} fontWeight={700}>
            {meshX.n1}Ø{meshX.d}-L={meshX.length}
          </text>
          <line x1={20} y1={36} x2={190} y2={36} stroke="#111" strokeWidth={2} />
        </g>
      )}
      {meshY && (
        <g transform="translate(10,80)">
          <Tag n={meshY.mark} x={12} y={12} />
          <text x={24} y={16} fontSize={11} fontWeight={700}>
            {meshY.n1}Ø{meshY.d}-L={meshY.length}
          </text>
          <line x1={20} y1={36} x2={200} y2={36} stroke="#111" strokeWidth={2} />
        </g>
      )}
      {col && (
        <g transform="translate(10,150)">
          <Tag n={col.mark} x={12} y={12} />
          <text x={24} y={16} fontSize={11} fontWeight={700}>
            {col.n1}Ø{col.d}-L={col.length}
          </text>
          <path d="M30 70 H70 V20" fill="none" stroke="#111" strokeWidth={2} />
          <text x={50} y={82} fontSize={10}>
            {col.segs[0]}
          </text>
          <text x={78} y={48} fontSize={10}>
            {col.segs[1]}
          </text>
        </g>
      )}
      {stirrup && (
        <g transform="translate(10,260)">
          <Tag n={stirrup.mark} x={12} y={12} />
          <text x={24} y={16} fontSize={11} fontWeight={700}>
            {stirrup.n1}Ø{stirrup.d}-L={stirrup.length}
          </text>
          <rect x={50} y={36} width={70} height={44} fill="none" stroke="#111" strokeWidth={2} />
          <path d="M50 44 H38" stroke="#111" strokeWidth={2} />
          <text x={85} y={60} textAnchor="middle" fontSize={10}>
            {stirrup.segs[1]}
          </text>
          <text x={128} y={60} fontSize={10}>
            {stirrup.segs[0]}
          </text>
        </g>
      )}
      <text x={10} y={400} fontSize={10} fill="#444">
        {inp.industrial ? 'Móng nhà công nghiệp — bu lông neo theo bản vẽ cột.' : ''}
      </text>
    </svg>
  )
}

export function ShopDrawing({ inp, result, lang }: Props) {
  const L = t[lang]

  return (
    <div className="shop-sheet" id="shop-sheet">
      <h1 className="shop-title">{L.resultTitle}</h1>
      <div className="shop-a2-top">
        <SectionDrawing axis="x" inp={inp} result={result} title={L.sectionAA} />
        <SectionDrawing axis="y" inp={inp} result={result} title={L.sectionBB} />
        <PlanDrawing inp={inp} result={result} title={L.plan(inp.name, inp.qty)} />
      </div>
      <div className="shop-a2-bottom">
        <DetailCallouts inp={inp} result={result} />
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
            <li>
              - Ván khuôn móng: {result.formworkFootingExpr}
            </li>
            <li>
              - Ván khuôn cổ cột: {result.formworkNeckExpr}
            </li>
            <li>
              - Bê tông cổ cột: {result.concreteNeckExpr}
            </li>
            <li>
              - Bê tông móng: {result.concreteFootingExpr}
            </li>
            <li>
              - Bê tông lót: {result.concreteLiningExpr}
            </li>
          </ul>
        </div>
      </div>
    </div>
  )
}

import type { CalcResult, Inputs, RebarRow } from '../types'
import { t, type Lang } from '../i18n'

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
  widthMm,
  colMm,
  leftMm,
  lining,
  hDm,
  hCm,
  hCom,
  cover,
  nCol,
  dMain,
  dStirrup,
  aStirrup,
  faBottom,
  faTop,
  nBottom,
  dFaBot,
  aFaBot,
  dFaTop,
  aFaTop,
  cdn,
  cdtn,
  cdm,
  title,
  sand,
  tram,
}: {
  widthMm: number
  colMm: number
  leftMm: number
  lining: number
  hDm: number
  hCm: number
  hCom: number
  cover: number
  nCol: number
  dMain: number
  dStirrup: number
  aStirrup: number
  faBottom: 1 | 2
  faTop: 1 | 2
  nBottom: number
  dFaBot: number
  aFaBot: number
  dFaTop: number
  aFaTop: number
  cdn: number
  cdtn: number
  cdm: number
  title: string
  sand: boolean
  tram: boolean
}) {
  const totalH = hCom + hCm + hDm
  const W = 430
  const H = 430
  const s = Math.min(250 / widthMm, 260 / (totalH + lining + (sand ? 80 : 0)))
  const ox = 70
  const oy = 36
  const bw = widthMm * s
  const cw = colMm * s
  const left = leftMm * s
  const lot = lining * s
  const hs = {
    com: hCom * s,
    cm: hCm * s,
    dm: hDm * s,
  }
  const y0 = oy
  const y1 = y0 + hs.com
  const y2 = y1 + hs.cm
  const y3 = y2 + hs.dm
  const y4 = y3 + lot
  const colX = ox + left
  const sandH = sand ? 18 : 0

  const nDots = Math.max(4, Math.min(14, nBottom))
  const nVert = Math.max(4, Math.min(12, nCol))

  return (
    <svg className="cad" viewBox={`0 0 ${W} ${H}`} width="100%">
      <text x={W / 2} y={16} textAnchor="middle" fontSize={13} fontWeight={700}>
        {title}
      </text>
      <rect x={colX} y={y0} width={cw} height={hs.com} fill="#e9e9e9" stroke="#111" strokeWidth={1.4} />
      <polygon
        points={`${ox},${y2} ${ox + bw},${y2} ${colX + cw},${y1} ${colX},${y1}`}
        fill="#dedede"
        stroke="#111"
        strokeWidth={1.4}
      />
      <rect x={ox} y={y2} width={bw} height={hs.dm} fill="#d8d8d8" stroke="#111" strokeWidth={1.4} />
      <rect x={ox - 8} y={y3} width={bw + 16} height={lot} fill="#c4c4c4" stroke="#111" />
      {sand && (
        <rect x={ox - 10} y={y4} width={bw + 20} height={sandH} fill="#e6d7a8" stroke="#111" />
      )}
      {tram &&
        Array.from({ length: 5 }).map((_, i) => (
          <g key={i}>
            <line
              x1={ox + 20 + i * ((bw - 40) / 4)}
              y1={y4 + sandH}
              x2={ox + 20 + i * ((bw - 40) / 4)}
              y2={y4 + sandH + 22}
              stroke="#111"
              strokeWidth={3}
            />
          </g>
        ))}

      {Array.from({ length: nVert }).map((_, i) => {
        const x = colX + 8 + (i * (cw - 16)) / Math.max(nVert - 1, 1)
        return (
          <line key={i} x1={x} y1={y0 + 8} x2={x} y2={y3 - cover * s} stroke="#111" strokeWidth={1.4} />
        )
      })}
      {Array.from({ length: 5 }).map((_, i) => (
        <rect
          key={i}
          x={colX + 6}
          y={y0 + 18 + i * Math.max(16, hs.com / 6)}
          width={cw - 12}
          height={5}
          fill="none"
          stroke="#111"
          strokeWidth={1}
        />
      ))}
      <line x1={ox + cover * s} y1={y3 - 7} x2={ox + bw - cover * s} y2={y3 - 7} stroke="#111" strokeWidth={1.6} />
      {Array.from({ length: nDots }).map((_, i) => (
        <circle
          key={i}
          cx={ox + cover * s + 4 + (i * (bw - 2 * cover * s - 8)) / Math.max(nDots - 1, 1)}
          cy={y3 - 14}
          r={2.4}
          fill="#111"
        />
      ))}

      <Tag n={3} x={colX + cw / 2} y={y0 + hs.com * 0.45} />
      <text x={colX + cw / 2 + 14} y={y0 + hs.com * 0.45 + 4} fontSize={10}>
        {nCol}Ø{dMain}
      </text>
      <Tag n={4} x={colX + cw + 16} y={y0 + hs.com * 0.22} />
      <text x={colX + cw + 26} y={y0 + hs.com * 0.22 + 4} fontSize={10}>
        Ø{dStirrup}a{aStirrup}
      </text>
      <Tag n={faBottom} x={ox + bw * 0.28} y={y3 - 28} />
      <text x={ox + bw * 0.28 + 12} y={y3 - 24} fontSize={10}>
        Ø{dFaBot}a{aFaBot}
      </text>
      <Tag n={faTop} x={ox + bw * 0.62} y={y3 - 28} />
      <text x={ox + bw * 0.62 + 12} y={y3 - 24} fontSize={10}>
        Ø{dFaTop}a{aFaTop}
      </text>

      <text x={ox + bw + 8} y={y4 - 2} fontSize={9}>
        LỚP BÊ TÔNG LÓT MÓNG
      </text>

      <HDim x1={ox} x2={ox + cover * s} y={y4 + sandH + 18} label={cover} below />
      <HDim x1={ox + cover * s} x2={colX} y={y4 + sandH + 18} label={Math.round(leftMm - cover)} below />
      <HDim x1={colX} x2={colX + cw} y={y4 + sandH + 18} label={colMm} below />
      <HDim
        x1={colX + cw}
        x2={ox + bw - cover * s}
        y={y4 + sandH + 18}
        label={Math.round(widthMm - leftMm - colMm - cover)}
        below
      />
      <HDim x1={ox + bw - cover * s} x2={ox + bw} y={y4 + sandH + 18} label={cover} below />
      <HDim x1={ox} x2={ox + bw} y={y4 + sandH + 36} label={widthMm} below />

      <VDim x={ox - 22} y1={y3} y2={y4} label={lining} />
      <VDim x={ox - 22} y1={y2} y2={y3} label={hDm} />
      <VDim x={ox - 22} y1={y1} y2={y2} label={hCm} />
      <VDim x={ox - 44} y1={y0} y2={y3} label={totalH} />

      <Level x={ox + bw + 8} y={y0} text={fmtLevel(0)} />
      <Level x={ox + bw + 8} y={y0 - cdn * s} text={fmtLevel(cdn)} />
      <line
        x1={ox}
        x2={ox + bw}
        y1={y0 - cdtn * s}
        y2={y0 - cdtn * s}
        stroke="#c33"
        strokeDasharray="5 3"
      />
      <text x={ox + bw + 48} y={y0 - cdtn * s + 3} fontSize={10} fill="#c33">
        {fmtLevel(cdtn)}
      </text>
      <Level x={ox + bw + 8} y={y3} text={fmtLevel(cdm)} />
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
  const H = 400
  const s = Math.min(300 / inp.xMong, 250 / inp.yMong)
  const ox = 55
  const oy = 40
  const w = inp.xMong * s
  const h = inp.yMong * s
  const cx = ox + inp.x1 * s
  const cy = oy + inp.y1 * s
  const cw = inp.xCo * s
  const ch = inp.yCo * s
  const nx = Math.min(12, result.nMeshY)
  const ny = Math.min(12, result.nMeshX)

  return (
    <svg className="cad" viewBox={`0 0 ${W} ${H}`} width="100%">
      <text x={W / 2} y={16} textAnchor="middle" fontSize={13} fontWeight={700}>
        {title}
      </text>
      <rect x={ox} y={oy} width={w} height={h} fill="#f3f3f3" stroke="#111" strokeWidth={1.5} />
      <rect x={cx} y={cy} width={cw} height={ch} fill="#e4e4e4" stroke="#111" strokeWidth={1.5} />
      <line x1={ox} y1={oy} x2={cx} y2={cy} stroke="#666" />
      <line x1={ox + w} y1={oy} x2={cx + cw} y2={cy} stroke="#666" />
      <line x1={ox} y1={oy + h} x2={cx} y2={cy + ch} stroke="#666" />
      <line x1={ox + w} y1={oy + h} x2={cx + cw} y2={cy + ch} stroke="#666" />

      {Array.from({ length: nx }).map((_, i) => {
        const x = ox + 10 + (i * (w - 20)) / Math.max(nx - 1, 1)
        return <line key={`x${i}`} x1={x} y1={oy + 8} x2={x} y2={oy + h - 8} stroke="#333" strokeWidth={0.8} />
      })}
      {Array.from({ length: ny }).map((_, i) => {
        const y = oy + 10 + (i * (h - 20)) / Math.max(ny - 1, 1)
        return <line key={`y${i}`} x1={ox + 8} y1={y} x2={ox + w - 8} y2={y} stroke="#333" strokeWidth={0.8} />
      })}

      {Array.from({ length: Math.min(result.nCol, 16) }).map((_, i) => {
        const cols = Math.max(2, inp.cx)
        const rows = Math.max(2, inp.cy)
        const col = i % cols
        const row = Math.floor(i / cols) % rows
        const x = cx + 8 + (col * (cw - 16)) / Math.max(cols - 1, 1)
        const y = cy + 8 + (row * (ch - 16)) / Math.max(rows - 1, 1)
        return <circle key={i} cx={x} cy={y} r={3} fill="#111" />
      })}

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
        Ø{inp.dFaX}a{inp.aFaX}
      </text>
      <Tag n={2} x={ox + w - 70} y={oy + 22} />
      <text x={ox + w - 58} y={oy + 26} fontSize={10}>
        Ø{inp.dFaY}a{inp.aFaY}
      </text>
      <Tag n={3} x={cx + cw / 2} y={cy + ch / 2} />
      <text x={cx + cw / 2 + 12} y={cy + ch / 2 + 4} fontSize={10}>
        {result.nCol}Ø{inp.dMain}
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
  const faBot = inp.bottomLayerX ? 1 : 2
  const faTop = inp.bottomLayerX ? 2 : 1

  return (
    <div className="shop-sheet" id="shop-sheet">
      <h1 className="shop-title">{L.resultTitle}</h1>
      <div className="shop-grid">
        <DetailCallouts inp={inp} result={result} />
        <SectionDrawing
          widthMm={inp.xMong}
          colMm={inp.xCo}
          leftMm={inp.x1}
          lining={inp.lining}
          hDm={inp.hDm}
          hCm={inp.hCm}
          hCom={inp.hCom}
          cover={inp.coverBase}
          nCol={result.nCol}
          dMain={inp.dMain}
          dStirrup={inp.dStirrup}
          aStirrup={inp.aStirrup}
          faBottom={faBot}
          faTop={faTop}
          nBottom={result.nMeshX}
          dFaBot={inp.bottomLayerX ? inp.dFaX : inp.dFaY}
          aFaBot={inp.bottomLayerX ? inp.aFaX : inp.aFaY}
          dFaTop={inp.bottomLayerX ? inp.dFaY : inp.dFaX}
          aFaTop={inp.bottomLayerX ? inp.aFaY : inp.aFaX}
          cdn={inp.cdn}
          cdtn={inp.cdtn}
          cdm={result.cdm}
          title={L.sectionAA}
          sand={inp.fType === 'sand'}
          tram={inp.fType === 'tram'}
        />
        <SectionDrawing
          widthMm={inp.yMong}
          colMm={inp.yCo}
          leftMm={inp.y1}
          lining={inp.lining}
          hDm={inp.hDm}
          hCm={inp.hCm}
          hCom={inp.hCom}
          cover={inp.coverBase}
          nCol={result.nCol}
          dMain={inp.dMain}
          dStirrup={inp.dStirrup}
          aStirrup={inp.aStirrup}
          faBottom={faBot}
          faTop={faTop}
          nBottom={result.nMeshY}
          dFaBot={inp.bottomLayerX ? inp.dFaX : inp.dFaY}
          aFaBot={inp.bottomLayerX ? inp.aFaX : inp.aFaY}
          dFaTop={inp.bottomLayerX ? inp.dFaY : inp.dFaX}
          aFaTop={inp.bottomLayerX ? inp.aFaY : inp.aFaX}
          cdn={inp.cdn}
          cdtn={inp.cdtn}
          cdm={result.cdm}
          title={L.sectionBB}
          sand={inp.fType === 'sand'}
          tram={inp.fType === 'tram'}
        />
      </div>
      <div className="shop-grid shop-grid-2">
        <PlanDrawing inp={inp} result={result} title={L.plan(inp.name, inp.qty)} />
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
              - Bê tông lót: {result.concreteLining} m³
            </li>
          </ul>
        </div>
      </div>
    </div>
  )
}

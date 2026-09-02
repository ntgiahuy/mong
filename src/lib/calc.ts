import type { CalcResult, Inputs, RebarRow, SteelByDia } from '../types'

export const DIAMETERS = [6, 8, 10, 12, 14, 16, 18, 20, 22, 25, 28, 32]
/** Pedestal shoulder under the column, each side, when it still fits on the footing. */
export const SHOULDER_MM = 50

export function sideShoulder(offsetMm: number, max = SHOULDER_MM): number {
  if (!Number.isFinite(offsetMm) || offsetMm <= 0.5) return 0
  return Math.min(max, offsetMm)
}

export function pedestalShoulders(i: Inputs): {
  left: number
  right: number
  top: number
  bottom: number
} {
  return {
    left: sideShoulder(i.x1),
    right: sideShoulder(i.xMong - i.x1 - i.xCo),
    top: sideShoulder(i.y1),
    bottom: sideShoulder(i.yMong - i.y1 - i.yCo),
  }
}

/** +1 / −1 so an L-hook stays inside [minX, maxX] instead of sticking out of the concrete. */
export function barHookSign(
  x: number,
  mid: number,
  minX: number,
  maxX: number,
  hook: number,
): 1 | -1 {
  const outward: 1 | -1 = x < mid ? -1 : 1
  const tip = x + outward * hook
  if (tip < minX + 0.5 || tip > maxX - 0.5) return outward === 1 ? -1 : 1
  return outward
}

export const DEFAULT_INPUTS: Inputs = {
  layout: 'center',
  xMong: 1800,
  yMong: 2000,
  xCo: 300,
  xCol: 300,
  yCo: 400,
  yCol: 400,
  hCom: 1500,
  hCm: 300,
  hDm: 200,
  xCc: 900,
  yCc: 1000,
  axisXName: '1',
  axisYName: 'A',
  x1: 750,
  y1: 800,
  cdn: 0,
  cdtn: -800,
  cdg: -100,
  cx: 3,
  cy: 4,
  dMain: 18,
  dStirrup: 6,
  aStirrup: 150,
  dFaX: 12,
  aFaX: 150,
  dFaY: 12,
  aFaY: 150,
  bottomLayerX: false,
  name: 'M1',
  qty: 5,
  fType: 'normal',
  hasBeam: true,
  hBeam: 450,
  stagger: false,
  staggerLap: 30,
  staggerManual: false,
  staggerLeft: 0,
  staggerRight: 0,
  doubleLayer: false,
  hooked: false,
  industrial: false,
  lining: 100,
  coverBase: 50,
  coverCol: 25,
}

/** Sample matching the attached shop-drawing PDF. */
export const SAMPLE_PDF: Inputs = {
  ...DEFAULT_INPUTS,
  layout: 'ecc-x',
  xMong: 2000,
  yMong: 2200,
  xCo: 450,
  xCol: 300,
  yCo: 600,
  yCol: 200,
  hCom: 1550,
  hCm: 300,
  hDm: 200,
  x1: 1000,
  y1: 800,
  xCc: 1225,
  yCc: 1100,
  cdn: 0,
  cdtn: -800,
  cdg: -100,
  cx: 4,
  cy: 3,
  dMain: 18,
  dStirrup: 8,
  aStirrup: 150,
  dFaX: 12,
  aFaX: 150,
  dFaY: 12,
  aFaY: 150,
  name: 'M2',
  qty: 22,
  lining: 50,
  coverBase: 50,
  coverCol: 25,
  hasBeam: true,
  hBeam: 300,
  bottomLayerX: true,
}

const STEEL_DENSITY = 7850

export function kgPerMeter(d: number): number {
  return (Math.PI / 4) * (d / 1000) ** 2 * STEEL_DENSITY
}

function round(n: number, digits = 2): number {
  const p = 10 ** digits
  return Math.round(n * p) / p
}

function roundTo(n: number, step: number): number {
  return Math.round(n / step) * step
}

/** Positions of mesh bars (mm from the start of the span), first/last at cover. */
export function meshStations(span: number, cover: number, spacing: number): number[] {
  const clear = span - 2 * cover
  if (clear <= 0 || spacing <= 0) return [span / 2]
  const n = Math.max(2, Math.floor(clear / spacing) + 1)
  const pts: number[] = []
  for (let i = 0; i < n; i++) {
    const p = cover + i * spacing
    if (p > span - cover + 0.5) break
    pts.push(p)
  }
  if (pts.length === 0) pts.push(span / 2)
  if (pts.length === 1) pts.push(Math.max(pts[0], span - cover))
  return pts
}

function meshCount(span: number, cover: number, spacing: number): number {
  return meshStations(span, cover, spacing).length
}

function colBarCount(cx: number, cy: number): number {
  const nx = Math.max(2, cx)
  const ny = Math.max(2, cy)
  return 2 * (nx + ny - 2)
}

/** Evenly spaced bars on one column face, including corners, inside cover. */
export function faceStations(count: number, size: number, cover: number): number[] {
  const n = Math.max(2, Math.round(count) || 2)
  const inner = Math.max(size - 2 * cover, 1)
  return Array.from({ length: n }, (_, i) => cover + (i * inner) / (n - 1))
}

/** Perimeter column bars in local coordinates (origin at column corner). */
export function columnPerimeterPts(
  cx: number,
  cy: number,
  width: number,
  height: number,
  cover: number,
): { x: number; y: number }[] {
  const xs = faceStations(cx, width, cover)
  const ys = faceStations(cy, height, cover)
  const pts: { x: number; y: number }[] = []
  for (const x of xs) {
    pts.push({ x, y: ys[0] })
    pts.push({ x, y: ys[ys.length - 1] })
  }
  for (let j = 1; j < ys.length - 1; j++) {
    pts.push({ x: xs[0], y: ys[j] })
    pts.push({ x: xs[xs.length - 1], y: ys[j] })
  }
  return pts
}

export const STAGGER_LAPS = [30, 35, 40] as const
export type StaggerLap = (typeof STAGGER_LAPS)[number]

export function normalizeStaggerLap(n: number | undefined): StaggerLap {
  if (n === 35 || n === 40) return n
  return 30
}

export const COL_HOOK_MM = 300

export function colStraightBase(i: Pick<Inputs, 'hCom' | 'hCm' | 'hDm'>): number {
  return Math.max(0, i.hCom + i.hCm + i.hDm - 100)
}

/** Full L-bar length from extra projection above CDN. */
export function barLengthFromExtra(i: Inputs, extraAboveCdn: number): number {
  return colStraightBase(i) + extraAboveCdn + COL_HOOK_MM
}

/** Extra above CDN implied by a typed full bar length. */
export function extraFromBarLength(i: Inputs, barLen: number): number {
  if (!Number.isFinite(barLen)) return 0
  return barLen - COL_HOOK_MM - colStraightBase(i)
}

/** Extra length above CDN. Preset: left nD, right 2nD. Manual: derived from full bar length. */
export function staggerProjection(i: Inputs): {
  one: number
  two: number
  lap: StaggerLap
  manual: boolean
} {
  const lap = normalizeStaggerLap(i.staggerLap)
  if (!i.stagger) return { one: 0, two: 0, lap, manual: false }
  if (i.staggerManual) {
    return {
      one: Math.max(0, extraFromBarLength(i, i.staggerLeft)),
      two: Math.max(0, extraFromBarLength(i, i.staggerRight)),
      lap,
      manual: true,
    }
  }
  return { one: lap * i.dMain, two: 2 * lap * i.dMain, lap, manual: false }
}

export function staggerMin30D(dMain: number): number {
  return 30 * Math.max(1, dMain)
}

export function staggerManualErrors(i: Inputs): string[] {
  if (!i.stagger || !i.staggerManual) return []
  const d30 = staggerMin30D(i.dMain)
  const left = i.staggerLeft
  const right = i.staggerRight
  const extraL = extraFromBarLength(i, left)
  const extraR = extraFromBarLength(i, right)
  const minBar = barLengthFromExtra(i, d30)
  const err: string[] = []
  if (!Number.isFinite(left) || !Number.isFinite(right)) {
    err.push('Nhập chiều dài thanh trái và phải (mm).')
    return err
  }
  if (left === right) err.push('Chiều dài thanh trái và phải không được trùng nhau.')
  if (extraL < d30 || extraR < d30) {
    err.push(`Mỗi thanh phải thò ≥ CDN + 30D (chiều dài thanh tối thiểu ${minBar} mm).`)
  }
  if (Math.abs(extraL - extraR) + 0.5 < d30) {
    err.push(`Nối so le phải chênh lệch ít nhất 30D trên CDN (${d30} mm).`)
  }
  return err
}

export function staggerExtraLabel(mm: number, d: number, manual: boolean): string {
  if (manual) return `+${Math.round(mm)}`
  const n = d > 0 ? Math.round(mm / d) : 0
  return `+${n}D`
}

function clamp(n: number, lo: number, hi: number): number {
  if (!Number.isFinite(n)) return lo
  return Math.min(hi, Math.max(lo, n))
}

export function applyGeometry(i: Inputs, edited?: keyof Inputs): Inputs {
  const next = { ...i }
  const centerX = () => {
    next.x1 = Math.max(0, (next.xMong - next.xCo) / 2)
  }
  const centerY = () => {
    next.y1 = Math.max(0, (next.yMong - next.yCo) / 2)
  }

  if (edited === 'layout') {
    if (next.layout === 'center') {
      centerX()
      centerY()
    } else if (next.layout === 'ecc-x') {
      next.x1 = 0
      centerY()
    } else if (next.layout === 'ecc-y') {
      next.y1 = 0
      centerX()
    } else {
      next.x1 = 0
      next.y1 = 0
    }
  }

  next.x1 = clamp(next.x1, 0, Math.max(0, next.xMong - next.xCo))
  next.y1 = clamp(next.y1, 0, Math.max(0, next.yMong - next.yCo))
  next.xCc = Number.isFinite(next.xCc) ? next.xCc : next.xMong / 2
  next.yCc = Number.isFinite(next.yCc) ? next.yCc : next.yMong / 2
  next.axisXName = (next.axisXName ?? '').slice(0, 4)
  next.axisYName = (next.axisYName ?? '').slice(0, 4)
  next.staggerLap = normalizeStaggerLap(next.staggerLap)
  if (edited === 'staggerManual' && next.staggerManual) {
    const d30 = staggerMin30D(next.dMain)
    const fromLap = next.staggerLap * next.dMain
    const extraL = fromLap >= d30 ? fromLap : d30
    next.staggerLeft = barLengthFromExtra(next, extraL)
    next.staggerRight = barLengthFromExtra(next, extraL + d30)
  }
  if (!Number.isFinite(next.staggerLeft)) next.staggerLeft = 0
  if (!Number.isFinite(next.staggerRight)) next.staggerRight = 0
  return next
}

export function liveColumnSteel(i: Inputs): { n: number; asCm2: number; rho: number } {
  const n = colBarCount(i.cx, i.cy)
  const asMm2 = n * (Math.PI / 4) * i.dMain ** 2
  const asCm2 = asMm2 / 100
  const area = i.xCol * i.yCol
  const rho = area > 0 ? (asMm2 / area) * 100 : 0
  return { n, asCm2: round(asCm2, 2), rho: round(rho, 3) }
}

export function compute(i: Inputs): CalcResult {
  const errors: string[] = []
  if (i.xMong <= 0 || i.yMong <= 0) errors.push('Kích thước móng phải lớn hơn 0.')
  if (i.xCo <= 0 || i.yCo <= 0) errors.push('Kích thước cổ cột phải lớn hơn 0.')
  if (i.xCo > i.xMong || i.yCo > i.yMong) errors.push('Cổ cột không được lớn hơn đế móng.')
  if (i.x1 < 0 || i.y1 < 0) errors.push('Khoảng cách X1/Y1 không hợp lệ.')
  if (i.x1 + i.xCo > i.xMong + 0.5 || i.y1 + i.yCo > i.yMong + 0.5) {
    errors.push('Cột nằm ngoài đế móng. Kiểm tra X1, Y1.')
  }
  if (i.hCom <= 0 || i.hDm <= 0) errors.push('Chiều cao cổ móng / đế móng phải lớn hơn 0.')
  if (i.qty < 1) errors.push('Số lượng cấu kiện phải ≥ 1.')
  if (i.coverBase * 2 >= Math.min(i.xMong, i.yMong)) errors.push('Lớp bảo vệ đế móng quá lớn.')
  if (i.aFaX <= 0 || i.aFaY <= 0 || i.aStirrup <= 0) errors.push('Khoảng cách thép phải lớn hơn 0.')
  errors.push(...staggerManualErrors(i))

  const x2 = i.xMong - i.x1 - i.xCo
  const y2 = i.yMong - i.y1 - i.yCo
  const totalH = i.hCom + i.hCm + i.hDm
  const cdm = -totalH

  const nCol = colBarCount(i.cx, i.cy)
  const live = liveColumnSteel(i)

  const nMeshX = meshCount(i.yMong, i.coverBase, i.aFaX) * (i.doubleLayer ? 2 : 1)
  const nMeshY = meshCount(i.xMong, i.coverBase, i.aFaY) * (i.doubleLayer ? 2 : 1)

  const hookBase = i.hooked ? Math.max(i.hDm - 2 * i.coverBase, 5 * Math.max(i.dFaX, i.dFaY)) : 0
  const lenMeshX = i.xMong - 2 * i.coverBase + 2 * hookBase
  const lenMeshY = i.yMong - 2 * i.coverBase + 2 * hookBase

  const stirrupA = Math.max(40, roundTo(i.xCo - 2 * i.coverCol, 10))
  const stirrupB = Math.max(40, roundTo(i.yCo - 2 * i.coverCol, 10))
  const stirrupHook = Math.max(50, 6 * i.dStirrup)
  const stirrupL = 2 * (stirrupA + stirrupB) + 2 * stirrupHook
  const nStirrup = Math.max(2, Math.floor(Math.max(i.hCom - i.coverCol, 0) / i.aStirrup) + 1)

  const colHook = COL_HOOK_MM
  const colStraightLen = Math.max(0, totalH - 100)
  const proj = staggerProjection(i)
  const straightA = colStraightLen + proj.one
  const straightB = colStraightLen + proj.two
  const colStraight = i.stagger
    ? [roundTo(straightA, 10), roundTo(straightB, 10)]
    : [roundTo(straightA, 10)]

  const qty = Math.max(1, Math.round(i.qty))
  const bars: RebarRow[] = []
  let mark = 1

  const push = (row: Omit<RebarRow, 'mark' | 'nTotal' | 'totalM' | 'kg'>): void => {
    const nTotal = row.n1 * qty
    const totalM = round((row.length * nTotal) / 1000, 2)
    const kg = round(totalM * kgPerMeter(row.d), 2)
    bars.push({ ...row, mark, nTotal, totalM, kg })
    mark += 1
  }

  const meshShape = i.hooked ? 'u' : 'straight'
  const meshSegsX = i.hooked ? [roundTo(hookBase, 10), roundTo(lenMeshX - 2 * hookBase, 10), roundTo(hookBase, 10)] : [roundTo(lenMeshX, 10)]
  const meshSegsY = i.hooked ? [roundTo(hookBase, 10), roundTo(lenMeshY - 2 * hookBase, 10), roundTo(hookBase, 10)] : [roundTo(lenMeshY, 10)]

  push({
    shape: meshShape,
    segs: i.bottomLayerX ? meshSegsX : meshSegsY,
    d: i.bottomLayerX ? i.dFaX : i.dFaY,
    length: i.bottomLayerX ? roundTo(lenMeshX, 10) : roundTo(lenMeshY, 10),
    n1: i.bottomLayerX ? nMeshX : nMeshY,
    label: i.bottomLayerX ? `FaX Ø${i.dFaX}a${i.aFaX}` : `FaY Ø${i.dFaY}a${i.aFaY}`,
  })
  push({
    shape: meshShape,
    segs: i.bottomLayerX ? meshSegsY : meshSegsX,
    d: i.bottomLayerX ? i.dFaY : i.dFaX,
    length: i.bottomLayerX ? roundTo(lenMeshY, 10) : roundTo(lenMeshX, 10),
    n1: i.bottomLayerX ? nMeshY : nMeshX,
    label: i.bottomLayerX ? `FaY Ø${i.dFaY}a${i.aFaY}` : `FaX Ø${i.dFaX}a${i.aFaX}`,
  })

  const nOne = i.stagger ? Math.floor(nCol / 2) : nCol
  const nTwo = i.stagger ? nCol - nOne : 0
  const L0 = colStraight[0] + colHook
  if (nOne > 0) {
    push({
      shape: 'L',
      segs: [colHook, colStraight[0]],
      d: i.dMain,
      length: L0,
      n1: nOne,
      label: i.stagger
        ? `${nOne}Ø${i.dMain} ${staggerExtraLabel(proj.one, i.dMain, proj.manual)}`
        : `${nOne}Ø${i.dMain}`,
    })
  }
  if (i.stagger && nTwo > 0) {
    const L1 = colStraight[1] + colHook
    push({
      shape: 'L',
      segs: [colHook, colStraight[1]],
      d: i.dMain,
      length: L1,
      n1: nTwo,
      label: `${nTwo}Ø${i.dMain} ${staggerExtraLabel(proj.two, i.dMain, proj.manual)}`,
    })
  }

  push({
    shape: 'stirrup',
    segs: [stirrupA, stirrupB, stirrupHook],
    d: i.dStirrup,
    length: stirrupL,
    n1: nStirrup,
    label: `Ø${i.dStirrup}a${i.aStirrup}`,
  })

  const byMap = new Map<number, SteelByDia>()
  for (const b of bars) {
    const cur = byMap.get(b.d) ?? { d: b.d, kg: 0, lengthM: 0, bars117: 0 }
    cur.kg += b.kg
    cur.lengthM += b.totalM
    byMap.set(b.d, cur)
  }
  const byDia = [...byMap.values()]
    .sort((a, b) => a.d - b.d)
    .map((x) => ({
      ...x,
      kg: round(x.kg, 2),
      lengthM: round(x.lengthM, 2),
      bars117: Math.ceil(x.lengthM / 11.7),
    }))

  let kgLe10 = 0
  let kgLe18 = 0
  let kgGt18 = 0
  for (const x of byDia) {
    if (x.d <= 10) kgLe10 += x.kg
    if (x.d <= 18) kgLe18 += x.kg
    if (x.d > 18) kgGt18 += x.kg
  }

  const xm = i.xMong / 1000
  const ym = i.yMong / 1000
  const xc = i.xCo / 1000
  const yc = i.yCo / 1000
  const hdm = i.hDm / 1000
  const hcm = i.hCm / 1000
  const hcom = i.hCom / 1000
  const tLot = i.lining / 1000

  const formworkFooting = round((ym + xm) * 2 * hdm, 2)
  const formworkNeck = round((yc + xc) * 2 * hcom, 2)
  const concreteNeck = round(yc * xc * hcom, 3)
  const sh = pedestalShoulders(i)
  const xcTop = xc + (sh.left + sh.right) / 1000
  const ycTop = yc + (sh.top + sh.bottom) / 1000
  const frustum =
    hcm > 0
      ? (hcm / 3) * (ym * xm + xcTop * ycTop + Math.sqrt(ym * xm * xcTop * ycTop))
      : 0
  const concreteFooting = round(ym * xm * hdm + frustum, 3)
  const concreteLining = round((xm + 0.2) * (ym + 0.2) * tLot, 3)

  const fmt = (n: number) => (Number.isInteger(n) ? String(n) : n.toFixed(2).replace(/\.?0+$/, ''))
  const topAdd = (a: number, b: number, axis: 'X' | 'Y') => {
    const mm = a + b
    if (mm === 100) return `${axis}cot+0.1`
    if (mm < 0.5) return `${axis}cot`
    return `${axis}cot+${fmt(mm / 1000)}`
  }
  const xTopTerm = topAdd(sh.left, sh.right, 'X')
  const yTopTerm = topAdd(sh.top, sh.bottom, 'Y')

  const formworkFootingExpr = `=(Ymong+Xmong)*2*Hdm  —  (${fmt(ym)}+${fmt(xm)})*2*${fmt(hdm)}=${formworkFooting} m²`
  const formworkNeckExpr = `=(Ycot+Xcot)*2*Hcom  —  (${fmt(yc)}+${fmt(xc)})*2*${fmt(hcom)}=${formworkNeck} m²`
  const concreteNeckExpr = `=Ycot*Xcot*Hcom  —  ${fmt(yc)}*${fmt(xc)}*${fmt(hcom)}=${concreteNeck} m³`
  const concreteFootingExpr = `=((Ymong*Xmong*Hdm)+(Hcm/3*(Ymong*Xmong+(${xTopTerm})*(${yTopTerm})+SQRT(Ymong*Xmong*(${xTopTerm})*(${yTopTerm})))))  —  ((${fmt(ym)}*${fmt(xm)}*${fmt(hdm)})+(${fmt(hcm)}/3*(${fmt(ym)}*${fmt(xm)}+${fmt(xcTop)}*${fmt(ycTop)}+SQRT(${fmt(ym)}*${fmt(xm)}*${fmt(xcTop)}*${fmt(ycTop)}))))=${concreteFooting} m³`
  const concreteLiningExpr = `=(Xmong+0.2)*(Ymong+0.2)*Hcom  —  (${fmt(xm)}+0.2)*(${fmt(ym)}+0.2)*${fmt(tLot)}=${concreteLining} m³`

  const stirrupRows = bars.filter((b) => b.shape === 'stirrup')
  const stirrupNote = stirrupRows.map(
    (b) => `Thép đai Ø${b.d}  ${b.segs[0]} x ${b.segs[1]}: ${b.nTotal} cái`,
  )

  const nTram =
    i.fType === 'tram'
      ? Math.max(4, Math.floor(i.xMong / 400) * Math.floor(i.yMong / 400))
      : 0

  return {
    errors,
    nCol,
    asCm2: live.asCm2,
    rhoPct: live.rho,
    bars,
    byDia,
    kgLe10: round(kgLe10, 2),
    kgLe18: round(kgLe18, 2),
    kgGt18: round(kgGt18, 2),
    stirrupNote,
    formworkFooting,
    formworkNeck,
    concreteFooting,
    concreteNeck,
    concreteLining,
    formworkFootingExpr,
    formworkNeckExpr,
    concreteFootingExpr,
    concreteNeckExpr,
    concreteLiningExpr,
    nMeshX,
    nMeshY,
    lenMeshX: roundTo(lenMeshX, 10),
    lenMeshY: roundTo(lenMeshY, 10),
    nStirrup,
    stirrupA,
    stirrupB,
    stirrupL,
    colHook,
    colStraight,
    x2,
    y2,
    totalH,
    cdm,
    nTram,
  }
}

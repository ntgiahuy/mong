import type { CalcResult, Inputs, RebarRow, SteelByDia } from '../types'

export const DIAMETERS = [6, 8, 10, 12, 14, 16, 18, 20, 22, 25, 28, 32]

export const DEFAULT_INPUTS: Inputs = {
  layout: 'center',
  xMong: 1500,
  yMong: 1600,
  xCo: 300,
  xCol: 220,
  yCo: 300,
  yCol: 220,
  hCom: 1250,
  hCm: 250,
  hDm: 300,
  xCc: 750,
  yCc: 800,
  x1: 600,
  y1: 650,
  cdn: -50,
  cdtn: -600,
  cdg: -50,
  cx: 4,
  cy: 2,
  dMain: 18,
  dStirrup: 6,
  aStirrup: 150,
  dFaX: 10,
  aFaX: 150,
  dFaY: 10,
  aFaY: 150,
  bottomLayerX: true,
  name: 'MD1',
  qty: 1,
  fType: 'normal',
  hasBeam: true,
  hBeam: 300,
  stagger: false,
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
  cdn: -100,
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
  hasBeam: false,
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

export function applyGeometry(i: Inputs, edited?: keyof Inputs): Inputs {
  const next = { ...i }
  const syncFromX1 = () => {
    next.xCc = next.x1 + next.xCo / 2
  }
  const syncFromY1 = () => {
    next.yCc = next.y1 + next.yCo / 2
  }
  const centerX = () => {
    next.x1 = (next.xMong - next.xCo) / 2
    next.xCc = next.xMong / 2
  }
  const centerY = () => {
    next.y1 = (next.yMong - next.yCo) / 2
    next.yCc = next.yMong / 2
  }

  if (edited === 'xCc') next.x1 = next.xCc - next.xCo / 2
  if (edited === 'yCc') next.y1 = next.yCc - next.yCo / 2

  if (next.layout === 'center') {
    centerX()
    centerY()
  } else if (next.layout === 'ecc-x') {
    centerY()
    syncFromX1()
  } else if (next.layout === 'ecc-y') {
    centerX()
    syncFromY1()
  } else {
    if (edited !== 'xCc') syncFromX1()
    if (edited !== 'yCc') syncFromY1()
  }
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

  const colHook = roundTo(Math.max(250, 16 * i.dMain), 10)
  const splice = 40 * i.dMain
  const embed = i.hCm + i.hDm - i.coverBase
  const straightA = i.hCom + embed + splice
  const straightB = i.stagger ? straightA + 40 * i.dMain : straightA
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

  const nLong = i.stagger ? Math.ceil(nCol / 2) : nCol
  const nShort = i.stagger ? nCol - nLong : 0
  const L0 = colStraight[0] + colHook
  push({
    shape: 'L',
    segs: [colHook, colStraight[0]],
    d: i.dMain,
    length: L0,
    n1: nLong,
    label: `${nLong}Ø${i.dMain}`,
  })
  if (i.stagger && nShort > 0) {
    const L1 = colStraight[1] + colHook
    push({
      shape: 'L',
      segs: [colHook, colStraight[1]],
      d: i.dMain,
      length: L1,
      n1: nShort,
      label: `${nShort}Ø${i.dMain}`,
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
  const xcTop = xc + 0.1
  const ycTop = yc + 0.1
  const frustum =
    hcm > 0
      ? (hcm / 3) * (ym * xm + xcTop * ycTop + Math.sqrt(ym * xm * xcTop * ycTop))
      : 0
  const concreteFooting = round(ym * xm * hdm + frustum, 3)
  const concreteLining = round((xm + 0.1) * (ym + 0.1) * tLot, 3)

  const fmt = (n: number) => (Number.isInteger(n) ? String(n) : n.toFixed(2).replace(/\.?0+$/, ''))

  const formworkFootingExpr = `=(Ymong+Xmong)*2*Hdm  —  (${fmt(ym)}+${fmt(xm)})*2*${fmt(hdm)}=${formworkFooting} m²`
  const formworkNeckExpr = `=(Ycot+Xcot)*2*Hcom  —  (${fmt(yc)}+${fmt(xc)})*2*${fmt(hcom)}=${formworkNeck} m²`
  const concreteNeckExpr = `=Ycot*Xcot*Hcom  —  ${fmt(yc)}*${fmt(xc)}*${fmt(hcom)}=${concreteNeck} m³`
  const concreteFootingExpr = `=((Ymong*Xmong*Hdm)+(Hcm/3*(Ymong*Xmong+(Xcot+0.1)*(Ycot+0.1)+SQRT(Ymong*Xmong*(Xcot+0.1)*(Ycot+0.1)))))  —  ((${fmt(ym)}*${fmt(xm)}*${fmt(hdm)})+(${fmt(hcm)}/3*(${fmt(ym)}*${fmt(xm)}+${fmt(xcTop)}*${fmt(ycTop)}+SQRT(${fmt(ym)}*${fmt(xm)}*${fmt(xcTop)}*${fmt(ycTop)}))))=${concreteFooting} m³`

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

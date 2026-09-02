export type LayoutType = 'ecc-x' | 'ecc-y' | 'ecc-xy' | 'center'
export type FoundationType = 'normal' | 'sand' | 'tram'

export interface Inputs {
  layout: LayoutType
  xMong: number
  yMong: number
  xCo: number
  xCol: number
  yCo: number
  yCol: number
  hCom: number
  hCm: number
  hDm: number
  /** Grid-axis Xcc from footing origin — independent of column center. */
  xCc: number
  /** Grid-axis Ycc from footing origin — independent of column center. */
  yCc: number
  /** Typical CAD bubble labels (e.g. 1 and A). */
  axisXName: string
  axisYName: string
  x1: number
  y1: number
  cdn: number
  cdtn: number
  cdg: number
  cx: number
  cy: number
  dMain: number
  dStirrup: number
  aStirrup: number
  dFaX: number
  aFaX: number
  dFaY: number
  aFaY: number
  bottomLayerX: boolean
  name: string
  qty: number
  fType: FoundationType
  hasBeam: boolean
  hBeam: number
  stagger: boolean
  doubleLayer: boolean
  hooked: boolean
  industrial: boolean
  lining: number
  coverBase: number
  coverCol: number
}

export type BarShape = 'straight' | 'u' | 'L' | 'stirrup'

export interface RebarRow {
  mark: number
  shape: BarShape
  segs: number[]
  d: number
  length: number
  n1: number
  nTotal: number
  totalM: number
  kg: number
  label: string
}

export interface SteelByDia {
  d: number
  kg: number
  lengthM: number
  bars117: number
}

export interface CalcResult {
  errors: string[]
  nCol: number
  asCm2: number
  rhoPct: number
  bars: RebarRow[]
  byDia: SteelByDia[]
  kgLe10: number
  kgLe18: number
  kgGt18: number
  stirrupNote: string[]
  formworkFooting: number
  formworkNeck: number
  concreteFooting: number
  concreteNeck: number
  concreteLining: number
  formworkFootingExpr: string
  formworkNeckExpr: string
  concreteFootingExpr: string
  concreteNeckExpr: string
  concreteLiningExpr: string
  nMeshX: number
  nMeshY: number
  lenMeshX: number
  lenMeshY: number
  nStirrup: number
  stirrupA: number
  stirrupB: number
  stirrupL: number
  colHook: number
  colStraight: number[]
  x2: number
  y2: number
  totalH: number
  cdm: number
  nTram: number
}

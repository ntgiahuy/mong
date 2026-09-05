import type { Inputs } from '../types'
import { applyGeometry, DEFAULT_INPUTS } from './calc'

export const PROJECT_FILENAME = 'monh-shopdrawing.json'
export const PROJECT_KIND = 'monh-shopdrawing'
export const PROJECT_VERSION = 1

export type ProjectFile = {
  kind: typeof PROJECT_KIND
  version: number
  savedAt?: string
  inputs: Inputs
}

export function serializeProject(inputs: Inputs): string {
  const file: ProjectFile = {
    kind: PROJECT_KIND,
    version: PROJECT_VERSION,
    savedAt: new Date().toISOString(),
    inputs,
  }
  return `${JSON.stringify(file, null, 2)}\n`
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function looksLikeInputs(value: unknown): value is Partial<Inputs> {
  return isRecord(value) && typeof value.xMong === 'number' && typeof value.yMong === 'number'
}

/** Accepts a wrapped project file or a raw Inputs dump (same shape as localStorage). */
export function parseProject(raw: unknown): Inputs | null {
  if (!isRecord(raw)) return null
  if (raw.kind !== undefined && raw.kind !== PROJECT_KIND) return null
  if (looksLikeInputs(raw.inputs)) {
    return applyGeometry({ ...DEFAULT_INPUTS, ...raw.inputs })
  }
  if (raw.kind === undefined && looksLikeInputs(raw)) {
    return applyGeometry({ ...DEFAULT_INPUTS, ...raw })
  }
  return null
}

export function downloadProject(inputs: Inputs, filename = PROJECT_FILENAME) {
  const blob = new Blob([serializeProject(inputs)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}

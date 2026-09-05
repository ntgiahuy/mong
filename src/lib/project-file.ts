import type { Inputs } from '../types'
import { applyGeometry, DEFAULT_INPUTS } from './calc'

export const PROJECT_FILENAME = '[Giahuy.net]-shop_mong.json'
export const PROJECT_KIND = 'giahuy-shop-mong'
const LEGACY_KINDS = new Set(['giahuy-shop-mong', 'monh-shopdrawing'])
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
  if (raw.kind !== undefined && !LEGACY_KINDS.has(String(raw.kind))) return null
  if (looksLikeInputs(raw.inputs)) {
    return applyGeometry({ ...DEFAULT_INPUTS, ...raw.inputs })
  }
  if (raw.kind === undefined && looksLikeInputs(raw)) {
    return applyGeometry({ ...DEFAULT_INPUTS, ...raw })
  }
  return null
}

type SavePickerWindow = Window & {
  showSaveFilePicker?: (options: {
    suggestedName?: string
    types?: { description: string; accept: Record<string, string[]> }[]
  }) => Promise<{
    createWritable: () => Promise<{ write: (data: Blob) => Promise<void>; close: () => Promise<void> }>
  }>
}

export async function downloadProject(inputs: Inputs, filename = PROJECT_FILENAME) {
  const blob = new Blob([serializeProject(inputs)], { type: 'application/json;charset=utf-8' })
  const picker = window as SavePickerWindow
  if (typeof picker.showSaveFilePicker === 'function') {
    try {
      const handle = await picker.showSaveFilePicker({
        suggestedName: filename,
        types: [
          {
            description: filename,
            accept: { 'application/json': ['.json'] },
          },
        ],
      })
      const writable = await handle.createWritable()
      await writable.write(blob)
      await writable.close()
      return
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') return
    }
  }

  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.setAttribute('download', filename)
  a.rel = 'noopener'
  a.style.display = 'none'
  document.body.appendChild(a)
  a.click()
  a.remove()
  window.setTimeout(() => URL.revokeObjectURL(url), 2000)
}

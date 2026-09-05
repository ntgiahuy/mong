import { useEffect, useMemo, useRef, useState } from 'react'
import { CadViewport } from './components/CadViewport'
import { FoundationForm } from './components/FoundationForm'
import { Schematic } from './components/Schematic'
import { ShopDrawing } from './components/ShopDrawing'
import { t, type Lang } from './i18n'
import {
  applyGeometry,
  compute,
  DEFAULT_INPUTS,
} from './lib/calc'
import { downloadProject, parseProject } from './lib/project-file'
import { fitShopSheetForPrint, resetShopSheetAfterPrint } from './lib/print-sheet'
import type { Inputs } from './types'

const STORAGE_KEY = 'giahuy-shop-thep-mong'

function loadSaved(): Inputs | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as Partial<Inputs>
    return applyGeometry({ ...DEFAULT_INPUTS, ...parsed })
  } catch {
    return null
  }
}

export default function App() {
  const lang: Lang = 'vi'
  const fileRef = useRef<HTMLInputElement>(null)
  const [inp, setInp] = useState<Inputs>(() => loadSaved() ?? DEFAULT_INPUTS)
  const [busy, setBusy] = useState<'pdf' | 'cad' | null>(null)
  const [showResult, setShowResult] = useState(true)
  const [cadView, setCadView] = useState(false)
  const [cadHint, setCadHint] = useState(false)
  const [ioError, setIoError] = useState('')
  const [savedFlash, setSavedFlash] = useState(false)
  const result = useMemo(() => compute(inp), [inp])
  const L = t[lang]

  useEffect(() => {
    const before = () => fitShopSheetForPrint()
    const after = () => resetShopSheetAfterPrint()
    window.addEventListener('beforeprint', before)
    window.addEventListener('afterprint', after)
    return () => {
      window.removeEventListener('beforeprint', before)
      window.removeEventListener('afterprint', after)
    }
  }, [])

  const patch = (partial: Partial<Inputs>, edited?: keyof Inputs) => {
    setInp((prev) => applyGeometry({ ...prev, ...partial }, edited))
  }

  function showShop() {
    setIoError('')
    setShowResult(true)
    if (result.errors.length) return
    requestAnimationFrame(() => {
      document.getElementById('shop-sheet')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    })
  }

  async function withSheet(kind: 'pdf' | 'cad', run: (el: HTMLElement) => Promise<void> | void) {
    if (result.errors.length) {
      setShowResult(true)
      return
    }
    setBusy(kind)
    setIoError('')
    setShowResult(true)
    await new Promise((r) => requestAnimationFrame(() => r(null)))
    await new Promise((r) => setTimeout(r, 80))
    const el = document.getElementById('shop-sheet')
    if (!el) {
      setBusy(null)
      return
    }
    try {
      await run(el)
    } catch (err) {
      setIoError(err instanceof Error ? err.message : String(err))
    } finally {
      setBusy(null)
    }
  }

  function downloadPdf() {
    void withSheet('pdf', async (el) => {
      const { exportShopPdf } = await import('./lib/pdf')
      await exportShopPdf(el, `${inp.name || 'mong'}-shop-thep.pdf`)
    })
  }

  function cadFilename(name: string): string {
    const base = (name || 'mong').replace(/[^\w.-]+/g, '_') || 'mong'
    const d = new Date()
    const p = (n: number) => String(n).padStart(2, '0')
    const stamp = `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}-${p(d.getHours())}${p(d.getMinutes())}${p(d.getSeconds())}`
    return `${base}-shop-thep-${stamp}.dxf`
  }

  function downloadCad() {
    void withSheet('cad', async (el) => {
      const { exportShopDxf } = await import('./lib/dxf')
      exportShopDxf(el, cadFilename(inp.name))
      setCadHint(true)
    })
  }

  function saveFile() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(inp))
      setSavedFlash(true)
      window.setTimeout(() => setSavedFlash(false), 1600)
    } catch {
      setIoError('Không lưu được trên trình duyệt này.')
    }
  }

  function saveAsFile() {
    try {
      downloadProject(inp)
      setIoError('')
    } catch {
      setIoError('Không tải được file JSON.')
    }
  }

  function openProjectFile(file: File) {
    const reader = new FileReader()
    reader.onload = () => {
      try {
        const parsed: unknown = JSON.parse(String(reader.result))
        const next = parseProject(parsed)
        if (!next) {
          setIoError(L.openBadProject)
          return
        }
        setInp(next)
        setIoError('')
      } catch {
        setIoError(L.openBadJson)
      }
    }
    reader.onerror = () => setIoError(L.openBadJson)
    reader.readAsText(file)
  }

  return (
    <div className="app">
      <header className="topbar">
        <div className="brand">
          <a
            className="brand-logo"
            href="https://www.giahuy.net/"
            target="_blank"
            rel="noopener noreferrer"
            title="GiaHuy.Net"
          >
            <img
              src={`${import.meta.env.BASE_URL}giahuy-logo.png`}
              alt="GiaHuy"
              width={171}
              height={47}
            />
          </a>
          <div className="brand-copy">
            <h1>{L.title}</h1>
            <p>{L.subtitle}</p>
          </div>
        </div>
        <div className="top-actions">
          <button
            type="button"
            className="btn-ghost"
            onClick={() => {
              setInp(DEFAULT_INPUTS)
              setIoError('')
            }}
          >
            <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
              <path
                d="M8 4.5h6.2L19 9.2V19.5H8z"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.7"
                strokeLinejoin="round"
              />
              <path d="M14.2 4.5V9.2H19" fill="none" stroke="currentColor" strokeWidth="1.7" />
              <path d="M12 11.5v6M9 14.5h6" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
            </svg>
            {L.newFile}
          </button>
          <input
            ref={fileRef}
            type="file"
            accept=".json,application/json"
            hidden
            onChange={(e) => {
              const file = e.target.files?.[0]
              e.target.value = ''
              if (file) openProjectFile(file)
            }}
          />
          <button
            type="button"
            className="btn-ghost"
            title={L.openTitle}
            onClick={() => fileRef.current?.click()}
          >
            <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
              <path
                d="M4 8h5.2l1.5 1.8H20V18.5H4z"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.7"
                strokeLinejoin="round"
              />
              <path
                d="M4 10.2V7.2h6.1L11.6 9"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.7"
                strokeLinejoin="round"
              />
            </svg>
            {L.openFile}
          </button>
          <button type="button" className="btn-ghost" title={L.saveAsTitle} onClick={saveAsFile}>
            <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
              <path
                d="M6 4.5h10.2L19.5 8v11.5H6z"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.7"
                strokeLinejoin="round"
              />
              <path
                d="M8.2 4.5v4.4h8.2V4.5M8.2 19.5v-6.2h7.6v6.2"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.7"
              />
            </svg>
            {L.saveAs}
          </button>
          <button type="button" className="btn-save" onClick={saveFile}>
            <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
              <path
                d="M6 4.5h10.2L19.5 8v11.5H6z"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.7"
                strokeLinejoin="round"
              />
              <path d="M8.2 4.5v4.4h8.2V4.5M8.2 19.5v-6.2h7.6v6.2" fill="none" stroke="currentColor" strokeWidth="1.7" />
            </svg>
            {savedFlash ? L.saved : L.save}
          </button>
          <button type="button" className="btn-blue" onClick={downloadPdf} disabled={busy !== null}>
            <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
              <path
                d="M12 4.5v10M8.5 11.5 12 15l3.5-3.5M6 19.5h12"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.7"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            {busy === 'pdf' ? L.exporting : L.exportPdf}
          </button>
        </div>
      </header>

      <div className="workspace">
        <div className="form-cols">
          <FoundationForm inp={inp} lang={lang} onChange={patch} />
        </div>
        <aside className="side">
          <Schematic inp={inp} />
          <button type="button" className="go" onClick={showShop}>
            <span className="go-label">{L.action}</span>
            <span className="go-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none">
                <path
                  d="M5 12h12.5M13 6.5 19.5 12 13 17.5"
                  stroke="currentColor"
                  strokeWidth="1.7"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </span>
          </button>
        </aside>
      </div>

      {showResult && result.errors.length > 0 && (
        <div className="banner error" role="alert">
          <strong>{L.errors}</strong>
          <ul>
            {result.errors.map((e) => (
              <li key={e}>{e}</li>
            ))}
          </ul>
        </div>
      )}
      {ioError && (
        <div className="banner error" role="alert">
          {ioError}
        </div>
      )}

      {showResult && result.errors.length === 0 && (
        <section className={`result-wrap${cadView ? ' cad-mode' : ''}`}>
          <div className="result-toolbar">
            <button type="button" className="btn-blue" onClick={downloadPdf} disabled={busy !== null}>
              {busy === 'pdf' ? L.exporting : L.exportPdf}
            </button>
            <button type="button" className="btn-ghost" onClick={downloadCad} disabled={busy !== null}>
              {busy === 'cad' ? L.exportingCad : L.downloadCad}
            </button>
            <button
              type="button"
              className={cadView ? 'btn-ghost btn-on' : 'btn-ghost'}
              onClick={() => setCadView((v) => !v)}
            >
              {cadView ? L.cadViewOff : L.cadView}
            </button>
            <button
              type="button"
              className="btn-ghost"
              onClick={() => {
                fitShopSheetForPrint()
                window.print()
              }}
            >
              {L.print}
            </button>
          </div>
          {cadHint && (
            <div className="cad-lock" role="status">
              <strong>{L.cadLockTitle}</strong>
              <ol>
                {L.cadLockSteps.map((step) => (
                  <li key={step}>{step}</li>
                ))}
              </ol>
            </div>
          )}
          <p className="cad-note">{L.cadNote}</p>
          <CadViewport active={cadView} hint={L.cadHint}>
            <ShopDrawing inp={inp} result={result} lang={lang} />
          </CadViewport>
        </section>
      )}
    </div>
  )
}

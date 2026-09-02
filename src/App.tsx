import { useEffect, useMemo, useState } from 'react'
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
import { fitShopSheetForPrint, resetShopSheetAfterPrint } from './lib/print-sheet'
import type { Inputs } from './types'

export default function App() {
  const [lang, setLang] = useState<Lang>('vi')
  const [inp, setInp] = useState<Inputs>(DEFAULT_INPUTS)
  const [busy, setBusy] = useState<'pdf' | 'cad' | null>(null)
  const [showResult, setShowResult] = useState(true)
  const [cadView, setCadView] = useState(false)
  const [cadHint, setCadHint] = useState(false)
  const [ioError, setIoError] = useState('')
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

  return (
    <div className="app">
      <header className="topbar">
        <div>
          <h1 className="brand-title">
            <span>{L.title}</span>
            <a
              className="brand-logo"
              href="https://www.giahuy.net/"
              target="_blank"
              rel="noopener noreferrer"
            >
              <img
                src="https://blogger.googleusercontent.com/img/a/AVvXsEiAjFLnRTzRxbo61AZk5rhwAzRue6rDxzwFDj5yJ9cTBoENU1eZXOL6XGqA_kNVI2DRa7de49yYikTmRf8LD8v4E1rxlSPvBNl7lgl-uNozT5GIxRxL5Bh67lIKGGPLV6BLTDXEr8GZ8_Lg2ph1fTscaVaREtZZy5KDhdD-CojQj3JcAOa2MNMoJaf42OQ=w200"
                alt="GiaHuy.Net"
                width={200}
                height={100}
              />
            </a>
          </h1>
          <p>{L.subtitle}</p>
        </div>
        <div className="top-actions">
          <button type="button" className="ghost" onClick={() => setInp(DEFAULT_INPUTS)}>
            {L.reset}
          </button>
          <button type="button" className="en-btn" onClick={() => setLang(lang === 'vi' ? 'en' : 'vi')}>
            {lang === 'vi' ? 'EN' : 'VI'}
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
            <button type="button" className="ghost" onClick={downloadPdf} disabled={busy !== null}>
              {busy === 'pdf' ? L.exporting : L.download}
            </button>
            <button type="button" className="ghost" onClick={downloadCad} disabled={busy !== null}>
              {busy === 'cad' ? L.exportingCad : L.downloadCad}
            </button>
            <button
              type="button"
              className={cadView ? 'ghost ghost-on' : 'ghost'}
              onClick={() => setCadView((v) => !v)}
            >
              {cadView ? L.cadViewOff : L.cadView}
            </button>
            <button
              type="button"
              className="ghost"
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

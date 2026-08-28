import { useMemo, useState } from 'react'
import { FoundationForm } from './components/FoundationForm'
import { Schematic } from './components/Schematic'
import { ShopDrawing } from './components/ShopDrawing'
import { t, type Lang } from './i18n'
import {
  applyGeometry,
  compute,
  DEFAULT_INPUTS,
  SAMPLE_PDF,
} from './lib/calc'
import type { Inputs } from './types'

export default function App() {
  const [lang, setLang] = useState<Lang>('vi')
  const [inp, setInp] = useState<Inputs>(DEFAULT_INPUTS)
  const [busy, setBusy] = useState(false)
  const [showResult, setShowResult] = useState(false)
  const [showEmbed, setShowEmbed] = useState(false)
  const [copied, setCopied] = useState(false)
  const [pdfError, setPdfError] = useState('')
  const result = useMemo(() => compute(inp), [inp])
  const L = t[lang]

  const patch = (partial: Partial<Inputs>, edited?: keyof Inputs) => {
    setInp((prev) => applyGeometry({ ...prev, ...partial }, edited))
  }

  const iframeCode = `<iframe src="${typeof window !== 'undefined' ? window.location.href.split('#')[0] : ''}" width="100%" height="980" style="border:0;max-width:1200px" loading="lazy" allow="download"></iframe>`

  function showShop() {
    setPdfError('')
    setShowResult(true)
    if (result.errors.length) return
    requestAnimationFrame(() => {
      document.getElementById('shop-sheet')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    })
  }

  async function downloadPdf() {
    if (result.errors.length) {
      setShowResult(true)
      return
    }
    setBusy(true)
    setPdfError('')
    setShowResult(true)
    await new Promise((r) => requestAnimationFrame(() => r(null)))
    await new Promise((r) => setTimeout(r, 80))
    const el = document.getElementById('shop-sheet')
    if (!el) {
      setBusy(false)
      return
    }
    try {
      const { exportShopPdf } = await import('./lib/pdf')
      await exportShopPdf(el, `${inp.name || 'mong'}-shop-thep.pdf`)
    } catch (err) {
      setPdfError(err instanceof Error ? err.message : String(err))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="app">
      <header className="topbar">
        <div>
          <h1>{L.title}</h1>
          <p>{L.subtitle}</p>
        </div>
        <div className="top-actions">
          <button type="button" className="ghost" onClick={() => setInp(SAMPLE_PDF)}>
            {L.sample}
          </button>
          <button type="button" className="ghost" onClick={() => setInp(DEFAULT_INPUTS)}>
            {L.reset}
          </button>
          <a className="ghost" href={`${import.meta.env.BASE_URL}tai-github-pages.html`}>
            {L.downloadPages}
          </a>
          <button type="button" className="ghost" onClick={() => setShowEmbed(true)}>
            {L.blogger}
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
            {L.action}
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
      {pdfError && (
        <div className="banner error" role="alert">
          PDF: {pdfError}
        </div>
      )}

      {showResult && result.errors.length === 0 && (
        <section className="result-wrap">
          <div className="result-toolbar">
            <button type="button" className="ghost" onClick={() => void downloadPdf()} disabled={busy}>
              {busy ? L.exporting : L.download}
            </button>
            <button type="button" className="ghost" onClick={() => window.print()}>
              {L.print}
            </button>
          </div>
          <ShopDrawing inp={inp} result={result} lang={lang} />
        </section>
      )}

      {showEmbed && (
        <div className="modal" role="dialog" aria-modal="true">
          <div className="modal-card">
            <h2>{L.embedTitle}</h2>
            <p>{L.embedBody}</p>
            <p>
              <strong>{L.embedStep1t}</strong> {L.embedStep1}
            </p>
            <p>
              <strong>{L.embedStep2t}</strong> {L.embedStep2}
            </p>
            <textarea readOnly value={iframeCode} rows={4} />
            <p>
              <strong>{L.embedStep3t}</strong>
            </p>
            <ul>
              <li>{L.embedStep3a}</li>
              <li>{L.embedStep3b}</li>
            </ul>
            <p className="embed-warn">{L.embedWarn}</p>
            <div className="modal-actions">
              <button
                type="button"
                className="ghost"
                onClick={() => {
                  void navigator.clipboard.writeText(iframeCode)
                  setCopied(true)
                  setTimeout(() => setCopied(false), 1500)
                }}
              >
                {copied ? L.copied : L.copy}
              </button>
              <button type="button" className="ghost" onClick={() => setShowEmbed(false)}>
                {L.close}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

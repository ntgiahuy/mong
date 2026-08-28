import html2canvas from 'html2canvas'
import { jsPDF } from 'jspdf'

const SHEET_PX = 1782

const CLONE_CSS = `
.app, .result-wrap, .shop-scroll, #root, body, html {
  max-width: none !important;
  width: auto !important;
  overflow: visible !important;
  height: auto !important;
  padding: 0 !important;
  margin: 0 !important;
  background: #fff !important;
}
.shop-scroll {
  overflow: visible !important;
  max-width: none !important;
}
.shop-sheet {
  width: ${SHEET_PX}px !important;
  max-width: none !important;
  overflow: visible !important;
  border: 2px solid #111 !important;
  box-shadow: none !important;
  background: #fff !important;
  padding: 10px 44px 16px 14px !important;
}
.shop-a2 {
  display: grid !important;
  grid-template-columns: max-content 220px max-content minmax(36px, 1fr) !important;
  grid-template-rows: auto auto !important;
  column-gap: 0 !important;
  justify-items: start !important;
}
.shop-aa { grid-column: 1 !important; grid-row: 1 !important; margin-left: 0 !important; }
.shop-callouts { grid-column: 2 !important; grid-row: 1 !important; margin-left: -48px !important; }
.shop-bb { grid-column: 3 !important; grid-row: 1 !important; margin-left: -72px !important; }
.shop-plan { grid-column: 1 !important; grid-row: 2 !important; margin-left: 0 !important; }
.shop-sched { grid-column: 3 !important; grid-row: 2 !important; margin-left: -72px !important; max-width: 820px !important; padding-right: 8px !important; }
`

export async function exportShopPdf(el: HTMLElement, filename: string): Promise<void> {
  const scroller = el.parentElement
  const prevScroll = scroller?.scrollLeft ?? 0
  if (scroller) scroller.scrollLeft = 0
  try {
    const canvas = await html2canvas(el, {
      scale: 2,
      backgroundColor: '#ffffff',
      useCORS: true,
      logging: false,
      scrollX: 0,
      scrollY: -window.scrollY,
      width: SHEET_PX,
      windowWidth: SHEET_PX + 48,
      x: 0,
      y: 0,
      onclone: (doc, cloned) => {
        const style = doc.createElement('style')
        style.setAttribute('data-shop-pdf', '1')
        style.textContent = CLONE_CSS
        doc.head.appendChild(style)
        cloned.style.width = `${SHEET_PX}px`
        cloned.style.maxWidth = 'none'
        cloned.style.overflow = 'visible'
        cloned.style.border = '2px solid #111'
        cloned.style.transform = 'none'
        const parent = cloned.parentElement
        if (parent) {
          parent.style.overflow = 'visible'
          parent.style.maxWidth = 'none'
        }
        void cloned.offsetWidth
      },
    })
    const img = canvas.toDataURL('image/png')
    const pdf = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a2' })
    const pageW = pdf.internal.pageSize.getWidth()
    const pageH = pdf.internal.pageSize.getHeight()
    const margin = 8
    const maxW = pageW - margin * 2
    const maxH = pageH - margin * 2
    const ratio = Math.min(maxW / canvas.width, maxH / canvas.height)
    const w = canvas.width * ratio
    const h = canvas.height * ratio
    pdf.addImage(img, 'PNG', (pageW - w) / 2, (pageH - h) / 2, w, h, undefined, 'FAST')
    pdf.save(filename)
  } finally {
    if (scroller) scroller.scrollLeft = prevScroll
  }
}

import html2canvas from 'html2canvas'
import { jsPDF } from 'jspdf'

export async function exportShopPdf(el: HTMLElement, filename: string): Promise<void> {
  const canvas = await html2canvas(el, {
    scale: 2,
    backgroundColor: '#ffffff',
    useCORS: true,
    logging: false,
    onclone: (_doc, cloned) => {
      cloned.style.boxShadow = 'none'
      cloned.style.maxHeight = 'none'
      cloned.style.overflow = 'visible'
    },
  })
  const img = canvas.toDataURL('image/png')
  const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a3' })
  const pageW = pdf.internal.pageSize.getWidth()
  const pageH = pdf.internal.pageSize.getHeight()
  const margin = 8
  const maxW = pageW - margin * 2
  const maxH = pageH - margin * 2
  const ratio = Math.min(maxW / canvas.width, maxH / canvas.height)
  const w = canvas.width * ratio
  const h = canvas.height * ratio
  pdf.addImage(img, 'PNG', (pageW - w) / 2, margin, w, h, undefined, 'FAST')
  pdf.save(filename)
}

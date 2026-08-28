/** A2 landscape minus 8 mm margins, in CSS pixels at 96 dpi. */
const A2_PRINT_W = ((594 - 16) * 96) / 25.4
const A2_PRINT_H = ((420 - 16) * 96) / 25.4

/** Scale the A2 sheet to one printed page so A-A / B-B do not split across sheets. */
export function fitShopSheetForPrint(): void {
  const sheet = document.getElementById('shop-sheet')
  const wrap = sheet?.parentElement
  if (!sheet || !wrap) return
  const scale = Math.min(1, A2_PRINT_W / sheet.offsetWidth, A2_PRINT_H / sheet.offsetHeight)
  sheet.style.transformOrigin = 'top left'
  sheet.style.transform = `scale(${scale})`
  wrap.style.width = `${Math.ceil(sheet.offsetWidth * scale)}px`
  wrap.style.height = `${Math.ceil(sheet.offsetHeight * scale)}px`
  wrap.style.overflow = 'hidden'
}

export function resetShopSheetAfterPrint(): void {
  const sheet = document.getElementById('shop-sheet')
  const wrap = sheet?.parentElement
  if (sheet) {
    sheet.style.transform = ''
    sheet.style.transformOrigin = ''
  }
  if (wrap) {
    wrap.style.width = ''
    wrap.style.height = ''
    wrap.style.overflow = ''
  }
}

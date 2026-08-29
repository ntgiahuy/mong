/** Wrap annotation text so DXF matches the CAD-view CSS layout. */

export function wrapTextByWidth(
  text: string,
  maxWidth: number,
  measure: (s: string) => number,
): string[] {
  const t = text.replace(/\s+/g, ' ').trim()
  if (!t) return []
  if (maxWidth <= 0 || measure(t) <= maxWidth) return [t]
  const words = t.split(' ')
  const lines: string[] = []
  let cur = ''
  for (const word of words) {
    const trial = cur ? `${cur} ${word}` : word
    if (!cur || measure(trial) <= maxWidth) {
      cur = trial
      continue
    }
    lines.push(...splitLongToken(cur, maxWidth, measure))
    cur = word
  }
  if (cur) lines.push(...splitLongToken(cur, maxWidth, measure))
  return lines.filter(Boolean)
}

function splitLongToken(
  token: string,
  maxWidth: number,
  measure: (s: string) => number,
): string[] {
  if (measure(token) <= maxWidth) return [token]
  const chars = [...token]
  const lines: string[] = []
  let cur = ''
  for (const ch of chars) {
    const trial = cur + ch
    if (!cur || measure(trial) <= maxWidth) cur = trial
    else {
      lines.push(cur)
      cur = ch
    }
  }
  if (cur) lines.push(cur)
  return lines
}

export function htmlBlockLines(el: Element): string[] {
  const parts: string[] = []
  const walk = (n: Node) => {
    if (n.nodeName === 'BR') {
      parts.push('\n')
      return
    }
    if (n.nodeType === Node.TEXT_NODE) {
      parts.push(n.textContent || '')
      return
    }
    if (n.nodeName === 'SVG' || n.nodeName === 'svg') return
    n.childNodes.forEach(walk)
  }
  walk(el)
  return parts
    .join('')
    .split(/\n/)
    .map((s) => s.replace(/\s+/g, ' ').trim())
    .filter(Boolean)
}

/** AutoCAD TEXT: ASCII file + \U+XXXX / %%c / %%p so Vietnamese and Ø/± survive. */
export function encodeDxfString(s: string): string {
  let out = ''
  for (const ch of s.replace(/\r?\n/g, ' ').trim()) {
    const cp = ch.codePointAt(0) ?? 0
    if (ch === 'Ø' || ch === 'ø' || ch === '∅' || ch === '⌀') {
      out += '%%c'
      continue
    }
    if (ch === '±') {
      out += '%%p'
      continue
    }
    if (ch === '°') {
      out += '%%d'
      continue
    }
    if (ch === '−' || ch === '–' || ch === '—') {
      out += '-'
      continue
    }
    if (ch === '×' || ch === '✕' || ch === '⋅') {
      out += 'x'
      continue
    }
    if (ch === '≤') {
      out += '<='
      continue
    }
    if (ch === '≥') {
      out += '>='
      continue
    }
    if (ch === '²') {
      out += '^2'
      continue
    }
    if (ch === '³') {
      out += '^3'
      continue
    }
    if (ch === '√') {
      out += 'SQRT'
      continue
    }
    if (cp === 0xa0) {
      out += ' '
      continue
    }
    if (cp >= 32 && cp < 127) {
      if (ch === '\\') out += '\\\\'
      else out += ch
      continue
    }
    if (cp > 0xffff) {
      out += '?'
      continue
    }
    out += `\\U+${cp.toString(16).toUpperCase().padStart(4, '0')}`
  }
  return out.slice(0, 480)
}

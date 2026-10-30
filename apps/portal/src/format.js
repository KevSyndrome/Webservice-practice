// Indenta XML de una sola línea; los elementos hoja (<a>texto</a>) quedan en su línea
export function prettyXml(xml) {
  let depth = 0
  return xml
    .replace(/>\s*</g, '>\n<')
    .trim()
    .split('\n')
    .map((line) => {
      if (line.startsWith('</')) depth = Math.max(depth - 1, 0)
      const out = '  '.repeat(depth) + line
      const opens = !line.startsWith('</') && !line.startsWith('<?') && !line.endsWith('/>') && !line.includes('</')
      if (opens) depth++
      return out
    })
    .join('\n')
}

export function prettyBody(body, contentType = '') {
  if (!body) return ''
  if (contentType.includes('json')) {
    try {
      return JSON.stringify(JSON.parse(body), null, 2)
    } catch {
      return body
    }
  }
  if (contentType.includes('xml')) return prettyXml(body)
  return body
}

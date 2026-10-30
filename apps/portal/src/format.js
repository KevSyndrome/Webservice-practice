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

// Escapa texto del usuario antes de meterlo en un sobre SOAP
export function xmlEscape(text) {
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

// Lee productos del formato texto de protobuf que devuelve el puente gRPC
export function protoProducts(text = '') {
  const unquote = (s) => s.replace(/\\(.)/g, '$1')
  const pattern = /id: (\d+)\s+name: "((?:[^"\\]|\\.)*)"\s+price: "((?:[^"\\]|\\.)*)"/g
  return [...text.matchAll(pattern)].map(([, id, name, price]) => ({ id, name: unquote(name), price: unquote(price) }))
}

// Mensaje de error legible para cualquiera de los cuatro contratos, o null si la llamada salió bien
export function problemOf({ status, contentType, body }) {
  if (contentType.includes('json')) {
    try {
      const json = JSON.parse(body)
      if (json.errors?.length) return json.errors.map((e) => e.message).join('; ')
      if (status >= 400) return json.method ? `${json.status}: ${json.error}` : json.detail ?? `HTTP ${status}`
    } catch {
      // cuerpo no es JSON válido: se reporta por el código HTTP
    }
  }
  if (status >= 400) {
    const fault = body.match(/<faultstring[^>]*>([\s\S]*?)<\/faultstring>/)
    return fault ? fault[1] : `HTTP ${status}`
  }
  return null
}

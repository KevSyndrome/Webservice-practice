// Ejecuta una petición y guarda todo lo necesario para mostrarla "como viaja por la red"
export async function call({ method = 'GET', url, headers = {}, body }) {
  const started = performance.now()
  const res = await fetch(url, { method, headers, body })
  const text = await res.text()
  return {
    request: { method, url, headers, body },
    response: {
      status: res.status,
      statusText: res.statusText,
      contentType: res.headers.get('Content-Type') ?? '',
      body: text,
      bytes: new TextEncoder().encode(text).length,
      ms: Math.round(performance.now() - started),
    },
  }
}

export const SOAP_NS = 'http://practice.com/products/v1'

export function soapEnvelope(body) {
  return `<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:p="${SOAP_NS}"><soapenv:Body>${body}</soapenv:Body></soapenv:Envelope>`
}

export const SOAP_HEADERS = { 'Content-Type': 'text/xml; charset=utf-8', SOAPAction: '""' }

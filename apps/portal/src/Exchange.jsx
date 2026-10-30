import { prettyBody } from './format.js'

function rawRequest({ method, url, headers, body }) {
  const lines = [`${method} ${url} HTTP/1.1`, ...Object.entries(headers).map(([k, v]) => `${k}: ${v}`)]
  const contentType = headers['Content-Type'] ?? ''
  return body ? `${lines.join('\n')}\n\n${prettyBody(body, contentType)}` : lines.join('\n')
}

function rawResponse({ status, statusText, contentType, body }) {
  return `HTTP/1.1 ${status} ${statusText}\nContent-Type: ${contentType}\n\n${prettyBody(body, contentType)}`
}

/** Petición y respuesta reales, colapsables. */
export default function Exchange({ exchange, extra }) {
  if (!exchange) return null
  const { request, response } = exchange
  const ok = response.status < 400
  return (
    <div className="exchange">
      <details>
        <summary>Petición</summary>
        <pre>{rawRequest(request)}</pre>
      </details>
      <details>
        <summary>
          Respuesta{' '}
          <span className={ok ? 'status ok' : 'status fail'}>{response.status}</span>{' '}
          <span className="meta">
            {response.bytes} bytes en {response.ms} ms
          </span>
        </summary>
        <pre>{rawResponse(response)}</pre>
      </details>
      {extra}
    </div>
  )
}

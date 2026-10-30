import { prettyBody } from './format.js'

function rawRequest({ method, url, headers, body }) {
  const lines = [`${method} ${url} HTTP/1.1`, ...Object.entries(headers).map(([k, v]) => `${k}: ${v}`)]
  const contentType = headers['Content-Type'] ?? ''
  return body ? `${lines.join('\n')}\n\n${prettyBody(body, contentType)}` : lines.join('\n')
}

function rawResponse({ status, statusText, contentType, body }) {
  return `HTTP/1.1 ${status} ${statusText}\nContent-Type: ${contentType}\n\n${prettyBody(body, contentType)}`
}

/** Bloque colapsable con texto crudo (petición, respuesta o mensaje). */
export function Raw({ title, children }) {
  return (
    <details className="collapse collapse-arrow rounded-none border-b border-base-300">
      <summary className="collapse-title px-0 py-3 min-h-0 font-medium">{title}</summary>
      <div className="collapse-content px-0">
        <pre className="overflow-x-auto bg-base-200 p-4 font-mono text-[0.8125rem] leading-relaxed">{children}</pre>
      </div>
    </details>
  )
}

/** Petición y respuesta reales, colapsables. */
export default function Exchange({ exchange, extra }) {
  if (!exchange) return null
  const { request, response } = exchange
  const ok = response.status < 400
  return (
    <div className="mt-5 border-t border-base-300">
      <Raw title="Petición">{rawRequest(request)}</Raw>
      <Raw
        title={
          <span className="flex flex-wrap items-center gap-2">
            Respuesta
            <span className={`badge badge-sm font-mono ${ok ? 'badge-success' : 'badge-error'}`}>{response.status}</span>
            <span className="font-normal text-muted">
              {response.bytes} bytes en {response.ms} ms
            </span>
          </span>
        }
      >
        {rawResponse(response)}
      </Raw>
      {extra}
    </div>
  )
}

import { useEffect, useState } from 'react'
import { call } from './api.js'
import Exchange from './Exchange.jsx'
import { problemOf } from './format.js'

export const API_DOWN = 'La API no responde. En local, arráncala con ./mvnw spring-boot:run en apps/api.'

function Field({ field, value, onChange }) {
  const props = { value, onChange: (e) => onChange(e.target.value) }
  const wide = field.type === 'textarea'
  return (
    <fieldset className={`fieldset py-0 ${wide ? 'basis-full' : ''}`}>
      <legend className="fieldset-legend text-muted font-normal">{field.label}</legend>
      {wide ? (
        <textarea {...props} rows={field.rows ?? 8} spellCheck={false} className="textarea w-full font-mono text-sm" />
      ) : field.options ? (
        <select {...props} className="select w-56">
          {field.options.map((o) => (
            <option key={o}>{o}</option>
          ))}
        </select>
      ) : (
        <input {...props} className="input w-44" />
      )}
    </fieldset>
  )
}

/** Una operación del catálogo: formulario, resultado y la petición/respuesta reales. */
export default function Operation({ op }) {
  const fields = op.fields ?? []
  const [values, setValues] = useState(() => Object.fromEntries(fields.map((f) => [f.name, f.default ?? ''])))
  const [state, setState] = useState({})

  function run(event) {
    event?.preventDefault()
    const sent = values
    setState((s) => ({ ...s, loading: true }))
    call(op.request(sent))
      .then((exchange) => setState({ exchange, sent }))
      .catch(() => setState({ error: API_DOWN }))
  }

  useEffect(() => {
    if (op.auto) run()
  }, [])

  const { exchange, sent } = state
  const problem = exchange && problemOf(exchange.response)

  return (
    <section className="card bg-base-100 mt-6">
      <div className="card-body gap-4">
        <header className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
          <h3 className="card-title text-lg">{op.title}</h3>
          <code className="font-mono text-sm font-medium text-(--protocol)">{op.endpoint}</code>
        </header>
        {op.note && <p className="max-w-3xl text-sm text-muted">{op.note}</p>}
        {/* noValidate a propósito: los valores inválidos llegan al servidor para ver cómo responde cada contrato */}
        <form className="flex flex-wrap items-end gap-x-4 gap-y-2" onSubmit={run} noValidate>
          {fields.map((f) => (
            <Field key={f.name} field={f} value={values[f.name]} onChange={(v) => setValues((s) => ({ ...s, [f.name]: v }))} />
          ))}
          <button type="submit" className="btn btn-protocol" disabled={state.loading}>
            {state.loading && <span className="loading loading-spinner loading-xs" />}
            {op.action}
          </button>
        </form>
        <div aria-live="polite">
          {state.error && <div role="alert" className="alert alert-error alert-soft">{state.error}</div>}
          {problem && <div role="alert" className="alert alert-error alert-soft">{problem}</div>}
          {exchange && !problem && op.result(exchange)}
        </div>
        <Exchange exchange={exchange} extra={exchange && op.extra?.(sent, exchange)} />
      </div>
    </section>
  )
}

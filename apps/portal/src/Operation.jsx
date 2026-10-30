import { useEffect, useState } from 'react'
import { call } from './api.js'
import Exchange from './Exchange.jsx'
import { problemOf } from './format.js'

export const API_DOWN = 'La API no responde en el puerto 8090. Arráncala con ./mvnw spring-boot:run en apps/api.'

function Field({ field, value, onChange }) {
  const id = `field-${field.name}-${field.op}`
  const props = { id, value, onChange: (e) => onChange(e.target.value) }
  return (
    <label htmlFor={id} className={field.type === 'textarea' ? 'wide' : undefined}>
      {field.label}
      {field.type === 'textarea' ? (
        <textarea {...props} rows={field.rows ?? 8} spellCheck={false} />
      ) : field.options ? (
        <select {...props}>
          {field.options.map((o) => (
            <option key={o}>{o}</option>
          ))}
        </select>
      ) : (
        <input {...props} />
      )}
    </label>
  )
}

/** Una operación del catálogo: formulario, resultado y la petición/respuesta reales. */
export default function Operation({ op }) {
  const fields = (op.fields ?? []).map((f) => ({ ...f, op: op.title }))
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
    <section className="operation">
      <header>
        <h3>{op.title}</h3>
        <code>{op.endpoint}</code>
      </header>
      {op.note && <p className="hint">{op.note}</p>}
      {/* noValidate a propósito: los valores inválidos llegan al servidor para ver cómo responde cada contrato */}
      <form className="inline" onSubmit={run} noValidate>
        {fields.map((f) => (
          <Field key={f.name} field={f} value={values[f.name]} onChange={(v) => setValues((s) => ({ ...s, [f.name]: v }))} />
        ))}
        <button type="submit" disabled={state.loading}>
          {op.action}
        </button>
      </form>
      <div aria-live="polite">
        {state.error && <p className="error">{state.error}</p>}
        {problem && <p className="error">{problem}</p>}
        {exchange && !problem && op.result(exchange)}
      </div>
      <Exchange exchange={exchange} extra={exchange && op.extra?.(sent, exchange)} />
    </section>
  )
}

import { useEffect, useState } from 'react'
import { call, soapEnvelope, SOAP_HEADERS } from './api.js'
import { MODULES } from './modules.jsx'
import Operation, { API_DOWN } from './Operation.jsx'
import './styles.css'

const GROUPS = [
  {
    key: 'propias',
    title: 'APIs propias',
    intro: 'Los mismos productos, guardados en SQLite, expuestos con cuatro contratos distintos.',
  },
  {
    key: 'externas',
    title: 'APIs externas',
    intro: 'Servicios públicos de terceros. El portal solo habla REST con nuestra API y ella traduce al protocolo de cada proveedor.',
  },
]

const PROTOCOLS = ['REST', 'SOAP', 'GraphQL', 'gRPC']

const COMPARISON = [
  ['Formato', 'JSON', 'XML dentro de un Envelope', 'JSON', 'Protobuf (binario)'],
  ['Contrato', 'OpenAPI, opcional', 'WSDL + XSD, obligatorio', 'Esquema SDL', 'Archivo .proto'],
  ['Cómo se llama', 'Verbo HTTP + URL por recurso', 'POST a un solo endpoint', 'POST a /graphql con la consulta', 'Método remoto sobre HTTP/2'],
  ['Errores', 'Código HTTP + problem+json', 'soap:Fault con HTTP 500', 'Lista errors con HTTP 200', 'Código de estado gRPC'],
  ['Precios decimales', 'Número JSON: 499.90 llega como 499.9', 'xs:decimal: llega exacto', 'No hay decimal: se usa String', 'No hay decimal: se usa string'],
]

const WEIGHT_CALLS = [
  ['REST', 'JSON', { url: '/api/v1/products', headers: { Accept: 'application/json' } }],
  ['SOAP', 'XML', { method: 'POST', url: '/ws', headers: SOAP_HEADERS, body: soapEnvelope('<p:listProductsRequest/>') }],
  [
    'GraphQL',
    'JSON',
    { method: 'POST', url: '/graphql', headers: { 'Content-Type': 'application/json' }, body: '{"query":"{ products { id name price } }"}' },
  ],
  ['gRPC', 'Protobuf', { url: '/api/v1/grpc-bridge/products' }],
]

const href = (m) => `#/${m.group}/${m.key}`

function useRoute() {
  const [hash, setHash] = useState(location.hash)
  useEffect(() => {
    const onChange = () => {
      setHash(location.hash)
      window.scrollTo(0, 0)
    }
    addEventListener('hashchange', onChange)
    return () => removeEventListener('hashchange', onChange)
  }, [])
  const [, group, key] = hash.split('/')
  return MODULES.find((m) => m.group === group && m.key === key)
}

// shortcut: sondea cada 10 s; si hiciera falta en tiempo real, usar un endpoint de health con SSE
function useApiOnline() {
  const [online, setOnline] = useState(null)
  useEffect(() => {
    const check = () =>
      fetch('/api/v1/products', { method: 'HEAD' })
        .then((res) => setOnline(res.ok))
        .catch(() => setOnline(false))
    check()
    const timer = setInterval(check, 10000)
    return () => clearInterval(timer)
  }, [])
  return online
}

// Peso real de la misma lista en los cuatro formatos; en gRPC cuenta el mensaje protobuf, no el JSON del puente
function Weight() {
  const [sizes, setSizes] = useState(null)
  useEffect(() => {
    Promise.all(WEIGHT_CALLS.map(([, , request]) => call(request)))
      .then((exchanges) =>
        setSizes(
          exchanges.map((ex, i) => {
            const [protocol, format] = WEIGHT_CALLS[i]
            const bytes = protocol === 'gRPC' ? JSON.parse(ex.response.body).responseBytes : ex.response.bytes
            return { protocol, format, bytes }
          }),
        ),
      )
      .catch(() => setSizes([]))
  }, [])
  if (!sizes) return <span className="loading loading-dots loading-md" aria-label="Midiendo" />
  if (!sizes.length) return <div className="alert alert-error alert-soft max-w-3xl">{API_DOWN}</div>
  const max = Math.max(...sizes.map((s) => s.bytes))
  return (
    <figure className="max-w-3xl" aria-label="Tamaño de la misma lista de productos en cada formato">
      {sizes.map(({ protocol, format, bytes }) => (
        <div key={protocol} data-protocol={protocol} className="mb-2.5 grid grid-cols-[4.5rem_1fr] items-center gap-x-4 sm:grid-cols-[4.5rem_1fr_10rem]">
          <span className="font-semibold text-(--protocol)">{protocol}</span>
          <span className="h-6 bg-base-100">
            <span className="bar-fill block h-full bg-(--protocol) transition-[width] duration-500" style={{ width: `${(bytes / max) * 100}%` }} />
          </span>
          <span className="col-start-2 text-sm tabular-nums sm:col-start-auto sm:text-base">
            {bytes} bytes de {format}
          </span>
        </div>
      ))}
      <figcaption className="mt-2 text-sm text-muted">
        La misma lista de productos medida en vivo. El sobre SOAP pesa más que el dato; protobuf casi no tiene envoltura.
      </figcaption>
    </figure>
  )
}

function Sidebar({ current }) {
  return (
    <aside className="flex min-h-full w-72 flex-col bg-base-100">
      <a href="#/" className="px-6 pt-6 pb-4 text-lg font-semibold tracking-tight">
        Portal de webservices
      </a>
      <ul className="menu w-full gap-0.5 px-3">
        <li>
          <a href="#/" className={current ? undefined : 'menu-active'}>
            Inicio
          </a>
        </li>
        {GROUPS.map((group) => (
          <li key={group.key}>
            <h2 className="menu-title mt-3">{group.title}</h2>
            <ul>
              {MODULES.filter((m) => m.group === group.key).map((m) => (
                <li key={m.key} data-protocol={m.protocol}>
                  <a href={href(m)} className={current === m ? 'menu-active' : undefined} aria-current={current === m ? 'page' : undefined}>
                    <span className="badge badge-xs badge-protocol w-16 shrink-0">{m.protocol}</span>
                    {m.title}
                  </a>
                </li>
              ))}
            </ul>
          </li>
        ))}
      </ul>
    </aside>
  )
}

function Navbar({ module, online }) {
  return (
    <nav className="navbar sticky top-0 z-10 gap-2 border-b border-base-300 bg-base-200/90 px-4 backdrop-blur lg:px-8">
      <label htmlFor="sidebar" className="btn btn-square btn-ghost lg:hidden" aria-label="Abrir menú">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="size-6 stroke-current" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </label>
      <div className="breadcrumbs flex-1 text-sm">
        <ul>
          <li>
            <a href="#/">Inicio</a>
          </li>
          {module && <li>{GROUPS.find((g) => g.key === module.group).title}</li>}
          {module && <li className="font-medium">{module.title}</li>}
        </ul>
      </div>
      {online !== null && (
        <span className={`badge badge-soft ${online ? 'badge-success' : 'badge-error'}`} title="Estado de la API">
          <span className={`status ${online ? 'status-success' : 'status-error'}`} />
          {online ? 'API en línea' : 'API sin respuesta'}
        </span>
      )}
    </nav>
  )
}

function Home() {
  return (
    <>
      <header>
        <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">Mismo dato, distinto contrato</h1>
        <p className="mt-3 mb-8 max-w-2xl text-lg text-muted">
          Cuatro formas de exponer y consumir un webservice. Entra a cada módulo para probar sus operaciones y ver la petición y respuesta tal como
          viajan.
        </p>
        <Weight />
      </header>

      {GROUPS.map((group) => (
        <section key={group.key} className="mt-14">
          <h2 className="text-2xl font-semibold">{group.title}</h2>
          <p className="mt-1 max-w-3xl text-muted">{group.intro}</p>
          <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {MODULES.filter((m) => m.group === group.key).map((m) => (
              <a key={m.key} href={href(m)} data-protocol={m.protocol} className="card group border-t-4 border-(--protocol) bg-base-100">
                <div className="card-body gap-2">
                  <span className="badge badge-sm badge-protocol">{m.protocol}</span>
                  <h3 className="card-title text-base group-hover:underline group-hover:decoration-(--protocol) group-hover:underline-offset-4">
                    {m.title}
                  </h3>
                  <p className="text-sm text-muted">{m.summary}</p>
                  <span className="text-sm font-medium text-(--protocol)">
                    {m.operations.length === 1 ? '1 operación' : `${m.operations.length} operaciones`}
                  </span>
                </div>
              </a>
            ))}
          </div>
        </section>
      ))}

      <section className="mt-14">
        <h2 className="text-2xl font-semibold">Diferencias entre los cuatro</h2>
        <div className="mt-5 overflow-x-auto bg-base-100">
          <table className="table">
            <thead>
              <tr>
                <th scope="col">
                  <span className="sr-only">Aspecto</span>
                </th>
                {PROTOCOLS.map((p) => (
                  <th key={p} scope="col" data-protocol={p} className="border-b-2 border-(--protocol) text-(--protocol)">
                    {p}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {COMPARISON.map(([aspect, ...cells]) => (
                <tr key={aspect}>
                  <th scope="row" className="whitespace-nowrap font-medium text-muted">
                    {aspect}
                  </th>
                  {cells.map((cell, i) => (
                    <td key={i}>{cell}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </>
  )
}

function ModulePage({ module }) {
  return (
    <div data-protocol={module.protocol}>
      <header className="flex flex-col gap-3 border-b-4 border-(--protocol) pb-8">
        <span className="badge badge-protocol">{module.protocol}</span>
        <h1 className="text-4xl font-semibold tracking-tight">{module.title}</h1>
        <p className="max-w-2xl text-lg text-muted">{module.summary}</p>
        <p className="text-sm">
          {module.contract.href ? (
            <a href={module.contract.href} target="_blank" rel="noreferrer" className="link text-(--protocol)">
              {module.contract.label}
            </a>
          ) : (
            <>
              {module.contract.label}: <code className="font-mono">{module.contract.path}</code>
            </>
          )}
        </p>
        {module.bridge && (
          <div role="note" className="alert alert-soft max-w-3xl text-sm">
            El navegador no puede hablar gRPC directamente. El portal llama a un puente HTTP en la API, que hace la llamada gRPC real y devuelve los
            mensajes protobuf que se enviaron y recibieron.
          </div>
        )}
      </header>
      {module.operations.map((op) => (
        <Operation key={op.title} op={op} />
      ))}
    </div>
  )
}

export default function App() {
  const module = useRoute()
  const online = useApiOnline()
  const [menuOpen, setMenuOpen] = useState(false)

  // En celular el sidebar se cierra al navegar
  useEffect(() => setMenuOpen(false), [module])

  return (
    <div className="drawer lg:drawer-open">
      <input id="sidebar" type="checkbox" className="drawer-toggle" checked={menuOpen} onChange={(e) => setMenuOpen(e.target.checked)} />
      <div className="drawer-content min-h-screen bg-base-200">
        <Navbar module={module} online={online} />
        <main className="mx-auto max-w-6xl px-4 py-8 pb-20 lg:px-8 lg:py-12">
          {module ? <ModulePage key={href(module)} module={module} /> : <Home />}
        </main>
      </div>
      <div className="drawer-side z-20 border-r border-base-300">
        <label htmlFor="sidebar" aria-label="Cerrar menú" className="drawer-overlay" />
        <Sidebar current={module} />
      </div>
    </div>
  )
}

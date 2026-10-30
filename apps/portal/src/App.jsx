import { useEffect, useState } from 'react'
import { call, soapEnvelope, SOAP_HEADERS } from './api.js'
import { MODULES } from './modules.jsx'
import Operation from './Operation.jsx'
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

// Peso real de la misma lista en los cuatro formatos; en gRPC cuenta el mensaje protobuf, no el JSON del puente
function Weight() {
  const [sizes, setSizes] = useState(null)
  useEffect(() => {
    Promise.all(WEIGHT_CALLS.map(([, , request]) => call(request)))
      .then((exchanges) =>
        setSizes(
          exchanges.map((ex, i) => {
            const bytes = WEIGHT_CALLS[i][0] === 'gRPC' ? JSON.parse(ex.response.body).responseBytes : ex.response.bytes
            return { protocol: WEIGHT_CALLS[i][0], format: WEIGHT_CALLS[i][1], bytes }
          }),
        ),
      )
      .catch(() => setSizes([]))
  }, [])
  if (!sizes) return null
  if (!sizes.length) return <p className="error">La API no responde en el puerto 8090. Arráncala con ./mvnw spring-boot:run en apps/api.</p>
  const max = Math.max(...sizes.map((s) => s.bytes))
  return (
    <figure className="weight" aria-label="Tamaño de la misma lista de productos en cada formato">
      {sizes.map(({ protocol, format, bytes }) => (
        <div key={protocol} className="bar" data-protocol={protocol}>
          <span className="bar-label">{protocol}</span>
          <span className="bar-track">
            <span className="bar-fill" style={{ width: `${(bytes / max) * 100}%` }} />
          </span>
          <span className="bar-value">
            {bytes} bytes de {format}
          </span>
        </div>
      ))}
      <figcaption>La misma lista de productos medida en vivo. El sobre SOAP pesa más que el dato; protobuf casi no tiene envoltura.</figcaption>
    </figure>
  )
}

function ModuleCard({ module }) {
  return (
    <a className="card" data-protocol={module.protocol} href={`#/${module.group}/${module.key}`}>
      <span className="tag">{module.protocol}</span>
      <h3>{module.title}</h3>
      <p>{module.summary}</p>
      <span className="card-meta">
        {module.operations.length === 1 ? '1 operación' : `${module.operations.length} operaciones`}
      </span>
    </a>
  )
}

function Home() {
  return (
    <>
      <header className="hero">
        <h1>Mismo dato, distinto contrato</h1>
        <p>Cuatro formas de exponer y consumir un webservice. Entra a cada módulo para probar sus operaciones y ver la petición y respuesta tal como viajan.</p>
        <Weight />
      </header>

      {GROUPS.map((group) => (
        <section key={group.key}>
          <h2>{group.title}</h2>
          <p className="hint">{group.intro}</p>
          <div className="cards">
            {MODULES.filter((m) => m.group === group.key).map((m) => (
              <ModuleCard key={m.key} module={m} />
            ))}
          </div>
        </section>
      ))}

      <section>
        <h2>Diferencias entre los cuatro</h2>
        <div className="scroll">
          <table className="comparison">
            <thead>
              <tr>
                <th scope="col">
                  <span className="visually-hidden">Aspecto</span>
                </th>
                {['REST', 'SOAP', 'GraphQL', 'gRPC'].map((p) => (
                  <th key={p} scope="col" data-protocol={p}>
                    {p}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {COMPARISON.map(([aspect, ...cells]) => (
                <tr key={aspect}>
                  <th scope="row">{aspect}</th>
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
  const group = GROUPS.find((g) => g.key === module.group)
  return (
    <div data-protocol={module.protocol}>
      <nav>
        <a href="#/">Todas las APIs</a> / {group.title}
      </nav>
      <header className="module-header">
        <span className="tag">{module.protocol}</span>
        <h1>{module.title}</h1>
        <p>{module.summary}</p>
        <p className="contract">
          {module.contract.href ? (
            <a href={module.contract.href} target="_blank" rel="noreferrer">
              {module.contract.label}
            </a>
          ) : (
            <>
              {module.contract.label}: <code>{module.contract.path}</code>
            </>
          )}
        </p>
        {module.bridge && (
          <p className="hint">
            El navegador no puede hablar gRPC directamente. El portal llama a un puente HTTP en la API, que hace la llamada gRPC real y
            devuelve los mensajes protobuf que se enviaron y recibieron.
          </p>
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
  return <main>{module ? <ModulePage key={`${module.group}/${module.key}`} module={module} /> : <Home />}</main>
}

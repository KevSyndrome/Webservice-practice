import { useEffect, useState } from 'react'
import { call, soapEnvelope, SOAP_HEADERS, SOAP_NS } from './api.js'
import Exchange from './Exchange.jsx'
import './styles.css'

const REST_LIST = { url: '/api/v1/products', headers: { Accept: 'application/json' } }
const SOAP_LIST = { method: 'POST', url: '/ws', headers: SOAP_HEADERS, body: soapEnvelope('<p:listProductsRequest/>') }

const CITIES = [
  { name: 'Ciudad de México', lat: 19.43, lon: -99.13 },
  { name: 'Monterrey', lat: 25.67, lon: -100.31 },
  { name: 'Guadalajara', lat: 20.67, lon: -103.35 },
  { name: 'Madrid', lat: 40.42, lon: -3.7 },
]

const COMPARISON = [
  ['Formato', 'JSON (también puede ser XML)', 'XML dentro de un Envelope', 'JSON', 'Protobuf (binario)'],
  ['Contrato', 'OpenAPI, opcional', 'WSDL + XSD, obligatorio', 'Schema SDL', 'Archivo .proto'],
  ['Cómo se llama', 'Verbo HTTP + URL por recurso', 'POST a un solo endpoint', 'POST a /graphql con la consulta', 'Método remoto sobre HTTP/2'],
  ['Errores', 'Código HTTP + problem+json', 'soap:Fault (HTTP 500)', 'Lista errors con HTTP 200', 'Status code de gRPC'],
  ['En este proyecto', 'Listo', 'Listo', 'Pendiente', 'Pendiente'],
]

const API_DOWN = 'La API no responde en el puerto 8090. Arráncala con ./mvnw spring-boot:run en apps/api.'

function restProducts(exchange) {
  return exchange?.response.status === 200 ? JSON.parse(exchange.response.body) : []
}

function soapProducts(exchange) {
  if (exchange?.response.status !== 200) return []
  const doc = new DOMParser().parseFromString(exchange.response.body, 'text/xml')
  const field = (node, name) => node.getElementsByTagNameNS(SOAP_NS, name)[0]?.textContent
  return [...doc.getElementsByTagNameNS(SOAP_NS, 'product')].map((p) => ({
    id: field(p, 'id'),
    name: field(p, 'name'),
    price: field(p, 'price'),
  }))
}

function Panel({ protocol, title, endpoint, children }) {
  return (
    <article className="panel" data-protocol={protocol}>
      <header>
        <span className="tag">{protocol}</span>
        <h3>{title}</h3>
        <code>{endpoint}</code>
      </header>
      {children}
    </article>
  )
}

function ProductTable({ rows }) {
  return (
    <table>
      <thead>
        <tr><th>Id</th><th>Nombre</th><th className="num">Precio</th></tr>
      </thead>
      <tbody>
        {rows.map((p) => (
          <tr key={p.id}><td>{p.id}</td><td>{p.name}</td><td className="num">{String(p.price)}</td></tr>
        ))}
      </tbody>
    </table>
  )
}

function Weight({ rest, soap }) {
  if (!rest || !soap) return null
  const max = Math.max(rest.response.bytes, soap.response.bytes)
  return (
    <figure className="weight" aria-label="Tamaño de la misma lista de productos en cada formato">
      {[['REST', 'JSON', rest], ['SOAP', 'XML', soap]].map(([protocol, format, ex]) => (
        <div key={protocol} className="bar" data-protocol={protocol}>
          <span className="bar-label">{format}</span>
          <span className="bar-track">
            <span className="bar-fill" style={{ width: `${(ex.response.bytes / max) * 100}%` }} />
          </span>
          <span className="bar-value">{ex.response.bytes} bytes</span>
        </div>
      ))}
      <figcaption>La misma lista de productos. El sobre SOAP y sus namespaces pesan más que el dato.</figcaption>
    </figure>
  )
}

export default function App() {
  const [products, setProducts] = useState({})
  const [created, setCreated] = useState(null)
  const [country, setCountry] = useState({ iso: 'MX' })
  const [weather, setWeather] = useState({ city: CITIES[0] })

  function loadProducts() {
    Promise.all([call(REST_LIST), call(SOAP_LIST)])
      .then(([rest, soap]) => setProducts({ rest, soap }))
      .catch(() => setProducts({ error: API_DOWN }))
  }

  function loadCountry(iso) {
    call({ url: `/api/v1/countries/${encodeURIComponent(iso)}`, headers: { Accept: 'application/json' } })
      .then((exchange) => setCountry({ iso, exchange }))
      .catch(() => setCountry({ iso, error: API_DOWN }))
  }

  function loadWeather(city) {
    call({ url: `/api/v1/weather?lat=${city.lat}&lon=${city.lon}`, headers: { Accept: 'application/json' } })
      .then((exchange) => setWeather({ city, exchange }))
      .catch(() => setWeather({ city, error: API_DOWN }))
  }

  useEffect(() => {
    loadProducts()
    loadCountry('MX')
    loadWeather(CITIES[0])
  }, [])

  function createProduct(event) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    const body = JSON.stringify({ name: form.get('name'), price: form.get('price') })
    call({ method: 'POST', url: '/api/v1/products', headers: { 'Content-Type': 'application/json' }, body })
      .then((exchange) => {
        setCreated(exchange)
        if (exchange.response.status === 201) loadProducts()
      })
      .catch(() => setCreated(null))
  }

  const countryData = country.exchange?.response.status === 200 ? JSON.parse(country.exchange.response.body) : null
  const weatherData = weather.exchange?.response.status === 200 ? JSON.parse(weather.exchange.response.body) : null

  return (
    <main>
      <header className="hero">
        <h1>Mismo dato, distinto contrato</h1>
        <p>
          Cada servicio de este portal muestra su resultado y la petición y respuesta tal como viajan por la red.
        </p>
        <Weight rest={products.rest} soap={products.soap} />
      </header>

      <section>
        <h2>Los cuatro tipos de webservice</h2>
        <div className="scroll">
          <table className="comparison">
            <thead>
              <tr>
                <th scope="col"><span className="visually-hidden">Aspecto</span></th>
                <th scope="col" data-protocol="REST">REST</th>
                <th scope="col" data-protocol="SOAP">SOAP</th>
                <th scope="col">GraphQL</th>
                <th scope="col">gRPC</th>
              </tr>
            </thead>
            <tbody>
              {COMPARISON.map(([aspect, ...cells]) => (
                <tr key={aspect}>
                  <th scope="row">{aspect}</th>
                  {cells.map((cell, i) => (
                    <td key={i} className={cell === 'Pendiente' ? 'pending' : undefined}>{cell}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section>
        <h2>Nuestros servicios: productos</h2>
        {products.error && <p className="error">{products.error}</p>}
        <div className="pair">
          <Panel protocol="REST" title="Listar productos" endpoint="GET /api/v1/products">
            <ProductTable rows={restProducts(products.rest)} />
            <Exchange exchange={products.rest} />
          </Panel>
          <Panel protocol="SOAP" title="Listar productos" endpoint="POST /ws  listProductsRequest">
            <ProductTable rows={soapProducts(products.soap)} />
            <Exchange exchange={products.soap} />
          </Panel>
        </div>

        <Panel protocol="REST" title="Agregar producto" endpoint="POST /api/v1/products">
          <form className="inline" onSubmit={createProduct}>
            <label>
              Nombre
              <input name="name" required />
            </label>
            <label>
              Precio
              <input name="price" type="number" step="0.01" min="0.01" required />
            </label>
            <button type="submit">Agregar producto</button>
          </form>
          <p className="hint">Se crea por REST y aparece en las dos listas: el dato es uno, los contratos son dos.</p>
          <Exchange exchange={created} />
        </Panel>
      </section>

      <section>
        <h2>Servicios externos, a través de nuestra API</h2>
        <p className="hint">
          El portal solo habla REST con nuestra API. La API traduce al protocolo de cada proveedor.
        </p>
        <div className="pair">
          <Panel protocol="SOAP" title="Datos de un país (CountryInfo)" endpoint="GET /api/v1/countries/{iso}">
            <form
              className="inline"
              onSubmit={(e) => {
                e.preventDefault()
                loadCountry(new FormData(e.currentTarget).get('iso'))
              }}
            >
              <label>
                Código ISO de 2 letras
                <input name="iso" defaultValue="MX" maxLength={2} pattern="[A-Za-z]{2}" required />
              </label>
              <button type="submit">Consultar país</button>
            </form>
            {country.error && <p className="error">{country.error}</p>}
            {countryData && (
              <table>
                <tbody>
                  <tr><th scope="row">Nombre</th><td>{countryData.name}</td></tr>
                  <tr><th scope="row">Capital</th><td>{countryData.capital}</td></tr>
                  <tr><th scope="row">Moneda</th><td>{countryData.currency}</td></tr>
                  <tr><th scope="row">Idiomas</th><td>{countryData.languages.join(', ')}</td></tr>
                </tbody>
              </table>
            )}
            <Exchange
              exchange={country.exchange}
              extra={
                <details>
                  <summary>Lo que nuestra API envía a CountryInfo</summary>
                  <pre>{`POST /websamples.countryinfo/CountryInfoService.wso HTTP/1.1
Host: webservices.oorsprong.org
Content-Type: text/xml; charset=utf-8

<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
  <soap:Body>
    <FullCountryInfo xmlns="http://www.oorsprong.org/websamples.countryinfo">
      <sCountryISOCode>${country.iso.toUpperCase()}</sCountryISOCode>
    </FullCountryInfo>
  </soap:Body>
</soap:Envelope>`}</pre>
                </details>
              }
            />
          </Panel>

          <Panel protocol="REST" title="Clima actual (Open-Meteo)" endpoint="GET /api/v1/weather?lat=&lon=">
            <form className="inline" onSubmit={(e) => e.preventDefault()}>
              <label>
                Ciudad
                <select
                  value={weather.city.name}
                  onChange={(e) => loadWeather(CITIES.find((c) => c.name === e.target.value))}
                >
                  {CITIES.map((c) => (
                    <option key={c.name}>{c.name}</option>
                  ))}
                </select>
              </label>
            </form>
            {weather.error && <p className="error">{weather.error}</p>}
            {weatherData && (
              <table>
                <tbody>
                  <tr><th scope="row">Temperatura</th><td>{weatherData.temperatureC} °C</td></tr>
                  <tr><th scope="row">Viento</th><td>{weatherData.windKmh} km/h</td></tr>
                  <tr><th scope="row">Medición (UTC)</th><td>{weatherData.time}</td></tr>
                </tbody>
              </table>
            )}
            <Exchange
              exchange={weather.exchange}
              extra={
                <details>
                  <summary>Lo que nuestra API pide a Open-Meteo</summary>
                  <pre>{`GET /v1/forecast?latitude=${weather.city.lat}&longitude=${weather.city.lon}&current=temperature_2m,wind_speed_10m HTTP/1.1
Host: api.open-meteo.com`}</pre>
                </details>
              }
            />
          </Panel>
        </div>
      </section>
    </main>
  )
}

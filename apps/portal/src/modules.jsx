import { soapEnvelope, SOAP_HEADERS, SOAP_NS } from './api.js'
import { Raw } from './Exchange.jsx'
import { protoProducts, xmlEscape } from './format.js'

const JSON_HEADERS = { 'Content-Type': 'application/json', Accept: 'application/json' }

const json = (exchange) => JSON.parse(exchange.response.body)

const ID_FIELD = { name: 'id', label: 'Id', default: '1' }
const PRODUCT_FIELDS = [
  { name: 'name', label: 'Nombre', default: 'Monitor' },
  { name: 'price', label: 'Precio', default: '3999.00' },
]
const CREATE_NOTE = 'El formulario no valida nada: prueba un precio negativo o un nombre vacío para ver cómo responde este contrato.'

const CITIES = {
  'Ciudad de México': [19.43, -99.13],
  Monterrey: [25.67, -100.31],
  Guadalajara: [20.67, -103.35],
  Madrid: [40.42, -3.7],
}

export function Table({ rows }) {
  if (!rows.length) return <p className="text-sm text-muted">Sin resultados.</p>
  const columns = Object.keys(rows[0])
  const align = (c) => (c === 'price' ? 'text-right tabular-nums' : undefined)
  return (
    <div className="overflow-x-auto">
      <table className="table table-zebra">
        <thead>
          <tr>
            {columns.map((c) => (
              <th key={c} className={align(c)}>{c}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i}>
              {columns.map((c) => (
                <td key={c} className={align(c)}>{String(row[c])}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function Facts({ facts }) {
  return (
    <table className="table">
      <tbody>
        {Object.entries(facts).map(([label, value]) => (
          <tr key={label}>
            <th scope="row" className="w-44 font-medium text-muted">{label}</th>
            <td>{value}</td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

const Upstream = ({ summary, children }) => <Raw title={summary}>{children}</Raw>

function soapProducts(exchange) {
  const doc = new DOMParser().parseFromString(exchange.response.body, 'text/xml')
  const field = (node, name) => node.getElementsByTagNameNS(SOAP_NS, name)[0]?.textContent
  return [...doc.getElementsByTagNameNS(SOAP_NS, 'product')].map((p) => ({
    id: field(p, 'id'),
    name: field(p, 'name'),
    price: field(p, 'price'),
  }))
}

const soap = (body) => ({ method: 'POST', url: '/ws', headers: SOAP_HEADERS, body: soapEnvelope(body) })

const graphql = (query, variables) => ({
  method: 'POST',
  url: '/graphql',
  headers: JSON_HEADERS,
  body: JSON.stringify(variables ? { query, variables } : { query }),
})

// El puente devuelve los mensajes protobuf reales; se muestran aparte de la petición HTTP al puente
function protobufMessages(_sent, exchange) {
  const grpc = json(exchange)
  return (
    <>
      <Upstream summary={`Mensaje protobuf enviado: ${grpc.requestBytes} bytes`}>
        {`${grpc.method}\n\n${grpc.request}`}
      </Upstream>
      {grpc.response && (
        <Upstream summary={`Mensaje protobuf recibido: ${grpc.responseBytes} bytes, estado ${grpc.status}`}>
          {grpc.response}
        </Upstream>
      )}
    </>
  )
}

const LIST_QUERY = `{
  products {
    id
    name
    price
  }
}`

export const MODULES = [
  {
    group: 'propias',
    key: 'rest',
    protocol: 'REST',
    title: 'Productos REST',
    summary: 'Cada producto tiene su URL y se opera con verbos HTTP. Responde JSON.',
    contract: { label: 'Contrato OpenAPI en Swagger UI', href: '/swagger-ui.html' },
    operations: [
      {
        title: 'Listar productos',
        endpoint: 'GET /api/v1/products',
        action: 'Listar productos',
        auto: true,
        request: () => ({ url: '/api/v1/products', headers: { Accept: 'application/json' } }),
        result: (ex) => <Table rows={json(ex)} />,
      },
      {
        title: 'Obtener un producto',
        endpoint: 'GET /api/v1/products/{id}',
        action: 'Buscar producto',
        fields: [ID_FIELD],
        request: (v) => ({ url: `/api/v1/products/${encodeURIComponent(v.id)}`, headers: { Accept: 'application/json' } }),
        result: (ex) => <Table rows={[json(ex)]} />,
      },
      {
        title: 'Crear producto',
        endpoint: 'POST /api/v1/products',
        action: 'Crear producto',
        note: CREATE_NOTE,
        fields: PRODUCT_FIELDS,
        request: (v) => ({
          method: 'POST',
          url: '/api/v1/products',
          headers: JSON_HEADERS,
          body: JSON.stringify({ name: v.name, price: v.price }),
        }),
        result: (ex) => <Table rows={[json(ex)]} />,
      },
    ],
  },
  {
    group: 'propias',
    key: 'soap',
    protocol: 'SOAP',
    title: 'Productos SOAP',
    summary: 'Un solo endpoint; la operación va dentro de un sobre XML validado contra el XSD.',
    contract: { label: 'Contrato WSDL', href: '/ws/products.wsdl' },
    operations: [
      {
        title: 'Listar productos',
        endpoint: 'POST /ws  listProductsRequest',
        action: 'Listar productos',
        auto: true,
        request: () => soap('<p:listProductsRequest/>'),
        result: (ex) => <Table rows={soapProducts(ex)} />,
      },
      {
        title: 'Obtener un producto',
        endpoint: 'POST /ws  getProductRequest',
        action: 'Buscar producto',
        fields: [ID_FIELD],
        request: (v) => soap(`<p:getProductRequest><p:id>${xmlEscape(v.id)}</p:id></p:getProductRequest>`),
        result: (ex) => <Table rows={soapProducts(ex)} />,
      },
      {
        title: 'Enviar un producto nuevo',
        endpoint: 'POST /ws  createProductRequest',
        action: 'Enviar producto',
        note: CREATE_NOTE,
        fields: PRODUCT_FIELDS,
        request: (v) =>
          soap(
            `<p:createProductRequest><p:name>${xmlEscape(v.name)}</p:name><p:price>${xmlEscape(v.price)}</p:price></p:createProductRequest>`,
          ),
        result: (ex) => <Table rows={soapProducts(ex)} />,
      },
    ],
  },
  {
    group: 'propias',
    key: 'graphql',
    protocol: 'GraphQL',
    title: 'Productos GraphQL',
    summary: 'Un solo endpoint; el cliente escribe la consulta y elige qué campos recibir.',
    contract: { label: 'Esquema en el explorador GraphiQL', href: '/graphiql' },
    operations: [
      {
        title: 'Consultar productos',
        endpoint: 'POST /graphql  query products',
        action: 'Ejecutar consulta',
        auto: true,
        note: 'Edita la consulta: quita price o deja solo name y la respuesta cambia de forma.',
        fields: [{ name: 'query', label: 'Consulta', type: 'textarea', default: LIST_QUERY }],
        request: (v) => graphql(v.query),
        result: (ex) => <Table rows={json(ex).data?.products ?? []} />,
      },
      {
        title: 'Obtener un producto',
        endpoint: 'POST /graphql  query product(id)',
        action: 'Buscar producto',
        fields: [ID_FIELD],
        request: (v) =>
          graphql('query Product($id: ID!) { product(id: $id) { id name price } }', { id: v.id }),
        result: (ex) => {
          const product = json(ex).data?.product
          return product ? (
            <Table rows={[product]} />
          ) : (
            <p className="text-sm text-muted">No existe. GraphQL responde product: null con HTTP 200; para él no es un error.</p>
          )
        },
      },
      {
        title: 'Crear producto',
        endpoint: 'POST /graphql  mutation createProduct',
        action: 'Ejecutar mutación',
        note: CREATE_NOTE,
        fields: PRODUCT_FIELDS,
        request: (v) =>
          graphql('mutation Create($input: NewProductInput!) { createProduct(input: $input) { id name price } }', {
            input: { name: v.name, price: v.price },
          }),
        result: (ex) => <Table rows={[json(ex).data.createProduct]} />,
      },
    ],
  },
  {
    group: 'propias',
    key: 'grpc',
    protocol: 'gRPC',
    title: 'Productos gRPC',
    summary: 'Métodos remotos con mensajes protobuf binarios sobre HTTP/2, en el puerto 9095.',
    contract: { label: 'Contrato products.proto', path: 'apps/api/src/main/protobuf/products/v1/products.proto' },
    bridge: true,
    operations: [
      {
        title: 'Listar productos',
        endpoint: 'products.v1.ProductService/ListProducts',
        action: 'Llamar ListProducts',
        auto: true,
        request: () => ({ url: '/api/v1/grpc-bridge/products', headers: { Accept: 'application/json' } }),
        result: (ex) => <Table rows={protoProducts(json(ex).response)} />,
        extra: protobufMessages,
      },
      {
        title: 'Obtener un producto',
        endpoint: 'products.v1.ProductService/GetProduct',
        action: 'Llamar GetProduct',
        fields: [ID_FIELD],
        request: (v) => ({ url: `/api/v1/grpc-bridge/products/${encodeURIComponent(v.id)}`, headers: { Accept: 'application/json' } }),
        result: (ex) => <Table rows={protoProducts(json(ex).response)} />,
        extra: protobufMessages,
      },
      {
        title: 'Crear producto',
        endpoint: 'products.v1.ProductService/CreateProduct',
        action: 'Llamar CreateProduct',
        note: CREATE_NOTE,
        fields: PRODUCT_FIELDS,
        request: (v) => ({
          method: 'POST',
          url: '/api/v1/grpc-bridge/products',
          headers: JSON_HEADERS,
          body: JSON.stringify({ name: v.name, price: v.price }),
        }),
        result: (ex) => <Table rows={protoProducts(json(ex).response)} />,
        extra: protobufMessages,
      },
    ],
  },
  {
    group: 'externas',
    key: 'rest',
    protocol: 'REST',
    title: 'Clima con Open-Meteo',
    summary: 'API pública REST sin llave. Nuestra API la consulta y resume la respuesta.',
    contract: { label: 'Documentación de Open-Meteo', href: 'https://open-meteo.com/en/docs' },
    operations: [
      {
        title: 'Clima actual por ciudad',
        endpoint: 'GET /api/v1/weather?lat=&lon=',
        action: 'Consultar clima',
        auto: true,
        fields: [{ name: 'city', label: 'Ciudad', options: Object.keys(CITIES), default: 'Ciudad de México' }],
        request: (v) => {
          const [lat, lon] = CITIES[v.city]
          return { url: `/api/v1/weather?lat=${lat}&lon=${lon}`, headers: { Accept: 'application/json' } }
        },
        result: (ex) => {
          const w = json(ex)
          return <Facts facts={{ Temperatura: `${w.temperatureC} °C`, Viento: `${w.windKmh} km/h`, 'Medición (UTC)': w.time }} />
        },
        extra: (v) => {
          const [lat, lon] = CITIES[v.city]
          return (
            <Upstream summary="Lo que nuestra API pide a Open-Meteo">
              {`GET /v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,wind_speed_10m HTTP/1.1\nHost: api.open-meteo.com`}
            </Upstream>
          )
        },
      },
    ],
  },
  {
    group: 'externas',
    key: 'soap',
    protocol: 'SOAP',
    title: 'Países con CountryInfo',
    summary: 'Servicio SOAP público. Nuestra API genera su cliente desde el WSDL del proveedor.',
    contract: {
      label: 'WSDL de CountryInfo',
      href: 'http://webservices.oorsprong.org/websamples.countryinfo/CountryInfoService.wso?WSDL',
    },
    operations: [
      {
        title: 'Datos de un país',
        endpoint: 'GET /api/v1/countries/{iso}',
        action: 'Consultar país',
        auto: true,
        note: 'Si el país no existe, CountryInfo no manda un Fault: responde 200 con datos vacíos. Nuestra API lo convierte en 404.',
        fields: [{ name: 'iso', label: 'Código ISO de 2 letras', default: 'MX' }],
        request: (v) => ({ url: `/api/v1/countries/${encodeURIComponent(v.iso)}`, headers: { Accept: 'application/json' } }),
        result: (ex) => {
          const c = json(ex)
          return <Facts facts={{ Nombre: c.name, Capital: c.capital, Moneda: c.currency, Idiomas: c.languages.join(', ') }} />
        },
        extra: (v) => (
          <Upstream summary="Lo que nuestra API envía a CountryInfo">
            {`POST /websamples.countryinfo/CountryInfoService.wso HTTP/1.1
Host: webservices.oorsprong.org
Content-Type: text/xml; charset=utf-8

<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
  <soap:Body>
    <FullCountryInfo xmlns="http://www.oorsprong.org/websamples.countryinfo">
      <sCountryISOCode>${xmlEscape(v.iso.toUpperCase())}</sCountryISOCode>
    </FullCountryInfo>
  </soap:Body>
</soap:Envelope>`}
          </Upstream>
        ),
      },
    ],
  },
  {
    group: 'externas',
    key: 'graphql',
    protocol: 'GraphQL',
    title: 'Países con Countries GraphQL',
    summary: 'API pública GraphQL. Pedimos solo los campos que usamos, con variables.',
    contract: { label: 'Explorador de Countries', href: 'https://countries.trevorblades.com/' },
    operations: [
      {
        title: 'Datos de un país',
        endpoint: 'GET /api/v1/graphql-countries/{iso}',
        action: 'Consultar país',
        auto: true,
        note: 'Mismo dato que CountryInfo, otro contrato: compara qué tanto hay que enviar en cada uno.',
        fields: [{ name: 'iso', label: 'Código ISO de 2 letras', default: 'MX' }],
        request: (v) => ({ url: `/api/v1/graphql-countries/${encodeURIComponent(v.iso)}`, headers: { Accept: 'application/json' } }),
        result: (ex) => {
          const c = json(ex)
          return (
            <Facts
              facts={{ Nombre: `${c.emoji} ${c.name}`, Capital: c.capital, Moneda: c.currency, Continente: c.continent, Idiomas: c.languages.join(', ') }}
            />
          )
        },
        extra: (v) => (
          <Upstream summary="Lo que nuestra API envía a Countries">
            {`POST /graphql HTTP/1.1
Host: countries.trevorblades.com
Content-Type: application/json

${JSON.stringify(
  {
    query: 'query Country($code: ID!) { country(code: $code) { name capital currency emoji continent { name } languages { name } } }',
    variables: { code: v.iso.toUpperCase() },
  },
  null,
  2,
)}`}
          </Upstream>
        ),
      },
    ],
  },
  {
    group: 'externas',
    key: 'grpc',
    protocol: 'gRPC',
    title: 'Saludo con grpcb.in',
    summary: 'Servidor gRPC público de pruebas, llamado con TLS desde nuestra API.',
    contract: { label: 'Contrato hello.proto', path: 'apps/api/src/main/protobuf/grpcbin/hello.proto' },
    operations: [
      {
        title: 'SayHello',
        endpoint: 'GET /api/v1/greeting?name=',
        action: 'Llamar SayHello',
        auto: true,
        fields: [{ name: 'name', label: 'Nombre', default: 'Kevin' }],
        request: (v) => ({ url: `/api/v1/greeting?name=${encodeURIComponent(v.name)}`, headers: { Accept: 'application/json' } }),
        result: (ex) => <Facts facts={{ Respuesta: json(ex).reply }} />,
        extra: (v) => (
          <Upstream summary="Lo que nuestra API envía a grpcb.in">
            {`grpcb.in:9001 (TLS)  hello.HelloService/SayHello\n\nhello.HelloRequest {\n  greeting: ${JSON.stringify(v.name)}\n}`}
          </Upstream>
        ),
      },
    ],
  },
]

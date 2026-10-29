import { useEffect, useState } from 'react'

const SOAP_LIST = `<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/"
                  xmlns:p="http://practice.com/products/v1">
  <soapenv:Body><p:listProductsRequest/></soapenv:Body>
</soapenv:Envelope>`

async function readOrThrow(res) {
  const body = await res.text()
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${body}`)
  return body
}

export default function App() {
  const [rest, setRest] = useState('Cargando…')
  const [soap, setSoap] = useState('Cargando…')

  useEffect(() => {
    fetch('/api/v1/products')
      .then(readOrThrow)
      .then((json) => setRest(JSON.stringify(JSON.parse(json), null, 2)))
      .catch((e) => setRest(e.message))

    fetch('/ws', {
      method: 'POST',
      headers: { 'Content-Type': 'text/xml; charset=utf-8', SOAPAction: '""' },
      body: SOAP_LIST,
    })
      .then(readOrThrow)
      .then(setSoap)
      .catch((e) => setSoap(e.message))
  }, [])

  return (
    <main style={{ fontFamily: 'system-ui', padding: '1rem' }}>
      <h1>Portal de webservices</h1>
      <p>Los mismos productos, dos contratos distintos.</p>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
        <section>
          <h2>REST · GET /api/v1/products</h2>
          <pre>{rest}</pre>
        </section>
        <section>
          <h2>SOAP · POST /ws (listProductsRequest)</h2>
          <pre style={{ whiteSpace: 'pre-wrap' }}>{soap}</pre>
        </section>
      </div>
    </main>
  )
}

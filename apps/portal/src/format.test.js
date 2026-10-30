import { test } from 'node:test'
import assert from 'node:assert/strict'
import { prettyBody, prettyXml, problemOf, protoProducts, xmlEscape } from './format.js'

test('prettyXml indenta y deja hojas en una línea', () => {
  assert.equal(
    prettyXml('<?xml version="1.0"?><a><b>1</b><c/><d><e>x</e></d></a>'),
    '<?xml version="1.0"?>\n<a>\n  <b>1</b>\n  <c/>\n  <d>\n    <e>x</e>\n  </d>\n</a>',
  )
})

test('prettyBody formatea JSON y deja intacto lo inválido', () => {
  assert.equal(prettyBody('{"a":1}', 'application/json'), '{\n  "a": 1\n}')
  assert.equal(prettyBody('no json', 'application/problem+json'), 'no json')
})

test('xmlEscape evita romper el sobre SOAP', () => {
  assert.equal(xmlEscape(`<a & "b">`), '&lt;a &amp; &quot;b&quot;&gt;')
})

test('protoProducts lee el texto protobuf, con comillas escapadas y acentos', () => {
  const text = 'products {\n  id: 1\n  name: "Rat\\"ón\\""\n  price: "249.50"\n}\nproducts {\n  id: 2\n  name: "Mouse"\n  price: "1"\n}'
  assert.deepEqual(protoProducts(text), [
    { id: '1', name: 'Rat"ón"', price: '249.50' },
    { id: '2', name: 'Mouse', price: '1' },
  ])
})

test('problemOf entiende los errores de cada contrato', () => {
  const json = 'application/json'
  assert.equal(problemOf({ status: 404, contentType: 'application/problem+json', body: '{"detail":"no existe"}' }), 'no existe')
  assert.equal(problemOf({ status: 200, contentType: json, body: '{"errors":[{"message":"price: mal"}]}' }), 'price: mal')
  assert.equal(problemOf({ status: 400, contentType: json, body: '{"method":"m","status":"INVALID_ARGUMENT","error":"x"}' }), 'INVALID_ARGUMENT: x')
  assert.equal(problemOf({ status: 500, contentType: 'text/xml', body: '<faultstring xml:lang="en">Validation error</faultstring>' }), 'Validation error')
  assert.equal(problemOf({ status: 200, contentType: json, body: '{"data":{}}' }), null)
  assert.equal(problemOf({ status: 502, contentType: 'text/plain', body: '' }), 'HTTP 502')
})

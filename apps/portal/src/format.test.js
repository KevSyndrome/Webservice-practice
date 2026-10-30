import { test } from 'node:test'
import assert from 'node:assert/strict'
import { prettyBody, prettyXml } from './format.js'

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

import test from 'node:test'
import assert from 'node:assert/strict'
import {
  assignedSheet,
  createPlayerLink,
  playerDraftKey,
  playerRulesKey,
  selectedPlayerSheet,
  initialPlayerSheet,
} from './playerAccess.ts'
import { api, restrictSpreadsheet, sheetApiError, OfficeFileError } from './googleSheets.ts'
const alice = 'alice_character_1234567890',
  bob = 'bob_character_1234567890'
test('player links carry only the selected character and reject missing or ambiguous assignments', () => {
  const link = new URL(
    createPlayerLink(
      'https://characters.example.test/app/?legacy=1#owner',
      `https://docs.google.com/spreadsheets/d/${alice}/edit?gid=5`,
    ),
  )
  assert.equal(link.pathname, '/app/')
  assert.equal(link.searchParams.get('player'), '1')
  assert.equal(assignedSheet(link.search), alice)
  assert.equal(link.hash, '')
  assert.equal(link.searchParams.has('legacy'), false)
  for (const query of [
    '',
    '?character=bad',
    `?character=${alice}&character=${bob}`,
    '?character=https://evil.test',
  ])
    assert.throws(() => assignedSheet(query), /character link/)
})
test('links validate app and sheet origins and credentials', () => {
  for (const host of [
    'http://public.example.test',
    'javascript:alert(1)',
    'https://user:pass@example.test',
  ])
    assert.throws(() =>
      createPlayerLink(host, `https://docs.google.com/spreadsheets/d/${alice}/edit`),
    )
  assert.ok(
    createPlayerLink(
      'http://localhost:5173',
      `https://docs.google.com/spreadsheets/d/${alice}/edit`,
    ),
  )
  assert.throws(() =>
    createPlayerLink('https://app.example.test', `https://evil.test/spreadsheets/d/${alice}/edit`),
  )
})
test('player data is isolated from owner storage and other characters', () => {
  assert.notEqual(playerDraftKey(alice), playerDraftKey(bob))
  assert.notEqual(playerRulesKey(alice), playerRulesKey(bob))
  assert.notEqual(playerDraftKey(alice), 'punpun-workbook-drafts')
})

test('pasted sheet links retain their worksheet and reject folders or other origins', () => {
  const url = `https://docs.google.com/spreadsheets/d/${alice}/edit?gid=42#gid=42`
  assert.deepEqual(selectedPlayerSheet(` ${url} `), { id: alice, url })
  for (const invalid of [
    '',
    'not a link',
    'https://drive.google.com/drive/folders/shared',
    `https://evil.test/spreadsheets/d/${alice}/edit`,
    `https://name:pass@docs.google.com/spreadsheets/d/${alice}/edit`,
  ])
    assert.throws(() => selectedPlayerSheet(invalid))
})

test('the entry form remembers a valid last sheet and keeps old character links optional', () => {
  const remembered = `https://docs.google.com/spreadsheets/d/${bob}/edit?gid=10`
  assert.equal(initialPlayerSheet('', ''), '')
  assert.equal(initialPlayerSheet('', remembered), remembered)
  assert.equal(
    initialPlayerSheet(`?character=${alice}`, remembered),
    `https://docs.google.com/spreadsheets/d/${alice}/edit`,
  )
  assert.equal(initialPlayerSheet('?character=bad', remembered), '')
  assert.equal(initialPlayerSheet('', 'https://evil.test'), '')
})
test('player API rejects other spreadsheet IDs before making requests', async () => {
  restrictSpreadsheet(alice)
  try {
    await assert.rejects(api(bob, ''), /only use its assigned/)
    await assert.rejects(api('', '', { method: 'POST' }), /only use its assigned/)
  } finally {
    restrictSpreadsheet(null)
  }
})

test('Office-file API errors explain conversion without mislabeling permission errors', () => {
  const office = sheetApiError(
    'This operation is not supported for this document. The document must not be an Office file.',
  )
  assert.ok(office instanceof OfficeFileError)
  assert.match(office.message, /Save as Google Sheets/)
  assert.match(office.message, /new Google Sheets file/)
  const denied = sheetApiError('The caller does not have permission')
  assert.equal(denied instanceof OfficeFileError, false)
  assert.equal(denied.message, 'The caller does not have permission')
})

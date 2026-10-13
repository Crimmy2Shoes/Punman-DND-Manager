import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import { skillCue } from './skillFormatting.ts'
import { choices, editable, conflicts, fromGoogle, validateEdit, xpForLevel } from './sheetModel.ts'
const book = JSON.parse(fs.readFileSync(new URL('./data/punpun.json', import.meta.url)))
test('PunPun inputs, formula cells and merged cells are distinguished', () => {
  const main = book.sheets.find((s) => s.title === 'v2.1')
  assert.equal(editable(main, 'C6'), true)
  assert.equal(editable(main, 'D6'), false)
  assert.equal(editable(main, 'AL6'), false)
  assert.equal(editable(main, 'R12'), false)
  assert.equal(editable(main, 'C16'), true)
  assert.throws(
    () => validateEdit(book, { tab: 'v2.1', address: 'R12', value: 20, before: '-' }),
    /calculated/,
  )
})
test('creation dropdowns and XP come from workbook content', () => {
  const main = book.sheets[0]
  assert.ok(choices(book, main, 'T7').includes('Hill Dwarf'))
  assert.ok(choices(book, main, 'AJ28').includes('Lawful Good'))
  assert.equal(xpForLevel(book, 3), 900)
  const custom = structuredClone(book)
  custom.sheets[0].cells.AL6.formula = '=IF(AE7<700,1,IF(AE7<1600,2,3))'
  assert.equal(xpForLevel(custom, 3), 1600)
})
test('DM edits conflict only with the cells in the draft; new formulas block writes', () => {
  const copy = structuredClone(book)
  const edit = { tab: 'v2.1', address: 'C6', before: '', value: 'PunPun' }
  copy.sheets[0].cells.C6 = { value: 'DM name' }
  assert.equal(conflicts(copy, [edit]).length, 1)
  copy.sheets[0].cells.C6 = { value: '' }
  copy.sheets[0].cells.R17 = { value: 10 }
  assert.equal(conflicts(copy, [edit]).length, 0)
  copy.sheets[0].cells.C6 = { value: '', formula: '=OTHER_CELL' }
  assert.equal(conflicts(copy, [edit]).length, 1)
})
test('Google grid respects offsets, effective values and validation sources', () => {
  const parsed = fromGoogle(
    {
      properties: { title: 'Live' },
      sheets: [
        {
          properties: { title: 'v2.1', sheetId: 42 },
          data: [
            {
              startRow: 5,
              startColumn: 2,
              rowData: [
                {
                  values: [
                    {
                      userEnteredValue: { formulaValue: '=1+2' },
                      effectiveValue: { numberValue: 3 },
                      note: 'DM formula',
                    },
                    {
                      userEnteredValue: { boolValue: false },
                      effectiveValue: { boolValue: false },
                    },
                    {
                      dataValidation: {
                        condition: {
                          type: 'ONE_OF_LIST',
                          values: [{ userEnteredValue: 'Homebrew' }],
                        },
                        strict: true,
                      },
                    },
                  ],
                },
              ],
            },
          ],
        },
      ],
    },
    'book-id',
  )
  assert.equal(parsed.sheets[0].cells.C6.value, 3)
  assert.equal(parsed.sheets[0].cells.C6.formula, '=1+2')
  assert.equal(parsed.sheets[0].cells.D6.value, false)
  assert.deepEqual(choices(parsed, parsed.sheets[0], 'E6'), ['Homebrew'])
  assert.throws(
    () => validateEdit(parsed, { tab: 'v2.1', address: 'E6', before: '', value: 'Unknown' }),
    /spreadsheet option/,
  )
})
test('live numeric and advanced validation are respected', () => {
  const copy = structuredClone(book)
  copy.sheets[0].cells.R17 = {
    value: 5,
    validation: { type: 'NUMBER_BETWEEN', values: ['0', '20'], strict: true },
  }
  assert.throws(
    () => validateEdit(copy, { tab: 'v2.1', address: 'R17', before: 5, value: 21 }),
    /sheet's/,
  )
  validateEdit(copy, { tab: 'v2.1', address: 'R17', before: 5, value: 10 })
  copy.sheets[0].cells.R17.validation.type = 'CUSTOM_FORMULA'
  assert.throws(
    () => validateEdit(copy, { tab: 'v2.1', address: 'R17', before: 5, value: 10 }),
    /Google Sheets/,
  )
})
test('Google effective skill styles retain conditional colors, underline and yellow independently', () => {
  const parsed = fromGoogle(
    {
      properties: { title: 'Live' },
      sheets: [
        {
          properties: { title: 'v2.1', sheetId: 1 },
          data: [
            {
              startRow: 24,
              startColumn: 7,
              rowData: [
                {
                  values: [
                    {
                      effectiveFormat: {
                        backgroundColor: { red: 1, green: 242 / 255, blue: 204 / 255 },
                      },
                    },
                    {},
                    {
                      effectiveFormat: {
                        textFormat: {
                          underline: true,
                          foregroundColorStyle: {
                            rgbColor: { red: 74 / 255, green: 134 / 255, blue: 232 / 255 },
                          },
                        },
                      },
                    },
                  ],
                },
              ],
            },
          ],
        },
      ],
    },
    'id',
  )
  const cue = skillCue(parsed, 'H25')
  assert.equal(cue.label, 'Class choice')
  assert.equal(cue.underline, true)
  assert.equal(cue.yellow, true)
  parsed.sheets[0].cells.J25.format.underline = false
  assert.equal(skillCue(parsed, 'H25').label, '')
  assert.equal(skillCue(parsed, 'H25').yellow, true)
  for (const [color, label] of [
    ['#9556e0', 'Race grant'],
    ['#c136a1', 'Race choice'],
    ['#d58d41', 'Background grant'],
  ]) {
    parsed.sheets[0].cells.J25.format = { color, underline: true }
    assert.equal(skillCue(parsed, 'H25').label, label)
  }
})

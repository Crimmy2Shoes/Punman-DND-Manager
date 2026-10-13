import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import vm from 'node:vm'
import { pugilistData, pugilistPreview } from './pugilist.ts'
import { validateEdit, column, position } from './sheetModel.ts'
const original = JSON.parse(fs.readFileSync(new URL('./data/punpun.json', import.meta.url), 'utf8'))
test('Pugilist source progression is exact at milestone levels; preview retains original artwork', () => {
  assert.deepEqual(
    [1, 2, 3, 5, 11, 17, 20].map((level) => pugilistData.moxie[level - 1]),
    [0, 2, 2, 3, 6, 9, 12],
  )
  assert.deepEqual(
    [1, 5, 11, 17].map((level) => pugilistData.dice[level - 1]),
    ['1d6', '1d8', '1d10', '1d12'],
  )
  const preview = pugilistPreview(original)
  for (const sheet of original.sheets)
    for (const [a, c] of Object.entries(sheet.cells))
      if (!['Attack Info!T84', 'Attack Info!AN84'].includes(sheet.title + '!' + a))
        assert.deepEqual(preview.sheets.find((s) => s.title === sheet.title).cells[a], c)
  assert.ok(preview.sheets.find((s) => s.title === 'Class Info').cells.B107.value === 'Pugilist')
  assert.equal(
    pugilistPreview({ ...original, spreadsheetId: 'live' }).sheets.length,
    original.sheets.length,
  )
})
test('Pugilist inputs respect live sheet maxima and integer constraints', () => {
  const book = pugilistPreview(original),
    tab = book.sheets.find((s) => s.title === 'Pugilist')
  tab.cells.B4.value = 7
  tab.cells.B6.value = '1d8'
  assert.throws(
    () => validateEdit(book, { tab: 'Pugilist', address: 'B5', value: 8, before: 0 }),
    /whole number/,
  )
  assert.throws(
    () => validateEdit(book, { tab: 'Pugilist', address: 'B5', value: 1.5, before: 0 }),
    /whole number/,
  )
  validateEdit(book, { tab: 'Pugilist', address: 'B5', value: 7, before: 0 })
  assert.throws(
    () => validateEdit(book, { tab: 'Pugilist', address: 'B29', value: 9, before: 1 }),
    /whole number/,
  )
  tab.cells.B4.value = 9
  validateEdit(book, { tab: 'Pugilist', address: 'B5', value: 9, before: 0 })
})
function environment(book) {
  const backups = []
  let named = []
  const wrap = (tab) => ({
    getName: () => tab.title,
    getMaxColumns: () => 55,
    getRange: (...args) => {
      let row, col, height, width
      if (typeof args[0] === 'string') {
        const [start, end = args[0]] = args[0].split(':')
        const p = position(start),
          q = position(end)
        row = p[0] + 1
        col = p[1] + 1
        height = q[0] - p[0] + 1
        width = q[1] - p[1] + 1
      } else [row, col, height = 1, width = 1] = args
      const addresses = Array.from({ length: height }, (_, r) =>
        Array.from({ length: width }, (_, c) => column(col + c - 1) + (row + r)),
      )
      const range = {
        getValues: () => addresses.map((line) => line.map((a) => tab.cells[a]?.value ?? '')),
        getFormulas: () => addresses.map((line) => line.map((a) => tab.cells[a]?.formula ?? '')),
        getFormula: () => tab.cells[addresses[0][0]]?.formula ?? '',
        setValue: (value) => {
          for (const a of addresses.flat())
            tab.cells[a] =
              typeof value === 'string' && value.startsWith('=')
                ? { formula: value, value: '' }
                : { value }
          return range
        },
        setValues: (values) => {
          addresses.forEach((line, r) =>
            line.forEach((a, c) => {
              tab.cells[a] = { value: values[r][c] }
            }),
          )
          return range
        },
        setFormula: (formula) => {
          addresses.flat().forEach((a) => {
            tab.cells[a] = { formula, value: '' }
          })
          return range
        },
        setDataValidation: (validation) => {
          addresses.flat().forEach((a) => {
            tab.cells[a].validation = validation
          })
          return range
        },
        setNote: (note) => {
          addresses.flat().forEach((a) => {
            tab.cells[a].note = note
          })
          return range
        },
        setBackground: () => range,
        setFontColor: () => range,
        setFontWeight: () => range,
        setWrap: () => range,
      }
      return range
    },
    setFrozenRows: () => {},
    setColumnWidth: () => {},
  })
  const api = {
    getSheetByName: (name) => {
      const tab = book.sheets.find((s) => s.title === name)
      return tab ? wrap(tab) : null
    },
    getNamedRanges: () => named,
    copy: () => {
      backups.push(structuredClone(book))
      return { getUrl: () => 'https://backup.test' }
    },
    getName: () => 'PunPun',
    getUrl: () => 'https://sheet.test',
    insertSheet: (title) => {
      const tab = { title, cells: {} }
      book.sheets.push(tab)
      return wrap(tab)
    },
    setNamedRange: (name) => {
      named.push({ getName: () => name })
    },
  }
  const validation = () => {
    const state = {}
    const builder = {
      requireCheckbox: () => {
        state.type = 'BOOLEAN'
        state.values = []
        return builder
      },
      requireFormulaSatisfied: (formula) => {
        state.type = 'CUSTOM_FORMULA'
        state.values = [formula]
        return builder
      },
      setAllowInvalid: () => {
        state.strict = true
        return builder
      },
      build: () => state,
    }
    return builder
  }
  const context = {
    SpreadsheetApp: {
      getActiveSpreadsheet: () => api,
      newDataValidation: validation,
      flush: () => {},
      getUi: () => ({ alert: () => {} }),
    },
    console: { log: () => {} },
  }
  const script = fs.readFileSync(
    new URL('../../References/Install_Pugilist.gs', import.meta.url),
    'utf8',
  )
  return {
    backups,
    run: () => vm.runInNewContext('(function(){' + script + '\ninstallPugilist();})();', context),
  }
}
test('installer backs up first, retains images and existing data, adds guarded formulas', () => {
  const book = structuredClone(original),
    env = environment(book)
  env.run()
  assert.deepEqual(env.backups, [original])
  const intentional = new Set([
    'v2.1!C15',
    'v2.1!C25',
    'v2.1!H18',
    'Inventory!E24',
    'Attack Info!T84',
    'Attack Info!AN84',
  ])
  for (const s of original.sheets)
    for (const [a, c] of Object.entries(s.cells))
      if (!intentional.has(s.title + '!' + a))
        assert.deepEqual(book.sheets.find((t) => t.title === s.title).cells[a], c)
  const classes = book.sheets.find((s) => s.title === 'Class Info')
  assert.equal(classes.cells.B107.value, 'Pugilist')
  assert.equal(classes.cells.K107.value, 'd8')
  assert.match(classes.cells.Q107.formula, /PugilistLevel>=7/)
  assert.match(book.sheets[0].cells.C15.formula, /PugilistLevel>=20,Pugilist!B25/)
  assert.equal(book.sheets.find((s) => s.title === 'Pugilist').cells.F21.value, 12)
  assert.throws(() => env.run(), /already exists/)
  assert.equal(env.backups.length, 1)
})
test('installer refuses occupied reference rows before making changes', () => {
  const book = structuredClone(original)
  for (let row = 102; row <= 180; row++)
    book.sheets.find((s) => s.title === 'Class Info').cells['Q' + row] = {
      value: 'DM custom notes',
    }
  const before = structuredClone(book),
    env = environment(book)
  assert.throws(() => env.run(), /No free block/)
  assert.deepEqual(book, before)
  assert.equal(env.backups.length, 0)
})

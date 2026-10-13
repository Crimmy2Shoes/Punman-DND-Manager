import data from './data/pugilist.json' with { type: 'json' }
import type { Workbook, SheetTab, Value } from './sheetModel.ts'
export const pugilistData = data
export const pugilistInstalled = (book: Workbook) =>
  book.sheets.find((s) => s.title === 'Pugilist')?.cells.A1?.value === data.version
export function pugilistBounds(book: Workbook, address: string): [number, number] | null {
  const tab = book.sheets.find((s) => s.title === 'Pugilist')
  if (!tab || !pugilistInstalled(book)) return null
  if (address === 'B5') return [0, Number(tab.cells.B4?.value)]
  if (address === 'B15') return [0, Number(tab.cells.B16?.value)]
  if (address === 'B11') return [0, 6]
  if (address === 'B29') return [1, Number(String(tab.cells.B6?.value).replace(/^1d/, ''))]
  return null
}
export function pugilistPreview(book: Workbook): Workbook {
  if (book.spreadsheetId || book.sheets.some((s) => s.title === 'Pugilist')) return book
  const copy = structuredClone(book)
  const tab: SheetTab = { title: 'Pugilist', cells: {} }
  for (const [address, value] of Object.entries(data.cells)) {
    tab.cells[address] =
      typeof value === 'string' && value.startsWith('=')
        ? { formula: value, value: '—' }
        : { value }
  }
  for (const address of ['B2', 'B4', 'B9', 'B16', 'B27', 'B28', 'B31', 'B32', 'B34'])
    tab.cells[address].value = 0
  for (const address of ['B7', 'B35', 'B36']) tab.cells[address].value = false
  data.checkboxes.forEach((address) => {
    tab.cells[address].validation = { type: 'BOOLEAN', values: [], strict: true }
  })
  for (const [address, formula] of Object.entries(data.validations))
    tab.cells[address].validation = { type: 'CUSTOM_FORMULA', values: [formula], strict: true }
  data.moxie.forEach((points, i) => {
    tab.cells[`D${i + 2}`] = { value: i + 1 }
    tab.cells[`E${i + 2}`] = { value: data.dice[i] }
    tab.cells[`F${i + 2}`] = { value: points }
  })
  const add = (title: string, records: Record<string, Value>[]) => {
    const sheet = copy.sheets.find((s) => s.title === title)
    if (!sheet) return
    let row =
      Math.max(
        6,
        ...Object.keys(sheet.cells)
          .filter((a) => /^B\d+$/.test(a) && sheet.cells[a].value)
          .map((a) => Number(a.slice(1))),
      ) + 1
    const occupied = (candidate: number) =>
      Object.entries(sheet.cells).some(
        ([address, cell]) =>
          Number(address.replace(/\D/g, '')) === candidate &&
          (cell.formula || !['', 0, false, '-'].includes(cell.value)),
      )
    while (Array.from({ length: records.length }, (_, i) => row + i).some(occupied)) row++
    for (const record of records) {
      for (const [col, value] of Object.entries(record))
        sheet.cells[col + row] =
          typeof value === 'string' && value.startsWith('=')
            ? {
                formula: value,
                value:
                  col === 'Q'
                    ? 'Strength, Constitution, Choose 2, Acrobatics, Athletics, Deception, Intimidation, Perception, Sleight of Hand, Stealth'
                    : '-',
              }
            : { value }
      row++
    }
  }
  add('Class Info', [
    data.classColumns,
    ...data.clubs.map((club) =>
      Object.fromEntries(
        Object.keys(data.classColumns).map((col) => [
          col,
          col === 'B' ? 'Pugilist' : col === 'E' ? club : '-',
        ]),
      ),
    ),
  ])
  add('Attack Info', [data.attackColumns])
  copy.sheets.push(tab)
  return copy
}

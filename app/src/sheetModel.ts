import { api, connectionStatus } from './googleSheets.ts'
import { pugilistBounds, pugilistData } from './pugilist.ts'
export type Value = string | number | boolean
export interface SheetCell {
  value: Value
  formula?: string
  note?: string
  format?: { color?: string; background?: string; underline?: boolean }
  validation?: { type: string; values: string[]; strict?: boolean }
}
export interface SheetTab {
  title: string
  cells: Record<string, SheetCell>
  validations?: { range: string; type: string; source: string; strict?: boolean }[]
  merges?: string[]
  id?: number
}
export interface Workbook {
  title: string
  source: string
  sheets: SheetTab[]
  fetchedAt?: number
  spreadsheetId?: string
  skillFormattingLoaded?: boolean
}
export interface Edit {
  tab: string
  address: string
  before: Value
  value: Value
}
export const keyOf = (tab: string, address: string) => JSON.stringify([tab, address])
export const cellValue = (book: Workbook, tab: string, address: string): Value =>
  book.sheets.find((s) => s.title === tab)?.cells[address]?.value ?? ''
export function column(n: number): string {
  let result = ''
  for (n++; n > 0; n = Math.floor((n - 1) / 26))
    result = String.fromCharCode(65 + ((n - 1) % 26)) + result
  return result
}
export function position(address: string): [number, number] {
  const m = /^([A-Z]+)(\d+)$/.exec(address)
  if (!m) throw Error('Invalid cell address.')
  return [Number(m[2]) - 1, [...m[1]].reduce((n, c) => n * 26 + c.charCodeAt(0) - 64, 0) - 1]
}
export function inRange(address: string, range: string): boolean {
  const [r, c] = position(address)
  const [start, end = start] = range.replace(/\$/g, '').split(':')
  const [r1, c1] = position(start),
    [r2, c2] = position(end)
  return r >= r1 && r <= r2 && c >= c1 && c <= c2
}
export function editable(tab: SheetTab, address: string): boolean {
  if (tab.cells[address]?.formula) return false
  return !(tab.merges ?? []).some(
    (range) => inRange(address, range) && range.split(':')[0] !== address,
  )
}
export function choices(book: Workbook, tab: SheetTab, address: string): string[] {
  const cell = tab.cells[address]
  let type = cell?.validation?.type,
    sources = cell?.validation?.values ?? []
  const rule = tab.validations?.find((v) =>
    v.range.split(/\s+/).some((range) => inRange(address, range)),
  )
  if (!type && rule) {
    type = rule.type === 'list' ? 'ONE_OF_RANGE' : rule.type
    sources = [rule.source]
  }
  if (type === 'ONE_OF_LIST') return sources
  if (type !== 'ONE_OF_RANGE') return []
  const source = (sources[0] ?? '').replace(/^=/, '')
  if (source.startsWith('"')) return source.slice(1, -1).split(',')
  const match = /^(?:'((?:[^']|'')+)'|([^!]+))!([A-Z$]+\d+:[A-Z$]+\d+)$/.exec(source)
  const range = match?.[3] ?? source,
    title = match ? (match[1]?.replace(/''/g, "'") ?? match[2]) : tab.title
  const origin = book.sheets.find((s) => s.title === title)
  if (!origin || !/^\$?[A-Z]+\$?\d+:\$?[A-Z]+\$?\d+$/.test(range)) return []
  return [
    ...new Set(
      Object.entries(origin.cells)
        .filter(([a, c]) => inRange(a, range) && String(c.value).trim())
        .sort(([a], [b]) => position(a)[0] - position(b)[0])
        .map(([, c]) => String(c.value)),
    ),
  ]
}
interface GoogleValue {
  stringValue?: string
  numberValue?: number
  boolValue?: boolean
  formulaValue?: string
  errorValue?: { message?: string; type?: string }
}
interface GoogleCell {
  effectiveFormat?: {
    backgroundColor?: RGB
    backgroundColorStyle?: { rgbColor?: RGB }
    textFormat?: {
      underline?: boolean
      foregroundColor?: RGB
      foregroundColorStyle?: { rgbColor?: RGB }
    }
  }
  userEnteredValue?: GoogleValue
  effectiveValue?: GoogleValue
  formattedValue?: string
  note?: string
  dataValidation?: {
    condition: { type: string; values?: { userEnteredValue: string }[] }
    strict?: boolean
  }
}
interface RGB {
  red?: number
  green?: number
  blue?: number
}
function colorHex(color?: RGB): string | undefined {
  if (!color) return undefined
  return (
    '#' +
    [color.red ?? 0, color.green ?? 0, color.blue ?? 0]
      .map((v) =>
        Math.round(Math.min(1, Math.max(0, v)) * 255)
          .toString(16)
          .padStart(2, '0'),
      )
      .join('')
  )
}
interface GridRange {
  startRowIndex?: number
  endRowIndex?: number
  startColumnIndex?: number
  endColumnIndex?: number
}
interface GoogleBook {
  properties: { title: string }
  sheets: {
    properties: {
      title: string
      sheetId: number
      gridProperties?: { rowCount: number; columnCount: number }
    }
    merges?: GridRange[]
    data?: { startRow?: number; startColumn?: number; rowData?: { values?: GoogleCell[] }[] }[]
  }[]
}
const scalar = (v?: GoogleValue): Value =>
  v?.numberValue ??
  v?.boolValue ??
  v?.stringValue ??
  v?.errorValue?.message ??
  v?.errorValue?.type ??
  ''
export function fromGoogle(data: GoogleBook, id: string): Workbook {
  return {
    title: data.properties.title,
    source: 'Google Sheet',
    spreadsheetId: id,
    fetchedAt: Date.now(),
    sheets: data.sheets.map((s) => {
      const cells: Record<string, SheetCell> = {}
      for (const grid of s.data ?? [])
        for (const [ri, row] of (grid.rowData ?? []).entries())
          for (const [ci, c] of (row.values ?? []).entries()) {
            const address = column((grid.startColumn ?? 0) + ci) + ((grid.startRow ?? 0) + ri + 1)
            if (
              c &&
              (c.userEnteredValue ||
                c.effectiveValue ||
                c.dataValidation ||
                c.note ||
                c.effectiveFormat)
            )
              cells[address] = {
                value: scalar(c.effectiveValue ?? c.userEnteredValue),
                formula: c.userEnteredValue?.formulaValue,
                note: c.note,
                format: c.effectiveFormat
                  ? {
                      color: colorHex(
                        c.effectiveFormat.textFormat?.foregroundColorStyle?.rgbColor ??
                          c.effectiveFormat.textFormat?.foregroundColor,
                      ),
                      background: colorHex(
                        c.effectiveFormat.backgroundColorStyle?.rgbColor ??
                          c.effectiveFormat.backgroundColor,
                      ),
                      underline: c.effectiveFormat.textFormat?.underline ?? false,
                    }
                  : undefined,
                validation: c.dataValidation
                  ? {
                      type: c.dataValidation.condition.type,
                      values:
                        c.dataValidation.condition.values?.map((v) => v.userEnteredValue) ?? [],
                      strict: c.dataValidation.strict,
                    }
                  : undefined,
              }
          }
      return {
        title: s.properties.title,
        id: s.properties.sheetId,
        cells,
        merges: s.merges?.map(
          (m) =>
            `${column(m.startColumnIndex ?? 0)}${(m.startRowIndex ?? 0) + 1}:${column((m.endColumnIndex ?? 1) - 1)}${m.endRowIndex ?? 1}`,
        ),
      }
    }),
  }
}
export async function readWorkbook(id: string): Promise<Workbook> {
  const metadata = await api<GoogleBook>(
    id,
    '?fields=properties(title),sheets(properties(title,sheetId,gridProperties(rowCount,columnCount)))',
  )
  // Fixed template bounds include the hidden helper columns used by dropdown formulas.
  const ranges = metadata.sheets
    .map(
      (s) =>
        `ranges=${encodeURIComponent("'" + s.properties.title.replace(/'/g, "''") + "'!A1:" + column(Math.min(55, s.properties.gridProperties?.columnCount ?? 55) - 1) + Math.min(s.properties.title === 'Class Info' ? 600 : 201, s.properties.gridProperties?.rowCount ?? 201))}`,
    )
    .join('&')
  const fields =
    'properties(title),sheets(properties(title,sheetId),merges,data(startRow,startColumn,rowData(values(userEnteredValue,effectiveValue,note,dataValidation))))'
  const book = fromGoogle(
    await api<GoogleBook>(id, `?${ranges}&fields=${encodeURIComponent(fields)}`),
    id,
  )
  if (book.sheets.some((s) => s.title === 'v2.1')) {
    // Fetch only skill formatting: requesting every styled cell would inflate the local cache.
    const formats = fromGoogle(
      await api<GoogleBook>(
        id,
        `?ranges=${encodeURIComponent("'v2.1'!H25:J42")}&fields=${encodeURIComponent('properties(title),sheets(properties(title,sheetId),data(startRow,startColumn,rowData(values(effectiveFormat(textFormat(underline,foregroundColor,foregroundColorStyle),backgroundColor,backgroundColorStyle)))))')}`,
      ),
      id,
    )
    const main = book.sheets.find((s) => s.title === 'v2.1')!
    for (const [address, cell] of Object.entries(
      formats.sheets.find((s) => s.title === 'v2.1')?.cells ?? {},
    )) {
      if (cell.format)
        main.cells[address] = { ...(main.cells[address] ?? { value: '' }), format: cell.format }
    }
    book.skillFormattingLoaded = true
  }
  return book
}
export function conflicts(book: Workbook, edits: Edit[]): Edit[] {
  return edits.filter(
    (e) =>
      cellValue(book, e.tab, e.address) !== e.before ||
      !editable(
        book.sheets.find((s) => s.title === e.tab) ?? { title: e.tab, cells: {} },
        e.address,
      ) ||
      !book.sheets.some((s) => s.title === e.tab),
  )
}
export function validateEdit(book: Workbook, edit: Edit) {
  const tab = book.sheets.find((s) => s.title === edit.tab)
  if (!tab || !editable(tab, edit.address))
    throw Error(`${edit.tab}!${edit.address} is calculated or no longer editable.`)
  const [r, c] = position(edit.address)
  if (r > 200 || c > 54) throw Error('Cell is outside the supported template range.')
  if (typeof edit.value === 'number' && !Number.isFinite(edit.value))
    throw Error('Enter a valid number.')
  if (String(edit.value).length > 50000)
    throw Error('A cell may contain at most 50,000 characters.')
  const options = choices(book, tab, edit.address)
  const rule = tab.validations?.find((v) =>
    v.range.split(/\s+/).some((range) => inRange(edit.address, range)),
  )
  if (
    (tab.cells[edit.address]?.validation?.strict || rule?.strict) &&
    options.length &&
    edit.value !== '' &&
    !options.includes(String(edit.value))
  )
    throw Error(`Choose a spreadsheet option for ${edit.address}.`)
  const validation = tab.cells[edit.address]?.validation
  if (
    validation?.strict &&
    ['ONE_OF_LIST', 'ONE_OF_RANGE'].includes(validation.type) &&
    !options.length &&
    edit.value !== ''
  ) {
    throw Error(
      `${edit.address} has a dropdown source the app could not resolve. Edit it in Google Sheets.`,
    )
  }
  if (
    validation?.strict &&
    edit.value !== '' &&
    !['ONE_OF_LIST', 'ONE_OF_RANGE'].includes(validation.type)
  ) {
    const args = validation.values
    const n = Number(edit.value),
      a = Number(args[0]),
      b = Number(args[1])
    const numberChecks: Record<string, boolean> = {
      NUMBER_GREATER: n > a,
      NUMBER_GREATER_THAN_EQ: n >= a,
      NUMBER_LESS: n < a,
      NUMBER_LESS_THAN_EQ: n <= a,
      NUMBER_EQ: n === a,
      NUMBER_NOT_EQ: n !== a,
      NUMBER_BETWEEN: n >= a && n <= b,
      NUMBER_NOT_BETWEEN: n < a || n > b,
    }
    if (validation.type in numberChecks) {
      if (!Number.isFinite(n) || !Number.isFinite(a) || !numberChecks[validation.type])
        throw Error(
          `${edit.address} must satisfy the sheet's ${validation.type.toLowerCase().replaceAll('_', ' ')} rule (${args.join(', ')}).`,
        )
    } else if (validation.type === 'BOOLEAN') {
      const allowed: Value[] = args.length ? args : [true, false]
      if (!allowed.includes(edit.value))
        throw Error(`Choose a valid checkbox value for ${edit.address}.`)
    } else if (
      validation.type === 'CUSTOM_FORMULA' &&
      edit.tab === 'Pugilist' &&
      args[0]?.replace(/\s+/g, '').toUpperCase() ===
        (pugilistData.validations as Record<string, string>)[edit.address]
          ?.replace(/\s+/g, '')
          .toUpperCase()
    ) {
      const bounds = pugilistBounds(book, edit.address)
      if (
        !bounds ||
        !bounds.every(Number.isFinite) ||
        !Number.isInteger(n) ||
        n < bounds[0] ||
        n > bounds[1]
      )
        throw Error(
          `Enter a whole number within the spreadsheet's allowed range for ${edit.address}.`,
        )
    } else {
      throw Error(
        `${edit.address} has advanced spreadsheet validation. Edit this cell in Google Sheets.`,
      )
    }
  }
}
export function xpForLevel(book: Workbook, level: number): number | undefined {
  if (level === 1) return 0
  const formula = book.sheets.find((s) => s.title === 'v2.1')?.cells.AL6?.formula ?? ''
  for (const match of formula.matchAll(/AE7\s*<\s*(\d+)\s*,\s*(\d+)/gi)) {
    if (Number(match[2]) === level - 1) return Number(match[1])
  }
  return undefined
}
export async function writeEdits(
  id: string,
  edits: Edit[],
  validateRules?: (book: Workbook, edits: Edit[]) => void,
): Promise<Workbook> {
  if (!connectionStatus().write)
    throw Error('Sign in with read and write permission before saving.')
  if (!edits.length) throw Error('There are no changes to save.')
  const current = await readWorkbook(id)
  if (conflicts(current, edits).length)
    throw Error(
      'Your DM changed a cell you edited. Refresh and resolve the highlighted conflicts before saving.',
    )
  edits.forEach((e) => validateEdit(current, e))
  validateRules?.(current, edits)
  await api(id, '/values:batchUpdate', {
    method: 'POST',
    body: JSON.stringify({
      valueInputOption: 'RAW',
      data: edits.map((e) => ({
        range: `'${e.tab.replace(/'/g, "''")}'!${e.address}`,
        values: [[e.value]],
      })),
    }),
  })
  return readWorkbook(id)
}

import { pugilistPreview } from './pugilist'
import type { Workbook } from './sheetModel'
import SpreadsheetApp from './SpreadsheetApp'

// The local character export stays outside Git. Player deployments don't need it.
const local = import.meta.glob<Workbook>('./data/punpun.json', { eager: true, import: 'default' })
const preview = local['./data/punpun.json']
  ? pugilistPreview(local['./data/punpun.json'])
  : { title: 'Connect your character sheet', source: 'Google Sheets', sheets: [] }
export default function OwnerApp() {
  return <SpreadsheetApp initialWorkbook={preview} />
}

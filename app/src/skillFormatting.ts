import type { Workbook } from './sheetModel.ts'
const palette: Record<string, { label: string; className: string }> = {
  '#4a86e8': { label: 'Class choice', className: 'class' },
  '#9556e0': { label: 'Race grant', className: 'race' },
  '#c136a1': { label: 'Race choice', className: 'race-choice' },
  '#d58d41': { label: 'Background grant', className: 'background' },
}
export function skillCue(book: Workbook, marker: string) {
  const row = marker.replace(/^H/, '')
  const cells = book.sheets.find((s) => s.title === 'v2.1')?.cells
  const name = cells?.['J' + row]?.format,
    bubble = cells?.[marker]?.format
  const source = name?.underline && name.color ? palette[name.color.toLowerCase()] : undefined
  return {
    underline: name?.underline ?? false,
    color: name?.color,
    label: source?.label ?? (name?.underline ? 'Sheet choice' : ''),
    className: source?.className ?? 'other',
    yellow: bubble?.background?.toLowerCase() === '#fff2cc',
  }
}

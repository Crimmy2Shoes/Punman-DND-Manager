import type { Workbook } from './sheetModel'

export const APPEARANCE_FIELDS = [
  ['Age', 'C148'],
  ['Height', 'F148'],
  ['Weight', 'I148'],
  ['Size', 'L148'],
  ['Gender', 'C150'],
  ['Eyes', 'F150'],
  ['Hair', 'I150'],
  ['Skin', 'L150'],
] as const

export const PERSONALITY_BLOCKS = ['Personality traits', 'Ideals', 'Bonds', 'Flaws'].map(
  (label, group) => ({
    label,
    cells: Array.from({ length: 3 }, (_, i) => `AE${12 + group * 4 + i}`),
  }),
)

// These labels sit below their text boxes in the original v2.1 layout.
// Use the actual contiguous merged rows so a moved box follows the workbook.
export function narrativeCells(
  book: Workbook,
  label: 'Allies & organizations' | 'Character backstory',
) {
  const sheet = book.sheets.find((s) => s.title === 'v2.1')
  const heading = Object.entries(sheet?.cells ?? {}).find(
    ([a, c]) => /^R\d+$/.test(a) && String(c.value).trim().toLowerCase() === label.toLowerCase(),
  )?.[0]
  if (!heading) return []
  const end = Number(heading.slice(1)) - 1
  const mergedRows = new Set(
    (sheet?.merges ?? []).flatMap((range) => {
      const m = /^R(\d+):(?:AB|AN)(\d+)$/.exec(range)
      return m && m[1] === m[2] ? [Number(m[1])] : []
    }),
  )
  const rows: string[] = []
  for (let row = end; row >= 1 && mergedRows.has(row); row--) rows.unshift(`R${row}`)
  if (rows.length) return rows
  // Some offline exports omit merges. Only fall back for the verified original labels.
  const start =
    label === 'Character backstory' && heading === 'R178'
      ? 165
      : label === 'Allies & organizations' && heading === 'R163'
        ? 147
        : null
  return start === null ? [] : Array.from({ length: end - start + 1 }, (_, i) => `R${start + i}`)
}

export function textFromCells(values: string[]) {
  const lines = [...values]
  while (lines.length && lines.at(-1) === '') lines.pop()
  return lines.join('\n')
}

export function textToCells(text: string, count: number) {
  if (count <= 0) return []
  const lines = text.split('\n')
  // Keep overflow as multiline text in the last cell, never drop the player's writing.
  return Array.from({ length: count }, (_, i) =>
    i === count - 1 ? lines.slice(i).join('\n') : (lines[i] ?? ''),
  )
}

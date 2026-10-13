import { useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import { Panel } from './components'
import { editable } from './sheetModel'
import type { Value, Workbook } from './sheetModel'
import {
  APPEARANCE_FIELDS,
  PERSONALITY_BLOCKS,
  narrativeCells,
  textFromCells,
  textToCells,
} from './notesModel'

interface Props {
  book: Workbook
  value: (sheet: string, cell: string) => Value
  field: (
    label: string,
    cell: string,
    sheet?: string,
    type?: 'text' | 'number' | 'marker' | 'skill' | 'long',
  ) => ReactNode
  busy: boolean
  stageText: (cells: Record<string, Value>) => boolean
}

function StoryField({
  label,
  cells,
  book,
  value,
  busy,
  stageText,
}: Omit<Props, 'field'> & { label: string; cells: string[] }) {
  const source = book.sheets.find((s) => s.title === 'v2.1')
  const content = textFromCells(cells.map((a) => String(value('v2.1', a))))
  const [text, setText] = useState(content)
  const [focused, setFocused] = useState(false)
  useEffect(() => {
    // Preserve a trailing newline while typing, but still show external DM updates.
    if (!focused || textFromCells(textToCells(text, cells.length)) !== content) setText(content)
  }, [content, focused])
  if (!cells.length)
    return (
      <p className="empty-state">
        The {label.toLowerCase()} text box could not be located in this spreadsheet.
      </p>
    )
  const locked = !source || cells.some((a) => !editable(source, a))
  return (
    <label className={`field story-field ${cells.length > 3 ? 'story-field-long' : ''}`}>
      <span>{label}</span>
      <textarea
        aria-label={label}
        value={text}
        disabled={busy}
        readOnly={locked}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        onChange={(e) => {
          const next = e.target.value
          const changes = Object.fromEntries(
            textToCells(next, cells.length)
              .map((line, i) => [cells[i], line] as const)
              .filter(([cell, line]) => value('v2.1', cell) !== line),
          )
          if (stageText(changes)) setText(next)
        }}
      />
      {locked && <small>Calculated by the spreadsheet.</small>}
    </label>
  )
}

export default function SheetNotes(props: Props) {
  return (
    <>
      <Panel title="Appearance">
        <div className="field-grid">
          {APPEARANCE_FIELDS.map(([label, address]) => props.field(label, address))}
        </div>
      </Panel>
      <Panel title="Personality">
        <div className="notes-personality-grid">
          {PERSONALITY_BLOCKS.map((block) => (
            <StoryField key={block.label} {...props} {...block} />
          ))}
        </div>
      </Panel>
      <Panel title="Allies & organizations">
        <StoryField
          {...props}
          label="Allies & organizations"
          cells={narrativeCells(props.book, 'Allies & organizations')}
        />
      </Panel>
      <Panel title="Character backstory">
        <StoryField
          {...props}
          label="Character backstory"
          cells={narrativeCells(props.book, 'Character backstory')}
        />
      </Panel>
    </>
  )
}

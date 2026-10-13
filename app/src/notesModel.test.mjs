import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import {
  APPEARANCE_FIELDS,
  PERSONALITY_BLOCKS,
  narrativeCells,
  textFromCells,
  textToCells,
} from './notesModel.ts'
const template = JSON.parse(fs.readFileSync(new URL('./data/punpun.json', import.meta.url)))

test('narrative fields stay inside the original boxes and exclude labels and image cells', () => {
  const main = template.sheets.find((s) => s.title === 'v2.1')
  const allies = narrativeCells(template, 'Allies & organizations')
  const story = narrativeCells(template, 'Character backstory')
  assert.equal(allies.length, 16)
  assert.equal(allies[0], 'R147')
  assert.equal(allies.at(-1), 'R162')
  assert.equal(story.length, 13)
  assert.equal(story[0], 'R165')
  assert.equal(story.at(-1), 'R177')
  const fields = [
    ...allies,
    ...story,
    ...PERSONALITY_BLOCKS.flatMap((b) => b.cells),
    ...APPEARANCE_FIELDS.map(([, a]) => a),
  ]
  assert.equal(new Set(fields).size, fields.length)
  assert.equal(fields.includes('R164'), false)
  assert.ok(fields.every((a) => !main.cells[a]?.formula))
  assert.ok(
    fields.every(
      (a) =>
        !/CHARACTER BACKSTORY|ALLIES|PERSONALITY TRAITS|IDEALS|BONDS|FLAWS|^(AGE|HEIGHT|WEIGHT|SIZE|GENDER|EYES|HAIR|SKIN)$/.test(
          String(main.cells[a]?.value ?? ''),
        ),
    ),
  )
})

test('backstory follows a moved merged box instead of guessing addresses', () => {
  const book = {
    title: 'Custom',
    source: 'test',
    sheets: [
      {
        title: 'v2.1',
        cells: { R188: { value: 'CHARACTER BACKSTORY' } },
        merges: ['R185:AN185', 'R186:AN186', 'R187:AN187'],
      },
    ],
  }
  assert.deepEqual(narrativeCells(book, 'Character backstory'), ['R185', 'R186', 'R187'])
  book.sheets[0].merges = []
  assert.deepEqual(narrativeCells(book, 'Character backstory'), [])
  assert.deepEqual(narrativeCells(book, 'Allies & organizations'), [])
})

test('notes retain long multiline text and clearing removes stale lines', () => {
  const text = Array.from({ length: 30 }, (_, i) => `Story paragraph ${i}`).join('\n')
  const lines = textToCells(text, 13)
  assert.equal(lines.length, 13)
  assert.equal(textFromCells(lines), text)
  assert.deepEqual(textToCells('', 3), ['', '', ''])
  assert.equal(textFromCells(['One', '', 'Three', '', '']), 'One\n\nThree')
  assert.deepEqual(textToCells(text, 0), [])
})

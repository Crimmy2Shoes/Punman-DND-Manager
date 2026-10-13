import { useState } from 'react'
import type { ReactNode } from 'react'
import { Modal, Panel } from './components'
import { findSpell } from './legacySpells'
import SpellLibrary from './SpellLibrary'
import SpellReference from './SpellReference'
import CastingSummary from './CastingSummary'
import ItemLibrary, { priceInGold, findItem } from './ItemLibrary'
import { usesKnownSpellList, castingProfiles } from './castingRules'
import type { RuleSettings } from './companionRules'
import { editable } from './sheetModel'
import type { Value, Workbook } from './sheetModel'
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
  stage: (sheet: string, cell: string, value: Value) => void
  rules?: RuleSettings
}
const present = (v: Value) => v !== '' && v !== 0 && v !== false
function Pager({
  page,
  count,
  onChange,
}: {
  page: number
  count: number
  onChange: (page: number) => void
}) {
  const pages = Math.max(1, Math.ceil(count / 8))
  return (
    <div className="manager-pages">
      <button disabled={page === 0} onClick={() => onChange(page - 1)}>
        Previous
      </button>
      <span>
        {count} entries · {page + 1} / {pages}
      </span>
      <button disabled={page >= pages - 1} onClick={() => onChange(page + 1)}>
        Next page
      </button>
    </div>
  )
}
export function SheetInventory({ book, value, field, busy, stage }: Props) {
  const [query, setQuery] = useState(''),
    [page, setPage] = useState(0),
    [selected, setSelected] = useState<string | null>(null),
    [itemLibrary, setItemLibrary] = useState(false)
  const tab = 'Inventory'
  const entries = Array.from({ length: 74 }, (_, i) => i + 3).flatMap((row) => [
    { id: `left-${row}`, name: `J${row}`, quantity: `I${row}`, cost: `R${row}`, weight: `U${row}` },
    {
      id: `right-${row}`,
      name: `AA${row}`,
      quantity: `Z${row}`,
      cost: `AI${row}`,
      weight: `AL${row}`,
    },
  ])
  const occupied = entries.filter((e) =>
    [e.name, e.quantity, e.cost, e.weight].some((a) => present(value(tab, a))),
  )
  const filtered = occupied.filter((e) =>
    `${value(tab, e.name)} ${value(tab, e.cost)}`.toLowerCase().includes(query.toLowerCase()),
  )
  const currentPage = Math.min(page, Math.max(0, Math.ceil(filtered.length / 8) - 1)),
    entry = entries.find((e) => e.id === selected)
  const source = book.sheets.find((s) => s.title === tab)
  const empty = entries.find((e) =>
    [e.name, e.quantity, e.cost, e.weight].every(
      (a) => !present(value(tab, a)) && !!source && editable(source, a),
    ),
  )
  return (
    <>
      <Panel title="Inventory">
        <div className="manager-tools">
          <label className="field">
            <span>Search inventory</span>
            <input
              aria-label="Search inventory"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value)
                setPage(0)
              }}
            />
          </label>
          <button onClick={() => setItemLibrary(true)}>Browse items</button>
          <button
            className="primary"
            disabled={busy || !empty}
            onClick={() => setSelected(empty!.id)}
          >
            Add item
          </button>
        </div>
        <div className="manager-list">
          {filtered.slice(currentPage * 8, currentPage * 8 + 8).map((e) => (
            <button className="manager-entry" key={e.id} onClick={() => setSelected(e.id)}>
              <span>
                <strong>{String(value(tab, e.name)) || 'Unnamed item'}</strong>
                <small>
                  Quantity {String(value(tab, e.quantity)) || '—'} ·{' '}
                  {String(value(tab, e.weight)) || 0} lb · {String(value(tab, e.cost)) || 'No cost'}
                </small>
              </span>
              <span aria-hidden="true">Edit →</span>
            </button>
          ))}
        </div>
        {!filtered.length && <p>{query ? 'No matching items.' : 'No items yet.'}</p>}
        <Pager page={currentPage} count={filtered.length} onChange={setPage} />
      </Panel>
      <Panel title="Coins & totals">
        <div className="field-grid">
          {['Copper', 'Silver', 'Electrum', 'Gold', 'Platinum'].map((label, i) =>
            field(label, 'D' + (3 + i * 3), tab, 'number'),
          )}
          {field('Total weight', 'D25', tab)}
          {field('Total item value', 'D20', tab)}
        </div>
      </Panel>
      {entry && (
        <Modal
          title={String(value(tab, entry.name)) || 'Add inventory item'}
          onClose={() => setSelected(null)}
        >
          <div className="field-grid">
            {field('Item name', entry.name, tab)}
            {field('Quantity', entry.quantity, tab, 'number')}
            {field('Cost', entry.cost, tab)}
            {field('Weight (lb)', entry.weight, tab, 'number')}
          </div>
          {findItem(String(value(tab, entry.name))) && (
            <details className="coverage-note">
              <summary>Item effects & reference</summary>
              <p className="ability-full-text">
                {findItem(String(value(tab, entry.name)))!.detail}
              </p>
              <a
                target="_blank"
                rel="noreferrer"
                href={`https://media.wizards.com/2023/downloads/dnd/SRD_CC_v5.1.pdf#page=${findItem(String(value(tab, entry.name)))!.page}`}
              >
                SRD 5.1
              </a>
            </details>
          )}
          <div className="actions">
            <button className="primary" onClick={() => setSelected(null)}>
              Done
            </button>
            <button
              disabled={
                busy ||
                !source ||
                ![entry.name, entry.quantity, entry.cost, entry.weight].every((a) =>
                  editable(source, a),
                )
              }
              onClick={() => {
                ;[entry.name, entry.quantity, entry.cost, entry.weight].forEach((a) =>
                  stage(tab, a, ''),
                )
                setSelected(null)
              }}
            >
              Remove item
            </button>
          </div>
        </Modal>
      )}
      {itemLibrary && (
        <ItemLibrary
          onClose={() => setItemLibrary(false)}
          onAdd={
            busy || !empty
              ? undefined
              : (item) => {
                  stage(tab, empty!.name, item.name)
                  stage(tab, empty!.quantity, 1)
                  const cost = priceInGold(item.cost)
                  stage(tab, empty!.cost, cost ?? '')
                  stage(tab, empty!.weight, item.weight ?? '')
                  setItemLibrary(false)
                  setSelected(empty!.id)
                }
          }
        />
      )}
    </>
  )
}
const blocks = [
  [96, 98],
  [100, 104],
  [106, 110],
  [112, 116],
  [118, 121],
  [123, 126],
  [128, 131],
  [133, 135],
  [137, 139],
  [141, 143],
]
const totals = ['', 'AK101', 'E107', 'AK113', 'E119', 'AK124', 'E129', 'AK134', 'E138', 'AK142'],
  trackers = ['', 'AG101', 'I107', 'AG113', 'I119', 'AG124', 'I129', 'AG134', 'I138', 'AG142']
export function SheetSpells({ book, value, field, busy, stage, rules }: Props) {
  const [query, setQuery] = useState(''),
    [level, setLevel] = useState('all'),
    [prepared, setPrepared] = useState(false),
    [page, setPage] = useState(0),
    [selected, setSelected] = useState<string | null>(null),
    [addLevel, setAddLevel] = useState(0),
    [slots, setSlots] = useState<number | null>(null),
    [notice, setNotice] = useState('')
  const [library, setLibrary] = useState(false)
  const tab = 'v2.1',
    source = book.sheets.find((s) => s.title === tab)
  const knownList = usesKnownSpellList(book, value)
  const automatic = new Map(
    castingProfiles(book, value, rules).flatMap((p) =>
      p.grants
        .filter((g) => g.mode !== 'Expanded list')
        .map(
          (g) => [findSpell(g.name)?.name ?? g.name, { source: g.source, mode: g.mode }] as const,
        ),
    ),
  )
  const grantFor = (e: { name: string }) =>
    automatic.get(findSpell(String(value(tab, e.name)))?.name ?? String(value(tab, e.name)))
  const entries = blocks.flatMap(([start, end], level) =>
    Array.from({ length: end - start + 1 }, (_, i) => start + i).flatMap((row) =>
      (level % 2 === 1 ? ['D', 'N', 'X'] : ['N', 'X', 'AH']).map((col) => ({
        level,
        name: col + row,
        marker: ({ D: 'C', N: 'M', X: 'W', AH: 'AG' } as Record<string, string>)[col] + row,
      })),
    ),
  )
  const isPrepared = (address: string) =>
    present(value(tab, address)) && String(value(tab, address)).trim() !== '0'
  const filtered = entries.filter(
    (e) =>
      String(value(tab, e.name)).trim() &&
      (level === 'all' || e.level === Number(level)) &&
      (!prepared || knownList || e.level === 0 || grantFor(e) || isPrepared(e.marker)) &&
      String(value(tab, e.name)).toLowerCase().includes(query.toLowerCase()),
  )
  const currentPage = Math.min(page, Math.max(0, Math.ceil(filtered.length / 8) - 1)),
    entry = entries.find((e) => e.name === selected)
  const add = () => {
    const empty = entries.find(
      (e) =>
        e.level === addLevel &&
        !String(value(tab, e.name)).trim() &&
        !isPrepared(e.marker) &&
        !!source &&
        editable(source, e.name) &&
        editable(source, e.marker),
    )
    if (empty) {
      setNotice('')
      setSelected(empty.name)
    } else setNotice('No empty spell cells at this level.')
  }
  return (
    <>
      <Panel title="Spells">
        <div className="manager-tools">
          <label className="field">
            <span>Search spells</span>
            <input
              aria-label="Search spells"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value)
                setPage(0)
              }}
            />
          </label>
          <label className="field">
            <span>Spell level</span>
            <select
              aria-label="Spell level"
              value={level}
              onChange={(e) => {
                setLevel(e.target.value)
                setPage(0)
              }}
            >
              <option value="all">All levels</option>
              {blocks.map((_, i) => (
                <option value={i} key={i}>
                  {i === 0 ? 'Cantrips' : `Level ${i}`}
                </option>
              ))}
            </select>
          </label>
          <label className="manager-check">
            <input
              type="checkbox"
              checked={prepared}
              onChange={(e) => {
                setPrepared(e.target.checked)
                setPage(0)
              }}
            />
            Ready only
          </label>
        </div>
        <div className="actions">
          <label className="field">
            <span>Add at level</span>
            <select
              aria-label="Add spell level"
              value={addLevel}
              onChange={(e) => setAddLevel(Number(e.target.value))}
            >
              {blocks.map((_, i) => (
                <option value={i} key={i}>
                  {i === 0 ? 'Cantrip' : `Level ${i}`}
                </option>
              ))}
            </select>
          </label>
          <button className="primary" disabled={busy || !source} onClick={add}>
            Add spell
          </button>
          <button disabled={busy || !source} onClick={() => setLibrary(true)}>
            Browse spell definitions
          </button>
        </div>
        {notice && <p role="status">{notice}</p>}
        <div className="manager-list">
          {filtered.slice(currentPage * 8, currentPage * 8 + 8).map((e) => (
            <button className="manager-entry" key={e.name} onClick={() => setSelected(e.name)}>
              <span>
                <strong>{String(value(tab, e.name))}</strong>
                <small>
                  {e.level === 0 ? 'Cantrip' : `Level ${e.level}`} ·{' '}
                  {grantFor(e)
                    ? grantFor(e)!.mode
                    : e.level === 0 || knownList
                      ? 'Known'
                      : isPrepared(e.marker)
                        ? 'Prepared'
                        : 'Not prepared'}
                </small>
              </span>
              <span aria-hidden="true">Edit →</span>
            </button>
          ))}
        </div>
        {!filtered.length && (
          <p>{query || prepared ? 'No matching spells.' : 'No spells at this level yet.'}</p>
        )}
        <Pager page={currentPage} count={filtered.length} onChange={setPage} />
      </Panel>
      <Panel title="Spellcasting & slots">
        <CastingSummary book={book} read={value} settings={rules} />
        <div className="field-grid">
          {field('Spellcasting class', 'C91')}
          {field('Casting ability', 'U91')}
          {field('Spell save DC', 'AB91')}
          {field('Spell attack bonus', 'AI91')}
        </div>
        <div className="slot-shortcuts">
          {totals.slice(1).map((address, i) => (
            <button key={address} onClick={() => setSlots(i + 1)}>
              Level {i + 1}{' '}
              <strong>
                {String(value(tab, trackers[i + 1])) || '0'} / {String(value(tab, address)) || '0'}
              </strong>
            </button>
          ))}
        </div>
      </Panel>
      {entry && (
        <Modal
          title={
            String(value(tab, entry.name)) ||
            `Add ${entry.level === 0 ? 'cantrip' : `level ${entry.level} spell`}`
          }
          onClose={() => setSelected(null)}
        >
          <div className="field-grid">
            {field('Spell name', entry.name)}
            {!knownList &&
              !grantFor(entry) &&
              entry.level > 0 &&
              field('Prepared', entry.marker, tab, 'marker')}
            {grantFor(entry) && (
              <span>
                {grantFor(entry)!.mode} · {grantFor(entry)!.source}
              </span>
            )}
          </div>
          {findSpell(String(value(tab, entry.name))) ? (
            <SpellReference spell={findSpell(String(value(tab, entry.name)))!} />
          ) : (
            String(value(tab, entry.name)).trim() && (
              <p className="hint">
                No definition for this name in the installed rule pack. Custom names are kept as
                entered.
              </p>
            )
          )}
          <div className="actions">
            <button className="primary" onClick={() => setSelected(null)}>
              Done
            </button>
            <button
              disabled={
                busy || !source || !editable(source, entry.name) || !editable(source, entry.marker)
              }
              onClick={() => {
                stage(tab, entry.name, '')
                stage(tab, entry.marker, 0)
                setSelected(null)
              }}
            >
              Remove spell
            </button>
          </div>
        </Modal>
      )}
      {library && (
        <SpellLibrary
          book={book}
          read={value}
          busy={busy}
          settings={rules}
          onClose={() => setLibrary(false)}
          onChoose={(spell) => {
            const empty = entries.find(
              (e) =>
                e.level === spell.level &&
                !String(value(tab, e.name)).trim() &&
                !isPrepared(e.marker) &&
                !!source &&
                editable(source, e.name) &&
                editable(source, e.marker),
            )
            if (!empty) {
              setLibrary(false)
              setNotice('No empty spell cells at this level.')
              return
            }
            stage(tab, empty.name, spell.name)
            stage(tab, empty.marker, 0)
            setLibrary(false)
            setSelected(empty.name)
          }}
        />
      )}
      {slots !== null && (
        <Modal title={`Level ${slots} slots`} onClose={() => setSlots(null)}>
          <div className="field-grid">
            {field('Slot total', totals[slots])}
            {field('Slot tracker', trackers[slots], tab, 'number')}
          </div>
          <button onClick={() => setSlots(null)}>Done</button>
        </Modal>
      )}
    </>
  )
}

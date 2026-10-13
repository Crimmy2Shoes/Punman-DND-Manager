import { useState } from 'react'
import { Modal } from './components'
import type { Workbook } from './sheetModel'
import type { Reader, RuleSettings } from './companionRules'
import { SPELLS_2014, spellAccess, spellEconomy } from './legacySpells'
import type { SpellDefinition } from './legacySpells'
import SpellReference from './SpellReference'
export default function SpellLibrary({
  book,
  read,
  onClose,
  onChoose,
  busy,
  settings,
}: {
  book: Workbook
  read: Reader
  onClose: () => void
  onChoose: (spell: SpellDefinition) => void
  busy: boolean
  settings?: RuleSettings
}) {
  const [query, setQuery] = useState(''),
    [level, setLevel] = useState('all'),
    [school, setSchool] = useState('all'),
    [characterOnly, setCharacterOnly] = useState(false),
    [economy, setEconomy] = useState('all'),
    [page, setPage] = useState(0),
    [selected, setSelected] = useState<SpellDefinition | null>(null)
  const entries = SPELLS_2014.filter(
    (s) =>
      s.name.toLowerCase().includes(query.toLowerCase()) &&
      (level === 'all' || s.level === Number(level)) &&
      (school === 'all' || s.school.toLowerCase() === school) &&
      (economy === 'all' || spellEconomy(s.castingTime) === economy) &&
      (!characterOnly || spellAccess(book, read, s, settings).length > 0),
  )
  const maxPage = Math.max(0, Math.ceil(entries.length / 8) - 1),
    currentPage = Math.min(page, maxPage)
  return (
    <Modal title={selected ? selected.name : 'Spell library · 2014 rules'} onClose={onClose}>
      {selected ? (
        <>
          <SpellReference spell={selected} />
          <div className="actions">
            <button disabled={busy} className="primary" onClick={() => onChoose(selected)}>
              Add to character sheet
            </button>
            <button onClick={() => setSelected(null)}>Back to spells</button>
          </div>
          <p className="hint">
            {spellAccess(book, read, selected, settings).join(' · ') ||
              'Outside your ordinary class/level access. A feature, item or DM ruling is needed.'}{' '}
            Access does not mean this spell is already learned, in your spellbook or prepared.
          </p>
        </>
      ) : (
        <>
          <div className="manager-tools">
            <label className="field">
              <span>Find a spell</span>
              <input
                aria-label="Find library spell"
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value)
                  setPage(0)
                }}
              />
            </label>
            <label className="field">
              <span>Level</span>
              <select
                aria-label="Library spell level"
                value={level}
                onChange={(e) => {
                  setLevel(e.target.value)
                  setPage(0)
                }}
              >
                <option value="all">All levels</option>
                {Array.from({ length: 10 }, (_, i) => (
                  <option value={i} key={i}>
                    {i === 0 ? 'Cantrips' : i}
                  </option>
                ))}
              </select>
            </label>
            <label className="field">
              <span>School</span>
              <select
                aria-label="Library spell school"
                value={school}
                onChange={(e) => {
                  setSchool(e.target.value)
                  setPage(0)
                }}
              >
                <option value="all">All schools</option>
                {[...new Set(SPELLS_2014.map((s) => s.school.toLowerCase()))].sort().map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </select>
            </label>
            <label className="field">
              <span>Casting time</span>
              <select
                aria-label="Library casting type"
                value={economy}
                onChange={(e) => {
                  setEconomy(e.target.value)
                  setPage(0)
                }}
              >
                {['all', 'Action', 'Bonus action', 'Reaction', 'Unclassified'].map((c) => (
                  <option value={c} key={c}>
                    {c === 'all'
                      ? 'All casting times'
                      : c === 'Unclassified'
                        ? 'Longer casting'
                        : c}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <label className="manager-check">
            <input
              type="checkbox"
              checked={characterOnly}
              onChange={(e) => {
                setCharacterOnly(e.target.checked)
                setPage(0)
              }}
            />{' '}
            Class and level options
          </label>
          <div className="manager-list">
            {entries.slice(currentPage * 8, currentPage * 8 + 8).map((s) => (
              <button className="manager-entry" key={s.name} onClick={() => setSelected(s)}>
                <span>
                  <strong>{s.name}</strong>
                  <small>
                    {s.level === 0 ? 'Cantrip' : `Level ${s.level}`} · {s.school} ·{' '}
                    {s.castingTime.split(',')[0]}
                    {s.concentration ? ' · Concentration' : ''}
                  </small>
                </span>
                <span>Details →</span>
              </button>
            ))}
          </div>
          {!entries.length && <p>No matching spell definitions.</p>}
          <div className="manager-pages">
            <button disabled={currentPage === 0} onClick={() => setPage(currentPage - 1)}>
              Previous spells
            </button>
            <span>
              {entries.length} spells · {currentPage + 1} / {maxPage + 1}
            </span>
            <button disabled={currentPage === maxPage} onClick={() => setPage(currentPage + 1)}>
              Next spells
            </button>
          </div>
          <details className="coverage-note">
            <summary>Definition coverage</summary>
            <p>
              319 full SRD 5.1 spell definitions and 42 PHB 2014 mechanical summaries with source
              links, plus five Tasha’s spell summaries needed by expansion subclass grants. Other
              expansion and homebrew spells are not a complete catalog. Class access does not mean
              learned or prepared.
            </p>
          </details>
        </>
      )}
    </Modal>
  )
}

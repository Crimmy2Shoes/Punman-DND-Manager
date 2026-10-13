import { useState } from 'react'
import { Modal } from './components'
import legacy from './data/legacy-abilities.json'
import {
  OFFICIAL_SUBCLASSES,
  PHB_ADDITIONAL_ABILITIES,
  canonicalSubclass,
} from './phbSubclassRules'
import { EXPANSION_ABILITIES } from './expansionAbilities'
import type { Ability } from './companionRules'
const library: Ability[] = [
  ...(legacy as Ability[]),
  ...PHB_ADDITIONAL_ABILITIES,
  ...EXPANSION_ABILITIES,
]
export default function RulesLibrary({ onClose }: { onClose: () => void }) {
  const [className, setClassName] = useState('Rogue'),
    [sub, setSub] = useState(''),
    [level, setLevel] = useState(1),
    [future, setFuture] = useState(true),
    [query, setQuery] = useState(''),
    [page, setPage] = useState(0),
    [selected, setSelected] = useState<Ability | null>(null)
  const entries = library.filter(
    (a) =>
      a.className === className &&
      (!a.subclass || !sub || canonicalSubclass(className, a.subclass) === sub) &&
      (future || (a.level ?? 0) <= level) &&
      `${a.name} ${a.detail}`.toLowerCase().includes(query.toLowerCase()),
  )
  const pages = Math.max(1, Math.ceil(entries.length / 8)),
    current = Math.min(page, pages - 1)
  return (
    <Modal title={selected ? selected.name : 'Rules library · 2014 rules'} onClose={onClose}>
      {selected ? (
        <>
          <div className="ability-detail-meta">
            <span>{selected.subclass || selected.className}</span>
            <span>Class level {selected.level}</span>
            <span>{selected.economy}</span>
          </div>
          <p className="ability-full-text">{selected.detail}</p>
          <a
            href={
              selected.url ??
              `https://media.wizards.com/2023/downloads/dnd/SRD_CC_v5.1.pdf#page=${selected.page}`
            }
            target="_blank"
            rel="noreferrer"
          >
            {selected.source}
          </a>
          <div className="actions">
            <button onClick={() => setSelected(null)}>Back to class features</button>
          </div>
        </>
      ) : (
        <>
          <div className="rules-coverage-stats">
            <span>
              <strong>{Object.keys(OFFICIAL_SUBCLASSES).length}</strong> official classes
            </span>
            <span>
              <strong>{Object.values(OFFICIAL_SUBCLASSES).flat().length}</strong> official
              subclasses
            </span>
            <span>
              <strong>361</strong> core spells
            </span>
            <span>
              <strong>18</strong> skills
            </span>
          </div>
          <div className="manager-tools">
            <label className="field">
              <span>Class</span>
              <select
                aria-label="Library class"
                value={className}
                onChange={(e) => {
                  setClassName(e.target.value)
                  setSub('')
                  setPage(0)
                }}
              >
                {Object.keys(OFFICIAL_SUBCLASSES).map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
            </label>
            <label className="field">
              <span>Subclass</span>
              <select
                aria-label="Library subclass"
                value={sub}
                onChange={(e) => {
                  setSub(e.target.value)
                  setPage(0)
                }}
              >
                <option value="">All subclasses</option>
                {OFFICIAL_SUBCLASSES[className].map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </select>
            </label>
            <label className="field">
              <span>Class level</span>
              <input
                aria-label="Library class level"
                type="number"
                min={1}
                max={20}
                value={level}
                onChange={(e) => {
                  setLevel(Math.max(1, Math.min(20, Number(e.target.value) || 1)))
                  setPage(0)
                }}
              />
            </label>
            <label className="field">
              <span>Search features</span>
              <input
                aria-label="Search class features"
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value)
                  setPage(0)
                }}
              />
            </label>
          </div>
          <label className="manager-check">
            <input
              type="checkbox"
              checked={future}
              onChange={(e) => {
                setFuture(e.target.checked)
                setPage(0)
              }}
            />
            Show future unlocks
          </label>
          <div className="manager-list">
            {entries.slice(current * 8, current * 8 + 8).map((a, i) => (
              <button
                className="manager-entry"
                key={`${a.className}-${a.subclass}-${a.name}-${i}`}
                onClick={() => setSelected(a)}
              >
                <span>
                  <strong>{a.name}</strong>
                  <small>
                    {a.subclass || a.className} · class level {a.level} · {a.economy}
                    {(a.level ?? 0) > level ? ' · Future unlock' : ''}
                  </small>
                </span>
                <span>Details →</span>
              </button>
            ))}
          </div>
          {!entries.length && <p>No features match.</p>}
          <div className="manager-pages">
            <button disabled={current === 0} onClick={() => setPage(current - 1)}>
              Previous features
            </button>
            <span>
              {entries.length} features · {current + 1} / {pages}
            </span>
            <button disabled={current === pages - 1} onClick={() => setPage(current + 1)}>
              Next features
            </button>
          </div>
          <details className="coverage-note">
            <summary>Installed sources & coverage</summary>
            <p>
              Core 2014 Player’s Handbook: base class features, all 40 subclass feature
              progressions, 319 full SRD spell definitions and 42 additional spell summaries.
              Feature choices include Fighting Styles, Metamagic, Pact Boons, all 32 SRD
              invocations, all 16 PHB maneuvers, Hunter choices, three PHB totems and Four Elements
              disciplines.
            </p>
            <p>
              Your selected World Anvil Pugilist version is also supported in the character guide.
              Published 2014 subclasses from DMG, SCAG, Xanathar’s, Tasha’s, setting books, Fizban’s
              and Bigby’s now have level-gated mechanical summaries. Complex choice tables and
              companion stat blocks use their linked references. Expansion spell definitions, feats,
              optional class replacements and every racial variant are not an exhaustive installed
              catalog. New entries do not grant every listed choice.
            </p>
            <a
              href="https://media.wizards.com/2023/downloads/dnd/SRD_CC_v5.1.pdf"
              target="_blank"
              rel="noreferrer"
            >
              SRD 5.1
            </a>
          </details>
        </>
      )}
    </Modal>
  )
}

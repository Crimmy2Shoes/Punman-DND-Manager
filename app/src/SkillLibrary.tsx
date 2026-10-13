import { useState } from 'react'
import { Modal } from './components'
import skills from './data/legacy-skills.json'
export default function SkillLibrary({ onClose }: { onClose: () => void }) {
  const [query, setQuery] = useState(''),
    [selected, setSelected] = useState<(typeof skills)[number] | null>(null),
    [page, setPage] = useState(0)
  const entries = skills
      .filter((s) => s.name.toLowerCase().includes(query.toLowerCase()))
      .sort((a, b) => a.name.localeCompare(b.name)),
    pages = Math.max(1, Math.ceil(entries.length / 8)),
    current = Math.min(page, pages - 1)
  return (
    <Modal title={selected ? selected.name : 'Skills · 2014 rules'} onClose={onClose}>
      {selected ? (
        <>
          <p className="hint">
            Usually {selected.ability} · the DM can call for a different ability where appropriate.
          </p>
          <p className="ability-full-text">{selected.detail}</p>
          <a
            href={`https://media.wizards.com/2023/downloads/dnd/SRD_CC_v5.1.pdf#page=${selected.page}`}
            target="_blank"
            rel="noreferrer"
          >
            SRD 5.1 · page {selected.page}
          </a>
          <div className="actions">
            <button onClick={() => setSelected(null)}>Back to skills</button>
          </div>
        </>
      ) : (
        <>
          <p>
            All 18 skills can be attempted without training unless a particular task requires it.
            Class, race, background and features grant proficiency; Expertise doubles an existing
            proficiency bonus. A skill’s action cost depends on the task and the feature being used.
          </p>
          <label className="field">
            <span>Find a skill</span>
            <input
              aria-label="Find skill definition"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value)
                setPage(0)
              }}
            />
          </label>
          <div className="manager-list">
            {entries.slice(current * 8, current * 8 + 8).map((s) => (
              <button className="manager-entry" key={s.name} onClick={() => setSelected(s)}>
                <span>
                  <strong>{s.name}</strong>
                  <small>{s.ability}</small>
                </span>
                <span>Details →</span>
              </button>
            ))}
          </div>
          <div className="manager-pages">
            <button disabled={current === 0} onClick={() => setPage(current - 1)}>
              Previous skills
            </button>
            <span>
              {entries.length} skills · {current + 1} / {pages}
            </span>
            <button disabled={current === pages - 1} onClick={() => setPage(current + 1)}>
              Next skills
            </button>
          </div>
        </>
      )}
    </Modal>
  )
}

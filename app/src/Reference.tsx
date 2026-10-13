import { useState } from 'react'
import references from './data/references.json'
import { Panel, Field } from './components'
export default function Reference() {
  const [search, setSearch] = useState('')
  const filtered = references.filter((r) =>
    (r.name + ' ' + r.text).toLowerCase().includes(search.toLowerCase()),
  )
  return (
    <Panel title="Rules reference" subtitle="SRD 5.2.1 · Available offline">
      <Field label="Search rules reference" value={search} onChange={setSearch} />
      <p className="hint">
        SRD class descriptions, origins, feats, equipment, and glossary. For options outside the
        SRD, use your own source and custom entries.
      </p>
      <div className="entry-list">
        {filtered.map((r) => (
          <details className="entry" key={r.name}>
            <summary>
              <strong>{r.name}</strong>
              <span>
                {r.category} · SRD p. {r.page}
              </span>
            </summary>
            <div className="reference-text">{r.text}</div>
          </details>
        ))}
      </div>
      {!filtered.length && <p>No matching reference sections.</p>}
      <p className="attribution">
        This work includes material from the System Reference Document 5.2.1 (“SRD 5.2.1”) by
        Wizards of the Coast LLC, available at{' '}
        <a href="https://www.dndbeyond.com/srd" target="_blank" rel="noreferrer">
          https://www.dndbeyond.com/srd
        </a>
        . The SRD 5.2.1 is licensed under the Creative Commons Attribution 4.0 International
        License, available at{' '}
        <a
          href="https://creativecommons.org/licenses/by/4.0/legalcode"
          target="_blank"
          rel="noreferrer"
        >
          https://creativecommons.org/licenses/by/4.0/legalcode
        </a>
        . Reference text and spell data were extracted and reformatted; calculations and summaries
        are adaptations.
      </p>
    </Panel>
  )
}

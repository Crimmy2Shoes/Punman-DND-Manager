import { useState } from 'react'
import { Panel } from './components'
import type { Workbook } from './sheetModel'
import type { Reader, RuleSettings } from './companionRules'
import { featureGroups, featureChoiceIssues } from './featureChoices'
export default function FeatureChoices({
  book,
  read,
  settings,
  onChange,
}: {
  book: Workbook
  read: Reader
  settings: RuleSettings
  onChange: (s: RuleSettings) => void
}) {
  const [notice, setNotice] = useState('')
  const groups = featureGroups(book, read, settings),
    ids = settings.selections ?? [],
    issues = featureChoiceIssues(book, read, settings)
  return (
    <Panel
      title="Feature choices"
      subtitle="Active options appear in Your turn; saved with this device’s character rules."
    >
      {!groups.length && (
        <p>No selectable options in the installed pack at your current class levels.</p>
      )}
      {groups.map((g) => (
        <details className="feature-choice-group" key={g.id}>
          <summary>
            {g.label}
            <span>
              {g.options.filter((o) => ids.includes(o.id)).length} / {g.limit}
            </span>
          </summary>
          <div className="feature-choice-options">
            {g.options.map((o) => (
              <div className="feature-choice-option" key={o.id}>
                <label className="manager-check">
                  <input
                    type="checkbox"
                    aria-label={`Choose ${g.label} ${o.name}`}
                    checked={ids.includes(o.id)}
                    disabled={!o.eligible && !ids.includes(o.id)}
                    onChange={(e) => {
                      let next = ids.filter((id) => id !== o.id)
                      if (e.target.checked) {
                        if (g.limit === 1)
                          next = next.filter((id) => !g.options.some((option) => option.id === id))
                        next.push(o.id)
                      } else if (g.id === 'Artificer:infusion') {
                        next = next.filter(
                          (id) =>
                            ![
                              `Artificer:infused:${o.name}`,
                              `Artificer:armored-infused:${o.name}`,
                            ].includes(id),
                        )
                      }
                      const candidate = { ...settings, selections: next },
                        problems = featureChoiceIssues(book, read, candidate)
                      if (e.target.checked && settings.enforce && problems.length) {
                        setNotice(problems[0])
                        return
                      }
                      onChange(candidate)
                      setNotice('')
                    }}
                  />
                  <span>
                    <strong>{o.name}</strong>
                    <small>
                      {o.economy}
                      {o.cost ? ` · ${o.cost}` : ''}
                      {!o.eligible
                        ? ` · Requires ${o.prerequisite || `class level ${o.level}`}`
                        : ''}
                    </small>
                  </span>
                </label>
                <details>
                  <summary>Effect & requirements</summary>
                  <p className="ability-full-text">{o.detail}</p>
                  <a
                    href={
                      o.url ??
                      `https://media.wizards.com/2023/downloads/dnd/SRD_CC_v5.1.pdf#page=${o.page}`
                    }
                    target="_blank"
                    rel="noreferrer"
                  >
                    {o.source}
                  </a>
                </details>
              </div>
            ))}
          </div>
        </details>
      ))}
      {issues.map((issue) => (
        <p className="budget-warning" key={issue}>
          {issue}
        </p>
      ))}
      {notice && (
        <p role="alert" className="budget-warning">
          {notice}
        </p>
      )}
      {ids.some((id) => !groups.some((g) => g.options.some((o) => o.id === id))) && (
        <button
          onClick={() =>
            onChange({
              ...settings,
              selections: ids.filter((id) =>
                groups.some((g) => g.options.some((o) => o.id === id)),
              ),
            })
          }
        >
          Remove unavailable choices
        </button>
      )}
    </Panel>
  )
}

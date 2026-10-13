import { useState } from 'react'
import type { Workbook } from './sheetModel'
import { Modal, Panel } from './components'
import { skillBudget, DEFAULT_RULES } from './companionRules'
import type { RuleSettings, Reader, Ability, Economy } from './companionRules'
import { abilitiesFor, SRD_URL, PUGILIST_URL } from './combatLibrary'
import { findSpell } from './legacySpells'
import SpellReference from './SpellReference'
import FeatureChoices from './FeatureChoicePanel'
import RulesLibrary from './RulesLibrary'
import { featureChoiceIssues } from './featureChoices'
type Props = { book: Workbook; read: Reader; settings: RuleSettings; onSettings: () => void }
export function SkillSummary({ book, read, settings, onSettings }: Props) {
  const b = skillBudget(book, read, settings)
  const [sourcesOpen, setSourcesOpen] = useState(false)
  const grouped = [
    ...b.grants
      .reduce((groups, g) => {
        const current = groups.get(g.source) ?? {
          source: g.source,
          count: 0,
          references: new Set<string>(),
          urls: new Map<string, string>(),
          allowed: new Set<string>(),
          conditions: new Set<string>(),
        }
        current.count += g.count
        if (g.reference) {
          current.references.add(g.reference)
          if (g.url) current.urls.set(g.reference, g.url)
        }
        g.allowed.forEach((s) => current.allowed.add(s))
        if (g.condition) current.conditions.add(g.condition)
        groups.set(g.source, current)
        return groups
      }, new Map<string, { source: string; count: number; references: Set<string>; urls: Map<string, string>; allowed: Set<string>; conditions: Set<string> }>())
      .values(),
  ]
  const race = String(read('v2.1', 'T7'))
  const raceRow = Object.entries(book.sheets.find((s) => s.title === 'Race Info')?.cells ?? {})
    .find(([a, c]) => /^B\d+$/.test(a) && c.value === race)?.[0]
    .slice(1)
  if (raceRow && !grouped.some((g) => g.source === race))
    grouped.push({
      source: race,
      count: 0,
      references: new Set([`Race Info!AJ${raceRow}`]),
      urls: new Map(),
      allowed: new Set(),
      conditions: new Set(),
    })
  const knownLimit = b.known || settings.skillLimit !== null || b.sheetCount !== null
  return (
    <div className="skill-budget">
      <div className="budget-heading">
        <span className="budget-origin">{b.limitSource}</span>
        <div className="budget-actions">
          <button className="text-button" onClick={() => setSourcesOpen(true)}>
            Why this total?
          </button>
          <button className="text-button" onClick={onSettings}>
            DM overrides
          </button>
        </div>
      </div>
      <div className="budget-stats">
        <div>
          <strong>
            {b.selected.length} / {knownLimit ? b.limit : '?'}
          </strong>
          <span>Proficient skills</span>
        </div>
        <div>
          <strong>
            {b.expertise.length + settings.toolExpertise} / {b.expertiseLimit}
          </strong>
          <span>Expertise choices</span>
        </div>
        <div>
          <strong>{knownLimit ? b.remaining : '—'}</strong>
          <span>Skills left</span>
        </div>
      </div>
      {(!b.known ||
        b.unmatched.length > 0 ||
        b.selected.length > b.limit ||
        b.expertise.length + settings.toolExpertise > b.expertiseLimit ||
        (settings.expertiseLimit === null && b.expertiseUnmatched.length > 0)) && (
        <p className="budget-warning" role="status">
          {!b.known
            ? 'Some grants could not be resolved. Review sources or set a DM limit.'
            : b.selected.length > b.limit
              ? 'Your skill selections exceed the current limit.'
              : b.expertise.length + settings.toolExpertise > b.expertiseLimit
                ? 'Your Expertise selections exceed the current limit.'
                : b.expertiseUnmatched.length > 0 && settings.expertiseLimit === null
                  ? `Review Expertise sources: ${b.expertiseUnmatched.join(', ')}.`
                  : `Review skill sources: ${b.unmatched.join(', ')}.`}
        </p>
      )}
      {sourcesOpen && (
        <Modal title="Where your skill total comes from" onClose={() => setSourcesOpen(false)}>
          <p className="training-calculation">
            {knownLimit ? `${b.limit} total skill proficiencies` : 'Skill total not yet confirmed'}{' '}
            · {b.limitSource}
          </p>
          {b.sheetCount !== null && (
            <p className="hint">
              Spreadsheet calculation: {Number(read('v2.1', 'AS16'))} class/race/feature grants
              (v2.1!AS16) + {b.bgSkills.length} background grants = {b.sheetCount}.
              {settings.extraSkills > 0 ? ` Plus ${settings.extraSkills} DM bonus.` : ''}
            </p>
          )}
          {b.sheetCount === null && settings.skillLimit === null && (
            <p className="hint">
              This estimate uses your selected class, race, background and feature references.
              Connect, save changed origins and refresh for the sheet’s calculated total.
            </p>
          )}
          <div className="training-source-list">
            {grouped.map((g) => (
              <div key={g.source} className="training-source-row">
                <div>
                  <strong>{g.source}</strong>
                  <div className="training-references">
                    {[...g.references].map((ref) =>
                      g.urls.has(ref) ? (
                        <a key={ref} href={g.urls.get(ref)} target="_blank" rel="noreferrer">
                          {ref}
                        </a>
                      ) : (
                        <span key={ref}>{ref}</span>
                      ),
                    )}
                  </div>
                  {[...g.conditions].map((condition) => (
                    <p className="grant-condition" key={condition}>
                      {condition}
                    </p>
                  ))}
                  {g.count > 0 ? (
                    <details>
                      <summary>Eligible skills</summary>
                      <p>{g.allowed.size === 18 ? 'Any skill' : [...g.allowed].join(', ')}</p>
                    </details>
                  ) : (
                    <p className="grant-condition">No additional skill proficiencies.</p>
                  )}
                </div>
                <strong className="training-source-count">
                  {g.count > 0 ? '+' : ''}
                  {g.count}
                </strong>
              </div>
            ))}
          </div>
          {settings.skillLimit !== null && (
            <p className="training-calculation">
              DM total override: {settings.skillLimit}. This replaces the source total.
            </p>
          )}
          {settings.reason && <p className="hint">DM ruling: {settings.reason}</p>}
          <p className="hint">
            Expertise is included in proficient skills. Saving throws and tools use separate grants.
            {b.classes.some((c) => c.name === 'Rogue')
              ? ' Rogue Expertise can also be assigned to thieves’ tools.'
              : ''}
          </p>
          <p className="hint">
            Class Expertise: {b.baseExpertise} · Extra DM Expertise: {settings.extraExpertise}
            {settings.expertiseLimit !== null
              ? ` · DM total override: ${settings.expertiseLimit}`
              : ''}
            {settings.toolExpertise
              ? ` · ${settings.toolExpertise} assigned to thieves’ tools`
              : ''}
            .
          </p>
          {b.fixedExpertise.length > 0 && (
            <p>
              Fixed doubled proficiencies: {b.fixedExpertise.join(', ')}. These do not become
              unrestricted Expertise choices.
            </p>
          )}
          {b.sheetCount !== null && b.sheetCount !== b.derived && (
            <p className="budget-warning" role="status">
              {b.sheetCount > b.derived
                ? `The sheet includes ${b.sheetCount - b.derived} grant(s) not mapped to a named source, listed as Additional sheet grants.`
                : `Mapped references explain ${b.derived} grants; the sheet calculates ${b.sheetCount}. The spreadsheet total takes priority. Review features or use a DM override for a confirmed exception.`}
            </p>
          )}
          <div className="actions">
            <button
              onClick={() => {
                setSourcesOpen(false)
                onSettings()
              }}
            >
              Edit DM overrides
            </button>
            <button onClick={() => setSourcesOpen(false)}>Done</button>
          </div>
        </Modal>
      )}
    </div>
  )
}
const categories: Economy[] = [
  'Action',
  'Bonus action',
  'Reaction',
  'Movement',
  'Passive',
  'Unclassified',
]
export function AbilityGuide({ book, read, settings, onSettings }: Props) {
  const [category, setCategory] = useState<Economy>('Bonus action'),
    [query, setQuery] = useState(''),
    [page, setPage] = useState(0),
    [selected, setSelected] = useState<Ability | null>(null),
    [libraryOpen, setLibraryOpen] = useState(false)
  const { abilities, classes, unsupported } = abilitiesFor(book, read, settings)
  const entries = abilities.filter(
    (a) =>
      a.economy === category &&
      `${a.name} ${a.detail} ${a.className ?? ''} ${a.subclass ?? ''}`
        .toLowerCase()
        .includes(query.toLowerCase()),
  )
  const maxPage = Math.max(0, Math.ceil(entries.length / 6) - 1),
    currentPage = Math.min(page, maxPage)
  const pugi = classes.find((c) => c.name === 'Pugilist'),
    installed = book.sheets.some((s) => s.title === 'Pugilist')
  return (
    <Panel
      title="Your turn"
      subtitle="1 action · 1 bonus action when granted · 1 reaction until your next turn"
    >
      <div className="turn-overview">
        <div>
          <span>Movement</span>
          <strong>
            {String(read('v2.1', 'Z12')) || '—'} <small>speed from sheet</small>
          </strong>
        </div>
        {pugi && (
          <div>
            <span>Moxie</span>
            <strong>
              {installed ? String(read('Pugilist', 'B5')) : '—'} /{' '}
              {installed ? String(read('Pugilist', 'B4')) : '—'} <small>short / long rest</small>
            </strong>
          </div>
        )}
        <button onClick={onSettings}>Customize abilities</button>
        <button onClick={() => setLibraryOpen(true)}>Rules library</button>
      </div>
      <div className="ability-tabs" role="group" aria-label="Action types">
        {categories.map((c) => (
          <button
            key={c}
            aria-pressed={category === c}
            onClick={() => {
              setCategory(c)
              setPage(0)
            }}
          >
            {c}
            <small>{abilities.filter((a) => a.economy === c).length}</small>
          </button>
        ))}
      </div>
      <label className="field ability-search">
        <span>Find an ability</span>
        <input
          aria-label="Find an ability"
          placeholder="Search your abilities…"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value)
            setPage(0)
          }}
        />
      </label>
      <div className="ability-grid">
        {entries.slice(currentPage * 6, currentPage * 6 + 6).map((a, i) => (
          <button
            className="ability-card"
            key={`${a.source}-${a.name}-${i}`}
            onClick={() => setSelected(a)}
          >
            <span className="ability-origin">
              {a.subclass || a.className || a.source}
              {a.level ? ` · level ${a.level}` : ''}
            </span>
            <strong>{a.name}</strong>
            <span className="ability-excerpt">{a.detail}</span>
            {a.cost && <span className="ability-cost">{a.cost}</span>}
            <small>View details →</small>
          </button>
        ))}
      </div>
      {!entries.length && (
        <p className="empty-state">
          No {category.toLowerCase()} abilities match. Add a custom ability if your DM has granted
          one.
        </p>
      )}
      {maxPage > 0 && (
        <div className="manager-pages">
          <button disabled={currentPage === 0} onClick={() => setPage(currentPage - 1)}>
            Previous abilities
          </button>
          <span>
            {currentPage + 1} / {maxPage + 1}
          </span>
          <button disabled={currentPage === maxPage} onClick={() => setPage(currentPage + 1)}>
            Next abilities
          </button>
        </div>
      )}
      {unsupported.length > 0 && (
        <details className="coverage-note">
          <summary>Review ability coverage ({unsupported.length})</summary>
          {unsupported.map((s) => (
            <p key={s}>{s}</p>
          ))}
          <button onClick={onSettings}>Add custom ability</button>
        </details>
      )}
      <details className="coverage-note">
        <summary>Rules reference</summary>
        <p>
          Abilities are a guide; sheet values remain authoritative. Fighting Style, Metamagic,
          invocations and subclass options require a choice. These cards do not spend resources or
          apply combat effects.
        </p>
        <a href={SRD_URL} target="_blank" rel="noreferrer">
          2014 rules · SRD 5.1
        </a>
        {pugi && (
          <>
            {' '}
            ·{' '}
            <a href={PUGILIST_URL} target="_blank" rel="noreferrer">
              Your Pugilist version
            </a>
          </>
        )}
        <p>
          This work includes material taken from the System Reference Document 5.1 (“SRD 5.1”) by
          Wizards of the Coast LLC and available at{' '}
          <a
            href="https://dnd.wizards.com/resources/systems-reference-document"
            target="_blank"
            rel="noreferrer"
          >
            the SRD resource page
          </a>
          . The SRD 5.1 is licensed under the{' '}
          <a
            href="https://creativecommons.org/licenses/by/4.0/legalcode"
            target="_blank"
            rel="noreferrer"
          >
            Creative Commons Attribution 4.0 International License
          </a>
          .
        </p>
      </details>
      {selected && (
        <Modal title={selected.name} onClose={() => setSelected(null)}>
          <div className="ability-detail-meta">
            <span>{selected.economy}</span>
            {selected.cost && <span>{selected.cost}</span>}
            <span>{selected.subclass || selected.className || selected.source}</span>
          </div>
          {selected.spellName && findSpell(selected.spellName) ? (
            <SpellReference spell={findSpell(selected.spellName)!} />
          ) : (
            <p className="ability-full-text">{selected.detail}</p>
          )}
          {selected.source === 'SRD 5.1' && (
            <a
              href={`${SRD_URL}${selected.page ? '#page=' + selected.page : ''}`}
              target="_blank"
              rel="noreferrer"
            >
              Open rules reference{selected.page ? ` · page ${selected.page}` : ''}
            </a>
          )}
          {selected.source === 'Pugilist reference' && (
            <a href={PUGILIST_URL} target="_blank" rel="noreferrer">
              Open Pugilist rules
            </a>
          )}
          {selected.url && !selected.spellName && (
            <a href={selected.url} target="_blank" rel="noreferrer">
              Open source · {selected.source}
            </a>
          )}
          <div className="actions">
            <button onClick={() => setSelected(null)}>Done</button>
          </div>
        </Modal>
      )}
      {libraryOpen && <RulesLibrary onClose={() => setLibraryOpen(false)} />}
    </Panel>
  )
}
export function RulesDialog({
  book,
  read,
  settings,
  onChange,
  onClose,
}: {
  book: Workbook
  read: Reader
  settings: RuleSettings
  onChange: (s: RuleSettings) => void
  onClose: () => void
}) {
  const [draft, setDraft] = useState(settings),
    [error, setError] = useState(''),
    [name, setName] = useState(''),
    [detail, setDetail] = useState(''),
    [economy, setEconomy] = useState<Economy>('Bonus action'),
    [source, setSource] = useState('DM grant')
  const set = <K extends keyof RuleSettings>(key: K, v: RuleSettings[K]) =>
    setDraft({ ...draft, [key]: v })
  const b = skillBudget(book, read, draft)
  const numeric = (
    label: string,
    key: 'extraSkills' | 'extraExpertise' | 'skillLimit' | 'expertiseLimit' | 'toolExpertise',
    max = 18,
  ) => (
    <label className="field">
      <span>{label}</span>
      <input
        aria-label={label}
        type="number"
        min="0"
        max={max}
        step="1"
        value={draft[key] ?? ''}
        placeholder={key.endsWith('Limit') ? 'Use source grants' : undefined}
        onChange={(e) => {
          const v = e.target.value
          if (v === '' && key.endsWith('Limit')) set(key, null)
          else if (v !== '' && Number.isInteger(Number(v)) && Number(v) >= 0 && Number(v) <= max)
            set(key, Number(v))
        }}
      />
    </label>
  )
  const valid = (d: RuleSettings) =>
    [d.extraSkills, d.extraExpertise, d.toolExpertise, d.skillLimit, d.expertiseLimit].every(
      (n) => n === null || (Number.isInteger(n) && n >= 0 && n <= 18),
    ) &&
    d.toolExpertise <= 1 &&
    typeof d.enforce === 'boolean' &&
    typeof d.reason === 'string' &&
    d.reason.length <= 1000 &&
    Array.isArray(d.abilities) &&
    (d.selections === undefined ||
      (Array.isArray(d.selections) &&
        d.selections.length <= 150 &&
        d.selections.every((id) => typeof id === 'string' && id.length <= 150))) &&
    d.abilities.length <= 100 &&
    d.abilities.every(
      (a) =>
        typeof a.name === 'string' &&
        a.name.length > 0 &&
        a.name.length <= 100 &&
        typeof a.detail === 'string' &&
        a.detail.length <= 10000 &&
        typeof a.source === 'string' &&
        a.source.length <= 100 &&
        categories.includes(a.economy),
    )
  return (
    <Modal title="Rules & overrides" onClose={onClose}>
      <p className="hint">
        Settings belong to this spreadsheet on this device. Share them with Export rules. They do
        not change sheet formulas. A custom ability with the same name replaces its guide card.
      </p>
      <Panel title="Skill grants">
        <div className="field-grid">
          {numeric('Extra skill proficiencies from DM', 'extraSkills')}
          {numeric('Extra Expertise from DM', 'extraExpertise')}
          {numeric('Override total skill limit', 'skillLimit')}
          {numeric('Override total Expertise limit', 'expertiseLimit')}
          {(b.classes.some((c) => c.name === 'Rogue') || draft.toolExpertise > 0) &&
            numeric('Expertise assigned to thieves’ tools', 'toolExpertise', 1)}
        </div>
        <label className="manager-check">
          <input
            type="checkbox"
            checked={draft.enforce}
            onChange={(e) => set('enforce', e.target.checked)}
          />{' '}
          Enforce skill counts and eligible choices
        </label>
        <label className="field">
          <span>DM ruling / reason</span>
          <input
            aria-label="DM ruling / reason"
            maxLength={1000}
            value={draft.reason}
            onChange={(e) => set('reason', e.target.value)}
          />
        </label>
        <p className="hint">
          Allowed: {b.limit} skill proficiencies · {b.expertiseLimit} Expertise selections. A total
          skill override allows any skills. Formula protection and Google Sheets validation always
          apply.
        </p>
      </Panel>
      <FeatureChoices book={book} read={read} settings={draft} onChange={setDraft} />
      <Panel title="Custom abilities">
        <div className="field-grid">
          <label className="field">
            <span>Ability name</span>
            <input
              aria-label="Custom ability name"
              maxLength={100}
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </label>
          <label className="field">
            <span>Action type</span>
            <select
              aria-label="Custom action type"
              value={economy}
              onChange={(e) => setEconomy(e.target.value as Economy)}
            >
              {categories.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </label>
          <label className="field">
            <span>Source</span>
            <input
              aria-label="Custom ability source"
              value={source}
              maxLength={100}
              onChange={(e) => setSource(e.target.value)}
            />
          </label>
        </div>
        <label className="field">
          <span>Effect, requirements & resource cost</span>
          <textarea
            aria-label="Custom ability effect"
            maxLength={10000}
            value={detail}
            onChange={(e) => setDetail(e.target.value)}
          />
        </label>
        <button
          disabled={!name.trim() || !detail.trim() || draft.abilities.length >= 100}
          onClick={() => {
            set('abilities', [
              ...draft.abilities,
              {
                id: crypto.randomUUID(),
                name: name.trim(),
                detail: detail.trim(),
                economy,
                source: source.trim() || 'DM grant',
              },
            ])
            setName('')
            setDetail('')
          }}
        >
          Add ability
        </button>
        <div className="custom-ability-list">
          {draft.abilities.map((a, i) => (
            <div key={a.id ?? i}>
              <span>
                <strong>{a.name}</strong>
                <small>
                  {a.economy} · {a.source}
                </small>
              </span>
              <button
                aria-label={`Remove ${a.name}`}
                onClick={() =>
                  set(
                    'abilities',
                    draft.abilities.filter((_, n) => n !== i),
                  )
                }
              >
                Remove
              </button>
            </div>
          ))}
        </div>
      </Panel>
      {error && <p role="alert">{error}</p>}
      <div className="actions">
        <button
          className="primary"
          onClick={() => {
            if (!valid(draft)) {
              setError('Review the rule limits and custom abilities.')
              return
            }
            const issues = featureChoiceIssues(book, read, draft)
            if (draft.enforce && issues.length) {
              setError(issues[0])
              return
            }
            onChange(draft)
            onClose()
          }}
        >
          Save rules
        </button>
        <button onClick={() => setDraft({ ...DEFAULT_RULES, abilities: [] })}>Reset rules</button>
        <button
          onClick={() => {
            const url = URL.createObjectURL(
              new Blob([JSON.stringify({ version: 1, rules: draft }, null, 2)], {
                type: 'application/json',
              }),
            )
            const a = document.createElement('a')
            a.href = url
            a.download = 'character-rules.json'
            a.click()
            setTimeout(() => URL.revokeObjectURL(url), 1000)
          }}
        >
          Export rules
        </button>
        <label className="rules-import">
          Import rules
          <input
            aria-label="Import rules"
            type="file"
            accept=".json,application/json"
            onChange={async (e) => {
              const file = e.target.files?.[0]
              if (!file) return
              try {
                if (file.size > 1024 * 1024) throw Error()
                const data = JSON.parse(await file.text())
                if (data.version !== 1 || !valid(data.rules)) throw Error()
                setDraft(data.rules)
                setError('')
              } catch {
                setError('Choose a valid character-rules.json export (up to 1 MB).')
              }
              e.target.value = ''
            }}
          />
        </label>
      </div>
    </Modal>
  )
}

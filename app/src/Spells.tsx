import { useState } from 'react'
import { Plus, Trash2, Sparkles } from 'lucide-react'
import { Panel, Field, Select, Toggle, Note, num, Choice } from './components'
import { abilities, newSpell, mod, proficiency, signed } from './character'
import type { Character, Ability, Spell } from './character'
import { castSpell } from './rules'
import spellLibrary from './data/spells.json'
import { spellSchools } from './options'
export default function Spells({ c, replace }: { c: Character; replace: (c: Character) => void }) {
  const [search, setSearch] = useState(''),
    [filter, setFilter] = useState('all'),
    [classFilter, setClassFilter] = useState('all'),
    [showLibrary, setShowLibrary] = useState(false),
    [error, setError] = useState(''),
    [source, setSource] = useState<'slot' | 'pact' | 'ritual' | 'free'>('slot'),
    [slotLevel, setSlotLevel] = useState(1)
  const update = (patch: Partial<Character>) => replace({ ...c, ...patch })
  const edit = (id: string, patch: Partial<Spell>) =>
    update({ spellEntries: c.spellEntries.map((s) => (s.id === id ? { ...s, ...patch } : s)) })
  const add = (s: Omit<Spell, 'id' | 'prepared'>) =>
    update({ spellEntries: [...c.spellEntries, { ...s, id: crypto.randomUUID(), prepared: true }] })
  const filtered = spellLibrary.filter(
    (s) =>
      s.name.toLowerCase().includes(search.toLowerCase()) &&
      (filter === 'all' || s.level === Number(filter)) &&
      (classFilter === 'all' || s.classes.includes(classFilter)),
  )
  return (
    <>
      <Panel title="Spellcasting">
        <Select
          label="Spellcasting ability"
          value={c.casting}
          options={[...abilities]}
          onChange={(v) => update({ casting: v as Ability })}
        />
        <div className="spell-stats">
          <div>
            <span>Ability modifier</span>
            <strong>{signed(mod(c, c.casting))}</strong>
          </div>
          <div>
            <span>Spell save DC</span>
            <strong>{8 + proficiency(c.level) + mod(c, c.casting) + c.bonuses.spellDC}</strong>
          </div>
          <div>
            <span>Spell attack</span>
            <strong>
              {signed(
                proficiency(c.level) + mod(c, c.casting) + c.bonuses.spellAttack - c.exhaustion * 2,
              )}
            </strong>
          </div>
        </div>
        <p className="hint">
          For multiclass spells, choose the casting ability of the class you are using. Manual
          bonuses are in Character.
        </p>
      </Panel>
      <Panel title="Spell slots" subtitle="Filled circles are spent slots">
        <div className="slots">
          {c.slots.map((s, i) => (
            <div className="slot-row" key={i}>
              <strong>Level {i + 1}</strong>
              <Field
                label={`Level ${i + 1} total slots`}
                value={s.total}
                max={20}
                onChange={(v) => {
                  const total = num(v, 0, 20)
                  update({
                    slots: c.slots.map((x, j) =>
                      j === i ? { total, spent: Math.min(total, x.spent) } : x,
                    ),
                  })
                }}
              />
              <div className="slot-pips">
                {Array.from({ length: s.total }, (_, n) => (
                  <button
                    key={n}
                    className={`pip ${n < s.spent ? 'filled' : ''}`}
                    aria-label={`Level ${i + 1}: ${n + 1} spent slots`}
                    aria-pressed={n < s.spent}
                    onClick={() =>
                      update({
                        slots: c.slots.map((x, j) =>
                          j === i ? { ...x, spent: x.spent === n + 1 ? n : n + 1 } : x,
                        ),
                      })
                    }
                  />
                ))}
              </div>
              <small>{s.total - s.spent} available</small>
            </div>
          ))}
        </div>
        <div className="field-grid pact">
          <Field
            label="Pact Magic slot level"
            value={c.pact.level}
            min={1}
            max={5}
            onChange={(v) => update({ pact: { ...c.pact, level: num(v, 1, 5) } })}
          />
          <Field
            label="Pact Magic total slots"
            value={c.pact.total}
            max={4}
            onChange={(v) => {
              const total = num(v, 0, 4)
              update({ pact: { ...c.pact, total, spent: Math.min(total, c.pact.spent) } })
            }}
          />
          <Field
            label="Pact Magic spent slots"
            value={c.pact.spent}
            max={c.pact.total}
            onChange={(v) => update({ pact: { ...c.pact, spent: num(v, 0, c.pact.total) } })}
          />
        </div>
        <p className="hint">
          Pact Magic recovers on short or long rests. Ordinary spell slots recover on long rests.
        </p>
      </Panel>
      <Panel title="Concentration">
        <div className="actions">
          <Field
            label="Concentrating on"
            value={c.concentration}
            onChange={(v) => update({ concentration: v })}
          />
          <button disabled={!c.concentration} onClick={() => update({ concentration: '' })}>
            End concentration
          </button>
        </div>
      </Panel>
      <Panel
        title="Your spellbook"
        subtitle={`${c.spellEntries.filter((s) => s.prepared && s.level > 0).length} prepared spells · ${c.spellEntries.filter((s) => s.level === 0).length} cantrips`}
      >
        <div className="actions">
          <button
            disabled={c.spellEntries.length >= 500}
            onClick={() => update({ spellEntries: [...c.spellEntries, newSpell()] })}
          >
            <Plus size={15} /> Add custom spell
          </button>
          <button onClick={() => setShowLibrary(!showLibrary)}>
            <Sparkles size={15} /> {showLibrary ? 'Close library' : 'Browse SRD spells'}
          </button>
        </div>
        {showLibrary && (
          <div className="library">
            <div className="field-grid">
              <Field label="Search spell library" value={search} onChange={setSearch} />
              <Select
                label="Spell level"
                value={filter}
                options={[
                  { value: 'all', label: 'All levels' },
                  ...Array.from({ length: 10 }, (_, n) => ({
                    value: n,
                    label: n === 0 ? 'Cantrips' : `Level ${n}`,
                  })),
                ]}
                onChange={setFilter}
              />
              <Select
                label="Class spell list"
                value={classFilter}
                options={[
                  'all',
                  'Bard',
                  'Cleric',
                  'Druid',
                  'Paladin',
                  'Ranger',
                  'Sorcerer',
                  'Warlock',
                  'Wizard',
                ]}
                onChange={setClassFilter}
              />
            </div>
            <p className="hint">{filtered.length} matches · 339 spells from SRD 5.2.1</p>
            <div className="library-results">
              {filtered.map((s) => (
                <details className="entry" key={s.name}>
                  <summary>
                    <strong>{s.name}</strong>
                    <span>
                      {s.level === 0 ? 'Cantrip' : `Level ${s.level}`} · {s.school}
                    </span>
                  </summary>
                  <div className="entry-body">
                    <p className="hint">
                      {s.castingTime} · {s.range} · {s.duration} · {s.components}
                    </p>
                    <p className="spell-description">{s.description}</p>
                    <small>{s.source}</small>
                    <div className="actions">
                      <button
                        disabled={
                          c.spellEntries.length >= 500 ||
                          c.spellEntries.some((x) => x.name === s.name)
                        }
                        onClick={() => add(s)}
                      >
                        {c.spellEntries.some((x) => x.name === s.name)
                          ? 'Already in spellbook'
                          : 'Add to spellbook'}
                      </button>
                    </div>
                  </div>
                </details>
              ))}
            </div>
          </div>
        )}
        <div className="field-grid casting-controls">
          <Select
            label="Casting source"
            value={source}
            options={[
              { value: 'slot', label: 'Ordinary spell slot' },
              { value: 'pact', label: 'Pact Magic slot' },
              { value: 'ritual', label: 'Ritual (if permitted)' },
              { value: 'free', label: 'Free / feature casting' },
            ]}
            onChange={(v) => setSource(v as typeof source)}
          />
          <Select
            label="Cast using slot level"
            value={slotLevel}
            options={Array.from({ length: 9 }, (_, i) => ({
              value: i + 1,
              label: `Level ${i + 1} (${c.slots[i].total - c.slots[i].spent} available)`,
            }))}
            onChange={(v) => setSlotLevel(Number(v))}
          />
        </div>
        {error && (
          <p className="notice" role="alert">
            {error}
          </p>
        )}
        <p className="hint">
          Choose your slot or casting source, then cast below. Cantrips never expend a slot. Free
          casts require their feature’s permission; expend that resource in Play. Casting a
          concentration spell replaces your previous concentration.
        </p>
        <div className="entry-list">
          {c.spellEntries.map((s) => (
            <details className="entry" key={s.id}>
              <summary>
                <strong>{s.name}</strong>
                <span>
                  {s.level === 0 ? 'Cantrip' : `Level ${s.level}`} ·{' '}
                  {s.prepared ? 'Prepared' : 'Unprepared'}
                  {s.concentration ? ' · Concentration' : ''}
                </span>
              </summary>
              <div className="entry-body">
                <div className="field-grid">
                  {(
                    [
                      'name',
                      'level',
                      'castingTime',
                      'range',
                      'duration',
                      'components',
                      'materials',
                    ] as const
                  ).map((k) => (
                    <Field
                      key={k}
                      label={k}
                      value={s[k]}
                      max={9}
                      onChange={(v) => edit(s.id, { [k]: k === 'level' ? num(v, 0, 9) : v })}
                    />
                  ))}
                  <Choice
                    label="Spell school"
                    value={s.school}
                    options={spellSchools}
                    onChange={(v) => edit(s.id, { school: v })}
                  />
                </div>
                <div className="actions">
                  <Toggle
                    label="Prepared"
                    checked={s.prepared}
                    onChange={() => edit(s.id, { prepared: !s.prepared })}
                  />
                  <Toggle
                    label="Ritual"
                    checked={s.ritual}
                    onChange={() => edit(s.id, { ritual: !s.ritual })}
                  />
                  <Toggle
                    label="Concentration"
                    checked={s.concentration}
                    onChange={() => edit(s.id, { concentration: !s.concentration })}
                  />
                </div>
                <Note
                  label="Spell description & notes"
                  value={s.description}
                  onChange={(v) => edit(s.id, { description: v })}
                />
                <div className="actions">
                  <button
                    className="primary"
                    disabled={
                      !s.prepared && source !== 'ritual' && source !== 'free' && s.level > 0
                    }
                    onClick={() => {
                      try {
                        replace(castSpell(c, s, source, slotLevel))
                        setError('')
                      } catch (e) {
                        setError((e as Error).message)
                      }
                    }}
                  >
                    Cast {s.name}
                  </button>
                  <button
                    aria-label={`Delete ${s.name}`}
                    onClick={() =>
                      update({ spellEntries: c.spellEntries.filter((x) => x.id !== s.id) })
                    }
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            </details>
          ))}
        </div>
        <Note
          label="Additional spell & legacy notes"
          value={c.spells}
          onChange={(v) => update({ spells: v })}
        />
      </Panel>
    </>
  )
}

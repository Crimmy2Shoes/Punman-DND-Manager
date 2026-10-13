import { useState } from 'react'
import {
  Plus,
  Trash2,
  Swords,
  Heart,
  Sparkles,
  Shield,
  Compass,
  BookOpen,
  Moon,
  Sun,
  Dices,
} from 'lucide-react'
import { Panel, Field, Select, Note, Toggle, num, Modal, Choice } from './components'
import {
  abilities,
  conditions,
  newAttack,
  newResource,
  mod,
  proficiency,
  signed,
  skillBonus,
  maxHP,
  damage,
  heal,
  record,
} from './character'
import type { Character, Ability } from './character'
import { damageTypes, weaponMasteries } from './options'
import {
  completeRest,
  spendHitDie,
  deathSave,
  rollDie,
  rollDice,
  suggestedResources,
} from './rules'
export default function Play({ c, replace }: { c: Character; replace: (c: Character) => void }) {
  const [amount, setAmount] = useState(1),
    [rest, setRest] = useState<'short' | 'long' | null>(null),
    [removeExhaustion, setRemoveExhaustion] = useState(true),
    [dieRoll, setDieRoll] = useState(1),
    [die, setDie] = useState(c.hitDice[0]?.die ?? 8),
    [error, setError] = useState(''),
    [dice, setDice] = useState('1d20'),
    [result, setResult] = useState(''),
    [deathRoll, setDeathRoll] = useState(10)
  const update = (patch: Partial<Character>) => replace({ ...c, ...patch })
  const action = (fn: () => Character) => {
    try {
      replace(fn())
      setError('')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unable to complete action.')
    }
  }
  const pb = proficiency(c.level)
  return (
    <>
      <div className="stat-row">
        {[
          { label: 'Armor class', value: c.ac, icon: Shield },
          {
            label: 'Initiative',
            value: signed(mod(c, 'Dexterity') + c.bonuses.initiative - c.exhaustion * 2),
            icon: Swords,
          },
          { label: 'Speed', value: `${Math.max(0, c.speed - c.exhaustion * 5)} ft`, icon: Compass },
          { label: 'Proficiency', value: signed(pb), icon: Sparkles },
          {
            label: 'Passive perception',
            value: 10 + skillBonus(c, 'Perception', 'Wisdom') + c.bonuses.perception,
            icon: BookOpen,
          },
        ].map(({ label, value, icon: Icon }) => (
          <div className="stat" key={label}>
            <Icon size={19} />
            <strong>{value}</strong>
            <span>{label}</span>
          </div>
        ))}
      </div>
      {error && (
        <p className="notice" role="alert">
          {error}
        </p>
      )}
      <div className="play-grid">
        <Panel
          title="Hit points"
          subtitle={
            c.dead ? 'Marked dead' : c.stable ? 'Stable at 0 HP' : 'Keep your adventure alive'
          }
        >
          <div className="hp-display">
            <Heart size={27} />
            <strong>
              {c.hp}
              <span> / {maxHP(c)}</span>
            </strong>
            <span className="temp">{c.tempHp} temporary</span>
          </div>
          <progress max={maxHP(c)} value={c.hp} aria-label="Current hit points" />
          <div className="hp-controls">
            <Field label="Amount" value={amount} min={1} onChange={(v) => setAmount(num(v, 1))} />
            <button
              className="danger"
              onClick={() => {
                replace(record(damage(c, amount), `Took ${amount} damage.`))
                if (c.concentration && damage(c, amount).hp > 0)
                  setResult(
                    `Concentration check needed: Constitution save DC ${Math.min(30, Math.max(10, Math.floor(amount / 2)))}. End concentration if you fail.`,
                  )
              }}
            >
              Take damage
            </button>
            <button
              className="primary"
              disabled={c.dead}
              onClick={() => replace(record(heal(c, amount), `Healed up to ${amount} HP.`))}
            >
              Heal
            </button>
          </div>
          <div className="field-grid compact">
            <Field
              label="Current HP"
              value={c.hp}
              max={maxHP(c)}
              onChange={(v) => update({ hp: num(v, 0, maxHP(c)) })}
            />
            <Field
              label="Maximum HP"
              value={c.maxHp}
              min={1}
              onChange={(v) => {
                const maxHp = num(v, 1)
                update({ maxHp, hp: Math.min(c.hp, maxHP({ ...c, maxHp })) })
              }}
            />
            <Field
              label="Temporary HP"
              value={c.tempHp}
              onChange={(v) => update({ tempHp: num(v) })}
            />
          </div>
        </Panel>
        <Panel title="Heroic Inspiration" subtitle="A little fortune on your side">
          <button
            className={`inspiration ${c.inspiration ? 'lit' : ''}`}
            aria-pressed={c.inspiration}
            onClick={() => update({ inspiration: !c.inspiration })}
          >
            <Sparkles size={36} />
            <strong>{c.inspiration ? 'Inspired' : 'Awaiting inspiration'}</strong>
            <span>{c.inspiration ? 'Click to expend' : 'Click to gain Heroic Inspiration'}</span>
          </button>
        </Panel>
        <Panel title="Abilities" className="wide">
          <div className="abilities">
            {abilities.map((a) => (
              <div className="ability" key={a}>
                <span>{a.slice(0, 3).toUpperCase()}</span>
                <strong>{signed(mod(c, a))}</strong>
                <small>{Math.max(1, c.scores[a] - c.scoreReductions[a])}</small>
              </div>
            ))}
          </div>
        </Panel>
        <Panel
          title="Attacks & actions"
          className="wide"
          subtitle="Calculated from your scores and proficiency"
        >
          <div className="entry-list">
            {c.attackEntries.map((a) => (
              <details className="entry" key={a.id}>
                <summary>
                  <Swords size={16} />
                  <strong>{a.name}</strong>
                  <span>
                    {signed(
                      mod(c, a.ability) + (a.proficient ? pb : 0) + a.bonus - c.exhaustion * 2,
                    )}{' '}
                    to hit · {a.dice}{' '}
                    {signed((a.addAbility ? mod(c, a.ability) : 0) + a.damageBonus)} {a.type}
                  </span>
                </summary>
                <div className="entry-body">
                  <div className="field-grid">
                    <Field
                      label="Attack name"
                      value={a.name}
                      onChange={(v) =>
                        update({
                          attackEntries: c.attackEntries.map((x) =>
                            x.id === a.id ? { ...x, name: v } : x,
                          ),
                        })
                      }
                    />
                    <Select
                      label="Attack ability"
                      value={a.ability}
                      options={[...abilities]}
                      onChange={(v) =>
                        update({
                          attackEntries: c.attackEntries.map((x) =>
                            x.id === a.id ? { ...x, ability: v as Ability } : x,
                          ),
                        })
                      }
                    />
                    {(['bonus', 'dice', 'damageBonus', 'notes'] as const).map((k) => (
                      <Field
                        key={k}
                        label={
                          k === 'bonus'
                            ? 'Attack bonus adjustment'
                            : k === 'damageBonus'
                              ? 'Damage bonus adjustment'
                              : k
                        }
                        value={a[k]}
                        min={k === 'bonus' ? -30 : -99}
                        max={k === 'bonus' ? 30 : 99}
                        onChange={(v) =>
                          update({
                            attackEntries: c.attackEntries.map((x) =>
                              x.id === a.id
                                ? {
                                    ...x,
                                    [k]:
                                      typeof a[k] === 'number'
                                        ? num(v, k === 'bonus' ? -30 : -99, k === 'bonus' ? 30 : 99)
                                        : v,
                                  }
                                : x,
                            ),
                          })
                        }
                      />
                    ))}
                    <Choice
                      label="Damage type"
                      value={a.type}
                      options={damageTypes}
                      onChange={(v) =>
                        update({
                          attackEntries: c.attackEntries.map((x) =>
                            x.id === a.id ? { ...x, type: v } : x,
                          ),
                        })
                      }
                    />
                    <Choice
                      label="Weapon mastery"
                      value={a.mastery}
                      options={weaponMasteries}
                      onChange={(v) =>
                        update({
                          attackEntries: c.attackEntries.map((x) =>
                            x.id === a.id ? { ...x, mastery: v } : x,
                          ),
                        })
                      }
                    />
                  </div>
                  <div className="actions">
                    <Toggle
                      label="Proficient"
                      checked={a.proficient}
                      onChange={() =>
                        update({
                          attackEntries: c.attackEntries.map((x) =>
                            x.id === a.id ? { ...x, proficient: !x.proficient } : x,
                          ),
                        })
                      }
                    />
                    <Toggle
                      label="Add ability to damage"
                      checked={a.addAbility}
                      onChange={() =>
                        update({
                          attackEntries: c.attackEntries.map((x) =>
                            x.id === a.id ? { ...x, addAbility: !x.addAbility } : x,
                          ),
                        })
                      }
                    />
                    <button
                      onClick={() => {
                        const roll = rollDie(20)
                        setResult(
                          `${a.name}: d20 ${roll} + ${signed(mod(c, a.ability) + (a.proficient ? pb : 0) + a.bonus - c.exhaustion * 2)} = ${roll + mod(c, a.ability) + (a.proficient ? pb : 0) + a.bonus - c.exhaustion * 2}`,
                        )
                      }}
                    >
                      Roll attack
                    </button>
                    <button
                      onClick={() => {
                        try {
                          const r = rollDice(a.dice)
                          setResult(
                            `${a.name}: ${r.rolls.join(' + ')}; damage ${Math.max(0, r.total + (a.addAbility ? mod(c, a.ability) : 0) + a.damageBonus)} ${a.type}`,
                          )
                        } catch (e) {
                          setError((e as Error).message)
                        }
                      }}
                    >
                      Roll damage
                    </button>
                    <button
                      aria-label={`Delete ${a.name}`}
                      onClick={() =>
                        update({ attackEntries: c.attackEntries.filter((x) => x.id !== a.id) })
                      }
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              </details>
            ))}
          </div>
          <button
            className="add-button"
            disabled={c.attackEntries.length >= 200}
            onClick={() => update({ attackEntries: [...c.attackEntries, newAttack()] })}
          >
            <Plus size={15} /> Add attack
          </button>
          <Note
            label="Additional actions & legacy attack notes"
            value={c.attacks}
            onChange={(v) => update({ attacks: v })}
          />
        </Panel>
        <Panel title="Resources & feature uses" className="wide">
          <div className="entry-list">
            {c.resources.map((r) => (
              <details key={r.id} className="entry">
                <summary>
                  <strong>{r.name}</strong>
                  <span>
                    {r.remaining} / {r.total} remaining
                  </span>
                </summary>
                <div className="entry-body">
                  <div className="field-grid">
                    <Field
                      label="Resource name"
                      value={r.name}
                      onChange={(v) =>
                        update({
                          resources: c.resources.map((x) =>
                            x.id === r.id ? { ...x, name: v } : x,
                          ),
                        })
                      }
                    />
                    <Field
                      label="Maximum uses"
                      value={r.total}
                      max={999}
                      onChange={(v) => {
                        const total = num(v, 0, 999)
                        update({
                          resources: c.resources.map((x) =>
                            x.id === r.id
                              ? { ...x, total, remaining: Math.min(total, x.remaining) }
                              : x,
                          ),
                        })
                      }}
                    />
                    <Select
                      label="Recovery"
                      value={r.recharge}
                      options={[
                        { value: 'short', label: 'All · short or long rest' },
                        { value: 'short-one', label: 'One · short rest; all · long rest' },
                        { value: 'long', label: 'All · long rest' },
                        { value: 'manual', label: 'Manual' },
                      ]}
                      onChange={(v) =>
                        update({
                          resources: c.resources.map((x) =>
                            x.id === r.id ? { ...x, recharge: v as typeof r.recharge } : x,
                          ),
                        })
                      }
                    />
                  </div>
                  <Field
                    label="Resource notes"
                    value={r.notes}
                    onChange={(v) =>
                      update({
                        resources: c.resources.map((x) => (x.id === r.id ? { ...x, notes: v } : x)),
                      })
                    }
                  />
                  <div className="actions">
                    <button
                      disabled={r.remaining === 0}
                      onClick={() =>
                        update({
                          resources: c.resources.map((x) =>
                            x.id === r.id ? { ...x, remaining: x.remaining - 1 } : x,
                          ),
                        })
                      }
                    >
                      Use one
                    </button>
                    <button
                      disabled={r.remaining === r.total}
                      onClick={() =>
                        update({
                          resources: c.resources.map((x) =>
                            x.id === r.id ? { ...x, remaining: x.remaining + 1 } : x,
                          ),
                        })
                      }
                    >
                      Restore one
                    </button>
                    <Field
                      label="Remaining uses"
                      value={r.remaining}
                      max={r.total}
                      onChange={(v) =>
                        update({
                          resources: c.resources.map((x) =>
                            x.id === r.id ? { ...x, remaining: num(v, 0, x.total) } : x,
                          ),
                        })
                      }
                    />
                    <button
                      aria-label={`Delete ${r.name}`}
                      onClick={() =>
                        update({ resources: c.resources.filter((x) => x.id !== r.id) })
                      }
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              </details>
            ))}
          </div>
          <div className="actions">
            <button
              disabled={c.resources.length >= 200}
              onClick={() => update({ resources: [...c.resources, newResource()] })}
            >
              <Plus size={15} /> Add resource
            </button>
            <button
              onClick={() => {
                const resources = suggestedResources(c)
                if (resources.length > 200)
                  setError(
                    'Remove unused resources first; this character supports up to 200 counters.',
                  )
                else update({ resources })
              }}
            >
              Add class resource presets
            </button>
          </div>
          <p className="hint">
            Presets cover common resources. Add counters for feats, subclass abilities, and item
            charges.
          </p>
        </Panel>
        <Panel title="Hit dice & rests">
          <div className="hit-dice-list">
            {c.hitDice.map((d) => (
              <div key={d.die}>
                <strong>d{d.die}</strong>
                <span>
                  {d.total - d.spent} / {d.total} available
                </span>
                <Field
                  label={`d${d.die} spent`}
                  value={d.spent}
                  max={d.total}
                  onChange={(v) =>
                    update({
                      hitDice: c.hitDice.map((x) =>
                        x.die === d.die ? { ...x, spent: num(v, 0, x.total) } : x,
                      ),
                    })
                  }
                />
              </div>
            ))}
          </div>
          <div className="actions">
            <button
              onClick={() => {
                setRest('short')
                setError('')
              }}
              disabled={c.hp === 0 || c.dead}
            >
              <Sun size={15} /> Short rest
            </button>
            <button
              onClick={() => {
                setRest('long')
                setError('')
              }}
              disabled={c.hp === 0 || c.dead}
            >
              <Moon size={15} /> Long rest
            </button>
          </div>
          <p className="hint">
            Confirm the rest’s requirements at your table before applying recovery.
          </p>
        </Panel>
        <Panel title="Conditions & exhaustion">
          <div className="condition-list">
            {conditions.map((condition) => (
              <button
                key={condition}
                className={`condition ${c.conditions.includes(condition) ? 'selected' : ''}`}
                aria-pressed={c.conditions.includes(condition)}
                onClick={() => {
                  const list = c.conditions.includes(condition)
                    ? c.conditions.filter((x) => x !== condition)
                    : [...c.conditions, condition]
                  update({
                    conditions: list,
                    concentration: list.some((x) =>
                      [
                        'Incapacitated',
                        'Paralyzed',
                        'Petrified',
                        'Stunned',
                        'Unconscious',
                      ].includes(x),
                    )
                      ? ''
                      : c.concentration,
                  })
                }}
              >
                {condition}
              </button>
            ))}
          </div>
          <Field
            label="Exhaustion level"
            value={c.exhaustion}
            max={6}
            onChange={(v) => {
              const exhaustion = num(v, 0, 6)
              update({ exhaustion, dead: c.dead || exhaustion === 6 })
            }}
          />
          <p className="hint">
            Exhaustion applies −2 per level to D20 Tests and −5 ft. per level to speed. Other
            condition effects require table adjudication.
          </p>
        </Panel>
        <Panel title="Death saves">
          <div className="actions">
            <Toggle
              label="Stable"
              checked={c.stable}
              onChange={() => update({ stable: !c.stable, successes: 0, failures: 0 })}
            />
            <Toggle label="Dead" checked={c.dead} onChange={() => update({ dead: !c.dead })} />
          </div>
          {(['successes', 'failures'] as const).map((k) => (
            <div className="death-row" key={k}>
              <span>{k}</span>
              {[1, 2, 3].map((n) => (
                <button
                  key={n}
                  className={`pip ${c[k] >= n ? 'filled' : ''}`}
                  aria-label={`${k}: ${n}`}
                  aria-pressed={c[k] >= n}
                  onClick={() => {
                    const value = c[k] === n ? n - 1 : n
                    if (k === 'successes' && value === 3)
                      update({ stable: true, successes: 0, failures: 0 })
                    else if (k === 'failures' && value === 3) update({ dead: true, failures: 3 })
                    else update({ [k]: value })
                  }}
                />
              ))}
            </div>
          ))}
          <div className="actions">
            <Field
              label="Death save d20"
              value={deathRoll}
              min={1}
              max={20}
              onChange={(v) => setDeathRoll(num(v, 1, 20))}
            />
            <button
              disabled={c.hp > 0 || c.dead || c.stable}
              onClick={() => action(() => deathSave(c, deathRoll))}
            >
              Apply roll
            </button>
            <button onClick={() => update({ successes: 0, failures: 0, stable: false })}>
              Reset saves
            </button>
          </div>
        </Panel>
        <Panel title="Dice tray">
          <div className="actions">
            <Field label="Dice expression" value={dice} onChange={setDice} />
            <button
              onClick={() => {
                try {
                  const r = rollDice(dice)
                  setResult(
                    `${dice}: ${r.rolls.join(', ')}${r.bonus ? ` ${signed(r.bonus)}` : ''} = ${r.total}`,
                  )
                  setError('')
                } catch (e) {
                  setError((e as Error).message)
                }
              }}
            >
              <Dices size={16} /> Roll
            </button>
          </div>
          <p className="roll-result" role="status">
            {result || 'Roll an attack, damage, or your own dice.'}
          </p>
        </Panel>
        <Panel title="Recent activity" className="wide">
          <div className="activity">
            {c.activity.length ? (
              c.activity.slice(0, 12).map((event, i) => <p key={i}>{event}</p>)
            ) : (
              <p>No recorded activity yet.</p>
            )}
          </div>
        </Panel>
      </div>
      {rest && (
        <Modal
          title={rest === 'short' ? 'Complete a short rest' : 'Complete a long rest'}
          onClose={() => setRest(null)}
        >
          <p className="hint">
            {rest === 'short'
              ? 'Spend hit dice below after an uninterrupted hour of rest. Apply resource recovery when the rest is complete.'
              : 'Confirm a completed long rest (normally 8 hours, or your species’ exception), started with 1+ HP, and at least 16 hours since the previous long rest. Restores HP, all hit dice, spell slots and eligible resources; removes temporary HP and recorded score/HP reductions.'}
          </p>
          {rest === 'short' && (
            <>
              <div className="field-grid">
                <Select
                  label="Hit die"
                  value={die}
                  options={c.hitDice.map((d) => ({
                    value: d.die,
                    label: `d${d.die} (${d.total - d.spent} available)`,
                  }))}
                  onChange={(v) => {
                    setDie(Number(v) as typeof die)
                    setDieRoll(1)
                  }}
                />
                <Field
                  label="Hit die roll"
                  value={dieRoll}
                  min={1}
                  max={die}
                  onChange={(v) => setDieRoll(num(v, 1, die))}
                />
              </div>
              <div className="actions">
                <button onClick={() => setDieRoll(rollDie(die))}>Roll d{die}</button>
                <button onClick={() => action(() => spendHitDie(c, die, dieRoll))}>
                  Spend hit die
                </button>
              </div>
              <p>
                Current HP: {c.hp} / {maxHP(c)}
              </p>
            </>
          )}
          {rest === 'long' && (
            <Toggle
              label="Remove one exhaustion level (requirements met)"
              checked={removeExhaustion}
              onChange={() => setRemoveExhaustion(!removeExhaustion)}
            />
          )}
          <div className="actions">
            <button
              className="primary"
              onClick={() => {
                action(() => completeRest(c, rest, removeExhaustion))
                setRest(null)
              }}
            >
              Complete rest
            </button>
            <button onClick={() => setRest(null)}>Close</button>
          </div>
          {error && <p role="alert">{error}</p>}
        </Modal>
      )}
    </>
  )
}

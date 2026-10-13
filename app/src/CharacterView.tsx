import { useState } from 'react'
import { Panel, Field, Select, Note, Toggle, num, Modal, Choice } from './components'
import {
  abilities,
  skills,
  mod,
  proficiency,
  signed,
  saveBonus,
  skillBonus,
  record,
  modifier,
  maxHP,
} from './character'
import type { Character, Ability } from './character'
import { classes, levelUp, syncProgression, suggestedResources, xpThresholds } from './rules'
import features from './data/features.json'
import { alignments, backgroundNames, speciesNames } from './options'
export default function CharacterView({
  c,
  replace,
}: {
  c: Character
  replace: (c: Character) => void
}) {
  const [leveling, setLeveling] = useState(false),
    [nextClass, setNextClass] = useState(c.classes[0]?.name || 'Fighter'),
    [hpMethod, setHpMethod] = useState('average'),
    [roll, setRoll] = useState(1),
    [subclass, setSubclass] = useState(''),
    [feat, setFeat] = useState(''),
    [error, setError] = useState(''),
    [armor, setArmor] = useState(c.armorChoice),
    [shield, setShield] = useState(c.shieldEquipped)
  const update = (patch: Partial<Character>) => replace({ ...c, ...patch })
  const setScore = (a: Ability, score: number) => {
    const previous = modifier(c.scores.Constitution)
    let next = { ...c, scores: { ...c.scores, [a]: score } }
    if (a === 'Constitution') {
      const delta = (modifier(next.scores.Constitution) - previous) * c.level
      next = {
        ...next,
        maxHp: Math.max(1, c.maxHp + delta),
        hp: Math.max(
          0,
          Math.min(maxHP({ ...next, maxHp: Math.max(1, c.maxHp + delta) }), c.hp + delta),
        ),
      }
    }
    replace(next)
  }
  const armorOptions: Record<string, number> = {
    Unarmored: 10 + mod(c, 'Dexterity'),
    'Barbarian unarmored': 10 + mod(c, 'Dexterity') + mod(c, 'Constitution'),
    'Monk unarmored': 10 + mod(c, 'Dexterity') + mod(c, 'Wisdom'),
    Padded: 11 + mod(c, 'Dexterity'),
    Leather: 11 + mod(c, 'Dexterity'),
    'Studded leather': 12 + mod(c, 'Dexterity'),
    Hide: 12 + Math.min(2, mod(c, 'Dexterity')),
    'Chain shirt': 13 + Math.min(2, mod(c, 'Dexterity')),
    'Scale mail': 14 + Math.min(2, mod(c, 'Dexterity')),
    Breastplate: 14 + Math.min(2, mod(c, 'Dexterity')),
    'Half plate': 15 + Math.min(2, mod(c, 'Dexterity')),
    'Ring mail': 14,
    'Chain mail': 16,
    Splint: 17,
    Plate: 18,
  }
  const featureRows = c.classes.flatMap((cl) =>
    (features[cl.name as keyof typeof features] ?? [])
      .filter(
        (f) =>
          f.level <= cl.level &&
          (f.scope === 'class' || cl.subclass === classes[cl.name]?.subclass),
      )
      .map((f) => ({ ...f, className: cl.name })),
  )
  return (
    <>
      <Panel title="Your story" subtitle="Make this character yours">
        <div className="field-grid">
          {(['name', 'campaign'] as const).map((k) => (
            <Field
              key={k}
              label={k === 'name' ? 'Character name' : 'Campaign'}
              value={c[k]}
              onChange={(v) => update({ [k]: v })}
            />
          ))}
          <Choice
            label="Species"
            value={c.species}
            options={speciesNames}
            onChange={(v) => update({ species: v })}
          />
          <Choice
            label="Background"
            value={c.background}
            options={backgroundNames}
            onChange={(v) => update({ background: v })}
          />
          <Choice
            label="Alignment"
            value={c.alignment}
            options={alignments}
            onChange={(v) => update({ alignment: v })}
          />
          <Select
            label="Size"
            value={c.size}
            options={['Tiny', 'Small', 'Medium', 'Large', 'Huge', 'Gargantuan']}
            onChange={(v) => update({ size: v as Character['size'] })}
          />
          <Field
            label="Primary class (manual)"
            disabled={c.classes.length > 1}
            value={c.classes[0]?.name ?? c.className}
            onChange={(v) => {
              if (c.classes.length > 1) {
                setError('Rename classes through a backup or keep the current multiclass names.')
                return
              }
              update({
                className: v,
                classes: v ? [{ name: v, level: c.level, subclass: c.subclass }] : [],
              })
            }}
          />
          <Field
            label="Level (manual, single class)"
            disabled={c.classes.length > 1}
            value={c.level}
            min={1}
            max={20}
            onChange={(v) => {
              if (c.classes.length > 1) {
                setError('Use class level controls below for multiclass characters.')
                return
              }
              const level = num(v, 1, 20)
              replace(
                syncProgression({ ...c, level, classes: c.classes.map((x) => ({ ...x, level })) }),
              )
            }}
          />
          <Field
            label="Experience points"
            value={c.xp}
            max={9999999}
            onChange={(v) => update({ xp: num(v, 0, 9999999) })}
          />
          <Field
            label="Armor class"
            value={c.ac}
            max={99}
            onChange={(v) => update({ ac: num(v, 0, 99) })}
          />
          <Field
            label="Base speed (feet)"
            value={c.speed}
            max={999}
            onChange={(v) => update({ speed: num(v, 0, 999) })}
          />
        </div>
        <div className="class-list">
          {c.classes.map((cl) => (
            <div className="class-row" key={cl.name}>
              <strong>
                {cl.name} · Level {cl.level}
              </strong>
              <Field
                label={`${cl.name} class level`}
                value={cl.level}
                min={1}
                max={20 - c.level + cl.level}
                onChange={(v) => {
                  const level = num(v, 1, 20 - c.level + cl.level)
                  const nextClasses = c.classes.map((x) =>
                    x.name === cl.name ? { ...x, level } : x,
                  )
                  replace(
                    syncProgression({
                      ...c,
                      classes: nextClasses,
                      level: nextClasses.reduce((sum, x) => sum + x.level, 0),
                    }),
                  )
                }}
              />
              <Field
                label={`${cl.name} subclass`}
                value={cl.subclass}
                onChange={(v) =>
                  update({
                    classes: c.classes.map((x) => (x.name === cl.name ? { ...x, subclass: v } : x)),
                    subclass: c.classes[0]?.name === cl.name ? v : c.subclass,
                  })
                }
              />
            </div>
          ))}
        </div>
        <div className="actions">
          <button
            className="primary"
            disabled={c.level >= 20}
            onClick={() => {
              setLeveling(true)
              setFeat('')
              setError('')
              setSubclass('')
            }}
          >
            Advance a level
          </button>
          <button onClick={() => replace(syncProgression(c))}>Recalculate slots & hit dice</button>
        </div>
        <p className="hint">
          Choosing an origin name does not apply its traits or bonuses. Record those from your
          source in Features and Proficiencies.
        </p>
        <p className="hint">
          Total level {c.level} · Proficiency {signed(proficiency(c.level))}
          {c.level < 20
            ? ` · Next XP threshold: ${xpThresholds[c.level].toLocaleString()}`
            : ' · Maximum level'}
          . Milestone leveling is supported. Manual level edits recalculate slots and hit dice; set
          maximum HP manually. Use Advance a level for automatic HP gains.
        </p>
      </Panel>
      {error && !leveling && (
        <p className="notice" role="alert">
          {error}
        </p>
      )}
      <div className="two-column">
        <Panel title="Ability scores & saves">
          <div className="score-list">
            {abilities.map((a) => (
              <div key={a}>
                <Field
                  label={a}
                  value={c.scores[a]}
                  min={1}
                  max={30}
                  onChange={(v) => setScore(a, num(v, 1, 30))}
                />
                <strong>{signed(mod(c, a))}</strong>
                <Toggle
                  label={`Save ${signed(saveBonus(c, a))}`}
                  checked={c.saves.includes(a)}
                  onChange={() =>
                    update({
                      saves: c.saves.includes(a) ? c.saves.filter((x) => x !== a) : [...c.saves, a],
                    })
                  }
                />
              </div>
            ))}
          </div>
          <p className="hint">Changing Constitution adjusts maximum HP for all existing levels.</p>
        </Panel>
        <Panel title="Skills" subtitle="Choose proficiency or expertise">
          <div className="skill-list">
            {skills.map(([skill, a]) => (
              <label key={skill}>
                <span>
                  {skill}
                  <small>{a.slice(0, 3)}</small>
                </span>
                <strong>{signed(skillBonus(c, skill, a))}</strong>
                <select
                  aria-label={`${skill} proficiency`}
                  value={c.skills[skill] ?? 0}
                  onChange={(e) =>
                    update({ skills: { ...c.skills, [skill]: Number(e.target.value) } })
                  }
                >
                  <option value={0}>None</option>
                  <option value={1}>Proficient</option>
                  <option value={2}>Expertise</option>
                </select>
              </label>
            ))}
          </div>
        </Panel>
      </div>
      <Panel title="Class features & choices">
        <div className="feature-tags">
          {featureRows.map((f, i) => (
            <span key={i}>
              {f.className} {f.level} · {f.name}
            </span>
          ))}
        </div>
        <p className="hint">
          The list includes SRD class and subclass features at your levels. Confirm your chosen
          subclass and options using the Reference view. Record feat choices and effects below.
        </p>
        <Note
          label="Class features, species traits & feats"
          value={c.features}
          onChange={(v) => update({ features: v })}
        />
        <div className="field-grid">
          <Field label="Languages" value={c.languages} onChange={(v) => update({ languages: v })} />
          <Field
            label="Armor, weapons & tools"
            value={c.training}
            onChange={(v) => update({ training: v })}
          />
        </div>
      </Panel>
      <Panel title="Armor calculator">
        <div className="field-grid">
          <Select
            label="Armor or defense formula"
            value={armor}
            options={Object.keys(armorOptions)}
            onChange={(v) => setArmor(v as Character['armorChoice'])}
          />
          <Toggle
            label="Shield (+2, requires training)"
            checked={shield}
            onChange={() => setShield(!shield)}
          />
          <button
            onClick={() =>
              update({
                armorChoice: armor,
                shieldEquipped: shield && armor !== 'Monk unarmored',
                ac: Math.min(
                  99,
                  armorOptions[armor] + (shield && armor !== 'Monk unarmored' ? 2 : 0),
                ),
              })
            }
          >
            Apply AC {armorOptions[armor] + (shield && armor !== 'Monk unarmored' ? 2 : 0)}
          </button>
        </div>
        <p className="hint">
          Monk Unarmored Defense requires no shield. Check armor training, Strength requirements,
          and Stealth penalties in Reference. Manual AC supports magic items and homebrew.
        </p>
      </Panel>
      <Panel title="Bonuses & temporary reductions">
        <details>
          <summary>Manage manual bonuses, penalties, and reductions</summary>
          <div className="entry-body">
            <div className="field-grid">
              {(['initiative', 'perception', 'spellAttack', 'spellDC', 'death'] as const).map(
                (k) => (
                  <Field
                    key={k}
                    label={`${k} adjustment`}
                    value={c.bonuses[k]}
                    min={-99}
                    max={99}
                    onChange={(v) => update({ bonuses: { ...c.bonuses, [k]: num(v, -99, 99) } })}
                  />
                ),
              )}
              <Field
                label="HP maximum reduction"
                value={c.hpReduction}
                max={c.maxHp - 1}
                onChange={(v) => {
                  const hpReduction = num(v, 0, c.maxHp - 1)
                  update({ hpReduction, hp: Math.min(c.hp, maxHP({ ...c, hpReduction })) })
                }}
              />
            </div>
            <div className="field-grid">
              {abilities.map((a) => (
                <div key={a}>
                  <Field
                    label={`${a} score reduction`}
                    value={c.scoreReductions[a]}
                    max={c.scores[a] - 1}
                    onChange={(v) => {
                      const next = {
                        ...c,
                        scoreReductions: { ...c.scoreReductions, [a]: num(v, 0, c.scores[a] - 1) },
                      }
                      replace({ ...next, hp: Math.min(next.hp, maxHP(next)) })
                    }}
                  />
                  <Field
                    label={`${a} save adjustment`}
                    value={c.bonuses.saves[a]}
                    min={-99}
                    max={99}
                    onChange={(v) =>
                      update({
                        bonuses: {
                          ...c.bonuses,
                          saves: { ...c.bonuses.saves, [a]: num(v, -99, 99) },
                        },
                      })
                    }
                  />
                </div>
              ))}
            </div>
            <div className="field-grid">
              {skills.map(([s]) => (
                <Field
                  key={s}
                  label={`${s} adjustment`}
                  value={c.bonuses.skills[s] ?? 0}
                  min={-99}
                  max={99}
                  onChange={(v) =>
                    update({
                      bonuses: {
                        ...c.bonuses,
                        skills: { ...c.bonuses.skills, [s]: num(v, -99, 99) },
                      },
                    })
                  }
                />
              ))}
            </div>
          </div>
        </details>
      </Panel>
      {leveling && (
        <Modal title="Advance your character" onClose={() => setLeveling(false)}>
          <div className="field-grid">
            <Select
              label="Class to advance"
              value={nextClass}
              options={Object.keys(classes)}
              onChange={setNextClass}
            />
            <Select
              label="HP increase"
              value={hpMethod}
              options={[
                { value: 'average', label: 'Fixed class average' },
                { value: 'roll', label: 'Enter a rolled hit die' },
              ]}
              onChange={setHpMethod}
            />
            {hpMethod === 'roll' && (
              <Field
                label={`d${classes[nextClass].die} roll`}
                value={roll}
                min={1}
                max={classes[nextClass].die}
                onChange={(v) => setRoll(num(v, 1, classes[nextClass].die))}
              />
            )}
            <Field label="Subclass choice (if gained)" value={subclass} onChange={setSubclass} />
            <Field label="Feat / feature choice notes" value={feat} onChange={setFeat} />
          </div>
          <p className="hint">
            Adds one class level, HP, a hit die, spell slots, and class resource presets. Multiclass
            prerequisites are checked. Apply chosen ability score increases and feature bonuses in
            Character after advancing. No automatic stacking of Extra Attack or defense formulas.
          </p>
          <p className="hint">
            Next class features:{' '}
            {(features[nextClass as keyof typeof features] ?? [])
              .filter(
                (f) => f.level === (c.classes.find((x) => x.name === nextClass)?.level ?? 0) + 1,
              )
              .map((f) => f.name)
              .join(', ') || 'Check the class reference.'}
          </p>
          {error && (
            <p role="alert" className="notice">
              {error}
            </p>
          )}
          <div className="actions">
            <button
              className="primary"
              onClick={() => {
                try {
                  let next = levelUp(
                    c,
                    nextClass,
                    hpMethod === 'roll' ? num(String(roll), 1, classes[nextClass].die) : undefined,
                  )
                  if (subclass)
                    next.classes = next.classes.map((x) =>
                      x.name === nextClass ? { ...x, subclass } : x,
                    )
                  if (feat) next.features += `\nLevel ${next.level}: ${feat}`
                  if (next.classes.length === 1) {
                    next.className = nextClass
                    next.subclass = next.classes[0].subclass
                  }
                  next.resources = suggestedResources(next)
                  if (next.resources.length > 200)
                    throw Error(
                      'Remove unused resources before leveling; this character supports up to 200 counters.',
                    )
                  replace(
                    record(
                      next,
                      'Review newly gained features and choices in Character / Reference.',
                    ),
                  )
                  setLeveling(false)
                } catch (e) {
                  setError((e as Error).message)
                }
              }}
            >
              Apply level up
            </button>
            <button onClick={() => setLeveling(false)}>Cancel</button>
          </div>
        </Modal>
      )}
    </>
  )
}

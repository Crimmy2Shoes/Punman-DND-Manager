import { useState } from 'react'
import { abilities, skills, modifier } from './character'
import type { Ability, Character } from './character'
import { classes, backgrounds, species, buildCharacter } from './rules'
import { Modal, Field, Select, Toggle, num } from './components'
const pointCost: Record<number, number> = { 8: 0, 9: 1, 10: 2, 11: 3, 12: 4, 13: 5, 14: 7, 15: 9 }
const standard = [15, 14, 13, 12, 10, 8]
export default function Builder({
  onClose,
  onCreate,
}: {
  onClose: () => void
  onCreate: (c: Character) => void
}) {
  const [step, setStep] = useState(1),
    [name, setName] = useState(''),
    [className, setClass] = useState('Fighter'),
    [background, setBackground] = useState('Soldier'),
    [ancestry, setAncestry] = useState('Human'),
    [method, setMethod] = useState('standard'),
    [scores, setScores] = useState<Record<Ability, number>>({
      Strength: 15,
      Dexterity: 14,
      Constitution: 13,
      Intelligence: 12,
      Wisdom: 10,
      Charisma: 8,
    }),
    [boost, setBoost] = useState('two'),
    [boostTwo, setBoostTwo] = useState<Ability>('Strength'),
    [boostOne, setBoostOne] = useState<Ability>('Dexterity'),
    [chosen, setChosen] = useState<string[]>([]),
    [language1, setLanguage1] = useState('Elvish'),
    [language2, setLanguage2] = useState('Dwarvish'),
    [choiceNotes, setChoiceNotes] = useState(''),
    [speciesSkill, setSpeciesSkill] = useState('Perception'),
    [error, setError] = useState('')
  const bg = backgrounds[background],
    cl = classes[className],
    points = Object.values(scores).reduce((n, v) => n + (pointCost[v] ?? 100), 0)
  const extraSkillOptions = (
    ancestry === 'Elf' ? ['Insight', 'Perception', 'Survival'] : skills.map(([s]) => s)
  ).filter((s) => !bg.skills.includes(s) && !chosen.includes(s))
  const availableExtra = extraSkillOptions.length
    ? extraSkillOptions
    : skills.map(([s]) => s).filter((s) => !bg.skills.includes(s) && !chosen.includes(s))
  const effectiveSpeciesSkill = availableExtra.includes(speciesSkill)
    ? speciesSkill
    : availableExtra[0]
  const finalScores = { ...scores }
  if (boost === 'three') bg.abilities.forEach((a) => (finalScores[a] += 1))
  else {
    finalScores[boostTwo] += 2
    finalScores[boostOne] += 1
  }
  const changeBackground = (b: string) => {
    setBackground(b)
    setBoostTwo(backgrounds[b].abilities[0])
    setBoostOne(backgrounds[b].abilities[1])
    setChosen([])
  }
  const errors = () => {
    if (!name.trim()) return 'Give your adventurer a name.'
    if (
      method === 'standard' &&
      JSON.stringify(Object.values(scores).sort((a, b) => b - a)) !== JSON.stringify(standard)
    )
      return 'Assign each standard-array score exactly once.'
    if (method === 'point' && points !== 27) return 'Spend exactly 27 points (scores 8–15).'
    if (boost === 'two' && boostTwo === boostOne) return 'Choose different abilities for +2 and +1.'
    if (Object.values(finalScores).some((v) => v > 20))
      return 'Background increases cannot raise scores above 20.'
    if (chosen.length !== cl.skillCount) return `Choose ${cl.skillCount} class skills.`
    if (language1 === language2) return 'Choose two different additional languages.'
    return ''
  }
  const create = () => {
    const error = errors()
    if (error) {
      setError(error)
      return
    }
    const c = buildCharacter({
      name: name.trim(),
      className,
      background,
      species: ancestry,
      scores: finalScores,
      chosenSkills: chosen,
      languages: `Common, ${language1}, ${language2}`,
    })
    if (ancestry === 'Human' || ancestry === 'Elf') c.skills[effectiveSpeciesSkill] = 1
    if (ancestry === 'Elf' && choiceNotes.toLowerCase().includes('wood')) c.speed = 35
    if (className === 'Barbarian')
      c.ac = 10 + modifier(finalScores.Dexterity) + modifier(finalScores.Constitution)
    if (className === 'Monk')
      c.ac = 10 + modifier(finalScores.Dexterity) + modifier(finalScores.Wisdom)
    if (choiceNotes) c.features += `\nOrigin choices: ${choiceNotes}`
    if (className === 'Rogue') c.languages += ', Thieves’ Cant'
    if (className === 'Druid') c.languages += ', Druidic'
    onCreate(c)
  }
  return (
    <Modal title="Write a new adventure" onClose={onClose}>
      <div className="wizard-progress">
        {['Identity', 'Abilities', 'Proficiencies', 'Review'].map((s, i) => (
          <button key={s} className={step === i + 1 ? 'active' : ''} onClick={() => setStep(i + 1)}>
            {i + 1}. {s}
          </button>
        ))}
      </div>
      {step === 1 && (
        <>
          <div className="field-grid">
            <Field label="Character name" value={name} onChange={setName} />
            <Select
              label="Starting class"
              value={className}
              options={Object.keys(classes)}
              onChange={(v) => {
                setClass(v)
                setChosen([])
              }}
            />
            <Select
              label="Background"
              value={background}
              options={Object.keys(backgrounds)}
              onChange={changeBackground}
            />
            <Select
              label="Species"
              value={ancestry}
              options={Object.keys(species)}
              onChange={setAncestry}
            />
          </div>
          <p className="hint">
            The guided builder covers 12 SRD classes, 4 backgrounds and 9 species. Other 2024
            options can be entered manually in the character editor. Start at level 1. Class and
            background gold alternatives are included; buy equipment afterward. Other origins can be
            entered using a blank character.
          </p>
          <p className="hint">{species[ancestry].traits}</p>
          <Field
            label="Lineage, ancestry, Origin feat, tool & other choices"
            value={choiceNotes}
            onChange={setChoiceNotes}
          />
        </>
      )}
      {step === 2 && (
        <>
          <Select
            label="Ability score method"
            value={method}
            options={[
              { value: 'standard', label: 'Standard array (15, 14, 13, 12, 10, 8)' },
              { value: 'point', label: 'Point buy (27 points)' },
              { value: 'manual', label: 'Rolled / manual scores' },
            ]}
            onChange={(v) => {
              setMethod(v)
              if (v === 'standard')
                setScores({
                  Strength: 15,
                  Dexterity: 14,
                  Constitution: 13,
                  Intelligence: 12,
                  Wisdom: 10,
                  Charisma: 8,
                })
              if (v === 'point')
                setScores({
                  Strength: 8,
                  Dexterity: 8,
                  Constitution: 8,
                  Intelligence: 8,
                  Wisdom: 8,
                  Charisma: 8,
                })
            }}
          />
          <div className="field-grid">
            {abilities.map((a) => (
              <Field
                key={a}
                label={`${a} (before background)`}
                value={scores[a]}
                min={method === 'point' ? 8 : 3}
                max={method === 'point' ? 15 : 18}
                onChange={(v) =>
                  setScores({
                    ...scores,
                    [a]: num(v, method === 'point' ? 8 : 3, method === 'point' ? 15 : 18),
                  })
                }
              />
            ))}
          </div>
          {method === 'point' && (
            <p className="hint">{points} / 27 points used. Scores 14 and 15 cost 7 and 9 points.</p>
          )}
          <Select
            label="Background increases"
            value={boost}
            options={[
              { value: 'two', label: '+2 to one ability, +1 to another' },
              { value: 'three', label: '+1 to all three background abilities' },
            ]}
            onChange={setBoost}
          />
          {boost === 'two' && (
            <div className="field-grid">
              <Select
                label="+2 ability"
                value={boostTwo}
                options={bg.abilities}
                onChange={(v) => setBoostTwo(v as Ability)}
              />
              <Select
                label="+1 ability"
                value={boostOne}
                options={bg.abilities}
                onChange={(v) => setBoostOne(v as Ability)}
              />
            </div>
          )}
          <p className="hint">
            Final scores: {abilities.map((a) => `${a.slice(0, 3)} ${finalScores[a]}`).join(' · ')}
          </p>
        </>
      )}
      {step === 3 && (
        <>
          <p className="hint">
            Background skills: {bg.skills.join(', ')}. Origin feat: {bg.feat}.
          </p>
          <p>
            Choose {cl.skillCount} class skills ({chosen.length} selected):
          </p>
          <div className="choice-grid">
            {cl.skills
              .filter((s) => !bg.skills.includes(s))
              .map((s) => (
                <Toggle
                  key={s}
                  label={s}
                  checked={chosen.includes(s)}
                  disabled={!chosen.includes(s) && chosen.length >= cl.skillCount}
                  onChange={() =>
                    setChosen(chosen.includes(s) ? chosen.filter((x) => x !== s) : [...chosen, s])
                  }
                />
              ))}
          </div>
          {['Human', 'Elf'].includes(ancestry) && (
            <Select
              label={`${ancestry} bonus skill`}
              value={effectiveSpeciesSkill}
              options={availableExtra}
              onChange={setSpeciesSkill}
            />
          )}
          <div className="field-grid">
            {[1, 2].map((n) => (
              <Select
                key={n}
                label={`Additional language ${n}`}
                value={n === 1 ? language1 : language2}
                options={[
                  'Common Sign Language',
                  'Draconic',
                  'Dwarvish',
                  'Elvish',
                  'Giant',
                  'Gnomish',
                  'Goblin',
                  'Halfling',
                  'Orc',
                ]}
                onChange={n === 1 ? setLanguage1 : setLanguage2}
              />
            ))}
          </div>
          <p className="hint">
            Use the sheet to choose Expertise, spells, fighting styles, and other class options. The
            Reference view contains the full SRD descriptions.
          </p>
        </>
      )}
      {step === 4 && (
        <div className="review">
          <h3>{name || 'Your adventurer'}</h3>
          <p>
            Level 1 {ancestry} {className} · {background}
          </p>
          <p>{abilities.map((a) => `${a} ${finalScores[a]}`).join(' · ')}</p>
          <p>
            Starting gold: {cl.gold + 50} GP · Hit die: d{cl.die}
          </p>
          <p>Origin feat: {bg.feat}</p>
          <p>
            Skills:{' '}
            {[
              ...bg.skills,
              ...chosen,
              ...(['Human', 'Elf'].includes(ancestry) ? [effectiveSpeciesSkill] : []),
            ].join(', ')}
          </p>
          <p className="hint">
            Your character is editable after creation. Review species and feat choices, select
            starting spells, and equip armor before play.
          </p>
        </div>
      )}
      {error && (
        <p className="notice" role="alert">
          {error}
        </p>
      )}
      <div className="actions">
        <button
          disabled={step === 1}
          onClick={() => {
            setStep(step - 1)
            setError('')
          }}
        >
          Back
        </button>
        {step < 4 ? (
          <button
            className="primary"
            onClick={() => {
              setStep(step + 1)
              setError('')
            }}
          >
            Continue
          </button>
        ) : (
          <button className="primary" onClick={create}>
            Create adventurer
          </button>
        )}
      </div>
    </Modal>
  )
}

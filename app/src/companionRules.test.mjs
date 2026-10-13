import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import { pugilistPreview } from './pugilist.ts'
import {
  characterClasses,
  skillBudget,
  validateSkillChange,
  validateSkillDraft,
  DEFAULT_RULES,
} from './companionRules.ts'
import { abilitiesFor } from './combatLibrary.ts'
const template = JSON.parse(fs.readFileSync(new URL('./data/punpun.json', import.meta.url)))
function character(
  description = 'Pugilist 5 The Sweet Science',
  race = 'Human',
  background = 'Acolyte',
) {
  const book = pugilistPreview(structuredClone(template)),
    main = book.sheets.find((s) => s.title === 'v2.1')
  for (const [a, v] of Object.entries({ T5: description, T7: race, AJ11: background, AL6: 5 }))
    main.cells[a] = { ...main.cells[a], value: v }
  const read = (s, a) => book.sheets.find((t) => t.title === s)?.cells[a]?.value ?? ''
  const select = (name, value = 1) => {
    const names = [
      'Acrobatics',
      'Animal Handling',
      'Arcana',
      'Athletics',
      'Deception',
      'History',
      'Insight',
      'Intimidation',
      'Investigation',
      'Medicine',
      'Nature',
      'Perception',
      'Performance',
      'Persuasion',
      'Religion',
      'Sleight of Hand',
      'Stealth',
      'Survival',
    ]
    main.cells['H' + (25 + names.indexOf(name))].value = value
  }
  return { book, main, read, select }
}
test('level 5 Pugilist has level-gated bonus actions, reactions and no level 6 features', () => {
  const { book, read } = character()
  const { abilities } = abilitiesFor(book, read, DEFAULT_RULES)
  for (const name of [
    'Extra Attack',
    'Haymaker',
    'Dig Deep',
    'Brace Up',
    'Bloodied but Unbowed',
    'Cross Counter',
  ])
    assert.ok(
      abilities.some((a) => a.name === name),
      name,
    )
  assert.equal(abilities.find((a) => a.name === 'Brace Up').economy, 'Bonus action')
  assert.equal(abilities.find((a) => a.name === 'Cross Counter').economy, 'Reaction')
  assert.equal(
    abilities.some((a) => a.name === 'Moxie-Fueled Fists' || a.name === 'One, Two, Three, Floor'),
    false,
  )
  assert.equal(skillBudget(book, read, DEFAULT_RULES).expertiseLimit, 0)
})
test('every workbook core class and subclass has matching SRD coverage', () => {
  const sub = {
    Barbarian: 'Berserker',
    Bard: 'Lore',
    Cleric: 'Life',
    Druid: 'Land',
    Fighter: 'Champion',
    Monk: 'Open Hand',
    Paladin: 'Devotion',
    Ranger: 'Hunter',
    Rogue: 'Thief',
    Sorcerer: 'Draconic Bloodline',
    Warlock: 'Fiend',
    Wizard: 'Evocation',
  }
  for (const [name, subclass] of Object.entries(sub)) {
    const { book, read } = character(`${name} 20 ${subclass}`)
    const result = abilitiesFor(book, read, DEFAULT_RULES)
    assert.equal(result.unsupported.length, 0, `${name} ${subclass}`)
    assert.ok(result.abilities.some((a) => a.subclass && a.className === name))
    assert.ok(
      result.abilities.filter((a) => a.className === name).every((a) => a.detail.length > 30),
    )
  }
})
test('live sheet class levels win until the class input is edited; multiclass uses class levels', () => {
  const { book, main, read } = character('Champion Fighter 5 Thief Rogue 2')
  assert.deepEqual(characterClasses(book, read), [
    { name: 'Fighter', subclass: 'Champion', level: 5 },
    { name: 'Rogue', subclass: 'Thief', level: 2 },
  ])
  main.cells.AR6 = { value: 'Fighter' }
  main.cells.AT6 = { value: 4 }
  assert.equal(characterClasses(book, read)[0].level, 4)
  const draft = (s, a) => (s === 'v2.1' && a === 'T5' ? 'Fighter 6 Champion' : read(s, a))
  assert.equal(characterClasses(book, draft)[0].level, 6)
})
test('grants account for class, race, background, subclass and Expertise separately', () => {
  for (const [description, race, total, expertise] of [
    ['Pugilist 5 Bloodhound Bruisers', 'Half-Elf', 8, 0],
    ['Pugilist 5 Arena Royale', 'Human', 5, 0],
    ['Bard 3 Lore', 'Human', 8, 2],
    ['Rogue 5 Thief', 'High Elf', 7, 2],
    ['Rogue 6 Thief', 'Human', 6, 4],
  ]) {
    const { book, read } = character(description, race)
    const budget = skillBudget(book, read, DEFAULT_RULES)
    assert.equal(budget.limit, total, description + ' ' + race)
    assert.equal(budget.expertiseLimit, expertise)
  }
})
test('skill source matching prevents using background/class slots for unrelated skills', () => {
  const { book, read, select } = character()
  select('Athletics')
  select('Deception')
  select('Insight')
  select('Religion')
  const b = skillBudget(book, read, DEFAULT_RULES)
  assert.equal(b.limit, 4)
  assert.deepEqual(b.unmatched, [])
  const next = (s, a) => (s === 'v2.1' && a === 'H27' ? 1 : read(s, a))
  assert.throws(() => validateSkillChange(book, read, next, DEFAULT_RULES, 'H27'), /4 skill/)
  select('Deception', 0)
  assert.throws(() => validateSkillChange(book, read, next, DEFAULT_RULES, 'H27'), /cannot fit/)
  validateSkillChange(book, read, next, { ...DEFAULT_RULES, extraSkills: 1 }, 'H27')
})
test('Expertise requires proficiency and a grant; explicit DM overrides permit extra training', () => {
  const { book, read, select } = character()
  const next = (s, a) => (s === 'v2.1' && a === 'H28' ? 'e' : read(s, a))
  assert.throws(
    () => validateSkillChange(book, read, next, DEFAULT_RULES, 'H28'),
    /Proficient before/,
  )
  select('Athletics')
  assert.throws(() => validateSkillChange(book, read, next, DEFAULT_RULES, 'H28'), /0 Expertise/)
  validateSkillChange(book, read, next, { ...DEFAULT_RULES, extraExpertise: 1 }, 'H28')
  select('Athletics', 'e')
  assert.equal(skillBudget(book, read, { ...DEFAULT_RULES, extraExpertise: 1 }).selected.length, 1)
})
test('fresh save validation catches late changes to a class skill list', () => {
  const { book, read } = character()
  const edit = { tab: 'v2.1', address: 'H28', value: 1, before: 0 }
  validateSkillDraft(book, [edit], DEFAULT_RULES)
  const source = book.sheets.find((s) => s.title === 'Class Info'),
    row = Object.entries(source.cells)
      .find(([a, c]) => /^B\d+$/.test(a) && c.value === 'Pugilist')[0]
      .slice(1)
  source.cells['Q' + row].value = 'Strength, Constitution, Choose 2, Deception, Stealth'
  assert.throws(() => validateSkillDraft(book, [edit], DEFAULT_RULES), /no longer fit/)
  validateSkillDraft(book, [edit], { ...DEFAULT_RULES, skillLimit: 5 })
  assert.equal(read('v2.1', 'H28'), 0)
})
test('tool Expertise consumes Rogue choices; unknown grants are not guessed', () => {
  const { book, read, select } = character('Rogue 1 Thief')
  select('Athletics', 'e')
  select('Deception', 'e')
  assert.equal(
    skillBudget(book, read, { ...DEFAULT_RULES, toolExpertise: 1 }).expertiseRemaining,
    0,
  )
  const unknown = character('Fighter 5 Champion', 'DM custom race', 'DM custom background')
  assert.equal(skillBudget(unknown.book, unknown.read, DEFAULT_RULES).known, false)
})

test('manual subclass skill notes are not double counted; stale helpers do not survive origin drafts', () => {
  const { book, main, read } = character('Bard 3 Lore')
  main.cells.AQ63 = { value: 'bonus proficiencies (arcana, history, nature)' }
  main.cells.AS16 = { value: 6 }
  assert.equal(skillBudget(book, read, DEFAULT_RULES).limit, 8)
  main.cells.AS16.value = 9
  assert.equal(skillBudget(book, read, DEFAULT_RULES).limit, 11)
  main.cells.AQ63.value = ''
  const next = (s, a) => (s === 'v2.1' && a === 'T5' ? 'Pugilist 5 The Sweet Science' : read(s, a))
  assert.equal(skillBudget(book, next, DEFAULT_RULES).limit, 4)
})

test('Pugilist conditional subclass proficiencies respect their prerequisites', () => {
  const arena = character('Pugilist 5 Arena Royale')
  assert.deepEqual(
    skillBudget(arena.book, arena.read, DEFAULT_RULES).grants.find(
      (g) => g.source === 'Arena Royale',
    ).allowed,
    ['Performance'],
  )
  arena.select('Performance')
  assert.ok(
    skillBudget(arena.book, arena.read, DEFAULT_RULES)
      .grants.find((g) => g.source === 'Arena Royale')
      .allowed.includes('Persuasion'),
  )
  const piss = character('Pugilist 5 Piss & Vinegar', 'Half-Orc')
  assert.equal(skillBudget(piss.book, piss.read, DEFAULT_RULES).limit, 5)
})

test('five skill proficiencies come from explicit class, race and background grants', () => {
  const { book, read } = character('Pugilist 5 The Sweet Science', 'Half-Orc', 'Criminal')
  const b = skillBudget(book, read, DEFAULT_RULES)
  assert.equal(b.limit, 5)
  assert.equal(b.limitSource, 'Reference estimate')
  assert.deepEqual(
    b.grants.map((g) => [g.source, g.count]),
    [
      ['Pugilist', 2],
      ['Half-Orc', 1],
      ['Criminal', 1],
      ['Criminal', 1],
    ],
  )
  assert.equal(b.grants.find((g) => g.source === 'Half-Orc').reference, 'Race Info!AJ29')
  const human = character('Pugilist 5 The Sweet Science', 'Human', 'Criminal')
  assert.equal(skillBudget(human.book, human.read, DEFAULT_RULES).limit, 4)
  const player = character('Pugilist 5 Piss & Vinegar', 'Human', 'Urchin')
  const budget = skillBudget(player.book, player.read, DEFAULT_RULES)
  assert.equal(budget.limit, 5)
  assert.match(
    budget.grants.find((g) => g.source === 'Piss & Vinegar').condition,
    /not already proficient/,
  )
})

test('a lower calculated sheet total wins over reference estimates and explicit overrides remain available', () => {
  const { book, main, read } = character('Pugilist 5 Arena Royale', 'Half-Orc', 'Criminal')
  main.cells.AS16 = { value: 3 }
  const budget = skillBudget(book, read, DEFAULT_RULES)
  assert.equal(budget.derived, 6)
  assert.equal(budget.sheetCount, 5)
  assert.equal(budget.limit, 5)
  assert.equal(budget.limitSource, 'Spreadsheet')
  assert.equal(skillBudget(book, read, { ...DEFAULT_RULES, extraSkills: 1 }).limit, 6)
  assert.equal(skillBudget(book, read, { ...DEFAULT_RULES, skillLimit: 7 }).limit, 7)
  assert.equal(
    skillBudget(book, read, { ...DEFAULT_RULES, skillLimit: 7 }).limitSource,
    'DM override',
  )
})

test('a confirmed sheet count still constrains an unrecognized custom grant source', () => {
  const { book, main, read, select } = character(
    'Pugilist 5 The Sweet Science',
    'Custom race',
    'Criminal',
  )
  main.cells.AS16 = { value: 2 }
  for (const name of ['Athletics', 'Intimidation', 'Deception', 'Stealth']) select(name)
  const next = (s, a) => (s === 'v2.1' && a === 'H36' ? 1 : read(s, a))
  assert.equal(skillBudget(book, read, DEFAULT_RULES).known, false)
  assert.throws(
    () => validateSkillChange(book, read, next, DEFAULT_RULES, 'H36'),
    /4 skill proficiency slots/,
  )
})

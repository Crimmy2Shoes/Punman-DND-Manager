import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import vm from 'node:vm'
import {
  PHB_SUBCLASSES,
  PHB_ADDITIONAL_ABILITIES,
  canonicalSubclass,
  subclassUnlock,
} from './phbSubclassRules.ts'
import {
  CORE_SPELLS_2014,
  SPELLS_2014,
  findSpell,
  spellAccess,
  spellEconomy,
  spellRows,
} from './legacySpells.ts'
import { featureGroups, featureChoiceIssues, selectedFeatureAbilities } from './featureChoices.ts'
import { abilitiesFor } from './combatLibrary.ts'
import { castingProfiles } from './castingRules.ts'
import { SUBCLASS_SPELL_LISTS } from './subclassSpells.ts'
import { skillBudget, validateSkillChange, DEFAULT_RULES, SKILLS } from './companionRules.ts'
const template = JSON.parse(fs.readFileSync(new URL('./data/punpun.json', import.meta.url)))
function character(description) {
  const book = structuredClone(template),
    main = book.sheets.find((s) => s.title === 'v2.1')
  for (const [a, value] of Object.entries({
    T5: description,
    T7: 'Human',
    AJ11: 'Urchin',
    AL6: 20,
    C30: 16,
    C35: 16,
    C40: 16,
  }))
    main.cells[a] = { ...main.cells[a], value }
  const read = (s, a) => book.sheets.find((t) => t.title === s)?.cells[a]?.value ?? ''
  return { book, main, read }
}
test('core 2014 pack covers 40 subclasses and 361 unique spells with metadata and definitions', () => {
  assert.equal(Object.values(PHB_SUBCLASSES).flat().length, 40)
  assert.equal(CORE_SPELLS_2014.length, 361)
  assert.equal(new Set(SPELLS_2014.map((s) => s.name)).size, SPELLS_2014.length)
  assert.equal(CORE_SPELLS_2014.filter((s) => s.level === 0).length, 27)
  for (const s of SPELLS_2014) {
    for (const key of [
      'name',
      'school',
      'castingTime',
      'range',
      'components',
      'duration',
      'description',
      'source',
    ])
      assert.ok(s[key].trim(), `${s.name} ${key}`)
    assert.ok(s.classes.length)
    assert.ok(s.level >= 0 && s.level <= 9)
    if (s.page === 0) assert.ok(/^https:\/\/(?:www\.|whitelabel\.)worldanvil.com\//.test(s.url))
  }
  for (const [name, subs] of Object.entries(PHB_SUBCLASSES))
    for (const sub of subs) {
      const c = character(`${name} 20 ${sub}`)
      const result = abilitiesFor(c.book, c.read, DEFAULT_RULES)
      assert.deepEqual(result.unsupported, [], `${name} ${sub}`)
      assert.ok(
        result.abilities.some((a) => a.subclass && canonicalSubclass(name, a.subclass) === sub),
        sub,
      )
    }
  for (const a of PHB_ADDITIONAL_ABILITIES)
    assert.ok(a.level >= subclassUnlock(a.className) && a.level <= 20 && a.detail.trim())
})
test('2014 spell differences, aliases, casting types and slots stay distinct from 2024', () => {
  assert.equal(findSpell("Melf's Acid Arrow").name, 'Acid Arrow')
  assert.equal(findSpell("Tasha's Hideous Laughter").name, 'Hideous Laughter')
  assert.equal(findSpell('Witch Bolt').range, '30 feet')
  assert.match(findSpell('Witch Bolt').description, /action for automatic 1d12/)
  assert.match(findSpell('Wrathful Smite').description, /psychic/)
  assert.match(findSpell('Ray of Sickness').description, /Constitution/)
  assert.equal(findSpell('Armor of Agathys').castingTime, '1 action')
  assert.equal(spellEconomy(findSpell('Shield').castingTime), 'Reaction')
  assert.equal(spellEconomy(findSpell('Hex').castingTime), 'Bonus action')
  assert.equal(spellEconomy(findSpell('Tsunami').castingTime), 'Unclassified')
  assert.equal(findSpell('Befuddlement'), undefined)
  assert.ok(spellRows.some((s) => s.level === 0 && s.name === 'N96'))
  assert.ok(spellRows.some((s) => s.level === 9 && s.name === 'D141'))
})
test('subclass unlocks and multiclass spell access use individual class levels', () => {
  const before = character('Rogue 2 Arcane Trickster'),
    after = character('Rogue 3 Arcane Trickster')
  assert.equal(
    abilitiesFor(before.book, before.read, DEFAULT_RULES).abilities.some(
      (a) => a.name === 'Mage Hand Legerdemain',
    ),
    false,
  )
  assert.ok(
    abilitiesFor(after.book, after.read, DEFAULT_RULES).abilities.some(
      (a) => a.name === 'Mage Hand Legerdemain' && a.economy === 'Bonus action',
    ),
  )
  assert.equal(spellAccess(after.book, after.read, findSpell('Fireball')).length, 0)
  const mixed = character('Wizard 1 / Cleric 9 Life')
  assert.equal(spellAccess(mixed.book, mixed.read, findSpell('Fireball')).length, 0)
  assert.ok(spellAccess(mixed.book, mixed.read, findSpell('Raise Dead')).length)
  const abj = character('Wizard 5 Abjuration'),
    abj6 = character('Wizard 6 Abjuration')
  assert.equal(
    abilitiesFor(abj.book, abj.read, DEFAULT_RULES).abilities.some(
      (a) => a.name === 'Projected Ward',
    ),
    false,
  )
  assert.ok(
    abilitiesFor(abj6.book, abj6.read, DEFAULT_RULES).abilities.some(
      (a) => a.name === 'Projected Ward' && a.economy === 'Reaction',
    ),
  )
})
test('patron lists are learning options; domains/oaths/selected land are always prepared', () => {
  for (const rows of Object.values(SUBCLASS_SPELL_LISTS))
    for (const [, names] of rows) for (const name of names) assert.ok(findSpell(name), name)
  const warlock = character('Warlock 5 The Great Old One')
  assert.ok(
    spellAccess(warlock.book, warlock.read, findSpell('Sending')).some((s) =>
      s.includes('Expanded list'),
    ),
  )
  assert.equal(
    abilitiesFor(warlock.book, warlock.read, DEFAULT_RULES).abilities.some(
      (a) => a.spellName === 'Sending',
    ),
    false,
  )
  const life = character('Cleric 3 Life')
  assert.ok(
    abilitiesFor(life.book, life.read, DEFAULT_RULES).abilities.some(
      (a) => a.spellName === 'Spiritual Weapon' && a.economy === 'Bonus action',
    ),
  )
  const land = character('Druid 3 Land'),
    settings = { ...DEFAULT_RULES, selections: ['Druid:land:Coast'] }
  assert.ok(spellAccess(land.book, land.read, findSpell('Misty Step'), settings).length)
  assert.ok(
    abilitiesFor(land.book, land.read, settings).abilities.some(
      (a) => a.spellName === 'Misty Step',
    ),
  )
  assert.equal(spellAccess(land.book, land.read, findSpell('Misty Step')).length, 0)
})
test('selected feature cards respect limits and invocation level, pact and cantrip prerequisites', () => {
  const war = character('Warlock 3 Fiend'),
    settings = { ...DEFAULT_RULES, selections: [] }
  let group = featureGroups(war.book, war.read, settings).find((g) => g.id === 'Warlock:invocation')
  assert.equal(group.limit, 2)
  assert.equal(group.options.find((o) => o.name === 'Agonizing Blast').eligible, false)
  war.main.cells.N96 = { value: 'Eldritch Blast' }
  settings.selections = ['Warlock:pact:Pact of the Tome']
  group = featureGroups(war.book, war.read, settings).find((g) => g.id === 'Warlock:invocation')
  assert.equal(group.options.find((o) => o.name === 'Agonizing Blast').eligible, true)
  assert.equal(group.options.find((o) => o.name === 'Book of Ancient Secrets').eligible, true)
  assert.equal(group.options.find((o) => o.name === 'Thirsting Blade').eligible, false)
  settings.selections.push(
    'Warlock:invocation:Agonizing Blast',
    'Warlock:invocation:Book of Ancient Secrets',
    'Warlock:invocation:Armor of Shadows',
  )
  assert.ok(featureChoiceIssues(war.book, war.read, settings).some((s) => s.includes('limit 2')))
  const hunter = character('Ranger 3 Hunter')
  assert.equal(selectedFeatureAbilities(hunter.book, hunter.read, DEFAULT_RULES).length, 0)
  assert.equal(
    selectedFeatureAbilities(hunter.book, hunter.read, {
      ...DEFAULT_RULES,
      selections: ['Ranger:hunter3:Giant Killer'],
    })[0].economy,
    'Reaction',
  )
  const monk = character('Monk 3 Four Elements')
  assert.equal(
    featureGroups(monk.book, monk.read, DEFAULT_RULES)
      .find((g) => g.id === 'Monk:discipline')
      .options.find((o) => o.name === 'Flames of the Phoenix').eligible,
    false,
  )
})
test('casting counts follow 2014 tables and Knowledge Expertise has a restricted source', () => {
  for (const [description, known, cantrips, prepared, maxLevel] of [
    ['Bard 10 Lore', 16, 4, null, 5],
    ['Ranger 5 Hunter', 4, 0, null, 2],
    ['Rogue 7 Arcane Trickster', 5, 3, null, 2],
    ['Fighter 10 Eldritch Knight', 7, 3, null, 2],
    ['Cleric 5 Life', null, 4, 8, 3],
  ]) {
    const c = character(description),
      p = castingProfiles(c.book, c.read)[0]
    assert.equal(p.known, known)
    assert.equal(p.cantrips, cantrips)
    assert.equal(p.prepared, prepared)
    assert.equal(p.maxLevel, maxLevel)
  }
  const c = character('Cleric 1 Knowledge'),
    b = skillBudget(c.book, c.read, DEFAULT_RULES)
  assert.equal(b.baseExpertise, 2)
  assert.ok(b.grants.some((g) => g.source === 'Knowledge Domain' && g.count === 2))
  c.main.cells.H41 = { value: 1 }
  const next = (s, a) => (s === 'v2.1' && a === 'H41' ? 'e' : c.read(s, a))
  assert.throws(
    () => validateSkillChange(c.book, c.read, next, DEFAULT_RULES, 'H41'),
    /Knowledge Domain/,
  )
  assert.doesNotThrow(() =>
    validateSkillChange(c.book, c.read, next, { ...DEFAULT_RULES, expertiseLimit: 2 }, 'H41'),
  )
  const skills = JSON.parse(fs.readFileSync(new URL('./data/legacy-skills.json', import.meta.url)))
  assert.deepEqual(skills.map((s) => s.name).sort(), [...SKILLS].sort())
  for (const s of skills) assert.ok(s.detail.length > 20 && s.page >= 79 && s.page <= 83)
})
test('core installer backs up before writes, preserves existing rows/images and is idempotent', () => {
  const source = fs.readFileSync(new URL('../public/Install_Core2014.gs', import.meta.url), 'utf8')
  const rows = Array.from({ length: 200 }, () => Array(55).fill(''))
  rows[4][4] = 'Subclass'
  const original = template.sheets.find((s) => s.title === 'Class Info')
  const colIndex = (a) => [...a].reduce((n, c) => n * 26 + c.charCodeAt(0) - 64, 0) - 1
  for (const [address, c] of Object.entries(original.cells)) {
    const [, col, row] = /^([A-Z]+)(\d+)$/.exec(address)
    if (Number(row) <= 200) rows[Number(row) - 1][colIndex(col)] = c.value ?? ''
  }
  rows[10][50] = '=IMAGE("existing-artwork")'
  const events = [],
    sheet = {
      getMaxRows: () => 200,
      getMaxColumns: () => 55,
      getRange: (a, b, h = 1, w = 1) => {
        let row, col
        if (typeof a === 'string') {
          const [, letters, digits] = /^([A-Z]+)(\d+)$/.exec(a)
          row = Number(digits)
          col = colIndex(letters) + 1
        } else {
          row = a
          col = b
        }
        return {
          getValue: () => rows[row - 1][col - 1],
          getValues: () =>
            rows.slice(row - 1, row - 1 + h).map((r) => r.slice(col - 1, col - 1 + w)),
          getFormulas: () => Array.from({ length: h }, () => Array(w).fill('')),
          setValue: (v) => {
            events.push('write')
            rows[row - 1][col - 1] = v
          },
        }
      },
    }
  const book = {
    getSheetByName: (n) => (n === 'Class Info' ? sheet : n === 'v2.1' ? {} : null),
    getName: () => 'Test',
    copy: () => {
      events.push('backup')
      return { getUrl: () => 'backup-url' }
    },
    toast: () => {},
  }
  const ctx = {
    SpreadsheetApp: { getActiveSpreadsheet: () => book, flush: () => {} },
    console: { log: () => {} },
  }
  vm.createContext(ctx)
  vm.runInContext(source, ctx)
  ctx.installCore2014()
  assert.equal(events[0], 'backup')
  assert.equal(rows[10][50], '=IMAGE("existing-artwork")')
  const count = events.length
  ctx.installCore2014()
  assert.equal(events.length, count)
  assert.equal(rows.filter((r) => r[1] === 'Rogue' && r[4] === 'Arcane Trickster').length, 1)
})

test('known spells, always-prepared grants and innate casting appear without false preparation requirements', () => {
  for (const [description, ready] of [
    ['Sorcerer 1 Wild Magic', true],
    ['Wizard 1 Evocation', false],
  ]) {
    const c = character(description)
    c.main.cells.D100 = { value: 'Witch Bolt' }
    c.main.cells.C100 = { value: 0 }
    assert.equal(
      abilitiesFor(c.book, c.read, DEFAULT_RULES).abilities.some(
        (a) => a.spellName === 'Witch Bolt',
      ),
      ready,
    )
  }
  const cleric = character('Cleric 3 Life')
  cleric.main.cells.N106 = { value: 'Spiritual Weapon' }
  cleric.main.cells.M106 = { value: 0 }
  assert.ok(
    abilitiesFor(cleric.book, cleric.read, DEFAULT_RULES).abilities.some(
      (a) => a.spellName === 'Spiritual Weapon',
    ),
  )
  const shadow = character('Monk 3 Shadow')
  assert.ok(
    abilitiesFor(shadow.book, shadow.read, DEFAULT_RULES).abilities.some(
      (a) => a.spellName === 'Darkness' && a.cost.includes('2 ki'),
    ),
  )
  const tiefling = character('Rogue 5 Thief')
  tiefling.main.cells.T7 = { value: 'Tiefling' }
  assert.ok(
    abilitiesFor(tiefling.book, tiefling.read, DEFAULT_RULES).abilities.some(
      (a) =>
        a.spellName === 'Hellish Rebuke' && a.economy === 'Reaction' && a.cost.includes('level 2'),
    ),
  )
  const bard = character('Bard 6 Lore')
  assert.ok(
    spellAccess(bard.book, bard.read, findSpell('Fireball')).some((s) =>
      s.includes('Magical Secrets'),
    ),
  )
})

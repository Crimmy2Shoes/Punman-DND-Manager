import test from 'node:test'
import assert from 'node:assert/strict'
import {
  createCharacter,
  damage,
  heal,
  modifier,
  proficiency,
  parseCharacters,
  mod,
  skillBonus,
  newSpell,
} from './character.ts'
import {
  slotTotals,
  syncProgression,
  completeRest,
  spendHitDie,
  deathSave,
  castSpell,
  levelUp,
  multiclassAllowed,
  rollDice,
  buildCharacter,
} from './rules.ts'
import { parseBackup } from './storage.ts'
test('ability modifiers round down and proficiency scales at level boundaries', () => {
  assert.equal(modifier(9), -1)
  assert.equal(modifier(16), 3)
  assert.deepEqual(
    [1, 4, 5, 8, 9, 12, 13, 16, 17, 20].map(proficiency),
    [2, 2, 3, 3, 4, 4, 5, 5, 6, 6],
  )
})
test('damage consumes temporary HP first and preserves the source character', () => {
  const c = { ...createCharacter(), hp: 10, tempHp: 5 }
  assert.equal(damage(c, 3).hp, 10)
  assert.equal(damage(c, 3).tempHp, 2)
  assert.equal(damage(c, 8).hp, 7)
  assert.equal(damage(c, 12).hp, 3)
  assert.equal(c.tempHp, 5)
})
test('massive damage and damage at zero record death state', () => {
  const c = createCharacter()
  assert.equal(damage(c, 20).dead, true)
  assert.equal(damage({ ...c, hp: 0, failures: 2 }, 1).dead, true)
  assert.equal(damage({ ...c, hp: 0, tempHp: 3, failures: 2 }, 1).dead, false)
})
test('healing caps at maximum, leaves temporary HP, resets saves, and cannot revive', () => {
  const c = { ...createCharacter(), hp: 0, tempHp: 4, successes: 2, failures: 1 }
  const result = heal(c, 99)
  assert.equal(result.hp, c.maxHp)
  assert.equal(result.tempHp, 4)
  assert.equal(result.successes, 0)
  assert.equal(result.failures, 0)
  assert.equal(heal({ ...c, dead: true }, 99).hp, 0)
})
test('legacy saves acquire the expanded model without losing notes or coins', () => {
  const c = createCharacter()
  const { wallet, hitDice, classes, resources, spellEntries, ...legacy } = c
  legacy.coins = 21
  legacy.notes = 'Keep this note'
  const result = parseCharacters([legacy])[0]
  assert.equal(result.wallet.gp, 21)
  assert.equal(result.notes, 'Keep this note')
  assert.equal(result.hitDice[0].total, 1)
})
test('backup validation rejects malformed, duplicate, noninteger, and inconsistent data', () => {
  const c = createCharacter()
  assert.ok(parseCharacters([c]))
  for (const patch of [
    { hp: 999 },
    { scores: null },
    { level: 1.5 },
    { slots: [{ total: 2, spent: 3 }] },
    { conditions: ['Made up'] },
    { items: [{ name: 'Broken' }] },
    { wallet: { cp: -1, sp: 0, ep: 0, gp: 0, pp: 0 } },
  ])
    assert.equal(parseCharacters([{ ...c, ...patch }]), null)
  assert.equal(parseCharacters([c, c]), null)
  assert.equal(parseBackup({ version: 3, characters: [c] }), null)
})
test('slot progression supports full casters, 2024 level-one half casters, and multiclass rounding', () => {
  assert.deepEqual(slotTotals([{ name: 'Wizard', level: 5 }]).slice(0, 4), [4, 3, 2, 0])
  assert.equal(slotTotals([{ name: 'Ranger', level: 1 }])[0], 2)
  assert.deepEqual(slotTotals([{ name: 'Ranger', level: 3 }]).slice(0, 3), [3, 0, 0])
  assert.deepEqual(
    slotTotals([
      { name: 'Paladin', level: 1 },
      { name: 'Wizard', level: 1 },
    ]).slice(0, 3),
    [3, 0, 0],
  )
  assert.deepEqual(
    slotTotals([
      { name: 'Ranger', level: 4 },
      { name: 'Sorcerer', level: 3 },
    ]).slice(0, 4),
    [4, 3, 2, 0],
  )
  assert.equal(
    slotTotals([{ name: 'Fighter', level: 20 }]).reduce((a, b) => a + b),
    0,
  )
})
test('Pact Magic and differently sized hit dice remain separate', () => {
  const c = syncProgression({
    ...createCharacter(),
    level: 5,
    classes: [
      { name: 'Warlock', level: 3, subclass: '' },
      { name: 'Wizard', level: 2, subclass: '' },
    ],
  })
  assert.deepEqual(c.pact, { level: 2, total: 2, spent: 0 })
  assert.equal(c.slots[0].total, 3)
  assert.deepEqual(
    c.hitDice.map((d) => [d.die, d.total]),
    [
      [8, 3],
      [6, 2],
    ],
  )
})
test('short rest restores correct resources but not HP or ordinary slots', () => {
  const c = {
    ...createCharacter(),
    hp: 5,
    tempHp: 2,
    slots: Array.from({ length: 9 }, () => ({ total: 1, spent: 1 })),
    pact: { level: 1, total: 2, spent: 2 },
    resources: [
      { id: 'rage', name: 'Rage', total: 3, remaining: 0, recharge: 'short-one', notes: '' },
      { id: 'focus', name: 'Focus', total: 4, remaining: 0, recharge: 'short', notes: '' },
      { id: 'long', name: 'Long', total: 2, remaining: 0, recharge: 'long', notes: '' },
      { id: 'manual', name: 'Manual', total: 2, remaining: 0, recharge: 'manual', notes: '' },
    ],
  }
  const next = completeRest(c, 'short')
  assert.equal(next.hp, 5)
  assert.equal(next.slots[0].spent, 1)
  assert.equal(next.pact.spent, 0)
  assert.deepEqual(
    next.resources.map((r) => r.remaining),
    [1, 4, 0, 0],
  )
})
test('2024 long rest recovers ALL hit dice, reductions, and resources', () => {
  const c = createCharacter()
  c.hp = 2
  c.tempHp = 7
  c.hitDice = [{ die: 8, total: 5, spent: 5 }]
  c.hpReduction = 3
  c.exhaustion = 2
  c.species = 'Human'
  c.scoreReductions.Strength = 2
  const next = completeRest(c, 'long')
  assert.equal(next.hp, c.maxHp)
  assert.equal(next.hitDice[0].spent, 0)
  assert.equal(next.tempHp, 0)
  assert.equal(next.hpReduction, 0)
  assert.equal(next.scoreReductions.Strength, 0)
  assert.equal(next.exhaustion, 1)
  assert.equal(next.inspiration, true)
  assert.equal(completeRest(c, 'long', false).exhaustion, 2)
  assert.throws(() => completeRest({ ...c, hp: 0 }, 'long'))
})
test('hit die spending has a one-HP minimum and guards depleted dice', () => {
  const c = createCharacter()
  c.hp = 2
  c.scores.Constitution = 3
  c.hitDice = [{ die: 8, total: 1, spent: 0 }]
  const next = spendHitDie(c, 8, 1)
  assert.equal(next.hp, 3)
  assert.equal(next.hitDice[0].spent, 1)
  assert.throws(() => spendHitDie(next, 8, 8))
  assert.throws(() => spendHitDie(c, 8, 9))
})
test('death saves handle natural 1, natural 20, stabilizing and dying', () => {
  const c = { ...createCharacter(), hp: 0 }
  assert.equal(deathSave(c, 1).failures, 2)
  assert.equal(deathSave(c, 20).hp, 1)
  const stable = deathSave({ ...c, successes: 2 }, 10)
  assert.equal(stable.stable, true)
  assert.equal(stable.successes, 0)
  assert.equal(deathSave({ ...c, failures: 2 }, 9).dead, true)
})
test('exhaustion penalizes D20 tests, not ability modifiers or spell DC', () => {
  const c = createCharacter()
  c.exhaustion = 2
  c.skills.Perception = 1
  assert.equal(mod(c, 'Wisdom'), 0)
  assert.equal(skillBonus(c, 'Perception', 'Wisdom'), -2)
  assert.equal(deathSave({ ...c, hp: 0 }, 12).failures, 1)
})
test('spell casting guards slots, supports upcasting, and replaces concentration', () => {
  const c = createCharacter()
  c.slots[1] = { total: 1, spent: 0 }
  c.concentration = 'Old spell'
  const spell = { ...newSpell(), name: 'New spell', level: 1, concentration: true }
  const next = castSpell(c, spell, 'slot', 2)
  assert.equal(next.slots[1].spent, 1)
  assert.equal(next.concentration, 'New spell')
  assert.throws(() => castSpell(next, spell, 'slot', 2))
  assert.throws(() => castSpell(c, spell, 'slot', 1))
  assert.throws(() => castSpell(c, spell, 'ritual', 1))
  assert.equal(castSpell(c, { ...spell, ritual: true }, 'ritual', 1).slots[1].spent, 0)
  assert.equal(castSpell(c, { ...spell, level: 0 }, 'slot', 1).slots[1].spent, 0)
})
test('leveling adds average HP and one hit die; multiclassing checks both classes', () => {
  const c = buildCharacter({
    name: 'Test',
    className: 'Fighter',
    background: 'Soldier',
    species: 'Human',
    scores: {
      Strength: 15,
      Dexterity: 14,
      Constitution: 14,
      Intelligence: 12,
      Wisdom: 10,
      Charisma: 8,
    },
    chosenSkills: ['Perception', 'Insight'],
    languages: 'Common, Elvish, Dwarvish',
  })
  const next = levelUp(c, 'Fighter')
  assert.equal(next.level, 2)
  assert.equal(next.maxHp, c.maxHp + 8)
  assert.equal(next.hitDice[0].total, 2)
  assert.equal(multiclassAllowed(c, 'Wizard'), false)
  assert.throws(() => levelUp(c, 'Wizard'))
  assert.throws(() => levelUp({ ...c, level: 20 }, 'Fighter'))
})
test('dice expressions reject unsafe input and stay in range', () => {
  assert.throws(() => rollDice('alert(1)'))
  assert.throws(() => rollDice('0d6'))
  assert.throws(() => rollDice('99d6'))
  for (let i = 0; i < 20; i++) {
    const r = rollDice('2d6 + 3')
    assert.ok(r.total >= 5 && r.total <= 15)
    assert.equal(r.rolls.length, 2)
  }
})

test('temporary Constitution reductions affect maximum HP and long rest restores it', () => {
  const c = syncProgression({
    ...createCharacter(),
    level: 3,
    classes: [{ name: 'Fighter', level: 3, subclass: '' }],
    scores: { ...createCharacter().scores, Constitution: 14 },
    maxHp: 28,
    hp: 10,
  })
  c.scoreReductions.Constitution = 2
  assert.equal(heal(c, 99).hp, 25)
  const next = completeRest(c, 'long')
  assert.equal(next.hp, 28)
  assert.equal(next.scoreReductions.Constitution, 0)
})

import {
  sheetTarget,
  qualified,
  validateBindings,
  characterCell,
  importCells,
  previewRange,
  mappedFields,
} from './googleSheets.ts'
import {
  alignments,
  damageTypes,
  weaponMasteries,
  spellSchools,
  backgroundNames,
  speciesNames,
} from './options.ts'
test('standard option lists include core categories without duplicates', () => {
  for (const [list, count] of [
    [alignments, 9],
    [damageTypes, 13],
    [weaponMasteries, 8],
    [spellSchools, 8],
    [backgroundNames, 16],
    [speciesNames, 10],
  ]) {
    assert.equal(list.length, count)
    assert.equal(new Set(list).size, count)
  }
})
test('sheet URLs and cell mappings validate the exact target and reject duplicates', () => {
  const target = sheetTarget('https://docs.google.com/spreadsheets/d/example-ID/edit?gid=359784640')
  assert.deepEqual(target, { id: 'example-ID', gid: 359784640 })
  assert.throws(() => sheetTarget('https://evil.example/spreadsheets/d/abc'))
  assert.throws(() => sheetTarget('https://docs.google.com/spreadsheets/d/abc/edit?gid=wrong'))
  assert.equal(qualified("Hero's Sheet", 'B3'), "'Hero''s Sheet'!B3")
  assert.deepEqual(validateBindings([{ field: 'name', cell: '$b$3' }]), [
    { field: 'name', cell: 'B3' },
  ])
  assert.throws(() =>
    validateBindings([
      { field: 'name', cell: 'B3' },
      { field: 'hp', cell: '$B$3' },
    ]),
  )
  assert.throws(() => validateBindings([{ field: 'unknown', cell: 'B3' }]))
  assert.equal(previewRange('a1:ad100'), 'A1:AD100')
  assert.throws(() => previewRange('A1:ZZ9999'))
  assert.throws(() => previewRange('B9:A1'))
  assert.ok(mappedFields.includes('scores.Strength'))
})
test('sheet cell import is validated, retains local identity, and skips blank cells', () => {
  const c = createCharacter()
  const next = importCells(
    c,
    [
      { field: 'name', cell: 'B3' },
      { field: 'scores.Strength', cell: 'B4' },
      { field: 'hp', cell: 'B5' },
    ],
    ['From sheet', 16, ''],
  )
  assert.equal(next.id, c.id)
  assert.equal(next.name, 'From sheet')
  assert.equal(next.scores.Strength, 16)
  assert.equal(next.hp, c.hp)
  assert.throws(() => importCells(c, [{ field: 'hp', cell: 'B5' }], [999]))
  assert.throws(() => importCells(c, [{ field: 'level', cell: 'B5' }], ['not a number']))
  const other = createCharacter()
  const restored = importCells(c, [{ field: 'backup', cell: 'Z1' }], [JSON.stringify(other)])
  assert.equal(restored.id, c.id)
  assert.equal(characterCell(c, 'name'), c.name)
  assert.throws(() => characterCell({ ...c, notes: 'x'.repeat(60000) }, 'backup'))
})

test('Google checkbox and proficiency mappings round-trip boolean and numeric values', () => {
  const c = createCharacter()
  const bindings = [
    { field: 'inspiration', cell: 'B1' },
    { field: 'saves.Strength', cell: 'B2' },
    { field: 'skills.Perception', cell: 'B3' },
  ]
  const next = importCells(c, bindings, [true, 'TRUE', 2])
  assert.equal(next.inspiration, true)
  assert.ok(next.saves.includes('Strength'))
  assert.equal(next.skills.Perception, 2)
  assert.equal(characterCell(next, 'saves.Strength'), true)
  assert.equal(characterCell(c, 'skills.Perception'), 0)
  assert.throws(() => importCells(c, [{ field: 'inspiration', cell: 'B1' }], ['maybe']))
})

import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import vm from 'node:vm'
import { OFFICIAL_SUBCLASSES, canonicalSubclass, subclassUnlock } from './phbSubclassRules.ts'
import { EXPANSION_SUBCLASSES } from './officialRegistry.ts'
import { EXPANSION_ABILITIES } from './expansionAbilities.ts'
import { abilitiesFor } from './combatLibrary.ts'
import { castingProfiles } from './castingRules.ts'
import { subclassSpellGrants } from './subclassSpells.ts'
import { featureGroups, featureChoiceIssues } from './featureChoices.ts'
import { skillBudget, validateSkillChange, DEFAULT_RULES } from './companionRules.ts'
import { findSpell, spellAccess } from './legacySpells.ts'
import { ITEM_CATALOG, findItem, priceInGold } from './itemCatalog.ts'
const template = JSON.parse(fs.readFileSync(new URL('./data/punpun.json', import.meta.url)))
function character(description) {
  const book = structuredClone(template),
    main = book.sheets.find((s) => s.title === 'v2.1')
  Object.assign(main.cells, {
    T5: { value: description },
    T7: { value: 'Human' },
    AJ11: { value: 'Urchin' },
    AL6: { value: 20 },
    C30: { value: 16 },
    C35: { value: 16 },
    C40: { value: 16 },
  })
  const read = (s, a) => book.sheets.find((t) => t.title === s)?.cells[a]?.value ?? ''
  return { book, main, read }
}
test('published 2014 registry has 13 classes / 118 unique subclasses, each with unlocked features', () => {
  assert.equal(Object.keys(OFFICIAL_SUBCLASSES).length, 13)
  assert.equal(Object.values(OFFICIAL_SUBCLASSES).flat().length, 118)
  assert.equal(Object.values(EXPANSION_SUBCLASSES).flat().length, 78)
  for (const [name, subs] of Object.entries(EXPANSION_SUBCLASSES))
    for (const sub of subs) {
      const c = character(`${name} 20 ${sub}`),
        result = abilitiesFor(c.book, c.read, DEFAULT_RULES)
      assert.ok(
        result.abilities.some(
          (a) => a.className === name && a.subclass && canonicalSubclass(name, a.subclass) === sub,
        ),
        `${name} ${sub}`,
      )
      assert.deepEqual(result.unsupported, [], `${name} ${sub}`)
      const before = character(`${name} ${subclassUnlock(name) - 1} ${sub}`)
      if (subclassUnlock(name) > 1)
        assert.ok(
          !abilitiesFor(before.book, before.read, DEFAULT_RULES).abilities.some(
            (a) => a.subclass && canonicalSubclass(name, a.subclass) === sub,
          ),
          sub,
        )
    }
  for (const a of EXPANSION_ABILITIES) {
    assert.ok(a.level >= 1 && a.level <= 20)
    assert.ok(a.detail)
    assert.ok(a.url.startsWith('https://'))
  }
})
test('Rogue subclasses personalize abilities; Scout Expertise is restricted to Nature and Survival', () => {
  const scout = character('Rogue 3 Scout'),
    swash = character('Rogue 3 Swashbuckler')
  assert.ok(
    abilitiesFor(scout.book, scout.read, DEFAULT_RULES).abilities.some(
      (a) => a.name === 'Skirmisher' && a.economy === 'Reaction',
    ),
  )
  assert.ok(
    !abilitiesFor(scout.book, scout.read, DEFAULT_RULES).abilities.some(
      (a) => a.name === 'Superior Mobility',
    ),
  )
  assert.ok(
    abilitiesFor(swash.book, swash.read, DEFAULT_RULES).abilities.some(
      (a) => a.name === 'Fancy Footwork',
    ),
  )
  assert.ok(
    !abilitiesFor(swash.book, swash.read, DEFAULT_RULES).abilities.some(
      (a) => a.name === 'Skirmisher',
    ),
  )
  const budget = skillBudget(scout.book, scout.read, DEFAULT_RULES)
  assert.equal(budget.baseExpertise, 4)
  assert.deepEqual(budget.fixedExpertise, ['Nature', 'Survival'])
  scout.main.cells.H25 = { value: 'e' }
  scout.main.cells.H29 = { value: 'e' }
  scout.main.cells.H41 = { value: 1 }
  const next = (s, a) => (s === 'v2.1' && a === 'H41' ? 'e' : scout.read(s, a))
  assert.throws(
    () => validateSkillChange(scout.book, scout.read, next, DEFAULT_RULES, 'H41'),
    /restricted/,
  )
  assert.doesNotThrow(() =>
    validateSkillChange(
      scout.book,
      scout.read,
      next,
      { ...DEFAULT_RULES, expertiseLimit: 5 },
      'H41',
    ),
  )
})
test('Artificer casting and expansion spell grants retain known/prepared/expanded distinctions', () => {
  for (const [level, cantrips, maxLevel] of [
    [1, 2, 1],
    [5, 2, 2],
    [10, 3, 3],
    [14, 4, 4],
  ]) {
    const c = character(`Artificer ${level} Alchemist`),
      p = castingProfiles(c.book, c.read)[0]
    assert.equal(p.ability, 'Intelligence')
    assert.equal(p.cantrips, cantrips)
    assert.equal(p.maxLevel, maxLevel)
    assert.equal(p.prepared, Math.max(1, Math.floor(level / 2) + 3))
    assert.equal(p.known, null)
    assert.ok(spellAccess(c.book, c.read, findSpell('Cure Wounds')).length)
  }
  assert.equal(
    subclassSpellGrants({ name: 'Artificer', subclass: 'Armorer', level: 3 })[1].name,
    'Thunderwave',
  )
  assert.ok(
    subclassSpellGrants({ name: 'Ranger', subclass: 'Gloom Stalker', level: 3 }).every(
      (g) => g.mode === 'Always known',
    ),
  )
  assert.ok(
    subclassSpellGrants({ name: 'Warlock', subclass: 'The Hexblade', level: 1 }).every(
      (g) => g.mode === 'Expanded list',
    ),
  )
  const c = character('Sorcerer 7 Aberrant Mind')
  assert.ok(
    abilitiesFor(c.book, c.read, DEFAULT_RULES).abilities.some(
      (a) => a.spellName === 'Summon Aberration',
    ),
  )
  assert.equal(findSpell('Summon Construct').school, 'Conjuration') // Avoid the 2024 Abjuration replacement.
})
test('Rune/infusion choices gate level, learned prerequisites, active limits and duplicate applications', () => {
  const rune = character('Fighter 3 Rune Knight'),
    g = featureGroups(rune.book, rune.read, DEFAULT_RULES).find((g) => g.id === 'Fighter:rune')
  assert.equal(g.limit, 2)
  assert.equal(g.options.find((o) => o.name === 'Hill').eligible, false)
  assert.ok(
    featureChoiceIssues(rune.book, rune.read, {
      ...DEFAULT_RULES,
      selections: ['Fighter:rune:Hill'],
    }).length,
  )
  const c = character('Artificer 9 Armorer')
  const learned = { ...DEFAULT_RULES, selections: ['Artificer:infusion:Enhanced Defense'] }
  assert.ok(
    !abilitiesFor(c.book, c.read, learned).abilities.some(
      (a) => a.name === 'Learned infusions · Enhanced Defense',
    ),
  )
  const active = {
    ...learned,
    selections: [...learned.selections, 'Artificer:infused:Enhanced Defense'],
  }
  assert.deepEqual(featureChoiceIssues(c.book, c.read, active), [])
  assert.ok(
    abilitiesFor(c.book, c.read, active).abilities.some(
      (a) => a.name === 'Active infused items · Enhanced Defense',
    ),
  )
  assert.ok(
    featureChoiceIssues(c.book, c.read, {
      ...active,
      selections: [...active.selections, 'Artificer:armored-infused:Enhanced Defense'],
    }).some((x) => x.includes('twice')),
  )
  assert.ok(
    featureChoiceIssues(c.book, c.read, {
      ...DEFAULT_RULES,
      selections: ['Artificer:infused:Enhanced Defense'],
    }).length,
  )
})
test('item catalog preserves armor costs/weights, packet quantities, attunement and unspecified magic prices', () => {
  assert.equal(ITEM_CATALOG.filter((i) => i.category === 'Magic item').length, 240)
  assert.equal(new Set(ITEM_CATALOG.map((i) => i.name.toLowerCase())).size, ITEM_CATALOG.length)
  assert.equal(findItem('Plate').weight, 65)
  assert.equal(priceInGold(findItem('Plate').cost), 1500)
  assert.match(findItem('Plate').detail, /Strength 15/)
  assert.equal(findItem('Longsword').weight, 3)
  assert.match(findItem('Longsword').detail, /Versatile/)
  assert.equal(findItem('Potion of Healing').cost, '50 gp')
  assert.equal(findItem('Potion of Healing').weight, 0.5)
  assert.equal(findItem('Bag of Holding').weight, 15)
  assert.equal(findItem('Bag of Holding').cost, '')
  assert.equal(findItem('Amulet of Health').attunement, true)
  assert.equal(findItem('Orb of Dragonkind').rarity, 'artifact')
  assert.equal(findItem('Weapon, +1, +2, or +3').rarity, 'Varies')
  assert.equal(priceInGold(''), null)
  assert.equal(priceInGold('5 sp'), 0.5)
  assert.ok(!ITEM_CATALOG.some((i) => i.name.startsWith('Holy symbol: Oil')))
})
function installerMock(occupied = false) {
  const events = [],
    tabs = [],
    idx = (s) => [...s].reduce((n, c) => n * 26 + c.charCodeAt(0) - 64, 0) - 1
  function make(title) {
    const values = Array.from({ length: 200 }, () => Array(55).fill('')),
      formulas = Array.from({ length: 200 }, () => Array(55).fill(''))
    const tab = {
      getName: () => title,
      getMaxRows: () => values.length,
      getMaxColumns: () => 55,
      insertRowsAfter: (at, count) => {
        events.push('resize')
        for (let i = 0; i < count; i++) {
          values.push(Array(55).fill(''))
          formulas.push(Array(55).fill(''))
        }
      },
      getRange: (a, b, h = 1, w = 1) => {
        let r, c
        if (typeof a === 'string') {
          const [, col, row] = /^([A-Z]+)(\d+)$/.exec(a)
          r = Number(row)
          c = idx(col) + 1
        } else {
          r = a
          c = b
        }
        return {
          getValue: () => values[r - 1][c - 1],
          getValues: () => values.slice(r - 1, r - 1 + h).map((row) => row.slice(c - 1, c - 1 + w)),
          getFormulas: () =>
            formulas.slice(r - 1, r - 1 + h).map((row) => row.slice(c - 1, c - 1 + w)),
          getDataValidations: () => Array.from({ length: h }, () => Array(w).fill(null)),
          setValue: (v) => {
            events.push('write')
            values[r - 1][c - 1] = v
          },
          setFormula: (f) => {
            events.push('formula')
            formulas[r - 1][c - 1] = f
          },
        }
      },
      getDataRange: () => tab.getRange(1, 1, values.length, 55),
    }
    tabs.push(tab)
    return { tab, values, formulas }
  }
  const info = make('Class Info'),
    main = make('v2.1')
  const original = template.sheets.find((s) => s.title === 'Class Info')
  for (const [a, c] of Object.entries(original.cells)) {
    const [, col, row] = /^([A-Z]+)(\d+)$/.exec(a)
    if (Number(row) > 200) continue
    info.values[Number(row) - 1][idx(col)] = c.value ?? ''
    info.formulas[Number(row) - 1][idx(col)] = c.formula ?? ''
  }
  info.values[4][4] = 'Subclass'
  if (occupied) {
    info.values[199][1] = 'DM reserved'
    info.tab.getMaxRows = () => 200 // Last row and all extension space occupied in this variant.
    const get = info.tab.getRange
    info.tab.getRange = (...args) => {
      const range = get(...args)
      if (args[0] === 7)
        range.getValues = () => Array.from({ length: 594 }, () => Array(54).fill('DM reserved'))
      return range
    }
  }
  main.formulas[0][0] = "=SUM('Class Info'!$B$7:$AG180)"
  main.formulas[0][1] = "=SUM('Race Info'!B7:AJ180)"
  main.formulas[0][2] = "=IMAGE('Class Info'!I7:I180)"
  const book = {
    getSheetByName: (n) => tabs.find((t) => t.getName() === n),
    getSheets: () => tabs,
    getName: () => 'Test',
    copy: () => {
      events.push('backup')
      return { getUrl: () => 'backup-url' }
    },
    toast: () => {},
  }
  const context = {
    SpreadsheetApp: {
      getActiveSpreadsheet: () => book,
      DataValidationCriteria: { VALUE_IN_RANGE: 'range', CUSTOM_FORMULA: 'formula' },
      flush: () => {},
    },
    console: { log: () => {} },
  }
  vm.createContext(context)
  vm.runInContext(
    fs.readFileSync(new URL('../public/Install_Official2014.gs', import.meta.url), 'utf8'),
    context,
  )
  return { context, events, info, main }
}
test('official installer backs up, extends only Class Info references, preserves images and reruns safely', () => {
  const { context, events, info, main } = installerMock()
  context.installOfficial2014()
  assert.equal(events[0], 'backup')
  assert.equal(info.values.length, 600)
  assert.equal(main.formulas[0][0], "=SUM('Class Info'!$B$7:$AG600)")
  assert.equal(main.formulas[0][1], "=SUM('Race Info'!B7:AJ180)")
  assert.equal(main.formulas[0][2], "=IMAGE('Class Info'!I7:I180)")
  for (const [name, subs] of Object.entries(OFFICIAL_SUBCLASSES))
    for (const sub of subs)
      assert.ok(
        info.values.some((row) => row[1] === name && canonicalSubclass(name, row[4]) === sub),
        sub,
      )
  assert.ok(
    info.values.some(
      (row) => row[1] === 'Artificer' && row[4] === '-' && row[32] === 'Artificer Casting',
    ),
  )
  const artificer=info.values.find(row=>row[1]==='Artificer'&&row[4]==='-')
  assert.match(artificer[23],/Simple Weapons, 1 Tool/)
  assert.match(artificer[27],/2 Tools/)
  assert.ok(!artificer[27].includes('Simple Weapons')) // Initial-only proficiencies belong in X.
  const count = events.length
  context.installOfficial2014()
  assert.equal(events.length, count)
})
test('official installer refuses an occupied reference area before backup or writes', () => {
  const { context, events } = installerMock(true)
  assert.throws(() => context.installOfficial2014(), /No free/)
  assert.deepEqual(events, [])
})

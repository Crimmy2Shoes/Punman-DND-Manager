import type { Workbook, Value, Edit } from './sheetModel'
import { cellValue } from './sheetModel.ts'
import { OFFICIAL_SUBCLASSES, canonicalSubclass } from './phbSubclassRules.ts'
export const SKILLS = [
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
export type Economy =
  'Action' | 'Bonus action' | 'Reaction' | 'Movement' | 'Passive' | 'Unclassified'
export type Ability = {
  id?: string
  name: string
  economy: Economy
  detail: string
  source: string
  className?: string
  subclass?: string
  level?: number
  page?: number
  cost?: string
  spellName?: string
  url?: string
}
export type RuleSettings = {
  enforce: boolean
  extraSkills: number
  extraExpertise: number
  skillLimit: number | null
  expertiseLimit: number | null
  toolExpertise: number
  reason: string
  abilities: Ability[]
  selections?: string[]
}
export const DEFAULT_RULES: RuleSettings = {
  enforce: true,
  extraSkills: 0,
  extraExpertise: 0,
  skillLimit: null,
  expertiseLimit: null,
  toolExpertise: 0,
  reason: '',
  abilities: [],
  selections: [],
}
export type Reader = (tab: string, address: string) => Value
export type ClassChoice = { name: string; level: number; subclass: string }
const text = (v: unknown) => String(v ?? '')
const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
export function characterClasses(book: Workbook, read: Reader): ClassChoice[] {
  const source = book.sheets.find((s) => s.title === 'Class Info')
  const rows = Object.entries(source?.cells ?? {}).filter(
    ([a, c]) => /^B\d+$/.test(a) && Number(a.slice(1)) >= 7 && c.value,
  )
  const names = [
    ...new Set([
      ...rows.map(([, c]) => text(c.value)),
      ...Object.keys(OFFICIAL_SUBCLASSES),
      'Pugilist',
    ]),
  ].sort((a, b) => b.length - a.length)
  const description = text(read('v2.1', 'T5'))
  const found = names
    .flatMap((name) => {
      const match = new RegExp(`\\b${escape(name)}\\b`, 'i').exec(description)
      return match ? [{ name, index: match.index }] : []
    })
    .sort((a, b) => a.index - b.index)
  return found.map(({ name, index }, i) => {
    const part = description.slice(
      i ? found[i - 1].index + found[i - 1].name.length : 0,
      found[i + 1]?.index ?? description.length,
    )
    const levelMatch = new RegExp(`${escape(name)}\\s+(\\d+)`, 'i').exec(description.slice(index))
    const subclasses = [
      ...new Set([
        ...rows
          .filter(([, c]) => c.value === name)
          .map(([a]) => text(source?.cells['E' + a.slice(1)]?.value))
          .filter((s) => s && s !== '-'),
        ...(OFFICIAL_SUBCLASSES[name] ?? []).flatMap((s) => [
          s,
          s
            .replace(
              /^(Path of the |College of |Circle of the |Way of the |Way of |Oath of the |Oath of |School of |The )/,
              '',
            )
            .replace(/ Domain$/, ''),
        ]),
      ]),
    ].sort((a, b) => b.length - a.length)
    const subclass = subclasses.find((s) => part.toLowerCase().includes(s.toLowerCase())) ?? ''
    let level = levelMatch
      ? Number(levelMatch[1])
      : found.length === 1
        ? Number(read('v2.1', 'AL6'))
        : 0
    // Live calculation helpers take precedence when the class input has not been edited.
    if (read('v2.1', 'T5') === cellValue(book, 'v2.1', 'T5'))
      for (let r = 6; r <= 15; r++)
        if (read('v2.1', 'AR' + r) === name && typeof read('v2.1', 'AT' + r) === 'number')
          level = Number(read('v2.1', 'AT' + r))
    return {
      name,
      level: Number.isInteger(level) && level >= 1 && level <= 20 ? level : 0,
      subclass,
    }
  })
}
export type Grant = {
  source: string
  count: number
  allowed: string[]
  reference?: string
  url?: string
  condition?: string
}
const skillsIn = (s: string) => SKILLS.filter((n) => s.toLowerCase().includes(n.toLowerCase()))
const wordNumber = (s: string) =>
  Number(s) || ({ one: 1, two: 2, three: 3, four: 4 }[s.toLowerCase()] ?? 0)
export function skillBudget(book: Workbook, read: Reader, settings: RuleSettings) {
  const classes = characterClasses(book, read),
    grants: Grant[] = []
  const classInfo = book.sheets.find((s) => s.title === 'Class Info')
  let known = classes.length > 0 && classes.every((c) => c.level > 0)
  const fixed = (
    source: string,
    allowed: string[],
    reference?: string,
    url?: string,
    condition?: string,
  ) =>
    allowed.forEach((skill) =>
      grants.push({ source, count: 1, allowed: [skill], reference, url, condition }),
    )
  const choice = (
    source: string,
    count: number,
    allowed: string[],
    reference?: string,
    url?: string,
  ) => {
    if (count)
      grants.push({ source, count, allowed: allowed.length ? allowed : SKILLS, reference, url })
  }
  const trained = (skill: string) => {
    const rank = read('v2.1', 'H' + (25 + SKILLS.indexOf(skill)))
    return rank === 1 || rank === true || rank === '1' || text(rank).toLowerCase() === 'e'
  }
  classes.forEach((c, i) => {
    const rows = Object.entries(classInfo?.cells ?? {}).filter(
      ([a, v]) => /^B\d+$/.test(a) && v.value === c.name,
    )
    const base = rows.find(([a]) =>
      ['-', ''].includes(text(classInfo?.cells['E' + a.slice(1)]?.value)),
    )
    if (!base) {
      known = false
      return
    }
    const row = base[0].slice(1),
      q = text(classInfo?.cells['Q' + row]?.value),
      extra = text(classInfo?.cells['AB' + row]?.value)
    if (i === 0) {
      const count = /choose\s+(\d+)/i.exec(q)
      if (!count) known = false
      else choice(c.name, Number(count[1]), skillsIn(q), `Class Info!Q${row}`)
    }
    const additional = /(\d+)\s+skill/i.exec(extra)
    if (additional)
      choice(
        i ? `${c.name} · multiclass` : c.name,
        Number(additional[1]),
        skillsIn(q),
        `Class Info!AB${row}`,
      )
    const subRow = rows
      .find(([a]) => classInfo?.cells['E' + a.slice(1)]?.value === c.subclass)?.[0]
      .slice(1)
    if (subRow && c.name !== 'Pugilist') {
      const content =
        text(classInfo?.cells['Q' + subRow]?.value) +
        ', ' +
        text(classInfo?.cells['AB' + subRow]?.value)
      // Workbook subclass proficiencies may be conditional; only use explicit numeric skill grants.
      const number = /(?:choose\s+|)(\d+)\s*(?:skills?|,)/i.exec(content)
      const unlock =
        c.name === 'Cleric' || c.name === 'Sorcerer' || c.name === 'Warlock'
          ? 1
          : c.name === 'Druid' || c.name === 'Wizard'
            ? 2
            : 3
      if (c.level >= unlock && number)
        choice(
          c.subclass,
          Number(number[1]),
          skillsIn(content),
          `Class Info!Q${subRow} / AB${subRow}`,
        )
      if (
        c.name === 'Bard' &&
        ['Lore', 'College of Lore'].includes(c.subclass) &&
        c.level >= 3 &&
        !number
      )
        choice(
          c.subclass,
          3,
          SKILLS,
          'SRD 5.1 · Bonus Proficiencies',
          'https://media.wizards.com/2023/downloads/dnd/SRD_CC_v5.1.pdf#page=13',
        )
    }
    if (c.name === 'Pugilist' && c.level >= 3) {
      if (c.subclass === 'Bloodhound Bruisers')
        choice(
          c.subclass,
          2,
          ['Insight', 'Investigation', 'Perception'],
          'Pugilist reference · Detective Work',
          'https://www.worldanvil.com/block/205750',
        )
      if (c.subclass === 'Arena Royale')
        choice(
          c.subclass,
          1,
          trained('Performance') ? ['Performance', 'Intimidation', 'Persuasion'] : ['Performance'],
          'Pugilist reference · Bonus Proficiency',
          'https://www.worldanvil.com/block/205750',
        )
      if (c.subclass === 'Dog & Hound')
        choice(
          c.subclass,
          1,
          trained('Animal Handling')
            ? ['Animal Handling', 'Perception', 'Survival']
            : ['Animal Handling'],
          'Pugilist reference · Bonus Proficiency',
          'https://www.worldanvil.com/block/205750',
        )
    }
    const canonical = canonicalSubclass(c.name, c.subclass)
    const hasSubclassSkillCount =
      subRow &&
      /(?:choose\s+|)(\d+)\s*(?:skills?|,)/i.test(
        text(classInfo?.cells['Q' + subRow]?.value) +
          ', ' +
          text(classInfo?.cells['AB' + subRow]?.value),
      )
    if (
      c.name === 'Cleric' &&
      c.level >= 1 &&
      canonical === 'Knowledge Domain' &&
      !hasSubclassSkillCount
    )
      choice(
        'Knowledge Domain',
        2,
        ['Arcana', 'History', 'Nature', 'Religion'],
        'PHB 2014 · Blessings of Knowledge',
        'https://www.worldanvil.com/block/954411',
      )
    if (
      c.name === 'Cleric' &&
      c.level >= 1 &&
      canonical === 'Nature Domain' &&
      !hasSubclassSkillCount
    )
      choice(
        'Nature Domain',
        1,
        ['Animal Handling', 'Nature', 'Survival'],
        'PHB 2014 · Acolyte of Nature',
        'https://www.worldanvil.com/block/1204929',
      )
    const expansionSkills: Record<string, { level: number; allowed: string[]; fixed?: boolean }> = {
      'Arcana Domain': { level: 1, allowed: ['Arcana'], fixed: true },
      'Order Domain': { level: 1, allowed: ['Intimidation', 'Persuasion'] },
      'Peace Domain': { level: 1, allowed: ['Insight', 'Performance', 'Persuasion'] },
      'Arcane Archer': { level: 3, allowed: ['Arcana', 'Nature'] },
      'Way of Mercy': { level: 3, allowed: ['Insight', 'Medicine'], fixed: true },
      'Way of the Drunken Master': { level: 3, allowed: ['Performance'], fixed: true },
      Bladesinging: { level: 2, allowed: ['Performance'], fixed: true },
      'Fey Wanderer': { level: 3, allowed: ['Deception', 'Performance', 'Persuasion'] },
      Scout: { level: 3, allowed: ['Nature', 'Survival'], fixed: true },
      'Purple Dragon Knight': { level: 7, allowed: ['Persuasion'], fixed: true },
    }
    const grant = expansionSkills[canonical]
    if (grant && c.level >= grant.level && !hasSubclassSkillCount) {
      if (grant.fixed)
        fixed(
          canonical,
          grant.allowed,
          'Official 2014 feature summary',
          undefined,
          'No extra unrestricted skills if already proficient; use the feature’s replacement rule where specified.',
        )
      else choice(canonical, 1, grant.allowed, 'Official 2014 feature summary')
    }
    const training = settings.selections
      ?.find((id) => id.startsWith(`${c.name}:training:`))
      ?.slice(`${c.name}:training:`.length)
    if (
      training &&
      SKILLS.includes(training) &&
      c.level >= 3 &&
      ['Cavalier', 'Samurai', 'Phantom'].includes(canonical)
    )
      choice(canonical, 1, [training], 'Selected skill instead of language/tool')
    if (canonical === 'Purple Dragon Knight' && c.level >= 7) {
      const replacement = settings.selections
        ?.find((id) => id.startsWith('Fighter:royal-envoy:'))
        ?.slice('Fighter:royal-envoy:'.length)
      if (replacement && !hasSubclassSkillCount) {
        const i = grants.findIndex(
          (g) => g.source === canonical && g.allowed.length === 1 && g.allowed[0] === 'Persuasion',
        )
        if (i >= 0) grants.splice(i, 1)
        choice(
          canonical,
          1,
          [replacement],
          'Royal Envoy · only if already proficient in Persuasion before level 7',
        )
      }
    }
    if (
      c.name === 'Warlock' &&
      c.level >= 2 &&
      settings.selections?.includes('Warlock:invocation:Beguiling Influence')
    )
      fixed(
        'Beguiling Influence',
        ['Deception', 'Persuasion'],
        'SRD 5.1 · invocation',
        'https://media.wizards.com/2023/downloads/dnd/SRD_CC_v5.1.pdf#page=48',
      )
  })
  const race = text(read('v2.1', 'T7')),
    raceTab = book.sheets.find((s) => s.title === 'Race Info')
  const raceRow = Object.entries(raceTab?.cells ?? {})
    .find(([a, c]) => /^B\d+$/.test(a) && c.value === race)?.[0]
    .slice(1)
  if (race && !raceRow) known = false
  const raceText = text(raceTab?.cells['AJ' + raceRow]?.value)
  const racialChoice =
    /gain proficiency[^.]*?\b(one|two|three|four|\d+)\s+skills?[^.]*choice/i.exec(raceText)
  if (racialChoice)
    choice(race, wordNumber(racialChoice[1]), skillsIn(raceText), `Race Info!AJ${raceRow}`)
  else if (/gain proficiency/i.test(raceText))
    fixed(race, skillsIn(raceText), `Race Info!AJ${raceRow}`)
  const background = text(read('v2.1', 'AJ11')),
    main = book.sheets.find((s) => s.title === 'v2.1')
  const bgRow = Object.entries(main?.cells ?? {})
    .find(([a, c]) => /^AX\d+$/.test(a) && Number(a.slice(2)) >= 69 && c.value === background)?.[0]
    .slice(2)
  const bgSkills = skillsIn(text(main?.cells['AY' + bgRow]?.value))
  if (background && (!bgRow || !bgSkills.length)) known = false
  fixed(background, bgSkills, `v2.1!AY${bgRow}`)
  if (
    classes.some((c) => c.name === 'Pugilist' && c.subclass === 'Piss & Vinegar' && c.level >= 3) &&
    !grants.some((g) => g.allowed.length === 1 && g.allowed[0] === 'Intimidation')
  )
    fixed(
      'Piss & Vinegar',
      ['Intimidation'],
      'Pugilist reference · Bonus Proficiency',
      'https://www.worldanvil.com/block/205750',
      'Only if you were not already proficient in Intimidation when you gained this subclass. This feature does not grant a replacement skill.',
    )
  // Repeated fixed proficiency grants allow another skill (SRD 5.1 background rule).
  const seen = new Set<string>()
  for (const grant of grants)
    if (grant.allowed.length === 1) {
      if (seen.has(grant.allowed[0])) grant.allowed = [...SKILLS]
      else seen.add(grant.allowed[0])
    }
  const featureSkills = skillsIn(text(read('v2.1', 'AQ63')))
  const missingFeatureSkills = featureSkills.filter((s) => !seen.has(s))
  // Use live helpers as a count check, never assume blank cached formulas are zero.
  const helpersCurrent = ['T5', 'T7', 'AJ11', 'AE7'].every(
    (a) => read('v2.1', a) === cellValue(book, 'v2.1', a),
  )
  const sheetBase = helpersCurrent ? read('v2.1', 'AS16') : '',
    sheetCount = typeof sheetBase === 'number' ? sheetBase + bgSkills.length : null
  const sourceTotal = grants.reduce((n, g) => n + g.count, 0)
  // A manually recorded subclass skill feature may already be in our subclass grant.
  const extraFeatures =
    sheetCount === null ? missingFeatureSkills.length : Math.max(0, sheetCount - sourceTotal)
  if (extraFeatures)
    fixed('Sheet features', missingFeatureSkills.slice(0, extraFeatures), 'v2.1!AQ63')
  const derived = grants.reduce((n, g) => n + g.count, 0)
  if (sheetCount !== null && sheetCount > derived)
    choice('Additional sheet grants', sheetCount - derived, SKILLS, 'v2.1!AS16')
  if (settings.extraSkills)
    choice('DM bonus', settings.extraSkills, SKILLS, 'Local Rules & overrides')
  // The current sheet's own total wins over reference-derived totals in either direction.
  const limit =
    settings.skillLimit ??
    (sheetCount !== null
      ? sheetCount + settings.extraSkills
      : grants.reduce((n, g) => n + g.count, 0))
  const limitSource =
    settings.skillLimit !== null
      ? 'DM override'
      : sheetCount !== null
        ? 'Spreadsheet'
        : 'Reference estimate'
  const selected = SKILLS.filter((_, i) => {
    const v = read('v2.1', 'H' + (25 + i))
    return v === 1 || v === true || v === '1' || text(v).toLowerCase() === 'e'
  })
  const expertise = SKILLS.filter(
    (_, i) => text(read('v2.1', 'H' + (25 + i))).toLowerCase() === 'e',
  )
  const fixedExpertise = classes.flatMap((c) => {
    const sub = canonicalSubclass(c.name, c.subclass)
    return sub === 'Scout' && c.level >= 3
      ? ['Nature', 'Survival']
      : sub === 'Purple Dragon Knight' && c.level >= 7
        ? ['Persuasion']
        : []
  })
  const baseExpertise =
    fixedExpertise.length +
    classes.reduce(
      (n, c) =>
        n +
        (c.name === 'Rogue'
          ? c.level >= 6
            ? 4
            : c.level >= 1
              ? 2
              : 0
          : c.name === 'Bard'
            ? c.level >= 10
              ? 4
              : c.level >= 3
                ? 2
                : 0
            : c.name === 'Cleric' &&
                c.level >= 1 &&
                canonicalSubclass(c.name, c.subclass) === 'Knowledge Domain'
              ? 2
              : 0),
      0,
    )
  const expertiseLimit = settings.expertiseLimit ?? baseExpertise + settings.extraExpertise
  const slots = grants.flatMap((g) => Array.from({ length: g.count }, () => g))
  const assigned = new Map<number, string>()
  const assign = (skill: string, visited: Set<number>): boolean => {
    for (let i = 0; i < slots.length; i++) {
      if (visited.has(i) || !slots[i].allowed.includes(skill)) continue
      visited.add(i)
      const old = assigned.get(i)
      if (!old || assign(old, visited)) {
        assigned.set(i, skill)
        return true
      }
    }
    return false
  }
  const unmatched = selected.filter((skill) => !assign(skill, new Set()))
  const knowledgeExpertise = classes.some(
    (c) =>
      c.name === 'Cleric' &&
      c.level >= 1 &&
      canonicalSubclass(c.name, c.subclass) === 'Knowledge Domain',
  )
    ? 2
    : 0
  const expertisePools = [
    ...Array.from(
      {
        length: Math.max(
          0,
          baseExpertise -
            knowledgeExpertise -
            fixedExpertise.length +
            settings.extraExpertise -
            settings.toolExpertise,
        ),
      },
      () => SKILLS,
    ),
    ...Array.from({ length: knowledgeExpertise }, () => [
      'Arcana',
      'History',
      'Nature',
      'Religion',
    ]),
    ...fixedExpertise.map((skill) => [skill]),
  ]
  const expertiseAssigned = new Map<number, string>()
  const fitExpertise = (name: string, seen: Set<number>): boolean => {
    for (let i = 0; i < expertisePools.length; i++) {
      if (seen.has(i) || !expertisePools[i].includes(name)) continue
      seen.add(i)
      const previous = expertiseAssigned.get(i)
      if (!previous || fitExpertise(previous, seen)) {
        expertiseAssigned.set(i, name)
        return true
      }
    }
    return false
  }
  const expertiseUnmatched = expertise.filter((name) => !fitExpertise(name, new Set()))
  return {
    classes,
    grants,
    known,
    selected,
    expertise,
    expertiseUnmatched,
    limit,
    limitSource,
    bgSkills,
    expertiseLimit,
    baseExpertise,
    fixedExpertise,
    sheetCount,
    derived,
    unmatched,
    assigned,
    slots,
    remaining: Math.max(0, limit - selected.length),
    expertiseRemaining: Math.max(0, expertiseLimit - expertise.length - settings.toolExpertise),
  }
}
export function validateSkillChange(
  book: Workbook,
  current: Reader,
  next: Reader,
  settings: RuleSettings,
  address: string,
) {
  if (!/^H(2[5-9]|3\d|4[0-2])$/.test(address)) return
  const previous = current('v2.1', address),
    candidate = next('v2.1', address)
  if (
    text(candidate).toLowerCase() === 'e' &&
    previous !== 1 &&
    previous !== '1' &&
    previous !== true &&
    text(previous).toLowerCase() !== 'e'
  )
    throw Error('Choose Proficient before Expertise. Expertise improves an existing proficiency.')
  if (!settings.enforce) return
  const before = skillBudget(book, current, settings),
    after = skillBudget(book, next, settings)
  if (
    (after.known || after.sheetCount !== null || settings.skillLimit !== null) &&
    after.selected.length > after.limit &&
    after.selected.length > before.selected.length
  )
    throw Error(
      `You have ${after.limit} skill proficiency slots. Add a DM bonus in Rules & overrides if you were granted another.`,
    )
  if (
    (after.known || settings.expertiseLimit !== null) &&
    after.expertise.length + settings.toolExpertise > after.expertiseLimit &&
    after.expertise.length > before.expertise.length
  )
    throw Error(
      `You have ${after.expertiseLimit} Expertise slots. Add a DM grant in Rules & overrides if needed.`,
    )
  if (
    after.known &&
    settings.skillLimit === null &&
    after.unmatched.length > before.unmatched.length
  )
    throw Error(
      'This skill cannot fit the available class, race, background or subclass grants. Add a DM bonus or an explicit skill limit override if approved.',
    )
  if (
    settings.expertiseLimit === null &&
    after.expertiseUnmatched.length > before.expertiseUnmatched.length
  )
    throw Error(
      'This Expertise does not fit its source. Knowledge Domain, Scout and Royal Envoy have restricted doubled proficiencies; use a DM override for another grant.',
    )
}
export function validateSkillDraft(book: Workbook, edits: Edit[], settings: RuleSettings) {
  const skills = edits.filter((e) => e.tab === 'v2.1' && /^H(2[5-9]|3\d|4[0-2])$/.test(e.address))
  if (!skills.length) return
  const raw: Reader = (s, a) => cellValue(book, s, a)
  const next: Reader = (s, a) =>
    edits.find((e) => e.tab === s && e.address === a)?.value ?? raw(s, a)
  const before = skillBudget(book, raw, settings),
    after = skillBudget(book, next, settings)
  if (!settings.enforce) return
  if (
    (after.known || after.sheetCount !== null || settings.skillLimit !== null) &&
    after.selected.length > after.limit &&
    after.selected.length > before.selected.length
  )
    throw Error(
      'Skill grants changed. Refresh, review your selections or update the DM override before saving.',
    )
  if (
    (after.known || settings.expertiseLimit !== null) &&
    after.expertise.length + settings.toolExpertise > after.expertiseLimit &&
    after.expertise.length > before.expertise.length
  )
    throw Error(
      'Your Expertise selections exceed the current grants. Review Rules & overrides before saving.',
    )
  if (
    after.known &&
    settings.skillLimit === null &&
    after.unmatched.length > before.unmatched.length
  )
    throw Error(
      'Skill choices no longer fit the current sheet grants. Refresh and review before saving.',
    )
  if (
    settings.expertiseLimit === null &&
    after.expertiseUnmatched.length > before.expertiseUnmatched.length
  )
    throw Error(
      'Expertise choices no longer fit their class sources. Review or use a DM override before saving.',
    )
}

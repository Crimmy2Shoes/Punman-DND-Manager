import { createCharacter, mod, maxHP, heal, proficiency, record, modifier } from './character.ts'
import type { Ability, Character, Resource, Spell } from './character.ts'
export interface ClassRule {
  die: 6 | 8 | 10 | 12
  saves: Ability[]
  primary: Ability[]
  skills: string[]
  skillCount: number
  casting: Ability
  gold: number
  training: string
  subclass: string
}
const allSkills = [
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
export const classes: Record<string, ClassRule> = {
  Barbarian: {
    die: 12,
    saves: ['Strength', 'Constitution'],
    primary: ['Strength'],
    skills: ['Animal Handling', 'Athletics', 'Intimidation', 'Nature', 'Perception', 'Survival'],
    skillCount: 2,
    casting: 'Wisdom',
    gold: 75,
    training: 'Simple and Martial weapons; Light and Medium armor; Shields',
    subclass: 'Path of the Berserker',
  },
  Bard: {
    die: 8,
    saves: ['Dexterity', 'Charisma'],
    primary: ['Charisma'],
    skills: allSkills,
    skillCount: 3,
    casting: 'Charisma',
    gold: 90,
    training: 'Simple weapons; Light armor; three musical instruments (choose)',
    subclass: 'College of Lore',
  },
  Cleric: {
    die: 8,
    saves: ['Wisdom', 'Charisma'],
    primary: ['Wisdom'],
    skills: ['History', 'Insight', 'Medicine', 'Persuasion', 'Religion'],
    skillCount: 2,
    casting: 'Wisdom',
    gold: 110,
    training: 'Simple weapons; Light and Medium armor; Shields',
    subclass: 'Life Domain',
  },
  Druid: {
    die: 8,
    saves: ['Intelligence', 'Wisdom'],
    primary: ['Wisdom'],
    skills: [
      'Animal Handling',
      'Arcana',
      'Insight',
      'Medicine',
      'Nature',
      'Perception',
      'Religion',
      'Survival',
    ],
    skillCount: 2,
    casting: 'Wisdom',
    gold: 50,
    training: 'Simple weapons; Light armor; Shields; Herbalism Kit',
    subclass: 'Circle of the Land',
  },
  Fighter: {
    die: 10,
    saves: ['Strength', 'Constitution'],
    primary: ['Strength'],
    skills: [
      'Acrobatics',
      'Animal Handling',
      'Athletics',
      'History',
      'Insight',
      'Intimidation',
      'Persuasion',
      'Perception',
      'Survival',
    ],
    skillCount: 2,
    casting: 'Intelligence',
    gold: 155,
    training: 'Simple and Martial weapons; all armor; Shields',
    subclass: 'Champion',
  },
  Monk: {
    die: 8,
    saves: ['Strength', 'Dexterity'],
    primary: ['Dexterity', 'Wisdom'],
    skills: ['Acrobatics', 'Athletics', 'History', 'Insight', 'Religion', 'Stealth'],
    skillCount: 2,
    casting: 'Wisdom',
    gold: 50,
    training:
      'Simple weapons; Light Martial weapons; one artisan tool or musical instrument (choose)',
    subclass: 'Warrior of the Open Hand',
  },
  Paladin: {
    die: 10,
    saves: ['Wisdom', 'Charisma'],
    primary: ['Strength', 'Charisma'],
    skills: ['Athletics', 'Insight', 'Intimidation', 'Medicine', 'Persuasion', 'Religion'],
    skillCount: 2,
    casting: 'Charisma',
    gold: 150,
    training: 'Simple and Martial weapons; all armor; Shields',
    subclass: 'Oath of Devotion',
  },
  Ranger: {
    die: 10,
    saves: ['Strength', 'Dexterity'],
    primary: ['Dexterity', 'Wisdom'],
    skills: [
      'Animal Handling',
      'Athletics',
      'Insight',
      'Investigation',
      'Nature',
      'Perception',
      'Stealth',
      'Survival',
    ],
    skillCount: 3,
    casting: 'Wisdom',
    gold: 150,
    training: 'Simple and Martial weapons; Light and Medium armor; Shields',
    subclass: 'Hunter',
  },
  Rogue: {
    die: 8,
    saves: ['Dexterity', 'Intelligence'],
    primary: ['Dexterity'],
    skills: [
      'Acrobatics',
      'Athletics',
      'Deception',
      'Insight',
      'Intimidation',
      'Investigation',
      'Perception',
      'Persuasion',
      'Sleight of Hand',
      'Stealth',
    ],
    skillCount: 4,
    casting: 'Intelligence',
    gold: 100,
    training: 'Simple weapons; Martial weapons with Finesse or Light; Light armor; Thieves’ Tools',
    subclass: 'Thief',
  },
  Sorcerer: {
    die: 6,
    saves: ['Constitution', 'Charisma'],
    primary: ['Charisma'],
    skills: ['Arcana', 'Deception', 'Insight', 'Intimidation', 'Persuasion', 'Religion'],
    skillCount: 2,
    casting: 'Charisma',
    gold: 50,
    training: 'Simple weapons',
    subclass: 'Draconic Sorcery',
  },
  Warlock: {
    die: 8,
    saves: ['Wisdom', 'Charisma'],
    primary: ['Charisma'],
    skills: [
      'Arcana',
      'Deception',
      'History',
      'Intimidation',
      'Investigation',
      'Nature',
      'Religion',
    ],
    skillCount: 2,
    casting: 'Charisma',
    gold: 100,
    training: 'Simple weapons; Light armor',
    subclass: 'Fiend Patron',
  },
  Wizard: {
    die: 6,
    saves: ['Intelligence', 'Wisdom'],
    primary: ['Intelligence'],
    skills: ['Arcana', 'History', 'Insight', 'Investigation', 'Medicine', 'Nature', 'Religion'],
    skillCount: 2,
    casting: 'Intelligence',
    gold: 55,
    training: 'Simple weapons',
    subclass: 'Evoker',
  },
}
export const backgrounds: Record<
  string,
  { abilities: Ability[]; skills: string[]; feat: string; tool: string }
> = {
  Acolyte: {
    abilities: ['Intelligence', 'Wisdom', 'Charisma'],
    skills: ['Insight', 'Religion'],
    feat: 'Magic Initiate (Cleric)',
    tool: 'Calligrapher’s Supplies',
  },
  Criminal: {
    abilities: ['Dexterity', 'Constitution', 'Intelligence'],
    skills: ['Sleight of Hand', 'Stealth'],
    feat: 'Alert',
    tool: 'Thieves’ Tools',
  },
  Sage: {
    abilities: ['Constitution', 'Intelligence', 'Wisdom'],
    skills: ['Arcana', 'History'],
    feat: 'Magic Initiate (Wizard)',
    tool: 'Calligrapher’s Supplies',
  },
  Soldier: {
    abilities: ['Strength', 'Dexterity', 'Constitution'],
    skills: ['Athletics', 'Intimidation'],
    feat: 'Savage Attacker',
    tool: 'Gaming Set (choose)',
  },
}
export const species: Record<string, { speed: number; size: 'Small' | 'Medium'; traits: string }> =
  {
    Dragonborn: {
      speed: 30,
      size: 'Medium',
      traits:
        'Choose Draconic Ancestry; Breath Weapon; Damage Resistance; Darkvision 60 ft.; Draconic Flight at level 5.',
    },
    Dwarf: {
      speed: 30,
      size: 'Medium',
      traits:
        'Darkvision 120 ft.; Dwarven Resilience; Dwarven Toughness (+1 HP per level); Stonecunning.',
    },
    Elf: {
      speed: 30,
      size: 'Medium',
      traits:
        'Choose Elven Lineage; Darkvision 60 ft.; Fey Ancestry; Keen Senses (choose Insight, Perception, or Survival); Trance.',
    },
    Gnome: {
      speed: 30,
      size: 'Small',
      traits: 'Choose Forest or Rock Gnome lineage; Darkvision 60 ft.; Gnomish Cunning.',
    },
    Goliath: {
      speed: 35,
      size: 'Medium',
      traits: 'Choose Giant Ancestry; Large Form at level 5; Powerful Build.',
    },
    Halfling: {
      speed: 30,
      size: 'Small',
      traits: 'Brave; Halfling Nimbleness; Luck; Naturally Stealthy.',
    },
    Human: {
      speed: 30,
      size: 'Medium',
      traits:
        'Resourceful; Skillful (choose one skill); Versatile (choose an Origin feat). May be Small.',
    },
    Orc: {
      speed: 30,
      size: 'Medium',
      traits: 'Adrenaline Rush; Darkvision 120 ft.; Relentless Endurance.',
    },
    Tiefling: {
      speed: 30,
      size: 'Medium',
      traits: 'Choose Fiendish Legacy; Darkvision 60 ft.; Otherworldly Presence. May be Small.',
    },
  }
export const xpThresholds = [
  0, 300, 900, 2700, 6500, 14000, 23000, 34000, 48000, 64000, 85000, 100000, 120000, 140000, 165000,
  195000, 225000, 265000, 305000, 355000,
]
const slotTable = [
  [],
  [2],
  [3],
  [4, 2],
  [4, 3],
  [4, 3, 2],
  [4, 3, 3],
  [4, 3, 3, 1],
  [4, 3, 3, 2],
  [4, 3, 3, 3, 1],
  [4, 3, 3, 3, 2],
  [4, 3, 3, 3, 2, 1],
  [4, 3, 3, 3, 2, 1],
  [4, 3, 3, 3, 2, 1, 1],
  [4, 3, 3, 3, 2, 1, 1],
  [4, 3, 3, 3, 2, 1, 1, 1],
  [4, 3, 3, 3, 2, 1, 1, 1],
  [4, 3, 3, 3, 2, 1, 1, 1, 1],
  [4, 3, 3, 3, 3, 1, 1, 1, 1],
  [4, 3, 3, 3, 3, 2, 1, 1, 1],
  [4, 3, 3, 3, 3, 2, 2, 1, 1],
]
export function slotTotals(classLevels: Character['classes']): number[] {
  const casters = classLevels.filter((c) =>
    ['Bard', 'Cleric', 'Druid', 'Sorcerer', 'Wizard', 'Paladin', 'Ranger'].includes(c.name),
  )
  let effective = casters.reduce(
    (sum, c) => sum + (['Paladin', 'Ranger'].includes(c.name) ? Math.ceil(c.level / 2) : c.level),
    0,
  )
  if (
    casters.length === 1 &&
    ['Paladin', 'Ranger'].includes(casters[0].name) &&
    casters[0].level === 1
  )
    return [2, 0, 0, 0, 0, 0, 0, 0, 0]
  effective = Math.min(20, effective)
  return Array.from({ length: 9 }, (_, i) => slotTable[effective]?.[i] ?? 0)
}
export function syncProgression(c: Character): Character {
  const totals = slotTotals(c.classes),
    warlock = c.classes.find((x) => x.name === 'Warlock')?.level ?? 0
  const pactTotal = warlock === 0 ? 0 : warlock === 1 ? 1 : warlock < 11 ? 2 : warlock < 17 ? 3 : 4
  const pactLevel = Math.max(1, Math.min(5, Math.ceil(warlock / 2)))
  const dice = c.classes.reduce((map, x) => {
    const die = classes[x.name]?.die ?? 8
    map.set(die, (map.get(die) ?? 0) + x.level)
    return map
  }, new Map<6 | 8 | 10 | 12, number>())
  return {
    ...c,
    slots: totals.map((total, i) => ({ total, spent: Math.min(total, c.slots[i].spent) })),
    pact: { level: pactLevel, total: pactTotal, spent: Math.min(pactTotal, c.pact.spent) },
    hitDice: [...dice].map(([die, total]) => ({
      die,
      total,
      spent: Math.min(total, c.hitDice.find((d) => d.die === die)?.spent ?? 0),
    })),
  }
}
export function multiclassAllowed(c: Character, name: string): boolean {
  const needed = [...c.classes.map((x) => x.name), name]
  return needed.every((n) =>
    n === 'Fighter'
      ? Math.max(c.scores.Strength, c.scores.Dexterity) >= 13
      : (classes[n]?.primary.every((a) => c.scores[a] >= 13) ?? false),
  )
}
export function levelUp(c: Character, name: string, hpRoll?: number): Character {
  if (c.level >= 20 || !classes[name])
    throw Error('Choose a supported class below character level 20.')
  if (!c.classes.some((x) => x.name === name) && c.classes.length && !multiclassAllowed(c, name))
    throw Error(
      'Multiclassing requires a score of 13 in the primary abilities of your existing and new classes (Fighter: Strength or Dexterity).',
    )
  const rule = classes[name],
    existing = c.classes.find((x) => x.name === name)
  const gain =
    Math.max(1, (hpRoll ?? rule.die / 2 + 1) + modifier(c.scores.Constitution)) +
    (c.species === 'Dwarf' ? 1 : 0)
  const nextClasses = existing
    ? c.classes.map((x) => (x.name === name ? { ...x, level: x.level + 1 } : x))
    : [...c.classes, { name, level: 1, subclass: '' }]
  const next = syncProgression({
    ...c,
    classes: nextClasses,
    level: c.level + 1,
    maxHp: c.maxHp + gain,
    hp: Math.min(maxHP(c) + gain, c.hp + gain),
  })
  next.hp = Math.min(maxHP(next), Math.max(0, c.hp + maxHP(next) - maxHP(c)))
  return record(
    next,
    `Reached level ${next.level}; ${name} ${existing ? existing.level + 1 : 1}; gained ${gain} maximum HP.`,
  )
}
export function completeRest(
  c: Character,
  kind: 'short' | 'long',
  removeExhaustion = true,
): Character {
  if (c.hp < 1 || c.dead)
    throw Error('A rest must start with at least 1 HP and a living character.')
  const resources = c.resources.map((r) => ({
    ...r,
    remaining:
      r.recharge === 'manual'
        ? r.remaining
        : kind === 'long' || r.recharge === 'short'
          ? r.total
          : r.recharge === 'short-one'
            ? Math.min(r.total, r.remaining + 1)
            : r.remaining,
  }))
  const next = {
    ...c,
    resources,
    pact: { ...c.pact, spent: 0 },
    lastRest: new Date().toISOString(),
  }
  if (kind === 'short')
    return record(next, 'Completed a short rest; eligible resources and Pact Magic restored.')
  return record(
    {
      ...next,
      hp: c.maxHp,
      hpReduction: 0,
      tempHp: 0,
      scoreReductions: Object.fromEntries(Object.keys(c.scores).map((a) => [a, 0])) as Record<
        Ability,
        number
      >,
      hitDice: c.hitDice.map((d) => ({ ...d, spent: 0 })),
      slots: c.slots.map((s) => ({ ...s, spent: 0 })),
      exhaustion: Math.max(0, c.exhaustion - (removeExhaustion ? 1 : 0)),
      inspiration: c.species === 'Human' || c.inspiration,
      successes: 0,
      failures: 0,
      stable: false,
    },
    'Completed a long rest; HP, hit dice, spell slots and eligible resources restored.',
  )
}
export function spendHitDie(c: Character, die: number, roll: number): Character {
  const pool = c.hitDice.find((d) => d.die === die)
  if (
    !pool ||
    pool.spent >= pool.total ||
    !Number.isInteger(roll) ||
    roll < 1 ||
    roll > die ||
    c.dead ||
    c.hp < 1
  )
    throw Error('Choose an available hit die and a valid roll during a short rest.')
  const amount = Math.max(1, roll + mod(c, 'Constitution'))
  return record(
    {
      ...heal(c, amount),
      hitDice: c.hitDice.map((d) => (d.die === die ? { ...d, spent: d.spent + 1 } : d)),
    },
    `Spent d${die}: rolled ${roll}, restored up to ${amount} HP.`,
  )
}
export function deathSave(c: Character, roll: number): Character {
  if (c.hp > 0 || c.stable || c.dead)
    throw Error('Death saves require a living, unstable character at 0 HP.')
  if (roll === 20) return record(heal(c, 1), 'Death save: natural 20; regained 1 HP.')
  const success = roll !== 1 && roll - c.exhaustion * 2 + c.bonuses.death >= 10
  const successes = Math.min(3, c.successes + (success ? 1 : 0)),
    failures = Math.min(3, c.failures + (success ? 0 : roll === 1 ? 2 : 1))
  const stable = successes === 3,
    dead = failures === 3
  return record(
    { ...c, successes: stable ? 0 : successes, failures: stable ? 0 : failures, stable, dead },
    `Death save: ${roll}; ${dead ? 'dead' : stable ? 'stable' : success ? 'success' : 'failure'}.`,
  )
}
export function castSpell(
  c: Character,
  spell: Spell,
  source: 'slot' | 'pact' | 'ritual' | 'free',
  slotLevel: number,
): Character {
  if (
    c.dead ||
    c.conditions.some((x) =>
      ['Incapacitated', 'Paralyzed', 'Petrified', 'Stunned', 'Unconscious'].includes(x),
    )
  )
    throw Error('This character is unable to cast while incapacitated.')
  if (source === 'ritual' && !spell.ritual) throw Error('This spell cannot be cast as a ritual.')
  let next = c
  if (spell.level > 0 && source === 'slot') {
    const slot = c.slots[slotLevel - 1]
    if (slotLevel < spell.level || !slot || slot.spent >= slot.total)
      throw Error('No suitable spell slot is available.')
    next = {
      ...c,
      slots: c.slots.map((s, i) => (i === slotLevel - 1 ? { ...s, spent: s.spent + 1 } : s)),
    }
  }
  if (spell.level > 0 && source === 'pact') {
    if (c.pact.level < spell.level || c.pact.spent >= c.pact.total)
      throw Error('No suitable Pact Magic slot is available.')
    next = { ...c, pact: { ...c.pact, spent: c.pact.spent + 1 } }
  }
  return record(
    { ...next, concentration: spell.concentration ? spell.name : c.concentration },
    `Cast ${spell.name}${spell.level === 0 ? ' (cantrip)' : source === 'slot' ? ` using a level ${slotLevel} slot` : ` (${source})`}.`,
  )
}
export function rollDie(sides: number): number {
  const limit = Math.floor(0x100000000 / sides) * sides
  let value
  do {
    value = crypto.getRandomValues(new Uint32Array(1))[0]
  } while (value >= limit)
  return (value % sides) + 1
}
export function rollDice(expression: string): { total: number; rolls: number[]; bonus: number } {
  const match = expression.trim().match(/^(\d{1,2})d(\d{1,3})(?:\s*([+-])\s*(\d{1,3}))?$/i)
  if (!match) throw Error('Use a dice expression such as 2d6 + 3.')
  const count = Number(match[1]),
    sides = Number(match[2])
  if (count < 1 || count > 50 || sides < 2 || sides > 100)
    throw Error('Choose 1–50 dice with 2–100 sides.')
  const bonus = Number(match[4] ?? 0) * (match[3] === '-' ? -1 : 1)
  const rolls = Array.from({ length: count }, () => rollDie(sides))
  return { total: rolls.reduce((a, b) => a + b, bonus), rolls, bonus }
}
export function suggestedResources(c: Character): Resource[] {
  const result: Resource[] = []
  const add = (name: string, total: number, recharge: Resource['recharge'], notes = '') => {
    const old = c.resources.find((r) => r.id === `class:${name}`)
    result.push({
      id: `class:${name}`,
      name,
      total,
      remaining: old ? Math.max(0, total - (old.total - old.remaining)) : total,
      recharge,
      notes,
    })
  }
  for (const { name, level: l } of c.classes) {
    if (name === 'Barbarian')
      add(
        'Rage',
        l < 3 ? 2 : l < 6 ? 3 : l < 12 ? 4 : l < 17 ? 5 : 6,
        'short-one',
        'Regain one use on a short rest, all on a long rest.',
      )
    if (name === 'Bard')
      add('Bardic Inspiration', Math.max(1, mod(c, 'Charisma')), l >= 5 ? 'short' : 'long')
    if (name === 'Cleric' && l >= 2)
      add('Channel Divinity', l < 6 ? 2 : l < 18 ? 3 : 4, 'short-one')
    if (name === 'Druid' && l >= 2) add('Wild Shape', l < 6 ? 2 : l < 17 ? 3 : 4, 'short-one')
    if (name === 'Fighter') {
      add('Second Wind', l < 4 ? 2 : l < 10 ? 3 : 4, 'short-one')
      if (l >= 2) add('Action Surge', l >= 17 ? 2 : 1, 'short')
      if (l >= 9) add('Indomitable', l < 13 ? 1 : l < 17 ? 2 : 3, 'long')
    }
    if (name === 'Monk' && l >= 2) add('Focus Points', l, 'short')
    if (name === 'Paladin') {
      add('Lay On Hands', l * 5, 'long')
      if (l >= 3) add('Channel Divinity', 2, 'short-one')
    }
    if (name === 'Ranger')
      add('Hunter’s Mark (free casts)', l < 5 ? 2 : l < 9 ? 3 : l < 13 ? 4 : l < 17 ? 5 : 6, 'long')
    if (name === 'Sorcerer') {
      add('Innate Sorcery', 2, 'long')
      if (l >= 2)
        add(
          'Sorcery Points',
          l,
          'long',
          'Sorcerous Restoration at level 5 requires manual recovery.',
        )
    }
  }
  if (c.species === 'Dragonborn') add('Breath Weapon', proficiency(c.level), 'long')
  if (c.species === 'Dwarf') add('Stonecunning', proficiency(c.level), 'long')
  if (c.species === 'Orc') {
    add('Adrenaline Rush', proficiency(c.level), 'short')
    add('Relentless Endurance', 1, 'long')
  }
  return [...c.resources.filter((r) => !r.id.startsWith('class:')), ...result]
}
export function buildCharacter(options: {
  name: string
  className: string
  background: string
  species: string
  scores: Character['scores']
  chosenSkills: string[]
  languages: string
}): Character {
  const c = createCharacter(),
    rule = classes[options.className],
    bg = backgrounds[options.background],
    ancestry = species[options.species]
  if (!rule || !bg || !ancestry) throw Error('Choose supported origins and class.')
  const hp =
    Math.max(1, rule.die + Math.floor((options.scores.Constitution - 10) / 2)) +
    (options.species === 'Dwarf' ? 1 : 0)
  let next = syncProgression({
    ...c,
    ...options,
    classes: [{ name: options.className, level: 1, subclass: '' }],
    saves: rule.saves,
    level: 1,
    casting: rule.casting,
    skills: Object.fromEntries([...bg.skills, ...options.chosenSkills].map((s) => [s, 1])),
    hp,
    maxHp: hp,
    speed: ancestry.speed,
    size: ancestry.size,
    ac: 10 + Math.floor((options.scores.Dexterity - 10) / 2),
    training: `${rule.training}; ${bg.tool}`,
    wallet: { cp: 0, sp: 0, ep: 0, gp: rule.gold + 50, pp: 0 },
    features: `Origin feat: ${bg.feat}\nSpecies: ${ancestry.traits}\nStarting equipment: gold option chosen; purchase equipment in Inventory.`,
    bonuses: { ...c.bonuses, initiative: bg.feat === 'Alert' ? 2 : 0 },
  })
  if (options.species === 'Human') next.inspiration = true
  next.resources = suggestedResources(next)
  return record(next, 'Created a level 1 character using SRD origins and starting gold.')
}

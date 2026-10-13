import { z } from 'zod'
export const abilities = [
  'Strength',
  'Dexterity',
  'Constitution',
  'Intelligence',
  'Wisdom',
  'Charisma',
] as const
export type Ability = (typeof abilities)[number]
export const skills: [string, Ability][] = [
  ['Acrobatics', 'Dexterity'],
  ['Animal Handling', 'Wisdom'],
  ['Arcana', 'Intelligence'],
  ['Athletics', 'Strength'],
  ['Deception', 'Charisma'],
  ['History', 'Intelligence'],
  ['Insight', 'Wisdom'],
  ['Intimidation', 'Charisma'],
  ['Investigation', 'Intelligence'],
  ['Medicine', 'Wisdom'],
  ['Nature', 'Intelligence'],
  ['Perception', 'Wisdom'],
  ['Performance', 'Charisma'],
  ['Persuasion', 'Charisma'],
  ['Religion', 'Intelligence'],
  ['Sleight of Hand', 'Dexterity'],
  ['Stealth', 'Dexterity'],
  ['Survival', 'Wisdom'],
]
export const conditions = [
  'Blinded',
  'Charmed',
  'Deafened',
  'Frightened',
  'Grappled',
  'Incapacitated',
  'Invisible',
  'Paralyzed',
  'Petrified',
  'Poisoned',
  'Prone',
  'Restrained',
  'Stunned',
  'Unconscious',
]
const text = z.string().max(100000)
const integer = (min = 0, max = 999999) => z.number().int().min(min).max(max)
const ability = z.enum(abilities)
const scores = z.object(
  Object.fromEntries(abilities.map((a) => [a, integer(1, 30)])) as Record<Ability, z.ZodNumber>,
)
const zeroScores = () => Object.fromEntries(abilities.map((a) => [a, 0])) as Record<Ability, number>
const slotSchema = z
  .object({ total: integer(0, 20), spent: integer(0, 20) })
  .refine((s) => s.spent <= s.total)
export const attackSchema = z.object({
  id: text,
  name: text,
  ability,
  proficient: z.boolean(),
  bonus: integer(-30, 30),
  dice: text,
  damageBonus: integer(-99, 99),
  addAbility: z.boolean(),
  type: text,
  mastery: text,
  notes: text,
})
export const resourceSchema = z
  .object({
    id: text,
    name: text,
    total: integer(0, 999),
    remaining: integer(0, 999),
    recharge: z.enum(['short', 'short-one', 'long', 'manual']),
    notes: text,
  })
  .refine((r) => r.remaining <= r.total)
export const itemSchema = z.object({
  id: text,
  name: text,
  quantity: integer(0, 99999),
  weight: z.number().min(0).max(999999),
  equipped: z.boolean(),
  attuned: z.boolean(),
  requiresAttunement: z.boolean(),
  notes: text,
})
export const spellSchema = z.object({
  id: text,
  name: text,
  level: integer(0, 9),
  school: text,
  castingTime: text,
  range: text,
  duration: text,
  components: text,
  materials: text,
  ritual: z.boolean(),
  concentration: z.boolean(),
  prepared: z.boolean(),
  description: text,
  classes: z.array(text).max(20),
  source: text,
})
export type Attack = z.infer<typeof attackSchema>
export type Resource = z.infer<typeof resourceSchema>
export type Item = z.infer<typeof itemSchema>
export type Spell = z.infer<typeof spellSchema>
const characterSchema = z
  .object({
    id: text.min(1),
    name: text,
    species: text,
    background: text,
    className: text,
    subclass: text,
    level: integer(1, 20),
    scores,
    skills: z.record(z.string(), integer(0, 2)),
    saves: z.array(ability).max(6),
    hp: integer(),
    maxHp: integer(1),
    tempHp: integer(),
    ac: integer(0, 99),
    shieldEquipped: z.boolean().default(false),
    armorChoice: z
      .enum([
        'Unarmored',
        'Barbarian unarmored',
        'Monk unarmored',
        'Padded',
        'Leather',
        'Studded leather',
        'Hide',
        'Chain shirt',
        'Scale mail',
        'Breastplate',
        'Half plate',
        'Ring mail',
        'Chain mail',
        'Splint',
        'Plate',
      ])
      .default('Unarmored'),
    speed: integer(0, 999),
    inspiration: z.boolean(),
    conditions: z.array(z.enum(conditions as [string, ...string[]])).max(14),
    successes: integer(0, 3),
    failures: integer(0, 3),
    attacks: text,
    features: text,
    inventory: text,
    notes: text,
    languages: text,
    training: text,
    attunement: text,
    coins: z.number().min(0).max(999999999),
    casting: ability,
    slots: z.array(slotSchema).length(9),
    spells: text,
    concentration: text,
    xp: integer(0, 9999999).default(0),
    size: z.enum(['Tiny', 'Small', 'Medium', 'Large', 'Huge', 'Gargantuan']).default('Medium'),
    alignment: text.default(''),
    appearance: text.default(''),
    exhaustion: integer(0, 6).default(0),
    stable: z.boolean().default(false),
    dead: z.boolean().default(false),
    hpReduction: integer().default(0),
    scoreReductions: z
      .object(
        Object.fromEntries(abilities.map((a) => [a, integer(0, 29)])) as Record<
          Ability,
          z.ZodNumber
        >,
      )
      .default(zeroScores),
    bonuses: z
      .object({
        initiative: integer(-99, 99),
        perception: integer(-99, 99),
        spellAttack: integer(-99, 99),
        spellDC: integer(-99, 99),
        death: integer(-99, 99).default(0),
        skills: z.record(z.string(), integer(-99, 99)),
        saves: z.record(ability, integer(-99, 99)),
      })
      .default(() => ({
        initiative: 0,
        perception: 0,
        spellAttack: 0,
        spellDC: 0,
        death: 0,
        skills: {},
        saves: zeroScores(),
      })),
    classes: z
      .array(z.object({ name: text, level: integer(1, 20), subclass: text }))
      .max(20)
      .default([]),
    hitDice: z
      .array(
        z
          .object({
            die: z.union([z.literal(6), z.literal(8), z.literal(10), z.literal(12)]),
            total: integer(0, 20),
            spent: integer(0, 20),
          })
          .refine((d) => d.spent <= d.total),
      )
      .max(4)
      .default([]),
    pact: z
      .object({ level: integer(1, 5), total: integer(0, 4), spent: integer(0, 4) })
      .refine((p) => p.spent <= p.total)
      .default({ level: 1, total: 0, spent: 0 }),
    resources: z.array(resourceSchema).max(200).default([]),
    attackEntries: z.array(attackSchema).max(200).default([]),
    items: z.array(itemSchema).max(500).default([]),
    spellEntries: z.array(spellSchema).max(500).default([]),
    wallet: z
      .object({ cp: integer(), sp: integer(), ep: integer(), gp: integer(), pp: integer() })
      .optional(),
    campaign: text.default(''),
    lastRest: text.default(''),
    activity: z.array(text).max(50).default([]),
  })
  .refine(
    (c) =>
      c.hp <=
      Math.max(
        1,
        c.maxHp -
          c.hpReduction -
          (Math.floor((c.scores.Constitution - 10) / 2) -
            Math.floor(
              (Math.max(1, c.scores.Constitution - c.scoreReductions.Constitution) - 10) / 2,
            )) *
            c.level,
      ),
  )
  .refine(
    (c) =>
      !c.classes.length ||
      (c.classes.reduce((sum, x) => sum + x.level, 0) === c.level &&
        new Set(c.classes.map((x) => x.name)).size === c.classes.length),
  )
  .refine((c) =>
    [c.attackEntries, c.resources, c.items, c.spellEntries].every(
      (list) => new Set(list.map((x) => x.id)).size === list.length,
    ),
  )
export type Character = Omit<z.infer<typeof characterSchema>, 'wallet'> & {
  wallet: { cp: number; sp: number; ep: number; gp: number; pp: number }
}
const listSchema = z
  .array(characterSchema)
  .min(1)
  .max(100)
  .refine((list) => new Set(list.map((c) => c.id)).size === list.length)
const dieFor = (name: string) =>
  name === 'Barbarian'
    ? 12
    : ['Fighter', 'Paladin', 'Ranger'].includes(name)
      ? 10
      : ['Sorcerer', 'Wizard'].includes(name)
        ? 6
        : 8
export function parseCharacters(value: unknown): Character[] | null {
  const result = listSchema.safeParse(value)
  if (!result.success) return null
  return result.data.map((c) => ({
    ...c,
    wallet: c.wallet ?? { cp: 0, sp: 0, ep: 0, gp: Math.floor(c.coins), pp: 0 },
    classes: c.classes.length
      ? c.classes
      : c.className
        ? [{ name: c.className, level: c.level, subclass: c.subclass }]
        : [],
    hitDice: c.hitDice.length
      ? c.hitDice
      : [{ die: dieFor(c.className), total: c.level, spent: 0 }],
  }))
}
export const validCharacters = (v: unknown): v is Character[] => parseCharacters(v) !== null
export const modifier = (score: number) => Math.floor((score - 10) / 2)
export const proficiency = (level: number) => 2 + Math.floor((level - 1) / 4)
export const signed = (n: number) => (n >= 0 ? `+${n}` : `${n}`)
export const mod = (c: Character, a: Ability) =>
  modifier(Math.max(1, c.scores[a] - c.scoreReductions[a]))
export const maxHP = (c: Character) =>
  Math.max(
    1,
    c.maxHp - c.hpReduction - (modifier(c.scores.Constitution) - mod(c, 'Constitution')) * c.level,
  )
export const skillBonus = (c: Character, name: string, a: Ability) =>
  mod(c, a) +
  (c.skills[name] ?? 0) * proficiency(c.level) +
  (c.bonuses.skills[name] ?? 0) -
  c.exhaustion * 2
export const saveBonus = (c: Character, a: Ability) =>
  mod(c, a) +
  (c.saves.includes(a) ? proficiency(c.level) : 0) +
  (c.bonuses.saves[a] ?? 0) -
  c.exhaustion * 2
export function createCharacter(demo = false): Character {
  const c = {
    id: crypto.randomUUID(),
    name: demo ? 'Aelric Thornwood' : 'New adventurer',
    species: demo ? 'Wood Elf' : '',
    background: demo ? 'Guide' : '',
    className: demo ? 'Ranger' : '',
    subclass: demo ? 'Hunter' : '',
    level: demo ? 3 : 1,
    scores: {
      Strength: 10,
      Dexterity: demo ? 16 : 10,
      Constitution: demo ? 14 : 10,
      Intelligence: 10,
      Wisdom: demo ? 15 : 10,
      Charisma: 10,
    },
    skills: demo ? { Stealth: 1, Perception: 1, Survival: 1, Nature: 1 } : {},
    saves: demo ? ['Strength', 'Dexterity'] : [],
    hp: demo ? 24 : 10,
    maxHp: demo ? 28 : 10,
    tempHp: 0,
    ac: demo ? 15 : 10,
    speed: demo ? 35 : 30,
    inspiration: false,
    conditions: [],
    successes: 0,
    failures: 0,
    attacks: '',
    features: '',
    inventory: '',
    notes: '',
    languages: demo ? 'Common, Elvish' : '',
    training: '',
    attunement: '',
    coins: 0,
    casting: 'Wisdom',
    slots: Array.from({ length: 9 }, (_, i) => ({ total: demo && i === 0 ? 3 : 0, spent: 0 })),
    spells: '',
    concentration: '',
  }
  const parsed = parseCharacters([c])![0]
  if (demo) {
    parsed.attackEntries = [
      {
        id: crypto.randomUUID(),
        name: 'Longbow',
        ability: 'Dexterity',
        proficient: true,
        bonus: 0,
        dice: '1d8',
        damageBonus: 0,
        addAbility: true,
        type: 'Piercing',
        mastery: 'Slow',
        notes: 'Range 150 / 600 ft.',
      },
    ]
    parsed.items = [
      {
        id: crypto.randomUUID(),
        name: 'Arrows',
        quantity: 20,
        weight: 0.05,
        equipped: true,
        attuned: false,
        requiresAttunement: false,
        notes: '',
      },
    ]
  }
  return parsed
}
export function record(c: Character, message: string): Character {
  return {
    ...c,
    activity: [`${new Date().toLocaleString()} · ${message}`, ...c.activity].slice(0, 50),
  }
}
export function damage(c: Character, amount: number): Character {
  amount = Math.max(0, Math.trunc(amount))
  const absorbed = Math.min(c.tempHp, amount)
  const loss = amount - absorbed
  const hp = Math.max(0, c.hp - loss)
  return {
    ...c,
    tempHp: c.tempHp - absorbed,
    hp,
    stable: loss > 0 && hp === 0 ? false : c.stable,
    concentration: hp === 0 ? '' : c.concentration,
    failures: c.hp === 0 && loss > 0 ? Math.min(3, c.failures + 1) : c.failures,
    dead:
      c.dead ||
      (c.hp === 0 && loss > 0 && c.failures >= 2) ||
      (loss > 0 && loss - c.hp >= maxHP(c)),
  }
}
export function heal(c: Character, amount: number): Character {
  if (c.dead) return c
  const hp = Math.min(maxHP(c), c.hp + Math.max(0, Math.trunc(amount)))
  return {
    ...c,
    hp,
    successes: hp > 0 ? 0 : c.successes,
    failures: hp > 0 ? 0 : c.failures,
    stable: hp > 0 ? false : c.stable,
  }
}
export const newAttack = (): Attack => ({
  id: crypto.randomUUID(),
  name: 'New attack',
  ability: 'Strength',
  proficient: true,
  bonus: 0,
  dice: '1d6',
  damageBonus: 0,
  addAbility: true,
  type: 'Slashing',
  mastery: '',
  notes: '',
})
export const newResource = (): Resource => ({
  id: crypto.randomUUID(),
  name: 'New resource',
  total: 1,
  remaining: 1,
  recharge: 'long',
  notes: '',
})
export const newItem = (): Item => ({
  id: crypto.randomUUID(),
  name: 'New item',
  quantity: 1,
  weight: 0,
  equipped: false,
  attuned: false,
  requiresAttunement: false,
  notes: '',
})
export const newSpell = (): Spell => ({
  id: crypto.randomUUID(),
  name: 'New spell',
  level: 0,
  school: '',
  castingTime: 'Action',
  range: '',
  duration: '',
  components: '',
  materials: '',
  ritual: false,
  concentration: false,
  prepared: true,
  description: '',
  classes: [],
  source: 'Custom',
})

import data from './data/legacy-spells.json' with { type: 'json' }
import type { Economy, Reader, ClassChoice } from './companionRules'
import { characterClasses } from './companionRules.ts'
import type { Workbook } from './sheetModel'
import { PHB_ADDITIONAL_SPELLS } from './phbSpells.ts'
import { EXPANSION_SPELL_DEFINITIONS } from './expansionSpellDefinitions.ts'
import { canonicalSubclass } from './phbSubclassRules.ts'
import { ARTIFICER_CORE_SPELLS } from './expansionSpells.ts'
import { subclassSpellGrants } from './subclassSpells.ts'
import type { RuleSettings } from './companionRules'
export type SpellDefinition = (typeof data)[number] & { url?: string }
export const CORE_SPELLS_2014: SpellDefinition[] = [...data, ...PHB_ADDITIONAL_SPELLS]
export const SPELLS_2014: SpellDefinition[] = [
  ...CORE_SPELLS_2014,
  ...EXPANSION_SPELL_DEFINITIONS,
].sort((a, b) => a.name.localeCompare(b.name))
const normalize = (name: string) =>
  name.toLowerCase().replace(/[‘’']/g, '').replace(/\s+/g, ' ').trim()
const aliases: Record<string, string> = {
  'Melf’s Acid Arrow': 'Acid Arrow',
  'Bigby’s Hand': 'Arcane Hand',
  'Evard’s Black Tentacles': 'Black Tentacles',
  'Tenser’s Floating Disk': 'Floating Disk',
  'Tasha’s Hideous Laughter': 'Hideous Laughter',
  'Drawmij’s Instant Summons': 'Instant Summons',
  'Leomund’s Tiny Hut': 'Tiny Hut',
  'Leomund’s Secret Chest': 'Secret Chest',
  'Mordenkainen’s Faithful Hound': 'Faithful Hound',
  'Mordenkainen’s Magnificent Mansion': 'Magnificent Mansion',
  'Mordenkainen’s Private Sanctum': 'Private Sanctum',
  'Mordenkainen’s Sword': 'Arcane Sword',
  'Nystul’s Magic Aura': 'Arcanist’s Magic Aura',
  'Otiluke’s Freezing Sphere': 'Freezing Sphere',
  'Otiluke’s Resilient Sphere': 'Resilient Sphere',
  'Otto’s Irresistible Dance': 'Irresistible Dance',
  'Rary’s Telepathic Bond': 'Telepathic Bond',
}
const byName = new Map(SPELLS_2014.map((s) => [normalize(s.name), s]))
for (const [alias, name] of Object.entries(aliases)) {
  const spell = byName.get(normalize(name))
  if (spell) byName.set(normalize(alias), spell)
}
export const findSpell = (name: string): SpellDefinition | undefined => byName.get(normalize(name))
export function spellEconomy(castingTime: string): Economy {
  if (/^1 bonus action/i.test(castingTime)) return 'Bonus action'
  if (/^1 reaction/i.test(castingTime)) return 'Reaction'
  if (/^1 action/i.test(castingTime)) return 'Action'
  return 'Unclassified'
}
export const spellRows = [
  [96, 98],
  [100, 104],
  [106, 110],
  [112, 116],
  [118, 121],
  [123, 126],
  [128, 131],
  [133, 135],
  [137, 139],
  [141, 143],
].flatMap(([start, end], level) =>
  Array.from({ length: end - start + 1 }, (_, i) => start + i).flatMap((row) =>
    (level % 2 === 1 ? ['D', 'N', 'X'] : ['N', 'X', 'AH']).map((col) => ({
      level,
      name: col + row,
      marker: ({ D: 'C', N: 'M', X: 'W', AH: 'AG' } as Record<string, string>)[col] + row,
    })),
  ),
)
export function listedSpells(read: Reader) {
  return spellRows.flatMap((entry) => {
    const name = String(read('v2.1', entry.name)).trim()
    return name
      ? [
          {
            ...entry,
            text: name,
            definition: findSpell(name),
            prepared: ![0, '0', '', false].includes(read('v2.1', entry.marker)),
          },
        ]
      : []
  })
}
function accessForClass(spell: SpellDefinition, c: ClassChoice): string | null {
  if (c.level < 1) return null
  c = { ...c, subclass: canonicalSubclass(c.name, c.subclass) }
  if (
    c.name === 'Artificer' &&
    spell.level <= Math.min(5, Math.ceil(c.level / 4)) &&
    (spell.classes.includes('Artificer') ||
      [...ARTIFICER_CORE_SPELLS].some((name) => findSpell(name)?.name === spell.name))
  )
    return `Artificer ${c.level}`
  if (
    c.name === 'Sorcerer' &&
    c.subclass === 'Divine Soul' &&
    spell.classes.includes('Cleric') &&
    spell.level <= Math.min(9, Math.ceil(c.level / 2))
  )
    return 'Divine Magic · chosen Sorcerer spell'
  if (
    c.name === 'Cleric' &&
    c.subclass === 'Arcana Domain' &&
    spell.level === 0 &&
    spell.classes.includes('Wizard')
  )
    return 'Arcane Initiate · two chosen cantrips'
  if (
    c.name === 'Cleric' &&
    c.subclass === 'Death Domain' &&
    spell.level === 0 &&
    spell.school.toLowerCase() === 'necromancy'
  )
    return 'Reaper · one chosen cantrip'
  if (
    c.name === 'Cleric' &&
    c.subclass === 'Arcana Domain' &&
    c.level >= 17 &&
    spell.level >= 6 &&
    spell.classes.includes('Wizard')
  )
    return 'Arcane Mastery · one chosen spell at each level 6–9'
  const full = ['Bard', 'Cleric', 'Druid', 'Sorcerer', 'Wizard']
  if (
    full.includes(c.name) &&
    spell.classes.includes(c.name) &&
    spell.level <= Math.min(9, Math.ceil(c.level / 2))
  )
    return `${c.name} ${c.level}`
  if (
    c.name === 'Bard' &&
    (c.level >= 10 || (c.subclass === 'College of Lore' && c.level >= 6)) &&
    spell.level <= Math.min(9, Math.ceil(c.level / 2))
  )
    return 'Magical Secrets · limited learned choice'
  if (
    c.name === 'Cleric' &&
    c.subclass === 'Nature Domain' &&
    spell.level === 0 &&
    spell.classes.includes('Druid')
  )
    return 'Acolyte of Nature · one chosen cantrip'
  if (
    ['Paladin', 'Ranger'].includes(c.name) &&
    c.level >= 2 &&
    spell.classes.includes(c.name) &&
    spell.level > 0 &&
    spell.level <= Math.min(5, Math.ceil(c.level / 4))
  )
    return `${c.name} ${c.level}`
  if (
    c.name === 'Warlock' &&
    spell.classes.includes('Warlock') &&
    spell.level <= Math.min(5, Math.ceil(c.level / 2))
  )
    return `Warlock ${c.level}`
  if (
    c.name === 'Warlock' &&
    spell.classes.includes('Warlock') &&
    spell.level >= 6 &&
    c.level >= 11 + (spell.level - 6) * 2
  )
    return 'Mystic Arcanum option'
  if (
    ((c.name === 'Rogue' && c.subclass === 'Arcane Trickster') ||
      (c.name === 'Fighter' && c.subclass === 'Eldritch Knight')) &&
    c.level >= 3 &&
    spell.classes.includes('Wizard')
  ) {
    const max = c.level >= 19 ? 4 : c.level >= 13 ? 3 : c.level >= 7 ? 2 : 1
    if (spell.level <= max)
      return `${c.subclass} · ${spell.level === 0 ? 'cantrip' : c.name === 'Rogue' ? (['enchantment', 'illusion'].includes(spell.school.toLowerCase()) ? 'preferred school' : 'limited unrestricted-school choice') : ['abjuration', 'evocation'].includes(spell.school.toLowerCase()) ? 'preferred school' : 'limited unrestricted-school choice'}`
  }
  if (
    c.name === 'Pugilist' &&
    c.subclass === 'Hand of Dread' &&
    c.level >= 3 &&
    ['Blade Ward', 'Eldritch Blast', 'Prestidigitation'].includes(spell.name)
  )
    return 'Hand of Dread · Black Magic'
  return null
}
export function spellAccess(
  book: Workbook,
  read: Reader,
  spell: SpellDefinition,
  settings?: RuleSettings,
): string[] {
  const access = characterClasses(book, read).flatMap((c) => {
    const access = accessForClass(spell, c),
      grant = subclassSpellGrants(c, settings).find((g) => findSpell(g.name)?.name === spell.name)
    return [...(access ? [access] : []), ...(grant ? [`${grant.source} · ${grant.mode}`] : [])]
  })
  if (
    spell.level === 0 &&
    String(read('v2.1', 'T7')) === 'High Elf' &&
    spell.classes.includes('Wizard')
  )
    access.push('High Elf · one chosen wizard cantrip')
  if (
    spell.level === 0 &&
    characterClasses(book, read).some((c) => c.name === 'Warlock' && c.level >= 3) &&
    settings?.selections?.includes('Warlock:pact:Pact of the Tome')
  )
    access.push('Pact of the Tome · three chosen cantrips')
  if (
    spell.ritual &&
    settings?.selections?.includes('Warlock:invocation:Book of Ancient Secrets')
  ) {
    const warlock = characterClasses(book, read).find((c) => c.name === 'Warlock')
    if (warlock && warlock.level >= 3 && spell.level <= Math.ceil(warlock.level / 2))
      access.push('Book of Ancient Secrets · requires selection or transcription')
  }
  return access
}

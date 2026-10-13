import { characterClasses } from './companionRules.ts'
import type { Reader, RuleSettings } from './companionRules'
import type { Workbook } from './sheetModel'
import { canonicalSubclass } from './phbSubclassRules.ts'
import { subclassSpellGrants } from './subclassSpells.ts'
const thirdKnown = [0, 0, 0, 3, 4, 4, 4, 5, 6, 6, 7, 8, 8, 9, 10, 10, 11, 11, 11, 12, 13]
const bardKnown = [0, 4, 5, 6, 7, 8, 9, 10, 11, 12, 14, 15, 15, 16, 18, 19, 19, 20, 22, 22, 22]
const sorcererKnown = [0, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 12, 13, 13, 14, 14, 15, 15, 15, 15]
const warlockKnown = [0, 2, 3, 4, 5, 6, 7, 8, 9, 10, 10, 11, 11, 12, 12, 13, 13, 14, 14, 15, 15]
export function castingProfiles(book: Workbook, read: Reader, settings?: RuleSettings) {
  return characterClasses(book, read).flatMap((c) => {
    const sub = canonicalSubclass(c.name, c.subclass),
      level = c.level
    const third =
      level >= 3 &&
      ((c.name === 'Rogue' && sub === 'Arcane Trickster') ||
        (c.name === 'Fighter' && sub === 'Eldritch Knight'))
    const full = ['Bard', 'Cleric', 'Druid', 'Sorcerer', 'Wizard'].includes(c.name)
    const half = (['Paladin', 'Ranger'].includes(c.name) && level >= 2) || c.name === 'Artificer'
    if (!level || (!full && !half && c.name !== 'Warlock' && !third)) return []
    const ability =
      third || ['Wizard', 'Artificer'].includes(c.name)
        ? 'Intelligence'
        : ['Cleric', 'Druid', 'Ranger'].includes(c.name)
          ? 'Wisdom'
          : 'Charisma'
    const abilityCell = { Intelligence: 'C30', Wisdom: 'C35', Charisma: 'C40' }[ability]
    const score = Number(read('v2.1', abilityCell)),
      modifier = score ? Math.floor((score - 10) / 2) : 0
    const cantripBase: Record<string, number> = {
      Bard: 2,
      Cleric: 3,
      Druid: 2,
      Sorcerer: 4,
      Warlock: 2,
      Wizard: 3,
    }
    const cantrips = third
      ? (c.name === 'Rogue' ? 3 : 2) + (level >= 10 ? 1 : 0)
      : c.name === 'Artificer'
        ? 2 + (level >= 10 ? 1 : 0) + (level >= 14 ? 1 : 0)
        : cantripBase[c.name] !== undefined
          ? cantripBase[c.name] +
            (level >= 4 ? 1 : 0) +
            (level >= 10 ? 1 : 0) +
            (c.name === 'Druid' && sub === 'Circle of the Land' && level >= 2 ? 1 : 0)
          : 0
    const known = third
      ? thirdKnown[level]
      : c.name === 'Bard'
        ? bardKnown[level] + (sub === 'College of Lore' && level >= 6 ? 2 : 0)
        : c.name === 'Sorcerer'
          ? sorcererKnown[level]
          : c.name === 'Warlock'
            ? warlockKnown[level]
            : c.name === 'Ranger'
              ? 1 + Math.ceil(level / 2)
              : null
    const prepared = ['Cleric', 'Druid', 'Wizard'].includes(c.name)
      ? Math.max(1, level + modifier)
      : ['Paladin', 'Artificer'].includes(c.name)
        ? Math.max(1, Math.floor(level / 2) + modifier)
        : null
    const maxLevel = third
      ? level >= 19
        ? 4
        : level >= 13
          ? 3
          : level >= 7
            ? 2
            : 1
      : half
        ? Math.min(5, Math.ceil(level / 4))
        : c.name === 'Warlock'
          ? Math.min(5, Math.ceil(level / 2))
          : Math.min(9, Math.ceil(level / 2))
    return [
      {
        ...c,
        ability,
        modifier,
        cantrips,
        known,
        prepared,
        maxLevel,
        grants: subclassSpellGrants(c, settings),
        arcanum: c.name === 'Warlock' ? Math.max(0, Math.min(4, Math.floor((level - 9) / 2))) : 0,
      },
    ]
  })
}
export function usesKnownSpellList(book: Workbook, read: Reader) {
  const profiles = castingProfiles(book, read)
  return profiles.length === 1 && profiles[0].known !== null
}

import { canonicalSubclass } from './phbSubclassRules.ts'
import type { ClassChoice, RuleSettings } from './companionRules'
import { expansionSpellGrants } from './expansionSpells.ts'
export type SpellGrant = {
  name: string
  level: number
  mode: 'Always prepared' | 'Expanded list' | 'Always known'
  source: string
}
const lists: Record<string, [number, string[]][]> = {
  'Life Domain': [
    [1, ['Bless', 'Cure Wounds']],
    [3, ['Lesser Restoration', 'Spiritual Weapon']],
    [5, ['Beacon of Hope', 'Revivify']],
    [7, ['Death Ward', 'Guardian of Faith']],
    [9, ['Mass Cure Wounds', 'Raise Dead']],
  ],
  'Knowledge Domain': [
    [1, ['Command', 'Identify']],
    [3, ['Augury', 'Suggestion']],
    [5, ['Nondetection', 'Speak with Dead']],
    [7, ['Arcane Eye', 'Confusion']],
    [9, ['Legend Lore', 'Scrying']],
  ],
  'Light Domain': [
    [1, ['Burning Hands', 'Faerie Fire']],
    [3, ['Flaming Sphere', 'Scorching Ray']],
    [5, ['Daylight', 'Fireball']],
    [7, ['Guardian of Faith', 'Wall of Fire']],
    [9, ['Flame Strike', 'Scrying']],
  ],
  'Nature Domain': [
    [1, ['Animal Friendship', 'Speak with Animals']],
    [3, ['Barkskin', 'Spike Growth']],
    [5, ['Plant Growth', 'Wind Wall']],
    [7, ['Dominate Beast', 'Grasping Vine']],
    [9, ['Insect Plague', 'Tree Stride']],
  ],
  'Tempest Domain': [
    [1, ['Fog Cloud', 'Thunderwave']],
    [3, ['Gust of Wind', 'Shatter']],
    [5, ['Call Lightning', 'Sleet Storm']],
    [7, ['Control Water', 'Ice Storm']],
    [9, ['Destructive Wave', 'Insect Plague']],
  ],
  'Trickery Domain': [
    [1, ['Charm Person', 'Disguise Self']],
    [3, ['Mirror Image', 'Pass without Trace']],
    [5, ['Blink', 'Dispel Magic']],
    [7, ['Dimension Door', 'Polymorph']],
    [9, ['Dominate Person', 'Modify Memory']],
  ],
  'War Domain': [
    [1, ['Divine Favor', 'Shield of Faith']],
    [3, ['Magic Weapon', 'Spiritual Weapon']],
    [5, ['Crusader’s Mantle', 'Spirit Guardians']],
    [7, ['Freedom of Movement', 'Stoneskin']],
    [9, ['Flame Strike', 'Hold Monster']],
  ],
  'Oath of Devotion': [
    [3, ['Protection from Evil and Good', 'Sanctuary']],
    [5, ['Lesser Restoration', 'Zone of Truth']],
    [9, ['Beacon of Hope', 'Dispel Magic']],
    [13, ['Freedom of Movement', 'Guardian of Faith']],
    [17, ['Commune', 'Flame Strike']],
  ],
  'Oath of the Ancients': [
    [3, ['Ensnaring Strike', 'Speak with Animals']],
    [5, ['Misty Step', 'Moonbeam']],
    [9, ['Plant Growth', 'Protection from Energy']],
    [13, ['Ice Storm', 'Stoneskin']],
    [17, ['Commune with Nature', 'Tree Stride']],
  ],
  'Oath of Vengeance': [
    [3, ['Bane', 'Hunter’s Mark']],
    [5, ['Hold Person', 'Misty Step']],
    [9, ['Haste', 'Protection from Energy']],
    [13, ['Banishment', 'Dimension Door']],
    [17, ['Hold Monster', 'Scrying']],
  ],
  'The Archfey': [
    [1, ['Faerie Fire', 'Sleep']],
    [3, ['Calm Emotions', 'Phantasmal Force']],
    [5, ['Blink', 'Plant Growth']],
    [7, ['Dominate Beast', 'Greater Invisibility']],
    [9, ['Dominate Person', 'Seeming']],
  ],
  'The Fiend': [
    [1, ['Burning Hands', 'Command']],
    [3, ['Blindness/Deafness', 'Scorching Ray']],
    [5, ['Fireball', 'Stinking Cloud']],
    [7, ['Fire Shield', 'Wall of Fire']],
    [9, ['Flame Strike', 'Hallow']],
  ],
  'The Great Old One': [
    [1, ['Dissonant Whispers', 'Hideous Laughter']],
    [3, ['Detect Thoughts', 'Phantasmal Force']],
    [5, ['Clairvoyance', 'Sending']],
    [7, ['Dominate Beast', 'Black Tentacles']],
    [9, ['Dominate Person', 'Telekinesis']],
  ],
  'Land:Arctic': [
    [3, ['Hold Person', 'Spike Growth']],
    [5, ['Sleet Storm', 'Slow']],
    [7, ['Freedom of Movement', 'Ice Storm']],
    [9, ['Commune with Nature', 'Cone of Cold']],
  ],
  'Land:Coast': [
    [3, ['Mirror Image', 'Misty Step']],
    [5, ['Water Breathing', 'Water Walk']],
    [7, ['Control Water', 'Freedom of Movement']],
    [9, ['Conjure Elemental', 'Scrying']],
  ],
  'Land:Desert': [
    [3, ['Blur', 'Silence']],
    [5, ['Create Food and Water', 'Protection from Energy']],
    [7, ['Blight', 'Hallucinatory Terrain']],
    [9, ['Insect Plague', 'Wall of Stone']],
  ],
  'Land:Forest': [
    [3, ['Barkskin', 'Spider Climb']],
    [5, ['Call Lightning', 'Plant Growth']],
    [7, ['Divination', 'Freedom of Movement']],
    [9, ['Commune with Nature', 'Tree Stride']],
  ],
  'Land:Grassland': [
    [3, ['Invisibility', 'Pass without Trace']],
    [5, ['Daylight', 'Haste']],
    [7, ['Divination', 'Freedom of Movement']],
    [9, ['Dream', 'Insect Plague']],
  ],
  'Land:Mountain': [
    [3, ['Spider Climb', 'Spike Growth']],
    [5, ['Lightning Bolt', 'Meld into Stone']],
    [7, ['Stone Shape', 'Stoneskin']],
    [9, ['Passwall', 'Wall of Stone']],
  ],
  'Land:Swamp': [
    [3, ['Darkness', 'Melf’s Acid Arrow']],
    [5, ['Water Walk', 'Stinking Cloud']],
    [7, ['Freedom of Movement', 'Locate Creature']],
    [9, ['Insect Plague', 'Scrying']],
  ],
  'Land:Underdark': [
    [3, ['Spider Climb', 'Web']],
    [5, ['Gaseous Form', 'Stinking Cloud']],
    [7, ['Greater Invisibility', 'Stone Shape']],
    [9, ['Cloudkill', 'Insect Plague']],
  ],
}
export function subclassSpellGrants(c: ClassChoice, settings?: RuleSettings): SpellGrant[] {
  let key = canonicalSubclass(c.name, c.subclass)
  if (key === 'Circle of the Land')
    key =
      'Land:' +
      (settings?.selections
        ?.find((id) => id.startsWith('Druid:land:'))
        ?.slice('Druid:land:'.length) ?? '')
  const valid =
    (c.name === 'Cleric' && key.endsWith(' Domain')) ||
    (c.name === 'Paladin' && key.startsWith('Oath of ')) ||
    (c.name === 'Warlock' && key.startsWith('The ')) ||
    (c.name === 'Druid' && key.startsWith('Land:'))
  return [
    ...expansionSpellGrants(c, settings),
    ...(valid
      ? (lists[key] ?? []).flatMap(([level, names]) =>
          level <= c.level
            ? names.map((name) => ({
                name,
                level,
                source: key,
                mode:
                  c.name === 'Warlock' ? ('Expanded list' as const) : ('Always prepared' as const),
              }))
            : [],
        )
      : []),
  ]
}
export const SUBCLASS_SPELL_LISTS = lists

import type { ClassChoice, RuleSettings } from './companionRules'
import type { SpellGrant } from './subclassSpells'
import { canonicalSubclass } from './phbSubclassRules.ts'
const rows = (levels: number[], names: string): [number, string[]][] =>
  names.split('|').map((pair, i) => [levels[i], pair.split(';')])
const caster = [1, 3, 5, 7, 9],
  half = [3, 5, 9, 13, 17]
export const EXPANSION_SPELL_LISTS: Record<string, [number, string[]][]> = {
  'Death Domain': rows(
    caster,
    'False Life;Ray of Sickness|Blindness/Deafness;Ray of Enfeeblement|Animate Dead;Vampiric Touch|Blight;Death Ward|Antilife Shell;Cloudkill',
  ),
  'Arcana Domain': rows(
    caster,
    'Detect Magic;Magic Missile|Magic Weapon;Nystul’s Magic Aura|Dispel Magic;Magic Circle|Arcane Eye;Leomund’s Secret Chest|Planar Binding;Teleportation Circle',
  ),
  'Forge Domain': rows(
    caster,
    'Identify;Searing Smite|Heat Metal;Magic Weapon|Elemental Weapon;Protection from Energy|Fabricate;Wall of Fire|Animate Objects;Creation',
  ),
  'Grave Domain': rows(
    caster,
    'Bane;False Life|Gentle Repose;Ray of Enfeeblement|Revivify;Vampiric Touch|Blight;Death Ward|Antilife Shell;Raise Dead',
  ),
  'Order Domain': rows(
    caster,
    'Command;Heroism|Hold Person;Zone of Truth|Mass Healing Word;Slow|Compulsion;Locate Creature|Commune;Dominate Person',
  ),
  'Peace Domain': rows(
    caster,
    'Heroism;Sanctuary|Aid;Warding Bond|Beacon of Hope;Sending|Aura of Purity;Otiluke’s Resilient Sphere|Greater Restoration;Rary’s Telepathic Bond',
  ),
  'Twilight Domain': rows(
    caster,
    'Faerie Fire;Sleep|Moonbeam;See Invisibility|Aura of Vitality;Leomund’s Tiny Hut|Aura of Life;Greater Invisibility|Circle of Power;Mislead',
  ),
  Oathbreaker: rows(
    half,
    'Hellish Rebuke;Inflict Wounds|Crown of Madness;Darkness|Animate Dead;Bestow Curse|Blight;Confusion|Contagion;Dominate Person',
  ),
  'Oath of the Crown': rows(
    half,
    'Command;Compelled Duel|Warding Bond;Zone of Truth|Aura of Vitality;Spirit Guardians|Banishment;Guardian of Faith|Circle of Power;Geas',
  ),
  'Oath of Conquest': rows(
    half,
    'Armor of Agathys;Command|Hold Person;Spiritual Weapon|Bestow Curse;Fear|Dominate Beast;Stoneskin|Cloudkill;Dominate Person',
  ),
  'Oath of Redemption': rows(
    half,
    'Sanctuary;Sleep|Calm Emotions;Hold Person|Counterspell;Hypnotic Pattern|Otiluke’s Resilient Sphere;Stoneskin|Hold Monster;Wall of Force',
  ),
  'Oath of Glory': rows(
    half,
    'Guiding Bolt;Heroism|Enhance Ability;Magic Weapon|Haste;Protection from Energy|Compulsion;Freedom of Movement|Commune;Flame Strike',
  ),
  'Oath of the Watchers': rows(
    half,
    'Alarm;Detect Magic|Moonbeam;See Invisibility|Counterspell;Nondetection|Aura of Purity;Banishment|Hold Monster;Scrying',
  ),
  Alchemist: rows(
    half,
    'Healing Word;Ray of Sickness|Flaming Sphere;Melf’s Acid Arrow|Gaseous Form;Mass Healing Word|Blight;Death Ward|Cloudkill;Raise Dead',
  ),
  Armorer: rows(
    half,
    'Magic Missile;Thunderwave|Mirror Image;Shatter|Hypnotic Pattern;Lightning Bolt|Fire Shield;Greater Invisibility|Passwall;Wall of Force',
  ),
  Artillerist: rows(
    half,
    'Shield;Thunderwave|Scorching Ray;Shatter|Fireball;Wind Wall|Ice Storm;Wall of Fire|Cone of Cold;Wall of Force',
  ),
  'Battle Smith': rows(
    half,
    'Heroism;Shield|Branding Smite;Warding Bond|Aura of Vitality;Conjure Barrage|Aura of Purity;Fire Shield|Banishing Smite;Mass Cure Wounds',
  ),
  'The Undying': rows(
    caster,
    'False Life;Ray of Sickness|Blindness/Deafness;Silence|Feign Death;Speak with Dead|Aura of Life;Death Ward|Contagion;Legend Lore',
  ),
  'The Celestial': rows(
    caster,
    'Cure Wounds;Guiding Bolt|Flaming Sphere;Lesser Restoration|Daylight;Revivify|Guardian of Faith;Wall of Fire|Flame Strike;Greater Restoration',
  ),
  'The Hexblade': rows(
    caster,
    'Shield;Wrathful Smite|Blur;Branding Smite|Blink;Elemental Weapon|Phantasmal Killer;Staggering Smite|Banishing Smite;Cone of Cold',
  ),
  'The Fathomless': rows(
    caster,
    'Create or Destroy Water;Thunderwave|Gust of Wind;Silence|Lightning Bolt;Sleet Storm|Control Water;Summon Elemental|Bigby’s Hand;Cone of Cold',
  ),
  'The Undead': rows(
    caster,
    'Bane;False Life|Blindness/Deafness;Phantasmal Force|Phantom Steed;Speak with Dead|Death Ward;Greater Invisibility|Antilife Shell;Cloudkill',
  ),
  'Genie:Dao': rows(
    caster,
    'Detect Evil and Good;Sanctuary|Phantasmal Force;Spike Growth|Create Food and Water;Meld into Stone|Phantasmal Killer;Stone Shape|Creation;Wall of Stone',
  ),
  'Genie:Djinni': rows(
    caster,
    'Detect Evil and Good;Thunderwave|Phantasmal Force;Gust of Wind|Create Food and Water;Wind Wall|Phantasmal Killer;Greater Invisibility|Creation;Seeming',
  ),
  'Genie:Efreeti': rows(
    caster,
    'Detect Evil and Good;Burning Hands|Phantasmal Force;Scorching Ray|Create Food and Water;Fireball|Phantasmal Killer;Fire Shield|Creation;Flame Strike',
  ),
  'Genie:Marid': rows(
    caster,
    'Detect Evil and Good;Fog Cloud|Phantasmal Force;Blur|Create Food and Water;Sleet Storm|Phantasmal Killer;Control Water|Creation;Cone of Cold',
  ),
  'Circle of Spores': [
    [2, ['Chill Touch']],
    ...rows(
      [3, 5, 7, 9],
      'Blindness/Deafness;Gentle Repose|Animate Dead;Gaseous Form|Blight;Confusion|Cloudkill;Contagion',
    ),
  ],
  'Circle of Wildfire': rows(
    [2, 3, 5, 7, 9],
    'Burning Hands;Cure Wounds|Flaming Sphere;Scorching Ray|Plant Growth;Revivify|Aura of Life;Fire Shield|Flame Strike;Mass Cure Wounds',
  ),
  'Circle of Stars': [[2, ['Guidance', 'Guiding Bolt']]],
  'Aberrant Mind': [
    [1, ['Mind Sliver']],
    ...rows(
      caster,
      'Arms of Hadar;Dissonant Whispers|Calm Emotions;Detect Thoughts|Hunger of Hadar;Sending|Evard’s Black Tentacles;Summon Aberration|Rary’s Telepathic Bond;Telekinesis',
    ),
  ],
  'Clockwork Soul': rows(
    caster,
    'Alarm;Protection from Evil and Good|Aid;Lesser Restoration|Dispel Magic;Protection from Energy|Freedom of Movement;Summon Construct|Greater Restoration;Wall of Force',
  ),
  'Lunar Sorcery': rows(
    caster,
    'Shield;Ray of Sickness;Color Spray|Lesser Restoration;Blindness/Deafness;Alter Self|Dispel Magic;Vampiric Touch;Phantom Steed|Death Ward;Confusion;Hallucinatory Terrain|Rary’s Telepathic Bond;Hold Monster;Mislead',
  ),
  'Gloom Stalker': rows(half, 'Disguise Self|Rope Trick|Fear|Greater Invisibility|Seeming'),
  'Horizon Walker': rows(
    half,
    'Protection from Evil and Good|Misty Step|Haste|Banishment|Teleportation Circle',
  ),
  'Monster Slayer': rows(
    half,
    'Protection from Evil and Good|Zone of Truth|Magic Circle|Banishment|Hold Monster',
  ),
  'Fey Wanderer': rows(half, 'Charm Person|Misty Step|Dispel Magic|Dimension Door|Mislead'),
  Swarmkeeper: [
    [3, ['Mage Hand']],
    ...rows(half, 'Faerie Fire|Web|Gaseous Form|Arcane Eye|Insect Plague'),
  ],
}
export function expansionSpellGrants(c: ClassChoice, settings?: RuleSettings): SpellGrant[] {
  let key = canonicalSubclass(c.name, c.subclass)
  if (key === 'The Genie')
    key =
      'Genie:' +
      (settings?.selections
        ?.find((id) => id.startsWith('Warlock:genie:'))
        ?.slice('Warlock:genie:'.length) ?? '')
  const mode: SpellGrant['mode'] =
    c.name === 'Warlock'
      ? 'Expanded list'
      : ['Ranger', 'Sorcerer'].includes(c.name)
        ? 'Always known'
        : 'Always prepared'
  const result = (EXPANSION_SPELL_LISTS[key] ?? []).flatMap(([level, names]) =>
    level <= c.level
      ? names.map((name) => ({
          name,
          level,
          source:
            key === 'The Fathomless' && name === 'Summon Elemental'
              ? key + ' · Water elemental only'
              : key,
          mode,
        }))
      : [],
  )
  if (c.name === 'Warlock' && key.startsWith('Genie:') && c.level >= 17)
    result.push({ name: 'Wish', level: 17, source: key, mode: 'Expanded list' })
  if (c.name === 'Sorcerer' && key === 'Shadow Magic' && c.level >= 3)
    result.push({ name: 'Darkness', level: 3, source: key, mode: 'Always known' })
  if (c.name === 'Sorcerer' && key === 'Divine Soul' && c.level >= 1) {
    const affinity = settings?.selections
      ?.find((id) => id.startsWith('Sorcerer:affinity:'))
      ?.slice('Sorcerer:affinity:'.length)
    const name = (
      {
        Good: 'Cure Wounds',
        Evil: 'Inflict Wounds',
        Law: 'Bless',
        Chaos: 'Bane',
        Neutrality: 'Protection from Evil and Good',
      } as Record<string, string>
    )[affinity ?? '']
    if (name) result.push({ name, level: 1, source: key, mode: 'Always known' })
  }
  if (c.name === 'Ranger' && key === 'Fey Wanderer' && c.level >= 11)
    result.push({ name: 'Summon Fey', level: 11, source: key, mode: 'Always known' })
  return result
}
// PHB spells already defined in the app that appear on the TCE Artificer spell list.
export const ARTIFICER_CORE_SPELLS = new Set(
  'Acid Splash;Fire Bolt;Guidance;Light;Mage Hand;Mending;Message;Poison Spray;Prestidigitation;Ray of Frost;Resistance;Shocking Grasp;Spare the Dying;Thorn Whip;Cure Wounds;Detect Magic;Disguise Self;Expeditious Retreat;Faerie Fire;False Life;Feather Fall;Grease;Identify;Jump;Longstrider;Purify Food and Drink;Sanctuary;Aid;Alter Self;Arcane Lock;Blur;Continual Flame;Darkvision;Enhance Ability;Enlarge/Reduce;Heat Metal;Invisibility;Lesser Restoration;Levitate;Magic Mouth;Magic Weapon;Protection from Poison;Rope Trick;See Invisibility;Spider Climb;Web;Blink;Create Food and Water;Dispel Magic;Elemental Weapon;Fly;Glyph of Warding;Haste;Protection from Energy;Revivify;Water Breathing;Water Walk;Arcane Eye;Fabricate;Freedom of Movement;Leomund’s Secret Chest;Mordenkainen’s Faithful Hound;Mordenkainen’s Private Sanctum;Otiluke’s Resilient Sphere;Stone Shape;Stoneskin;Animate Objects;Bigby’s Hand;Creation;Greater Restoration;Wall of Stone'.split(
    ';',
  ),
)

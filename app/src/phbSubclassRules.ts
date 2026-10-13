import type { Ability, Economy } from './companionRules'
import { EXPANSION_SUBCLASSES, SUBCLASS_ALIASES } from './officialRegistry.ts'

// Original mechanical summaries; full book prose is not reproduced.
// This pack is explicitly PHB 2014, not the revised 2024 subclasses.
export const PHB_SUBCLASSES: Record<string, string[]> = {
  Barbarian: ['Path of the Berserker', 'Path of the Totem Warrior'],
  Bard: ['College of Lore', 'College of Valor'],
  Cleric: [
    'Knowledge Domain',
    'Life Domain',
    'Light Domain',
    'Nature Domain',
    'Tempest Domain',
    'Trickery Domain',
    'War Domain',
  ],
  Druid: ['Circle of the Land', 'Circle of the Moon'],
  Fighter: ['Champion', 'Battle Master', 'Eldritch Knight'],
  Monk: ['Way of the Open Hand', 'Way of Shadow', 'Way of the Four Elements'],
  Paladin: ['Oath of Devotion', 'Oath of the Ancients', 'Oath of Vengeance'],
  Ranger: ['Hunter', 'Beast Master'],
  Rogue: ['Thief', 'Assassin', 'Arcane Trickster'],
  Sorcerer: ['Draconic Bloodline', 'Wild Magic'],
  Warlock: ['The Archfey', 'The Fiend', 'The Great Old One'],
  Wizard: [
    'School of Abjuration',
    'School of Conjuration',
    'School of Divination',
    'School of Enchantment',
    'School of Evocation',
    'School of Illusion',
    'School of Necromancy',
    'School of Transmutation',
  ],
}
export const OFFICIAL_SUBCLASSES = Object.fromEntries(
  [...new Set([...Object.keys(PHB_SUBCLASSES), ...Object.keys(EXPANSION_SUBCLASSES)])].map((c) => [
    c,
    [...(PHB_SUBCLASSES[c] ?? []), ...(EXPANSION_SUBCLASSES[c] ?? [])],
  ]),
) as Record<string, string[]>
export function canonicalSubclass(className: string, name: string): string {
  name = SUBCLASS_ALIASES[name] ?? name
  return (
    OFFICIAL_SUBCLASSES[className]?.find(
      (s) =>
        s.toLowerCase() === name.toLowerCase() ||
        s
          .toLowerCase()
          .replace(
            /^(path of (?:the )?|college of |circle of (?:the )?|way of (?:the )?|oath of (?:the )?|school of |the )/,
            '',
          )
          .replace(/ domain$/, '') === name.toLowerCase(),
    ) ?? name
  )
}
export const subclassUnlock = (name: string) =>
  ['Cleric', 'Sorcerer', 'Warlock'].includes(name) ? 1 : ['Druid', 'Wizard'].includes(name) ? 2 : 3
type Row = [number, Economy, string, string, string?]
const entries: Ability[] = []
function add(className: string, subclass: string, block: number, rows: Row[]) {
  for (const [level, economy, name, detail, cost] of rows)
    entries.push({
      className,
      subclass,
      level,
      economy,
      name,
      detail,
      cost,
      source: 'PHB 2014 · mechanical summary',
      url: `https://www.worldanvil.com/block/${block}`,
    })
}
add('Barbarian', 'Path of the Totem Warrior', 240788, [
  [3, 'Unclassified', 'Spirit Seeker', 'Cast Beast Sense and Speak with Animals as rituals only.'],
  [
    3,
    'Passive',
    'Totem Spirit',
    'Choose Bear (rage: resist damage except psychic), Eagle (rage, no heavy armor: bonus Dash; opportunity attacks against you have disadvantage), or Wolf (rage: allies have advantage on melee attacks against enemies within 5 ft of you). Record the choice in Feature choices.',
  ],
  [
    6,
    'Passive',
    'Aspect of the Beast',
    'Choose Bear (double carrying capacity; advantage on Strength checks to push, pull, lift or break), Eagle (clear sight to 1 mile; dim light does not penalize Perception), or Wolf (track at fast pace; move stealthily at normal pace). Choice is independent of level 3.',
  ],
  [
    10,
    'Unclassified',
    'Spirit Walker',
    'Cast Commune with Nature as a ritual; an animal spirit provides the information.',
  ],
  [
    14,
    'Passive',
    'Totemic Attunement',
    'Choose independently: Bear (rage: nearby enemies attack others at disadvantage, unless they cannot see/hear you or are fear-immune); Eagle (rage: fly at walking speed, fall if ending turn airborne without support); Wolf (rage: bonus action knocks a Large-or-smaller creature prone after a melee weapon hit).',
  ],
])
add('Bard', 'College of Valor', 1423467, [
  [3, 'Passive', 'Bonus Proficiencies', 'Medium armor, shields and martial weapons.'],
  [
    3,
    'Passive',
    'Combat Inspiration',
    'Recipient may add your Bardic Inspiration die to weapon damage, or use their reaction to add it to AC against one attack after seeing the roll, before knowing the result. This uses the recipient’s reaction.',
  ],
  [6, 'Passive', 'Extra Attack', 'Two attacks when taking the Attack action on your turn.'],
  [
    14,
    'Bonus action',
    'Battle Magic',
    'After using your action to cast a bard spell, make one weapon attack.',
  ],
])
add('Cleric', 'Knowledge Domain', 954411, [
  [
    1,
    'Passive',
    'Blessings of Knowledge',
    'Learn two languages; choose two of Arcana, History, Nature, Religion. Gain proficiency and double proficiency on those two skills.',
  ],
  [
    2,
    'Action',
    'Knowledge of the Ages',
    'Choose any one skill or tool; gain proficiency for 10 minutes. Temporary, not a permanent skill grant.',
    '1 Channel Divinity',
  ],
  [
    6,
    'Action',
    'Read Thoughts',
    'Visible creature within 60 ft: Wisdom save. Success blocks this feature on it until your long rest. Failure: read surface thoughts while within 60 ft for 1 minute; another action ends this effect and casts Suggestion without a slot, with an automatically failed save. Suggestion’s other rules still apply.',
    '1 Channel Divinity',
  ],
  [8, 'Passive', 'Potent Spellcasting', 'Add Wisdom modifier to cleric cantrip damage.'],
  [
    17,
    'Unclassified',
    'Visions of the Past',
    'Concentrate in meditation for 1+ minutes, up to Wisdom score minutes. Object: each minute reveals acquisition, loss and significant events for an owner within Wisdom-score days. Area: a 50-ft cube; each minute reveals a significant event, newest first, within Wisdom-score days.',
    '1 / short or long rest',
  ],
])
add('Cleric', 'Light Domain', 954418, [
  [1, 'Passive', 'Bonus Cantrip', 'Gain Light if not already known.'],
  [
    1,
    'Reaction',
    'Warding Flare',
    'Before hit/miss: impose disadvantage on an attack against you by a visible attacker within 30 ft. Blindness-immune attackers are unaffected. At cleric 6, may protect another creature.',
    'max(1, Wisdom modifier) / long rest',
  ],
  [
    2,
    'Action',
    'Radiance of the Dawn',
    'Dispel magical darkness within 30 ft. Hostile creatures there without total cover make Constitution saves: 2d10 + cleric level radiant damage, half on success.',
    '1 Channel Divinity',
  ],
  [
    6,
    'Passive',
    'Improved Flare',
    'Warding Flare can protect others from visible attackers within 30 ft.',
  ],
  [8, 'Passive', 'Potent Spellcasting', 'Add Wisdom modifier to cleric cantrip damage.'],
  [
    17,
    'Action',
    'Corona of Light',
    'For 1 minute emit bright light 60 ft, dim 30 ft farther. Enemies in bright light have disadvantage on saves against fire/radiant damage spells. Another action dismisses it.',
  ],
])
add('Cleric', 'Nature Domain', 1204929, [
  [
    1,
    'Passive',
    'Acolyte of Nature',
    'Choose one druid cantrip and one skill: Animal Handling, Nature or Survival. Gain heavy armor proficiency.',
  ],
  [
    2,
    'Action',
    'Charm Animals and Plants',
    'Beasts/plants that see you within 30 ft make Wisdom saves; failure charms them, friendly to you and designated creatures, for 1 minute or until damaged.',
    '1 Channel Divinity',
  ],
  [
    6,
    'Reaction',
    'Dampen Elements',
    'When you or a creature within 30 ft takes acid, cold, fire, lightning or thunder damage, give that creature resistance to that instance.',
  ],
  [
    8,
    'Passive',
    'Divine Strike',
    'Once on your turn, weapon hit adds 1d8 cold/fire/lightning (choose per hit); 2d8 at cleric 14.',
  ],
  [
    17,
    'Bonus action',
    'Master of Nature',
    'Verbally direct each creature charmed by your Charm Animals and Plants on its next turn.',
  ],
])
add('Cleric', 'Tempest Domain', 136867, [
  [1, 'Passive', 'Bonus Proficiencies', 'Martial weapons and heavy armor.'],
  [
    1,
    'Reaction',
    'Wrath of the Storm',
    'Visible attacker within 5 ft hits you: Dexterity save; 2d8 lightning or thunder, half on success.',
    'max(1, Wisdom modifier) / long rest',
  ],
  [
    2,
    'Passive',
    'Destructive Wrath',
    'When rolling lightning/thunder damage, maximize it instead of rolling. No additional action.',
    '1 Channel Divinity',
  ],
  [
    6,
    'Passive',
    'Thunderbolt Strike',
    'Lightning damage to a Large-or-smaller creature lets you push it up to 10 ft away.',
  ],
  [
    8,
    'Passive',
    'Divine Strike',
    'Once on your turn, weapon hit adds 1d8 thunder; 2d8 at cleric 14.',
  ],
  [
    17,
    'Movement',
    'Stormborn',
    'Flying speed equals walking speed when outdoors, not underground or indoors.',
  ],
])
add('Cleric', 'Trickery Domain', 1319316, [
  [
    1,
    'Action',
    'Blessing of the Trickster',
    'Touch a willing creature other than yourself: Stealth advantage for 1 hour or until used again.',
  ],
  [
    2,
    'Action',
    'Invoke Duplicity',
    'Create a perfect illusion within 30 ft, 1 minute, requiring concentration. Cast as if at its location, using your own senses. Bonus action moves it 30 ft, within 120 ft. You and duplicate within 5 ft of a creature that sees it: advantage on your attacks against that creature.',
    '1 Channel Divinity',
  ],
  [
    6,
    'Action',
    'Cloak of Shadows',
    'Invisible until end of your next turn; ends on attacking or casting a spell.',
    '1 Channel Divinity',
  ],
  [
    8,
    'Passive',
    'Divine Strike',
    'Once on your turn, weapon hit adds 1d8 poison; 2d8 at cleric 14.',
  ],
  [
    17,
    'Passive',
    'Improved Duplicity',
    'Invoke Duplicity creates four duplicates; one bonus action moves any number of them 30 ft each within 120 ft.',
  ],
])
add('Cleric', 'War Domain', 1477471, [
  [1, 'Passive', 'Bonus Proficiencies', 'Martial weapons and heavy armor.'],
  [
    1,
    'Bonus action',
    'War Priest',
    'After taking the Attack action, make one weapon attack.',
    'max(1, Wisdom modifier) / long rest',
  ],
  [
    2,
    'Passive',
    'Guided Strike',
    'Add 10 to your attack roll after seeing the roll, before knowing hit/miss. No additional action.',
    '1 Channel Divinity',
  ],
  [
    6,
    'Reaction',
    'War God’s Blessing',
    'Add 10 to another creature’s attack roll within 30 ft, after seeing the roll, before knowing hit/miss.',
    '1 Channel Divinity',
  ],
  [
    8,
    'Passive',
    'Divine Strike',
    'Once on your turn, weapon hit adds 1d8 of the weapon’s damage type; 2d8 at cleric 14.',
  ],
  [
    17,
    'Passive',
    'Avatar of Battle',
    'Resistance to bludgeoning, piercing and slashing damage from nonmagical weapons.',
  ],
])
add('Druid', 'Circle of the Moon', 1206298, [
  [
    2,
    'Bonus action',
    'Combat Wild Shape',
    'Use Wild Shape as a bonus action. While transformed, spend a spell slot as a bonus action to heal 1d8 per slot level. Normal Wild Shape restrictions still apply.',
  ],
  [
    2,
    'Passive',
    'Circle Forms',
    'Maximum beast CR 1 at druid 2; at druid 6+, floor(druid level / 3). Normal swimming/flying restrictions remain.',
  ],
  [
    6,
    'Passive',
    'Primal Strike',
    'Beast-form attacks count as magical for overcoming resistance/immunity.',
  ],
  [
    10,
    'Bonus action',
    'Elemental Wild Shape',
    'Use two Wild Shape uses at once to become an air, earth, fire or water elemental.',
    '2 Wild Shape uses',
  ],
  [
    14,
    'Action',
    'Thousand Forms',
    'Cast Alter Self at will; concentration and other spell rules apply.',
  ],
])
add('Fighter', 'Battle Master', 1019818, [
  [
    3,
    'Passive',
    'Combat Superiority',
    'Know 3 maneuvers; +2 at fighter 7, 10 and 15, replacing one when learning. One maneuver per attack. 4 d8 superiority dice, short/long rest; 5 dice at 7, 6 at 15; d10 at 10, d12 at 18. Save DC 8 + proficiency + Strength or Dexterity modifier.',
  ],
  [3, 'Passive', 'Student of War', 'Choose one artisan’s tool proficiency.'],
  [
    7,
    'Unclassified',
    'Know Your Enemy',
    'Observe/interact outside combat for 1 minute: compare any two of Strength, Dexterity, Constitution, AC, current HP, total class levels or fighter levels with yours (equal/superior/inferior).',
  ],
  [10, 'Passive', 'Improved Combat Superiority', 'Superiority dice become d10; d12 at fighter 18.'],
  [15, 'Passive', 'Relentless', 'Initiative with no superiority dice: regain one.'],
])
add('Fighter', 'Eldritch Knight', 236100, [
  [
    3,
    'Passive',
    'Eldritch Knight Spellcasting',
    'Intelligence casting, wizard list. Know 2 cantrips (3 at fighter 10) and 3 level-1 spells, two abjuration/evocation. Further learned spells use those schools except levels 8, 14, 20; replacement preserves that exception. Slots unlock spell levels 1/2/3/4 at fighter 3/7/13/19. See spellcasting reference for the complete known/slot table.',
  ],
  [
    3,
    'Unclassified',
    'Weapon Bond',
    'One-hour ritual bonds a weapon in reach; up to two bonds. Cannot be disarmed unless incapacitated. Bonus action summons one bonded weapon from the same plane.',
  ],
  [
    7,
    'Bonus action',
    'War Magic',
    'After using your action to cast a cantrip, make one weapon attack.',
  ],
  [
    10,
    'Passive',
    'Eldritch Strike',
    'Weapon hit: target has disadvantage on its next save against a spell you cast before end of your next turn.',
  ],
  [
    15,
    'Movement',
    'Arcane Charge',
    'When using Action Surge, teleport up to 30 ft to a visible empty space, before or after the extra action.',
  ],
  [
    18,
    'Bonus action',
    'Improved War Magic',
    'War Magic now applies after any spell cast with your action.',
  ],
])
add('Monk', 'Way of Shadow', 241808, [
  [
    3,
    'Action',
    'Shadow Arts',
    'Cast Darkness, Darkvision, Pass without Trace or Silence with 2 ki, without material components. Also learn Minor Illusion. Normal spell rules apply.',
    '2 ki for leveled spells',
  ],
  [
    6,
    'Bonus action',
    'Shadow Step',
    'From dim light/darkness, teleport up to 60 ft to a visible empty space in dim light/darkness. Advantage on your first melee attack before turn ends.',
  ],
  [
    11,
    'Action',
    'Cloak of Shadows',
    'In dim light/darkness become invisible until attacking, casting a spell or entering bright light.',
  ],
  [
    17,
    'Reaction',
    'Opportunist',
    'When another creature hits a creature within 5 ft of you with an attack, make a melee attack against the hit creature.',
  ],
])
add('Monk', 'Way of the Four Elements', 956182, [
  [
    3,
    'Passive',
    'Disciple of the Elements',
    'Know Elemental Attunement plus 1 chosen discipline; gain another at monk 6, 11, 17, optionally replacing one when learning. Meet discipline level requirements. Spell disciplines ignore material components. From monk 5, each extra ki upcasts one spell level where supported; total spell ki caps: 3 at monk 5–8, 4 at 9–12, 5 at 13–16, 6 at 17–20.',
  ],
  [
    3,
    'Action',
    'Elemental Attunement',
    'Within 30 ft: harmless elemental sensory effect; light/snuff a candle, torch or small fire; warm/chill 1 lb nonliving material for 1 hour; or shape a 1-ft cube of earth/fire/water/mist for 1 minute.',
  ],
])
add('Paladin', 'Oath of the Ancients', 1204924, [
  [
    3,
    'Action',
    'Nature’s Wrath',
    'Visible creature within 10 ft makes Strength or Dexterity save (its choice); failure restrains, repeats at end of each turn.',
    '1 Channel Divinity',
  ],
  [
    3,
    'Action',
    'Turn the Faithless',
    'Fiends/fey hearing you within 30 ft: Wisdom save; failure turns for 1 minute or until damaged, fleeing, no reactions, Dash/escape/Dodge only. Cannot willingly approach within 30 ft. Reveals concealed true forms.',
    '1 Channel Divinity',
  ],
  [
    7,
    'Passive',
    'Aura of Warding',
    'You and friendly creatures within 10 ft resist spell damage; radius 30 ft at paladin 18.',
  ],
  [
    15,
    'Passive',
    'Undying Sentinel',
    'At 0 HP without instant death, drop to 1 instead, once per long rest. No old-age penalties or magical aging.',
  ],
  [
    20,
    'Action',
    'Elder Champion',
    '1 minute: heal 10 at turn start; paladin action spells cast as bonus actions; enemies within 10 ft have disadvantage against your paladin spells/Channel Divinity saves.',
    '1 / long rest',
  ],
])
add('Paladin', 'Oath of Vengeance', 485196, [
  [
    3,
    'Action',
    'Abjure Enemy',
    'Visible creature within 60 ft: Wisdom save (fiends/undead disadvantage; fear-immune unaffected). Failure: frightened, speed 0, no speed bonuses. Success: half speed. Lasts 1 minute or until damaged.',
    '1 Channel Divinity',
  ],
  [
    3,
    'Bonus action',
    'Vow of Enmity',
    'Visible creature within 10 ft: advantage on attacks against it for 1 minute or until it reaches 0 HP/unconsciousness.',
    '1 Channel Divinity',
  ],
  [
    7,
    'Reaction',
    'Relentless Avenger',
    'After hitting an opportunity attack, move up to half speed as part of that reaction; no opportunity attacks from this movement.',
  ],
  [
    15,
    'Reaction',
    'Soul of Vengeance',
    'Creature under your Vow of Enmity attacks: make a melee weapon attack against it if in range.',
  ],
  [
    20,
    'Action',
    'Avenging Angel',
    '1 hour: fly 60 ft; enemies first entering/starting their turn in 30-ft aura during battle make Wisdom save or frightened 1 minute/until damaged. Attacks against frightened creatures have advantage.',
    '1 / long rest',
  ],
])
add('Ranger', 'Beast Master', 1488416, [
  [
    3,
    'Action',
    'Ranger’s Companion',
    'PHB companion: beast Medium or smaller, CR ≤1/4. Add your proficiency to AC, attack/damage and proficient saves/skills; HP max is normal or 4 × ranger level, whichever higher. Acts on your initiative. Movement commands require no action; use your action to command Attack/Dash/Disengage/Help. With Extra Attack, make one attack yourself when commanding its Attack. Otherwise it Dodges; acts independently if you are incapacitated/absent. Replace a dead companion with an 8-hour bond. This is not Tasha’s bonus-action Primal Companion.',
  ],
  [
    7,
    'Bonus action',
    'Exceptional Training',
    'On a turn when your beast does not attack, command Dash, Disengage or Help. Beast attacks count as magical.',
  ],
  [
    11,
    'Passive',
    'Bestial Fury',
    'When commanded to Attack, your beast makes two attacks or uses Multiattack.',
  ],
  [
    15,
    'Passive',
    'Share Spells',
    'When casting a spell targeting yourself, also affect your beast if within 30 ft.',
  ],
])
add('Rogue', 'Arcane Trickster', 528072, [
  [
    3,
    'Passive',
    'Arcane Trickster Spellcasting',
    'Intelligence casting, wizard list. Mage Hand + 2 cantrips (another at rogue 10). 3 initial level-1 spells, two enchantment/illusion. Subsequent spells use those schools except levels 8/14/20; replacement preserves exceptions. Spell-level unlocks 1/2/3/4 at rogue 3/7/13/19.',
  ],
  [
    3,
    'Bonus action',
    'Mage Hand Legerdemain',
    'Invisible Mage Hand: stow/retrieve objects in carried containers or use thieves’ tools at range. Undetected via Sleight of Hand vs Perception. Cunning Action controls it; casting still takes an action.',
  ],
  [
    9,
    'Passive',
    'Magical Ambush',
    'Hidden from a creature when casting: it has disadvantage on saves against that spell this turn.',
  ],
  [
    13,
    'Bonus action',
    'Versatile Trickster',
    'Target within 5 ft of your Mage Hand: advantage on attacks against it this turn.',
  ],
  [
    17,
    'Reaction',
    'Spell Thief',
    'Spell targets/includes you: caster saves with casting ability against your spell DC. Failure negates its effect on you; if leveled and castable by you, learn it for 8 hours, caster loses it for 8 hours.',
    '1 / long rest',
  ],
])
add('Rogue', 'Assassin', 386154, [
  [3, 'Passive', 'Bonus Proficiencies', 'Disguise kit and poisoner’s kit.'],
  [
    3,
    'Passive',
    'Assassinate',
    'Attack advantage against creatures that have not taken a combat turn. Hits against surprised creatures are critical.',
  ],
  [
    9,
    'Unclassified',
    'Infiltration Expertise',
    'Create a new identity (not another real person) with 7 days and 25 gp. Others accept your disguise as that identity unless given obvious reason not to.',
  ],
  [
    13,
    'Passive',
    'Impostor',
    'After studying speech, writing and behavior for 3 hours, mimic them flawlessly to casual observers; advantage on Deception checks against suspicious observers.',
  ],
  [
    17,
    'Passive',
    'Death Strike',
    'Hit a surprised creature: Constitution save, DC 8 + proficiency + Dexterity modifier. Failure doubles attack damage.',
  ],
])
add('Sorcerer', 'Wild Magic', 1207243, [
  [
    1,
    'Passive',
    'Wild Magic Surge',
    'Once per turn after a sorcerer spell of level 1+, DM may request d20; on 1 roll the 2014 d100 surge table (open reference). Surge spells cannot use Metamagic; concentration spells last their duration without concentration.',
  ],
  [
    1,
    'Passive',
    'Tides of Chaos',
    'Gain advantage on one attack, ability check or save. Long rest restores; before then the DM may force a surge after a sorcerer spell of level 1+ and restore this use.',
    '1 / long rest or DM-triggered surge',
  ],
  [
    6,
    'Reaction',
    'Bend Luck',
    'Another visible creature makes attack/check/save: spend 2 sorcery points to add/subtract d4 after its roll, before effects resolve.',
    '2 sorcery points',
  ],
  [
    14,
    'Passive',
    'Controlled Chaos',
    'Roll twice on the Wild Magic Surge table and choose either result.',
  ],
  [
    18,
    'Passive',
    'Spell Bombardment',
    'Once per turn on spell damage with a die showing its maximum, reroll one such die and add the extra result.',
  ],
])
add('Warlock', 'The Archfey', 1398034, [
  [
    1,
    'Action',
    'Fey Presence',
    'Creatures in a 10-ft cube from you make Wisdom saves against warlock spell DC; failures charmed or frightened (choose) until end of your next turn.',
    '1 / short or long rest',
  ],
  [
    6,
    'Reaction',
    'Misty Escape',
    'On taking damage: teleport up to 60 ft to visible empty space, invisible until start of your next turn or attacking/casting.',
    '1 / short or long rest',
  ],
  [
    10,
    'Passive',
    'Beguiling Defenses',
    'Immune to charm; when another tries to charm you, reaction forces Wisdom save vs your spell DC; failure charms it 1 minute or until damaged.',
  ],
  [
    14,
    'Action',
    'Dark Delirium',
    'Visible creature within 60 ft: Wisdom save; failure charmed/frightened (choose), 1 minute concentration or until damage. It sees/hears only you, itself and an illusory realm.',
    '1 / short or long rest',
  ],
])
add('Warlock', 'The Great Old One', 411988, [
  [
    1,
    'Passive',
    'Awakened Mind',
    'One-way telepathic speech to a visible creature within 30 ft; need not share a language, but it must understand one.',
  ],
  [
    6,
    'Reaction',
    'Entropic Ward',
    'Impose disadvantage on an attack against you. If it misses, your next attack against that creature before end of your next turn has advantage.',
    '1 / short or long rest',
  ],
  [
    10,
    'Passive',
    'Thought Shield',
    'Thoughts unreadable unless permitted; resist psychic damage and source takes the same psychic damage you take.',
  ],
  [
    14,
    'Action',
    'Create Thrall',
    'Touch incapacitated humanoid: charm until Remove Curse, charm removed, or feature reused. Telepathic communication anywhere on same plane. Charm does not give full control.',
  ],
])
add('Wizard', 'School of Abjuration', 1285629, [
  [2, 'Passive', 'Abjuration Savant', 'Half time/gold to copy abjuration spells.'],
  [
    2,
    'Passive',
    'Arcane Ward',
    'Cast level-1+ abjuration to create ward once per long rest: HP 2 × wizard level + Intelligence modifier. It absorbs damage first; overflow reaches you. Later level-1+ abjuration casts heal it by 2 × spell level, even from 0. Lasts until long rest.',
  ],
  [
    6,
    'Reaction',
    'Projected Ward',
    'Visible creature within 30 ft takes damage: ward absorbs it, overflow reaches that creature.',
  ],
  [
    10,
    'Passive',
    'Improved Abjuration',
    'Add proficiency to ability checks made as part of abjuration spells, including Counterspell/Dispel Magic.',
  ],
  [
    14,
    'Passive',
    'Spell Resistance',
    'Advantage on saves against spells and resistance to spell damage.',
  ],
])
add('Wizard', 'School of Conjuration', 502259, [
  [2, 'Passive', 'Conjuration Savant', 'Half time/gold to copy conjuration spells.'],
  [
    2,
    'Action',
    'Minor Conjuration',
    'Conjure a seen nonmagical object’s form in hand or visible empty ground within 10 ft; ≤3 ft per side, ≤10 lb. Magical, dim light 5 ft. Ends after 1 hour, reuse, or taking/dealing damage.',
  ],
  [
    6,
    'Action',
    'Benign Transposition',
    'Teleport up to 30 ft to visible empty space, or exchange with willing Small/Medium creature there.',
    '1 / long rest; a level-1+ conjuration spell restores use',
  ],
  [
    10,
    'Passive',
    'Focused Conjuration',
    'Damage cannot break concentration on your conjuration spells.',
  ],
  [
    14,
    'Passive',
    'Durable Summons',
    'Creatures summoned/created by conjuration spells gain 30 temporary HP.',
  ],
])
add('Wizard', 'School of Divination', 1653042, [
  [2, 'Passive', 'Divination Savant', 'Half time/gold to copy divination spells.'],
  [
    2,
    'Passive',
    'Portent',
    'Roll and save two d20 after long rest (three at wizard 14). Before a roll, replace your or a visible creature’s attack/save/check with one saved result. Once per turn; each result once. Unused results expire at next long rest.',
  ],
  [
    6,
    'Passive',
    'Expert Divination',
    'Cast level-2+ divination with a slot: regain a lower-level expended slot, maximum level 5.',
  ],
  [
    10,
    'Action',
    'The Third Eye',
    'Choose darkvision 60 ft, Ethereal sight 60 ft, read any language, or see invisible creatures/objects within 10 ft in line of sight. Lasts until incapacitated or your next short/long rest.',
    '1 / short or long rest',
  ],
  [14, 'Passive', 'Greater Portent', 'Save three Portent dice after a long rest instead of two.'],
])
add('Wizard', 'School of Enchantment', 1204932, [
  [2, 'Passive', 'Enchantment Savant', 'Half time/gold to copy enchantment spells.'],
  [
    2,
    'Action',
    'Hypnotic Gaze',
    'Creature within 5 ft that sees/hears you: Wisdom save; failure charmed, incapacitated, speed 0 until end of next turn. Each action extends; ends if it takes damage, you move beyond 5 ft or it cannot see/hear you. After a success/end, cannot target it again before long rest.',
  ],
  [
    6,
    'Reaction',
    'Instinctive Charm',
    'Visible attacker within 30 ft: Wisdom save; failure redirects attack to closest creature other than you/attacker (attacker chooses ties). Requires another target in attack range; use before hit/miss. After success cannot use on that attacker before long rest. Charm-immune unaffected.',
  ],
  [
    10,
    'Passive',
    'Split Enchantment',
    'Level-1+ enchantment targeting only one creature can target a second.',
  ],
  [
    14,
    'Passive',
    'Alter Memories',
    'When charming with enchantment, optionally hide its awareness. Before charm ends, action: Intelligence save vs spell DC; failure erases ≤1 hour spent charmed. Each minute discussing remembered time extends erased time by 1 hour.',
  ],
])
add('Wizard', 'School of Illusion', 1041142, [
  [2, 'Passive', 'Illusion Savant', 'Half time/gold to copy illusion spells.'],
  [
    2,
    'Passive',
    'Improved Minor Illusion',
    'Learn Minor Illusion, or another wizard cantrip if already known; does not count toward cantrips known. Minor Illusion can create sound and image together.',
  ],
  [
    6,
    'Action',
    'Malleable Illusions',
    'Change a visible illusion from your spell lasting 1+ minute, within that spell’s normal parameters.',
  ],
  [
    10,
    'Reaction',
    'Illusory Self',
    'An attack roll against you automatically misses via an illusory duplicate.',
    '1 / short or long rest',
  ],
  [
    14,
    'Bonus action',
    'Illusory Reality',
    'During your level-1+ illusion spell, make one illusory inanimate nonmagical object real for 1 minute. It cannot damage or directly harm anyone.',
  ],
])
add('Wizard', 'School of Necromancy', 1041144, [
  [2, 'Passive', 'Necromancy Savant', 'Half time/gold to copy necromancy spells.'],
  [
    2,
    'Passive',
    'Grim Harvest',
    'Once per turn, kill a creature with level-1+ spell: heal 2 × spell level, or 3 × for necromancy. Constructs/undead give no healing.',
  ],
  [
    6,
    'Passive',
    'Undead Thralls',
    'Add Animate Dead to spellbook; it creates one extra undead. Any undead you create by necromancy gains wizard-level max HP and your proficiency on weapon damage.',
  ],
  [10, 'Passive', 'Inured to Undeath', 'Necrotic resistance; maximum HP cannot be reduced.'],
  [
    14,
    'Action',
    'Command Undead',
    'Visible undead within 60 ft: Charisma save vs wizard DC. Success permanently blocks this feature against it; failure friendly/obeys until reuse. Intelligence ≥8: save advantage; ≥12: repeat hourly to escape.',
  ],
])
add('Wizard', 'School of Transmutation', 1488441, [
  [2, 'Passive', 'Transmutation Savant', 'Half time/gold to copy transmutation spells.'],
  [
    2,
    'Unclassified',
    'Minor Alchemy',
    '10 minutes per cubic foot transforms wood, nongem stone, iron, copper or silver into another of those. Reverts after 1 hour or concentration lost.',
  ],
  [
    6,
    'Unclassified',
    'Transmuter’s Stone',
    '8-hour creation: holder gets darkvision 60 ft, +10 speed while unencumbered, Constitution save proficiency, or one resistance (acid/cold/fire/lightning/thunder). On casting level-1+ transmutation while holding it, change benefit. Making a new stone ends old one.',
  ],
  [
    10,
    'Action',
    'Shapechanger',
    'Add Polymorph to spellbook; free cast targets yourself, beast CR ≤1.',
    '1 / short or long rest; normal slot casting remains possible',
  ],
  [
    14,
    'Action',
    'Master Transmuter',
    'Consume stone: touch heals all HP/removes curses/disease/poison; cast Raise Dead on touched creature without slot/spellbook (other requirements apply); reduce willing apparent age by 3d10, minimum 13, no lifespan extension; or spend 10 minutes handling an object ≤5-ft cube to change it to similar mass/size, equal/lower value. Remake stone only after long rest.',
  ],
])
entries.find(
  (a) => a.className === 'Rogue' && a.subclass === 'Assassin' && a.name === 'Death Strike',
)!.url = 'https://www.worldanvil.com/block/1350771'
// Split secondary timings into distinct cards so their bonus/reaction is visible.
for (const [subclass, parentName, name, economy, detail] of [
  [
    'Eldritch Knight',
    'Weapon Bond',
    'Summon bonded weapon',
    'Bonus action',
    'Summon one bonded weapon into your hand from anywhere on the same plane.',
  ],
  [
    'The Archfey',
    'Beguiling Defenses',
    'Reflect charm',
    'Reaction',
    'When another creature tries to charm you, it makes Wisdom save against your warlock DC; failure charms it for 1 minute or until damaged.',
  ],
] as [string, string, string, Economy, string][]) {
  const parent = entries.find((a) => a.subclass === subclass && a.name === parentName)!
  entries.push({ ...parent, name, economy, detail })
}
export const PHB_ADDITIONAL_ABILITIES = entries

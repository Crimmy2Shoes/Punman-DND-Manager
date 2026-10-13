import type { Ability, Economy, ClassChoice, RuleSettings } from './companionRules'
import { canonicalSubclass } from './phbSubclassRules.ts'
type Row = [number, Economy, string, string, string?]
const entries: Ability[] = []
function add(
  className: string,
  subclass: string,
  book: string,
  block: number | string,
  rows: Row[],
) {
  for (const [level, economy, name, detail, cost] of rows)
    entries.push({
      className,
      subclass: subclass || undefined,
      level,
      economy,
      name,
      detail,
      cost,
      source: `${book} · 2014 rules · mechanical summary`,
      url: typeof block === 'number' ? `https://www.worldanvil.com/block/${block}` : block,
    })
}
const P = 'Passive',
  A = 'Action',
  B = 'Bonus action',
  R = 'Reaction'
add('Barbarian', 'Path of the Battlerager', 'SCAG', 809309, [
  [
    3,
    P,
    'Battlerager restrictions',
    'Dwarf only, unless your DM waives the restriction. Spiked armor is required for armor abilities.',
  ],
  [
    3,
    B,
    'Battlerager Armor',
    'While raging: spiked-armor attack, 1d4 + Strength piercing. A successful grapple deals 3 piercing.',
  ],
  [
    6,
    P,
    'Reckless Abandon',
    'Reckless Attack while raging grants temporary HP equal to Constitution modifier (minimum 1); expires when rage ends.',
  ],
  [10, B, 'Battlerager Charge', 'Dash while raging.'],
  [
    14,
    P,
    'Spiked Retribution',
    'While raging, wearing spiked armor and conscious: a creature hitting you from within 5 feet takes 3 piercing.',
  ],
])
add('Barbarian', 'Path of the Ancestral Guardian', 'XGE', 1465933, [
  [
    3,
    P,
    'Ancestral Protectors',
    'First creature hit on your raging turn: attacks against others have disadvantage; others resist its attack damage. Ends at your next turn.',
  ],
  [
    6,
    R,
    'Spirit Shield',
    'While raging, reduce damage to another visible creature within 30 feet by 2d6 (3d6 at 10, 4d6 at 14).',
  ],
  [
    10,
    A,
    'Consult the Spirits',
    'Cast Augury or Clairvoyance without slot/materials, using Wisdom.',
    '1 / short or long rest',
  ],
  [
    14,
    P,
    'Vengeful Ancestors',
    'Spirit Shield also deals force damage to the attacker equal to the damage prevented.',
  ],
])
add('Barbarian', 'Path of the Storm Herald', 'XGE', 1465604, [
  [
    3,
    B,
    'Storm Aura',
    '10-foot aura while raging; activates when rage starts and as a bonus action. Choose Desert, Sea or Tundra; change on level-up. Save DC = 8 + PB + Constitution.',
  ],
  [
    3,
    P,
    'Storm environments',
    'Desert: other creatures take 2 fire (3/4/5/6 at levels 5/10/15/20). Sea: one visible target, Dexterity save, 1d6 lightning (2/3/4d6 at 10/15/20), half on success. Tundra: chosen allies gain 2 temporary HP, scaling like Desert.',
  ],
  [
    6,
    P,
    'Storm Soul',
    'Desert: fire resistance/heat tolerance, action ignite object. Sea: lightning resistance, underwater breathing, swim 30. Tundra: cold resistance/cold tolerance, action freeze a 5-foot water cube for 1 minute.',
  ],
  [10, P, 'Shielding Storm', 'Chosen allies in aura share your Storm Soul damage resistance.'],
  [
    14,
    R,
    'Raging Storm · Desert',
    'When a creature in aura hits you: Dexterity save or fire damage equal to half Barbarian level.',
  ],
  [
    14,
    P,
    'Raging Storm · Sea / Tundra',
    'Sea: aura target fails Strength save or falls prone after your hit. Tundra: on aura activation, one creature fails Strength save or speed becomes 0 until your next turn.',
  ],
])
add('Barbarian', 'Path of the Zealot', 'XGE', 1143480, [
  [
    3,
    P,
    'Divine Fury',
    'First weapon hit on each raging turn adds 1d6 + half Barbarian level (rounded down), radiant or necrotic; choose type when gaining feature.',
  ],
  [
    3,
    P,
    'Warrior of the Gods',
    'Spells whose sole effect restores you to life need no material components.',
  ],
  [6, P, 'Fanatical Focus', 'Reroll a failed save while raging; use new roll.', '1 / rage'],
  [
    10,
    B,
    'Zealous Presence',
    'Up to ten allies within 60 feet who hear you gain advantage on attacks and saves until your next turn.',
    '1 / long rest',
  ],
  [
    14,
    P,
    'Rage beyond Death',
    'At 0 HP while raging, remain conscious and make death saves normally. Failed-save death waits until rage ends; healing before then prevents it. Damage can still kill outright.',
  ],
])
add('Barbarian', 'Path of the Beast', 'TCE', 1090639, [
  [
    3,
    P,
    'Form of the Beast',
    'On raging choose: bite d8 (heal PB once/turn below half HP); claws d6 (one extra claw attack per Attack action); or tail d8/reach (reaction add d8 AC against a visible attack within 10 feet). Strength-based natural simple melee weapons.',
  ],
  [
    6,
    P,
    'Bestial Soul',
    'Natural weapons count as magical. Each rest choose: swim speed/water breathing; climb speed including ceilings; or add Athletics check in feet to one jump each turn.',
  ],
  [
    10,
    P,
    'Infectious Fury',
    'Natural-weapon hit: Wisdom save or 2d12 psychic / target reacts with a melee attack against your chosen visible creature.',
    'PB / long rest',
  ],
  [
    14,
    P,
    'Call the Hunt',
    'On rage, choose Constitution modifier allies (minimum 1) within 30 feet. Gain 5 temporary HP per ally; allies add d6 to one attack damage roll per turn until rage ends.',
    'PB / long rest',
  ],
])
add('Barbarian', 'Path of Wild Magic', 'TCE', 608624, [
  [
    3,
    A,
    'Magic Awareness',
    'Sense visible magic locations and spell schools within 60 feet until next turn; total cover blocks.',
    'PB / long rest',
  ],
  [
    3,
    P,
    'Wild Surge',
    'Roll d8 on the linked Barbarian surge table when raging; use Constitution save DC. Some results grant repeat bonus actions. This is a different table from Sorcerer Wild Magic.',
  ],
  [
    6,
    A,
    'Bolstering Magic',
    'Touch: +d3 attacks/checks for 10 minutes, or restore a d3-level-or-lower slot. Each recipient can regain a slot this way only once per long rest.',
    'PB / long rest',
  ],
  [
    10,
    R,
    'Unstable Backlash',
    'While raging, taking damage or failing a save allows a new surge roll, replacing the old effect immediately.',
  ],
  [
    14,
    P,
    'Controlled Surge',
    'Roll twice and choose when rolling a surge; matching rolls allow any table result.',
  ],
])
add('Barbarian', 'Path of the Giant', 'Bigby', 1372342, [
  [
    3,
    P,
    'Giant Power',
    'Learn Giant (or another language) and Druidcraft or Thaumaturgy, using Wisdom.',
  ],
  [
    3,
    P,
    'Giant’s Havoc',
    'Rage: become Large if space allows, gain 5-foot reach, and apply rage damage to Strength-based thrown attacks.',
  ],
  [
    6,
    P,
    'Elemental Cleaver',
    'On rage imbue one held weapon: acid/cold/fire/lightning/thunder replaces damage, +1d6, thrown 20/60 and instant return. Benefits require your wielding.',
  ],
  [
    6,
    B,
    'Change elemental damage',
    'While raging and holding the imbued weapon, change its elemental type.',
  ],
  [
    10,
    B,
    'Mighty Impel',
    'While raging, throw a Medium-or-smaller creature within reach to a visible space within 30 feet. Unwilling target: Strength save, DC 8 + PB + Strength. Falling applies normally.',
  ],
  [
    14,
    P,
    'Demiurgic Colossus',
    'Rage may make you Huge; reach bonus becomes 10 feet, Cleaver damage 2d6; Impel accepts Large targets.',
  ],
])
add('Bard', 'College of Glamour', 'XGE', 1485825, [
  [
    3,
    B,
    'Mantle of Inspiration',
    'Spend Inspiration: Charisma modifier visible allies within 60 feet gain 5 temporary HP (8/11/14 at levels 5/10/15) and may react to move their speed without opportunity attacks.',
  ],
  [
    3,
    A,
    'Enthralling Performance',
    'Perform 1 minute: Charisma modifier watching humanoids within 60 feet make Wisdom saves or become charmed for 1 hour; damage/threats end it.',
    '1 / short or long rest',
  ],
  [
    6,
    B,
    'Mantle of Majesty',
    'Cast Command free, then concentrate up to 1 minute; bonus-action Command each turn without slots. Creatures charmed by you automatically fail its save.',
    '1 / long rest',
  ],
  [
    14,
    B,
    'Unbreakable Majesty',
    'For 1 minute, attackers first make a Charisma save: failure redirects/wastes attack; success grants disadvantage on saves against your spells next turn.',
    '1 / short or long rest',
  ],
])
add('Bard', 'College of Swords', 'XGE', 213944, [
  [
    3,
    P,
    'Bonus Proficiencies · Swords',
    'Medium armor/scimitars; proficient melee weapons can focus Bard spells. Choose Dueling or Two-Weapon Fighting.',
  ],
  [
    3,
    P,
    'Blade Flourish',
    'Attack action grants +10 speed this turn. Once/turn, weapon hit spends Inspiration: add die to damage and AC (Defensive), damage another creature within 5 feet (Slashing), or push 5 + die feet (Mobile).',
  ],
  [
    3,
    R,
    'Mobile Flourish follow-up',
    'After Mobile Flourish, move up to your speed to a space within 5 feet of the target.',
  ],
  [6, P, 'Extra Attack · Swords', 'Two attacks per Attack action.'],
  [
    14,
    P,
    'Master’s Flourish',
    'Use d6 for a flourish without spending Inspiration, or spend your normal die.',
  ],
])
add('Bard', 'College of Whispers', 'XGE', 1062690, [
  [
    3,
    P,
    'Psychic Blades',
    'Weapon hit on your turn: spend Inspiration for 2d6 psychic (3d6 at 5, 5d6 at 10, 8d6 at 15). Once/round.',
  ],
  [
    3,
    A,
    'Words of Terror',
    'Talk alone with a humanoid for 1 minute; Wisdom save or fear a chosen creature for 1 hour. Damage/attacks end it.',
    '1 / short or long rest',
  ],
  [
    6,
    R,
    'Mantle of Whispers',
    'Capture a dying humanoid’s shadow within 30 feet until used or long rest.',
    '1 / short or long rest',
  ],
  [
    6,
    A,
    'Wear captured shadow',
    'Disguise for 1 hour, including accessible memories; +10 Deception against Insight to detect. Bonus action ends it.',
  ],
  [
    14,
    A,
    'Shadow Lore',
    'Visible listener within 30 feet: Wisdom save or charmed 8 hours through perceived blackmail; obeys reasonable orders. Damage/threats end.',
    '1 / long rest',
  ],
])
add('Bard', 'College of Creation', 'TCE', 1423467, [
  [
    3,
    P,
    'Mote of Potential',
    'Inspiration gains: check—reroll die and choose; attack—target and chosen creatures within 5 feet make Constitution saves or take thunder equal to die; save—temporary HP equal to die + Charisma.',
  ],
  [
    3,
    A,
    'Performance of Creation',
    'Create nonmagical Medium-or-smaller item within 10 feet; maximum value 20 × Bard level gp; lasts PB hours. One at a time. Large at 6, Huge at 14.',
    '1 / long rest; then level 2+ slot',
  ],
  [
    6,
    A,
    'Animating Performance',
    'Animate Large-or-smaller nonmagical item within 30 feet for 1 hour. Uses Dancing Item stat block; shares your initiative, acts after you.',
    '1 / long rest; then level 3+ slot',
  ],
  [
    6,
    B,
    'Command Dancing Item',
    'Commands any action; otherwise it Dodges. Giving Inspiration can include the command.',
  ],
  [
    14,
    P,
    'Creative Crescendo',
    'Create Charisma modifier items (minimum 2); one may use maximum size, others Small/Tiny. Remove gp limit.',
  ],
])
add('Bard', 'College of Eloquence', 'TCE', 441296, [
  [3, P, 'Silver Tongue', 'Deception/Persuasion d20 rolls of 9 or less become 10.'],
  [
    3,
    B,
    'Unsettling Words',
    'Visible creature within 60 feet: spend Inspiration; subtract die from its next save before your next turn.',
  ],
  [6, P, 'Unfailing Inspiration', 'An ally keeps Inspiration when the modified roll fails.'],
  [
    6,
    A,
    'Universal Speech',
    'Charisma modifier creatures within 60 feet understand your speech for 1 hour.',
    '1 / long rest; then any spell slot',
  ],
  [
    14,
    R,
    'Infectious Inspiration',
    'An ally succeeds using Inspiration: give another listener within 60 feet a die without spending your Inspiration pool.',
    'Charisma modifier (minimum 1) / long rest',
  ],
])
add('Bard', 'College of Spirits', 'VRGtR', 537569, [
  [3, P, 'Guiding Whispers', 'Learn Guidance; its range becomes 60 feet.'],
  [
    3,
    P,
    'Spiritual Focus',
    'Candle/crystal ball/skull/spirit board/tarokka deck focuses Bard spells. At 6, spells through it add d6 to one healing or damage roll.',
  ],
  [
    3,
    B,
    'Tales from Beyond',
    'Holding focus, spend Inspiration and roll on the linked Spirit Tales table. Keep one tale until bestowed or rest.',
  ],
  [
    3,
    A,
    'Bestow Spirit Tale',
    'Visible creature within 30 feet receives the stored tale’s effect. Retelling is possible until you roll another tale or rest.',
  ],
  [
    6,
    A,
    'Spirit Session',
    'One-hour ritual during rest: with PB willing participants including yourself, learn one divination/necromancy spell until next long rest; level ≤ participants and your castable maximum.',
    '1 / long rest',
  ],
  [
    14,
    P,
    'Mystical Connection',
    'Roll two tales and choose; matching results let you choose any tale.',
  ],
])
add('Cleric', 'Death Domain', 'DMG', 1176985, [
  [1, P, 'Bonus Proficiency · Death', 'Martial weapons.'],
  [
    1,
    P,
    'Reaper',
    'Learn one necromancy cantrip from any list. A normally single-target necromancy cantrip can target two creatures within 5 feet of each other.',
  ],
  [
    2,
    P,
    'Touch of Death',
    'On melee attack hit: spend Channel Divinity for 5 + twice Cleric level necrotic damage.',
  ],
  [
    6,
    P,
    'Inescapable Destruction',
    'Cleric spells and Channel Divinity ignore necrotic resistance.',
  ],
  [8, P, 'Divine Strike · Death', 'Once on your turn, weapon hit adds 1d8 necrotic (2d8 at 14).'],
  [
    17,
    P,
    'Improved Reaper',
    'Necromancy spells of levels 1–5 normally targeting one creature can target two within 5 feet of each other; pay consumed materials per target.',
  ],
])
add('Cleric', 'Arcana Domain', 'SCAG', 1005689, [
  [
    1,
    P,
    'Arcane Initiate',
    'Arcana proficiency and two Wizard cantrips, treated as Cleric spells using Wisdom.',
  ],
  [
    2,
    A,
    'Arcane Abjuration',
    'Channel Divinity turns one visible celestial/elemental/fey/fiend within 30 feet on failed Wisdom save for 1 minute/until damaged. At 5, banish weak targets instead; CR limits ½/1/2/3/4 at levels 5/8/11/14/17.',
  ],
  [
    6,
    P,
    'Spell Breaker',
    'Healing an ally with a levelled spell can also end one spell on it of a level no higher than the healing slot.',
  ],
  [8, P, 'Potent Spellcasting · Arcana', 'Add Wisdom modifier to Cleric cantrip damage.'],
  [
    17,
    P,
    'Arcane Mastery',
    'Choose one Wizard spell at each level 6–9. These are always-prepared Cleric domain spells.',
  ],
])
add('Cleric', 'Forge Domain', 'XGE', 412193, [
  [1, P, 'Bonus Proficiencies · Forge', 'Heavy armor and smith’s tools.'],
  [
    1,
    P,
    'Blessing of the Forge',
    'After long rest, touch nonmagical armor or simple/martial weapon: +1 AC or attack/damage until next long rest or death. One blessed item.',
  ],
  [
    2,
    A,
    'Artisan’s Blessing',
    'Channel Divinity: one-hour ritual creates a nonmagical metal-containing item worth ≤100 gp, consuming metal/coins of equal value. Duplicate needs original present.',
  ],
  [6, P, 'Soul of the Forge', 'Fire resistance; +1 AC while wearing heavy armor.'],
  [8, P, 'Divine Strike · Forge', 'Once on your turn, weapon hit adds 1d8 fire (2d8 at 14).'],
  [
    17,
    P,
    'Saint of Forge and Fire',
    'Fire immunity; heavy armor grants resistance to nonmagical bludgeoning/piercing/slashing.',
  ],
])
add(
  'Cleric',
  'Grave Domain',
  'XGE',
  'https://www.dndbeyond.com/sources/dnd/xgte/character-options#GraveDomain',
  [
    [
      1,
      P,
      'Circle of Mortality',
      'Healing dice use maximum values when healing a creature at 0 HP. Learn Spare the Dying with 30-foot range and bonus-action casting.',
    ],
    [
      1,
      A,
      'Eyes of the Grave',
      'Until next turn, sense undead within 60 feet not behind total cover or protected from divination.',
      'Wisdom modifier (minimum 1) / long rest',
    ],
    [
      2,
      A,
      'Path to the Grave',
      'Channel Divinity curses one visible creature within 30 feet until your next turn. Next attack by you/ally that hits makes it vulnerable to all that attack’s damage, then ends.',
    ],
    [
      6,
      R,
      'Sentinel at Death’s Door',
      'Turn a visible creature’s critical hit within 30 feet into a normal hit; negate critical-triggered effects.',
      'Wisdom modifier (minimum 1) / long rest',
    ],
    [8, P, 'Potent Spellcasting · Grave', 'Wisdom modifier adds to Cleric cantrip damage.'],
    [
      17,
      P,
      'Keeper of Souls',
      'Once/round, an enemy dying within 60 feet heals you or a creature within 60 feet by its Hit Dice count. Requires no incapacitation.',
    ],
  ],
)
add('Cleric', 'Order Domain', 'TCE', 1645736, [
  [
    1,
    P,
    'Bonus Proficiencies · Order',
    'Heavy armor; choose Intimidation or Persuasion proficiency.',
  ],
  [
    1,
    P,
    'Voice of Authority',
    'Casting a levelled-slot spell on an ally lets one affected ally immediately react with one weapon attack against your chosen visible target.',
  ],
  [
    2,
    A,
    'Order’s Demand',
    'Channel Divinity: chosen seeing/hearing creatures within 30 feet make Wisdom saves or become charmed until your next turn/damaged. Failed targets may be forced to drop held objects.',
  ],
  [
    6,
    B,
    'Embodiment of the Law',
    'Cast a level 1+ enchantment normally taking an action as a bonus action.',
    'Wisdom modifier (minimum 1) / long rest',
  ],
  [8, P, 'Divine Strike · Order', 'Once on your turn, weapon hit adds 1d8 psychic (2d8 at 14).'],
  [
    17,
    P,
    'Order’s Wrath',
    'Your Divine Strike curses target until next turn; next ally hit adds 2d8 psychic then ends curse. One curse per turn.',
  ],
])
add('Cleric', 'Peace Domain', 'TCE', 954813, [
  [1, P, 'Implement of Peace', 'Choose Insight, Performance or Persuasion proficiency.'],
  [
    1,
    A,
    'Emboldening Bond',
    'PB willing creatures within 30 feet bond for 10 minutes. While within 30 feet of another bonded creature, add d4 to one attack/check/save per turn. Reusing ends old bond.',
    'PB / long rest',
  ],
  [
    2,
    A,
    'Balm of Peace',
    'Channel Divinity: move your speed without opportunity attacks; each creature passed within 5 feet can regain 2d6 + Wisdom HP once.',
  ],
  [
    6,
    R,
    'Protective Bond',
    'A bonded creature about to take damage: another within 30 feet may react to teleport within 5 feet and take all damage instead.',
  ],
  [8, P, 'Potent Spellcasting · Peace', 'Wisdom modifier adds to Cleric cantrip damage.'],
  [
    17,
    P,
    'Expansive Bond',
    'Bond ranges become 60 feet; substituting damage recipient gains resistance to that damage.',
  ],
])
add('Cleric', 'Twilight Domain', 'TCE', 605802, [
  [1, P, 'Bonus Proficiencies · Twilight', 'Heavy armor and martial weapons.'],
  [
    1,
    P,
    'Eyes of Night',
    'Darkvision 300 feet. Action: share with Wisdom modifier visible willing creatures within 10 feet for 1 hour; once/long rest or spend a slot.',
  ],
  [
    1,
    A,
    'Vigilant Blessing',
    'Touch one creature to grant advantage on its next initiative. Reuse ends previous blessing.',
  ],
  [
    2,
    A,
    'Twilight Sanctuary',
    'Channel Divinity: 30-foot dim-light sphere follows you for 1 minute until incapacitated/dead. Each creature ending a turn inside may gain 1d6 + Cleric level temporary HP or end one charm/fear.',
  ],
  [
    6,
    B,
    'Steps of Night',
    'In dim light/darkness: flying speed equal to walking speed for 1 minute.',
    'PB / long rest',
  ],
  [8, P, 'Divine Strike · Twilight', 'Once on your turn, weapon hit adds 1d8 radiant (2d8 at 14).'],
  [17, P, 'Twilight Shroud', 'You and allies have half cover inside Twilight Sanctuary.'],
])
add('Druid', 'Circle of Dreams', 'XGE', 1645829, [
  [
    2,
    B,
    'Balm of the Summer Court',
    'Visible ally within 120 feet: spend up to half Druid level d6; heal total and grant 1 temporary HP per die. Pool = Druid level dice, restored on long rest.',
  ],
  [
    6,
    P,
    'Hearth of Moonlight and Shadow',
    'During rest, invisible 30-foot sphere centered on a point you touch: +5 Stealth/Perception for allies inside; firelight cannot escape. Ends on leaving or finishing rest.',
  ],
  [
    10,
    B,
    'Hidden Paths · self',
    'Teleport to a visible space within 60 feet. Shares uses with ally teleport.',
    'Wisdom modifier (minimum 1) / long rest',
  ],
  [
    10,
    A,
    'Hidden Paths · ally',
    'Touch a willing creature to teleport it to a visible space within 30 feet.',
  ],
  [
    14,
    A,
    'Walker in Dreams',
    'After short rest, cast Dream (you as messenger), Scrying, or Teleportation Circle to your last long-rest location, free without materials.',
    '1 / long rest',
  ],
])
add('Druid', 'Circle of the Shepherd', 'XGE', 1022813, [
  [
    2,
    P,
    'Speech of the Woods',
    'Learn Sylvan; beasts understand your speech and you understand their sounds/motions. No automatic friendship.',
  ],
  [
    2,
    B,
    'Spirit Totem',
    'Place intangible spirit within 60 feet: 30-foot aura lasts 1 minute; bonus action moves it within 60 feet. Choose Bear/Hawk/Unicorn each use.',
    '1 / short or long rest',
  ],
  [
    2,
    P,
    'Spirit auras',
    'Bear: allies initially gain 5 + Druid level temporary HP, then Strength check/save advantage. Hawk: reaction grants attack advantage; allies’ Perception advantage. Unicorn: detect-creature check advantage; slot healing also heals chosen allies in aura by Druid level.',
  ],
  [
    6,
    P,
    'Mighty Summoner',
    'Beasts/fey summoned by your spells gain 2 HP per Hit Die; natural weapons count as magical.',
  ],
  [
    10,
    P,
    'Guardian Spirit',
    'Your spell-summoned beasts/fey ending turns in aura heal half Druid level.',
  ],
  [
    14,
    P,
    'Faithful Summons',
    'At 0 HP or unwilling incapacitation: summon four CR 2-or-lower beasts as level-9 Conjure Animals, 1 hour without concentration.',
    '1 / long rest',
  ],
])
add('Druid', 'Circle of Spores', 'TCE', 945210, [
  [
    2,
    R,
    'Halo of Spores',
    'Creature moves within 10 feet or starts turn there: Constitution save or 1d4 necrotic (d6/d8/d10 at 6/10/14).',
  ],
  [
    2,
    A,
    'Symbiotic Entity',
    'Spend Wild Shape: 4 × Druid level temporary HP, doubled Halo dice, melee weapon hits +1d6 necrotic. Lasts 10 minutes, until those temporary HP are lost, or Wild Shape reused.',
  ],
  [
    6,
    R,
    'Fungal Infestation',
    'Small/Medium beast or humanoid dies within 10 feet: animate 1-HP zombie for 1 hour. Acts after you; can only make one melee attack.',
    'Wisdom modifier (minimum 1) / long rest',
  ],
  [
    10,
    B,
    'Spreading Spores',
    'While Symbiotic Entity active, project 10-foot cube within 30 feet for 1 minute; entry/start-turn Halo damage (once/turn), but normal Halo reaction unavailable. Bonus action dismisses.',
  ],
  [
    14,
    P,
    'Fungal Body',
    'Cannot be blinded, deafened, frightened or poisoned. Critical hits become normal unless incapacitated.',
  ],
])
add('Druid', 'Circle of Stars', 'TCE', 1577102, [
  [
    2,
    P,
    'Star Map',
    'Map is spell focus; learn Guidance and always prepare Guiding Bolt; cast it free PB times per long rest. Recreate map in a one-hour rest ritual.',
  ],
  [
    2,
    B,
    'Starry Form',
    'Spend Wild Shape for 10-minute luminous form: Archer (bonus ranged spell attack 60 feet, d8 + Wisdom radiant); Chalice (slot healing heals you/other within 30 feet d8 + Wisdom); Dragon (minimum 10 INT/WIS checks and concentration saves).',
  ],
  [
    6,
    R,
    'Cosmic Omen',
    'After long-rest d6: even grants d6, odd subtracts d6, on a visible creature’s attack/check/save within 30 feet before rolling.',
    'PB / long rest',
  ],
  [
    10,
    P,
    'Twinkling Constellations',
    'Archer/Chalice become 2d8; Dragon gains fly 20 and hover. Change constellation at each turn’s start.',
  ],
  [14, P, 'Full of Stars', 'Starry Form grants bludgeoning/piercing/slashing resistance.'],
])
add('Druid', 'Circle of Wildfire', 'TCE', 876118, [
  [
    2,
    A,
    'Summon Wildfire Spirit',
    'Spend Wild Shape; summon within 30 feet for 1 hour. Others within 10 feet make Dexterity saves or take 2d6 fire. Spirit acts after you; uses linked stat block.',
  ],
  [
    2,
    B,
    'Command Wildfire Spirit',
    'Command Flame Seed or Fiery Teleportation; otherwise spirit Dodges. Teleport carries willing creatures within 5 feet up to 15 feet and damages nearby others.',
  ],
  [
    6,
    P,
    'Enhanced Bond',
    'With spirit summoned, add d8 to one spell healing/fire-damage roll. Non-self spells can originate from spirit.',
  ],
  [
    10,
    R,
    'Cauterizing Flames',
    'Small-or-larger creature dies within 30 feet of you/spirit: leave a 1-minute flame. Seeing someone enter it within 5 feet: extinguish and heal/deal 2d10 + Wisdom.',
    'PB / long rest',
  ],
  [
    14,
    P,
    'Blazing Revival',
    'At 0 HP with spirit within 120 feet: dismiss spirit, recover half maximum HP, stand.',
    '1 / long rest',
  ],
])
add('Fighter', 'Purple Dragon Knight', 'SCAG', 1011335, [
  [
    3,
    P,
    'Rallying Cry',
    'Second Wind also heals up to three allies within 60 feet by Fighter level, if they see/hear you.',
  ],
  [
    7,
    P,
    'Royal Envoy',
    'Persuasion proficiency and doubled proficiency. If already proficient, choose Animal Handling, Insight, Intimidation or Performance instead.',
  ],
  [
    10,
    P,
    'Inspiring Surge',
    'Action Surge lets one ally within 60 feet who sees/hears you react with one weapon attack. At 18, choose two allies.',
  ],
  [
    15,
    P,
    'Bulwark',
    'Indomitable on an Intelligence/Wisdom/Charisma save also lets one seeing/hearing ally within 60 feet reroll the same failed save.',
  ],
])
add('Fighter', 'Arcane Archer', 'XGE', 1646008, [
  [
    3,
    P,
    'Arcane Archer Lore',
    'Choose Arcana or Nature proficiency and Prestidigitation or Druidcraft.',
  ],
  [
    3,
    P,
    'Arcane Shot',
    'Choose two shots from the linked eight options; learn another at 7/10/15/18. Once/turn on shortbow/longbow Attack-action hit, spend a shot; most saves use Intelligence. Banishing/Piercing/Seeking have special triggers.',
    '2 / short or long rest',
  ],
  [
    7,
    P,
    'Magic Arrow',
    'Nonmagical arrows fired from a shortbow/longbow count as magical until hit/miss.',
  ],
  [
    7,
    B,
    'Curving Shot',
    'When a magical arrow misses, reroll against a different target within 60 feet of the original.',
  ],
  [15, P, 'Ever-Ready Shot', 'Rolling initiative with no shots restores one.'],
  [
    18,
    P,
    'Improved Arcane Shots',
    'All shot options gain their level-18 improvements; consult chosen shot’s linked definition.',
  ],
])
add('Fighter', 'Cavalier', 'XGE', 1204927, [
  [
    3,
    P,
    'Bonus Proficiency · Cavalier',
    'Choose Animal Handling, History, Insight, Performance, Persuasion or one language.',
  ],
  [
    3,
    P,
    'Born to the Saddle',
    'Advantage against falling off a mount. Falling ≤10 feet from a mount while not incapacitated: land standing without a reaction. Mount/dismount costs 5 feet.',
  ],
  [
    3,
    P,
    'Unwavering Mark',
    'Melee hit marks until next turn; marked enemy within 5 feet has disadvantage against others. If it damages others, next-turn bonus attack gains advantage and half Fighter level damage.',
    'Special attack: Strength modifier (minimum 1) / long rest',
  ],
  [
    7,
    R,
    'Warding Maneuver',
    'Holding shield/melee weapon: visible attack hitting you/creature within 5 feet gets +d8 AC; if still hit, resist its damage.',
    'Constitution modifier (minimum 1) / long rest',
  ],
  [
    10,
    P,
    'Hold the Line',
    'Opportunity attack when creature moves ≥5 feet within reach; your opportunity-hit sets speed 0.',
  ],
  [
    15,
    P,
    'Ferocious Charger',
    'After 10-foot straight approach and hit, once/turn Strength save or prone. DC = 8 + PB + Strength.',
  ],
  [
    18,
    R,
    'Vigilant Defender',
    'One special opportunity-attack reaction on each creature’s turn, except a turn where you take a normal reaction.',
  ],
])
add('Fighter', 'Samurai', 'XGE', 1258787, [
  [
    3,
    P,
    'Bonus Proficiency · Samurai',
    'Choose History, Insight, Performance, Persuasion or one language.',
  ],
  [
    3,
    B,
    'Fighting Spirit',
    'Advantage on weapon attacks this turn; 5 temporary HP (10 at 10, 15 at 15).',
    '3 / long rest',
  ],
  [
    7,
    P,
    'Elegant Courtier',
    'Add Wisdom modifier to Persuasion; Wisdom save proficiency, or Intelligence/Charisma if already proficient.',
  ],
  [10, P, 'Tireless Spirit', 'Initiative with no Fighting Spirit uses restores one.'],
  [
    15,
    P,
    'Rapid Strike',
    'Once on your turn, trade advantage on one Attack-action weapon attack for one additional weapon attack in that action.',
  ],
  [
    18,
    R,
    'Strength before Death',
    'At 0 HP without outright death: interrupt with an extra turn; damage still causes death-save failures. Fall unconscious afterward if still at 0.',
    '1 / long rest',
  ],
])
add('Fighter', 'Echo Knight', 'EGtW', 955016, [
  [
    3,
    B,
    'Manifest Echo',
    'Summon/dismiss echo within 15 feet; AC 14 + PB, HP 1, condition immunity. Free move 30 feet on your turn; disappears if >30 feet away at turn end.',
  ],
  [
    3,
    B,
    'Echo swap',
    'Teleport by swapping with echo, spending 15 feet of movement. Attack-action attacks can originate from either position.',
  ],
  [
    3,
    R,
    'Echo opportunity attack',
    'Creature within 5 feet of echo moves ≥5 feet away: make opportunity attack from echo’s position.',
  ],
  [
    3,
    P,
    'Unleash Incarnation',
    'Attack action adds one melee attack from echo.',
    'Constitution modifier (minimum 1) / long rest',
  ],
  [
    7,
    A,
    'Echo Avatar',
    'See/hear through echo for up to 10 minutes; blinded/deafened yourself. Echo range becomes 1,000 feet.',
  ],
  [
    10,
    R,
    'Shadow Martyr',
    'Teleport echo within 5 feet of visible attack target; incoming attack targets echo instead.',
    '1 / short or long rest',
  ],
  [
    15,
    P,
    'Reclaim Potential',
    'Destroyed echo grants 2d6 + Constitution temporary HP if you have none.',
    'Constitution modifier (minimum 1) / long rest',
  ],
  [18, P, 'Legion of One', 'Two echoes; initiative with no Incarnation uses restores one.'],
])
add('Fighter', 'Psi Warrior', 'TCE', 407808, [
  [
    3,
    P,
    'Psionic Energy',
    'Pool = twice PB d6, long-rest recovery. Die becomes d8/d10/d12 at Fighter 5/11/17. Bonus action restore one die once per short/long rest.',
  ],
  [
    3,
    R,
    'Protective Field',
    'Visible damage to you/creature within 30 feet: spend die, reduce by die + Intelligence (minimum 1).',
  ],
  [
    3,
    P,
    'Psionic Strike',
    'Once on your turn after weapon hit within 30 feet: spend die for die + Intelligence force damage.',
  ],
  [
    3,
    A,
    'Telekinetic Movement',
    'Move Large-or-smaller loose object or willing creature other than yourself within 30 feet up to 30 feet.',
    '1 / short or long rest; then one die',
  ],
  [
    7,
    B,
    'Psi-Powered Leap',
    'Flying speed twice walking speed until turn end.',
    '1 / short or long rest; then one die',
  ],
  [
    7,
    P,
    'Telekinetic Thrust',
    'Psionic Strike: Strength save or prone / 10-foot horizontal push. DC = 8 + PB + Intelligence.',
  ],
  [10, P, 'Guarded Mind', 'Psychic resistance; spend die at turn start to end your charm/fear.'],
  [
    15,
    B,
    'Bulwark of Force',
    'Intelligence modifier visible creatures within 30 feet gain half cover for 1 minute.',
    '1 / long rest; then one die',
  ],
  [
    18,
    A,
    'Telekinetic Master',
    'Cast Telekinesis using Intelligence; while concentrating, bonus-action weapon attack.',
    '1 / long rest; then one die',
  ],
])
add('Fighter', 'Rune Knight', 'TCE', 1275884, [
  [3, P, 'Bonus Proficiencies · Rune Knight', 'Smith’s tools and Giant.'],
  [
    3,
    P,
    'Rune Carver',
    'Know two runes, plus one at 7/10/15; inscribe different runes on worn/carried objects at long rest. Each grants passive and activated benefits; Hill/Storm require level 7. Rune save DC = 8 + PB + Constitution.',
  ],
  [
    3,
    B,
    'Giant’s Might',
    'For 1 minute become Large if possible; advantage on Strength checks/saves; one weapon/unarmed hit on your turn adds d6.',
    'PB / long rest',
  ],
  [
    7,
    R,
    'Runic Shield',
    'Visible creature within 60 feet hit by attack: force attacker to reroll.',
    'PB / long rest',
  ],
  [10, P, 'Great Stature', 'Height increases 3d4 inches; Giant’s Might damage becomes d8.'],
  [
    15,
    P,
    'Master of Runes',
    'Each known rune can be invoked twice per short/long rest instead of once.',
  ],
  [
    18,
    P,
    'Runic Juggernaut',
    'Giant’s Might: may become Huge, +5-foot reach; damage die becomes d10.',
  ],
])
add('Monk', 'Way of the Long Death', 'SCAG', 1646262, [
  [
    3,
    P,
    'Touch of Death',
    'Reduce creature within 5 feet to 0 HP: gain Monk level + Wisdom modifier temporary HP, minimum 1.',
  ],
  [
    6,
    A,
    'Hour of Reaping',
    'Seeing creatures within 30 feet make Wisdom saves or fear you until your next turn’s end.',
  ],
  [11, P, 'Mastery of Death', 'At 0 HP, spend 1 ki (no action) to have 1 HP instead.'],
  [
    17,
    A,
    'Touch of the Long Death',
    'Touch creature: spend 1–10 ki for 2d10 necrotic per point; Constitution save halves.',
  ],
])
add('Monk', 'Way of the Sun Soul', 'XGE / SCAG', 396594, [
  [
    3,
    A,
    'Radiant Sun Bolt',
    'Attack action may use ranged spell attacks, 30 feet, Dexterity attack/damage and Martial Arts die radiant. After such Attack action, 1 ki permits two more bolts as bonus action.',
  ],
  [
    6,
    B,
    'Searing Arc Strike',
    'After Attack action, cast Burning Hands for 2 ki; +1 spell level per extra ki, total ≤ half Monk level.',
  ],
  [
    11,
    A,
    'Searing Sunburst',
    '150-foot range, 20-foot sphere: Constitution save or 2d6 radiant; successful save takes none. Spend up to 3 ki for +2d6 each. Opaque total cover protects.',
  ],
  [17, P, 'Sun Shield', 'Shed bright/dim light 30/30 feet; bonus action toggles.'],
  [
    17,
    R,
    'Sun Shield retaliation',
    'While glowing, creature hitting with melee attack takes 5 + Wisdom radiant.',
  ],
])
add('Monk', 'Way of the Drunken Master', 'XGE', 470109, [
  [
    3,
    P,
    'Bonus Proficiencies · Drunken Master',
    'Performance proficiency if not already proficient; brewer’s supplies.',
  ],
  [
    3,
    P,
    'Drunken Technique',
    'Flurry of Blows also Disengages and adds 10-foot speed until turn end.',
  ],
  [6, P, 'Leap to Your Feet', 'Standing from prone costs 5 feet.'],
  [
    6,
    R,
    'Redirect Attack',
    'Creature misses you with melee attack: spend 1 ki, make it hit another visible creature within 5 feet instead.',
  ],
  [
    11,
    P,
    'Drunkard’s Luck',
    'Spend 2 ki to cancel disadvantage on an ability check, attack or save.',
  ],
  [
    17,
    P,
    'Intoxicated Frenzy',
    'Flurry may make up to five attacks instead of two, provided each targets a different creature.',
  ],
])
add('Monk', 'Way of the Kensei', 'XGE', 1646260, [
  [
    3,
    P,
    'Path of the Kensei',
    'Choose one melee and one ranged simple/martial weapon type; no heavy/special, except longbow. Proficient and monk weapons. Add type at 6/11/17; painter’s/calligrapher’s tools.',
  ],
  [
    3,
    P,
    'Agile Parry',
    'Holding melee kensei weapon and making an unarmed Attack-action strike grants +2 AC until next turn unless incapacitated.',
  ],
  [3, B, 'Kensei’s Shot', 'Ranged kensei hits add d4 damage this turn.'],
  [
    6,
    P,
    'One with the Blade',
    'Kensei attacks count as magical. Once/turn, spend 1 ki on a hit to add one Martial Arts damage die.',
  ],
  [
    11,
    B,
    'Sharpen the Blade',
    'Spend 1–3 ki: touched kensei weapon gains that attack/damage bonus for 1 minute. No effect on weapons already with magic attack/damage bonus.',
  ],
  [17, P, 'Unerring Accuracy', 'Once per turn, reroll a missed kensei weapon attack.'],
])
add('Monk', 'Way of the Astral Self', 'TCE', 1012239, [
  [
    3,
    B,
    'Arms of the Astral Self',
    '1 ki: 10-minute arms, 10-foot reach on your turn, force unarmed damage using Wisdom; Wisdom may replace Strength checks/saves. Visible chosen creatures within 10 feet make Dexterity saves or take two Martial Arts dice force.',
  ],
  [
    6,
    B,
    'Visage of the Astral Self',
    '1 ki, or free with arms: 10-minute magical/nonmagical darkvision 120 feet; Insight/Intimidation advantage; whispers to one listener within 60 feet or voice heard 600 feet.',
  ],
  [
    11,
    R,
    'Deflect Energy',
    'With arms/visage, reduce acid/cold/fire/force/lightning/thunder damage by Martial Arts die + Wisdom (minimum 1).',
  ],
  [11, P, 'Empowered Arms', 'With arms/visage, one arms hit on your turn adds a Martial Arts die.'],
  [
    17,
    B,
    'Awakened Astral Self',
    '5 ki summons all astral parts for 10 minutes: +2 AC; three attacks with arms per Attack action.',
  ],
])
add('Monk', 'Way of Mercy', 'TCE', 1646263, [
  [3, P, 'Implements of Mercy', 'Insight/Medicine proficiency and herbalism kit.'],
  [
    3,
    A,
    'Hand of Healing',
    '1 ki: touch heals Martial Arts die + Wisdom. Flurry may replace one strike with healing without additional ki.',
  ],
  [
    3,
    P,
    'Hand of Harm',
    'Once/turn, unarmed hit spends 1 ki to add Martial Arts die + Wisdom necrotic.',
  ],
  [
    6,
    P,
    'Physician’s Touch',
    'Healing can end one disease/blind/deaf/paralysis/poison/stun. Harm can poison target until next turn’s end.',
  ],
  [
    11,
    P,
    'Flurry of Healing and Harm',
    'Flurry may replace both strikes with healing; its Harm costs no additional ki, still once/turn.',
  ],
  [
    17,
    A,
    'Hand of Ultimate Mercy',
    '5 ki: touch creature dead ≤24 hours, restore 4d10 + Wisdom HP and end blind/deaf/paralysis/poison/stun.',
    '1 / long rest',
  ],
])
add('Monk', 'Way of the Ascendant Dragon', 'Fizban', 1646082, [
  [
    3,
    R,
    'Draconic Presence',
    'Reroll failed Intimidation/Persuasion; once it succeeds, unavailable until long rest.',
  ],
  [
    3,
    P,
    'Draconic Disciple',
    'Learn Draconic/another language. Unarmed damage may become acid/cold/fire/lightning/poison.',
  ],
  [
    3,
    A,
    'Breath of the Dragon',
    'Replace one Attack-action attack: 20-foot cone or 30-foot × 5-foot line; Dexterity save halves two Martial Arts dice elemental damage, three dice at 11.',
    'PB / long rest; then 2 ki',
  ],
  [
    6,
    P,
    'Wings Unfurled',
    'Step of the Wind grants flying speed equal to walking speed until turn end.',
    'PB / long rest',
  ],
  [
    11,
    B,
    'Aspect of the Wyrm',
    '1-minute 10-foot aura: chosen elemental resistance for allies, or bonus-action Wisdom save to frighten one creature, repeat save at turn end.',
    '1 / long rest; then 3 ki',
  ],
  [
    17,
    P,
    'Ascendant Aspect',
    'Blindsight 10; breath can spend 1 ki for 60-foot cone/90-foot line and four dice. Starting aura deals 3d10 elemental to chosen creatures, Dexterity save halves.',
  ],
])
add('Paladin', 'Oathbreaker', 'DMG', 512594, [
  [
    3,
    A,
    'Control Undead',
    'Channel Divinity: visible undead within 30 feet, Wisdom save; CR must be below Paladin level. Failure obeys for 24 hours/until reuse. DM approval and evil alignment required for subclass.',
  ],
  [
    3,
    A,
    'Dreadful Aspect',
    'Channel Divinity: chosen seeing creatures within 30 feet make Wisdom saves or fear you for 1 minute; repeat save after ending turn beyond 30 feet.',
  ],
  [
    7,
    P,
    'Aura of Hate',
    'You and fiends/undead within 10 feet gain Charisma modifier (minimum 1) melee weapon damage; affects enemies too. Range 30 at 18; requires consciousness.',
  ],
  [15, P, 'Supernatural Resistance', 'Resist nonmagical bludgeoning/piercing/slashing.'],
  [
    20,
    A,
    'Dread Lord',
    '1 minute: 30-foot dim aura harms frightened enemies for 4d10 psychic at turn start, imposes attack disadvantage against you/allies inside; bonus-action spell attack against a shadowed creature for 3d10 + Charisma necrotic.',
    '1 / long rest',
  ],
])
add('Paladin', 'Oath of the Crown', 'SCAG', 1646394, [
  [
    3,
    B,
    'Champion Challenge',
    'Channel Divinity: chosen visible creatures within 30 feet make Wisdom saves or cannot willingly move >30 feet away; ends on your incapacitation/death or separation.',
  ],
  [
    3,
    B,
    'Turn the Tide',
    'Channel Divinity: chosen hearing creatures within 30 feet at ≤half HP regain 1d6 + Charisma HP, minimum 1.',
  ],
  [
    7,
    R,
    'Divine Allegiance',
    'Creature within 5 feet takes damage: substitute yourself for that damage. Cannot reduce/prevent it.',
  ],
  [15, P, 'Unyielding Spirit', 'Advantage on saves against paralysis and stun.'],
  [
    20,
    A,
    'Exalted Champion',
    '1 hour: nonmagical B/P/S resistance; you/allies within 30 feet have Wisdom-save advantage and death-save advantage. Ends on incapacitation.',
    '1 / long rest',
  ],
])
add(
  'Paladin',
  'Oath of Conquest',
  'XGE',
  'https://www.dndbeyond.com/sources/dnd/xgte/character-options#OathofConquest',
  [
    [
      3,
      A,
      'Conquering Presence',
      'Channel Divinity: chosen visible creatures within 30 feet make Wisdom saves or fear you for 1 minute, repeating at turn ends.',
    ],
    [3, P, 'Guided Strike', 'Channel Divinity: add +10 to attack after rolling, before result.'],
    [
      7,
      P,
      'Aura of Conquest',
      'While conscious, creatures frightened of you within 10 feet have speed 0 and take half Paladin level psychic at turn start. Range 30 at 18.',
    ],
    [
      15,
      P,
      'Scornful Rebuke',
      'While not incapacitated, any creature hitting you takes Charisma modifier psychic, minimum 1.',
    ],
    [
      20,
      A,
      'Invincible Conqueror',
      '1 minute: resistance to all damage, three attacks per Attack action, weapon critical range 19–20.',
      '1 / long rest',
    ],
  ],
)
add('Paladin', 'Oath of Redemption', 'XGE', 361550, [
  [3, B, 'Emissary of Peace', 'Channel Divinity: +5 Persuasion for 10 minutes.'],
  [
    3,
    R,
    'Rebuke the Violent',
    'Visible creature within 30 feet damages another with attack: Channel Divinity, Wisdom save; radiant equal to dealt damage, half on success.',
  ],
  [
    7,
    R,
    'Aura of the Guardian',
    'Creature within 10 feet takes damage: take it instead, unreducible; other effects stay on original target. Range 30 at 18.',
  ],
  [
    15,
    P,
    'Protective Spirit',
    'End turn below half HP but above 0: heal 1d6 + half Paladin level.',
  ],
  [
    20,
    P,
    'Emissary of Redemption',
    'Resist all damage from other creatures; their attacks reflect half damage as radiant. Both benefits stop for a creature until long rest if you attack, damage or force its save.',
  ],
])
add('Paladin', 'Oath of Glory', 'TCE', 1190019, [
  [
    3,
    B,
    'Peerless Athlete',
    'Channel Divinity: 10-minute Athletics/Acrobatics advantage, double carrying/lifting, jumps +10 feet (still costs movement).',
  ],
  [
    3,
    B,
    'Inspiring Smite',
    'After Divine Smite: Channel Divinity distributes 2d8 + Paladin level temporary HP among chosen creatures within 30 feet, including yourself.',
  ],
  [
    7,
    P,
    'Aura of Alacrity',
    'Walking speed +10; allies starting turn within 5 feet gain +10 speed until turn end. Range 10 at 18; requires consciousness.',
  ],
  [
    15,
    R,
    'Glorious Defense',
    'Visible hit on you/creature within 10 feet: add Charisma (minimum 1) AC; if it misses, attack attacker if in weapon reach.',
    'Charisma modifier (minimum 1) / long rest',
  ],
  [
    20,
    B,
    'Living Legend',
    'For 1 minute: Persuasion advantage, one miss/turn becomes hit, reaction reroll failed save.',
    '1 / long rest; then level 5 slot',
  ],
])
add('Paladin', 'Oath of the Watchers', 'TCE', 1094802, [
  [
    3,
    A,
    'Watcher’s Will',
    'Channel Divinity: Charisma modifier visible creatures within 30 feet, including you, gain Intelligence/Wisdom/Charisma save advantage for 1 minute.',
  ],
  [
    3,
    A,
    'Abjure the Extraplanar',
    'Channel Divinity: chosen aberrations/celestials/elementals/fey/fiends within 30 feet that hear you make Wisdom saves or are turned for 1 minute/until damaged.',
  ],
  [
    7,
    P,
    'Aura of the Sentinel',
    'You/allies within 10 feet gain PB initiative while conscious; range 30 at 18.',
  ],
  [
    15,
    R,
    'Vigilant Rebuke',
    'You/visible creature within 30 feet succeeds Intelligence/Wisdom/Charisma save: source takes 2d8 + Charisma force.',
  ],
  [
    20,
    B,
    'Mortal Bulwark',
    '1 minute: truesight 120; attacks advantage against extraplanar types; hit forces Charisma save or banishes nonnative target home.',
    '1 / long rest; then level 5 slot',
  ],
])
add('Ranger', 'Gloom Stalker', 'XGE', 400231, [
  [
    3,
    P,
    'Dread Ambusher',
    'Wisdom bonus to initiative. First combat turn: +10 walking speed; Attack action adds one attack, +1d8 damage if it hits.',
  ],
  [
    3,
    P,
    'Umbral Sight',
    'Darkvision 60 feet, or +30 if already present. In darkness, invisible to creatures relying on darkvision to see you.',
  ],
  [
    7,
    P,
    'Iron Mind',
    'Wisdom save proficiency; choose Intelligence/Charisma if already proficient.',
  ],
  [
    11,
    P,
    'Stalker’s Flurry',
    'Once on each turn, missed weapon attack permits another weapon attack in that same action.',
  ],
  [15, R, 'Shadowy Dodge', 'Before visible attacker rolls without advantage, impose disadvantage.'],
])
add('Ranger', 'Horizon Walker', 'XGE', 454067, [
  [
    3,
    A,
    'Detect Portal',
    'Sense distance/direction to closest planar portal within 1 mile.',
    '1 / short or long rest',
  ],
  [
    3,
    B,
    'Planar Warrior',
    'Choose visible creature within 30 feet: next weapon hit this turn becomes force and adds 1d8, or 2d8 at 11.',
  ],
  [
    7,
    B,
    'Ethereal Step',
    'Cast Etherealness without slot; ends at this turn’s end.',
    '1 / short or long rest',
  ],
  [
    11,
    P,
    'Distant Strike',
    'Teleport 10 feet before each Attack-action attack. Attacking two different creatures grants a third attack against another creature.',
  ],
  [15, R, 'Spectral Defense', 'When hit by an attack, resist all that attack’s damage.'],
])
add('Ranger', 'Monster Slayer', 'XGE', 1204925, [
  [
    3,
    A,
    'Hunter’s Sense',
    'Visible creature within 60 feet: learn immunities/resistances/vulnerabilities; protected-from-divination targets appear to have none.',
    'Wisdom modifier (minimum 1) / long rest',
  ],
  [
    3,
    B,
    'Slayer’s Prey',
    'Choose visible creature within 60 feet; first weapon hit each turn adds d6 until next rest or reuse.',
  ],
  [7, P, 'Supernatural Defense', 'Add d6 to saves and grapple-escape checks caused by your prey.'],
  [
    11,
    R,
    'Magic-User’s Nemesis',
    'Visible creature within 60 feet casting/teleporting: Wisdom save or attempt fails/is wasted.',
    '1 / short or long rest',
  ],
  [
    15,
    R,
    'Slayer’s Counter',
    'Before prey-forced save, make one weapon attack against prey; hit automatically succeeds save as well as normal attack effects.',
  ],
])
add('Ranger', 'Fey Wanderer', 'TCE', 1028793, [
  [3, P, 'Dreadful Strikes', 'Weapon hits add d4 psychic per target once/turn; d6 at 11.'],
  [
    3,
    P,
    'Otherworldly Glamour',
    'Add Wisdom modifier (minimum 1) to Charisma checks; choose Deception, Performance or Persuasion proficiency.',
  ],
  [
    7,
    R,
    'Beguiling Twist',
    'Advantage against charm/fear. Visible creature within 120 feet succeeds against charm/fear: another visible creature within 120 feet makes Wisdom save or is charmed/frightened for 1 minute, repeats each turn.',
  ],
  [
    11,
    A,
    'Fey Reinforcements',
    'Learn Summon Fey, free once/long rest. On casting may omit concentration but duration becomes 1 minute.',
  ],
  [
    15,
    B,
    'Misty Wanderer',
    'Misty Step free Wisdom modifier times/long rest. Any Misty Step may bring a willing creature within 5 feet to a space within 5 feet of destination.',
  ],
])
add('Ranger', 'Swarmkeeper', 'TCE', 1154465, [
  [
    3,
    P,
    'Gathered Swarm',
    'Once on your turn after attack hit: +d6 piercing, move target horizontally 15 feet on failed Strength save, or move yourself 5 feet horizontally.',
  ],
  [
    3,
    P,
    'Swarmkeeper Magic',
    'Learn Mage Hand; additional spells do not use Ranger known-spell allowance.',
  ],
  [7, B, 'Writhing Tide', 'For 1 minute gain flying speed 10 feet and hover.', 'PB / long rest'],
  [
    11,
    P,
    'Mighty Swarm',
    'Swarm damage becomes d8; failed push save may also knock prone; moving yourself grants half cover until next turn.',
  ],
  [
    15,
    R,
    'Swarming Dispersal',
    'Taking damage: resist it and teleport to a visible space within 30 feet.',
    'PB / long rest',
  ],
])
add('Ranger', 'Drakewarden', 'Fizban', 1298598, [
  [3, P, 'Draconic Gift', 'Learn Thaumaturgy using Wisdom and Draconic/another language.'],
  [
    3,
    A,
    'Drake Companion',
    'Summon Small drake within 30 feet; choose elemental essence. Acts after you, Dodges unless bonus-commanded; can react with Infused Strikes independently. Linked stat block.',
    '1 / long rest; then any spell slot',
  ],
  [
    7,
    P,
    'Bond of Fang and Scale',
    'Drake Medium with fly 40, bite +d6 essence; you resist essence. Can ride but cannot fly while you ride until 15.',
  ],
  [
    11,
    A,
    'Drake’s Breath',
    'You/drake exhales 30-foot cone, 8d6 chosen elemental damage, Dexterity save halves; 10d6 at 15.',
    '1 / long rest; then level 3+ slot',
  ],
  [15, P, 'Perfected Bond', 'Drake Large, bite +another d6 essence; carries you flying.'],
  [
    15,
    R,
    'Reflexive Resistance',
    'Damage to you/drake within 30 feet: grant resistance to that instance.',
    'PB / long rest',
  ],
])
add('Rogue', 'Mastermind', 'XGE / SCAG', 1330488, [
  [
    3,
    P,
    'Master of Intrigue',
    'Disguise/forgery kits, one gaming set, two languages. Mimic speech/accent heard for 1 minute if you know its language.',
  ],
  [
    3,
    B,
    'Master of Tactics',
    'Help; attack assistance target may be within 30 feet if it sees/hears you.',
  ],
  [
    9,
    P,
    'Insightful Manipulator',
    'After 1 minute observing outside combat, compare two of Intelligence/Wisdom/Charisma/class levels with your own; DM may disclose history/personality.',
  ],
  [
    13,
    R,
    'Misdirection',
    'When targeted while a creature within 5 feet grants you cover, redirect attack to that creature.',
  ],
  [
    17,
    P,
    'Soul of Deceit',
    'Thought reading requires permission; may present false thoughts with Deception vs Insight. Truth-detection magic reports honesty; magic cannot compel truth.',
  ],
])
add('Rogue', 'Swashbuckler', 'XGE / SCAG', 1383462, [
  [
    3,
    P,
    'Fancy Footwork',
    'A creature you melee-attack on your turn cannot opportunity-attack you for that turn.',
  ],
  [
    3,
    P,
    'Rakish Audacity',
    'Charisma bonus to initiative. Sneak Attack also allowed within 5 feet of target if no other creature is within 5 feet of you and you lack disadvantage; normal weapon restrictions apply.',
  ],
  [
    9,
    A,
    'Panache',
    'Shared-language listener: Persuasion vs Insight. Nonhostile charmed 1 minute/until harmed; hostile has disadvantage against others and cannot opportunity-attack them, until ally harms it or separation >60 feet.',
  ],
  [13, B, 'Elegant Maneuver', 'Advantage on next Athletics/Acrobatics check this turn.'],
  [17, P, 'Master Duelist', 'Reroll missed attack with advantage.', '1 / short or long rest'],
])
add('Rogue', 'Inquisitive', 'XGE', 1204923, [
  [3, P, 'Ear for Deceit', 'Insight to detect lies treats d20 ≤7 as 8.'],
  [
    3,
    B,
    'Eye for Detail',
    'Perception to spot hidden creature/object, or Investigation to uncover/decipher clues.',
  ],
  [
    3,
    B,
    'Insightful Fighting',
    'Insight vs visible non-incapacitated creature’s Deception: Sneak Attack against it for 1 minute without advantage, provided no disadvantage; reuse replaces.',
  ],
  [
    9,
    P,
    'Steady Eye',
    'Perception/Investigation advantage if you move no more than half speed this turn.',
  ],
  [
    13,
    A,
    'Unerring Eye',
    'Sense presence of illusions, shapechangers and other deceptive magic within 30 feet; not its nature. Cannot use blinded/deafened.',
    'Wisdom modifier (minimum 1) / long rest',
  ],
  [17, P, 'Eye for Weakness', 'Sneak Attack against Insightful Fighting target adds 3d6.'],
])
add('Rogue', 'Scout', 'XGE', 213432, [
  [
    3,
    R,
    'Skirmisher',
    'Enemy ends turn within 5 feet: move up to half speed without opportunity attacks.',
  ],
  [
    3,
    P,
    'Survivalist',
    'Nature/Survival proficiency if absent; always double proficiency on those two skills. Does not grant two unrestricted Expertise choices.',
  ],
  [9, P, 'Superior Mobility', 'Walking speed +10; existing swimming/climbing speeds also +10.'],
  [
    13,
    P,
    'Ambush Master',
    'Initiative advantage. First creature hit in round one grants advantage to all attacks against it until your next turn.',
  ],
  [
    17,
    B,
    'Sudden Strike',
    'After Attack action, one extra attack may Sneak Attack despite another Sneak Attack this turn, but never twice against the same target in that turn.',
  ],
])
add('Rogue', 'Phantom', 'TCE', 912090, [
  [
    3,
    P,
    'Whispers of the Dead',
    'After each rest, gain one skill/tool proficiency of your choice until reused.',
  ],
  [
    3,
    P,
    'Wails from the Grave',
    'Immediately after Sneak Attack on your turn, another visible creature within 30 feet of first takes half Sneak Attack dice (round up), necrotic.',
    'PB / long rest',
  ],
  [
    9,
    R,
    'Tokens of the Departed',
    'Visible creature dies within 30 feet: free hand captures soul trinket; max PB. While carrying one, Constitution/death-save advantage. Destroy one for another Wails use; action destroy one to ask its spirit one question.',
  ],
  [
    13,
    B,
    'Ghost Walk',
    '10 minutes: fly 10/hover, attacks against you disadvantage, pass through objects as difficult terrain (1d10 force if ending inside). Bonus ends it.',
    '1 / long rest; then destroy trinket',
  ],
  [
    17,
    P,
    'Death’s Friend',
    'Wails also damages original Sneak Attack target; long rest with no trinkets creates one.',
  ],
])
add(
  'Rogue',
  'Soulknife',
  'TCE',
  'https://www.worldanvil.com/w/dorE28099tam-allodar/a/soulknife-article',
  [
    [
      3,
      P,
      'Psionic Energy · Soulknife',
      'Twice PB dice: d6, d8/d10/d12 at Rogue 5/11/17; long-rest recovery. Bonus restore one once/short or long rest.',
    ],
    [
      3,
      P,
      'Psi-Bolstered Knack',
      'Failed proficient skill/tool check: add one die, spent only if success.',
    ],
    [
      3,
      A,
      'Psychic Whispers',
      'PB visible creatures: telepathy up to 1 mile for die-roll hours, any language. First use free per long rest; later spend die.',
    ],
    [
      3,
      A,
      'Psychic Blades',
      'Attack action: free-hand finesse/thrown blade, d6 psychic, range 60, no trace. Bonus second-hand blade d4 after that attack.',
    ],
    [9, P, 'Homing Strikes', 'Missed blade attack: add die, spent only if it hits.'],
    [
      9,
      B,
      'Psychic Teleportation',
      'Spend die, throw blade and teleport up to 10 × roll feet to visible space.',
    ],
    [
      13,
      A,
      'Psychic Veil',
      'Invisible 1 hour until attack/forced save; dismiss freely.',
      '1 / long rest; then one die',
    ],
    [
      17,
      P,
      'Rend Mind',
      'Blade Sneak Attack: Wisdom save or stun 1 minute, repeats at turn end.',
      '1 / long rest; then three dice',
    ],
  ],
)
add('Sorcerer', 'Storm Sorcery', 'XGE / SCAG', 1041224, [
  [1, P, 'Wind Speaker', 'Learn Primordial and understand its elemental dialects.'],
  [
    1,
    B,
    'Tempestuous Magic',
    'Immediately before/after casting a level 1+ spell, fly up to 10 feet without opportunity attacks.',
  ],
  [
    6,
    P,
    'Heart of the Storm',
    'Lightning/thunder resistance. Casting level 1+ lightning/thunder spell deals half Sorcerer level matching damage to chosen visible creatures within 10 feet.',
  ],
  [6, A, 'Storm Guide · rain', 'Stop rain in a 20-foot sphere around you; bonus action ends it.'],
  [
    6,
    B,
    'Storm Guide · wind',
    'Choose wind direction within 100 feet until next turn’s end; cannot change its speed.',
  ],
  [
    14,
    R,
    'Storm’s Fury',
    'Melee attack hits you: attacker takes Sorcerer level lightning and Strength save or pushed 20 feet.',
  ],
  [
    18,
    P,
    'Wind Soul',
    'Lightning/thunder immunity; fly 60. Action: share fly 30 with 3 + Charisma modifier creatures within 30 feet for 1 hour; your fly becomes 30 during this; ends if you die/incapacitated.',
    'Sharing: 1 / short or long rest',
  ],
])
add('Sorcerer', 'Divine Soul', 'XGE', 412267, [
  [
    1,
    P,
    'Divine Magic',
    'May choose Cleric spells/cantrips as Sorcerer spells; normal known limits apply. Affinity grants extra Cure Wounds/Inflict Wounds/Bless/Bane/Protection from Evil and Good; may replace with Cleric spell.',
  ],
  [
    1,
    P,
    'Favored by the Gods',
    'After failed save or missed attack, add 2d4.',
    '1 / short or long rest',
  ],
  [
    6,
    P,
    'Empowered Healing',
    'You/ally within 5 feet rolls spell healing: spend 1 sorcery point to reroll any of those dice once, once/turn.',
  ],
  [
    14,
    B,
    'Otherworldly Wings',
    'Spectral wings grant fly 30 until incapacitated, dead or dismissed as a bonus action.',
  ],
  [
    18,
    B,
    'Unearthly Recovery',
    'When below half maximum HP, regain half maximum HP.',
    '1 / long rest',
  ],
])
add('Sorcerer', 'Shadow Magic', 'XGE', 1379394, [
  [
    1,
    P,
    'Eyes of the Dark',
    'Darkvision 120. At 3 learn Darkness without using known allowance; 2 sorcery points casts it with sight through your own darkness. Slots also allowed.',
  ],
  [
    1,
    P,
    'Strength of the Grave',
    'Damage reducing you to 0: Charisma save DC 5 + damage to stay at 1 HP. Unavailable against radiant damage/criticals.',
    '1 successful use / long rest',
  ],
  [
    6,
    B,
    'Hound of Ill Omen',
    '3 sorcery points: modified dire wolf hunts visible target within 120 feet for up to 5 minutes. Its proximity imposes disadvantage on target saves against your spells; linked hound rules.',
  ],
  [
    14,
    B,
    'Shadow Walk',
    'In dim light/darkness, teleport up to 120 feet to visible dim/dark space.',
  ],
  [
    18,
    B,
    'Umbral Form',
    '6 sorcery points: 1 minute, resist everything except force/radiant; move through creatures/objects as difficult terrain; 5 force if ending turn inside. Bonus action ends.',
  ],
])
add(
  'Sorcerer',
  'Aberrant Mind',
  'TCE',
  'https://www.worldanvil.com/w/etunn-kobu/a/aberrant-mind-article',
  [
    [
      1,
      P,
      'Psionic Spells',
      'Extra known spells; replacements on Sorcerer level-up must be same-level divination/enchantment from Sorcerer/Warlock/Wizard.',
    ],
    [
      1,
      B,
      'Telepathic Speech',
      'Visible creature within 30 feet: two-way shared-language telepathy for Sorcerer level minutes, range Charisma modifier miles (minimum 1). Reuse replaces.',
    ],
    [
      6,
      P,
      'Psionic Sorcery',
      'Cast Psionic Spells for sorcery points equal to spell level; omit verbal/somatic and nonconsumed materials. Normal slots remain available.',
    ],
    [6, P, 'Psychic Defenses', 'Psychic resistance; advantage on saves against charm/fear.'],
    [
      14,
      B,
      'Revelation in Flesh',
      '10 minutes; 1 sorcery point per choice: see invisible within 60 feet; fly/hover equal walk; swim twice walk/water breathing; squeeze through 1-inch spaces, escape restraints for 5-foot movement.',
    ],
    [
      18,
      A,
      'Warping Implosion',
      'Teleport ≤120 feet; creatures within 30 feet of former space make Strength saves or take 3d10 force and pull toward it; success halves/no pull.',
      '1 / long rest; then 5 sorcery points',
    ],
  ],
)
add('Sorcerer', 'Clockwork Soul', 'TCE', 1646963, [
  [
    1,
    P,
    'Clockwork Magic',
    'Extra known spells; level-up replacements must be same-level abjuration/transmutation from Sorcerer/Warlock/Wizard.',
  ],
  [
    1,
    R,
    'Restore Balance',
    'Visible creature within 60 feet about to roll: cancel advantage/disadvantage on attack/check/save.',
    'PB / long rest',
  ],
  [
    6,
    A,
    'Bastion of Law',
    'Spend 1–5 sorcery points, ward you/creature within 30 feet with that many d8. Recipient reacts to damage to spend dice, reducing damage. Ends on your long rest/reuse.',
  ],
  [
    14,
    B,
    'Trance of Order',
    'For 1 minute, attacks against you cannot gain advantage; your checks/attacks/saves treat d20 ≤9 as 10.',
    '1 / long rest; then 5 sorcery points',
  ],
  [
    18,
    A,
    'Clockwork Cavalcade',
    '30-foot cube centered on you: distribute 100 healing HP, repair damaged objects, end chosen spells level ≤6 on creatures/objects.',
    '1 / long rest; then 7 sorcery points',
  ],
])
add(
  'Sorcerer',
  'Lunar Sorcery',
  'Dragonlance',
  'https://www.worldanvil.com/w/kosmos-dnd-lukasthewolf/a/lunar-sorcery-article',
  [
    [
      1,
      P,
      'Lunar Embodiment',
      'Gain lunar spells outside known limit; choose Full/New/Crescent phase each long rest. Cast that phase’s level-1 spell free once per long rest.',
    ],
    [
      1,
      A,
      'Moon Fire',
      'Learn Sacred Flame; may target two creatures within 5 feet of each other.',
    ],
    [
      6,
      P,
      'Lunar Boons',
      'Matching-school Metamagic costs 1 point less, minimum 0, PB times/long rest: Full—abjuration/divination; New—enchantment/necromancy; Crescent—illusion/transmutation.',
    ],
    [
      6,
      B,
      'Waxing and Waning',
      '1 sorcery point changes phase; each phase’s level-1 free spell is separately available once/long rest.',
    ],
    [
      14,
      P,
      'Lunar Empowerment',
      'Full: toggle 10/10-foot light; chosen creatures there gain Investigation/Perception advantage. New: Stealth advantage; attacks against you disadvantage in total darkness. Crescent: radiant/necrotic resistance.',
    ],
    [
      18,
      B,
      'Lunar Phenomenon',
      'Full: Constitution save blinds chosen creatures within 30 feet, heal one 3d8. New: Dexterity save or 3d10 necrotic/speed 0, become invisible until next turn or attack/cast. Crescent: teleport 60 with adjacent ally; both resist all damage until next turn.',
      'Each phase: 1 / long rest; then 5 sorcery points',
    ],
  ],
)
add('Warlock', 'The Undying', 'SCAG', 658763, [
  [
    1,
    P,
    'Among the Dead',
    'Learn Spare the Dying, disease-save advantage. Undead directly targeting you make Wisdom saves or retarget/waste; success or your harm to that undead grants it 24-hour immunity. Area effects bypass protection.',
  ],
  [
    6,
    P,
    'Defy Death',
    'Successful death save or Spare the Dying stabilizing another heals you 1d8 + Constitution, minimum 1.',
    '1 / long rest',
  ],
  [
    10,
    P,
    'Undying Nature',
    'No breathing, eating, drinking or sleep needed (rest still required); magical aging immunity; age at one-tenth rate.',
  ],
  [
    14,
    B,
    'Indestructible Life',
    'Regain 1d8 + Warlock level HP; reattach a severed part held to its stump during this use.',
    '1 / short or long rest',
  ],
])
add('Warlock', 'The Celestial', 'XGE', 815171, [
  [
    1,
    P,
    'Bonus Cantrips · Celestial',
    'Learn Light and Sacred Flame outside normal cantrip allowance.',
  ],
  [
    1,
    B,
    'Healing Light',
    'Visible creature within 60 feet: spend up to Charisma modifier d6 (minimum 1) to heal total. Pool = 1 + Warlock level dice, long-rest recovery.',
  ],
  [
    6,
    P,
    'Radiant Soul',
    'Radiant resistance; add Charisma modifier to one fire/radiant spell damage roll against one target.',
  ],
  [
    10,
    P,
    'Celestial Resilience',
    'After rest, gain Warlock level + Charisma temporary HP; up to five visible allies gain half Warlock level + Charisma temporary HP.',
  ],
  [
    14,
    P,
    'Searing Vengeance',
    'Instead of turn-start death save: heal half maximum HP, may stand; chosen creatures within 30 feet take 2d8 + Charisma radiant and are blinded until turn end.',
    '1 / long rest',
  ],
])
add('Warlock', 'The Hexblade', 'XGE', 1204922, [
  [
    1,
    B,
    'Hexblade’s Curse',
    'Visible creature within 30 feet for 1 minute: +PB damage, crit 19–20, its death heals Warlock level + Charisma (minimum 1). Ends on your death/incapacitation.',
    '1 / short or long rest',
  ],
  [
    1,
    P,
    'Hex Warrior',
    'Medium armor/shields/martial weapons. After long rest choose proficient non-two-handed weapon for Charisma attacks/damage; also applies to Pact weapons.',
  ],
  [
    6,
    P,
    'Accursed Specter',
    'When you slay a humanoid, raise specter until next long rest; half Warlock level temporary HP; Charisma attack bonus, minimum 0; own initiative, verbal commands.',
    '1 / long rest',
  ],
  [10, R, 'Armor of Hexes', 'Cursed target hits you: d6 result 4–6 turns hit into miss.'],
  [
    14,
    P,
    'Master of Hexes',
    'When cursed target dies, may curse another visible creature within 30 feet without an action; foregoing healing from that death.',
  ],
])
add('Warlock', 'The Fathomless', 'TCE', 775854, [
  [
    1,
    B,
    'Tentacle of the Deeps',
    'Create tentacle within 60 feet for 1 minute: melee spell attack against target within 10 feet, d8 cold and -10 speed until next turn. Later bonus actions move it 30 feet/repeat attack. Damage 2d8 at 10.',
    'PB summons / long rest',
  ],
  [1, P, 'Gift of the Sea', 'Swim 40 feet and underwater breathing.'],
  [
    6,
    P,
    'Oceanic Soul',
    'Cold resistance; underwater mutual understanding with speaking creatures.',
  ],
  [
    6,
    R,
    'Guardian Coil',
    'Visible you/creature within 10 feet of tentacle takes damage: reduce d8, or 2d8 at 10.',
  ],
  [
    10,
    A,
    'Grasping Tentacles',
    'Learn Evard’s Black Tentacles, free once/long rest; casting gives Warlock level temporary HP and damage cannot break its concentration.',
  ],
  [
    14,
    A,
    'Fathomless Plunge',
    'Teleport you and five willing creatures within 30 feet up to 1 mile to a previously seen body of water large enough for everyone.',
    '1 / short or long rest',
  ],
])
add('Warlock', 'The Genie', 'TCE', 956640, [
  [
    1,
    P,
    'Genie’s Wrath',
    'Once on your turn, attack hit adds PB damage: Dao bludgeoning, Djinni thunder, Efreeti fire or Marid cold.',
  ],
  [
    1,
    A,
    'Bottled Respite',
    'Enter vessel up to twice PB hours; bonus action exits. Vessel AC spell DC, HP Warlock level + PB, poison/psychic immunity. Destroyed vessel ejects contents; replace through one-hour rest ritual.',
    '1 / long rest',
  ],
  [6, P, 'Elemental Gift', 'Resist patron damage type.'],
  [6, B, 'Elemental flight', 'Fly/hover 30 feet for 10 minutes.', 'PB / long rest'],
  [
    10,
    P,
    'Sanctuary Vessel',
    'Bring five willing visible creatures within 30 feet; bonus ejects guests. Ten minutes inside grants short rest, and spent Hit Dice gain PB healing.',
  ],
  [
    14,
    A,
    'Limited Wish',
    'Request any level ≤6 spell effect with one-action casting, ignoring requirements/components; effects resolved as that spell.',
    '1 / 1d4 long rests',
  ],
])
add('Warlock', 'The Undead', 'VRGtR', 1477629, [
  [
    1,
    B,
    'Form of Dread',
    '1 minute: 1d10 + Warlock level temporary HP, fear immunity; once on each turn attack hit forces Wisdom save or fear until next turn’s end.',
    'PB / long rest',
  ],
  [
    6,
    P,
    'Grave Touched',
    'No food/drink/breathing needed. Once/turn change attack damage to necrotic; in Dread, roll one additional damage die.',
  ],
  [
    10,
    P,
    'Necrotic Husk',
    'Necrotic resistance; immunity in Dread. At 0 HP, stay at 1 instead and explode: chosen creatures within 30 feet take 2d10 + Warlock level necrotic; gain one exhaustion.',
    'Explosion: 1 / 1d4 long rests',
  ],
  [
    14,
    A,
    'Spirit Projection',
    'Project spirit up to 1 hour with concentration; body unconscious. Body/spirit resist B/P/S, spirit flies/hover and phases; omit necromancy/conjuration components except costly materials. In Dread, heal half one necrotic instance per turn.',
    '1 / long rest',
  ],
])
add('Wizard', 'Bladesinging', 'TCE revision', 957192, [
  [
    2,
    P,
    'Training in War and Song',
    'Light armor, one chosen one-handed melee weapon, Performance proficiency. Uses TCE’s 2014 revision, without SCAG’s elf restriction.',
  ],
  [
    2,
    B,
    'Bladesong',
    '1 minute: +Intelligence AC/concentration saves (minimum 1), +10 walk, Acrobatics advantage. Ends if incapacitated, using medium/heavy armor/shield, or attacking with two hands.',
    'PB / long rest',
  ],
  [
    6,
    P,
    'Extra Attack · Bladesinging',
    'Two attacks per Attack action; one may be replaced by casting a cantrip.',
  ],
  [10, R, 'Song of Defense', 'In Bladesong, spend spell slot to reduce damage by 5 × slot level.'],
  [
    14,
    P,
    'Song of Victory',
    'In Bladesong, melee weapon damage adds Intelligence modifier, minimum 1.',
  ],
])
add('Wizard', 'War Magic', 'XGE', 787372, [
  [
    2,
    R,
    'Arcane Deflection',
    'Hit by attack or failed save: +2 AC or +4 save. Until end of your next turn, may cast only cantrips.',
  ],
  [2, P, 'Tactical Wit', 'Intelligence bonus to initiative.'],
  [
    6,
    P,
    'Power Surge',
    'Pool cap Intelligence (minimum 1); long rest resets to one, short rest restores one only if empty. Counterspell/Dispel Magic successes earn surges. Once/turn, Wizard spell damage spends one for half Wizard level force.',
  ],
  [10, P, 'Durable Magic', 'While concentrating, +2 AC and all saves.'],
  [
    14,
    P,
    'Deflecting Shroud',
    'Arcane Deflection also deals half Wizard level force to up to three chosen visible creatures within 60 feet.',
  ],
])
add('Wizard', 'Chronurgy Magic', 'EGtW', 957188, [
  [
    2,
    R,
    'Chronal Shift',
    'After visible creature within 30 feet or you rolls attack/check/save and result known: force reroll, must use new result.',
    '2 / long rest',
  ],
  [2, P, 'Temporal Awareness', 'Intelligence bonus to initiative.'],
  [
    6,
    A,
    'Momentary Stasis',
    'Visible Large-or-smaller creature within 60 feet: Constitution save or incapacitated/speed 0 until next turn’s end or damaged.',
    'Intelligence modifier (minimum 1) / long rest',
  ],
  [
    10,
    P,
    'Arcane Abeyance',
    'Slot spell level ≤4 can be held in a 1-HP bead for 1 hour. Holder uses action to release, using your spell attack/DC but their concentration. Destruction/expiry loses spell.',
    '1 / short or long rest',
  ],
  [
    14,
    R,
    'Convergent Future',
    'You/visible creature within 60 feet rolls attack/check/save: choose minimum success or one below required success instead. Gain exhaustion, removable only by long rests.',
  ],
])
add('Wizard', 'Graviturgy Magic', 'EGtW', 1041157, [
  [
    2,
    A,
    'Adjust Density',
    'Visible Large-or-smaller creature/object within 30 feet, concentration 1 minute: halve weight (+10 speed, Strength disadvantage, double jump) or double weight (-10 speed, Strength advantage). Huge allowed at 10.',
  ],
  [
    6,
    P,
    'Gravity Well',
    'Your spell target may move 5 feet to chosen empty space if willing, hit by spell attack, or failed its save.',
  ],
  [
    10,
    R,
    'Violent Attraction',
    'Visible weapon hit within 60 feet adds d10 damage, or falling creature within 60 feet takes extra 2d10.',
    'Intelligence modifier (minimum 1) / long rest',
  ],
  [
    14,
    A,
    'Event Horizon',
    'Concentration up to 1 minute: enemies starting within 30 feet make Strength saves or take 2d10 force/speed 0; success halves damage, each foot costs 2 extra movement.',
    '1 / long rest; then level 3+ slot',
  ],
])
add(
  'Wizard',
  'Order of Scribes',
  'TCE',
  'https://www.worldanvil.com/w/ashieldr-dragonhunter877/a/order-of-scribes-article',
  [
    [
      2,
      B,
      'Wizardly Quill',
      'Create inkless quill; copy spells in 2 minutes per spell level; erase own writing as bonus action.',
    ],
    [
      2,
      P,
      'Awakened Spellbook',
      'Book is focus. Slot-spell damage type may match another book spell at that slot level. Cast one ritual at normal casting time per long rest. Replace book by one-hour rest procedure.',
    ],
    [
      6,
      B,
      'Manifest Mind',
      'Project book’s spectral mind within 60 feet, moving it 30 with bonus action, maximum 300-foot separation. See/hear through it; PB spell castings from its space per long rest.',
      '1 / long rest; then any spell slot',
    ],
    [
      10,
      P,
      'Master Scrivener',
      'After long rest make one free scroll: book spell level 1/2, casting 1 action, cast one level higher, expires next long rest. Normal scroll crafting time/cost halved.',
    ],
    [
      14,
      R,
      'One with the Word',
      'Dismiss manifested mind to prevent all incoming damage. Choose book spells totaling at least a 3d6 roll in levels; lose access for 1d6 long rests, even via scrolls/other books. If insufficient spells, drop to 0 HP. Book on your person grants Arcana advantage.',
      '1 / long rest',
    ],
  ],
)
add('Artificer', '', 'TCE', 919558, [
  [
    1,
    A,
    'Magical Tinkering',
    'Touch Tiny nonmagical object with artisan’s/thieves’ tools: light, recorded message, sensory effect or visual text. Limit Intelligence modifier, minimum 1. Action ends an effect.',
  ],
  [
    1,
    P,
    'Artificer Spellcasting',
    'Intelligence, prepared spells. Every spell requires a proficient tool or infused item as material focus, even without printed materials. Rituals require preparation.',
  ],
  [
    2,
    P,
    'Infuse Item',
    'Choose learned infusions; apply to nonmagical items at long rest. Each infusion once, one per item except Armorer; attunement requirements still apply. Known/active: 4/2; 6/3 at 6; 8/4 at 10; 10/5 at 14; 12/6 at 18.',
  ],
  [
    3,
    A,
    'The Right Tool for the Job',
    'With tools, spend 1 hour (may overlap rest) creating an artisan’s tool set; disappears on reuse.',
  ],
  [
    4,
    P,
    'Ability Score Improvement · Artificer',
    'At Artificer levels 4/8/12/16/19; normal score cap 20, optional feats by DM.',
  ],
])
add('Artificer', '', 'TCE', 662220, [
  [
    6,
    P,
    'Tool Expertise',
    'Double proficiency for checks using proficient tools; does not add skill Expertise choices.',
  ],
  [
    7,
    R,
    'Flash of Genius',
    'Visible you/creature within 30 feet makes check/save: add Intelligence modifier.',
    'Intelligence modifier (minimum 1) / long rest',
  ],
  [
    10,
    P,
    'Magic Item Adept',
    'Attune up to four items; common/uncommon magic crafting costs half and takes quarter time.',
  ],
  [
    11,
    P,
    'Spell-Storing Item',
    'After long rest, store level-1/2 Artificer-list action spell in weapon/focus. Holder uses action with your spell ability, own concentration, up to twice Intelligence modifier uses (minimum 2); no slot consumed.',
  ],
  [
    14,
    P,
    'Magic Item Savant',
    'Attune up to five items; ignore class/race/spell/level requirements for using or attuning magic items.',
  ],
  [18, P, 'Magic Item Master', 'Attune up to six items.'],
  [
    20,
    P,
    'Soul of Artifice',
    '+1 to all saves per attuned item. At 0 HP, reaction ends one infusion to remain at 1 HP.',
  ],
])
add('Artificer', 'Alchemist', 'TCE', 385000, [
  [
    3,
    P,
    'Tool Proficiency · Alchemist',
    'Alchemist’s supplies; choose another artisan’s tool if already proficient.',
  ],
  [
    3,
    P,
    'Experimental Elixir',
    'Long rest creates one random d6 elixir (two at 6, three at 15); expires next long rest. Action and level-1+ slot create chosen elixir. Action drink or administer to incapacitated creature.',
  ],
  [
    3,
    P,
    'Elixir effects',
    '1: heal 2d4 + Intelligence; 2: +10 speed/1 hour; 3: +1 AC/10 minutes; 4: +d4 attacks/saves/1 minute; 5: fly 10/10 minutes; 6: Alter Self transformation/10 minutes.',
  ],
  [
    5,
    P,
    'Alchemical Savant',
    'With alchemist’s supplies as focus, add Intelligence to one spell roll healing or acid/fire/necrotic/poison damage.',
  ],
  [
    9,
    P,
    'Restorative Reagents',
    'Elixir grants 2d6 + Intelligence temporary HP. Lesser Restoration free Intelligence modifier times/long rest, tools required.',
  ],
  [
    15,
    P,
    'Chemical Mastery',
    'Acid/poison resistance and poisoned immunity; Greater Restoration and Heal each free once/long rest, tools required.',
  ],
])
add('Artificer', 'Armorer', 'TCE', 832980, [
  [
    3,
    P,
    'Tools of the Trade · Armorer',
    'Heavy armor and smith’s tools; substitute artisan’s tool if already proficient.',
  ],
  [
    3,
    A,
    'Arcane Armor',
    'With smith’s tools, turn worn armor into focus; no Strength requirement, covers missing limbs, cannot be removed unwillingly. Don/doff as action. Model changes after short/long rest with tools.',
  ],
  [
    3,
    P,
    'Guardian model',
    'Thunder gauntlets: simple melee d8 thunder, Intelligence attacks; hit disadvantages other-target attacks until next turn. Bonus Defensive Field: Artificer level temporary HP, PB times/long rest.',
  ],
  [
    3,
    P,
    'Infiltrator model',
    'Lightning Launcher: simple ranged d6 lightning, range 90/300, Intelligence; once on your turn add d6. +5 walk, Stealth advantage (cancels armor disadvantage).',
  ],
  [5, P, 'Extra Attack · Armorer', 'Two attacks per Attack action.'],
  [
    9,
    P,
    'Armor Modifications',
    'Armor/chest, boots, helmet and special weapon are separate infusion targets; two extra active infusions must occupy armor.',
  ],
  [
    15,
    P,
    'Perfected Armor',
    'Guardian: reaction Strength save pulls a creature ending within 30 feet, then melee attack if adjacent, PB uses/long rest. Infiltrator: hit gives target light and attack disadvantage against you; next attack has advantage and +d6 lightning.',
  ],
])
add('Artificer', 'Artillerist', 'TCE', 585502, [
  [
    3,
    P,
    'Tool Proficiency · Artillerist',
    'Woodcarver’s tools; substitute artisan’s tool if already proficient.',
  ],
  [
    3,
    A,
    'Eldritch Cannon',
    'With tools, create Small/Tiny cannon within 5 feet for 1 hour: AC18, HP5 × Artificer level; mending heals 2d6. One cannon initially.',
    '1 / long rest; then any slot',
  ],
  [
    3,
    B,
    'Activate cannon',
    'Within 60 feet, activate and move 15 feet: Flamethrower 15-foot cone 2d8 fire/Dexterity half; Force Ballista ranged spell attack 120 feet, 2d8 force/push5; Protector chosen creatures within10 gain d8 + Intelligence temporary HP.',
  ],
  [
    5,
    P,
    'Arcane Firearm',
    'After long rest, inscribe wand/staff/rod as focus; spells cast through it add d8 to one damage roll.',
  ],
  [
    9,
    P,
    'Explosive Cannon',
    'Cannon damage +d8. Action detonate within60: 20-foot blast, 3d8 force/Dexterity half.',
  ],
  [
    15,
    P,
    'Fortified Position',
    'Allies within10 of cannon have half cover. Two cannons, same creation action (separate slots) and activation bonus action.',
  ],
])
add('Artificer', 'Battle Smith', 'TCE', 1645366, [
  [
    3,
    P,
    'Tool Proficiency · Battle Smith',
    'Smith’s tools; substitute artisan’s tool if already proficient.',
  ],
  [
    3,
    P,
    'Battle Ready',
    'Martial weapon proficiency; magic weapons may use Intelligence for attack/damage.',
  ],
  [
    3,
    P,
    'Steel Defender',
    'Companion uses linked stat block; acts after you, moves/reacts independently, Dodges unless bonus-commanded. Mending heals 2d6; action/slot revives within1 hour; tools replace at long rest.',
  ],
  [
    3,
    B,
    'Command Steel Defender',
    'Command its action instead of Dodge, including Force-Empowered Rend or Repair.',
  ],
  [
    3,
    R,
    'Deflect Attack · defender',
    'Defender imposes disadvantage on an attack by a visible attacker within5 against anyone except the defender. Uses defender’s reaction.',
  ],
  [5, P, 'Extra Attack · Battle Smith', 'Two attacks per Attack action.'],
  [
    9,
    P,
    'Arcane Jolt',
    'Once/turn, your magic-weapon hit or defender hit: +2d6 force or heal visible creature within30 of target 2d6.',
    'Intelligence modifier (minimum 1) / long rest',
  ],
  [
    15,
    P,
    'Improved Defender',
    'Jolt becomes 4d6; defender +2 AC; Deflect attacker takes d4 + Intelligence force.',
  ],
])
entries.find((a) => a.name === 'One with the Word')!.url =
  'https://whitelabel.worldanvil.com/block/1390288'
export const EXPANSION_ABILITIES = entries
export function expansionAbilitiesFor(c: ClassChoice, settings: RuleSettings): Ability[] {
  const sub = canonicalSubclass(c.name, c.subclass),
    ids = settings.selections ?? []
  const selected = (group: string) =>
    ids.find((id) => id.startsWith(`${c.name}:${group}:`))?.slice(`${c.name}:${group}:`.length)
  const result = entries
    .filter(
      (a) => a.className === c.name && a.level! <= c.level && (!a.subclass || a.subclass === sub),
    )
    .flatMap((a) => {
      if (sub === 'Path of the Storm Herald' && a.name.startsWith('Raging Storm')) {
        const env = selected('storm')
        if (a.name.endsWith('Desert')) return env === 'Desert' ? [a] : []
        if (!['Sea', 'Tundra'].includes(env ?? '')) return []
        return [
          {
            ...a,
            name: `Raging Storm · ${env}`,
            detail:
              env === 'Sea'
                ? 'While raging, after hitting a creature in your aura: Strength save or prone. DC = 8 + PB + Constitution.'
                : 'On Storm Aura activation, one visible creature in aura: Strength save or speed 0 until your next turn. DC = 8 + PB + Constitution.',
          },
        ]
      }
      if (sub === 'Armorer' && a.name === 'Perfected Armor' && selected('armor'))
        return [
          {
            ...a,
            economy: selected('armor') === 'Guardian' ? 'Reaction' : 'Passive',
            detail:
              selected('armor') === 'Guardian'
                ? 'Visible Huge-or-smaller creature ends turn within30: Strength save or pull it up to30 feet; if adjacent, melee weapon attack as part of reaction. PB uses per long rest.'
                : 'Lightning Launcher hit gives light and disadvantage attacking you; next attack against it has advantage and adds d6 lightning.',
          } as Ability,
        ]
      return [a]
    })
  const extra = (parent: string, name: string, economy: Economy, detail: string, cost?: string) => {
    const origin = result.find((a) => a.name === parent)
    if (origin) result.push({ ...origin, name, economy, detail, cost })
  }
  extra(
    'Soul of Artifice',
    'Soul of Artifice · avert 0 HP',
    'Reaction',
    'When reduced to 0 HP, end one active infusion to have 1 HP instead.',
    '1 active infusion',
  )
  extra(
    'Dread Lord',
    'Dread Lord · shadow attack',
    'Bonus action',
    'While Dread Lord is active: melee spell attack against a creature in the aura for 3d10 + Charisma necrotic.',
  )
  extra(
    'Sun Shield',
    'Sun Shield · toggle light',
    'Bonus action',
    'Turn your Sun Shield light on or off.',
  )
  if (sub === 'Rune Knight' && ids.includes('Fighter:rune:Storm') && c.level >= 7) {
    const origin = result.find((a) => a.name === 'Rune Carver')!
    result.push({
      ...origin,
      name: 'Storm rune · alter roll',
      economy: 'Reaction',
      detail:
        'While your Storm rune is activated, give advantage/disadvantage before a visible creature within60 rolls an attack, save or ability check.',
    })
  }
  return result
}

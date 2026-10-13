import legacy from './data/legacy-abilities.json' with { type: 'json' }
import racialTraits from './data/legacy-races.json' with { type: 'json' }
import type { Workbook } from './sheetModel'
import type { Ability, ClassChoice, Reader, RuleSettings, Economy } from './companionRules'
import { characterClasses } from './companionRules.ts'
import { listedSpells, spellEconomy, findSpell } from './legacySpells.ts'
import { subclassSpellGrants } from './subclassSpells.ts'
import { usesKnownSpellList } from './castingRules.ts'
import { PHB_ADDITIONAL_ABILITIES, canonicalSubclass } from './phbSubclassRules.ts'
import { EXPANSION_ABILITIES, expansionAbilitiesFor } from './expansionAbilities.ts'
import { selectedFeatureAbilities, featureChoiceIssues } from './featureChoices.ts'
export const SRD_URL = 'https://media.wizards.com/2023/downloads/dnd/SRD_CC_v5.1.pdf'
export const PUGILIST_URL = 'https://www.worldanvil.com/block/205750'
const subclassAliases: Record<string, string> = {
  'Bard:Lore': 'College of Lore',
  'Cleric:Life': 'Life Domain',
  'Druid:Land': 'Circle of the Land',
  'Monk:Open Hand': 'Way of the Open Hand',
  'Paladin:Devotion': 'Oath of Devotion',
  'Warlock:Fiend': 'The Fiend',
  'Wizard:Evocation': 'School of Evocation',
}
const pugi: [number, Economy, string, string, string?][] = [
  [
    1,
    'Bonus action',
    'Fisticuffs follow-up',
    'After a qualifying Attack: one unarmed strike or grapple. Light/no armor; no shield; pugilist weapons only.',
  ],
  [1, 'Passive', 'Fisticuffs', 'Uses Strength; no finesse. Damage die scales with Pugilist level.'],
  [1, 'Passive', 'Iron Chin', 'AC = 12 + Constitution modifier; light/no armor and no shield.'],
  [
    2,
    'Bonus action',
    'Brace Up',
    'Temporary HP = Fisticuffs die + Pugilist level + Constitution modifier.',
    '1 Moxie',
  ],
  [2, 'Bonus action', 'The Old One-Two', 'After Attack: two unarmed strikes.', '1 Moxie'],
  [
    2,
    'Bonus action',
    'Stick and Move',
    'Shove or Dash. Dash adds movement equal to speed.',
    '1 Moxie',
  ],
  [
    2,
    'Passive',
    'Street Smart',
    'Rest/carousing and settlement navigation benefits; see reference.',
  ],
  [
    3,
    'Reaction',
    'Bloodied but Unbowed',
    'Damage leaves HP at half maximum or less: temporary HP = level + Constitution modifier; refill Moxie.',
    '1 / short or long rest',
  ],
  [4, 'Bonus action', 'Dig Deep', 'B/P/S resistance, 1 minute; then +1 exhaustion.'],
  [
    4,
    'Passive',
    'Ability Score Improvement',
    'At levels 4, 8, 12, 16 and 19: improve ability scores, or use your DM’s feat option. Record your chosen changes in the sheet.',
  ],
  [5, 'Passive', 'Extra Attack', 'Two attacks per Attack action on your turn.'],
  [
    5,
    'Passive',
    'Haymaker',
    'Declare before an attack without disadvantage. Weapon attacks have disadvantage this turn; qualifying weapon damage dice use maximum results.',
  ],
  [
    6,
    'Passive',
    'Moxie-Fueled Fists',
    'Unarmed strikes count as magical against resistance/immunity.',
  ],
  [7, 'Passive', 'Fancy Footwork', 'Dexterity saving throw proficiency.'],
  [7, 'Action', 'Shake It Off', 'End one charmed or frightened effect on yourself.'],
  [
    9,
    'Passive',
    'Down but Not Out',
    'On Bloodied but Unbowed: +PB damage for 1 minute.',
    '1 / long rest',
  ],
  [
    10,
    'Passive',
    'School of Hard Knocks',
    'Psychic resistance; advantage against stunned/unconscious effects.',
  ],
  [13, 'Passive', 'Rabble Rouser', 'Conditional settlement Charisma check advantage.'],
  [
    14,
    'Passive',
    'Unbreakable',
    'Physical saving throw advantage; failed-save reroll costs 1 Moxie.',
  ],
  [
    15,
    'Movement',
    'Herculean',
    'Standing jumps use running distances; carrying and object damage benefits.',
  ],
  [
    18,
    'Passive',
    'Fighting Spirit',
    'At 0 HP, exhaustion ≤4: recover half maximum HP/Moxie; +1 exhaustion.',
    '1 / long rest',
  ],
  [
    20,
    'Passive',
    'Peak Physical Condition',
    'Strength/Constitution +2, maximum 22; improved long-rest recovery.',
  ],
]
const clubs: Record<string, [number, Economy, string, string, string?][]> = {
  'Arena Royale': [
    [
      3,
      'Bonus action',
      'Persona Libre',
      'Adopt/discard persona. Persona points = max(1, 3 + Charisma); substitute for Moxie while in persona.',
    ],
    [
      6,
      'Action',
      'Work the Crowd',
      'Persona required; 30-foot charm/fear, Wisdom save.',
      '1 / long rest',
    ],
    [11, 'Bonus action', 'High Flyer', 'Dash; speed +10 feet and doubled jumps.'],
    [
      17,
      'Passive',
      'Signature Move',
      'Replace one attack; persona required. See reference for jump, critical/stun and recharge.',
    ],
  ],
  'Bloodhound Bruisers': [
    [
      3,
      'Passive',
      'Ever Vigilant',
      'Initiative advantage; first-round attacks have advantage against creatures not yet acting.',
    ],
    [
      3,
      'Passive',
      'Detective Work',
      'Two skills: Insight/Investigation/Perception; 1 Moxie for advantage on a check.',
    ],
    [
      6,
      'Bonus action',
      'Scrap Like a Sleuth',
      'Target within 30 feet; 1-minute attack advantage and +PB AC against it.',
      '2 Moxie',
    ],
    [
      11,
      'Passive',
      'Heart of the City',
      'Familiar settlement benefits, including conditional doubled proficiency. Not permanent Expertise.',
    ],
    [
      17,
      'Bonus action',
      'Eyes Wide Open',
      'Truesight 30 feet and save benefits, 1 minute.',
      '1 Moxie',
    ],
  ],
  'Dog & Hound': [
    [3, 'Bonus action', 'Command hound', 'Hound: Attack, Dash, Disengage, Dodge or Help.'],
    [3, 'Passive', 'Mutt With Moxie', 'Moxie features can also benefit your hound.'],
    [
      6,
      'Passive',
      'Arcanine Bite & Coordinated Attack',
      'Magical hound attacks; hound reaction attack after your Attack.',
    ],
    [
      11,
      'Reaction',
      'Hound’s Best Friend',
      'Conditional opportunity attack when your hound is attacked.',
    ],
    [17, 'Passive', 'Dire Hound', 'Companion uses modified dire wolf statistics.'],
  ],
  'Hand of Dread': [
    [
      3,
      'Action',
      'Black Magic',
      'Blade Ward, Eldritch Blast, Prestidigitation; Constitution casting.',
    ],
    [
      3,
      'Bonus action',
      'Dread Hand',
      '1-minute transformation; damage rerolls and extra strikes. Three bonus strikes after Attack cost 2 Moxie.',
      '1 / short or long rest',
    ],
    [6, 'Passive', 'Deal With the Devil', 'Two qualifying invocations of your choice.'],
    [11, 'Passive', 'Grotesque Growth', 'Optional growth during Dread Hand; then exhaustion.'],
    [
      17,
      'Action',
      'Fountain of Viscera',
      'Target in reach; Dexterity save, then conditional fear.',
      '6 Moxie · 1 / long rest',
    ],
  ],
  'Piss & Vinegar': [
    [
      3,
      'Bonus action',
      'Salty Salute',
      'Target within 60 feet; Wisdom save; psychic damage and conditional attack disadvantage.',
    ],
    [
      6,
      'Passive',
      'Heelstomper & Low Blow',
      'On unarmed hit: conditional movement/prone effects; regain Moxie on failed save.',
      'Each 1 / short or long rest',
    ],
    [
      6,
      'Bonus action',
      'Pocket Sand',
      'Target within 5 feet; Constitution save against blindness.',
      '1 / short or long rest',
    ],
    [
      11,
      'Reaction',
      'Mean Old Cuss',
      'Advantage on Intimidation or disadvantage on an opponent’s subclass save.',
      '1 Moxie',
    ],
    [
      17,
      'Passive',
      'The Uncouth Art',
      'Expanded Salty Salute targets and conditional Moxie recovery.',
      '1 / long rest',
    ],
  ],
  'The Squared Circle': [
    [3, 'Reaction', 'Compression Lock', 'Force a successful grapple escape reroll.', '1 Moxie'],
    [
      3,
      'Reaction',
      'Quick Pin',
      'Grapple instead of a movement-triggered opportunity attack.',
      '1 Moxie',
    ],
    [3, 'Bonus action', 'To the Mat', 'Grapple; success also knocks prone.', '1 Moxie'],
    [
      6,
      'Reaction',
      'Meat Shield',
      'Conditional half cover and attack redirection.',
      '1 Moxie to redirect',
    ],
    [
      11,
      'Movement',
      'Heavyweight',
      'Larger grappling size; full-speed dragging of eligible creatures.',
    ],
    [
      17,
      'Passive',
      'Clean Finish',
      'Attack advantage and expanded criticals against your grappled target.',
    ],
  ],
  'The Sweet Science': [
    [
      3,
      'Reaction',
      'Cross Counter',
      'Reduce melee weapon damage by 1d10 + Strength + level; if reduced to 0, counterattack in reach.',
      '2 Moxie',
    ],
    [
      6,
      'Bonus action',
      'One, Two, Three, Floor',
      'Use improved Old One-Two sequence; see reference.',
      '1 Moxie',
    ],
    [
      11,
      'Reaction',
      'Float Like a Butterfly, Sting Like a Bee',
      'Cross Counter improvements; see reference.',
    ],
    [17, 'Passive', 'Knock Out', 'Conditional knockout attack; see reference.'],
  ],
}
const basic: Ability[] = [
  {
    name: 'Attack',
    economy: 'Action',
    detail:
      'Make an attack with a weapon or unarmed strike. Extra Attack modifies the number of attacks, not the number of actions.',
    source: 'SRD 5.1',
  },
  {
    name: 'Dash',
    economy: 'Action',
    detail: 'Gain extra movement equal to your current speed for this turn.',
    source: 'SRD 5.1',
  },
  {
    name: 'Disengage',
    economy: 'Action',
    detail: 'Your movement does not provoke opportunity attacks for the rest of this turn.',
    source: 'SRD 5.1',
  },
  {
    name: 'Dodge',
    economy: 'Action',
    detail:
      'Until your next turn: visible attackers have disadvantage and you have advantage on Dexterity saves. Lost if incapacitated or speed is 0.',
    source: 'SRD 5.1',
  },
  {
    name: 'Help',
    economy: 'Action',
    detail:
      'Assist an eligible ability check, or distract a creature within 5 feet to grant advantage to an ally’s first attack before your next turn.',
    source: 'SRD 5.1',
  },
  {
    name: 'Hide',
    economy: 'Action',
    detail:
      'Make a Stealth check when hiding is possible. The DM determines whether your surroundings allow it.',
    source: 'SRD 5.1',
  },
  {
    name: 'Ready',
    economy: 'Action',
    detail:
      'Choose a perceptible trigger and an action or movement. Respond with your reaction before your next turn. Readied spells need concentration.',
    source: 'SRD 5.1',
  },
  {
    name: 'Search / Use an Object',
    economy: 'Action',
    detail:
      'Search with Perception or Investigation, or use an object when it requires your action.',
    source: 'SRD 5.1',
  },
  {
    name: 'Grapple / Shove',
    economy: 'Action',
    detail:
      'Replace an attack within the Attack action. Target in reach, at most one size larger. Athletics vs Athletics/Acrobatics; grapple needs a free hand. Shove pushes 5 feet or knocks prone.',
    source: 'SRD 5.1',
  },
  {
    name: 'Opportunity attack',
    economy: 'Reaction',
    detail:
      'One melee attack when a visible hostile creature leaves your reach using its movement/action/reaction. Disengage and forced movement can prevent it.',
    source: 'SRD 5.1',
  },
  {
    name: 'Move',
    economy: 'Movement',
    detail:
      'Split movement around your attacks. Difficult terrain costs twice as much. Standing from prone costs half speed. Check your sheet for other movement speeds.',
    source: 'SRD 5.1',
  },
]
export function abilitiesFor(
  book: Workbook,
  read: Reader,
  settings: RuleSettings,
): { abilities: Ability[]; classes: ClassChoice[]; unsupported: string[] } {
  const classes = characterClasses(book, read),
    abilities = [...basic],
    unsupported: string[] = []
  for (const c of classes) {
    if (!c.level) {
      unsupported.push(`${c.name}: class level is unresolved`)
      continue
    }
    if (c.name === 'Pugilist') {
      for (const [level, economy, name, detail, cost] of pugi)
        if (level <= c.level)
          abilities.push({
            name,
            economy,
            detail,
            cost,
            level,
            source: 'Pugilist reference',
            className: c.name,
          })
      for (const [level, economy, name, detail, cost] of clubs[c.subclass] ?? [])
        if (level <= c.level)
          abilities.push({
            name,
            economy,
            detail,
            cost,
            level,
            source: 'Pugilist reference',
            className: c.name,
            subclass: c.subclass,
          })
      if (c.level >= 3 && !c.subclass)
        unsupported.push('Choose a Pugilist Fight Club to see its abilities')
    } else {
      const canonical = canonicalSubclass(
        c.name,
        subclassAliases[`${c.name}:${c.subclass}`] ?? c.subclass,
      )
      const library = [
        ...(legacy as Ability[]),
        ...PHB_ADDITIONAL_ABILITIES,
        ...EXPANSION_ABILITIES,
      ]
      const matches = library.filter(
        (a) =>
          a.className === c.name &&
          (a.level ?? 0) <= c.level &&
          (!a.subclass || canonicalSubclass(c.name, a.subclass) === canonical),
      )
      abilities.push(
        ...matches.filter((a) => !EXPANSION_ABILITIES.includes(a)),
        ...expansionAbilitiesFor(c, settings),
      )
      if (!matches.length) unsupported.push(`${c.name}: add abilities from its rules`)
      if (
        c.subclass &&
        !library.some(
          (a) =>
            a.className === c.name && canonicalSubclass(c.name, a.subclass ?? '') === canonical,
        )
      )
        unsupported.push(`${c.subclass}: detailed ability rules need custom entries`)
      const casting = (
        {
          Bard: 1,
          Cleric: 1,
          Druid: 1,
          Paladin: 2,
          Ranger: 2,
          Sorcerer: 1,
          Warlock: 1,
          Wizard: 1,
          Artificer: 1,
        } as Record<string, number>
      )[c.name]
      if (casting && c.level >= casting)
        abilities.push({
          name: c.name === 'Warlock' ? 'Pact Magic' : 'Spellcasting',
          economy: 'Unclassified',
          detail:
            'Casting time, components, concentration and resource cost depend on the selected spell. Use Spells to manage your sheet’s spell list.',
          source: 'SRD 5.1',
          className: c.name,
        })
    }
  }
  const race = String(read('v2.1', 'T7')),
    raceTab = book.sheets.find((s) => s.title === 'Race Info')
  const raceFamilies: Record<string, string[]> = {
    'Hill Dwarf': ['Dwarf', 'Hill Dwarf'],
    'High Elf': ['Elf', 'High Elf'],
    'Lightfoot Halfling': ['Halfling', 'Lightfoot'],
    'Rock Gnome': ['Gnome', 'Rock Gnome'],
    'Half-Elf': ['Half-Elf'],
    'Half-Orc': ['Half-Orc'],
    Tiefling: ['Tiefling'],
  }
  const families = /dragonborn/i.test(race) ? ['Dragonborn'] : (raceFamilies[race] ?? [])
  for (const trait of racialTraits)
    if (families.includes(trait.race))
      abilities.push({
        ...trait,
        name: `${race} · ${trait.name}`,
        economy: trait.economy as Economy,
      })
  const row = Object.entries(raceTab?.cells ?? {})
    .find(([a, c]) => /^B\d+$/.test(a) && c.value === race)?.[0]
    .slice(1)
  for (const [col, name] of [
    ['F', 'Ability adjustments'],
    ['K', 'Speed'],
    ['N', 'HP adjustment'],
    ['P', 'Defenses'],
    ['X', 'Languages'],
    ['AE', 'Equipment proficiencies'],
    ['AJ', 'Features & proficiencies'],
  ]) {
    const detail = String(raceTab?.cells[col + row]?.value ?? '')
    if (detail && detail !== '-')
      abilities.push({
        name: `${race} · ${name}`,
        detail,
        economy: col === 'K' ? 'Movement' : col === 'AJ' ? 'Unclassified' : 'Passive',
        source: 'Race Info · spreadsheet',
      })
  }
  const main = book.sheets.find((s) => s.title === 'v2.1'),
    bg = String(read('v2.1', 'AJ11'))
  const bgRow = Object.entries(main?.cells ?? {})
    .find(([a, c]) => /^AX\d+$/.test(a) && Number(a.slice(2)) >= 69 && c.value === bg)?.[0]
    .slice(2)
  if (bgRow) {
    const detail = [
      ['AY', 'Skills'],
      ['AZ', 'Extra languages'],
      ['BA', 'Tools'],
      ['BB', 'Vehicles'],
    ]
      .map(([col, label]) => `${label}: ${main?.cells[col + bgRow]?.value ?? '—'}`)
      .join(' · ')
    abilities.push({
      name: `${bg} · grants`,
      detail,
      economy: 'Passive',
      source: 'Background table · spreadsheet',
    })
  }
  for (const col of ['C', 'P', 'AC'])
    for (let r = 59; r <= 84; r++) {
      const detail = String(read('v2.1', col + r))
      if (detail && detail !== '-' && detail !== '0')
        abilities.push({
          name: detail.split('\n')[0].slice(0, 100),
          detail,
          economy: 'Unclassified',
          source: `Spreadsheet · ${col}${r}`,
        })
    }
  const spellEntries = listedSpells(read)
  const knownList = usesKnownSpellList(book, read)
  const innateCosts = new Map<string, string>()
  const innate = (names: string[], cost: string) => {
    for (const name of names) {
      const definition = findSpell(name)
      if (!definition) continue
      innateCosts.set(definition.name, cost)
      const existing = spellEntries.find((e) => e.definition?.name === definition.name)
      if (existing) existing.prepared = true
      else
        spellEntries.push({
          definition,
          level: definition.level,
          prepared: true,
          name: '',
          marker: '',
          text: name,
        })
    }
  }
  for (const c of classes) {
    const sub = canonicalSubclass(c.name, c.subclass)
    if (c.name === 'Rogue' && sub === 'Arcane Trickster' && c.level >= 3)
      innate(['Mage Hand'], 'Cantrip · Intelligence')
    if (c.name === 'Monk' && sub === 'Way of Shadow' && c.level >= 3) {
      innate(
        ['Darkness', 'Darkvision', 'Pass without Trace', 'Silence'],
        '2 ki · no material components',
      )
      innate(['Minor Illusion'], 'Cantrip')
    }
    if (c.name === 'Pugilist' && c.subclass === 'Hand of Dread' && c.level >= 3)
      innate(['Blade Ward', 'Eldritch Blast', 'Prestidigitation'], 'Cantrip · Constitution')
  }
  if (race === 'Tiefling') {
    const level = classes.every((c) => c.level > 0)
      ? classes.reduce((n, c) => n + c.level, 0)
      : Number(read('v2.1', 'AL6'))
    innate(['Thaumaturgy'], 'Cantrip · Charisma')
    if (level >= 3) innate(['Hellish Rebuke'], 'Once / long rest as level 2 · Charisma')
    if (level >= 5) innate(['Darkness'], 'Once / long rest · Charisma')
  }
  for (const c of classes)
    for (const grant of subclassSpellGrants(c, settings))
      if (grant.mode !== 'Expanded list') {
        const definition = findSpell(grant.name)
        if (definition) {
          const existing = spellEntries.find((e) => e.definition?.name === definition.name)
          if (existing) existing.prepared = true
          else
            spellEntries.push({
              definition,
              level: definition.level,
              prepared: true,
              name: '',
              marker: '',
              text: grant.name,
            })
        } else
          unsupported.push(`${grant.name}: spell definition is outside the installed core pack`)
      }
  for (const entry of spellEntries)
    if (entry.definition && (entry.level === 0 || entry.prepared || knownList)) {
      const spell = entry.definition
      abilities.push({
        name: spell.name,
        economy: spellEconomy(spell.castingTime),
        spellName: spell.name,
        detail: `${spell.castingTime} · ${spell.range} · ${spell.duration}\n${spell.description}`,
        cost:
          innateCosts.get(spell.name) ??
          (spell.level === 0
            ? 'Cantrip'
            : `Level ${spell.level} spell slot or a feature that permits casting`),
        source: spell.source,
        page: spell.page,
        url: spell.url,
      })
    }
  abilities.push(...selectedFeatureAbilities(book, read, settings))
  unsupported.push(...featureChoiceIssues(book, read, settings))
  for (const custom of settings.abilities) {
    const old = abilities.findIndex((a) => a.name.toLowerCase() === custom.name.toLowerCase())
    if (old >= 0) abilities[old] = custom
    else abilities.push(custom)
  }
  return { abilities, classes, unsupported }
}

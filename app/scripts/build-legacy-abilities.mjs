// Extract openly licensed SRD 5.1 feature text in column reading order.
import { getDocument } from 'pdfjs-dist/legacy/build/pdf.mjs'
import { readFile, writeFile } from 'node:fs/promises'
const pdf = await getDocument({
  data: new Uint8Array(await readFile('../References/SRD_CC_v5.1.pdf')),
  useSystemFonts: true,
}).promise
const ranges = {
  Barbarian: [8, 10],
  Bard: [11, 14],
  Cleric: [15, 18],
  Druid: [19, 23],
  Fighter: [24, 25],
  Monk: [26, 29],
  Paladin: [30, 34],
  Ranger: [35, 38],
  Rogue: [39, 41],
  Sorcerer: [42, 45],
  Warlock: [46, 51],
  Wizard: [52, 55],
}
// level, economy, heading. Options within features remain choices, not automatic grants.
const base = {
  Barbarian:
    '1:Bonus action:Rage|1:Passive:Unarmored Defense|2:Passive:Reckless Attack|2:Passive:Danger Sense|5:Passive:Extra Attack|5:Movement:Fast Movement|7:Passive:Feral Instinct|9:Passive:Brutal Critical|11:Passive:Relentless Rage|15:Passive:Persistent Rage|18:Passive:Indomitable Might|20:Passive:Primal Champion',
  Bard: '1:Bonus action:Bardic Inspiration|2:Passive:Jack of All Trades|2:Passive:Song of Rest|3:Passive:Expertise|5:Passive:Font of Inspiration|6:Action:Countercharm|10:Passive:Magical Secrets|20:Passive:Superior Inspiration',
  Cleric:
    '2:Action:Channel Divinity: Turn Undead|5:Passive:Destroy Undead|10:Action:Divine Intervention',
  Druid:
    '1:Passive:Druidic|2:Action:Wild Shape|18:Passive:Timeless Body|18:Passive:Beast Spells|20:Passive:Archdruid',
  Fighter:
    '1:Passive:Fighting Style|1:Bonus action:Second Wind|2:Passive:Action Surge|5:Passive:Extra Attack|9:Passive:Indomitable',
  Monk: '1:Passive:Unarmored Defense|1:Bonus action:Martial Arts|2:Passive:Ki|2:Bonus action:Flurry of Blows|2:Bonus action:Patient Defense|2:Bonus action:Step of the Wind|2:Movement:Unarmored Movement|3:Reaction:Deflect Missiles|4:Reaction:Slow Fall|5:Passive:Extra Attack|5:Passive:Stunning Strike|6:Passive:Ki-Empowered Strikes|7:Passive:Evasion|7:Action:Stillness of Mind|10:Passive:Purity of Body|13:Passive:Tongue of the Sun and Moon|14:Passive:Diamond Soul|15:Passive:Timeless Body|18:Action:Empty Body|20:Passive:Perfect Self',
  Paladin:
    '1:Action:Divine Sense|1:Action:Lay on Hands|2:Passive:Fighting Style|2:Passive:Divine Smite|3:Passive:Divine Health|5:Passive:Extra Attack|6:Passive:Aura of Protection|10:Passive:Aura of Courage|11:Passive:Improved Divine Smite|14:Action:Cleansing Touch',
  Ranger:
    '1:Passive:Favored Enemy|1:Passive:Natural Explorer|2:Passive:Fighting Style|3:Action:Primeval Awareness|5:Passive:Extra Attack|8:Movement:Land’s Stride|10:Passive:Hide in Plain Sight|14:Bonus action:Vanish|18:Passive:Feral Senses|20:Passive:Foe Slayer',
  Rogue:
    '1:Passive:Expertise|1:Passive:Sneak Attack|1:Passive:Thieves’ Cant|2:Bonus action:Cunning Action|5:Reaction:Uncanny Dodge|7:Passive:Evasion|11:Passive:Reliable Talent|14:Passive:Blindsense|15:Passive:Slippery Mind|18:Passive:Elusive|20:Passive:Stroke of Luck',
  Sorcerer:
    '2:Passive:Font of Magic|2:Bonus action:Creating Spell Slots|3:Passive:Metamagic|20:Passive:Sorcerous Restoration',
  Warlock:
    '2:Passive:Eldritch Invocations|3:Passive:Pact Boon|11:Passive:Mystic Arcanum|20:Passive:Eldritch Master',
  Wizard: '1:Passive:Arcane Recovery|18:Passive:Spell Mastery|20:Passive:Signature Spells',
}
const subclasses = {
  Barbarian: [
    'Berserker',
    '3:Bonus action:Frenzy|6:Passive:Mindless Rage|10:Action:Intimidating Presence|14:Reaction:Retaliation',
  ],
  Bard: [
    'College of Lore',
    '3:Passive:Bonus Proficiencies|3:Reaction:Cutting Words|6:Passive:Additional Magical Secrets|14:Passive:Peerless Skill',
  ],
  Cleric: [
    'Life Domain',
    '1:Passive:Bonus Proficiency|1:Passive:Disciple of Life|2:Action:Channel Divinity: Preserve Life|6:Passive:Blessed Healer|8:Passive:Divine Strike|17:Passive:Supreme Healing',
  ],
  Druid: [
    'Circle of the Land',
    '2:Passive:Bonus Cantrip|2:Passive:Natural Recovery|3:Passive:Circle Spells|6:Movement:Land’s Stride|10:Passive:Nature’s Ward|14:Passive:Nature’s Sanctuary',
  ],
  Fighter: [
    'Champion',
    '3:Passive:Improved Critical|7:Passive:Remarkable Athlete|10:Passive:Additional Fighting Style|15:Passive:Superior Critical|18:Passive:Survivor',
  ],
  Monk: [
    'Way of the Open Hand',
    '3:Passive:Open Hand Technique|6:Action:Wholeness of Body|11:Passive:Tranquility|17:Action:Quivering Palm',
  ],
  Paladin: [
    'Oath of Devotion',
    '3:Passive:Oath Spells|3:Action:Sacred Weapon|3:Action:Turn the Unholy|7:Passive:Aura of Devotion|15:Passive:Purity of Spirit|20:Action:Holy Nimbus',
  ],
  Ranger: [
    'Hunter',
    '3:Passive:Hunter’s Prey|7:Passive:Defensive Tactics|11:Action:Multiattack|15:Passive:Superior Hunter’s Defense',
  ],
  Rogue: [
    'Thief',
    '3:Bonus action:Fast Hands|3:Movement:Second-Story Work|9:Passive:Supreme Sneak|13:Passive:Use Magic Device|17:Passive:Thief’s Reflexes',
  ],
  Sorcerer: [
    'Draconic Bloodline',
    '1:Passive:Dragon Ancestor|1:Passive:Draconic Resilience|6:Passive:Elemental Affinity|14:Bonus action:Dragon Wings|18:Action:Draconic Presence',
  ],
  Warlock: [
    'The Fiend',
    '1:Passive:Dark One’s Blessing|6:Passive:Dark One’s Own Luck|10:Passive:Fiendish Resilience|14:Passive:Hurl Through Hell',
  ],
  Wizard: [
    'School of Evocation',
    '2:Passive:Evocation Savant|2:Passive:Sculpt Spells|6:Passive:Potent Cantrip|10:Passive:Empowered Evocation|14:Passive:Overchannel',
  ],
}
const abilities = []
for (const [className, [start, end]] of Object.entries(ranges)) {
  const sections = []
  let current
  for (let n = start; n <= end; n++) {
    const content = await (await pdf.getPage(n)).getTextContent()
    const items = content.items.filter(
      (i) => 'str' in i && i.str.trim() && i.transform[5] > 40 && i.transform[5] < 750,
    )
    for (const col of [
      items.filter((i) => i.transform[4] < 310),
      items.filter((i) => i.transform[4] >= 310),
    ]) {
      const rows = []
      for (const i of col.sort(
        (a, b) => b.transform[5] - a.transform[5] || a.transform[4] - b.transform[4],
      )) {
        let r = rows.find((r) => Math.abs(r.y - i.transform[5]) < 2)
        if (!r) {
          r = { y: i.transform[5], items: [] }
          rows.push(r)
        }
        r.items.push(i)
      }
      for (const r of rows) {
        const text = r.items
          .sort((a, b) => a.transform[4] - b.transform[4])
          .map((i) => i.str)
          .join(' ')
          .replace(/[\u00ad\u200b]/g, '')
          .replace(/\s+/g, ' ')
          .trim()
        if (r.items.every((i) => i.transform[0] >= 11.9)) {
          current = { name: text, lines: [], page: n }
          sections.push(current)
        } else if (current) current.lines.push(text)
      }
    }
  }
  for (const [subclass, config] of [
    ['', base[className] + '|4:Passive:Ability Score Improvement'],
    subclasses[className],
  ]) {
    for (const entry of config.split('|')) {
      const [level, economy, ...parts] = entry.split(':')
      const name = parts.join(':')
      let found = sections.find((s) => s.name === name)
      if (['Fighting Style', 'Metamagic', 'Pact Boon', 'Font of Magic'].includes(name) && found) {
        const index = sections.indexOf(found),
          extra = []
        const stop = {
          'Fighting Style': ['Second Wind', 'Spellcasting'],
          Metamagic: ['Ability Score Improvement'],
          'Pact Boon': ['Ability Score Improvement', 'Mystic Arcanum'],
          'Font of Magic': ['Metamagic'],
        }[name]
        for (let i = index + 1; i < sections.length && !stop.includes(sections[i].name); i++)
          extra.push(sections[i].name, ...sections[i].lines)
        found = { ...found, lines: [...found.lines, ...extra] }
      }
      if (name === 'Creating Spell Slots') {
        const flexible = sections.find((s) => s.name === 'Flexible Casting')
        if (flexible && found) found = { ...found, lines: [...flexible.lines, ...found.lines] }
      }
      // Some Channel Divinity / oath options are inline bold body headings.
      if (!found) {
        const parent = sections.find((s) => s.lines.some((l) => l.startsWith(name + '.')))
        if (parent) {
          const index = parent.lines.findIndex((l) => l.startsWith(name + '.'))
          found = { ...parent, lines: parent.lines.slice(index) }
          const next = found.lines.findIndex((l, i) => i > 0 && /^[A-Z][A-Za-z ’]+\. /.test(l))
          if (next > 0) found.lines = found.lines.slice(0, next)
        }
      }
      if (!found) {
        console.warn('Missing', className, name)
        continue
      }
      const detail = found.lines.join(' ').replace(/-­?‐?‑?\s+/g, '')
      abilities.push({
        name,
        className,
        subclass,
        level: Number(level),
        economy,
        detail,
        page: found.page,
        source: 'SRD 5.1',
      })
    }
  }
}
await writeFile('src/data/legacy-abilities.json', JSON.stringify(abilities, null, 2) + '\n')
console.log('Extracted', abilities.length, 'SRD abilities')

const racePages = JSON.parse(await readFile('../References/srd-5.1-extracted.json', 'utf8'))
const races = [
  'Dwarf',
  'Hill Dwarf',
  'Elf',
  'High Elf',
  'Halfling',
  'Lightfoot',
  'Human',
  'Dragonborn',
  'Gnome',
  'Rock Gnome',
  'Half-Elf',
  'Half-Orc',
  'Tiefling',
]
const raceTraits = [],
  keep = [
    'Darkvision',
    'Dwarven Resilience',
    'Dwarven Combat Training',
    'Tool Proficiency',
    'Stonecunning',
    'Dwarven Toughness',
    'Keen Senses',
    'Fey Ancestry',
    'Trance',
    'Elf Weapon Training',
    'Cantrip',
    'Extra Language',
    'Lucky',
    'Brave',
    'Halfling Nimbleness',
    'Naturally Stealthy',
    'Breath Weapon',
    'Gnome Cunning',
    'Artificer’s Lore',
    'Tinker',
    'Skill Versatility',
    'Menacing',
    'Relentless Endurance',
    'Savage Attacks',
    'Hellish Resistance',
    'Infernal Legacy',
  ]
let race = '',
  trait
for (const p of racePages.filter((p) => p.page <= 7))
  for (const line of p.lines) {
    if (races.includes(line)) {
      race = line
      trait = undefined
      continue
    }
    const head = /^([A-Z][A-Za-z’ -]{2,55})\.\s/.exec(line)
    if (head) {
      trait = undefined
      if (keep.includes(head[1])) {
        trait = {
          race,
          name: head[1],
          economy:
            head[1] === 'Breath Weapon'
              ? 'Action'
              : head[1] === 'Infernal Legacy'
                ? 'Unclassified'
                : ['Halfling Nimbleness', 'Naturally Stealthy'].includes(head[1])
                  ? 'Movement'
                  : 'Passive',
          detail: line.slice(head[0].length),
          page: p.page,
          source: 'SRD 5.1',
        }
        raceTraits.push(trait)
      }
    } else if (trait) trait.detail += ' ' + line
  }
await writeFile('src/data/legacy-races.json', JSON.stringify(raceTraits, null, 2) + '\n')
console.log('Extracted', raceTraits.length, 'racial traits')

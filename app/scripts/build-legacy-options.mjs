import { readFile, writeFile } from 'node:fs/promises'
const pages = JSON.parse(await readFile('../References/srd-5.1-extracted.json', 'utf8'))
const names = [
  'Agonizing Blast',
  'Armor of Shadows',
  'Ascendant Step',
  'Beast Speech',
  'Beguiling Influence',
  'Bewitching Whispers',
  'Book of Ancient Secrets',
  'Chains of Carceri',
  'Devil’s Sight',
  'Dreadful Word',
  'Eldritch Sight',
  'Eldritch Spear',
  'Eyes of the Rune Keeper',
  'Fiendish Vigor',
  'Gaze of Two Minds',
  'Lifedrinker',
  'Mask of Many Faces',
  'Master of Myriad Forms',
  'Minions of Chaos',
  'Mire the Mind',
  'Misty Visions',
  'One with Shadows',
  'Otherworldly Leap',
  'Repelling Blast',
  'Sculptor of Flesh',
  'Sign of Ill Omen',
  'Thief of Five Fates',
  'Thirsting Blade',
  'Visions of Distant Realms',
  'Voice of the Chain Master',
  'Whispers of the Grave',
  'Witch Sight',
]
const lines = pages
  .filter((p) => p.page >= 48 && p.page <= 50)
  .flatMap((p) =>
    p.lines.map((line) => ({
      line: line
        .replace(/[\u00ad\u200b]/g, '')
        .replace(/-‐?‑?\s+/g, '')
        .trim(),
      page: p.page,
    })),
  )
const entries = names.map((name) => {
  const start = lines.findIndex((l) => l.line === name)
  if (start < 0) throw Error('Missing invocation ' + name)
  let end = lines.findIndex(
    (l, i) =>
      i > start &&
      (names.includes(l.line) ||
        l.line === 'Wizard' ||
        l.line === 'The Fiend' ||
        l.line === 'Otherworldly Patrons'),
  )
  if (end < 0) end = lines.length
  const detail = lines
    .slice(start + 1, end)
    .map((l) => l.line)
    .join(' ')
  const prerequisite = /Prerequisite: (.*?)(?= You | When | Your | If |$)/.exec(detail)?.[1] ?? ''
  return {
    name,
    detail,
    page: lines[start].page,
    source: 'SRD 5.1',
    level: Number(/(\d+)(?:th|st|nd|rd) level/.exec(prerequisite)?.[1] ?? 2),
    pact: /Pact of the (\w+)/.exec(prerequisite)?.[1] ?? '',
    eldritchBlast: prerequisite.includes('eldritch blast'),
    prerequisite,
  }
})
await writeFile('src/data/legacy-invocations.json', JSON.stringify(entries, null, 2) + '\n')
console.log('Extracted', entries.length, 'invocations')
const skillNames = [
  ['Athletics', 'Strength', 'Other Strength Checks'],
  ['Acrobatics', 'Dexterity', 'Sleight of Hand'],
  ['Sleight of Hand', 'Dexterity', 'Stealth'],
  ['Stealth', 'Dexterity', 'Other Dexterity Checks'],
  ['Arcana', 'Intelligence', 'History'],
  ['History', 'Intelligence', 'Investigation'],
  ['Investigation', 'Intelligence', 'Nature'],
  ['Nature', 'Intelligence', 'Religion'],
  ['Religion', 'Intelligence', 'Other Intelligence Checks'],
  ['Animal Handling', 'Wisdom', 'Insight'],
  ['Insight', 'Wisdom', 'Medicine'],
  ['Medicine', 'Wisdom', 'Perception'],
  ['Perception', 'Wisdom', 'Survival'],
  ['Survival', 'Wisdom', 'Other Wisdom Checks'],
  ['Deception', 'Charisma', 'Intimidation'],
  ['Intimidation', 'Charisma', 'Performance'],
  ['Performance', 'Charisma', 'Persuasion'],
  ['Persuasion', 'Charisma', 'Other Charisma Checks'],
]
const skillPages = pages.filter((p) => p.page >= 79 && p.page <= 83)
const text = skillPages
  .flatMap((p) => p.lines)
  .join(' ')
  .replace(/[\u00ad\u200b]/g, '')
  .replace(/-‐?‑?\s+/g, '')
  .replace(/\s+/g, ' ')
const skills = skillNames.map(([name, ability, next]) => {
  const start = text.indexOf(name + '.'),
    end = text.indexOf(next + '.', start + name.length)
  if (start < 0 || end < 0) throw Error('Missing skill ' + name)
  return {
    name,
    ability,
    detail: text.slice(start + name.length + 1, end).trim(),
    page: skillPages.find((p) => p.lines.some((l) => l.startsWith(name + '.')))?.page ?? 79,
    source: 'SRD 5.1',
  }
})
await writeFile('src/data/legacy-skills.json', JSON.stringify(skills, null, 2) + '\n')
console.log('Extracted', skills.length, 'skill definitions')

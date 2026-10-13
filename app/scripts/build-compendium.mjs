import fs from 'node:fs'
const pages = JSON.parse(fs.readFileSync('../References/srd-extracted.json', 'utf8'))
function rows(page) {
  return [page.items.filter((i) => i.x < 310), page.items.filter((i) => i.x >= 310)].flatMap(
    (col) => {
      const result = []
      for (const i of col.sort((a, b) => b.y - a.y || a.x - b.x)) {
        let r = result.find((r) => Math.abs(r.y - i.y) < 2)
        if (!r) {
          r = { y: i.y, items: [] }
          result.push(r)
        }
        r.items.push(i)
      }
      return result.map((r) => {
        r.items.sort((a, b) => a.x - b.x)
        return {
          text: r.items
            .map(
              (i, n) =>
                `${n && i.x - r.items[n - 1].x - r.items[n - 1].width > 1 ? ' ' : ''}${i.size < 9 && r.items.some((j) => j.size === 12) ? i.text.toLowerCase() : i.text}`,
            )
            .join(''),
          heading: r.items.some((i) => i.size === 12),
        }
      })
    },
  )
}
const all = pages.flatMap((p) => rows(p).map((r) => ({ ...r, page: p.page })))
const spellRows = all.filter((r) => r.page >= 107 && r.page <= 175)
const spellHeaders = spellRows
  .map((r, i) => (/^(Level [1-9] \w+|\w+ Cantrip) \(/.test(r.text) ? i : -1))
  .filter((i) => i >= 0)
const spells = spellHeaders.map((index, n) => {
  let meta = spellRows[index].text
  for (let j = index + 1; !meta.includes(')') && j < index + 4; j++) meta += ' ' + spellRows[j].text
  const end = n + 1 < spellHeaders.length ? spellHeaders[n + 1] - 1 : spellRows.length
  const body = spellRows
    .slice(index + 1, end)
    .map((r) => r.text)
    .join('\n')
    .replace(/-\n(?=[a-z])/g, '')
    .replace(/\u00ad/g, '')
    .replace(/^Component:/gm, 'Components:')
  const field = (name, next) =>
    body
      .match(new RegExp(`${name}:\\s*([\\s\\S]*?)(?=${next}:)`))?.[1]
      .replace(/\n/g, ' ')
      .trim() ?? ''
  const duration = body.match(/Duration:\s*([^\n]+)/)?.[1] ?? ''
  const components = field('Components', 'Duration')
  const desc = body.slice(body.indexOf('Duration:') + ('Duration: ' + duration).length).trim()
  return {
    name: spellRows[index - 1].text,
    level: Number(meta.match(/^Level (\d)/)?.[1] ?? 0),
    school: meta.replace(/^Level \d /, '').split(/ Cantrip| \(/)[0],
    castingTime: field('Casting Time', 'Range'),
    range: field('Range', 'Components'),
    duration,
    components,
    materials: components.match(/\(([\s\S]+)\)/)?.[1] ?? '',
    ritual: /Ritual/.test(field('Casting Time', 'Range')),
    concentration: /Concentration/.test(duration),
    description: desc,
    classes: meta
      .slice(meta.indexOf('(') + 1)
      .replace(/\)$/, '')
      .split(',')
      .map((s) => s.trim()),
    source: `SRD 5.2.1 · p. ${spellRows[index].page}`,
  }
})
if (
  spells.length !== 339 ||
  new Set(spells.map((s) => s.name)).size !== 339 ||
  spells.some(
    (s) =>
      !s.name ||
      !s.castingTime ||
      !s.range ||
      !s.components ||
      s.classes.some(
        (c) =>
          ![
            'Bard',
            'Cleric',
            'Druid',
            'Paladin',
            'Ranger',
            'Sorcerer',
            'Warlock',
            'Wizard',
          ].includes(c),
      ),
  )
)
  throw Error('Incomplete spell extraction')
fs.writeFileSync('src/data/spells.json', JSON.stringify(spells, null, 2))
const ranges = {
  Barbarian: [28, 31],
  Bard: [31, 36],
  Cleric: [36, 41],
  Druid: [41, 47],
  Fighter: [47, 49],
  Monk: [49, 53],
  Paladin: [53, 57],
  Ranger: [57, 61],
  Rogue: [61, 64],
  Sorcerer: [64, 70],
  Warlock: [70, 77],
  Wizard: [77, 83],
}
const refs = Object.entries(ranges).map(([name, [start, end]]) => {
  const startIndex = all.findIndex((r) => r.page >= start && r.text === name)
  const nextName = Object.keys(ranges)[Object.keys(ranges).indexOf(name) + 1]
  const endIndex = nextName
    ? all.findIndex((r, i) => i > startIndex && r.page >= end && r.text === nextName)
    : all.findIndex((r) => r.page === 83)
  return {
    name,
    category: 'Class',
    text: all
      .slice(startIndex, endIndex)
      .map((r) => r.text)
      .join('\n'),
    page: start,
  }
})
refs.push(
  ...[
    { name: 'Character creation', start: 19, end: 28 },
    { name: 'Backgrounds & species', start: 83, end: 87 },
    { name: 'Feats', start: 87, end: 89 },
    { name: 'Equipment', start: 89, end: 104 },
    { name: 'Rules glossary', start: 176, end: 192 },
  ].map(({ name, start, end }) => ({
    name,
    category: 'Rules',
    text: all
      .filter((r) => r.page >= start && r.page < end)
      .map((r) => r.text)
      .join('\n'),
    page: start,
  })),
)
fs.writeFileSync('src/data/references.json', JSON.stringify(refs, null, 2))
const features = Object.fromEntries(
  Object.entries(ranges).map(([name]) => {
    const ref = refs.find((r) => r.name === name)
    const subclassStart = ref.text.indexOf(`${name} Subclass:`)
    return [
      name,
      [...ref.text.matchAll(/(?:^|\n)Level (\d+): ([^\n]+)/g)].map((m) => ({
        level: Number(m[1]),
        name: m[2],
        scope: subclassStart >= 0 && m.index >= subclassStart ? 'subclass' : 'class',
      })),
    ]
  }),
)
fs.writeFileSync('src/data/features.json', JSON.stringify(features, null, 2))
console.log(
  'Built',
  spells.length,
  'spells,',
  refs.length,
  'reference sections. Sample:',
  spells
    .filter((s) => ['Fireball', 'Acid Splash', 'Hunter’s Mark'].includes(s.name))
    .map((s) => ({ name: s.name, level: s.level, duration: s.duration })),
)

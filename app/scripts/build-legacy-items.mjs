import { getDocument } from 'pdfjs-dist/legacy/build/pdf.mjs'
import { readFile, writeFile } from 'node:fs/promises'
const pdf = await getDocument({
  data: new Uint8Array(await readFile('../References/SRD_CC_v5.1.pdf')),
  useSystemFonts: true,
}).promise
const clean = (s) =>
  s
    .replace(/[\u00ad\u200b]/g, '')
    .replace(/[‐‑]/g, '-')
    .replace(/-+/g, '-')
    .replace(/\s+/g, ' ')
    .trim()
const lines = []
for (let n = 207; n <= 253; n++) {
  const content = await (await pdf.getPage(n)).getTextContent()
  const items = content.items.filter(
    (i) => 'str' in i && i.str.trim() && i.transform[5] > 40 && i.transform[5] < 750,
  )
  for (const col of [
    items.filter((i) => i.transform[4] < 310),
    items.filter((i) => i.transform[4] >= 310),
  ]) {
    const rows = []
    for (const item of col.sort(
      (a, b) => b.transform[5] - a.transform[5] || a.transform[4] - b.transform[4],
    )) {
      let row = rows.find((r) => Math.abs(r.y - item.transform[5]) < 2)
      if (!row) {
        row = { y: item.transform[5], items: [] }
        rows.push(row)
      }
      row.items.push(item)
    }
    for (const row of rows)
      lines.push({
        page: n,
        text: clean(
          row.items
            .sort((a, b) => a.transform[4] - b.transform[4])
            .map((i) => i.str)
            .join(' '),
        ),
        heading: row.items.every((i) => i.transform[0] >= 11.9 && i.transform[0] <= 12.2),
      })
  }
}
// A magic-item heading is immediately followed by its type/rarity line. Internal table
// headings remain inside their parent definition. Multi-line titles are joined first.
const starts = []
for (let i = 0; i < lines.length; i++) {
  if (!lines[i].heading) continue
  let j = i + 1,
    name = lines[i].text
  while (lines[j]?.heading) {
    name += ' ' + lines[j].text
    j++
  }
  if (
    /^(Wondrous item|Armor|Weapon|Ammunition|Potion|Ring|Rod|Staff|Wand|Scroll)(?:,| \()/i.test(
      lines[j]?.text ?? '',
    )
  ) {
    starts.push({ index: i, meta: j, name, page: lines[i].page })
    i = j
  }
}
const magic = starts.map((s, k) => {
  const end = starts[k + 1]?.index ?? lines.length
  const body = lines.slice(s.meta, end)
  const stop = body.findIndex(
    (l, i) => i > 0 && ['Sentient Magic Items', 'Artifacts'].includes(l.text),
  )
  const text = body
    .slice(0, stop < 0 ? body.length : stop)
    .map((l) => l.text)
    .join('\n')
  const metadata = text.split('\n').slice(0, 3).join(' ')
  const rarities = [
    ...new Set(
      [...metadata.matchAll(/\b(common|uncommon|very rare|rare|legendary|artifact)\b/gi)].map((m) =>
        m[1].toLowerCase(),
      ),
    ),
  ]
  const statedWeight = /\bweighs (\d+(?:\.\d+)?) pounds\b/i.exec(text.replace(/\n/g, ' '))
  return {
    name: s.name,
    category: 'Magic item',
    type: lines[s.meta].text.split(',')[0],
    rarity: rarities.length === 1 ? rarities[0] : 'Varies',
    attunement: /requires attunement/i.test(metadata),
    detail: text,
    cost: '',
    weight: statedWeight ? Number(statedWeight[1]) : null,
    page: s.page,
    source: 'SRD 5.1',
  }
})
const pages = JSON.parse(await readFile('../References/srd-5.1-extracted.json', 'utf8'))
const equipment = []
const armors = [
  ['Padded', '5 gp', 8, '11 + Dexterity; Stealth disadvantage'],
  ['Leather', '10 gp', 10, '11 + Dexterity'],
  ['Studded leather', '45 gp', 13, '12 + Dexterity'],
  ['Hide', '10 gp', 12, '12 + Dexterity (maximum 2)'],
  ['Chain shirt', '50 gp', 20, '13 + Dexterity (maximum 2)'],
  ['Scale mail', '50 gp', 45, '14 + Dexterity (maximum 2); Stealth disadvantage'],
  ['Breastplate', '400 gp', 20, '14 + Dexterity (maximum 2)'],
  ['Half plate', '750 gp', 40, '15 + Dexterity (maximum 2); Stealth disadvantage'],
  ['Ring mail', '30 gp', 40, '14; Stealth disadvantage'],
  ['Chain mail', '75 gp', 55, '16; Strength 13; Stealth disadvantage'],
  ['Splint', '200 gp', 60, '17; Strength 15; Stealth disadvantage'],
  ['Plate', '1,500 gp', 65, '18; Strength 15; Stealth disadvantage'],
  ['Shield', '10 gp', 6, '+2 AC; one shield at a time'],
]
for (const [name, cost, weight, ac] of armors)
  equipment.push({
    name,
    category: 'Armor',
    type: 'Armor',
    rarity: 'Mundane',
    attunement: false,
    cost,
    weight,
    detail: 'Armor Class: ' + ac,
    page: name === 'Padded' ? 63 : 64,
    source: 'SRD 5.1',
  })
const weight = (s) => (s === '—' ? 0 : Number(s.replace('½', '.5').replace('¼', '.25')))
for (const p of pages.filter((p) => [65, 66, 69, 70, 71, 72].includes(p.page))) {
  let category =
    p.page === 65 ? 'Armor' : p.page === 66 ? 'Weapon' : p.page === 71 ? 'Tool' : 'Adventuring gear'
  let group = p.page === 66 ? 'Simple Melee Weapons' : ''
  for (const raw of p.lines) {
    const line = clean(raw)
    if (line === 'Tools') {
      category = 'Tool'
      group = ''
    }
    if (/^(Simple|Martial) (Melee|Ranged) Weapons$/.test(line)) group = line
    if (
      /^(Ammunition|Arcane focus|Druidic focus|Holy symbol|Artisan’s tools|Gaming set|Musical instrument|Saddle)$/.test(
        line,
      )
    )
      group = line
    const m = /^(.+?)\s+(\d[\d,]*(?:\.\d+)? (?:cp|sp|ep|gp|pp))\s+(.+)$/.exec(line)
    if (!m || /\d+ ft\. \d+ lb\./.test(m[3])) continue // Mount carrying capacity is not inventory weight.
    const w = /((?:\d+(?:\/\d+)?(?:[½¼])?|[½¼])) lb\.|(—)(?:\s|$)/.exec(m[3])
    if (!w) continue
    let value = w[1] ? weight(w[1]) : 0
    if (w[1]?.includes('/')) {
      const [a, b] = w[1].split('/').map(Number)
      value = a / b
    }
    const nested = {
      Ammunition: [
        'Arrows (20)',
        'Blowgun needles (50)',
        'Crossbow bolts (20)',
        'Sling bullets (20)',
      ],
      'Arcane focus': ['Crystal', 'Orb', 'Rod', 'Staff', 'Wand'],
      'Druidic focus': ['Sprig of mistletoe', 'Totem', 'Wooden staff', 'Yew wand'],
      'Holy symbol': ['Amulet', 'Emblem', 'Reliquary'],
      Saddle: ['Exotic', 'Military', 'Pack', 'Riding'],
    }
    const nestedMatch = nested[group]?.includes(m[1])
    const name = nestedMatch ? `${group}: ${m[1]}` : m[1]
    const type = category === 'Weapon' ? group : nestedMatch ? group : category
    equipment.push({
      name,
      category,
      type,
      rarity: 'Mundane',
      attunement: false,
      cost: m[2],
      weight: value,
      detail: m[3],
      page: p.page,
      source: 'SRD 5.1',
    })
  }
}
// Attach licensed item explanations, which precede the gear price tables.
const gearLines = pages
  .filter((p) => p.page >= 63 && p.page <= 72)
  .flatMap((p) => p.lines.map(clean))
for (const item of equipment) {
  if (item.category === 'Armor') continue
  const base = item.name.replace(/^.*?: /, '').replace(/\s*\([^)]*\)/g, '')
  const i = gearLines.findIndex((l) => l.toLowerCase().startsWith(base.toLowerCase() + '.'))
  if (i >= 0) {
    let end = i + 1
    while (
      end < gearLines.length &&
      !/^[A-Z][A-Za-z’', -]+\. /.test(gearLines[end]) &&
      !/^(Adventuring Gear|Tools|Weapons|Armor|Item Cost)/.test(gearLines[end])
    )
      end++
    item.detail += '\n\n' + gearLines.slice(i, end).join(' ')
  }
}
const unique = new Map()
for (const item of [...equipment, ...magic]) {
  const key = item.name.toLowerCase(),
    previous = unique.get(key)
  if (previous) {
    item.cost ||= previous.cost
    item.weight ??= previous.weight
  }
  unique.set(key, item)
}
const items = [...unique.values()].sort((a, b) => a.name.localeCompare(b.name))
if (
  magic.length < 200 ||
  equipment.length < 80 ||
  !magic.some((i) => i.name === 'Bag of Holding') ||
  !magic.some((i) => i.name === 'Wings of Flying')
)
  throw Error(
    `Incomplete item extraction: ${magic.length} magic, ${equipment.length} equipment. ${magic.slice(0, 5).map((i) => i.name)}`,
  )
await writeFile('src/data/legacy-items.json', JSON.stringify(items, null, 2) + '\n')
console.log(
  `${equipment.length} equipment entries; ${magic.length} magic-item definitions; ${items.length} unique entries`,
)

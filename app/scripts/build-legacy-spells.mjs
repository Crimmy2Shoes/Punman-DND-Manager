import { getDocument } from 'pdfjs-dist/legacy/build/pdf.mjs'
import { readFile, writeFile } from 'node:fs/promises'
const pdf = await getDocument({
  data: new Uint8Array(await readFile('../References/SRD_CC_v5.1.pdf')),
  useSystemFonts: true,
}).promise
const rows = []
const clean = (s) =>
  s
    .replace(/[\u00ad\u200b]/g, '')
    .replace(/[‐‑–]/g, '-')
    .replace(/-+/g, '-')
    .replace(/\s+/g, ' ')
    .trim()
for (let n = 105; n <= 194; n++) {
  const content = await (await pdf.getPage(n)).getTextContent()
  const items = content.items.filter(
    (i) => 'str' in i && i.str.trim() && i.transform[5] > 40 && i.transform[5] < 750,
  )
  for (const col of [
    items.filter((i) => i.transform[4] < 310),
    items.filter((i) => i.transform[4] >= 310),
  ]) {
    const lines = []
    for (const item of col.sort(
      (a, b) => b.transform[5] - a.transform[5] || a.transform[4] - b.transform[4],
    )) {
      let line = lines.find((l) => Math.abs(l.y - item.transform[5]) < 2)
      if (!line) {
        line = { y: item.transform[5], items: [] }
        lines.push(line)
      }
      line.items.push(item)
    }
    for (const line of lines)
      rows.push({
        page: n,
        text: clean(
          line.items
            .sort((a, b) => a.transform[4] - b.transform[4])
            .map((i) => i.str)
            .join(' '),
        ).replace(/^Component:/, 'Components:'),
        heading: line.items.every((i) => i.transform[0] >= 11.9),
      })
  }
}
const normalize = (s) => s.toLowerCase().replace(/[‘’']/g, '').replace(/\s+/g, ' ').trim()
const classLists = new Map()
let className = ''
for (const row of rows.filter((r) => r.page < 114)) {
  const match = /^(Bard|Cleric|Druid|Paladin|Ranger|Sorcerer|Warlock|Wizard) Spells$/.exec(row.text)
  if (match) {
    className = match[1]
    continue
  }
  if (className && !row.heading) {
    const key = normalize(row.text),
      names = classLists.get(key) ?? []
    if (!names.includes(className)) names.push(className)
    classLists.set(key, names)
  }
}
const bodyRows = rows.filter((r) => r.page >= 114)
const heads = bodyRows
  .map((r, i) =>
    r.heading && /^(?:[1-9](?:st|nd|rd|th)-level|[a-z]+ cantrip)/i.test(bodyRows[i + 1]?.text ?? '')
      ? i
      : -1,
  )
  .filter((i) => i >= 0)
const spells = heads.map((index, n) => {
  const chunk = bodyRows.slice(index, heads[n + 1] ?? bodyRows.length),
    name = chunk[0].text,
    meta = chunk[1].text,
    lines = chunk.slice(2).map((r) => r.text)
  const field = (label) => {
    const start = lines.findIndex((l) => l.startsWith(label + ':'))
    if (start < 0) return ''
    let end = start + 1
    while (
      end < lines.length &&
      !/^(Casting Time|Range|Components|Duration):/.test(lines[end]) &&
      !(label === 'Duration')
    )
      end++
    return lines
      .slice(start, end)
      .join(' ')
      .replace(label + ':', '')
      .trim()
  }
  const durationIndex = lines.findIndex((l) => l.startsWith('Duration:'))
  const components = field('Components'),
    duration = field('Duration')
  const description = lines
    .slice(durationIndex + 1)
    .join('\n')
    .replace(/-\n(?=[a-z])/g, '')
  return {
    name,
    level: Number(meta.match(/^([1-9])/)?.[1] ?? 0),
    school: meta
      .replace(/^[1-9](?:st|nd|rd|th)-level /, '')
      .replace(/ cantrip| \(ritual\)/g, '')
      .trim(),
    castingTime: field('Casting Time'),
    range: field('Range'),
    components,
    materials: components.match(/\((.+)\)/)?.[1] ?? '',
    duration,
    ritual: /\(ritual\)/.test(meta),
    concentration: /Concentration/i.test(duration),
    description,
    classes: classLists.get(normalize(name)) ?? [],
    source: 'SRD 5.1',
    page: chunk[0].page,
  }
})
const invalid = spells.filter(
  (s) =>
    !s.name ||
    !s.castingTime ||
    !s.range ||
    !s.components ||
    !s.duration ||
    !s.description ||
    !s.classes.length,
)
if (spells.length !== 319 || new Set(spells.map((s) => s.name)).size !== 319 || invalid.length)
  throw Error(
    JSON.stringify({
      count: spells.length,
      invalid: invalid.map((s) => ({ name: s.name, classes: s.classes, components: s.components })),
    }),
  )
await writeFile('src/data/legacy-spells.json', JSON.stringify(spells, null, 2) + '\n')
console.log(
  'Built',
  spells.length,
  'SRD 5.1 spell definitions; classes:',
  [...new Set(spells.flatMap((s) => s.classes))].join(', '),
)

import { getDocument } from 'pdfjs-dist/legacy/build/pdf.mjs'
import { readFile, writeFile } from 'node:fs/promises'
const pdf = await getDocument({
  data: new Uint8Array(await readFile('../References/SRD_CC_v5.2.1.pdf')),
  useSystemFonts: true,
}).promise
const pages = []
for (let n = 1; n <= 192; n++) {
  const page = await pdf.getPage(n),
    content = await page.getTextContent()
  const items = content.items.filter(
    (i) => 'str' in i && i.str.trim() && i.transform[5] > 40 && i.transform[5] < 755,
  )
  const columns = [
    items.filter((i) => i.transform[4] < 310),
    items.filter((i) => i.transform[4] >= 310),
  ]
  const lines = columns.flatMap((col) => {
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
    return rows.map((r) =>
      r.items
        .sort((a, b) => a.transform[4] - b.transform[4])
        .map((i) => i.str)
        .join(' '),
    )
  })
  pages.push({
    page: n,
    lines,
    items: items.map((i) => ({
      text: i.str,
      x: i.transform[4],
      y: i.transform[5],
      size: i.transform[0],
      font: i.fontName,
      width: i.width,
    })),
  })
}
await writeFile('../References/srd-extracted.json', JSON.stringify(pages))
console.log('Extracted', pages.length, 'pages')
console.log(JSON.stringify(pages[106].items.slice(0, 35), null, 2))

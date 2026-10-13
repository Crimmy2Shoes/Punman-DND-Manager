import { test, expect } from '@playwright/test'
import type { Page } from '@playwright/test'
import fs from 'node:fs'
import AxeBuilder from '@axe-core/playwright'
import { pugilistPreview } from '../src/pugilist'
const template = JSON.parse(
  fs.readFileSync(new URL('../src/data/punpun.json', import.meta.url), 'utf8'),
)
test('owner generates a link for an existing player sheet', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: 'Share player link', exact: true }).click()
  await page
    .getByLabel('Player app address', { exact: true })
    .fill('https://characters.example.test')
  await page
    .getByLabel('Player’s spreadsheet URL', { exact: true })
    .fill('https://docs.google.com/spreadsheets/d/alice_character_1234567890/edit')
  await expect(page.getByLabel('Character link', { exact: true })).toHaveValue(
    'https://characters.example.test/?player=1&character=alice_character_1234567890',
  )
})
async function mockGoogle(page: Page, withPugilist = false) {
  const book = withPugilist ? pugilistPreview(structuredClone(template)) : structuredClone(template)
  book.sheets[0].cells.C6 = { value: 'PunPun' }
  book.sheets[0].cells.R12 = { value: 17, formula: '=10+7' }
  if (withPugilist) {
    for (const [a, v] of Object.entries({
      T5: 'Pugilist 6 The Sweet Science',
      R17: 10,
      R21: 0,
      U16: 30,
      C13: 3,
      C23: 2,
      H14: 3,
    }))
      book.sheets[0].cells[a] = { ...book.sheets[0].cells[a], value: v }
    const tab = book.sheets.find((s: any) => s.title === 'Pugilist')!
    for (const [a, v] of Object.entries({
      B2: 6,
      B3: 'The Sweet Science',
      B4: 4,
      B5: 4,
      B6: '1d8',
      B7: true,
      B8: 14,
      B9: 6,
      B10: '1d8+3',
      B27: 8,
      B28: 8,
      B29: 4,
      B30: 12,
      B16: 0,
      B31: 15,
      B32: 2,
    }))
      tab.cells[a].value = v
  }
  const writes: unknown[] = []
  await page.addInitScript(() => {
    localStorage.setItem(
      'punpun-workbook-settings',
      JSON.stringify({
        url: 'https://docs.google.com/spreadsheets/d/1fL_L9AuurbK6zpHtkrPiHfTIJ2NiAp0Gs1ar5AnGeRM/edit?gid=359784640',
        clientId: 'test.apps.googleusercontent.com',
      }),
    )
    ;(window as any).google = {
      accounts: {
        oauth2: {
          initTokenClient: (config: any) => ({
            requestAccessToken: () =>
              config.callback({
                access_token: 'mock-access',
                expires_in: 3600,
                scope: 'https://www.googleapis.com/auth/spreadsheets',
              }),
          }),
          revoke: (_: unknown, callback: () => void) => callback(),
        },
      },
    }
  })
  await page.route('https://sheets.googleapis.com/**', async (route) => {
    const request = route.request()
    if (request.method() === 'POST') {
      const body = request.postDataJSON()
      writes.push(body)
      for (const item of body.data) {
        const m = /^'(.+)'!([A-Z]+\d+)$/.exec(item.range)!
        const sheet = book.sheets.find((s: any) => s.title === m[1])!
        sheet.cells[m[2]] = { ...sheet.cells[m[2]], value: item.values[0][0] }
      }
      await route.fulfill({ json: { totalUpdatedCells: body.data.length } })
      return
    }
    const sheets = book.sheets.map((s: any, index: number) => {
      const rowCount = s.title === 'Class Info' ? 600 : 201
      const rows: any[] = Array.from({ length: rowCount }, () => ({ values: [] }))
      for (const [address, cell] of Object.entries(s.cells) as [string, any][]) {
        const m = /^([A-Z]+)(\d+)$/.exec(address)!
        const col = [...m[1]].reduce((n, c) => n * 26 + c.charCodeAt(0) - 64, 0) - 1
        const row = Number(m[2]) - 1
        if (row >= rowCount || col > 54) continue
        const v =
          typeof cell.value === 'number'
            ? { numberValue: cell.value }
            : typeof cell.value === 'boolean'
              ? { boolValue: cell.value }
              : { stringValue: cell.value }
        rows[row].values[col] = {
          effectiveValue: v,
          userEnteredValue: cell.formula ? { formulaValue: cell.formula } : v,
        }
        if (cell.format) {
          const rgb = (hex: string) => ({
            red: parseInt(hex.slice(1, 3), 16) / 255,
            green: parseInt(hex.slice(3, 5), 16) / 255,
            blue: parseInt(hex.slice(5, 7), 16) / 255,
          })
          rows[row].values[col].effectiveFormat = {
            textFormat: {
              underline: cell.format.underline,
              foregroundColor: cell.format.color ? rgb(cell.format.color) : undefined,
            },
            backgroundColor: cell.format.background ? rgb(cell.format.background) : undefined,
          }
        }
        if (cell.validation)
          rows[row].values[col].dataValidation = {
            condition: {
              type: cell.validation.type,
              values: cell.validation.values.map((userEnteredValue: string) => ({
                userEnteredValue,
              })),
            },
            strict: cell.validation.strict,
          }
      }
      const validations =
        s.title === 'v2.1'
          ? { T7: ['Hill Dwarf', 'DM Custom Race'], AJ11: ['Acolyte', 'DM Custom Background'] }
          : {}
      for (const [address, options] of Object.entries(validations) as [string, string[]][]) {
        const m = /^([A-Z]+)(\d+)$/.exec(address)!
        const col = [...m[1]].reduce((n, c) => n * 26 + c.charCodeAt(0) - 64, 0) - 1
        rows[+m[2] - 1].values[col] = {
          ...(rows[+m[2] - 1].values[col] ?? {}),
          dataValidation: {
            condition: {
              type: 'ONE_OF_LIST',
              values: options.map((userEnteredValue) => ({ userEnteredValue })),
            },
            strict: true,
          },
        }
      }
      return {
        properties: {
          title: s.title,
          sheetId: index === 0 ? 359784640 : index,
          gridProperties: { rowCount, columnCount: 55 },
        },
        data: [{ rowData: rows }],
      }
    })
    await route.fulfill({ json: { properties: { title: 'PunPun Live' }, sheets } })
  })
  await page.goto('/')
  await page.getByRole('button', { name: 'Connect Google Sheet', exact: true }).click()
  await page.getByRole('button', { name: 'Sign in with Google', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'PunPun', exact: true })).toBeVisible()
  return { book, writes }
}
test('template creation stages spreadsheet inputs and keeps drafts on reload', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: 'Create / edit character', exact: true }).click()
  const dialog = page.getByRole('dialog')
  await dialog.getByLabel('Character name', { exact: true }).fill('New PunPun')
  await dialog.getByLabel('Race', { exact: true }).selectOption('Hill Dwarf')
  await dialog.getByRole('button', { name: '2. Class', exact: true }).click()
  await dialog.getByLabel('Creation class', { exact: true }).selectOption('Fighter')
  await dialog.getByRole('button', { name: 'Use selected class', exact: true }).click()
  await dialog.getByRole('button', { name: '3. Scores', exact: true }).click()
  await dialog.getByRole('button', { name: 'Use standard array in displayed order' }).click()
  await dialog.getByRole('button', { name: 'Review character changes' }).click()
  await expect(
    page.getByRole('button', { name: 'Save to spreadsheet', exact: true }),
  ).toBeDisabled()
  await page.reload()
  await page.getByRole('button', { name: 'Character', exact: true }).click()
  await expect(page.getByLabel('Character name', { exact: true })).toHaveValue('New PunPun')
  await expect(page.getByLabel('Strength base', { exact: true })).toHaveValue('15')
  await expect(page.getByLabel('Classes and levels', { exact: true })).toHaveValue('Fighter 1')
})
test('reads spreadsheet calculations, dynamic DM choices and automatic updates', async ({
  page,
}) => {
  await page.clock.install()
  const { book } = await mockGoogle(page)
  await expect(page.locator('.sheet-stats')).toContainText('17')
  await page.getByRole('button', { name: 'Character', exact: true }).click()
  await expect(
    page
      .getByLabel('Race', { exact: true })
      .getByRole('option', { name: 'DM Custom Race', exact: true }),
  ).toHaveCount(1)
  book.sheets[0].cells.C6 = { value: 'DM Renamed PunPun' }
  await page.clock.runFor(31000)
  await expect(page.getByRole('heading', { name: 'DM Renamed PunPun', exact: true })).toBeVisible()
  await page.reload()
  await expect(page.getByRole('heading', { name: 'DM Renamed PunPun', exact: true })).toBeVisible()
})
test('shows DM conflicts, saves only resolved edited cells with RAW values', async ({ page }) => {
  const { book, writes } = await mockGoogle(page)
  await page.getByRole('button', { name: 'Character', exact: true }).click()
  await page.getByLabel('Character name', { exact: true }).fill('My PunPun')
  book.sheets[0].cells.C6 = { value: 'DM PunPun' }
  await page.getByRole('button', { name: 'Refresh', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'DM PunPun', exact: true })).toBeVisible()
  await expect(page.getByLabel('Character name', { exact: true })).toHaveValue('My PunPun')
  await page.getByRole('button', { name: 'Review changes', exact: true }).click()
  await expect(
    page.getByRole('button', { name: 'Save to spreadsheet', exact: true }),
  ).toBeDisabled()
  await page.getByRole('button', { name: 'Keep my edit', exact: true }).click()
  await page.getByRole('button', { name: 'Save to spreadsheet', exact: true }).click()
  await expect.poll(() => writes.length).toBeGreaterThan(0)
  await expect(page.getByRole('heading', { name: 'My PunPun', exact: true })).toBeVisible()
  expect(writes).toEqual([
    { valueInputOption: 'RAW', data: [{ range: "'v2.1'!C6", values: [['My PunPun']] }] },
  ])
})
test('rechecks late DM edits before writes and keeps calculated cells read only', async ({
  page,
}) => {
  const { book, writes } = await mockGoogle(page)
  await page.getByRole('button', { name: 'Character', exact: true }).click()
  await expect(page.getByLabel('Strength effective', { exact: true })).toHaveJSProperty(
    'tagName',
    'OUTPUT',
  )
  await page.getByLabel('Character name', { exact: true }).fill('Draft name')
  await page.getByRole('button', { name: 'Review changes', exact: true }).click()
  book.sheets[0].cells.C6 = { value: 'Late DM change' }
  await page.getByRole('button', { name: 'Save to spreadsheet', exact: true }).click()
  await expect(page.getByRole('dialog').getByRole('alert')).toContainText(
    'Your DM changed a cell you edited.',
  )
  expect(writes).toHaveLength(0)
})
test('desktop sections fit and remain accessible', async ({ page }) => {
  test.setTimeout(120000)
  await page.setViewportSize({ width: 1440, height: 1000 })
  await page.goto('/')
  await expect(page.getByRole('navigation', { name: 'Character sections' })).toHaveCount(0)
  await expect(page.getByRole('button', { name: 'Character', exact: true })).toHaveCount(1)
  for (const name of ['Play', 'Character', 'Spells', 'Inventory', 'Notes & Lore', 'Workbook']) {
    await page.getByRole('button', { name, exact: true }).click()
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
    ).toBe(true)
    const result = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze()
    expect(
      result.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target).join(',')}`),
    ).toEqual([])
  }
})
test('Pugilist resources and reaction edits save to their own cells', async ({ page }) => {
  const { book, writes } = await mockGoogle(page, true)
  await page.getByRole('button', { name: 'Pugilist', exact: true }).click()
  await expect(page.getByLabel('Fisticuffs die', { exact: true })).toHaveText('1d8')
  await page.getByLabel('Moxie cost', { exact: true }).fill('2')
  await page.getByRole('button', { name: 'Spend Moxie', exact: true }).click()
  await expect(page.getByLabel('Moxie remaining', { exact: true })).toHaveValue('2')
  await page.getByRole('button', { name: 'Review changes', exact: true }).click()
  await page.getByRole('button', { name: 'Save to spreadsheet', exact: true }).click()
  await expect(page.getByRole('dialog')).toHaveCount(0)
  expect(writes[0]).toEqual({
    valueInputOption: 'RAW',
    data: [{ range: "'Pugilist'!B5", values: [[2]] }],
  })
  await page.getByRole('button', { name: 'Use Bloodied But Unbowed', exact: true }).click()
  await expect(page.getByLabel('Moxie remaining', { exact: true })).toHaveValue('4')
  await expect(page.getByLabel('Bloodied But Unbowed available', { exact: true })).toHaveValue(
    'false',
  )
  await page.getByRole('button', { name: 'Review changes', exact: true }).click()
  await expect(page.getByRole('dialog')).toContainText('v2.1!R21')
  await page.getByRole('button', { name: 'Save to spreadsheet', exact: true }).click()
  await expect(page.getByRole('dialog')).toHaveCount(0)
  expect(book.sheets[0].cells.R21.value).toBe(8)
  await page.getByRole('button', { name: 'Recover short-rest resources', exact: true }).click()
  await expect(page.getByLabel('Bloodied But Unbowed available', { exact: true })).toHaveValue(
    'true',
  )
})
test('Pugilist follows DM resource updates and detects conflicting point edits', async ({
  page,
}) => {
  const { book } = await mockGoogle(page, true)
  await page.getByRole('button', { name: 'Pugilist', exact: true }).click()
  await page.getByLabel('Moxie cost', { exact: true }).fill('1')
  await page.getByRole('button', { name: 'Spend Moxie', exact: true }).click()
  const pugilist = book.sheets.find((s: any) => s.title === 'Pugilist')!
  pugilist.cells.B5.value = 2
  pugilist.cells.B4.value = 5
  await page.getByRole('button', { name: 'Refresh', exact: true }).click()
  await expect(page.getByLabel('Moxie maximum', { exact: true })).toHaveText('5')
  await expect(page.getByLabel('Moxie remaining', { exact: true })).toHaveValue('3')
  await page.getByRole('button', { name: 'Review changes', exact: true }).click()
  await expect(
    page.getByRole('button', { name: 'Save to spreadsheet', exact: true }),
  ).toBeDisabled()
  await page.getByRole('button', { name: 'Use sheet value', exact: true }).click()
  await page.getByRole('button', { name: 'Close dialog', exact: true }).click()
  await expect(page.getByLabel('Moxie remaining', { exact: true })).toHaveValue('2')
})
test('class sections follow DM changes even when a Pugilist worksheet remains installed', async ({
  page,
}) => {
  const { book } = await mockGoogle(page, true)
  await page.getByRole('button', { name: 'Pugilist', exact: true }).click()
  await expect(page.getByLabel('Moxie remaining', { exact: true })).toBeVisible()
  book.sheets[0].cells.T5 = { value: 'Sorcerer 5 Wild Magic' }
  await page.getByRole('button', { name: 'Refresh', exact: true }).click()
  await expect(page.getByRole('button', { name: 'Pugilist', exact: true })).toHaveCount(0)
  await expect(page.getByRole('button', { name: 'Go to Pugilist', exact: true })).toHaveCount(0)
  await expect(page.getByRole('heading', { name: 'Your turn', exact: true })).toBeVisible()
  await expect(page.getByText('Moxie', { exact: true })).toHaveCount(0)
  await page.getByRole('button', { name: /^Passive/ }).click()
  await page.getByLabel('Find an ability', { exact: true }).fill('Font of Magic')
  await expect(page.getByRole('button', { name: /Font of Magic/ })).toBeVisible()
  book.sheets[0].cells.T5 = { value: 'Sorcerer 4 Wild Magic Pugilist 1' }
  await page.getByRole('button', { name: 'Refresh', exact: true }).click()
  await expect(page.getByRole('button', { name: 'Pugilist', exact: true })).toBeVisible()
})

test('draft class edits hide the Pugilist section and restore it when discarded', async ({
  page,
}) => {
  await mockGoogle(page, true)
  await page.getByRole('button', { name: 'Character', exact: true }).click()
  await page.getByLabel('Classes and levels', { exact: true }).fill('Sorcerer 5 Wild Magic')
  await expect(page.getByRole('button', { name: 'Pugilist', exact: true })).toHaveCount(0)
  await page.getByRole('button', { name: 'Review changes', exact: true }).click()
  await page.getByRole('button', { name: 'Use sheet value', exact: true }).click()
  await page.getByRole('button', { name: 'Close dialog', exact: true }).click()
  await expect(page.getByRole('button', { name: 'Pugilist', exact: true })).toBeVisible()
})

test('uninstalled live sheet offers the artwork-preserving installer', async ({ page }) => {
  const { book } = await mockGoogle(page)
  book.sheets[0].cells.T5 = { value: 'Pugilist 5' }
  await page.getByRole('button', { name: 'Refresh', exact: true }).click()
  await page.getByRole('button', { name: 'Pugilist', exact: true }).click()
  await expect(
    page.getByRole('heading', { name: 'Add Pugilist to your spreadsheet', exact: true }),
  ).toBeVisible()
  await expect(
    page.getByRole('link', { name: 'Download Pugilist installer', exact: true }),
  ).toHaveAttribute('href', '/Install_Pugilist.gs')
})
test('skill choices follow live name formatting and the separate yellow marker reminder', async ({
  page,
}) => {
  const { book } = await mockGoogle(page, true)
  const main = book.sheets[0]
  for (const [address, color] of Object.entries({
    J28: '#4a86e8',
    J26: '#9556e0',
    J29: '#c136a1',
    J27: '#d58d41',
  }))
    main.cells[address].format = { color, underline: true }
  main.cells.H28.format = { background: '#fff2cc' }
  await page.getByRole('button', { name: 'Refresh', exact: true }).click()
  await page.getByRole('button', { name: 'Character', exact: true }).click()
  const athletics = page.getByLabel('Athletics', { exact: true }).locator('..')
  await expect(athletics.getByText('Class choice', { exact: true })).toBeVisible()
  await expect(athletics.getByTitle('Selection pending in sheet', { exact: true })).toBeVisible()
  await expect(athletics.locator('.skill-name')).toHaveCSS('text-decoration-line', 'underline')
  await expect(page.getByLabel('Animal Handling', { exact: true }).locator('..')).toContainText(
    'Race grant',
  )
  await expect(page.getByLabel('Deception', { exact: true }).locator('..')).toContainText(
    'Race choice',
  )
  await expect(page.getByLabel('Arcana', { exact: true }).locator('..')).toContainText(
    'Background grant',
  )
  expect(
    (await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze()).violations,
  ).toEqual([])
  await page.getByLabel('Athletics', { exact: true }).selectOption('1')
  await page.getByText('Skill colors', { exact: true }).click()
  await expect(
    page.getByText('Choice colors reflect the last sheet refresh.', { exact: false }),
  ).toBeVisible()
  await page.getByRole('button', { name: 'Review changes', exact: true }).click()
  await page.getByRole('button', { name: 'Save to spreadsheet', exact: true }).click()
  await expect(page.getByRole('dialog')).toHaveCount(0)
  main.cells.J28.format = { color: '#000000', underline: false }
  main.cells.H28.format = { background: '#ffffff' }
  await page.getByRole('button', { name: 'Refresh', exact: true }).click()
  await expect(athletics.getByText('Class choice', { exact: true })).toHaveCount(0)
  await expect(athletics.getByTitle('Selection pending in sheet', { exact: true })).toHaveCount(0)
  await expect(page.getByLabel('Athletics', { exact: true })).toHaveValue('1')
})
test('creation shows concise steps and previews background effects on hover and keyboard focus', async ({
  page,
}) => {
  await page.goto('/')
  await page.getByRole('button', { name: 'Create / edit character', exact: true }).click()
  const dialog = page.getByRole('dialog')
  await expect(dialog.getByLabel('Strength base', { exact: true })).toHaveCount(0)
  await dialog.getByRole('combobox', { name: 'Background', exact: true }).click()
  await dialog.getByRole('option', { name: 'Acolyte', exact: true }).hover()
  await expect(dialog.getByRole('tooltip')).toContainText('Insight, Religion')
  await dialog.getByRole('option', { name: 'Criminal', exact: true }).focus()
  await expect(dialog.getByRole('tooltip')).toContainText('Deception, Stealth')
  await page.keyboard.press('Enter')
  await expect(dialog.getByRole('combobox', { name: 'Background', exact: true })).toHaveText(
    'Criminal⌄',
  )
  await expect(dialog.getByRole('listbox')).toHaveCount(0)
  await dialog.getByRole('button', { name: 'Next', exact: true }).click()
  await expect(dialog.getByLabel('Creation class', { exact: true })).toBeVisible()
  await expect(dialog.getByRole('combobox', { name: 'Background', exact: true })).toHaveCount(0)
  await dialog.getByRole('button', { name: 'Back', exact: true }).click()
  await expect(dialog.getByRole('combobox', { name: 'Background', exact: true })).toHaveText(
    'Criminal⌄',
  )
})
test('inventory searches distant sheet rows and edits items through compact dialogs', async ({
  page,
}) => {
  const { book, writes } = await mockGoogle(page)
  const inventory = book.sheets.find((s: any) => s.title === 'Inventory')!
  inventory.cells.J70 = { value: 'Faraway shield' }
  inventory.cells.I70 = { value: 2 }
  await page.getByRole('button', { name: 'Refresh', exact: true }).click()
  await page.getByRole('button', { name: 'Inventory', exact: true }).click()
  await page.getByLabel('Search inventory', { exact: true }).fill('Faraway')
  await page.getByRole('button', { name: /^Faraway shield/ }).click()
  await expect(page.getByLabel('Quantity', { exact: true })).toHaveValue('2')
  await page.getByLabel('Quantity', { exact: true }).fill('3')
  await page.getByRole('button', { name: 'Done', exact: true }).click()
  await page.getByLabel('Search inventory', { exact: true }).fill('')
  await page.getByRole('button', { name: 'Add item', exact: true }).click()
  await page.getByLabel('Item name', { exact: true }).fill('Rope')
  await page.getByLabel('Quantity', { exact: true }).fill('1')
  await page.getByLabel('Cost', { exact: true }).fill('1 gp')
  await page.getByLabel('Weight (lb)', { exact: true }).fill('10')
  await page.getByRole('button', { name: 'Done', exact: true }).click()
  await page.getByRole('button', { name: 'Review changes', exact: true }).click()
  await page.getByRole('button', { name: 'Save to spreadsheet', exact: true }).click()
  await expect(page.getByRole('dialog')).toHaveCount(0)
  expect(inventory.cells.J3.value).toBe('Rope')
  expect(inventory.cells.I70.value).toBe(3)
  expect((writes[0] as any).data.map((r: any) => r.range)).toContain("'Inventory'!J3")
  await expect(page.getByRole('button', { name: /^Rope/ })).toBeVisible()
})
test('spell filters, preparation and slot dialogs preserve spreadsheet mappings', async ({
  page,
}) => {
  const { book } = await mockGoogle(page)
  await page.getByRole('button', { name: 'Spells', exact: true }).click()
  await page.getByLabel('Add spell level', { exact: true }).selectOption('1')
  await page.getByRole('button', { name: 'Add spell', exact: true }).click()
  await page.getByLabel('Spell name', { exact: true }).fill('Magic Missile')
  await page.getByLabel('Prepared', { exact: true }).selectOption('1')
  await page.getByRole('button', { name: 'Done', exact: true }).click()
  await page.getByLabel('Spell level', { exact: true }).selectOption('1')
  await page.getByLabel('Ready only', { exact: true }).check()
  await page.getByRole('button', { name: /^Magic Missile/ }).click()
  await expect(page.getByLabel('Prepared', { exact: true })).toHaveValue('1')
  await page.getByRole('button', { name: 'Done', exact: true }).click()
  await page.getByRole('button', { name: 'Review changes', exact: true }).click()
  await page.getByRole('button', { name: 'Save to spreadsheet', exact: true }).click()
  await expect(page.getByRole('dialog')).toHaveCount(0)
  expect(book.sheets[0].cells.D100.value).toBe('Magic Missile')
  expect(book.sheets[0].cells.C100.value).toBe(1)
  await page.getByLabel('Search spells', { exact: true }).fill('Absent spell')
  await expect(page.getByText('No matching spells.', { exact: true })).toBeVisible()
  await page.getByRole('button', { name: /^Level 1 / }).click()
  await expect(page.getByLabel('Slot total', { exact: true })).toHaveJSProperty('tagName', 'OUTPUT')
  await page.getByLabel('Slot tracker', { exact: true }).fill('1')
  await page.getByRole('button', { name: 'Done', exact: true }).click()
})

test('desktop dark mode and collapsed navigation persist and remain accessible', async ({
  page,
}) => {
  test.setTimeout(120000)
  await page.setViewportSize({ width: 1440, height: 1000 })
  await page.goto('/')
  await page.getByRole('button', { name: 'Switch to dark mode', exact: true }).click()
  await page.getByRole('button', { name: 'Collapse sidebar', exact: true }).click()
  await expect(page.locator('.sidebar')).toHaveCSS('width', '76px')
  await page.reload()
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark')
  await expect(page.getByRole('button', { name: 'Expand sidebar', exact: true })).toBeVisible()
  for (const name of ['Play', 'Character', 'Spells', 'Inventory', 'Notes & Lore', 'Workbook']) {
    await page.getByRole('button', { name, exact: true }).click()
    const result = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze()
    expect(
      result.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target).join(',')}`),
    ).toEqual([])
  }
  await page.getByRole('button', { name: 'Expand sidebar', exact: true }).click()
  await expect(page.locator('.sidebar')).toHaveCSS('width', '250px')
  await page
    .locator('.sidebar')
    .getByRole('button', { name: 'Rules & overrides', exact: true })
    .click()
  expect(
    (await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze()).violations,
  ).toEqual([])
  await page.getByRole('button', { name: 'Close dialog', exact: true }).click()
})

test('level 5 Pugilist guide includes relevant actions and hides higher-level abilities', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 1050 })
  const { book } = await mockGoogle(page, true)
  book.sheets[0].cells.T5.value = 'Pugilist 5 The Sweet Science'
  book.sheets[0].cells.AL6.value = 5
  book.sheets[0].cells.Z12.value = 30
  book.sheets[0].cells.V12.value = 1
  book.sheets.find((s: any) => s.title === 'Pugilist')!.cells.B4.value = 3
  book.sheets.find((s: any) => s.title === 'Pugilist')!.cells.B5.value = 3
  book.sheets.find((s: any) => s.title === 'Pugilist')!.cells.B2.value = 5
  await page.getByRole('button', { name: 'Refresh', exact: true }).click()
  await expect(page.getByRole('button', { name: /Brace Up/ })).toBeVisible()
  await page.getByRole('button', { name: /^Reaction\s*\d/ }).click()
  await page.getByRole('button', { name: /Cross Counter/ }).click()
  await expect(page.getByRole('dialog')).toContainText('2 Moxie')
  await expect(page.getByRole('dialog')).toContainText('1d10 + Strength + level')
  await page.getByRole('button', { name: 'Done', exact: true }).click()
  await page.getByRole('button', { name: /^Passive\s*\d/ }).click()
  await page.getByLabel('Find an ability', { exact: true }).fill('Extra Attack')
  await expect(page.getByRole('button', { name: /Extra Attack/ })).toBeVisible()
  await page.getByLabel('Find an ability', { exact: true }).fill('Moxie-Fueled Fists')
  await expect(page.locator('.ability-card')).toHaveCount(0)
  await page.getByLabel('Find an ability', { exact: true }).fill('')
  await page.getByRole('button', { name: /^Bonus action\s*\d/ }).click()
  await page.screenshot({ path: 'test-results/companion-desktop-light.png' })
  await page.getByRole('button', { name: 'Switch to dark mode', exact: true }).click()
  await expect(page.locator('.ability-card').first()).toHaveCSS(
    'background-color',
    'rgb(27, 37, 32)',
  )
  await page.screenshot({ path: 'test-results/companion-desktop-dark.png' })
  await page.getByRole('button', { name: /Brace Up/ }).click()
  expect(
    (await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze()).violations,
  ).toEqual([])
})

test('skill count restrictions, DM bonuses and custom abilities persist for the spreadsheet', async ({
  page,
}) => {
  const { book } = await mockGoogle(page, true)
  const main = book.sheets[0]
  main.cells.T5.value = 'Pugilist 5 The Sweet Science'
  for (const a of ['H28', 'H29']) main.cells[a].value = 1
  await page.getByRole('button', { name: 'Refresh', exact: true }).click()
  await page.getByRole('button', { name: 'Character', exact: true }).click()
  await expect(page.locator('.budget-stats')).toContainText('2 / 2')
  await page.getByLabel('Stealth', { exact: true }).selectOption('1')
  await expect(page.getByRole('alert')).toContainText('2 skill proficiency slots')
  await expect(page.getByRole('dialog', { name: 'Skill choice unavailable' })).toBeVisible()
  await page.getByRole('button', { name: 'Got it', exact: true }).click()
  await expect(page.getByLabel('Stealth', { exact: true })).toHaveValue('0')
  await page
    .locator('.sidebar')
    .getByRole('button', { name: 'Rules & overrides', exact: true })
    .click()
  await page.getByLabel('Extra skill proficiencies from DM', { exact: true }).fill('1')
  await page
    .getByLabel('DM ruling / reason', { exact: true })
    .fill('DM granted an extra skill at level 5')
  await page.getByLabel('Custom ability name', { exact: true }).fill('Arena feint')
  await page
    .getByLabel('Custom ability effect', { exact: true })
    .fill('Bonus action; once per short rest; DM ruling.')
  await page.getByRole('button', { name: 'Add ability', exact: true }).click()
  await page.getByRole('button', { name: 'Save rules', exact: true }).click()
  await page.getByLabel('Stealth', { exact: true }).selectOption('1')
  await expect(page.getByLabel('Stealth', { exact: true })).toHaveValue('1')
  await expect(page.locator('.budget-stats')).toContainText('3 / 3')
  await page.getByLabel('Athletics', { exact: true }).selectOption('e')
  await expect(page.getByRole('alert')).toContainText('0 Expertise slots')
  await page.reload()
  await expect(page.getByRole('button', { name: /Arena feint/ })).toBeVisible()
  await page.getByRole('button', { name: 'Character', exact: true }).click()
  await expect(page.locator('.budget-stats')).toContainText('3 / 3')
})

test('Acrobatics explains occupied class choices and allows replacing one', async ({ page }) => {
  const { book } = await mockGoogle(page, true)
  const main = book.sheets[0]
  Object.assign(main.cells, {
    T5: { value: 'Pugilist 5 Piss & Vinegar' },
    T7: { value: 'Human' },
    AJ11: { value: 'Urchin' },
    AS16: { value: 2 },
  })
  for (let row = 25; row <= 42; row++) main.cells['H' + row] = { value: 0 }
  for (const address of ['H28', 'H32', 'H36']) main.cells[address] = { value: 1 }
  await page.getByRole('button', { name: 'Refresh', exact: true }).click()
  await page.getByRole('button', { name: 'Character', exact: true }).click()
  await expect(page.locator('.budget-stats')).toContainText('3 / 4')
  await expect(page.locator('.skill-grant-summary')).toContainText('Pugilist choices 2 / 2')
  await page.getByLabel('Acrobatics', { exact: true }).selectOption('1')
  const dialog = page.getByRole('dialog', { name: 'Skill choice unavailable', exact: true })
  await expect(dialog).toContainText('Pugilist: 2 slots')
  await expect(dialog).toContainText('Athletics')
  await expect(dialog).toContainText('Perception')
  await dialog.getByRole('button', { name: 'Got it', exact: true }).click()
  await expect(page.getByLabel('Acrobatics', { exact: true })).toHaveValue('0')
  await page.getByLabel('Athletics', { exact: true }).selectOption('0')
  await page.getByLabel('Acrobatics', { exact: true }).selectOption('1')
  await expect(page.getByLabel('Acrobatics', { exact: true })).toHaveValue('1')
  await expect(page.getByRole('dialog')).toHaveCount(0)
  await page.getByLabel('Acrobatics', { exact: true }).selectOption('e')
  await expect(page.getByRole('dialog', { name: 'Skill choice unavailable' })).toContainText(
    '0 Expertise slots',
  )
  await page
    .getByRole('dialog')
    .getByRole('button', { name: 'Rules & overrides', exact: true })
    .click()
  await page.getByLabel('Extra Expertise from DM', { exact: true }).fill('1')
  await page.getByRole('button', { name: 'Save rules', exact: true }).click()
  await page.getByLabel('Acrobatics', { exact: true }).selectOption('e')
  await expect(page.getByLabel('Acrobatics', { exact: true })).toHaveValue('e')
})

test('Notes & Lore edits the real text boxes and appearance without touching labels or artwork', async ({
  page,
}) => {
  const { book, writes } = await mockGoogle(page)
  const main = book.sheets[0]
  const outside = (main.cells.R164 = { value: 'Outside the backstory box' })
  main.cells.R165 = { value: 'Existing story' }
  main.cells.R147 = { value: 'Old ally' }
  main.cells.R148 = { value: 'Old organization' }
  await page.getByRole('button', { name: 'Refresh', exact: true }).click()
  await page.getByRole('button', { name: 'Notes & Lore', exact: true }).click()
  await expect(page.getByLabel('Character backstory', { exact: true })).toHaveValue(
    'Existing story',
  )
  await expect(page.getByLabel('Allies & organizations', { exact: true })).toHaveValue(
    'Old ally\nOld organization',
  )
  await page.getByLabel('Personality traits', { exact: true }).fill('Determined\nQuick to laugh')
  await page.getByLabel('Ideals', { exact: true }).fill('Protect the weak')
  await page.getByLabel('Bonds', { exact: true }).fill('My old neighborhood')
  await page.getByLabel('Flaws', { exact: true }).fill('Too stubborn')
  const appearance = {
    Age: '24',
    Height: '6 ft',
    Weight: '180 lb',
    Size: 'Medium',
    Gender: 'Male',
    Eyes: 'Brown',
    Hair: 'Black',
    Skin: 'Tan',
  }
  for (const [label, text] of Object.entries(appearance))
    await page.getByLabel(label, { exact: true }).fill(text)
  const story = Array.from({ length: 16 }, (_, i) => `Story line ${i + 1}`).join('\n')
  await page.getByLabel('Character backstory', { exact: true }).fill(story)
  await page.getByLabel('Allies & organizations', { exact: true }).fill('A new ally')
  await page.getByRole('button', { name: 'Review changes', exact: true }).click()
  await page.getByRole('button', { name: 'Save to spreadsheet', exact: true }).click()
  await expect(page.getByRole('dialog')).toHaveCount(0)
  const ranges = (writes[0] as any).data.map((e: any) => e.range)
  expect(ranges).toContain("'v2.1'!R165")
  expect(ranges).toContain("'v2.1'!R177")
  expect(ranges).toContain("'v2.1'!R147")
  expect(ranges).toContain("'v2.1'!R148")
  expect(ranges).not.toContain("'v2.1'!R164")
  expect(ranges).not.toContain("'v2.1'!R163")
  expect(ranges).not.toContain("'v2.1'!R178")
  expect(main.cells.R164).toBe(outside)
  expect(main.cells.R178.value).toBe('CHARACTER BACKSTORY')
  expect(main.cells.R148.value).toBe('')
  expect(main.cells.C155.formula).toContain('IMAGE')
  await expect(page.getByLabel('Character backstory', { exact: true })).toHaveValue(story)
  await page.reload()
  await page.getByRole('button', { name: 'Notes & Lore', exact: true }).click()
  await expect(page.getByLabel('Character backstory', { exact: true })).toHaveValue(story)
  await expect(page.getByLabel('Personality traits', { exact: true })).toHaveValue(
    'Determined\nQuick to laugh',
  )
  await page.setViewportSize({ width: 1440, height: 1000 })
  await page.getByRole('button', { name: 'Switch to dark mode', exact: true }).click()
  await page.screenshot({ path: 'test-results/notes-lore-desktop-dark.png', fullPage: true })
  await page.getByRole('button', { name: 'Inventory', exact: true }).click()
  await expect(page.getByLabel('Character backstory', { exact: true })).toHaveCount(0)
  await expect(page.getByRole('button', { name: 'Edit backstory', exact: true })).toHaveCount(0)
})

test('notes follow DM updates, keep typed newlines and reject invalid blocks without partial drafts', async ({
  page,
}) => {
  await page.clock.install()
  const { book } = await mockGoogle(page)
  const main = book.sheets[0]
  main.cells.R165 = { value: 'Old story' }
  await page.getByRole('button', { name: 'Refresh', exact: true }).click()
  await page.getByRole('button', { name: 'Notes & Lore', exact: true }).click()
  const story = page.getByLabel('Character backstory', { exact: true })
  await story.focus()
  main.cells.R165 = { value: 'DM updated story' }
  await page.clock.runFor(31000)
  await expect(story).toHaveValue('DM updated story')
  await story.press('End')
  await story.press('Enter')
  await expect(story).toHaveValue('DM updated story\n')
  await story.pressSequentially('Next chapter')
  await expect(story).toHaveValue('DM updated story\nNext chapter')
  await page.getByRole('button', { name: 'Review changes', exact: true }).click()
  await page.getByRole('button', { name: 'Use sheet value', exact: true }).click()
  await page.getByRole('button', { name: 'Close dialog', exact: true }).click()
  main.cells.R166 = {
    value: '',
    validation: { type: 'NUMBER_BETWEEN', values: ['0', '10'], strict: true },
  }
  await page.getByRole('button', { name: 'Refresh', exact: true }).click()
  await story.fill('Changed first line\nInvalid second line')
  await expect(page.getByRole('dialog', { name: 'Change unavailable', exact: true })).toContainText(
    'R166',
  )
  await page.getByRole('button', { name: 'Got it', exact: true }).click()
  await expect(story).toHaveValue('DM updated story')
  await expect(page.locator('.draft-bar')).toHaveCount(0)
})

test('compact skills show the five-skill sources, filter training and preserve cell saves', async ({
  page,
}) => {
  test.setTimeout(90000)
  await page.setViewportSize({ width: 1440, height: 1000 })
  const { book, writes } = await mockGoogle(page, true)
  const main = book.sheets[0]
  main.cells.T5.value = 'Pugilist 5 Piss & Vinegar'
  main.cells.T7 = { value: 'Human' }
  main.cells.AJ11.value = 'Urchin'
  main.cells.AS16.value = 3
  main.cells.H28.value = 1
  main.cells.H32.value = 1
  main.cells.I28.value = 6
  await page.getByRole('button', { name: 'Refresh', exact: true }).click()
  await page.getByRole('button', { name: 'Character', exact: true }).click()
  await expect(page.locator('.skills-list .skill-row')).toHaveCount(18)
  await expect(page.locator('.skills-column')).toHaveCount(2)
  await expect(page.locator('.skills-column').first().locator('.skill-row')).toHaveCount(9)
  const skillNameFits = await page
    .locator('.skill-identity > label')
    .evaluateAll((labels) => labels.every((label) => label.scrollWidth <= label.clientWidth))
  expect(skillNameFits).toBe(true)
  await expect(page.getByLabel('Athletics bonus', { exact: true })).toHaveText('+6')
  await expect(page.locator('.budget-stats')).toContainText('2 / 5')
  await page.getByRole('button', { name: 'Why this total?', exact: true }).click()
  const dialog = page.getByRole('dialog')
  await expect(dialog).toContainText('5 total skill proficiencies')
  for (const [source, count] of [
    ['Pugilist', '+2'],
    ['Piss & Vinegar', '+1'],
    ['Urchin', '+2'],
    ['Human', '0'],
  ])
    await expect(
      dialog
        .locator('.training-source-row')
        .filter({ has: page.getByText(source, { exact: true }) }),
    ).toContainText(count)
  await expect(dialog).toContainText('Only if you were not already proficient in Intimidation')
  await expect(dialog).toContainText('v2.1!AS16')
  expect(
    (await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze()).violations,
  ).toEqual([])
  await page.getByRole('button', { name: 'Done', exact: true }).click()
  await page.getByLabel('Show skills', { exact: true }).selectOption('Trained')
  await expect(page.locator('.skill-row')).toHaveCount(2)
  await page.getByLabel('Find a skill', { exact: true }).fill('Athletics')
  await expect(page.locator('.skill-row')).toHaveCount(1)
  await page.getByLabel('Find a skill', { exact: true }).fill('')
  await page.getByLabel('Show skills', { exact: true }).selectOption('All skills')
  await page.getByLabel('Stealth', { exact: true }).selectOption('1')
  await page.getByRole('button', { name: 'Review changes', exact: true }).click()
  await page.getByRole('button', { name: 'Save to spreadsheet', exact: true }).click()
  await expect(page.getByRole('dialog')).toHaveCount(0)
  expect((writes[0] as any).data).toEqual([{ range: "'v2.1'!H41", values: [[1]] }])
  await page.locator('.skills-manager').scrollIntoViewIfNeeded()
  await page
    .locator('.skills-manager')
    .screenshot({ path: 'test-results/skills-desktop-light.png' })
  await page.getByRole('button', { name: 'Switch to dark mode', exact: true }).click()
  await expect(page.locator('.skill-bonus').first()).toHaveCSS(
    'background-color',
    'rgb(38, 52, 44)',
  )
  await page.locator('.skills-manager').scrollIntoViewIfNeeded()
  await page.locator('.skills-manager').screenshot({ path: 'test-results/skills-desktop-dark.png' })
  expect(
    (await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze()).violations,
  ).toEqual([])
})

test('core spell library uses 2014 metadata, stages native cells and shows definitions', async ({
  page,
}) => {
  const { writes } = await mockGoogle(page, true)
  await page.getByRole('button', { name: 'Spells', exact: true }).click()
  await page.getByRole('button', { name: 'Browse spell definitions' }).click()
  await page.getByLabel('Find library spell', { exact: true }).fill('Shield')
  await page.getByRole('button', { name: /^Shield Level 1/ }).click()
  const dialog = page.getByRole('dialog')
  await expect(dialog.locator('.spell-metadata')).toContainText('reaction')
  await expect(dialog.locator('.spell-reference')).toContainText('magic missile')
  expect(
    (await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze()).violations,
  ).toEqual([])
  await page.getByRole('button', { name: 'Add to character sheet' }).click()
  await expect(page.getByLabel('Spell name', { exact: true })).toHaveValue('Shield')
  await page.getByRole('button', { name: 'Done', exact: true }).click()
  await page.getByRole('button', { name: 'Review changes', exact: true }).click()
  await page.getByRole('button', { name: 'Save to spreadsheet', exact: true }).click()
  await expect.poll(() => writes.length).toBeGreaterThan(0)
  expect(
    (writes[0] as any).data.some(
      (d: any) => d.range === "'v2.1'!D100" && d.values[0][0] === 'Shield',
    ),
  ).toBe(true)
  await page.getByRole('button', { name: 'Browse spell definitions' }).click()
  await page.getByLabel('Find library spell', { exact: true }).fill('Witch Bolt')
  await page.getByRole('button', { name: /^Witch Bolt Level 1/ }).click()
  await expect(page.getByRole('dialog').locator('.spell-metadata')).toContainText('30 feet')
  await expect(page.getByRole('dialog')).toContainText('PHB 2014')
})

test('rules browser shows official coverage, missing native options and class-level unlocks', async ({
  page,
}) => {
  await mockGoogle(page)
  await page.getByRole('button', { name: 'Rules library', exact: true }).click()
  await expect(page.locator('.rules-coverage-stats')).toContainText('118 official subclasses')
  await page.getByLabel('Library subclass', { exact: true }).selectOption('Arcane Trickster')
  await page.getByLabel('Library class level', { exact: true }).fill('3')
  await page.getByLabel('Search class features', { exact: true }).fill('Spell Thief')
  await expect(page.getByRole('button', { name: /^Spell Thief/ })).toContainText('Future unlock')
  await page.getByLabel('Show future unlocks', { exact: true }).uncheck()
  await expect(page.getByRole('button', { name: /^Spell Thief/ })).toHaveCount(0)
  await page.getByLabel('Library class level', { exact: true }).fill('17')
  await page.getByRole('button', { name: /^Spell Thief/ }).click()
  await expect(page.getByRole('dialog')).toContainText('Reaction')
  await expect(page.getByRole('dialog')).toContainText('8 hours')
  await page.getByRole('button', { name: 'Close dialog', exact: true }).click()
  await page.getByRole('button', { name: 'Create / edit character', exact: true }).click()
  await page.getByRole('button', { name: '2. Class', exact: true }).click()
  await page.getByLabel('Creation class', { exact: true }).selectOption('Rogue')
  await expect(
    page
      .getByLabel('Creation subclass', { exact: true })
      .locator('option[value="Arcane Trickster"]'),
  ).toHaveAttribute('disabled', '')
  await page
    .getByText('Add missing official classes & subclasses to this sheet', { exact: true })
    .click()
  await expect(
    page.getByRole('link', { name: 'Download official 2014 installer' }),
  ).toHaveAttribute('href', '/Install_Official2014.gs')
})

test('chosen Hunter reaction appears in the turn guide and persists locally', async ({ page }) => {
  const { book } = await mockGoogle(page)
  book.sheets[0].cells.T5 = { value: 'Ranger 3 Hunter' }
  book.sheets[0].cells.AL6 = { value: 3 }
  await page.getByRole('button', { name: 'Refresh', exact: true }).click()
  await page.getByRole('button', { name: 'Customize abilities', exact: true }).click()
  await page
    .locator('.feature-choice-group')
    .filter({ hasText: 'Hunter’s Prey' })
    .locator('summary')
    .first()
    .click()
  await page.getByLabel('Choose Ranger · Hunter’s Prey Giant Killer', { exact: true }).check()
  await page.getByRole('button', { name: 'Save rules', exact: true }).click()
  await page.getByRole('button', { name: /^Reaction/ }).click()
  await page.getByLabel('Find an ability', { exact: true }).fill('Giant Killer')
  await expect(page.locator('.ability-card')).toHaveCount(1)
  await page.locator('.ability-card').click()
  await expect(page.getByRole('dialog')).toContainText('within 5 feet')
  await page.getByRole('button', { name: 'Done', exact: true }).click()
  await page.reload()
  await page.getByRole('button', { name: /^Reaction/ }).click()
  await page.getByLabel('Find an ability', { exact: true }).fill('Giant Killer')
  await expect(page.locator('.ability-card')).toHaveCount(1)
  await page.getByRole('button', { name: 'Switch to dark mode', exact: true }).click()
  await page.getByRole('button', { name: 'Customize abilities', exact: true }).click()
  expect(
    (await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze()).violations,
  ).toEqual([])
})

test('always-prepared spells stay ready and known casters do not require preparation', async ({
  page,
}) => {
  const { book } = await mockGoogle(page)
  const main = book.sheets[0]
  main.cells.T5 = { value: 'Cleric 3 Life' }
  main.cells.N106 = { value: 'Spiritual Weapon' }
  main.cells.M106 = { value: 0 }
  await page.getByRole('button', { name: 'Refresh', exact: true }).click()
  await page.getByRole('button', { name: 'Spells', exact: true }).click()
  await page.getByLabel('Ready only', { exact: true }).check()
  await expect(page.getByRole('button', { name: /^Spiritual Weapon/ })).toContainText(
    'Always prepared',
  )
  await page.getByRole('button', { name: /^Spiritual Weapon/ }).click()
  await expect(page.getByRole('dialog')).toContainText('Always prepared · Life Domain')
  await expect(page.getByLabel('Prepared', { exact: true })).toHaveCount(0)
  await page.getByRole('button', { name: 'Done', exact: true }).click()
  main.cells.T5 = { value: 'Sorcerer 1 Wild Magic' }
  main.cells.N106 = { value: '' }
  main.cells.D100 = { value: 'Witch Bolt' }
  main.cells.C100 = { value: 0 }
  await page.getByRole('button', { name: 'Refresh', exact: true }).click()
  await expect(page.getByRole('button', { name: /^Witch Bolt/ })).toContainText('Known')
  await page.getByRole('button', { name: /^Witch Bolt/ }).click()
  await expect(page.getByLabel('Prepared', { exact: true })).toHaveCount(0)
})

test('item library stages armor values through the existing reviewed inventory save', async ({
  page,
}) => {
  const { book, writes } = await mockGoogle(page)
  await page.getByRole('button', { name: 'Inventory', exact: true }).click()
  await page.getByRole('button', { name: 'Browse items', exact: true }).click()
  await page.getByLabel('Search item library', { exact: true }).fill('Plate')
  await page.getByRole('button', { name: /^Plate Mundane/ }).click()
  await expect(page.getByRole('dialog')).toContainText('Strength 15')
  await page.getByRole('button', { name: 'Add to inventory', exact: true }).click()
  await expect(page.getByLabel('Item name', { exact: true })).toHaveValue('Plate')
  await expect(page.getByLabel('Cost', { exact: true })).toHaveValue('1500')
  await expect(page.getByLabel('Weight (lb)', { exact: true })).toHaveValue('65')
  expect(writes).toHaveLength(0)
  await page.getByRole('button', { name: 'Done', exact: true }).click()
  await page.getByRole('button', { name: 'Review changes', exact: true }).click()
  await page.getByRole('button', { name: 'Save to spreadsheet', exact: true }).click()
  await expect(page.getByRole('dialog')).toHaveCount(0)
  const inventory = book.sheets.find((s: any) => s.title === 'Inventory')!
  expect(inventory.cells.J3.value).toBe('Plate')
  expect(inventory.cells.R3.value).toBe(1500)
  expect(inventory.cells.U3.value).toBe(65)
})

test('magic item references show attunement and leave unspecified price/weight blank', async ({
  page,
}) => {
  await mockGoogle(page)
  await page.getByRole('button', { name: 'Inventory', exact: true }).click()
  await page.getByRole('button', { name: 'Browse items', exact: true }).click()
  await page.getByLabel('Search item library', { exact: true }).fill('Amulet of Health')
  await page.getByRole('button', { name: /^Amulet of Health\b/ }).click()
  await expect(page.getByRole('dialog')).toContainText('Requires attunement')
  await expect(page.getByRole('dialog')).toContainText('Constitution score is 19')
  await page.getByRole('button', { name: 'Add to inventory', exact: true }).click()
  await expect(page.getByLabel('Cost', { exact: true })).toHaveValue('')
  await expect(page.getByLabel('Weight (lb)', { exact: true })).toHaveValue('')
})

test('expanded Class Info reads support late Artificer rows and Rogue subclass personalization', async ({
  page,
}) => {
  const reads: string[] = []
  page.on('request', (req) => {
    if (req.url().startsWith('https://sheets.googleapis.com/')) reads.push(req.url())
  })
  const { book } = await mockGoogle(page)
  const info = book.sheets.find((s: any) => s.title === 'Class Info')!
  info.cells.B350 = { value: 'Artificer' }
  info.cells.E350 = { value: '-' }
  book.sheets[0].cells.T5 = { value: 'Rogue 3 Scout' }
  book.sheets[0].cells.AL6 = { value: 3 }
  await page.getByRole('button', { name: 'Refresh', exact: true }).click()
  expect(
    reads.some((u) => new URL(u).searchParams.getAll('ranges').includes("'Class Info'!A1:BC600")),
  ).toBe(true)
  await page
    .locator('.ability-tabs')
    .getByRole('button', { name: /^Reaction/ })
    .click()
  await page.getByLabel('Find an ability', { exact: true }).fill('Skirmisher')
  await expect(page.getByRole('button', { name: /\bSkirmisher\b/ })).toBeVisible()
  await page.getByRole('button', { name: 'Create / edit character', exact: true }).click()
  await page.getByRole('button', { name: '2. Class', exact: true }).click()
  await page.getByLabel('Creation class', { exact: true }).selectOption('Artificer')
  await expect(
    page.getByLabel('Creation subclass', { exact: true }).locator('option[value="Armorer"]'),
  ).toHaveAttribute('disabled', '')
})

test('forgetting an Artificer infusion also removes its active application', async ({ page }) => {
  const { book } = await mockGoogle(page)
  book.sheets[0].cells.T5 = { value: 'Artificer 3 Armorer' }
  book.sheets[0].cells.AL6 = { value: 3 }
  await page.getByRole('button', { name: 'Refresh', exact: true }).click()
  await page.getByRole('button', { name: 'Customize abilities', exact: true }).click()
  const learned = page
    .locator('.feature-choice-group')
    .filter({ has: page.locator('summary').filter({ hasText: 'Artificer · Learned infusions' }) })
  await learned.locator('summary').first().click()
  await page
    .getByLabel('Choose Artificer · Learned infusions Enhanced Defense', { exact: true })
    .check()
  const active = page.locator('.feature-choice-group').filter({
    has: page.locator('summary').filter({ hasText: 'Artificer · Active infused items' }),
  })
  await active.locator('summary').first().click()
  await page
    .getByLabel('Choose Artificer · Active infused items Enhanced Defense', { exact: true })
    .check()
  await page
    .getByLabel('Choose Artificer · Learned infusions Enhanced Defense', { exact: true })
    .uncheck()
  await expect(
    page.getByRole('button', { name: 'Remove unavailable choices', exact: true }),
  ).toHaveCount(0)
  await page.getByRole('button', { name: 'Save rules', exact: true }).click()
  await expect(page.getByRole('dialog')).toHaveCount(0)
})

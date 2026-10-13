import { test, expect } from '@playwright/test'
import type { Page } from '@playwright/test'
import fs from 'node:fs'
const template = JSON.parse(
  fs.readFileSync(new URL('../src/data/punpun.json', import.meta.url), 'utf8'),
)
const alice = 'alice_character_1234567890',
  bob = 'bob_character_1234567890'
const owner = 'private_owner_character_1234567890'
async function playerGoogle(page: Page) {
  const books = Object.fromEntries(
    [alice, bob].map((id) => {
      const book = structuredClone(template)
      book.sheets[0].cells.C6 = { value: id === alice ? 'Alice Hero' : 'Bob Hero' }
      book.sheets[0].cells.T5 = { value: 'Fighter 5 Champion' }
      book.sheets[0].cells.R17 = { value: 30 }
      return [id, book]
    }),
  )
  const requests: { id: string; method: string; path: string; body?: any }[] = []
  await page.addInitScript(() => {
    localStorage.setItem(
      'punpun-workbook-settings',
      JSON.stringify({
        url: 'https://docs.google.com/spreadsheets/d/private_owner_character_1234567890/edit',
        clientId: 'evil.apps.googleusercontent.com',
      }),
    )
    localStorage.setItem(
      'punpun-workbook-cache',
      JSON.stringify({
        title: 'OWNER SECRET',
        spreadsheetId: 'private_owner_character_1234567890',
        sheets: [{ title: 'v2.1', cells: { C6: { value: 'OWNER SECRET' } } }],
      }),
    )
    localStorage.setItem(
      'punpun-workbook-drafts',
      JSON.stringify({
        '["v2.1","C6"]': {
          tab: 'v2.1',
          address: 'C6',
          before: 'OWNER SECRET',
          value: 'OWNER DRAFT',
        },
      }),
    )
    ;(window as any).google = {
      accounts: {
        oauth2: {
          initTokenClient: (config: any) => ({
            requestAccessToken: () => {
              ;(window as any).playerSignIns = ((window as any).playerSignIns || 0) + 1
              config.callback({
                access_token: 'mock-player',
                expires_in: 3600,
                scope: 'https://www.googleapis.com/auth/spreadsheets',
              })
            },
          }),
          revoke: (_: unknown, done: () => void) => done(),
        },
      },
    }
  })
  await page.route('https://sheets.googleapis.com/**', async (route) => {
    const url = new URL(route.request().url())
    const [, id, suffix = ''] = /^\/v4\/spreadsheets\/([^/]+)(.*)$/.exec(url.pathname)!
    const method = route.request().method()
    const body = method === 'POST' ? route.request().postDataJSON() : undefined
    requests.push({ id, method, path: suffix, body })
    if (id === 'excel_character_1234567890') {
      await route.fulfill({
        status: 400,
        json: {
          error: {
            message:
              'This operation is not supported for this document. The document must not be an Office file.',
          },
        },
      })
      return
    }
    const book = books[id]
    if (!book) {
      await route.fulfill({
        status: 403,
        json: { error: { message: 'The caller does not have permission' } },
      })
      return
    }
    if (method === 'POST') {
      for (const change of body.data) {
        const [, tab, cell] = /^'(.+)'!([A-Z]+\d+)$/.exec(change.range)!
        book.sheets.find((s: any) => s.title === tab).cells[cell].value = change.values[0][0]
      }
      await route.fulfill({ json: { totalUpdatedCells: body.data.length } })
      return
    }
    const sheets = book.sheets.map((sheet: any, index: number) => {
      const rows: any[] = Array.from({ length: 201 }, () => ({ values: [] }))
      for (const [address, cell] of Object.entries(sheet.cells) as [string, any][]) {
        const [, letters, number] = /^([A-Z]+)(\d+)$/.exec(address)!
        const row = Number(number) - 1
        const col = [...letters].reduce((n, c) => n * 26 + c.charCodeAt(0) - 64, 0) - 1
        if (row >= 201 || col >= 55) continue
        const scalar =
          typeof cell.value === 'number'
            ? { numberValue: cell.value }
            : typeof cell.value === 'boolean'
              ? { boolValue: cell.value }
              : { stringValue: cell.value }
        rows[row].values[col] = {
          effectiveValue: scalar,
          userEnteredValue: cell.formula ? { formulaValue: cell.formula } : scalar,
        }
      }
      return {
        properties: {
          title: sheet.title,
          sheetId: index,
          gridProperties: { rowCount: 201, columnCount: 55 },
        },
        data: [{ rowData: rows }],
      }
    })
    await route.fulfill({ json: { properties: { title: 'Player character' }, sheets } })
  })
  return { books, requests }
}
async function openCharacter(page: Page, id = alice) {
  await page.goto('/')
  await page
    .getByLabel('Character spreadsheet URL', { exact: true })
    .fill(`https://docs.google.com/spreadsheets/d/${id}/edit`)
  await page.getByRole('button', { name: 'Open character', exact: true }).click()
  await expect(
    page.getByRole('heading', { name: id === alice ? 'Alice Hero' : 'Bob Hero', exact: true }),
  ).toBeVisible()
}
test('player build offers a paste form without a special character link or owner preview', async ({
  page,
}) => {
  await playerGoogle(page)
  for (const url of ['/', '/?legacy=1', '/?player=0', `/?character=${alice}&character=${bob}`]) {
    await page.goto(url)
    await expect(page.getByLabel('Character spreadsheet URL', { exact: true })).toBeVisible()
    await expect(page.getByLabel('Character spreadsheet URL', { exact: true })).toHaveValue('')
    await expect(page.getByRole('button', { name: 'Open character', exact: true })).toBeVisible()
    await expect(
      page.getByRole('button', { name: 'Create / edit character', exact: true }),
    ).toHaveCount(0)
    await expect(page.getByText('OWNER SECRET')).toHaveCount(0)
  }
})
test('players paste a shared-folder file URL and edit their existing character without creating files', async ({
  page,
}) => {
  const { requests } = await playerGoogle(page)
  await page.goto('/')
  await expect(page.getByText('OWNER SECRET')).toHaveCount(0)
  const sheetUrl = `https://docs.google.com/spreadsheets/d/${alice}/edit?gid=42#gid=42`
  await page.getByLabel('Character spreadsheet URL', { exact: true }).fill(sheetUrl)
  await page.getByRole('button', { name: 'Open character', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'Alice Hero', exact: true })).toBeVisible()
  await expect(page.getByRole('link', { name: 'Open sheet', exact: true })).toHaveAttribute(
    'href',
    sheetUrl,
  )
  await expect(page.getByRole('button', { name: 'Share player link', exact: true })).toHaveCount(0)
  await expect(
    page.getByRole('button', { name: 'Create / edit character', exact: true }),
  ).toHaveCount(0)
  await expect(page.getByRole('button', { name: 'Connection settings', exact: true })).toHaveCount(
    0,
  )
  await expect(page.getByRole('button', { name: 'Change spreadsheet', exact: true })).toHaveCount(0)
  await page.getByRole('button', { name: 'Edit character', exact: true }).click()
  const dialog = page.getByRole('dialog')
  await dialog.getByLabel('Character name', { exact: true }).fill('Alice Revised')
  await dialog.getByRole('button', { name: '3. Scores', exact: true }).click()
  await dialog.getByLabel('Strength base', { exact: true }).fill('16')
  await dialog.getByRole('button', { name: 'Review character changes', exact: true }).click()
  await page.getByRole('button', { name: 'Save to spreadsheet', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'Alice Revised', exact: true })).toBeVisible()
  const writes = requests.filter((r) => r.method === 'POST')
  expect(writes).toHaveLength(1)
  expect(writes[0].path).toBe('/values:batchUpdate')
  expect(writes[0].body.data).toEqual(
    expect.arrayContaining([
      { range: "'v2.1'!C6", values: [['Alice Revised']] },
      { range: "'v2.1'!C16", values: [[16]] },
    ]),
  )
  expect(requests.every((r) => r.id === alice)).toBe(true)
  const ownerDraft = await page.evaluate(() => localStorage.getItem('punpun-workbook-drafts'))
  expect(ownerDraft).toContain('OWNER DRAFT')
})
test('Google denies a pasted file without access and no cached data is displayed', async ({
  page,
}) => {
  const { requests } = await playerGoogle(page)
  await page.goto('/')
  await page
    .getByLabel('Character spreadsheet URL', { exact: true })
    .fill(`https://docs.google.com/spreadsheets/d/${owner}/edit`)
  await page.getByRole('button', { name: 'Open character', exact: true }).click()
  await expect(page.getByRole('alert')).toContainText('does not have permission')
  await expect(page.getByText('OWNER SECRET')).toHaveCount(0)
  await expect(page.getByRole('button', { name: 'Edit character', exact: true })).toHaveCount(0)
  expect(requests.filter((r) => r.method === 'POST')).toHaveLength(0)
})
test('sign-out and reload require authorization; drafts stay isolated between characters', async ({
  page,
}) => {
  await playerGoogle(page)
  await openCharacter(page)
  await page.getByLabel('Current HP', { exact: true }).fill('21')
  await page.getByRole('button', { name: 'Sign out', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'Alice Hero', exact: true })).toHaveCount(0)
  await page.getByRole('button', { name: 'Open character', exact: true }).click()
  await expect(page.getByLabel('Current HP', { exact: true })).toHaveValue('21')
  await page.reload()
  await expect(page.getByLabel('Current HP', { exact: true })).toHaveCount(0)
  await expect(page.getByLabel('Character spreadsheet URL', { exact: true })).toHaveValue(
    `https://docs.google.com/spreadsheets/d/${alice}/edit`,
  )
  await openCharacter(page, bob)
  await expect(page.getByLabel('Current HP', { exact: true })).toHaveValue('30')
  await expect(page.getByText('unsaved cell')).toHaveCount(0)
})
test('signing out to open another sheet isolates drafts and requires Google authorization', async ({
  page,
}) => {
  const { requests } = await playerGoogle(page)
  await openCharacter(page)
  await page.getByLabel('Current HP', { exact: true }).fill('21')
  await page.getByRole('button', { name: 'Sign out', exact: true }).click()
  await page
    .getByLabel('Character spreadsheet URL', { exact: true })
    .fill(`https://docs.google.com/spreadsheets/d/${bob}/edit`)
  await page.getByRole('button', { name: 'Open character', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'Bob Hero', exact: true })).toBeVisible()
  await expect(page.getByLabel('Current HP', { exact: true })).toHaveValue('30')
  await page.getByLabel('Current HP', { exact: true }).fill('18')
  await page.getByRole('button', { name: 'Review changes', exact: true }).click()
  await page.getByRole('button', { name: 'Save to spreadsheet', exact: true }).click()
  await expect(page.getByRole('dialog')).toHaveCount(0)
  expect(requests.filter((r) => r.method === 'POST').map((r) => r.id)).toEqual([bob])
  await page.getByRole('button', { name: 'Sign out', exact: true }).click()
  await page
    .getByLabel('Character spreadsheet URL', { exact: true })
    .fill(`https://docs.google.com/spreadsheets/d/${alice}/edit`)
  await page.getByRole('button', { name: 'Open character', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'Alice Hero', exact: true })).toBeVisible()
  await expect(page.getByLabel('Current HP', { exact: true })).toHaveValue('21')
  expect(await page.evaluate(() => (window as any).playerSignIns)).toBe(3)
})

test('invalid links make no Google API request and remain editable for correction', async ({
  page,
}) => {
  const { requests } = await playerGoogle(page)
  await page.goto('/')
  await page
    .getByLabel('Character spreadsheet URL', { exact: true })
    .fill('https://drive.google.com/drive/folders/shared-folder')
  await page.getByRole('button', { name: 'Open character', exact: true }).click()
  await expect(page.getByRole('alert')).toBeVisible()
  expect(requests).toHaveLength(0)
  expect(await page.evaluate(() => (window as any).playerSignIns || 0)).toBe(0)
  await page
    .getByLabel('Character spreadsheet URL', { exact: true })
    .fill(`https://docs.google.com/spreadsheets/d/${alice}/edit`)
  await page.getByRole('button', { name: 'Open character', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'Alice Hero', exact: true })).toBeVisible()
})

test('Excel uploads show conversion instructions and the converted link opens normally', async ({
  page,
}) => {
  const { requests } = await playerGoogle(page)
  await page.goto('/')
  await page
    .getByLabel('Character spreadsheet URL', { exact: true })
    .fill('https://docs.google.com/spreadsheets/d/excel_character_1234567890/edit')
  await page.getByRole('button', { name: 'Open character', exact: true }).click()
  await expect(page.getByRole('alert')).toContainText('File → Save as Google Sheets')
  await expect(page.getByRole('alert')).toContainText('new Google Sheets file’s link')
  await expect(page.getByRole('alert')).not.toContainText('Check the link and your Google account')
  expect(requests.filter((r) => r.method === 'POST')).toHaveLength(0)
  await page
    .getByLabel('Character spreadsheet URL', { exact: true })
    .fill(`https://docs.google.com/spreadsheets/d/${alice}/edit`)
  await page.getByRole('button', { name: 'Open character', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'Alice Hero', exact: true })).toBeVisible()
})

test('optional older character links still prefill the sheet URL', async ({ page }) => {
  await playerGoogle(page)
  await page.goto(`/?player=1&character=${bob}`)
  await expect(page.getByLabel('Character spreadsheet URL', { exact: true })).toHaveValue(
    `https://docs.google.com/spreadsheets/d/${bob}/edit`,
  )
  await page.getByRole('button', { name: 'Open character', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'Bob Hero', exact: true })).toBeVisible()
})

test('DM edits refresh while player drafts stay separate', async ({ page }) => {
  const { books } = await playerGoogle(page)
  await openCharacter(page)
  await page.getByLabel('Current HP', { exact: true }).fill('20')
  books[alice].sheets[0].cells.C6.value = 'Alice From DM'
  await page.getByRole('button', { name: 'Refresh', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'Alice From DM', exact: true })).toBeVisible()
  await expect(page.getByLabel('Current HP', { exact: true })).toHaveValue('20')
})
test('a Sorcerer player sees spellcasting and class abilities without Pugilist navigation', async ({
  page,
}) => {
  const { books } = await playerGoogle(page)
  books[alice].sheets[0].cells.T5 = { value: 'Sorcerer 5 Draconic Bloodline' }
  await openCharacter(page)
  await expect(page.getByRole('button', { name: 'Pugilist', exact: true })).toHaveCount(0)
  await expect(page.getByRole('button', { name: 'Go to Pugilist', exact: true })).toHaveCount(0)
  await expect(page.getByText('Moxie', { exact: true })).toHaveCount(0)
  await page.getByRole('button', { name: /^Passive/ }).click()
  await page.getByLabel('Find an ability', { exact: true }).fill('Font of Magic')
  await expect(page.getByRole('button', { name: /Font of Magic/ })).toBeVisible()
  await page.getByRole('button', { name: 'Spells', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'Spells', exact: true })).toBeVisible()
})

test('expired Google authorization closes the character editor', async ({ page }) => {
  await page.clock.install()
  await playerGoogle(page)
  await openCharacter(page)
  await page.clock.fastForward(3601000)
  await expect(page.getByRole('button', { name: 'Open character', exact: true })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Alice Hero', exact: true })).toHaveCount(0)
})
test('player build ships no owner preview or installers', () => {
  const root = new URL('../dist-players/', import.meta.url)
  expect(fs.existsSync(new URL('Install_Official2014.gs', root))).toBe(false)
  const assets = fs.readdirSync(new URL('assets/', root))
  expect(assets.some((name) => /OwnerApp|punpun|Offline/.test(name))).toBe(false)
  const javascript = assets
    .filter((name) => name.endsWith('.js'))
    .map((name) => fs.readFileSync(new URL(`assets/${name}`, root), 'utf8'))
    .join('')
  expect(javascript).not.toContain('1fL_L9AuurbK6zpHtkrPiHfTIJ2NiAp0Gs1ar5AnGeRM')
  expect(javascript).not.toContain('punpun.json')
})

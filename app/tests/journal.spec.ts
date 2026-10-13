import { test, expect } from '@playwright/test'
test.beforeEach(async ({ page }) => {
  page.on('pageerror', (error) => {
    throw error
  })
  await page.goto('/?legacy=1')
  await expect(page.getByRole('heading', { name: 'Aelric Thornwood', exact: true })).toBeVisible()
  await expect(page.getByText('Saved on this device', { exact: true })).toBeVisible()
})
test('combat damage, temporary HP, healing, and persistence', async ({ page }) => {
  await page.getByLabel('Temporary HP', { exact: true }).fill('5')
  await page.getByLabel('Amount', { exact: true }).fill('8')
  await page.getByRole('button', { name: 'Take damage', exact: true }).click()
  await expect(page.getByLabel('Current HP', { exact: true })).toHaveValue('21')
  await expect(page.getByLabel('Temporary HP', { exact: true })).toHaveValue('0')
  await page.getByRole('button', { name: 'Heal', exact: true }).click()
  await expect(page.getByLabel('Current HP', { exact: true })).toHaveValue('28')
  await expect(page.getByText('Saved on this device', { exact: true })).toBeVisible()
  await page.reload()
  await expect(page.getByLabel('Current HP', { exact: true })).toHaveValue('28')
})
test('guided creation, level advancement, backup export and import', async ({ page }) => {
  await page.getByRole('button', { name: 'New character', exact: true }).click()
  const dialog = page.getByRole('dialog')
  await dialog.getByLabel('Character name', { exact: true }).fill('Mira Vale')
  await dialog.getByRole('button', { name: '3. Proficiencies', exact: true }).click()
  await dialog.getByLabel('Perception', { exact: true }).check()
  await dialog.getByLabel('Insight', { exact: true }).check()
  await dialog.getByRole('button', { name: '4. Review', exact: true }).click()
  await dialog.getByRole('button', { name: 'Create adventurer', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'Mira Vale', exact: true })).toBeVisible()
  await page.getByRole('button', { name: 'Advance a level', exact: true }).click()
  await page.getByRole('button', { name: 'Apply level up', exact: true }).click()
  await expect(page.locator('.level-badge')).toContainText('02')
  await expect(page.getByText('Saved on this device', { exact: true })).toBeVisible()
  await page.reload()
  await expect(page.getByRole('heading', { name: 'Mira Vale', exact: true })).toBeVisible()
  const downloadPromise = page.waitForEvent('download')
  await page.getByRole('button', { name: 'Export', exact: true }).click()
  const download = await downloadPromise
  const path = await download.path()
  await page.locator('input[type=file]').setInputFiles(path!)
  await expect(
    page.getByRole('status').filter({ hasText: '2 character(s) imported' }),
  ).toBeVisible()
  await expect(page.locator('.character-button')).toHaveCount(4)
})
test('inventory quantities, coins, notes and spell library casting', async ({ page }) => {
  await page.getByRole('button', { name: 'Inventory & Notes', exact: true }).click()
  await page.getByLabel('GP', { exact: true }).fill('25')
  await page.getByRole('button', { name: 'Add item', exact: true }).click()
  await page.locator('.entry').filter({ hasText: 'New item' }).locator('summary').click()
  await page.locator('.entry[open]').getByLabel('Item name', { exact: true }).fill('Potion')
  await page.locator('.entry[open]').getByLabel('Quantity', { exact: true }).fill('3')
  await page.locator('.entry[open]').getByRole('button', { name: 'Use one', exact: true }).click()
  await expect(page.locator('.entry[open]').getByLabel('Quantity', { exact: true })).toHaveValue(
    '2',
  )
  await page
    .getByLabel('Backstory, personality & session notes', { exact: true })
    .fill('Found the ancient gate.')
  await page.getByRole('button', { name: 'Spells', exact: true }).click()
  await page.getByRole('button', { name: 'Browse SRD spells', exact: true }).click()
  await page.getByLabel('Search spell library', { exact: true }).fill('Hunter')
  const result = page.locator('.library-results .entry').filter({ hasText: 'Hunter’s Mark' })
  await result.locator('summary').click()
  await result.getByRole('button', { name: 'Add to spellbook', exact: true }).click()
  const entry = page.locator('.entry-list .entry').filter({ hasText: 'Hunter’s Mark' })
  await entry.locator('summary').click()
  await page.getByRole('button', { name: 'Cast Hunter’s Mark', exact: true }).click()
  await expect(page.getByLabel('Concentrating on', { exact: true })).toHaveValue('Hunter’s Mark')
  await expect(
    page.getByRole('button', { name: 'Level 1: 1 spent slots', exact: true }),
  ).toHaveAttribute('aria-pressed', 'true')
  await expect(page.getByText('Saved on this device', { exact: true })).toBeVisible()
  await page.reload()
  await page.getByRole('button', { name: 'Inventory & Notes', exact: true }).click()
  await expect(page.getByLabel('GP', { exact: true })).toHaveValue('25')
  await expect(
    page.getByLabel('Backstory, personality & session notes', { exact: true }),
  ).toHaveValue('Found the ancient gate.')
})
test('short and long rests recover dice and resources', async ({ page }) => {
  await page.getByLabel('Current HP', { exact: true }).fill('10')
  await page.getByRole('button', { name: 'Short rest', exact: true }).click()
  const dialog = page.getByRole('dialog')
  await dialog.getByLabel('Hit die roll', { exact: true }).fill('6')
  await dialog.getByRole('button', { name: 'Spend hit die', exact: true }).click()
  await expect(dialog).toContainText('Current HP: 18 / 28')
  await dialog.getByRole('button', { name: 'Complete rest', exact: true }).click()
  await expect(page.getByLabel('d10 spent', { exact: true })).toHaveValue('1')
  await page.getByRole('button', { name: 'Long rest', exact: true }).click()
  await page.getByRole('button', { name: 'Complete rest', exact: true }).click()
  await expect(page.getByLabel('Current HP', { exact: true })).toHaveValue('28')
  await expect(page.getByLabel('d10 spent', { exact: true })).toHaveValue('0')
})
test('mobile layout fits and printable sheet includes all sections', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await expect(page.getByRole('heading', { name: 'Aelric Thornwood', exact: true })).toBeVisible()
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(
    true,
  )
  await page.screenshot({ path: 'test-results/mobile-journal.png', fullPage: true })
  await page.emulateMedia({ media: 'print' })
  await expect(page.locator('.print-sheet')).toBeVisible()
  await expect(page.locator('.print-sheet')).toContainText('Spellcasting')
  await expect(page.locator('.print-sheet')).toContainText('Inventory & notes')
})
test('offline reload works including lazily loaded reference and spell library', async ({
  page,
  context,
}) => {
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready
  })
  await expect.poll(() => page.evaluate(() => !!navigator.serviceWorker.controller)).toBe(true)
  await page.getByRole('button', { name: 'Character', exact: true }).click()
  await page.getByLabel('Character name', { exact: true }).fill('Offline Hero')
  await expect(page.getByText('Saved on this device', { exact: true })).toBeVisible()
  await context.setOffline(true)
  await page.reload()
  await expect(page.getByRole('heading', { name: 'Offline Hero', exact: true })).toBeVisible()
  await page.getByRole('button', { name: 'Reference', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'Rules reference', exact: true })).toBeVisible()
  await page.getByRole('button', { name: 'Spells', exact: true }).click()
  await page.getByRole('button', { name: 'Browse SRD spells', exact: true }).click()
  await page.getByLabel('Search spell library', { exact: true }).fill('Fireball')
  await expect(page.locator('.library-results')).toContainText('Fireball')
})

test('version-one journal migrates without losing character data', async ({ page }) => {
  await page.evaluate(async () => {
    await new Promise<void>((resolve, reject) => {
      const request = indexedDB.open('punman-character-journal', 1)
      request.onerror = () => reject(request.error)
      request.onsuccess = () => {
        const db = request.result
        const tx = db.transaction('journal', 'readwrite')
        const get = tx.objectStore('journal').get('characters')
        get.onsuccess = () => {
          const current = get.result.characters[0]
          const old = Object.fromEntries(
            Object.entries(current).filter(([key]) =>
              [
                'id',
                'name',
                'species',
                'background',
                'className',
                'subclass',
                'level',
                'scores',
                'skills',
                'saves',
                'hp',
                'maxHp',
                'tempHp',
                'ac',
                'speed',
                'inspiration',
                'conditions',
                'successes',
                'failures',
                'attacks',
                'features',
                'inventory',
                'notes',
                'languages',
                'training',
                'attunement',
                'coins',
                'casting',
                'slots',
                'spells',
                'concentration',
              ].includes(key),
            ),
          )
          old.name = 'Legacy Adventurer'
          old.notes = 'Preserved old notes'
          old.coins = 42
          tx.objectStore('journal').put([old], 'characters')
        }
        tx.oncomplete = () => {
          db.close()
          resolve()
        }
        tx.onerror = () => reject(tx.error)
      }
    })
  })
  await page.reload()
  await expect(page.getByRole('heading', { name: 'Legacy Adventurer', exact: true })).toBeVisible()
  await page.getByRole('button', { name: 'Inventory & Notes', exact: true }).click()
  await expect(page.getByLabel('GP', { exact: true })).toHaveValue('42')
  await expect(
    page.getByLabel('Backstory, personality & session notes', { exact: true }),
  ).toHaveValue('Preserved old notes')
})
test('malformed backup is rejected and existing characters remain', async ({ page }) => {
  await page.locator('input[type=file]').setInputFiles({
    name: 'invalid.json',
    mimeType: 'application/json',
    buffer: Buffer.from(JSON.stringify({ version: 2, characters: [{ name: 'Bad' }] })),
  })
  await expect(page.getByRole('status').filter({ hasText: 'Import failed' })).toBeVisible()
  await expect(page.locator('.character-button')).toHaveCount(1)
})
test('another tab cannot silently overwrite newer changes', async ({ page, context }) => {
  const other = await context.newPage()
  await other.goto('/?legacy=1')
  await other.getByRole('button', { name: 'Character', exact: true }).click()
  await other.getByLabel('Character name', { exact: true }).fill('Other Tab Hero')
  await expect(other.getByText('Saved on this device', { exact: true })).toBeVisible()
  await page.getByLabel('Temporary HP', { exact: true }).fill('3')
  await expect(
    page.getByRole('status').filter({ hasText: 'This journal changed in another tab' }),
  ).toBeVisible()
  await other.reload()
  await expect(other.getByRole('heading', { name: 'Other Tab Hero', exact: true })).toBeVisible()
  await expect(other.getByLabel('Temporary HP', { exact: true })).toHaveValue('0')
})

test('key views meet automated WCAG AA accessibility checks', async ({ page }) => {
  const { default: AxeBuilder } = await import('@axe-core/playwright')
  for (const tab of ['Play', 'Character', 'Spells', 'Inventory & Notes', 'Reference']) {
    await page.getByRole('button', { name: tab, exact: true }).click()
    await expect(page.locator('.panel').first()).toBeVisible()
    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
      .analyze()
    expect(
      results.violations.map((v) => ({
        id: v.id,
        nodes: v.nodes.map((n) => ({ target: n.target, summary: n.failureSummary })),
      })),
    ).toEqual([])
  }
})

test('unreadable journals can be exported and explicitly reset', async ({ page }) => {
  await page.evaluate(async () => {
    await new Promise<void>((resolve, reject) => {
      const request = indexedDB.open('punman-character-journal', 1)
      request.onsuccess = () => {
        const db = request.result
        const tx = db.transaction('journal', 'readwrite')
        tx.objectStore('journal').put({ version: 99, broken: true }, 'characters')
        tx.oncomplete = () => {
          db.close()
          resolve()
        }
        tx.onerror = () => reject(tx.error)
      }
    })
  })
  await page.reload()
  await expect(
    page.getByRole('button', { name: 'Download recovery copy', exact: true }),
  ).toBeVisible()
  const downloadPromise = page.waitForEvent('download')
  await page.getByRole('button', { name: 'Download recovery copy', exact: true }).click()
  await expect((await downloadPromise).suggestedFilename()).toBe('journal-recovery.json')
  page.once('dialog', (d) => d.accept())
  await page.getByRole('button', { name: 'Create clean journal', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'New adventurer', exact: true })).toBeVisible()
  await expect(page.getByText('Saved on this device', { exact: true })).toBeVisible()
  await page.getByRole('button', { name: 'New character', exact: true }).click()
  await expect(page.getByRole('dialog', { name: 'Write a new adventure' })).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(page.getByRole('dialog')).not.toBeVisible()
})

import type { Page } from '@playwright/test'
async function mockedGoogle(page: Page) {
  const cells: Record<string, string | number> = { B3: 'Sheet Hero', B4: 12 }
  const writes: unknown[] = []
  await page.evaluate(() => {
    window.google = {
      accounts: {
        oauth2: {
          initTokenClient: (config) => ({
            requestAccessToken: () =>
              config.callback({
                access_token: 'mock-access-token',
                expires_in: 3600,
                scope: config.scope,
              }),
          }),
          revoke: (_token, callback) => callback(),
        },
      },
    }
  })
  await page.route('https://sheets.googleapis.com/v4/spreadsheets/**', async (route) => {
    const url = new URL(route.request().url())
    let body: unknown
    if (url.pathname.endsWith('/values:batchUpdate')) {
      const data = route.request().postDataJSON()
      writes.push(data)
      for (const entry of data.data) {
        const cell = entry.range.split('!').at(-1)
        cells[cell] = entry.values[0][0]
      }
      body = { totalUpdatedCells: data.data.length }
    } else if (url.pathname.endsWith('/values:batchGet'))
      body = {
        valueRanges: url.searchParams.getAll('ranges').map((range) => {
          const value = cells[range.split('!').at(-1)!] ?? ''
          return {
            values: [
              [
                typeof value === 'string' &&
                value.startsWith('=') &&
                url.searchParams.get('valueRenderOption') !== 'FORMULA'
                  ? 'Calculated name'
                  : value,
              ],
            ],
          }
        }),
      }
    else if (url.pathname.includes('/values/'))
      body = {
        values: [
          ['Character name', cells.B3],
          ['HP', cells.B4],
        ],
      }
    else
      body = {
        properties: { title: 'Personal D&D Sheet' },
        sheets: [{ properties: { sheetId: 359784640, title: 'Character' } }],
      }
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(body),
    })
  })
  await page.getByRole('button', { name: 'Google Sheet', exact: true }).click()
  const dialog = page.getByRole('dialog', { name: 'Connect your Google Sheet' })
  await dialog
    .getByLabel('Google OAuth web client ID (public)', { exact: true })
    .fill('demo.apps.googleusercontent.com')
  await dialog.getByLabel('Google access permission', { exact: true }).selectOption('write')
  await dialog.getByRole('button', { name: 'Sign in with Google', exact: true }).click()
  await expect(dialog.getByLabel('Worksheet', { exact: true })).toHaveValue('359784640')
  await dialog.getByRole('button', { name: 'Add cell mapping', exact: true }).click()
  await dialog.getByLabel('Cell address 1', { exact: true }).fill('B3')
  await dialog.getByRole('button', { name: 'Read mapped cells', exact: true }).click()
  await expect(dialog.getByText('Mapped cells loaded.', { exact: false })).toBeVisible()
  return { dialog, cells, writes }
}
test('numeric editing preserves saved values and reports constraints', async ({ page }) => {
  const hp = page.getByLabel('Current HP', { exact: true })
  await hp.fill('29')
  await expect(hp).toHaveAttribute('aria-invalid', 'true')
  await expect(page.getByText('Enter a value from 0 to 28.', { exact: false })).toBeVisible()
  await page.getByRole('heading', { name: 'Hit points', exact: true }).click()
  await expect(hp).toHaveValue('24')
  await hp.fill('20')
  await expect(hp).toHaveAttribute('aria-invalid', 'false')
  await hp.fill('')
  await expect(hp).toHaveValue('')
  await page.getByRole('heading', { name: 'Hit points', exact: true }).click()
  await expect(hp).toHaveValue('20')
  await page.getByRole('button', { name: 'Character', exact: true }).click()
  await expect(page.getByLabel('Background', { exact: true })).toHaveValue('Guide')
  await page.getByLabel('Alignment', { exact: true }).selectOption('Chaotic Good')
  await expect(
    page.getByLabel('Armor or defense formula', { exact: true }).locator('option'),
  ).toContainText(['Padded'])
})
test('Google setup is prefilled and OAuth is required before access', async ({ page }) => {
  await page.getByRole('button', { name: 'Google Sheet', exact: true }).click()
  const dialog = page.getByRole('dialog', { name: 'Connect your Google Sheet' })
  await expect(dialog.getByLabel('Google spreadsheet URL', { exact: true })).toHaveValue(
    /1fL_L9AuurbK6zpHtkrPiHfTIJ2NiAp0Gs1ar5AnGeRM/,
  )
  await expect(
    dialog.getByRole('button', { name: 'Sign in with Google', exact: true }),
  ).toBeDisabled()
  await expect(dialog).toContainText('Google setup')
  await expect(
    dialog.getByRole('button', { name: 'Read mapped cells', exact: true }),
  ).toBeDisabled()
})
test('Google mappings import and only write after a reviewed save', async ({ page }) => {
  const { dialog, cells, writes } = await mockedGoogle(page)
  await dialog.getByRole('button', { name: 'Import mapped values', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'Sheet Hero', exact: true })).toBeVisible()
  expect(writes).toHaveLength(0)
  await dialog.getByRole('button', { name: 'Close dialog', exact: true }).click()
  await page.getByRole('button', { name: 'Character', exact: true }).click()
  await page.getByLabel('Character name', { exact: true }).fill('Local Hero')
  await page.getByRole('button', { name: 'Google Sheet', exact: true }).click()
  await dialog.getByRole('button', { name: 'Load spreadsheet', exact: true }).click()
  await dialog.getByRole('button', { name: 'Read mapped cells', exact: true }).click()
  await dialog.getByRole('button', { name: 'Review changes to sheet', exact: true }).click()
  expect(writes).toHaveLength(0)
  await dialog.getByRole('button', { name: 'Confirm save to Google Sheet', exact: true }).click()
  await expect(dialog.getByRole('status')).toContainText('Mapped values saved')
  expect(writes).toHaveLength(1)
  expect(cells.B3).toBe('Local Hero')
  expect(writes[0]).toMatchObject({
    valueInputOption: 'RAW',
    data: [{ range: "'Character'!B3", values: [['Local Hero']] }],
  })
})
test('Google save refuses formula cells and changed previews', async ({ page }) => {
  const { dialog, cells, writes } = await mockedGoogle(page)
  cells.B3 = 'Changed remotely'
  await dialog.getByRole('button', { name: 'Review changes to sheet', exact: true }).click()
  await dialog.getByRole('button', { name: 'Confirm save to Google Sheet', exact: true }).click()
  await expect(dialog.getByRole('alert')).toContainText('sheet changed')
  expect(writes).toHaveLength(0)
  cells.B3 = '=CONCAT("Formula")'
  await dialog.getByRole('button', { name: 'Read mapped cells', exact: true }).click()
  await dialog.getByRole('button', { name: 'Review changes to sheet', exact: true }).click()
  await expect(dialog.getByRole('alert')).toContainText('formula')
  expect(writes).toHaveLength(0)
})

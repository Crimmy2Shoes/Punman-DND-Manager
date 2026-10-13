import { sheetTarget } from './googleSheets.ts'

// A pasted URL selects a workbook; Google's file permissions authorize access.
export function selectedPlayerSheet(raw: string): { id: string; url: string } {
  const url = raw.trim()
  const { id } = sheetTarget(url)
  const parsed = new URL(url)
  if (parsed.username || parsed.password || !/^[a-zA-Z0-9_-]{20,128}$/.test(id))
    throw Error('Paste the full link to your Google character spreadsheet.')
  return { id, url }
}

export const LAST_PLAYER_SHEET = 'punpun-last-player-sheet'

export function initialPlayerSheet(search: string, remembered: string): string {
  try {
    if (new URLSearchParams(search).has('character')) return playerSheetUrl(assignedSheet(search))
    return remembered ? selectedPlayerSheet(remembered).url : ''
  } catch {
    return ''
  }
}

export function assignedSheet(search: string): string {
  const ids = new URLSearchParams(search).getAll('character')
  if (ids.length !== 1 || !/^[a-zA-Z0-9_-]{20,128}$/.test(ids[0]))
    throw Error('Open the character link your DM sent you.')
  return ids[0]
}

export function playerSheetUrl(id: string): string {
  return `https://docs.google.com/spreadsheets/d/${id}/edit`
}

export function createPlayerLink(host: string, sheet: string): string {
  const app = new URL(host)
  if (
    app.username ||
    app.password ||
    (app.protocol !== 'https:' &&
      !(app.protocol === 'http:' && ['localhost', '127.0.0.1'].includes(app.hostname)))
  )
    throw Error('Use the hosted app’s HTTPS address, or localhost for a preview.')
  const spreadsheet = new URL(sheet)
  const id = spreadsheet.pathname.match(/^\/spreadsheets\/d\/([a-zA-Z0-9_-]{20,128})(?:\/|$)/)?.[1]
  if (spreadsheet.protocol !== 'https:' || spreadsheet.hostname !== 'docs.google.com' || !id)
    throw Error('Paste your player’s Google Sheets URL.')
  app.search = ''
  app.hash = ''
  app.searchParams.set('player', '1')
  app.searchParams.set('character', id)
  return app.toString()
}

export const playerDraftKey = (id: string) => `punpun-player-drafts:${id}`
export const playerRulesKey = (id: string) => `punpun-player-rules:${id}`

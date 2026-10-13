import { parseCharacters, abilities } from './character.ts'
import type { Character } from './character.ts'
import { skills } from './character.ts'
export const DEFAULT_SHEET_URL =
  import.meta.env?.VITE_APP_MODE === 'player'
    ? ''
    : 'https://docs.google.com/spreadsheets/d/1fL_L9AuurbK6zpHtkrPiHfTIJ2NiAp0Gs1ar5AnGeRM/edit?gid=359784640#gid=359784640'
export interface Binding {
  field: string
  cell: string
}
export type Cell = string | number | boolean
export interface SheetInfo {
  title: string
  sheets: { properties: { sheetId: number; title: string } }[]
}
export interface Snapshot {
  values: Cell[]
  formulas: Cell[]
  signature: string
}
const simple = [
  'name',
  'species',
  'background',
  'className',
  'subclass',
  'level',
  'xp',
  'hp',
  'maxHp',
  'tempHp',
  'ac',
  'speed',
  'alignment',
  'size',
  'languages',
  'training',
  'features',
  'notes',
  'appearance',
  'attacks',
  'spells',
  'inventory',
  'attunement',
  'concentration',
  'inspiration',
  'shieldEquipped',
  'armorChoice',
  'exhaustion',
  'successes',
  'failures',
  'stable',
  'dead',
]
export const mappedFields = [
  ...simple,
  ...abilities.map((a) => `scores.${a}`),
  ...abilities.map((a) => `saves.${a}`),
  ...skills.map(([name]) => `skills.${name}`),
  ...['cp', 'sp', 'ep', 'gp', 'pp'].map((c) => `wallet.${c}`),
  'backup',
]
export function sheetTarget(url: string): { id: string; gid: number } {
  let parsed: URL
  try {
    parsed = new URL(url)
  } catch {
    throw Error('Paste a full Google Sheets URL.')
  }
  if (parsed.hostname !== 'docs.google.com' || parsed.protocol !== 'https:')
    throw Error('Use an HTTPS Google Sheets URL from docs.google.com.')
  const id = parsed.pathname.match(/^\/spreadsheets\/d\/([a-zA-Z0-9_-]+)(?:\/|$)/)?.[1]
  if (!id) throw Error('The URL does not identify a Google spreadsheet.')
  const gid =
    parsed.searchParams.get('gid') ?? new URLSearchParams(parsed.hash.slice(1)).get('gid') ?? '0'
  if (!/^\d+$/.test(gid)) throw Error('The worksheet gid must be a number.')
  return { id, gid: Number(gid) }
}
export const qualified = (title: string, range: string) => `'${title.replace(/'/g, "''")}'!${range}`
export function validateBindings(bindings: Binding[]): Binding[] {
  if (!bindings.length || bindings.length > 100)
    throw Error('Add 1–100 field mappings before reading or saving cells.')
  const normalized = bindings.map((b) => ({ ...b, cell: b.cell.trim().toUpperCase() }))
  if (
    normalized.some(
      (b) => !mappedFields.includes(b.field) || !/^\$?[A-Z]{1,3}\$?[1-9]\d{0,5}$/.test(b.cell),
    )
  )
    throw Error('Choose a field and an individual A1 cell address, such as B3.')
  normalized.forEach((b) => {
    b.cell = b.cell.replaceAll('$', '')
  })
  if (
    new Set(normalized.map((b) => b.cell)).size !== normalized.length ||
    new Set(normalized.map((b) => b.field)).size !== normalized.length
  )
    throw Error('Each field and cell can only be mapped once.')
  return normalized
}
export function characterCell(c: Character, field: string): Cell {
  if (field === 'backup') {
    const json = JSON.stringify(c)
    if (json.length > 50000)
      throw Error(
        'The full character exceeds a Google cell’s 50,000-character limit. Use a local JSON backup or individual field mappings.',
      )
    return json
  }
  if (!mappedFields.includes(field)) throw Error('Unknown mapped field.')
  const [key, child] = field.split('.')
  if (key === 'saves') return c.saves.includes(child as (typeof abilities)[number])
  if (key === 'skills') return c.skills[child] ?? 0
  const value = child
    ? (c[key as keyof Character] as unknown as Record<string, Cell>)[child]
    : c[key as keyof Character]
  if (!['string', 'number', 'boolean'].includes(typeof value))
    throw Error('This field cannot be stored in one cell.')
  return value as Cell
}
export function importCells(c: Character, bindings: Binding[], values: Cell[]): Character {
  const normalized = validateBindings(bindings)
  let next = structuredClone(c)
  const backupIndex = normalized.findIndex((b) => b.field === 'backup')
  if (backupIndex >= 0 && values[backupIndex] !== '') {
    let parsed
    try {
      parsed = JSON.parse(String(values[backupIndex]))
    } catch {
      throw Error('The backup cell is not valid JSON.')
    }
    const imported = parseCharacters([parsed])
    if (!imported) throw Error('The backup cell does not contain a valid character.')
    next = { ...imported[0], id: c.id }
  }
  normalized.forEach((b, i) => {
    if (b.field === 'backup' || values[i] === '' || values[i] === undefined) return
    const [key, child] = b.field.split('.')
    const original = characterCell(next, b.field)
    let value: Cell = values[i]
    if (typeof original === 'number') {
      if (typeof value === 'boolean' || !String(value).trim() || !Number.isFinite(Number(value)))
        throw Error(`${b.cell}: ${b.field} must be a number.`)
      value = Number(value)
    } else if (typeof original === 'boolean') {
      const normalized = String(value).trim().toLowerCase()
      if (!['true', 'false', '1', '0'].includes(normalized))
        throw Error(`${b.cell}: use TRUE / FALSE for ${b.field}.`)
      value = ['true', '1'].includes(normalized)
    } else value = String(value)
    if (key === 'saves') {
      const ability = child as (typeof abilities)[number]
      next.saves = value
        ? [...new Set([...next.saves, ability])]
        : next.saves.filter((a) => a !== ability)
      return
    }
    if (child) {
      ;(next[key as keyof Character] as unknown as Record<string, Cell>)[child] = value
    } else {
      ;(next as unknown as Record<string, Cell>)[key] = value
    }
  })
  if (next.classes.length === 1)
    next.classes = [
      { name: next.className || next.classes[0].name, level: next.level, subclass: next.subclass },
    ]
  const result = parseCharacters([next])
  if (!result)
    throw Error(
      'These cells would create invalid character data (for example, HP above maximum, an invalid ability score, or inconsistent class levels). Correct the cells before importing.',
    )
  return result[0]
}
interface TokenResponse {
  access_token?: string
  expires_in?: number
  scope?: string
  error?: string
  error_description?: string
}
interface Identity {
  accounts: {
    oauth2: {
      initTokenClient: (config: {
        client_id: string
        scope: string
        callback: (response: TokenResponse) => void
        error_callback: (error: { type: string }) => void
      }) => { requestAccessToken: (options: { prompt: string }) => void }
      revoke: (token: string, callback: () => void) => void
    }
  }
}
declare global {
  interface Window {
    google?: Identity
  }
}
let identityPromise: Promise<void> | undefined
let session: { token: string; expires: number; write: boolean } | null = null
let allowedSpreadsheet: string | null = null
export function restrictSpreadsheet(id: string | null) {
  allowedSpreadsheet = id
}
export const connectionStatus = () =>
  session && session.expires > Date.now()
    ? { connected: true, write: session.write }
    : { connected: false, write: false }
export function loadIdentity(): Promise<void> {
  if (window.google) return Promise.resolve()
  if (identityPromise) return identityPromise
  identityPromise = new Promise((resolve, reject) => {
    const script = document.createElement('script')
    script.src = 'https://accounts.google.com/gsi/client'
    script.async = true
    const timer = setTimeout(() => {
      script.remove()
      identityPromise = undefined
      reject(Error('Google sign-in timed out. Check your internet connection and retry.'))
    }, 20000)
    script.onload = () => {
      clearTimeout(timer)
      if (window.google) resolve()
      else {
        identityPromise = undefined
        reject(Error('Google sign-in did not load.'))
      }
    }
    script.onerror = () => {
      clearTimeout(timer)
      script.remove()
      identityPromise = undefined
      reject(Error('Google sign-in is unavailable. Check your connection.'))
    }
    document.head.append(script)
  })
  return identityPromise
}
export function authorize(clientId: string, write: boolean): Promise<void> {
  if (!/^[a-zA-Z0-9.-]+\.apps\.googleusercontent\.com$/.test(clientId.trim()))
    throw Error(
      'Enter your public Google OAuth web client ID, ending in .apps.googleusercontent.com.',
    )
  if (!window.google) throw Error('Wait for Google sign-in to load.')
  return new Promise((resolve, reject) => {
    const client = window.google!.accounts.oauth2.initTokenClient({
      client_id: clientId.trim(),
      scope: `https://www.googleapis.com/auth/spreadsheets${write ? '' : '.readonly'}`,
      callback: (response) => {
        if (response.error || !response.access_token) {
          reject(Error(response.error_description || 'Google did not grant access.'))
          return
        }
        session = {
          token: response.access_token,
          expires: Date.now() + Math.max(0, (response.expires_in ?? 3600) - 30) * 1000,
          write: (response.scope ?? '')
            .split(' ')
            .includes('https://www.googleapis.com/auth/spreadsheets'),
        }
        resolve()
      },
      error_callback: () => reject(Error('Google sign-in was cancelled or the popup was blocked.')),
    })
    client.requestAccessToken({ prompt: 'consent' })
  })
}
export function disconnect() {
  const token = session?.token
  session = null
  if (token && window.google) window.google.accounts.oauth2.revoke(token, () => {})
}
export class OfficeFileError extends Error {
  constructor() {
    super(
      'This file is still an Excel/Office workbook. Open it in Google Sheets, choose File → Save as Google Sheets, then paste the new Google Sheets file’s link into the app. The original Excel file stays unchanged.',
    )
    this.name = 'OfficeFileError'
  }
}
export function sheetApiError(message: string): Error {
  return /must not be an office file/i.test(message) ? new OfficeFileError() : Error(message)
}
export async function api<T>(id: string, path: string, options: RequestInit = {}): Promise<T> {
  if (allowedSpreadsheet !== null && id !== allowedSpreadsheet)
    throw Error('This player session can only use its assigned character sheet.')
  if (!navigator.onLine)
    throw Error(
      'Google Sheets requires an internet connection. Your local journal still works offline.',
    )
  if (!session || session.expires <= Date.now()) {
    session = null
    throw Error('Google access has expired. Sign in again.')
  }
  const response = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(id)}${path}`,
    {
      ...options,
      headers: {
        Authorization: `Bearer ${session.token}`,
        'Content-Type': 'application/json',
        ...options.headers,
      },
      signal: AbortSignal.timeout(20000),
    },
  )
  const data = await response.json()
  if (!response.ok) {
    if (response.status === 401) session = null
    throw sheetApiError(data.error?.message ?? `Google Sheets request failed (${response.status}).`)
  }
  return data as T
}
export const sheetInfo = (id: string) =>
  api<SheetInfo>(id, '?fields=properties(title),sheets(properties(sheetId,title))').then(
    (data) => ({
      title: (data as unknown as { properties: { title: string } }).properties.title,
      sheets: data.sheets,
    }),
  )
export function previewRange(range: string) {
  const match = range
    .toUpperCase()
    .trim()
    .match(/^([A-Z]{1,3})([1-9]\d*):([A-Z]{1,3})([1-9]\d*)$/)
  if (!match) throw Error('Use a bounded range such as A1:AD100.')
  const column = (value: string) => [...value].reduce((n, c) => n * 26 + c.charCodeAt(0) - 64, 0)
  const cells =
    (column(match[3]) - column(match[1]) + 1) * (Number(match[4]) - Number(match[2]) + 1)
  if (
    cells < 1 ||
    cells > 5000 ||
    column(match[3]) < column(match[1]) ||
    Number(match[4]) < Number(match[2])
  )
    throw Error('Preview up to 5,000 cells in a forward range.')
  return match[0]
}
export const previewCells = (id: string, title: string, range: string) =>
  api<{ values?: Cell[][] }>(
    id,
    `/values/${encodeURIComponent(qualified(title, previewRange(range)))}?valueRenderOption=UNFORMATTED_VALUE`,
  ).then((data) => data.values ?? [])
async function readValues(
  id: string,
  title: string,
  bindings: Binding[],
  render: string,
): Promise<Cell[]> {
  const ranges = bindings
    .map((b) => `ranges=${encodeURIComponent(qualified(title, b.cell))}`)
    .join('&')
  const result = await api<{ valueRanges: { values?: Cell[][] }[] }>(
    id,
    `/values:batchGet?${ranges}&valueRenderOption=${render}`,
  )
  return bindings.map((_, i) => result.valueRanges[i]?.values?.[0]?.[0] ?? '')
}
export const mappingSignature = (id: string, title: string, bindings: Binding[]) =>
  JSON.stringify({ id, title, bindings })
export async function readMapped(
  id: string,
  title: string,
  bindings: Binding[],
): Promise<Snapshot> {
  const valid = validateBindings(bindings)
  const [values, formulas] = await Promise.all([
    readValues(id, title, valid, 'UNFORMATTED_VALUE'),
    readValues(id, title, valid, 'FORMULA'),
  ])
  return { values, formulas, signature: mappingSignature(id, title, valid) }
}
export async function saveMapped(
  id: string,
  title: string,
  bindings: Binding[],
  snapshot: Snapshot,
  c: Character,
): Promise<void> {
  if (!connectionStatus().write) throw Error('Connect with read/write permission before saving.')
  const valid = validateBindings(bindings)
  if (snapshot.signature !== mappingSignature(id, title, valid))
    throw Error('The mapping changed. Read the mapped cells again before saving.')
  const values = valid.map((b) => characterCell(c, b.field))
  if (values.some((v) => typeof v === 'string' && v.length > 50000))
    throw Error('A value exceeds the 50,000-character cell limit.')
  if (snapshot.formulas.some((v) => typeof v === 'string' && v.startsWith('=')))
    throw Error(
      'A mapped cell contains a formula. Remove formula cells from the mapping before saving.',
    )
  const current = await readMapped(id, title, valid)
  if (
    JSON.stringify(current.values) !== JSON.stringify(snapshot.values) ||
    JSON.stringify(current.formulas) !== JSON.stringify(snapshot.formulas)
  )
    throw Error(
      'The sheet changed since the preview. Read cells again and review the new values before saving.',
    )
  await api(id, '/values:batchUpdate', {
    method: 'POST',
    body: JSON.stringify({
      valueInputOption: 'RAW',
      data: valid.map((b, i) => ({ range: qualified(title, b.cell), values: [[values[i]]] })),
    }),
  })
}

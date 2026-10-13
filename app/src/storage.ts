import { openDB } from 'idb'
import { parseCharacters } from './character.ts'
import type { Character } from './character.ts'
let database: ReturnType<typeof openDB> | undefined
function db() {
  return (database ??= openDB('punman-character-journal', 1, {
    upgrade(database) {
      database.createObjectStore('journal')
    },
  }))
}
export interface Journal {
  version: 2
  revision: number
  characters: Character[]
}
export function parseBackup(value: unknown): Character[] | null {
  if (!value || typeof value !== 'object') return null
  const data = value as { version?: number; characters?: unknown }
  if (![1, 2].includes(data.version ?? 0)) return null
  return parseCharacters(data.characters)
}
export async function readJournal(): Promise<{ journal: Journal | null; raw: unknown }> {
  const raw = await (await db()).get('journal', 'characters')
  if (raw === undefined) return { journal: null, raw }
  if (Array.isArray(raw)) {
    const characters = parseCharacters(raw)
    return { journal: characters ? { version: 2, revision: 0, characters } : null, raw }
  }
  const characters = parseBackup(raw)
  return {
    journal: characters
      ? { version: 2, revision: typeof raw.revision === 'number' ? raw.revision : 0, characters }
      : null,
    raw,
  }
}
export async function saveJournal(
  characters: Character[],
  expectedRevision: number,
): Promise<number> {
  const tx = (await db()).transaction('journal', 'readwrite')
  const stored = await tx.store.get('characters')
  const revision =
    stored && !Array.isArray(stored) && typeof stored.revision === 'number' ? stored.revision : 0
  if (revision !== expectedRevision) {
    const aborted = tx.done.catch(() => {})
    tx.abort()
    await aborted
    throw Error(
      'This journal changed in another tab. Export your current work, then reload before editing further.',
    )
  }
  if (!parseCharacters(characters)) {
    const aborted = tx.done.catch(() => {})
    tx.abort()
    await aborted
    throw Error('The character data could not be saved. Export a backup before reloading.')
  }
  const next = revision + 1
  await tx.store.put({ version: 2, revision: next, characters }, 'characters')
  await tx.done
  return next
}

export async function resetJournal(): Promise<void> {
  await (await db()).delete('journal', 'characters')
}

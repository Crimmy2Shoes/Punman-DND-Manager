import { useEffect, useRef, useState, lazy, Suspense } from 'react'
import {
  Swords,
  BookOpen,
  Sparkles,
  Backpack,
  Plus,
  Download,
  Upload,
  Feather,
  Trash2,
  Check,
  ScrollText,
  Printer,
  Library,
  Copy,
} from 'lucide-react'
import { createCharacter, parseCharacters } from './character'
import type { Character } from './character'
import { readJournal, saveJournal, parseBackup, resetJournal } from './storage'
import Builder from './Builder'
import Offline from './Offline'
import PrintSheet from './PrintSheet'
import Play from './Play'
import CharacterView from './CharacterView'
import Inventory from './Inventory'
import { Modal } from './components'
import './App.css'
const Spells = lazy(() => import('./Spells')),
  Reference = lazy(() => import('./Reference')),
  GoogleSheet = lazy(() => import('./GoogleSheet'))
const tabs = [
  { name: 'Play', icon: Swords },
  { name: 'Character', icon: BookOpen },
  { name: 'Spells', icon: Sparkles },
  { name: 'Inventory & Notes', icon: Backpack },
  { name: 'Reference', icon: Library },
]
function download(value: unknown, filename: string) {
  const url = URL.createObjectURL(
    new Blob([JSON.stringify(value, null, 2)], { type: 'application/json' }),
  )
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
export default function App() {
  const [characters, setCharacters] = useState<Character[]>([]),
    [active, setActive] = useState(''),
    [tab, setTab] = useState('Play'),
    [ready, setReady] = useState(false),
    [status, setStatus] = useState('Loading journal…'),
    [message, setMessage] = useState(''),
    [builder, setBuilder] = useState(false),
    [manage, setManage] = useState(false),
    [raw, setRaw] = useState<unknown>(),
    [busy, setBusy] = useState(false),
    [importing, setImporting] = useState(false),
    [googleSheet, setGoogleSheet] = useState(false)
  const revision = useRef(0),
    writeQueue = useRef(Promise.resolve()),
    blocked = useRef(false),
    saveSequence = useRef(0),
    fileRef = useRef<HTMLInputElement>(null),
    saving = useRef(false),
    skipInitialSave = useRef(false)
  useEffect(() => {
    let mounted = true
    readJournal()
      .then(({ journal, raw }) => {
        if (!mounted) return
        if (raw !== undefined && !journal) {
          setRaw(raw)
          blocked.current = true
          setStatus('Saved data needs attention')
          setMessage(
            'The saved journal could not be validated. Download a recovery copy before editing or importing.',
          )
          return
        }
        revision.current = journal?.revision ?? 0
        skipInitialSave.current = !!journal
        if (journal) setStatus('Saved on this device')
        const list = journal?.characters ?? [createCharacter(true)]
        setCharacters(list)
        let savedActive: string | null = null
        try {
          savedActive = localStorage.getItem('punman-active-character')
        } catch {
          /* Optional preference. */
        }
        setActive(list.some((c) => c.id === savedActive) ? savedActive! : list[0].id)
        setReady(true)
      })
      .catch(() => {
        if (mounted) {
          blocked.current = true
          setMessage('Device storage is unavailable. Export backups to keep your work.')
          setStatus('Session only · storage unavailable')
          const list = [createCharacter(true)]
          setCharacters(list)
          setActive(list[0].id)
          setReady(true)
        }
      })
    return () => {
      mounted = false
    }
  }, [])
  useEffect(() => {
    if (!active) return
    try {
      localStorage.setItem('punman-active-character', active)
    } catch {
      /* IndexedDB saving is independent. */
    }
  }, [active])
  useEffect(() => {
    if (!ready || blocked.current) return
    if (skipInitialSave.current) {
      skipInitialSave.current = false
      return
    }
    const sequence = ++saveSequence.current
    saving.current = true
    setBusy(true)
    setStatus('Saving…')
    writeQueue.current = writeQueue.current.then(async () => {
      if (blocked.current) return
      try {
        revision.current = await saveJournal(characters, revision.current)
        if (sequence === saveSequence.current) {
          setStatus('Saved on this device')
          setBusy(false)
          saving.current = false
        }
      } catch (e) {
        blocked.current = true
        setBusy(false)
        saving.current = false
        setStatus('Save blocked · export a backup')
        setMessage((e as Error).message)
      }
    })
  }, [characters, ready])
  useEffect(() => {
    const guard = (e: BeforeUnloadEvent) => {
      if (saving.current) {
        e.preventDefault()
        e.returnValue = ''
      }
    }
    window.addEventListener('beforeunload', guard)
    return () => window.removeEventListener('beforeunload', guard)
  }, [])
  const c = characters.find((x) => x.id === active) ?? characters[0]
  const replace = (next: Character) =>
    setCharacters((list) => list.map((x) => (x.id === next.id ? next : x)))
  const add = (next: Character) => {
    if (characters.length >= 100) {
      setMessage(
        'This journal supports up to 100 characters. Export and remove unused characters first.',
      )
      return
    }
    setCharacters((list) => [...list, next])
    setActive(next.id)
    setTab('Character')
    setBuilder(false)
  }
  const exportBackup = () => download({ version: 2, characters }, 'punman-character-journal.json')
  const importBackup = async (file: File) => {
    setImporting(true)
    try {
      if (file.size > 10_000_000) throw Error()
      const list = parseBackup(JSON.parse(await file.text()))
      if (!list || list.length + characters.length > 100) throw Error()
      const imported = list.map((x) => ({ ...x, id: crypto.randomUUID() }))
      setCharacters((current) => [...current, ...imported])
      setActive(imported[0].id)
      setMessage(`${imported.length} character(s) imported. Existing characters were kept.`)
    } catch {
      setMessage(
        'Import failed. Choose a valid version 1 or 2 journal backup under 10 MB, with at most 100 total characters.',
      )
    } finally {
      setImporting(false)
    }
  }
  return (
    <div className="shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark">
            <Swords size={25} />
          </div>
          <div>
            Punman’s<span>CHARACTER JOURNAL</span>
          </div>
        </div>
        <div className="sidebar-caption">YOUR ADVENTURERS</div>
        <div className="character-list">
          {characters.map((x) => (
            <button
              key={x.id}
              className={`character-button ${x.id === c?.id ? 'selected' : ''}`}
              onClick={() => setActive(x.id)}
            >
              <span className="avatar">{x.name.slice(0, 1) || '?'}</span>
              <span>
                <strong>{x.name}</strong>
                <small>
                  Level {x.level} · {x.classes.map((x) => x.name).join(' / ') || 'Unchosen class'}
                </small>
              </span>
            </button>
          ))}
        </div>
        <button
          className="new-character"
          disabled={!ready || characters.length >= 100}
          onClick={() => setBuilder(true)}
          aria-label="New character"
        >
          <Plus size={16} /> New character
        </button>
        <div className="sidebar-bottom">
          <ScrollText size={21} />
          <p>
            Every adventure
            <br />
            starts with a story.
          </p>
          <small>D&D 2024 · Personal journal</small>
        </div>
      </aside>
      <main>
        <div className="topbar">
          <span>
            <Feather size={16} /> THE ADVENTURER’S COMPANION
          </span>
          <div className="toolbar">
            <button onClick={exportBackup} disabled={!c}>
              <Download size={15} /> Export
            </button>
            <button disabled={!ready || importing} onClick={() => fileRef.current?.click()}>
              <Upload size={15} />
              {importing ? 'Importing…' : 'Import'}
            </button>
            <button disabled={!c} onClick={() => window.print()}>
              <Printer size={15} /> Print
            </button>
            <button disabled={!c} onClick={() => setGoogleSheet(true)}>
              Google Sheet
            </button>
            <input
              hidden
              type="file"
              accept=".json,application/json"
              ref={fileRef}
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) void importBackup(file)
                e.target.value = ''
              }}
            />
          </div>
        </div>
        {message && (
          <div className="notice" role="status">
            {message}
            <button onClick={() => setMessage('')} aria-label="Dismiss message">
              ×
            </button>
          </div>
        )}
        {!c ? (
          <div className="empty">
            <h1>Your journal awaits</h1>
            <p>{status}</p>
            {raw !== undefined && (
              <div className="actions">
                <button onClick={() => download(raw, 'journal-recovery.json')}>
                  Download recovery copy
                </button>
                <button
                  className="danger"
                  onClick={async () => {
                    if (
                      !window.confirm(
                        'Create a clean journal? Download your recovery copy first. This replaces the unreadable saved journal on this device.',
                      )
                    )
                      return
                    try {
                      await resetJournal()
                      revision.current = 0
                      blocked.current = false
                      skipInitialSave.current = false
                      const next = createCharacter()
                      setRaw(undefined)
                      setCharacters([next])
                      setActive(next.id)
                      setReady(true)
                      setTab('Character')
                      setMessage('A clean journal was created. You can now import a valid backup.')
                    } catch {
                      setMessage(
                        'Storage is still unavailable. Keep your recovery copy and check browser storage settings.',
                      )
                    }
                  }}
                >
                  Create clean journal
                </button>
              </div>
            )}
          </div>
        ) : (
          <>
            <header className="character-header">
              <div>
                <div className="eyebrow">
                  CHARACTER SHEET <span>2024 RULES</span>
                </div>
                <h1>{c.name || 'Unnamed adventurer'}</h1>
                <p>
                  {[
                    c.species,
                    c.classes
                      .map((x) => `${x.name}${x.subclass ? ` (${x.subclass})` : ''}`)
                      .join(' / '),
                    c.background,
                  ]
                    .filter(Boolean)
                    .join(' · ') || 'An unwritten adventure'}
                </p>
              </div>
              <button
                className="level-badge"
                aria-label="Manage character"
                onClick={() => setManage(true)}
              >
                <span>LEVEL</span>
                <strong>{String(c.level).padStart(2, '0')}</strong>
              </button>
            </header>
            <nav className="tabs" aria-label="Character sections">
              {tabs.map(({ name, icon: Icon }) => (
                <button
                  key={name}
                  className={tab === name ? 'active' : ''}
                  aria-current={tab === name ? 'page' : undefined}
                  onClick={() => setTab(name)}
                >
                  <Icon size={18} />
                  {name}
                </button>
              ))}
            </nav>
            <div className="sheet">
              <Suspense fallback={<p>Opening journal section…</p>}>
                {tab === 'Play' && <Play key={c.id} c={c} replace={replace} />}{' '}
                {tab === 'Character' && <CharacterView key={c.id} c={c} replace={replace} />}{' '}
                {tab === 'Spells' && <Spells key={c.id} c={c} replace={replace} />}{' '}
                {tab === 'Inventory & Notes' && <Inventory c={c} replace={replace} />}{' '}
                {tab === 'Reference' && <Reference />}
              </Suspense>
            </div>
            <footer>
              <span role="status">
                <Check size={14} />
                {status}
              </span>
              <button className="text-button" onClick={() => setManage(true)}>
                Manage character
              </button>
              <span>Your story, one session at a time.</span>
            </footer>
            <Offline busy={busy} />
            <PrintSheet c={c} />
          </>
        )}
        {builder && (
          <>
            <Builder onClose={() => setBuilder(false)} onCreate={add} />
          </>
        )}
        {googleSheet && c && (
          <Suspense fallback={<p>Opening Google Sheet settings…</p>}>
            <GoogleSheet key={c.id} c={c} replace={replace} onClose={() => setGoogleSheet(false)} />
          </Suspense>
        )}
        {manage && c && (
          <Modal title="Manage character" onClose={() => setManage(false)}>
            <div className="actions">
              <button
                onClick={() => {
                  add({ ...structuredClone(c), id: crypto.randomUUID(), name: `${c.name} (copy)` })
                  setManage(false)
                }}
              >
                <Copy size={16} /> Duplicate character
              </button>
              <button
                onClick={() =>
                  download(
                    { version: 2, characters: [c] },
                    `${c.name.replace(/[^a-z0-9]/gi, '-') || 'character'}.json`,
                  )
                }
              >
                <Download size={16} /> Export this character
              </button>
              <button
                className="danger"
                disabled={characters.length < 2}
                onClick={() => {
                  if (
                    window.confirm(
                      `Delete ${c.name}? Export a backup first if you want to keep it.`,
                    )
                  ) {
                    const remaining = characters.filter((x) => x.id !== c.id)
                    setCharacters(remaining)
                    setActive(remaining[0].id)
                    setManage(false)
                  }
                }}
              >
                <Trash2 size={16} /> Delete character
              </button>
              <button
                onClick={() => {
                  add(createCharacter())
                  setManage(false)
                }}
              >
                <Plus size={16} /> Create blank character
              </button>
              <button
                onClick={async () => {
                  const allowed = await navigator.storage?.persist?.()
                  setMessage(
                    allowed
                      ? 'Browser persistence was granted. Keep regular exported backups.'
                      : 'The browser did not grant persistent storage. Keep regular exported backups.',
                  )
                  setManage(false)
                }}
              >
                Request persistent device storage
              </button>
            </div>
            <p className="hint">
              Characters live in this browser under this site address. Export backups before
              clearing site data or changing devices.
            </p>
            {!parseCharacters(characters) && (
              <p role="alert">Some data is invalid. Export a recovery copy.</p>
            )}
          </Modal>
        )}
      </main>
    </div>
  )
}

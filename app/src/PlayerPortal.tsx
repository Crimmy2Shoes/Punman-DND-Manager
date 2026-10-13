import { useEffect, useRef, useState } from 'react'
import { Swords } from 'lucide-react'
import { initialPlayerSheet, LAST_PLAYER_SHEET, selectedPlayerSheet } from './playerAccess'
import {
  authorize,
  connectionStatus,
  disconnect,
  loadIdentity,
  OfficeFileError,
  restrictSpreadsheet,
} from './googleSheets'
import { readWorkbook } from './sheetModel'
import type { Workbook } from './sheetModel'
import SpreadsheetApp from './SpreadsheetApp'
import './App.css'
import './SpreadsheetApp.css'
import './PlayerPortal.css'

export default function PlayerPortal() {
  const [url, setUrl] = useState(() => {
    let remembered = ''
    try {
      remembered = localStorage.getItem(LAST_PLAYER_SHEET) || ''
    } catch {
      /* Storage is optional. */
    }
    return initialPlayerSheet(window.location.search, remembered)
  })
  const [selection, setSelection] = useState<{ id: string; url: string } | null>(null)
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || ''
  const [book, setBook] = useState<Workbook | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [ready, setReady] = useState(false)
  const opening = useRef(false)
  useEffect(() => {
    restrictSpreadsheet('__unselected__')
    let mounted = true
    if (clientId)
      void loadIdentity().then(
        () => {
          if (mounted) setReady(true)
        },
        (e) => {
          if (mounted) setError(e.message)
        },
      )
    return () => {
      mounted = false
    }
  }, [clientId])
  useEffect(() => {
    const check = () => {
      if (!connectionStatus().connected) setBook(null)
    }
    const timer = setInterval(check, 1000)
    window.addEventListener('focus', check)
    return () => {
      clearInterval(timer)
      window.removeEventListener('focus', check)
    }
  }, [])
  const changeSheet = () => {
    setBook(null)
    setSelection(null)
    setError('')
    restrictSpreadsheet('__unselected__')
  }
  const signOut = () => {
    disconnect()
    changeSheet()
  }
  const openSheet = async () => {
    if (opening.current) return
    setError('')
    let chosen: { id: string; url: string }
    try {
      chosen = selectedPlayerSheet(url)
    } catch (e) {
      setError((e as Error).message)
      return
    }
    opening.current = true
    setBusy(true)
    restrictSpreadsheet(chosen.id)
    try {
      if (!connectionStatus().write) await authorize(clientId, true)
      const next = await readWorkbook(chosen.id)
      if (!next.sheets.some((s) => s.title === 'v2.1'))
        throw Error('This spreadsheet needs the supported v2.1 character layout.')
      setUrl(chosen.url)
      setSelection(chosen)
      setBook(next)
      const pageUrl = new URL(window.location.href)
      pageUrl.searchParams.delete('character')
      window.history.replaceState(null, '', pageUrl)
      try {
        localStorage.setItem(LAST_PLAYER_SHEET, chosen.url)
      } catch {
        /* Opening still works without storage. */
      }
    } catch (e) {
      disconnect()
      setBook(null)
      setSelection(null)
      restrictSpreadsheet('__unselected__')
      setError(
        e instanceof OfficeFileError
          ? e.message
          : `Unable to open this character. Check the link and your Google account’s access. ${(e as Error).message}`,
      )
    } finally {
      opening.current = false
      setBusy(false)
    }
  }
  if (book && selection)
    return (
      <SpreadsheetApp
        key={selection.id}
        initialWorkbook={book}
        player={{ ...selection, clientId, onSignOut: signOut, onChangeSheet: changeSheet }}
      />
    )
  return (
    <main className="player-entry">
      <section className="player-entry-card">
        <div className="brand-mark">
          <Swords size={30} />
        </div>
        <div className="eyebrow">CHARACTER COMPANION</div>
        <h1>Open your character</h1>
        <p>
          Copy your character sheet’s link from the shared Google Drive folder and paste it below.
        </p>
        <form
          onSubmit={(event) => {
            event.preventDefault()
            void openSheet()
          }}
        >
          <label className="field">
            <span>Character spreadsheet URL</span>
            <input
              aria-label="Character spreadsheet URL"
              autoComplete="off"
              spellCheck={false}
              inputMode="url"
              placeholder="https://docs.google.com/spreadsheets/d/…"
              value={url}
              disabled={busy}
              onChange={(e) => {
                setUrl(e.target.value)
                setError('')
              }}
            />
          </label>
          {error && (
            <p className="notice error" role="alert">
              {error}
            </p>
          )}
          {!clientId && (
            <p role="alert">Google sign-in has not been configured by the app owner.</p>
          )}
          <button type="submit" disabled={busy || !ready || !clientId}>
            {busy ? 'Opening character…' : 'Open character'}
          </button>
        </form>
        {error && !ready && clientId && (
          <button
            disabled={busy}
            onClick={() => {
              setError('')
              void loadIdentity().then(
                () => setReady(true),
                (e) => setError(e.message),
              )
            }}
          >
            Retry Google sign-in
          </button>
        )}
      </section>
    </main>
  )
}

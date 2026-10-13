import { useEffect, useState } from 'react'
import { Plus, Trash2, ExternalLink } from 'lucide-react'
import { Modal, Field, Select } from './components'
import type { Character } from './character'
import {
  DEFAULT_SHEET_URL,
  mappedFields,
  sheetTarget,
  previewCells,
  sheetInfo,
  loadIdentity,
  authorize,
  connectionStatus,
  disconnect,
  readMapped,
  importCells,
  validateBindings,
  characterCell,
  saveMapped,
  mappingSignature,
} from './googleSheets'
import type { Binding, Cell, SheetInfo, Snapshot } from './googleSheets'
interface Config {
  clientId: string
  url: string
  bindings: Binding[]
  range: string
}
const defaults: Config = { clientId: '', url: DEFAULT_SHEET_URL, bindings: [], range: 'A1:AD100' }
function readConfig(id: string): Config {
  try {
    const saved = JSON.parse(localStorage.getItem(`punman-sheet:${id}`) ?? 'null')
    if (
      saved &&
      typeof saved.clientId === 'string' &&
      typeof saved.url === 'string' &&
      Array.isArray(saved.bindings) &&
      saved.bindings.every(
        (b: Binding) => typeof b.field === 'string' && typeof b.cell === 'string',
      )
    )
      return {
        clientId: saved.clientId,
        url: saved.url,
        bindings: saved.bindings,
        range: typeof saved.range === 'string' ? saved.range : defaults.range,
      }
  } catch {
    /* Optional configuration. */
  }
  return defaults
}
export default function GoogleSheet({
  c,
  replace,
  onClose,
}: {
  c: Character
  replace: (c: Character) => void
  onClose: () => void
}) {
  const [config, setConfig] = useState(() => readConfig(c.id)),
    [info, setInfo] = useState<SheetInfo | null>(null),
    [gid, setGid] = useState(() => {
      try {
        return String(sheetTarget(readConfig(c.id).url).gid)
      } catch {
        return ''
      }
    }),
    [grid, setGrid] = useState<Cell[][] | null>(null),
    [snapshot, setSnapshot] = useState<Snapshot | null>(null),
    [review, setReview] = useState(false),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(''),
    [notice, setNotice] = useState(''),
    [connected, setConnected] = useState(connectionStatus()),
    [identityReady, setIdentityReady] = useState(!!window.google),
    [write, setWrite] = useState(connectionStatus().write)
  const title =
    info?.sheets.find((s) => String(s.properties.sheetId) === gid)?.properties.title ?? ''
  const change = (patch: Partial<Config>) => {
    setConfig((current) => ({ ...current, ...patch }))
    setSnapshot(null)
    setReview(false)
    setNotice('')
  }
  useEffect(() => {
    try {
      localStorage.setItem(`punman-sheet:${c.id}`, JSON.stringify(config))
    } catch {
      setNotice('Connection settings could not be saved on this device.')
    }
  }, [config, c.id])
  useEffect(() => {
    setInfo(null)
    setGrid(null)
    try {
      setGid(String(sheetTarget(config.url).gid))
    } catch {
      setGid('')
    }
  }, [config.url])
  useEffect(() => {
    if (!/^[a-zA-Z0-9.-]+\.apps\.googleusercontent\.com$/.test(config.clientId.trim())) return
    let mounted = true
    loadIdentity()
      .then(() => {
        if (mounted) setIdentityReady(true)
      })
      .catch((e) => {
        if (mounted) setError(e.message)
      })
    return () => {
      mounted = false
    }
  }, [config.clientId])
  useEffect(() => {
    const timer = setInterval(() => setConnected(connectionStatus()), 15000)
    return () => clearInterval(timer)
  }, [])
  const run = async (fn: () => Promise<void>) => {
    setBusy(true)
    setError('')
    setNotice('')
    try {
      await fn()
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setBusy(false)
      setConnected(connectionStatus())
    }
  }
  const target = () => sheetTarget(config.url)
  const load = async () => {
    const targetInfo = await sheetInfo(target().id)
    setInfo(targetInfo)
    if (!targetInfo.sheets.some((s) => String(s.properties.sheetId) === gid)) {
      setGid(String(targetInfo.sheets[0]?.properties.sheetId ?? ''))
      setNotice(
        'The linked worksheet was not found. Choose the intended worksheet before reading cells.',
      )
    }
  }
  const fresh = async () => {
    if (!title) throw Error('Load the spreadsheet and choose a worksheet first.')
    const valid = validateBindings(config.bindings)
    const result = await readMapped(target().id, title, valid)
    setSnapshot(result)
    setReview(false)
    setNotice('Mapped cells loaded. Blank cells are skipped when importing.')
  }
  const mapped = () => validateBindings(config.bindings)
  const currentReview = () => {
    if (!snapshot) throw Error('Read mapped cells first.')
    const valid = mapped()
    if (snapshot.signature !== mappingSignature(target().id, title, valid))
      throw Error('The mapping changed. Read the mapped cells again.')
    return valid.map((b, i) => ({
      ...b,
      previous: snapshot.values[i],
      next: characterCell(c, b.field),
    }))
  }
  let rows: ReturnType<typeof currentReview> = []
  if (review) {
    try {
      rows = currentReview()
    } catch {
      /* Cleared on configuration edits. */
    }
  }
  return (
    <Modal
      title="Connect your Google Sheet"
      onClose={() => {
        if (!busy) onClose()
      }}
    >
      <p className="hint">
        Use this sheet as a personal character source or destination. Local autosave continues
        independently. Google access tokens stay in memory and expire; signing in here is separate
        from a Google Drive connection in this chat.
      </p>
      <details className="setup-guide" open={!config.clientId}>
        <summary>Google setup · required once</summary>
        <ol>
          <li>
            Open{' '}
            <a href="https://console.cloud.google.com/" target="_blank" rel="noreferrer">
              Google Cloud Console
            </a>{' '}
            and create or choose a project.
          </li>
          <li>
            Enable <strong>Google Sheets API</strong>. Configure Google Auth Platform branding and
            audience. For a personal Gmail account, use External / Testing and add your own email as
            a test user.
          </li>
          <li>
            Create an OAuth client with type <strong>Web application</strong>. Add{' '}
            <code>{window.location.origin}</code> as an authorized JavaScript origin. Add your
            preview origin too if you use it.
          </li>
          <li>
            Paste the public client ID below. A client secret and API key are not needed by this
            integration.
          </li>
          <li>
            Sign in with the account that can access your sheet. Preview it, then map the exact
            cells containing character values.
          </li>
        </ol>
        <p className="hint">
          <a
            href="https://developers.google.com/workspace/sheets/api/quickstart/js"
            target="_blank"
            rel="noreferrer"
          >
            Google’s setup guide
          </a>{' '}
          · Read/write access requests the Sheets scope, which can cover other spreadsheets your
          account can access. The app only calls the spreadsheet you enter here.
        </p>
      </details>
      <fieldset disabled={busy}>
        <div className="field-grid">
          <Field
            label="Google OAuth web client ID (public)"
            value={config.clientId}
            onChange={(v) => change({ clientId: v.trim() })}
          />
          <Field
            label="Google spreadsheet URL"
            value={config.url}
            onChange={(v) => change({ url: v.trim() })}
          />
          <Select
            label="Google access permission"
            value={write ? 'write' : 'read'}
            options={[
              { value: 'read', label: 'Read only (preview / import)' },
              { value: 'write', label: 'Read and write (review / save)' },
            ]}
            onChange={(v) => {
              setWrite(v === 'write')
              setReview(false)
            }}
          />
        </div>
        <div className="actions">
          <button
            disabled={
              !identityReady ||
              !/^[a-zA-Z0-9.-]+\.apps\.googleusercontent\.com$/.test(config.clientId)
            }
            onClick={() =>
              void run(async () => {
                await authorize(config.clientId, write)
                setConnected(connectionStatus())
                await load()
              })
            }
          >
            {connected.connected ? 'Sign in again / change permission' : 'Sign in with Google'}
          </button>
          <button disabled={!connected.connected} onClick={() => void run(load)}>
            Load spreadsheet
          </button>
          <button
            disabled={!connected.connected}
            onClick={() => {
              disconnect()
              setConnected(connectionStatus())
              setSnapshot(null)
              setReview(false)
              setGrid(null)
            }}
          >
            Disconnect Google
          </button>
          <a
            href={(() => {
              try {
                sheetTarget(config.url)
                return config.url
              } catch {
                return DEFAULT_SHEET_URL
              }
            })()}
            target="_blank"
            rel="noreferrer"
            className="sheet-link"
          >
            <ExternalLink size={14} /> Open sheet
          </a>
        </div>
        <p className="hint">
          {connected.connected
            ? `Connected · ${connected.write ? 'read/write' : 'read only'}`
            : 'Not connected. You can keep using the local journal.'}
        </p>
        {info && (
          <>
            <h3>{info.title}</h3>
            <div className="field-grid">
              <Select
                label="Worksheet"
                value={gid}
                options={info.sheets.map((s) => ({
                  value: String(s.properties.sheetId),
                  label: s.properties.title,
                }))}
                onChange={(v) => {
                  setGid(v)
                  setSnapshot(null)
                  setReview(false)
                  setGrid(null)
                }}
              />
              <Field
                label="Preview cell range"
                value={config.range}
                onChange={(v) => change({ range: v })}
              />
              <button
                onClick={() =>
                  void run(async () => {
                    if (!title) throw Error('Choose a worksheet.')
                    setGrid(await previewCells(target().id, title, config.range))
                  })
                }
              >
                Preview worksheet
              </button>
            </div>
            {grid && (
              <div className="sheet-grid">
                <p>
                  Preview of {title}!{config.range}. Use your sheet’s own row and column headings to
                  choose cell addresses.
                </p>
                <table>
                  <tbody>
                    {grid.map((row, i) => (
                      <tr key={i}>
                        {row.map((value, j) => (
                          <td key={j} title={String(value)}>
                            {String(value).slice(0, 150)}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
                {!grid.length && <p>The preview range is empty.</p>}
              </div>
            )}
          </>
        )}
        <h3>Map character fields to cells</h3>
        <p className="hint">
          There are no guessed addresses. For example, map Character name to B3 only if B3 holds the
          name in your sheet. Each field and cell can be mapped once. Formula cells can be read but
          cannot be overwritten. Full character JSON preserves structured entries in one dedicated
          cell (up to 50,000 characters).
        </p>
        <div className="binding-list">
          {config.bindings.map((binding, i) => (
            <div key={i} className="binding-row">
              <Select
                label={`Mapped field ${i + 1}`}
                value={binding.field}
                options={mappedFields.map((field) => ({
                  value: field,
                  label:
                    field === 'backup'
                      ? 'Full character JSON'
                      : field === 'name'
                        ? 'Character name'
                        : field === 'className'
                          ? 'Primary class'
                          : field,
                }))}
                onChange={(v) =>
                  change({
                    bindings: config.bindings.map((b, j) => (j === i ? { ...b, field: v } : b)),
                  })
                }
              />
              <Field
                label={`Cell address ${i + 1}`}
                value={binding.cell}
                onChange={(v) =>
                  change({
                    bindings: config.bindings.map((b, j) =>
                      j === i ? { ...b, cell: v.toUpperCase() } : b,
                    ),
                  })
                }
              />
              <button
                aria-label={`Remove mapping ${i + 1}`}
                onClick={() => change({ bindings: config.bindings.filter((_, j) => j !== i) })}
              >
                <Trash2 size={15} />
              </button>
            </div>
          ))}
        </div>
        <div className="actions">
          <button
            disabled={config.bindings.length >= 100}
            onClick={() =>
              change({
                bindings: [
                  ...config.bindings,
                  {
                    field:
                      mappedFields.find((f) => !config.bindings.some((b) => b.field === f)) ??
                      'name',
                    cell: '',
                  },
                ],
              })
            }
          >
            <Plus size={15} /> Add cell mapping
          </button>
          <button
            disabled={!connected.connected || !title || !config.bindings.length}
            onClick={() => void run(fresh)}
          >
            Read mapped cells
          </button>
        </div>
        {snapshot && (
          <>
            <div className="sheet-grid">
              <table>
                <thead>
                  <tr>
                    <th>Field</th>
                    <th>Cell</th>
                    <th>Current sheet value</th>
                  </tr>
                </thead>
                <tbody>
                  {config.bindings.map((b, i) => (
                    <tr key={i}>
                      <td>{b.field}</td>
                      <td>{b.cell}</td>
                      <td>{String(snapshot.values[i]).slice(0, 300) || '(blank)'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="actions">
              <button
                onClick={() => {
                  try {
                    replace(importCells(c, config.bindings, snapshot.values))
                    setNotice(
                      'Mapped values imported into this character. Local autosave will save them.',
                    )
                    setError('')
                    setReview(false)
                  } catch (e) {
                    setError((e as Error).message)
                  }
                }}
              >
                Import mapped values
              </button>
              <button
                disabled={!connected.write || !write}
                onClick={() => {
                  try {
                    const rows = currentReview()
                    if (snapshot.formulas.some((v) => typeof v === 'string' && v.startsWith('=')))
                      throw Error('A mapped cell contains a formula. Remove it before saving.')
                    if (rows.some((r) => typeof r.next === 'string' && r.next.length > 50000))
                      throw Error('A mapped value exceeds the 50,000-character cell limit.')
                    setReview(true)
                    setError('')
                  } catch (e) {
                    setError((e as Error).message)
                  }
                }}
              >
                Review changes to sheet
              </button>
            </div>
          </>
        )}
        {review && snapshot && (
          <div className="save-review">
            <h3>
              Review {c.name} → {title}
            </h3>
            <div className="sheet-grid">
              <table>
                <thead>
                  <tr>
                    <th>Cell / field</th>
                    <th>Existing</th>
                    <th>New value</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => (
                    <tr key={r.cell}>
                      <td>
                        {r.cell} · {r.field}
                      </td>
                      <td>{String(r.previous).slice(0, 300) || '(blank)'}</td>
                      <td>{String(r.next).slice(0, 300) || '(clear cell)'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="actions">
              <button
                className="primary"
                onClick={() =>
                  void run(async () => {
                    await saveMapped(target().id, title, config.bindings, snapshot, c)
                    await fresh()
                    setNotice(
                      'Mapped values saved to your Google Sheet. No other cells were written.',
                    )
                    setReview(false)
                  })
                }
              >
                Confirm save to Google Sheet
              </button>
              <button onClick={() => setReview(false)}>Cancel review</button>
            </div>
            <p className="hint">
              The app checks these cells again before writing. Sheets does not provide an atomic
              compare-and-write operation; avoid editing the same cells from another device while
              saving.
            </p>
          </div>
        )}
      </fieldset>
      {busy && <p role="status">Working with Google…</p>}
      {notice && (
        <p className="notice" role="status">
          {notice}
        </p>
      )}
      {error && (
        <p className="notice" role="alert">
          {error}
        </p>
      )}
    </Modal>
  )
}

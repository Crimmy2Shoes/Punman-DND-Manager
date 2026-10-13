import { lazy, Suspense, useEffect, useRef, useState } from 'react'
import {
  BookOpen,
  Swords,
  Sparkles,
  Backpack,
  Settings,
  RefreshCw,
  Feather,
  ExternalLink,
  PanelLeftClose,
  PanelLeftOpen,
  Moon,
  Sun,
  UserPlus,
} from 'lucide-react'
import {
  DEFAULT_SHEET_URL,
  sheetTarget,
  authorize,
  loadIdentity,
  connectionStatus,
  disconnect,
} from './googleSheets'
import {
  cellValue,
  choices,
  conflicts,
  editable,
  keyOf,
  readWorkbook,
  validateEdit,
  writeEdits,
  xpForLevel,
} from './sheetModel'
import type { Edit, Value, Workbook } from './sheetModel'
import { Modal, Panel } from './components'
import PugilistPanel from './PugilistPanel'
import { skillCue } from './skillFormatting'
import BackgroundPicker from './BackgroundPicker'
import { SheetInventory, SheetSpells } from './SheetManagers'
import { AbilityGuide, RulesDialog } from './CompanionPanels'
import SheetSkills from './SheetSkills'
import {
  characterClasses,
  DEFAULT_RULES,
  validateSkillChange,
  validateSkillDraft,
} from './companionRules'
import type { RuleSettings, Reader } from './companionRules'
import { OFFICIAL_SUBCLASSES, canonicalSubclass, subclassUnlock } from './phbSubclassRules'
import PlayerLinks from './PlayerLinks'
import { playerDraftKey, playerRulesKey } from './playerAccess'
import './App.css'
import './SpreadsheetApp.css'
import './CompanionTheme.css'
import './SheetSkills.css'
import './RuleLibrary.css'

const SETTINGS = 'punpun-workbook-settings',
  CACHE = 'punpun-workbook-cache',
  DRAFTS = 'punpun-workbook-drafts'
const Offline = import.meta.env.VITE_APP_MODE === 'player' ? null : lazy(() => import('./Offline'))
function stored<T>(key: string, fallback: T): T {
  try {
    return JSON.parse(localStorage.getItem(key) ?? 'null') ?? fallback
  } catch {
    return fallback
  }
}
const sections = [
  { name: 'Play', icon: Swords },
  { name: 'Character', icon: BookOpen },
  { name: 'Spells', icon: Sparkles },
  { name: 'Inventory & Notes', icon: Backpack },
  { name: 'Pugilist', icon: Swords },
  { name: 'Workbook', icon: BookOpen },
]
const abilities = ['Strength', 'Dexterity', 'Constitution', 'Intelligence', 'Wisdom', 'Charisma']
const qualified = (tab: string, address: string) => `${tab}!${address}`
function SkillLegend({ loaded, pending }: { loaded: boolean; pending: boolean }) {
  return (
    <details className="skill-legend">
      <summary>Skill colors</summary>
      <p>Colored, underlined names show selections still granted by the spreadsheet.</p>
      <div>
        <span className="skill-class">Blue · class</span>
        <span className="skill-race">Purple · race grant</span>
        <span className="skill-race-choice">Magenta · race choice</span>
        <span className="skill-background">Dark orange · background</span>
      </div>
      <p className="hint">
        Yellow markers are the sheet's separate selection reminder. Color alone does not grant
        Expertise; use the features or DM ruling that grant it.
      </p>
      {!loaded && (
        <p className="hint">
          Connect and refresh to read live skill-choice formatting. The local preview does not
          evaluate conditional formatting.
        </p>
      )}
      {pending && (
        <p className="hint" role="status">
          Choice colors reflect the last sheet refresh. Save class, race, background and skill edits
          to let the sheet update its remaining choices.
        </p>
      )}
    </details>
  )
}
interface PlayerSession {
  id: string
  url: string
  clientId: string
  onSignOut: () => void
  onChangeSheet: () => void
}
export default function SpreadsheetApp({
  initialWorkbook: initial,
  player,
}: {
  initialWorkbook: Workbook
  player?: PlayerSession
}) {
  const draftKey = player ? playerDraftKey(player.id) : DRAFTS
  const [playerLinks, setPlayerLinks] = useState(false)
  const [settings, setSettings] = useState(() => {
      if (player) return { url: player.url, clientId: player.clientId }
      const configured = stored(SETTINGS, { url: DEFAULT_SHEET_URL, clientId: '' })
      return {
        ...configured,
        clientId: configured.clientId || import.meta.env.VITE_GOOGLE_CLIENT_ID || '',
      }
    }),
    [book, setBook] = useState<Workbook>(() => {
      if (player) return initial
      const cache = stored<Workbook | null>(CACHE, null)
      const selected = stored(SETTINGS, { url: DEFAULT_SHEET_URL }).url
      try {
        return cache?.spreadsheetId === sheetTarget(selected).id &&
          cache?.sheets?.every((s) => s.cells && typeof s.title === 'string')
          ? cache
          : initial
      } catch {
        return initial
      }
    }),
    [edits, setEdits] = useState<Record<string, Edit>>(() => stored(draftKey, {})),
    [tab, setTab] = useState('Play'),
    [setup, setSetup] = useState(
      () => new URLSearchParams(window.location.search).get('connect') === '1',
    ),
    [wizard, setWizard] = useState(false),
    [creationStep, setCreationStep] = useState(0),
    [review, setReview] = useState(false),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(''),
    [notice, setNotice] = useState(''),
    [status, setStatus] = useState(connectionStatus()),
    [auto, setAuto] = useState(true),
    [selectedTab, setSelectedTab] = useState('v2.1'),
    [search, setSearch] = useState(''),
    [address, setAddress] = useState('C6'),
    [className, setClassName] = useState(''),
    [subclass, setSubclass] = useState(''),
    [classLevel, setClassLevel] = useState(1)
  const [dark, setDark] = useState(() =>
    stored('punpun-dark-mode', window.matchMedia('(prefers-color-scheme: dark)').matches),
  )
  const [collapsed, setCollapsed] = useState(() => stored('punpun-sidebar-collapsed', false))
  const [rulesOpen, setRulesOpen] = useState(false)
  const [ruleProfiles, setRuleProfiles] = useState<Record<string, RuleSettings>>(() =>
    player
      ? { [player.id]: stored(playerRulesKey(player.id), DEFAULT_RULES) }
      : stored('punpun-rule-profiles', {}),
  )
  const profileKey = (() => {
    try {
      return sheetTarget(settings.url).id
    } catch {
      return 'preview'
    }
  })()
  const ruleSettings = { ...DEFAULT_RULES, ...ruleProfiles[profileKey] }
  const lock = useRef(false)
  const target = () => sheetTarget(settings.url)
  const main = book.sheets.find((s) => s.title === 'v2.1')
  const changes = Object.values(edits),
    collisions = conflicts(book, changes)
  const live =
    !!book.spreadsheetId &&
    book.spreadsheetId ===
      (() => {
        try {
          return target().id
        } catch {
          return ''
        }
      })()
  const saveStorage = (key: string, value: unknown) => {
    try {
      localStorage.setItem(key, JSON.stringify(value))
    } catch {
      setError(
        'Browser storage is full or unavailable. Export your draft before closing this page.',
      )
    }
  }
  useEffect(() => {
    if (!player) saveStorage(SETTINGS, settings)
  }, [settings])
  useEffect(() => saveStorage(draftKey, edits), [edits])
  useEffect(() => {
    document.documentElement.dataset.theme = dark ? 'dark' : 'light'
    saveStorage('punpun-dark-mode', dark)
  }, [dark])
  useEffect(() => saveStorage('punpun-sidebar-collapsed', collapsed), [collapsed])
  useEffect(
    () =>
      saveStorage(
        player ? playerRulesKey(player.id) : 'punpun-rule-profiles',
        player ? ruleProfiles[player.id] : ruleProfiles,
      ),
    [ruleProfiles],
  )
  useEffect(() => {
    if (!settings.clientId) return
    void loadIdentity().catch((e) => setError(e.message))
  }, [settings.clientId])
  const run = async (fn: () => Promise<void>) => {
    if (lock.current) return
    lock.current = true
    setBusy(true)
    setError('')
    try {
      await fn()
    } catch (e) {
      setError((e as Error).message)
    } finally {
      lock.current = false
      setBusy(false)
      setStatus(connectionStatus())
    }
  }
  const accept = (next: Workbook) => {
    setBook(next)
    if (!player) saveStorage(CACHE, next)
    setEdits((current) =>
      Object.fromEntries(
        Object.entries(current).filter(
          ([, edit]) => cellValue(next, edit.tab, edit.address) !== edit.value,
        ),
      ),
    )
  }
  const refresh = async () => {
    const next = await readWorkbook(target().id)
    accept(next)
    setNotice('Spreadsheet refreshed. Your unsaved changes have been kept.')
  }
  useEffect(() => {
    const tick = () => {
      setStatus(connectionStatus())
      if (
        auto &&
        connectionStatus().connected &&
        document.visibilityState === 'visible' &&
        !lock.current
      )
        void run(refresh)
    }
    const timer = setInterval(tick, 30000)
    const focus = () => {
      if (auto && connectionStatus().connected) tick()
    }
    window.addEventListener('focus', focus)
    return () => {
      clearInterval(timer)
      window.removeEventListener('focus', focus)
    }
  }, [auto, settings.url])
  useEffect(() => {
    const guard = (event: BeforeUnloadEvent) => {
      if (changes.length) {
        event.preventDefault()
        event.returnValue = ''
      }
    }
    window.addEventListener('beforeunload', guard)
    return () => window.removeEventListener('beforeunload', guard)
  }, [changes.length])
  const stage = (sheet: string, cell: string, value: Value) => {
    if (lock.current) return
    if (player && (!live || !connectionStatus().connected)) return
    const key = keyOf(sheet, cell)
    const old = edits[key]
    const edit = {
      tab: sheet,
      address: cell,
      value,
      before: old?.before ?? cellValue(book, sheet, cell),
    }
    try {
      validateEdit(book, edit)
      const current: Reader = (s, a) => edits[keyOf(s, a)]?.value ?? cellValue(book, s, a)
      const next: Reader = (s, a) => (s === sheet && a === cell ? value : current(s, a))
      if (sheet === 'v2.1') validateSkillChange(book, current, next, ruleSettings, cell)
      setError('')
      setEdits((current) => {
        const next = { ...current }
        if (edit.value === edit.before) delete next[key]
        else next[key] = edit
        return next
      })
    } catch (e) {
      setError((e as Error).message)
    }
  }
  const value = (sheet: string, cell: string) =>
    edits[keyOf(sheet, cell)]?.value ?? cellValue(book, sheet, cell)
  const hasPugilist = characterClasses(book, value).some(
    (c) => c.name === 'Pugilist' && c.level > 0,
  )
  const tabs = sections.filter((section) => section.name !== 'Pugilist' || hasPugilist)
  const activeTab = tab === 'Pugilist' && !hasPugilist ? 'Play' : tab
  useEffect(() => {
    if (tab === 'Pugilist' && !hasPugilist) setTab('Play')
  }, [tab, hasPugilist])
  const discard = (e: Edit) =>
    setEdits((current) => {
      const next = { ...current }
      delete next[keyOf(e.tab, e.address)]
      return next
    })
  const field = (
    label: string,
    cell: string,
    sheet = 'v2.1',
    type: 'text' | 'number' | 'marker' | 'skill' | 'long' = 'text',
  ) => {
    const source = book.sheets.find((s) => s.title === sheet)
    if (!source) return null
    const data = source.cells[cell],
      locked = !editable(source, cell),
      draft = edits[keyOf(sheet, cell)],
      current = value(sheet, cell)
    const options = choices(book, source, cell),
      id = qualified(sheet, cell)
    const cue = type === 'skill' && sheet === 'v2.1' ? skillCue(book, cell) : null
    if (type === 'skill' && sheet === 'v2.1') {
      const skillAbilities = [
        'Dex',
        'Wis',
        'Int',
        'Str',
        'Cha',
        'Int',
        'Wis',
        'Cha',
        'Int',
        'Wis',
        'Int',
        'Wis',
        'Cha',
        'Cha',
        'Int',
        'Dex',
        'Dex',
        'Wis',
      ]
      const row = Number(cell.slice(1)),
        rank =
          String(current).toLowerCase() === 'e'
            ? 'e'
            : current === 1 || current === true || current === '1'
              ? '1'
              : '0'
      const bonus = cellValue(book, sheet, 'I' + row)
      const bonusText =
        bonus === '' ? '—' : typeof bonus === 'number' && bonus >= 0 ? '+' + bonus : String(bonus)
      return (
        <li
          key={id}
          data-training={rank}
          className={`sheet-field skill-row ${draft ? 'has-draft' : ''}`}
        >
          <output
            className="skill-bonus"
            aria-label={`${label} bonus`}
            title={draft ? 'Calculated by the spreadsheet after saving' : undefined}
          >
            {bonusText}
          </output>
          <div className="skill-identity">
            <label
              htmlFor={id}
              className={cue?.underline ? `skill-name skill-${cue.className}` : undefined}
              title={data?.note}
            >
              <span>{label}</span>
            </label>
            <div className="skill-metadata">
              <small className="skill-ability">{skillAbilities[row - 25]}</small>
              {cue?.label && (
                <span className={`skill-source skill-${cue.className}`}>
                  <i aria-hidden="true" style={{ backgroundColor: cue.color }} />
                  {cue.label}
                </span>
              )}
            </div>
          </div>
          {locked ? (
            <output aria-label={label}>
              {rank === 'e' ? 'Expertise' : rank === '1' ? 'Proficient' : 'Not proficient'}
            </output>
          ) : (
            <select
              id={id}
              aria-label={label}
              disabled={busy}
              value={rank}
              onChange={(e) =>
                stage(sheet, cell, e.target.value === 'e' ? 'e' : Number(e.target.value))
              }
            >
              <option value="0">Not proficient</option>
              <option value="1">Proficient</option>
              <option value="e">Expertise</option>
            </select>
          )}
          <span className="skill-row-status">
            {draft ? (
              <span
                className="skill-unsaved"
                title="Unsaved training change"
                aria-label="Unsaved training change"
              >
                •
              </span>
            ) : cue?.yellow ? (
              <span
                className="skill-pending"
                title="Selection pending in sheet"
                aria-label="Selection pending in sheet"
              >
                •
              </span>
            ) : null}
          </span>
        </li>
      )
    }
    if (sheet === 'v2.1' && cell === 'AJ11' && !locked)
      return (
        <BackgroundPicker
          key={id}
          book={book}
          options={options}
          value={String(current)}
          disabled={busy}
          onChange={(next) => stage(sheet, cell, next)}
        />
      )
    return (
      <label key={id} className={`field sheet-field ${draft ? 'has-draft' : ''}`}>
        <span>
          <span
            className={cue?.underline ? `skill-name skill-${cue.className}` : undefined}
            title={cue?.color ? `Spreadsheet text color: ${cue.color}` : undefined}
          >
            {label}
          </span>
          {cue?.label && (
            <small className={`skill-source skill-${cue.className}`}>
              <i aria-hidden="true" style={{ backgroundColor: cue.color }} /> {cue.label}
            </small>
          )}
          {cue?.yellow && <small className="skill-reminder">Selection pending in sheet</small>}
          {locked && <small> · calculated</small>}
        </span>
        {locked ? (
          <output aria-label={label}>{String(data?.value ?? '') || '—'}</output>
        ) : data?.validation?.type === 'BOOLEAN' ? (
          <select
            aria-label={label}
            disabled={busy}
            value={String(current)}
            onChange={(e) =>
              stage(
                sheet,
                cell,
                e.target.value === ''
                  ? ''
                  : data.validation!.values.length
                    ? e.target.value
                    : e.target.value === 'true',
              )
            }
          >
            <option value="">Choose…</option>
            {(data.validation.values.length ? data.validation.values : ['true', 'false']).map(
              (option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ),
            )}
          </select>
        ) : type === 'marker' ? (
          <select
            aria-label={label}
            value={current === 0 || current === '' || current === false ? '0' : '1'}
            disabled={busy}
            onChange={(e) => stage(sheet, cell, Number(e.target.value))}
          >
            <option value="0">No</option>
            <option value="1">Yes</option>
          </select>
        ) : options.length ? (
          <select
            aria-label={label}
            disabled={busy}
            value={String(current)}
            onChange={(e) => stage(sheet, cell, e.target.value)}
          >
            <option value="">Choose…</option>
            {!options.includes(String(current)) && current !== '' && (
              <option>{String(current)}</option>
            )}
            {options.map((o) => (
              <option key={o}>{o}</option>
            ))}
          </select>
        ) : type === 'long' ? (
          <textarea
            aria-label={label}
            disabled={busy}
            value={String(current)}
            maxLength={50000}
            onChange={(e) => stage(sheet, cell, e.target.value)}
          />
        ) : (
          <input
            aria-label={label}
            disabled={busy}
            type={type === 'number' || typeof current === 'number' ? 'number' : 'text'}
            step="any"
            value={String(current)}
            maxLength={50000}
            onChange={(e) =>
              stage(
                sheet,
                cell,
                (type === 'number' || typeof current === 'number') && e.target.value !== ''
                  ? Number(e.target.value)
                  : e.target.value,
              )
            }
          />
        )}
        {(tab === 'Workbook' || draft) && (
          <small className="cell-location">{tab === 'Workbook' ? id : 'Unsaved'}</small>
        )}
        {data?.note && (
          <span className="field-info" tabIndex={0} aria-label={`${label} information`}>
            ⓘ
            <span role="tooltip" className="info-popover">
              {data.note}
            </span>
          </span>
        )}
      </label>
    )
  }
  const exportDraft = () => {
    const url = URL.createObjectURL(
      new Blob([JSON.stringify({ settings, book, edits, rules: ruleSettings }, null, 2)], {
        type: 'application/json',
      }),
    )
    const a = document.createElement('a')
    a.href = url
    a.download = 'punpun-sheet-backup.json'
    a.click()
    setTimeout(() => URL.revokeObjectURL(url), 1000)
  }
  const infoTab = book.sheets.find((s) => s.title === 'Class Info')
  const classOptions = [
    ...new Set(
      Object.entries(infoTab?.cells ?? {})
        .filter(([a, c]) => /^B\d+$/.test(a) && Number(a.slice(1)) >= 7 && c.value)
        .map(([, c]) => String(c.value)),
    ),
  ]
  const subclasses = Object.entries(infoTab?.cells ?? {})
    .filter(([a, c]) => /^B\d+$/.test(a) && c.value === className)
    .map(([a]) => String(infoTab?.cells['E' + a.slice(1)]?.value ?? ''))
    .filter((v) => v && v !== '-')
  const subclassOptions = [
    ...subclasses,
    ...(OFFICIAL_SUBCLASSES[className] ?? []).filter(
      (name) => !subclasses.some((s) => canonicalSubclass(className, s) === name),
    ),
  ]
  const allRows = book.sheets.find((s) => s.title === selectedTab)
  const facts = (sheetName: string, selected: string, columns: string[]) => {
    const source = book.sheets.find((s) => s.title === sheetName)
    const row = Object.entries(source?.cells ?? {})
      .find(([a, c]) => /^B\d+$/.test(a) && Number(a.slice(1)) >= 7 && c.value === selected)?.[0]
      .slice(1)
    if (!source || !row) return null
    return (
      <details className="creation-facts">
        <summary>
          {selected} · from {sheetName}
        </summary>
        <dl>
          {columns.map((col) => {
            const v = source.cells[col + row]?.value
            return v && v !== '-' ? (
              <div key={col}>
                <dt>{String(source.cells[col + '5']?.value ?? col)}</dt>
                <dd>{String(v)}</dd>
              </div>
            ) : null
          })}
        </dl>
      </details>
    )
  }
  const displayCells = Object.entries(allRows?.cells ?? {})
    .filter(
      ([a, c]) =>
        !c.formula?.toUpperCase().includes('IMAGE(') &&
        (!search || `${a} ${c.value} ${c.note ?? ''}`.toLowerCase().includes(search.toLowerCase())),
    )
    .sort(
      ([a], [b]) =>
        Number(a.replace(/\D/g, '')) - Number(b.replace(/\D/g, '')) || a.localeCompare(b),
    )
  return (
    <div className={`shell spreadsheet-shell ${collapsed ? 'sidebar-collapsed' : ''}`}>
      <aside className="sidebar" aria-label="Companion sidebar">
        <button
          className="sidebar-toggle"
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          aria-expanded={!collapsed}
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          onClick={() => setCollapsed(!collapsed)}
        >
          {collapsed ? <PanelLeftOpen size={20} /> : <PanelLeftClose size={20} />}
        </button>
        <div className="brand">
          <div className="brand-mark">
            <Swords size={25} />
          </div>
          <div>
            Punman’s<span>CHARACTER COMPANION</span>
          </div>
        </div>
        <div className="sidebar-caption">YOUR SPREADSHEET</div>
        <div className="character-button selected">
          <span className="avatar">{String(cellValue(book, 'v2.1', 'C6')).slice(0, 1) || 'P'}</span>
          <span>
            <strong>{String(cellValue(book, 'v2.1', 'C6')) || 'PunPun Character'}</strong>
            <small>{String(cellValue(book, 'v2.1', 'T5')) || 'Create your adventurer'}</small>
          </span>
        </div>
        <button
          className="new-character"
          aria-label={player ? 'Edit character' : 'Create / edit character'}
          title={player ? 'Edit character' : 'Create / edit character'}
          onClick={() => {
            setCreationStep(0)
            setWizard(true)
          }}
        >
          <UserPlus size={18} />
          <span>{player ? 'Edit character' : 'Create / edit character'}</span>
        </button>
        {!player && (
          <button
            className="new-character"
            aria-label="Share player link"
            title="Share player link"
            onClick={() => setPlayerLinks(true)}
          >
            <ExternalLink size={18} />
            <span>Share player link</span>
          </button>
        )}
        {player && (
          <button
            className="new-character"
            aria-label="Change spreadsheet"
            title="Change spreadsheet"
            disabled={busy}
            onClick={player.onChangeSheet}
          >
            <BookOpen size={18} />
            <span>Change spreadsheet</span>
          </button>
        )}
        {player && (
          <button
            className="new-character"
            aria-label="Sign out"
            title="Sign out"
            disabled={busy}
            onClick={player.onSignOut}
          >
            <ExternalLink size={18} />
            <span>Sign out</span>
          </button>
        )}
        <button
          className="new-character"
          aria-label="Connection settings"
          title="Connection settings"
          onClick={() => setSetup(true)}
        >
          <Settings size={18} />
          <span>Connection settings</span>
        </button>
        <button
          className="new-character"
          aria-label="Rules & overrides"
          title="Rules & overrides"
          onClick={() => setRulesOpen(true)}
        >
          <BookOpen size={18} />
          <span>Rules & overrides</span>
        </button>
        <nav className="sidebar-nav" aria-label="Quick navigation">
          {tabs.map(({ name, icon: Icon }) => {
            return (
              <button
                key={name}
                aria-label={name}
                title={name}
                aria-current={activeTab === name ? 'page' : undefined}
                onClick={() => setTab(name)}
              >
                <Icon size={18} />
                <span>{name}</span>
              </button>
            )
          })}
        </nav>
        <button
          className="theme-toggle"
          aria-label={dark ? 'Switch to light mode' : 'Switch to dark mode'}
          title={dark ? 'Switch to light mode' : 'Switch to dark mode'}
          onClick={() => setDark(!dark)}
        >
          {dark ? <Sun size={18} /> : <Moon size={18} />}
          <span>{dark ? 'Light mode' : 'Dark mode'}</span>
        </button>
        <div className="sidebar-bottom">
          <BookOpen />
          <p>
            Your sheet.
            <br />
            Your adventure.
          </p>
          <small>Rules and calculations from your workbook</small>
        </div>
      </aside>
      <main>
        <div className="topbar">
          <span>
            <Feather size={16} /> THE ADVENTURER’S COMPANION
          </span>
          <div className="toolbar">
            <button disabled={busy || !status.connected} onClick={() => void run(refresh)}>
              <RefreshCw size={15} /> Refresh
            </button>
            <button onClick={exportDraft}>Export backup</button>
            <button onClick={() => window.print()}>Print</button>
            <a
              className="sheet-link"
              href={(() => {
                try {
                  target()
                  return settings.url
                } catch {
                  return DEFAULT_SHEET_URL
                }
              })()}
              target="_blank"
              rel="noreferrer"
            >
              <ExternalLink size={15} /> Open sheet
            </a>
          </div>
        </div>
        <div className="notice sheet-status" role="status">
          <span>
            {live
              ? `Last refreshed ${book.fetchedAt ? new Date(book.fetchedAt).toLocaleTimeString() : '—'}`
              : 'Workbook preview · connect Google to load current values'}{' '}
            · {status.connected ? 'Connected' : 'Not signed in'}
          </span>
          <label>
            <input type="checkbox" checked={auto} onChange={(e) => setAuto(e.target.checked)} />{' '}
            Refresh every 30 seconds
          </label>
          {!status.connected && (
            <button onClick={() => setSetup(true)}>Connect Google Sheet</button>
          )}
        </div>
        {error && (
          <div className="notice error" role="alert">
            {error}
          </div>
        )}
        {notice && (
          <div className="notice" role="status">
            {notice}
            <button aria-label="Dismiss notice" onClick={() => setNotice('')}>
              ×
            </button>
          </div>
        )}
        {!main && (
          <div className="notice" role="alert">
            The v2.1 character tab is missing. Open Workbook to inspect the available tabs; no
            character cells will be guessed.
          </div>
        )}
        <header className="character-header">
          <div>
            <div className="eyebrow">
              CHARACTER SHEET <span>SPREADSHEET RULES</span>
            </div>
            <h1>{String(cellValue(book, 'v2.1', 'C6')) || 'Your adventure awaits'}</h1>
            <p>
              {[
                cellValue(book, 'v2.1', 'T7'),
                cellValue(book, 'v2.1', 'T5'),
                cellValue(book, 'v2.1', 'AJ11'),
              ]
                .filter(Boolean)
                .join(' · ') || 'A friendly view of PunPun_Character'}
            </p>
          </div>
          <div className="level-badge">
            <span>LEVEL</span>
            <strong>{String(cellValue(book, 'v2.1', 'AL6')) || '—'}</strong>
          </div>
        </header>
        <div className="sheet">
          {activeTab === 'Play' && (
            <>
              <div className="sheet-stats">
                {[
                  ['Armor class', 'R12'],
                  ['Initiative', 'V12'],
                  ['Speed', 'Z12'],
                  ['Maximum HP', 'U16'],
                  ['Proficiency', 'H14'],
                ].map(([label, cell]) => (
                  <div key={cell}>
                    <small>{label}</small>
                    <strong>{String(cellValue(book, 'v2.1', cell)) || '—'}</strong>
                  </div>
                ))}
              </div>
              <div className="play-vitals field-grid">
                {field('Current HP', 'R17', 'v2.1', 'number')}
                {field('Temporary HP', 'R21', 'v2.1', 'number')}
                {field('Inspiration', 'H11', 'v2.1', 'marker')}
                {field('Condition', 'U20')}
              </div>
              <AbilityGuide
                book={book}
                read={value}
                settings={ruleSettings}
                onSettings={() => setRulesOpen(true)}
              />
              <div className="panel-grid">
                <Panel title="Hit dice">
                  <div className="field-grid">
                    {field('Total hit dice', 'R25')}
                    {field('Hit dice remaining', 'R28')}
                  </div>
                </Panel>
                <Panel title="Death saves">
                  <div className="field-grid">
                    {[25, 26].flatMap((row) =>
                      ['Y', 'Z', 'AA'].map((col, i) =>
                        field(
                          `${row === 25 ? 'Success' : 'Failure'} ${i + 1}`,
                          col + row,
                          'v2.1',
                          'marker',
                        ),
                      ),
                    )}
                  </div>
                </Panel>
              </div>
              <Panel title="Attacks">
                <div className="sheet-entry-list">
                  {[32, 33, 34, 35, 36].map((row, i) => (
                    <div className="field-grid" key={row}>
                      {field(`Attack ${i + 1}`, `R${row}`)}
                      {field(`Attack ${i + 1} bonus`, `Y${row}`)}
                      {field(`Attack ${i + 1} damage`, `AC${row}`)}
                    </div>
                  ))}
                </div>
              </Panel>
            </>
          )}
          {activeTab === 'Character' && (
            <>
              <Panel title="Identity">
                <div className="field-grid">
                  {field('Character name', 'C6')}
                  {field('Classes and levels', 'T5')}
                  {field('Race', 'T7')}
                  {field('Background', 'AJ11')}
                  {field('Experience points', 'AE7', 'v2.1', 'number')}
                  {field('Player name', 'AE5')}
                  {field('Alignment', 'AJ28')}
                </div>
                <p className="hint">
                  Use {player ? 'Edit character' : 'Create / edit character'} for class guidance.
                  The sheet derives character level from XP.
                </p>
              </Panel>
              <Panel title="Ability scores">
                <p className="hint">
                  Enter base scores. The sheet applies racial and feature adjustments to calculate
                  effective scores.
                </p>
                <div className="field-grid">
                  {abilities.flatMap((a, i) => [
                    field(`${a} base`, 'C' + (16 + i * 5), 'v2.1', 'number'),
                    field(`${a} effective`, 'C' + (15 + i * 5)),
                  ])}
                </div>
              </Panel>
              <Panel title="Skills">
                <SheetSkills
                  book={book}
                  read={value}
                  settings={ruleSettings}
                  onSettings={() => setRulesOpen(true)}
                  field={(name, row) => field(name, 'H' + row, 'v2.1', 'skill')}
                  legend={
                    <SkillLegend
                      loaded={!!book.skillFormattingLoaded}
                      pending={changes.some(
                        (e) =>
                          e.tab === 'v2.1' &&
                          (/^H(2[5-9]|3\d|4[0-2])$/.test(e.address) ||
                            ['T5', 'T7', 'AJ11', 'AE7'].includes(e.address)),
                      )}
                    />
                  }
                />
              </Panel>
              <Panel title="Saving throws">
                <p className="hint">
                  Saving throw proficiency is normally derived by the workbook. Use overrides only
                  when needed.
                </p>
                <div className="field-grid">
                  {abilities.map((a, i) => field(`${a} save`, 'I' + (17 + i)))}
                </div>
              </Panel>
              <Panel title="Personality & proficiencies">
                <div className="field-grid">
                  {['Personality traits', 'Ideals', 'Bonds', 'Flaws'].flatMap((label, group) =>
                    Array.from({ length: 3 }, (_, line) =>
                      field(
                        `${label}${line ? ` line ${line + 1}` : ''}`,
                        `AE${12 + group * 4 + line}`,
                        'v2.1',
                        'long',
                      ),
                    ),
                  )}
                  {field('Other proficiencies', 'I53', 'v2.1', 'long')}
                  {field('Other speeds', 'I54')}
                </div>
              </Panel>
              <Panel title="Features & traits">
                <div className="field-grid">
                  {Array.from({ length: 26 }, (_, i) =>
                    field(`Feature / trait ${i + 1}`, 'C' + (59 + i)),
                  )}
                </div>
              </Panel>
            </>
          )}
          {activeTab === 'Spells' && (
            <SheetSpells
              book={book}
              value={value}
              field={field}
              busy={busy}
              stage={stage}
              rules={ruleSettings}
            />
          )}
          {activeTab === 'Inventory & Notes' && (
            <SheetInventory book={book} value={value} field={field} busy={busy} stage={stage} />
          )}
          {activeTab === 'Pugilist' && hasPugilist && (
            <PugilistPanel
              allowInstall={!player}
              book={book}
              field={field}
              value={value}
              stage={stage}
              busy={busy}
              hasDraft={(sheet, cell) => !!edits[keyOf(sheet, cell)]}
            />
          )}
          {activeTab === 'Workbook' && (
            <Panel title="Workbook explorer" subtitle="Includes DM reference tables">
              <div className="field-grid">
                <label className="field">
                  <span>Worksheet</span>
                  <select
                    aria-label="Worksheet"
                    value={selectedTab}
                    onChange={(e) => setSelectedTab(e.target.value)}
                  >
                    {book.sheets.map((s) => (
                      <option key={s.title}>{s.title}</option>
                    ))}
                  </select>
                </label>
                <label className="field">
                  <span>Search cells</span>
                  <input
                    aria-label="Search cells"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </label>
                <label className="field">
                  <span>Cell address</span>
                  <input
                    aria-label="Cell address"
                    value={address}
                    onChange={(e) => setAddress(e.target.value.toUpperCase())}
                  />
                </label>
              </div>
              {/^[A-Z]{1,2}[1-9]\d{0,2}$/.test(address) &&
                field('Selected cell', address, selectedTab)}
              <p className="hint">
                Formula cells are read only. Dropdowns and reference-table changes are read from the
                live workbook. Explorer covers A1:BC201 in each tab.
              </p>
              <div className="sheet-grid">
                <table>
                  <thead>
                    <tr>
                      <th>Cell</th>
                      <th>Sheet value</th>
                      <th>Type</th>
                    </tr>
                  </thead>
                  <tbody>
                    {displayCells.map(([a, c]) => (
                      <tr key={a}>
                        <td>
                          <button className="text-button" onClick={() => setAddress(a)}>
                            {a}
                          </button>
                        </td>
                        <td>{String(c.value).slice(0, 300) || '—'}</td>
                        <td>{c.formula ? 'Calculated' : 'Input / text'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Panel>
          )}
        </div>
        {changes.length > 0 && (
          <div className="draft-bar">
            <span>
              {changes.length} unsaved cell{changes.length === 1 ? '' : 's'}
              {collisions.length ? ` · ${collisions.length} conflicts` : ''}
            </span>
            <button disabled={busy} onClick={() => setReview(true)}>
              Review changes
            </button>
          </div>
        )}
        <footer>
          <span>{live ? 'Google Sheet is the source of truth' : 'Local workbook preview'}</span>
          <span>Drafts are saved on this device.</span>
        </footer>
        {!player && Offline && (
          <Suspense fallback={null}>
            <Offline busy={busy || changes.length > 0} label="Spreadsheet cache" />
          </Suspense>
        )}
      </main>
      {setup && (
        <Modal
          title="Connect your Google Sheet"
          onClose={() => {
            if (!busy) setSetup(false)
          }}
        >
          {error && <p role="alert">{error}</p>}
          <p>
            Connect once to read your character and your DM’s updates. Sign in again when Google
            access expires.
          </p>
          {!player && (
            <details open={!settings.clientId}>
              <summary>Google setup · required once</summary>
              <ol>
                <li>
                  Open{' '}
                  <a href="https://console.cloud.google.com/" target="_blank" rel="noreferrer">
                    Google Cloud Console
                  </a>{' '}
                  and create a project.
                </li>
                <li>
                  Enable Google Sheets API. Configure the OAuth audience as External / Testing and
                  add your email as a test user.
                </li>
                <li>
                  Create a Web application OAuth client. Add <code>{window.location.origin}</code>{' '}
                  as an authorized JavaScript origin.
                </li>
                <li>Paste the public client ID below. No client secret is needed.</li>
              </ol>
              <p>
                <a
                  href="https://developers.google.com/workspace/sheets/api/quickstart/js"
                  target="_blank"
                  rel="noreferrer"
                >
                  Google’s setup instructions
                </a>
              </p>
            </details>
          )}
          <fieldset disabled={busy}>
            {!player && (
              <div className="field-grid">
                <label className="field">
                  <span>Public OAuth client ID</span>
                  <input
                    aria-label="Public OAuth client ID"
                    value={settings.clientId}
                    onChange={(e) => setSettings({ ...settings, clientId: e.target.value.trim() })}
                  />
                </label>
                <label className="field">
                  <span>Spreadsheet URL</span>
                  <input
                    aria-label="Spreadsheet URL"
                    disabled={changes.length > 0}
                    value={settings.url}
                    onChange={(e) => {
                      setSettings({ ...settings, url: e.target.value.trim() })
                      setBook(initial)
                    }}
                  />
                </label>
              </div>
            )}
            <div className="actions">
              <button
                onClick={() =>
                  void run(async () => {
                    await loadIdentity()
                    await authorize(settings.clientId, true)
                    await refresh()
                    setSetup(false)
                  })
                }
              >
                Sign in with Google
              </button>
              <button
                onClick={() => {
                  if (player) player.onSignOut()
                  else {
                    disconnect()
                    setStatus(connectionStatus())
                  }
                }}
              >
                Disconnect
              </button>
            </div>
          </fieldset>
          <p className="hint">
            Google requests Sheets read/write access. Only your selected workbook is used. Tokens
            stay in memory;{' '}
            {player
              ? 'drafts are stored separately for your character on this device. Your sheet is loaded after sign-in.'
              : 'drafts and the last read snapshot are stored on this device.'}
          </p>
        </Modal>
      )}
      {wizard && (
        <Modal
          title={
            player ? 'Edit your spreadsheet character' : 'Create / edit your spreadsheet character'
          }
          onClose={() => setWizard(false)}
        >
          <nav className="creation-steps" aria-label="Character creation steps">
            {['Identity', 'Class', 'Scores', 'Skills'].map((name, i) => (
              <button
                key={name}
                aria-current={creationStep === i ? 'step' : undefined}
                className={creationStep === i ? 'active' : ''}
                onClick={() => setCreationStep(i)}
              >
                {i + 1}. {name}
              </button>
            ))}
          </nav>
          {creationStep === 0 && (
            <Panel title="Identity">
              <div className="field-grid">
                {field('Character name', 'C6')}
                {field('Race', 'T7')}
                {field('Background', 'AJ11')}
                {field('Alignment', 'AJ28')}
              </div>
              {facts('Race Info', String(value('v2.1', 'T7')), [
                'F',
                'K',
                'N',
                'P',
                'X',
                'AE',
                'AJ',
              ])}
            </Panel>
          )}
          {creationStep === 1 && (
            <Panel title="Class & level">
              <div className="field-grid">
                <label className="field">
                  <span>Class</span>
                  <select
                    aria-label="Creation class"
                    value={className}
                    onChange={(e) => {
                      setClassName(e.target.value)
                      setSubclass('')
                    }}
                  >
                    <option value="">Choose…</option>
                    {classOptions.map((c) => (
                      <option key={c}>{c}</option>
                    ))}
                    {Object.keys(OFFICIAL_SUBCLASSES)
                      .filter((c) => !classOptions.includes(c))
                      .map((c) => (
                        <option key={c} disabled value={c}>
                          {c} · Add to sheet
                        </option>
                      ))}
                  </select>
                </label>
                <label className="field">
                  <span>Subclass (when eligible)</span>
                  <select
                    aria-label="Creation subclass"
                    value={subclass}
                    onChange={(e) => setSubclass(e.target.value)}
                  >
                    <option value="">None yet</option>
                    {subclassOptions.map((c) => (
                      <option
                        key={c}
                        value={c}
                        disabled={!subclasses.includes(c) || classLevel < subclassUnlock(className)}
                      >
                        {c}
                        {!subclasses.includes(c)
                          ? ' · Add to sheet'
                          : classLevel < subclassUnlock(className)
                            ? ` · Level ${subclassUnlock(className)}`
                            : ''}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="field">
                  <span>Class level</span>
                  <input
                    aria-label="Creation class level"
                    type="number"
                    min="1"
                    max="20"
                    value={classLevel}
                    onChange={(e) => setClassLevel(Number(e.target.value))}
                  />
                </label>
              </div>
              {!player &&
                (subclassOptions.some((s) => !subclasses.includes(s)) ||
                  Object.keys(OFFICIAL_SUBCLASSES).some((c) => !classOptions.includes(c))) && (
                  <details className="creation-facts">
                    <summary>Add missing official classes & subclasses to this sheet</summary>
                    <p>
                      The rule pack has these definitions; character creation uses your sheet’s
                      Class Info table. Install the reference rows in Extensions → Apps Script, run
                      installOfficial2014, then refresh. It backs up the workbook and extends only
                      Class Info references needed for the larger catalog.
                    </p>
                    <a href="/Install_Official2014.gs" download>
                      Download official 2014 installer
                    </a>
                  </details>
                )}
              <button
                disabled={
                  !className ||
                  !Number.isInteger(classLevel) ||
                  classLevel < 1 ||
                  classLevel > 20 ||
                  (!!subclass && classLevel < subclassUnlock(className))
                }
                onClick={() => {
                  stage('v2.1', 'T5', `${className} ${classLevel}${subclass ? ' ' + subclass : ''}`)
                  const xp = xpForLevel(book, classLevel)
                  if (xp !== undefined) stage('v2.1', 'AE7', xp)
                }}
              >
                Use selected class
              </button>
              {field('Classes and levels', 'T5')}
              {field('Experience points', 'AE7', 'v2.1', 'number')}
              {facts('Class Info', className, ['K', 'Q', 'X', 'AB', 'AG', 'AJ'])}
            </Panel>
          )}
          {creationStep === 2 && (
            <Panel title="Base ability scores">
              <button
                onClick={() =>
                  [15, 14, 13, 12, 10, 8].forEach((n, i) => stage('v2.1', 'C' + (16 + i * 5), n))
                }
              >
                Use standard array in displayed order
              </button>
              <div className="field-grid">
                {abilities.map((a, i) => field(`${a} base`, 'C' + (16 + i * 5), 'v2.1', 'number'))}
              </div>
            </Panel>
          )}
          {creationStep === 3 && (
            <Panel title="Skills">
              <SheetSkills
                book={book}
                read={value}
                settings={ruleSettings}
                onSettings={() => setRulesOpen(true)}
                field={(name, row) => field(name, 'H' + row, 'v2.1', 'skill')}
                legend={
                  <SkillLegend
                    loaded={!!book.skillFormattingLoaded}
                    pending={changes.some(
                      (e) =>
                        e.tab === 'v2.1' &&
                        (/^H(2[5-9]|3\d|4[0-2])$/.test(e.address) ||
                          ['T5', 'T7', 'AJ11', 'AE7'].includes(e.address)),
                    )}
                  />
                }
              />
            </Panel>
          )}
          <div className="actions creation-actions">
            <button disabled={creationStep === 0} onClick={() => setCreationStep(creationStep - 1)}>
              Back
            </button>
            {creationStep < 3 && (
              <button onClick={() => setCreationStep(creationStep + 1)}>Next</button>
            )}
            <button
              className="primary"
              onClick={() => {
                setWizard(false)
                setReview(true)
              }}
            >
              Review character changes
            </button>
          </div>
        </Modal>
      )}
      {playerLinks && !player && <PlayerLinks onClose={() => setPlayerLinks(false)} />}
      {rulesOpen && (
        <RulesDialog
          book={book}
          read={value}
          settings={ruleSettings}
          onClose={() => setRulesOpen(false)}
          onChange={(rules) => setRuleProfiles((current) => ({ ...current, [profileKey]: rules }))}
        />
      )}
      {review && (
        <Modal
          title="Review spreadsheet changes"
          onClose={() => {
            if (!busy) setReview(false)
          }}
        >
          {error && <p role="alert">{error}</p>}
          <p>Only these cells will be saved. Formula cells are always read only.</p>
          {!live && (
            <p role="alert">
              Connect and refresh the live sheet before saving. Drafts made from the template may
              need conflict resolution.
            </p>
          )}
          <div className="sheet-grid">
            <table>
              <thead>
                <tr>
                  <th>Cell</th>
                  <th>When edited</th>
                  <th>Current sheet</th>
                  <th>Your draft</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {changes.map((e) => {
                  const clash = collisions.some(
                    (c) => keyOf(c.tab, c.address) === keyOf(e.tab, e.address),
                  )
                  return (
                    <tr key={keyOf(e.tab, e.address)} className={clash ? 'conflict-row' : ''}>
                      <td>
                        {qualified(e.tab, e.address)}
                        {clash ? ' · conflict' : ''}
                      </td>
                      <td>{String(e.before) || '(blank)'}</td>
                      <td>{String(cellValue(book, e.tab, e.address)) || '(blank)'}</td>
                      <td>{String(e.value) || '(clear)'}</td>
                      <td>
                        <button disabled={busy} onClick={() => discard(e)}>
                          Use sheet value
                        </button>
                        {clash &&
                          editable(
                            book.sheets.find((s) => s.title === e.tab) ?? {
                              title: e.tab,
                              cells: {},
                            },
                            e.address,
                          ) && (
                            <button
                              disabled={busy}
                              onClick={() =>
                                setEdits((current) => ({
                                  ...current,
                                  [keyOf(e.tab, e.address)]: {
                                    ...e,
                                    before: cellValue(book, e.tab, e.address),
                                  },
                                }))
                              }
                            >
                              Keep my edit
                            </button>
                          )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          <div className="actions">
            <button disabled={busy || !status.connected} onClick={() => void run(refresh)}>
              Refresh before saving
            </button>
            <button
              className="primary"
              disabled={busy || !live || !status.write || !changes.length || !!collisions.length}
              onClick={() =>
                void run(async () => {
                  const next = await writeEdits(target().id, changes, (fresh, pending) =>
                    validateSkillDraft(fresh, pending, ruleSettings),
                  )
                  accept(next)
                  setEdits({})
                  setReview(false)
                  setNotice('Changes saved to the spreadsheet. Calculated values refreshed.')
                })
              }
            >
              {busy ? 'Saving…' : 'Save to spreadsheet'}
            </button>
            <button onClick={exportDraft}>Export draft backup</button>
          </div>
          <p className="hint">
            Saving checks the edited cells again for DM changes. Google Sheets does not provide an
            atomic compare-and-save for this request; avoid simultaneous edits to the same cells.
          </p>
        </Modal>
      )}
    </div>
  )
}

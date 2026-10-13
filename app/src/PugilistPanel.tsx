import { useState } from 'react'
import type { ReactNode } from 'react'
import type { Workbook, Value } from './sheetModel'
import { pugilistInstalled, pugilistData } from './pugilist'
import { Panel } from './components'
export default function PugilistPanel({
  book,
  field,
  value,
  stage,
  busy,
  hasDraft,
  allowInstall = true,
}: {
  book: Workbook
  field: (
    label: string,
    cell: string,
    sheet?: string,
    type?: 'text' | 'number' | 'marker' | 'skill' | 'long',
  ) => ReactNode
  value: (sheet: string, cell: string) => Value
  stage: (sheet: string, cell: string, value: Value) => void
  busy: boolean
  hasDraft: (sheet: string, cell: string) => boolean
  allowInstall?: boolean
}) {
  const [cost, setCost] = useState(1),
    [message, setMessage] = useState('')
  const sheet = 'Pugilist'
  const number = (address: string) => Number(value(sheet, address))
  const flag = (address: string) =>
    value(sheet, address) === true ||
    value(sheet, address) === 1 ||
    String(value(sheet, address)).toLowerCase() === 'true'
  const level = number('B2'),
    club = String(value(sheet, 'B3')),
    remaining = number('B5'),
    maximum = number('B4')
  const canAct =
    level > 0 &&
    !hasDraft('v2.1', 'T5') &&
    !hasDraft('v2.1', 'AE7') &&
    ![
      'C16',
      'C21',
      'C26',
      'C31',
      'C36',
      'C41',
      'D16',
      'D21',
      'D26',
      'D31',
      'D36',
      'D41',
      ...Array.from({ length: 12 }, (_, i) => `AC${45 + i}`),
    ].some((cell) => hasDraft('v2.1', cell)) &&
    !hasDraft(sheet, 'B25')
  const set = (address: string, next: Value) => stage(sheet, address, next)
  const f = (label: string, address: string, type: 'text' | 'number' = 'text') =>
    field(label, address, sheet, type)
  const recover = (kind: 'short' | 'long') => {
    set('B5', maximum)
    if (level >= 3) set('B12', true)
    if (club === 'Hand of Dread' && level >= 3) set('B17', true)
    if (club === 'Piss & Vinegar' && level >= 6) ['B19', 'B20', 'B21'].forEach((a) => set(a, true))
    if (kind === 'long') {
      if (level >= 9) set('B13', true)
      if (level >= 18) set('B14', true)
      if (club === 'Arena Royale') {
        set('B15', number('B16'))
        if (level >= 6) set('B22', true)
        if (level >= 17) set('B23', true)
      }
      if (club === 'Hand of Dread' && level >= 17) set('B18', true)
      if (club === 'Piss & Vinegar' && level >= 17) set('B24', true)
    }
    setMessage(
      `${kind === 'short' ? 'Short' : 'Long'}-rest resource recovery staged. Review and save to apply it. HP, exhaustion and hit dice are separate.`,
    )
  }
  if (!pugilistInstalled(book) && !allowInstall)
    return (
      <Panel title="Pugilist">
        <p>Pugilist is not enabled in this character’s sheet. Ask your DM to add it if needed.</p>
      </Panel>
    )
  if (!pugilistInstalled(book))
    return (
      <Panel title="Add Pugilist to your spreadsheet">
        <p>The connected sheet does not have the Pugilist additions yet.</p>
        <ol>
          <li>Open your Google sheet, then Extensions → Apps Script.</li>
          <li>Add a new script file and paste the downloaded installer.</li>
          <li>
            Run <code>installPugilist</code>. It backs up the sheet and adds Pugilist while keeping
            the artwork.
          </li>
          <li>Refresh this app when installation finishes.</li>
        </ol>
        <a href="/Install_Pugilist.gs" download>
          Download Pugilist installer
        </a>
        <p className="hint">
          The installer adds reference rows and a Pugilist tab; it leaves your character’s class
          unchanged. Your DM can continue editing the same sheet.
        </p>
      </Panel>
    )
  return (
    <>
      {book.source === 'local workbook' && (
        <div className="notice">
          Preview of the Pugilist additions. Run the installer in Google Sheets for live
          calculations.{' '}
          <a href="/Install_Pugilist.gs" download>
            Download installer
          </a>
        </div>
      )}
      <Panel title="Pugilist" subtitle="Values calculated by your sheet">
        <div className="field-grid">
          {f('Pugilist level', 'B2')}
          {f('Fight Club', 'B3')}
          {f('Fisticuffs die', 'B6')}
          {f('Fisticuffs damage', 'B10')}
          {f('Strength attack bonus', 'B9')}
          {f('Iron Chin eligible', 'B7')}
          {f('Iron Chin AC', 'B8')}
          {f('DEX save proficiency', 'B36')}
          {f('Physical save advantage', 'B35')}
        </div>
        <p className="hint">
          Select Pugilist and a Fight Club through Create / edit character. Save class and level
          changes before using resources. Armor and shields come from your equipped item cells.
        </p>
        <a href={pugilistData.source} target="_blank" rel="noreferrer">
          Open your Pugilist rules reference
        </a>
      </Panel>
      {message && <p role="status">{message}</p>}
      <Panel title="Moxie">
        <div className="field-grid">
          {f('Moxie maximum', 'B4')}
          {f('Moxie remaining', 'B5', 'number')}
          <label className="field">
            <span>Moxie cost</span>
            <input
              aria-label="Moxie cost"
              type="number"
              min="1"
              max={Math.max(1, maximum)}
              step="1"
              value={cost}
              onChange={(e) => setCost(Number(e.target.value))}
            />
          </label>
        </div>
        <div className="actions">
          <button
            disabled={
              busy ||
              !canAct ||
              level < 2 ||
              !Number.isInteger(cost) ||
              cost < 1 ||
              cost > remaining
            }
            onClick={() => set('B5', remaining - cost)}
          >
            Spend Moxie
          </button>
          <button
            disabled={busy || !canAct || level < 2 || remaining >= maximum}
            onClick={() => set('B5', Math.min(maximum, remaining + 1))}
          >
            Regain 1 Moxie
          </button>
          <button disabled={busy || !canAct || level < 2} onClick={() => recover('short')}>
            Recover short-rest resources
          </button>
          <button disabled={busy || !canAct || level < 2} onClick={() => recover('long')}>
            Recover long-rest resources
          </button>
        </div>
      </Panel>
      <Panel title="Class ability trackers">
        <div className="field-grid">
          {f('Pugilist exhaustion', 'B11', 'number')}
          {level >= 3 && f('Bloodied But Unbowed available', 'B12')}
          {level >= 3 && f('Bloodied temporary HP', 'B27')}
          {level >= 9 && f('Down But Not Out available', 'B13')}
          {level >= 18 && f('Fighting Spirit available', 'B14')}
          {level >= 18 && f('Fighting Spirit HP recovery', 'B31')}
          {level >= 18 && f('Fighting Spirit Moxie recovery', 'B32')}
        </div>
        <div className="actions">
          <button
            disabled={
              busy ||
              !canAct ||
              level < 3 ||
              !flag('B12') ||
              Number(value('v2.1', 'R17')) < 1 ||
              Number(value('v2.1', 'R17')) > Number(value('v2.1', 'U16')) / 2 ||
              !Number.isFinite(number('B27'))
            }
            onClick={() => {
              set('B12', false)
              set('B5', maximum)
              stage('v2.1', 'R21', Math.max(Number(value('v2.1', 'R21')) || 0, number('B27')))
            }}
          >
            Use Bloodied But Unbowed
          </button>
          <button
            disabled={
              busy ||
              !canAct ||
              level < 18 ||
              !flag('B14') ||
              number('B11') > 4 ||
              Number(value('v2.1', 'R17')) !== 0 ||
              !Number.isFinite(number('B31'))
            }
            onClick={() => {
              set('B14', false)
              set('B11', number('B11') + 1)
              set('B5', Math.min(maximum, remaining + number('B32')))
              stage('v2.1', 'R17', number('B31'))
            }}
          >
            Use Fighting Spirit
          </button>
        </div>
        <p className="hint">
          Use reaction and rest abilities only when their requirements are met. These controls
          prepare cell edits; they do not apply attacks, resistance or condition effects
          automatically.
        </p>
      </Panel>
      <Panel title="Brace Up">
        <div className="field-grid">
          {f('Brace Up die roll', 'B29', 'number')}
          {f('Brace Up bonus', 'B28')}
          {f('Brace Up temporary HP', 'B30')}
        </div>
        <button
          disabled={
            busy ||
            !canAct ||
            level < 2 ||
            remaining < 1 ||
            hasDraft(sheet, 'B29') ||
            !Number.isFinite(number('B30'))
          }
          onClick={() => {
            set('B5', remaining - 1)
            stage('v2.1', 'R21', Math.max(Number(value('v2.1', 'R21')) || 0, number('B30')))
          }}
        >
          Apply Brace Up
        </button>
        <p className="hint">
          Enter your Fisticuffs die roll and save it first. The sheet calculates temporary HP; Apply
          Brace Up then stages the Moxie cost and temporary HP.
        </p>
      </Panel>
      {level >= 3 && club && club !== '-' && (
        <Panel title={`${club} trackers`}>
          <div className="field-grid">
            {club === 'Arena Royale' && (
              <>
                {f('Persona points maximum', 'B16')}
                {f('Persona points remaining', 'B15', 'number')}
                {level >= 6 && f('Work the Crowd available', 'B22')}
                {level >= 11 && f('High Flyer speed bonus', 'B34')}
                {level >= 17 && f('Signature Move available', 'B23')}
                {f('Arena save DC', 'B38')}
              </>
            )}
            {club === 'Hand of Dread' && (
              <>
                {f('Dread Hand available', 'B17')}
                {level >= 17 && f('Fountain of Viscera available', 'B18')}
                {f('Dread save DC', 'B38')}
              </>
            )}
            {club === 'Piss & Vinegar' && (
              <>
                {f('Piss & Vinegar save DC', 'B39')}
                {level >= 6 && (
                  <>
                    {f('Heelstomper available', 'B19')}
                    {f('Low Blow available', 'B20')}
                    {f('Pocket Sand available', 'B21')}
                  </>
                )}
                {level >= 17 && f('The Uncouth Art available', 'B24')}
              </>
            )}
            {club === 'Bloodhound Bruisers' && f('Familiar settlement', 'B37')}
          </div>
          <p className="hint">
            Other Fight Club effects, companion statistics and conditional bonuses use the rules
            reference and your normal sheet cells. Signature Move recovery on a miss is manual.
          </p>
        </Panel>
      )}
      {level >= 20 && (
        <Panel title="Peak Physical Condition">
          <div className="field-grid">
            {f('Apply capstone score increases', 'B25')}
            {f('Long-rest exhaustion recovery', 'B33')}
          </div>
          <p className="hint">
            Enable score increases only if you have not already added them manually. Record hit-die
            and exhaustion recovery separately after an eligible long rest.
          </p>
        </Panel>
      )}
      <Panel title="Equipped items">
        <div className="field-grid">
          {Array.from({ length: 12 }, (_, i) => field(`Equipped item ${i + 1}`, `AC${45 + i}`))}
        </div>
        <p className="hint">
          Save equipment changes to refresh Iron Chin and Fisticuffs eligibility.
        </p>
      </Panel>
    </>
  )
}

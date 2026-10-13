import type { Reader, RuleSettings } from './companionRules'
import type { Workbook } from './sheetModel'
import { castingProfiles } from './castingRules'
export default function CastingSummary({
  book,
  read,
  settings,
}: {
  book: Workbook
  read: Reader
  settings?: RuleSettings
}) {
  const profiles = castingProfiles(book, read, settings)
  if (!profiles.length) return null
  return (
    <div className="casting-profiles">
      {profiles.map((p) => (
        <div className="casting-profile" key={p.name}>
          <strong>
            {p.name} {p.level}
            {p.subclass ? ` · ${p.subclass}` : ''}
          </strong>
          <div className="casting-counts">
            <span>{p.ability} casting</span>
            <span>Spell level ≤{p.maxLevel}</span>
            <span>{p.cantrips} class cantrips</span>
            {p.known !== null && <span>{p.known} known spell choices</span>}
            {p.prepared !== null && (
              <span>
                Prepare {p.prepared}
                {p.name === 'Wizard' ? ' from your spellbook' : ''}
              </span>
            )}
            {p.arcanum > 0 && (
              <span>
                {p.arcanum} separate Mystic Arcanum choice{p.arcanum > 1 ? 's' : ''}
              </span>
            )}
          </div>
          {p.grants.length > 0 && (
            <details>
              <summary>
                {p.grants.length} {p.grants[0].mode.toLowerCase()} spells
              </summary>
              <p>{p.grants.map((g) => g.name).join(' · ')}</p>
              <p className="hint">
                {p.grants[0].mode === 'Always prepared'
                  ? 'These do not use your preparation allowance.'
                  : p.grants[0].mode === 'Always known'
                    ? 'These are additional known spells outside your normal allowance.'
                    : 'These are extra options when learning a spell; they are not automatically known.'}
              </p>
            </details>
          )}
        </div>
      ))}
      <details className="coverage-note">
        <summary>How these limits work</summary>
        <p>
          Counts use each individual 2014 class level. Multiclass slot totals come from the
          spreadsheet; a higher shared slot does not unlock higher-level spells for a low-level
          class. Feats, racial spells, Magical Secrets and DM grants may add access. A shared sheet
          spell list does not identify which class learned each spell, so these counts guide
          selection rather than blocking manual entries.
        </p>
      </details>
    </div>
  )
}

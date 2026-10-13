import type { SpellDefinition } from './legacySpells'
export default function SpellReference({ spell }: { spell: SpellDefinition }) {
  return (
    <div className="spell-reference">
      <div className="ability-detail-meta">
        <span>
          {spell.level === 0 ? 'Cantrip' : `Level ${spell.level}`} · {spell.school}
        </span>
        {spell.ritual && <span>Ritual</span>}
        {spell.concentration && <span>Concentration</span>}
      </div>
      <dl className="spell-metadata">
        {[
          ['Casting time', spell.castingTime],
          ['Range', spell.range],
          ['Components', spell.components],
          ['Duration', spell.duration],
          ['Class lists', spell.classes.join(', ')],
        ].map(([label, value]) => (
          <div key={label}>
            <dt>{label}</dt>
            <dd>{value}</dd>
          </div>
        ))}
      </dl>
      <p className="ability-full-text">{spell.description}</p>
      <a
        href={
          spell.url ??
          `https://media.wizards.com/2023/downloads/dnd/SRD_CC_v5.1.pdf#page=${spell.page}`
        }
        target="_blank"
        rel="noreferrer"
      >
        {spell.source}
        {spell.page ? ` · page ${spell.page}` : ''}
      </a>
    </div>
  )
}

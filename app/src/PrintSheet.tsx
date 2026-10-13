import type { Character } from './character'
import {
  abilities,
  skills,
  mod,
  proficiency,
  signed,
  skillBonus,
  saveBonus,
  maxHP,
} from './character'
export default function PrintSheet({ c }: { c: Character }) {
  return (
    <article className="print-sheet">
      <h1>{c.name}</h1>
      <p>
        {c.species} · {c.background} ·{' '}
        {c.classes
          .map((x) => `${x.name} ${x.level}${x.subclass ? ` (${x.subclass})` : ''}`)
          .join(' / ')}
      </p>
      <p>
        Level {c.level} · XP {c.xp} · {c.size} · {c.alignment} · {c.campaign}
      </p>
      <h2>Combat</h2>
      <p>
        Shield equipped: {c.shieldEquipped ? 'Yes' : 'No'} · Last applied armor formula:{' '}
        {c.armorChoice}
      </p>
      <p>
        AC {c.ac} · HP {c.hp}/{maxHP(c)} · Temporary HP {c.tempHp} · Initiative{' '}
        {signed(mod(c, 'Dexterity') + c.bonuses.initiative - c.exhaustion * 2)} · Speed{' '}
        {Math.max(0, c.speed - c.exhaustion * 5)} ft · Proficiency {signed(proficiency(c.level))} ·
        Passive Perception {10 + skillBonus(c, 'Perception', 'Wisdom') + c.bonuses.perception}
      </p>
      <p>
        Heroic Inspiration: {c.inspiration ? 'Yes' : 'No'} · Exhaustion {c.exhaustion} · Conditions:{' '}
        {c.conditions.join(', ') || 'None'} · Death saves {c.successes} successes / {c.failures}{' '}
        failures {c.stable ? '· Stable' : ''} {c.dead ? '· Dead' : ''}
      </p>
      <h2>Abilities & skills</h2>
      <table>
        <thead>
          <tr>
            <th>Ability</th>
            <th>Score</th>
            <th>Modifier</th>
            <th>Save</th>
          </tr>
        </thead>
        <tbody>
          {abilities.map((a) => (
            <tr key={a}>
              <td>{a}</td>
              <td>{c.scores[a] - c.scoreReductions[a]}</td>
              <td>{signed(mod(c, a))}</td>
              <td>
                {signed(saveBonus(c, a))}
                {c.saves.includes(a) ? ' (P)' : ''}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <p>{skills.map(([s, a]) => `${s}: ${signed(skillBonus(c, s, a))}`).join(' · ')}</p>
      <h2>Attacks & resources</h2>
      {c.attackEntries.map((a) => (
        <p key={a.id}>
          {a.name}:{' '}
          {signed(
            mod(c, a.ability) +
              (a.proficient ? proficiency(c.level) : 0) +
              a.bonus -
              c.exhaustion * 2,
          )}{' '}
          to hit · {a.dice} {signed(a.damageBonus + (a.addAbility ? mod(c, a.ability) : 0))}{' '}
          {a.type} · {a.mastery} · {a.notes}
        </p>
      ))}
      <pre>{c.attacks}</pre>
      <p>{c.hitDice.map((d) => `d${d.die}: ${d.total - d.spent}/${d.total}`).join(' · ')}</p>
      {c.resources.map((r) => (
        <p key={r.id}>
          {r.name}: {r.remaining}/{r.total} · {r.recharge} rest · {r.notes}
        </p>
      ))}
      <h2>Spellcasting</h2>
      <p>
        {c.casting} · Save DC {8 + proficiency(c.level) + mod(c, c.casting) + c.bonuses.spellDC} ·
        Attack{' '}
        {signed(
          proficiency(c.level) + mod(c, c.casting) + c.bonuses.spellAttack - c.exhaustion * 2,
        )}{' '}
        · Concentration: {c.concentration || 'None'}
      </p>
      <p>
        {c.slots
          .map((s, i) => (s.total ? `Level ${i + 1}: ${s.total - s.spent}/${s.total}` : ''))
          .filter(Boolean)
          .join(' · ')}{' '}
        · Pact Magic level {c.pact.level}: {c.pact.total - c.pact.spent}/{c.pact.total}
      </p>
      {c.spellEntries.map((s) => (
        <div className="print-spell" key={s.id}>
          <h3>
            {s.name} · {s.level === 0 ? 'Cantrip' : `Level ${s.level}`}{' '}
            {s.prepared ? '· Prepared' : ''}
          </h3>
          <p>
            {s.castingTime} · {s.range} · {s.duration} · {s.components} {s.ritual ? '· Ritual' : ''}
          </p>
          <p>{s.materials}</p>
          <pre>{s.description}</pre>
        </div>
      ))}
      <pre>{c.spells}</pre>
      <h2>Inventory & notes</h2>
      <p>
        {Object.entries(c.wallet)
          .map(([k, v]) => `${v} ${k.toUpperCase()}`)
          .join(' · ')}
      </p>
      {c.items.map((i) => (
        <p key={i.id}>
          {i.quantity} × {i.name} · {i.weight} lb. each {i.equipped ? '· Equipped' : ''}{' '}
          {i.attuned ? '· Attuned' : ''} · {i.notes}
        </p>
      ))}
      <pre>{c.inventory}</pre>
      <pre>{c.attunement}</pre>
      <h2>Features & story</h2>
      <p>Languages: {c.languages}</p>
      <p>Training: {c.training}</p>
      <pre>{c.features}</pre>
      <p>{c.appearance}</p>
      <pre>{c.notes}</pre>
      <p className="print-attribution">
        This work includes material from the System Reference Document 5.2.1 (“SRD 5.2.1”) by
        Wizards of the Coast LLC, available at https://www.dndbeyond.com/srd. The SRD 5.2.1 is
        licensed under the Creative Commons Attribution 4.0 International License, available at
        https://creativecommons.org/licenses/by/4.0/legalcode. Material has been reformatted and
        adapted.
      </p>
    </article>
  )
}

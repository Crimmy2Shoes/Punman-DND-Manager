import legacy from './data/legacy-abilities.json' with { type: 'json' }
import invocations from './data/legacy-invocations.json' with { type: 'json' }
import type { Ability, Economy, Reader, RuleSettings } from './companionRules'
import { characterClasses } from './companionRules.ts'
import { canonicalSubclass } from './phbSubclassRules.ts'
import type { Workbook } from './sheetModel'
import { listedSpells, SPELLS_2014, spellEconomy } from './legacySpells.ts'
import { expansionFeatureGroups } from './expansionChoices.ts'
export type FeatureOption = Ability & { id: string; eligible: boolean; prerequisite?: string }
export type FeatureGroup = { id: string; label: string; limit: number; options: FeatureOption[] }
const selectedIds = (s: RuleSettings) => s.selections ?? []
type Row = [string, Economy, string, string?, number?]
export function featureGroups(
  book: Workbook,
  read: Reader,
  settings: RuleSettings,
): FeatureGroup[] {
  const groups: FeatureGroup[] = []
  for (const c of characterClasses(book, read)) {
    groups.push(...expansionFeatureGroups(c, settings))
    const sub = canonicalSubclass(c.name, c.subclass),
      level = c.level
    const add = (
      key: string,
      label: string,
      limit: number,
      rows: Row[],
      page?: number,
      url?: string,
    ) => {
      if (!limit) return
      const id = `${c.name}:${key}`
      groups.push({
        id,
        label: `${c.name} · ${label}`,
        limit,
        options: rows.map(([name, economy, detail, cost, unlock]) => ({
          id: `${id}:${name}`,
          name,
          economy,
          detail,
          cost,
          level: unlock ?? level,
          className: c.name,
          source: url ? 'PHB 2014 · mechanical summary' : 'SRD 5.1',
          page,
          url,
          eligible: !unlock || level >= unlock,
        })),
      })
    }
    if (
      (c.name === 'Fighter' && level >= 1) ||
      (['Paladin', 'Ranger'].includes(c.name) && level >= 2)
    ) {
      const styles: Row[] = [
        ['Archery', 'Passive', '+2 to ranged weapon attack rolls.'],
        ['Defense', 'Passive', '+1 AC while wearing armor.'],
        [
          'Dueling',
          'Passive',
          '+2 damage while wielding a melee weapon in one hand and no other weapons. A shield is allowed.',
        ],
        [
          'Great Weapon Fighting',
          'Passive',
          'Reroll 1 or 2 on a damage die for your melee attack with a two-handed/versatile weapon wielded in two hands; use new result.',
        ],
        [
          'Protection',
          'Reaction',
          'When a visible creature attacks someone other than you within 5 feet of you, impose disadvantage on the attack. Requires wielding a shield.',
        ],
        [
          'Two-Weapon Fighting',
          'Passive',
          'Add ability modifier to damage of your two-weapon fighting bonus attack.',
        ],
      ]
      add(
        'style',
        'Fighting Style',
        c.name === 'Fighter' && sub === 'Champion' && level >= 10 ? 2 : 1,
        styles.filter(
          (s) =>
            c.name === 'Fighter' ||
            (c.name === 'Paladin'
              ? !['Archery', 'Two-Weapon Fighting'].includes(s[0])
              : !['Great Weapon Fighting', 'Protection'].includes(s[0])),
        ),
        c.name === 'Fighter' ? 24 : c.name === 'Paladin' ? 31 : 35,
      )
    }
    if (c.name === 'Sorcerer' && level >= 3) {
      const parent = legacy.find((a) => a.className === 'Sorcerer' && a.name === 'Metamagic')!
      const names = [
        'Careful Spell',
        'Distant Spell',
        'Empowered Spell',
        'Extended Spell',
        'Heightened Spell',
        'Quickened Spell',
        'Subtle Spell',
        'Twinned Spell',
      ]
      const rows: Row[] = names.map((name, i) => {
        const start = parent.detail.indexOf(name) + name.length,
          end = i === names.length - 1 ? parent.detail.length : parent.detail.indexOf(names[i + 1])
        return [
          name,
          name === 'Quickened Spell' ? 'Bonus action' : 'Passive',
          parent.detail.slice(start, end).trim(),
        ]
      })
      add('metamagic', 'Metamagic', level >= 17 ? 4 : level >= 10 ? 3 : 2, rows, parent.page)
    }
    if (c.name === 'Druid' && sub === 'Circle of the Land' && level >= 2)
      add(
        'land',
        'Circle land',
        1,
        ['Arctic', 'Coast', 'Desert', 'Forest', 'Grassland', 'Mountain', 'Swamp', 'Underdark'].map(
          (name) => [
            name,
            'Passive',
            'Grants the 2014 Circle Spells for this terrain at druid levels 3, 5, 7 and 9. Always prepared; do not count against your preparation limit.',
          ],
        ),
        22,
      )
    if (c.name === 'Warlock' && level >= 3)
      add(
        'pact',
        'Pact Boon',
        1,
        [
          [
            'Pact of the Chain',
            'Unclassified',
            'Learn Find Familiar; ritual casting allowed. Familiar can be imp, pseudodragon, quasit or sprite as well as normal forms. Taking Attack lets you forgo one attack so familiar attacks using its reaction.',
          ],
          [
            'Pact of the Blade',
            'Action',
            'Create a chosen melee weapon in empty hand; proficient, magical against resistance. Disappears after 1 minute >5 feet away, dismissal (no action), death or reuse. A 1-hour ritual bonds a magical nonartifact/nonsentient weapon, summonable into hand.',
          ],
          [
            'Pact of the Tome',
            'Passive',
            'Choose 3 cantrips from any lists, cast at will while carrying Book of Shadows; Charisma, do not count toward known cantrips. Replace lost book with a 1-hour ceremony during a rest; old book destroyed.',
          ],
        ],
        47,
      )
    if (c.name === 'Warlock' && level >= 2) {
      const id = 'Warlock:invocation',
        limit =
          level >= 18
            ? 8
            : level >= 15
              ? 7
              : level >= 12
                ? 6
                : level >= 9
                  ? 5
                  : level >= 7
                    ? 4
                    : level >= 5
                      ? 3
                      : 2
      const hasBlast = listedSpells(read).some((s) => s.definition?.name === 'Eldritch Blast')
      groups.push({
        id,
        label: 'Warlock · Eldritch Invocations',
        limit,
        options: invocations.map((a) => ({
          ...a,
          id: `${id}:${a.name}`,
          className: 'Warlock',
          economy: ([
            'Gaze of Two Minds',
            'One with Shadows',
            'Misty Visions',
            'Mask of Many Faces',
            'Armor of Shadows',
            'Fiendish Vigor',
            'Eldritch Sight',
            'Master of Myriad Forms',
            'Otherworldly Leap',
          ].includes(a.name)
            ? 'Action'
            : [
                  'Ascendant Step',
                  'Beast Speech',
                  'Bewitching Whispers',
                  'Chains of Carceri',
                  'Dreadful Word',
                  'Minions of Chaos',
                  'Mire the Mind',
                  'Sculptor of Flesh',
                  'Sign of Ill Omen',
                  'Thief of Five Fates',
                  'Visions of Distant Realms',
                  'Whispers of the Grave',
                ].includes(a.name)
              ? 'Unclassified'
              : 'Passive') as Economy,
          eligible:
            level >= a.level &&
            (!a.pact || selectedIds(settings).includes(`Warlock:pact:Pact of the ${a.pact}`)) &&
            (!a.eldritchBlast || hasBlast),
        })),
      })
    }
    if (c.name === 'Ranger' && sub === 'Hunter') {
      if (level >= 3)
        add(
          'hunter3',
          'Hunter’s Prey',
          1,
          [
            [
              'Colossus Slayer',
              'Passive',
              'Once per turn on weapon hit, +1d8 damage if target is below HP maximum.',
            ],
            [
              'Giant Killer',
              'Reaction',
              'When Large-or-larger creature within 5 feet that you can see hits or misses you, attack it immediately.',
            ],
            [
              'Horde Breaker',
              'Passive',
              'Once on each turn when making a weapon attack, make another attack with same weapon against a different creature within 5 feet of first target and within weapon range.',
            ],
          ],
          37,
        )
      if (level >= 7)
        add(
          'hunter7',
          'Defensive Tactics',
          1,
          [
            ['Escape the Horde', 'Passive', 'Opportunity attacks against you have disadvantage.'],
            [
              'Multiattack Defense',
              'Passive',
              'After a creature hits you, +4 AC against its subsequent attacks this turn.',
            ],
            ['Steel Will', 'Passive', 'Advantage on saves against frightened.'],
          ],
          37,
        )
      if (level >= 11)
        add(
          'hunter11',
          'Multiattack',
          1,
          [
            [
              'Volley',
              'Action',
              'Attack any number of creatures in weapon range within 10 feet of a visible point. Separate attacks; ammunition required for each.',
            ],
            [
              'Whirlwind Attack',
              'Action',
              'Make melee attack against any number of creatures within 5 feet, separate roll for each.',
            ],
          ],
          38,
        )
      if (level >= 15)
        add(
          'hunter15',
          'Superior Hunter’s Defense',
          1,
          [
            [
              'Evasion',
              'Passive',
              'Dexterity save for half damage: no damage on success, half on failure.',
            ],
            [
              'Stand Against the Tide',
              'Reaction',
              'When hostile creature misses you in melee, force it to repeat same attack against another creature of your choice other than itself.',
            ],
            ['Uncanny Dodge', 'Reaction', 'Visible attacker hits you: halve that attack’s damage.'],
          ],
          38,
        )
    }
    if (c.name === 'Fighter' && sub === 'Battle Master' && level >= 3)
      add(
        'maneuver',
        'Maneuvers',
        3 + (level >= 7 ? 2 : 0) + (level >= 10 ? 2 : 0) + (level >= 15 ? 2 : 0),
        (
          [
            [
              'Commander’s Strike',
              'Bonus action',
              'When taking Attack, forgo one attack; ally that sees/hears you uses reaction for one weapon attack, adding die to damage.',
            ],
            [
              'Disarming Attack',
              'Passive',
              'Weapon hit: add die to damage; Strength save or drop one held object of your choice at its feet.',
            ],
            [
              'Distracting Strike',
              'Passive',
              'Weapon hit: add die to damage; next attack by someone other than you against target before your next turn has advantage.',
            ],
            ['Evasive Footwork', 'Movement', 'When moving, add die to AC until you stop moving.'],
            [
              'Feinting Attack',
              'Bonus action',
              'Choose creature within 5 feet: advantage on your next attack against it this turn; add die to damage if hit.',
            ],
            [
              'Goading Attack',
              'Passive',
              'Weapon hit: add die to damage; Wisdom save or disadvantage attacking anyone other than you until end of your next turn.',
            ],
            [
              'Lunging Attack',
              'Passive',
              'Melee weapon attack on your turn: +5 feet reach; add die to damage on hit.',
            ],
            [
              'Maneuvering Attack',
              'Passive',
              'Weapon hit: add die to damage; friendly creature seeing/hearing you may use reaction to move half speed, without opportunity attacks from the target you hit.',
            ],
            [
              'Menacing Attack',
              'Passive',
              'Weapon hit: add die to damage; Wisdom save or frightened of you until end of your next turn.',
            ],
            [
              'Parry',
              'Reaction',
              'Another creature damages you with melee attack: reduce damage by die + Dexterity modifier.',
            ],
            [
              'Precision Attack',
              'Passive',
              'Weapon attack: add die to attack roll before/after rolling, before attack effects.',
            ],
            [
              'Pushing Attack',
              'Passive',
              'Weapon hit: add die to damage; Large-or-smaller target makes Strength save or is pushed up to 15 feet away.',
            ],
            [
              'Rally',
              'Bonus action',
              'Friendly creature that sees/hears you gains temporary HP = die + Charisma modifier.',
            ],
            [
              'Riposte',
              'Reaction',
              'Creature misses you in melee: make melee weapon attack; add die to damage on hit.',
            ],
            [
              'Sweeping Attack',
              'Passive',
              'Melee weapon hit: choose second creature within 5 feet of first and your reach; if original attack roll also hits second, deal superiority-die damage of original weapon type to it.',
            ],
            [
              'Trip Attack',
              'Passive',
              'Weapon hit: add die to damage; Large-or-smaller target makes Strength save or prone.',
            ],
          ] as Row[]
        ).map((row) => [row[0], row[1], row[2], '1 superiority die']),
        undefined,
        'https://www.worldanvil.com/block/1019818',
      )
    if (c.name === 'Barbarian' && sub === 'Path of the Totem Warrior') {
      if (level >= 3)
        add(
          'totem3',
          'Totem Spirit',
          1,
          [
            ['Bear', 'Passive', 'While raging, resist all damage except psychic.'],
            [
              'Eagle',
              'Bonus action',
              'While raging without heavy armor, Dash as bonus action; opportunity attacks against you have disadvantage.',
            ],
            [
              'Wolf',
              'Passive',
              'While raging, allies have advantage on melee attacks against enemies within 5 feet of you.',
            ],
          ],
          undefined,
          'https://www.worldanvil.com/block/240788',
        )
      if (level >= 6)
        add(
          'totem6',
          'Aspect of the Beast',
          1,
          [
            [
              'Bear',
              'Passive',
              'Double carrying capacity; advantage on Strength checks to push/pull/lift/break.',
            ],
            [
              'Eagle',
              'Passive',
              'See clearly to 1 mile; dim light does not impose Perception disadvantage.',
            ],
            ['Wolf', 'Passive', 'Track at fast travel pace; move stealthily at normal pace.'],
          ],
          undefined,
          'https://www.worldanvil.com/block/523021',
        )
      if (level >= 14)
        add(
          'totem14',
          'Totemic Attunement',
          1,
          [
            [
              'Bear',
              'Passive',
              'Rage: hostile creatures within 5 feet have disadvantage attacking others; requires they see/hear you and are not fear-immune.',
            ],
            [
              'Eagle',
              'Movement',
              'Rage: fly at walking speed; fall if ending turn unsupported in air.',
            ],
            [
              'Wolf',
              'Bonus action',
              'Rage: after melee weapon hit against Large-or-smaller creature, knock it prone.',
            ],
          ],
          undefined,
          'https://www.worldanvil.com/block/1090610',
        )
    }
    if (c.name === 'Monk' && sub === 'Way of the Four Elements' && level >= 3)
      add(
        'discipline',
        'Elemental disciplines',
        1 + (level >= 6 ? 1 : 0) + (level >= 11 ? 1 : 0) + (level >= 17 ? 1 : 0),
        [
          [
            'Fangs of the Fire Snake',
            'Passive',
            'When taking Attack, +10 feet unarmed reach for rest of turn; strikes deal fire. On hit may spend another ki for +1d10 fire.',
            '1 ki, optional +1 ki per hit',
            3,
          ],
          [
            'Fist of Four Thunders',
            'Action',
            'Cast Thunderwave, normal spell rules without materials.',
            '2 ki',
            3,
          ],
          [
            'Fist of Unbroken Air',
            'Action',
            'Creature within 30 feet: Strength save, 3d10 bludgeoning (+1d10 per extra ki), push up to 20 feet and prone on failure; half damage only on success.',
            '2+ ki',
            3,
          ],
          ['Rush of the Gale Spirits', 'Action', 'Cast Gust of Wind without materials.', '2 ki', 3],
          [
            'Shape the Flowing River',
            'Action',
            'Water/ice ≤30 feet per side within 120 feet: freeze/thaw or reshape ice. Changes ≤half largest dimension; cannot trap or damage creatures.',
            '1 ki',
            3,
          ],
          ['Sweeping Cinder Strike', 'Action', 'Cast Burning Hands without materials.', '2 ki', 3],
          [
            'Water Whip',
            'Action',
            'Visible creature within 30 feet: Dexterity save, 3d10 bludgeoning (+1d10 per extra ki) and prone or pull up to 25 feet on failure; half damage only on success.',
            '2+ ki',
            3,
          ],
          ['Clench of the North Wind', 'Action', 'Cast Hold Person without materials.', '3 ki', 6],
          ['Gong of the Summit', 'Action', 'Cast Shatter without materials.', '3 ki', 6],
          ['Flames of the Phoenix', 'Action', 'Cast Fireball without materials.', '4 ki', 11],
          ['Mist Stance', 'Action', 'Cast Gaseous Form on yourself without materials.', '4 ki', 11],
          ['Ride the Wind', 'Action', 'Cast Fly on yourself without materials.', '4 ki', 11],
          ['Breath of Winter', 'Action', 'Cast Cone of Cold without materials.', '6 ki', 17],
          [
            'Eternal Mountain Defense',
            'Action',
            'Cast Stoneskin on yourself without materials.',
            '5 ki',
            17,
          ],
          ['River of Hungry Flame', 'Action', 'Cast Wall of Fire without materials.', '5 ki', 17],
          ['Wave of Rolling Earth', 'Action', 'Cast Wall of Stone without materials.', '6 ki', 17],
        ],
        undefined,
        'https://www.worldanvil.com/sheet/351863/view',
      )
  }
  for (const g of groups) {
    if (g.id === 'Warlock:invocation')
      for (const o of g.options) {
        const spell = SPELLS_2014.find((s) =>
          o.detail.toLowerCase().includes(`cast ${s.name.toLowerCase()}`),
        )
        if (spell) o.economy = spellEconomy(spell.castingTime)
      }
    if (g.id === 'Fighter:maneuver')
      g.options.forEach(
        (o, i) =>
          (o.url = `https://www.worldanvil.com/block/${i < 6 ? 407808 : i < 11 ? 1414820 : 173275}`),
      )
    if (g.id === 'Barbarian:totem3')
      g.options.forEach((o) => (o.url = 'https://www.worldanvil.com/block/523021'))
    if (g.id === 'Monk:discipline')
      g.options
        .filter((o) =>
          [
            'Fangs of the Fire Snake',
            'Fist of Unbroken Air',
            'Shape the Flowing River',
            'Water Whip',
          ].includes(o.name),
        )
        .forEach((o) => (o.url = 'https://www.worldanvil.com/sheet/151970/view'))
  }
  return groups
}
export function selectedFeatureAbilities(
  book: Workbook,
  read: Reader,
  settings: RuleSettings,
): Ability[] {
  return featureGroups(book, read, settings).flatMap((g) =>
    g.id === 'Artificer:infusion'
      ? []
      : g.options
          .filter((o) => o.eligible && selectedIds(settings).includes(o.id))
          .map((o) => ({ ...o, name: `${g.label.split(' · ')[1]} · ${o.name}` })),
  )
}
export function featureChoiceIssues(
  book: Workbook,
  read: Reader,
  settings: RuleSettings,
): string[] {
  const groups = featureGroups(book, read, settings),
    selected = selectedIds(settings),
    issues: string[] = []
  const options = groups.flatMap((g) => g.options)
  for (const id of selected)
    if (!options.some((o) => o.id === id && o.eligible)) issues.push(`Unavailable choice: ${id}`)
  for (const g of groups) {
    const count = g.options.filter((o) => selected.includes(o.id)).length
    if (count > g.limit) issues.push(`${g.label}: ${count} choices, limit ${g.limit}`)
  }
  const styles = groups
    .filter((g) => g.id.endsWith(':style'))
    .flatMap((g) => g.options.filter((o) => selected.includes(o.id)).map((o) => o.name))
  if (new Set(styles).size < styles.length) issues.push('A Fighting Style cannot be learned twice.')
  const activeInfusions = groups
    .filter((g) => ['Artificer:infused', 'Artificer:armored-infused'].includes(g.id))
    .flatMap((g) => g.options.filter((o) => selected.includes(o.id)).map((o) => o.name))
  if (new Set(activeInfusions).size < activeInfusions.length)
    issues.push(
      'An infusion cannot be applied twice. Armor-only extra infusions must occupy your Arcane Armor parts.',
    )
  return issues
}

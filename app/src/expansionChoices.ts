import type { FeatureGroup } from './featureChoices'
import type { ClassChoice, Economy, RuleSettings } from './companionRules'
import { canonicalSubclass } from './phbSubclassRules.ts'
type Row = [string, Economy, string, string?, number?]
export function expansionFeatureGroups(c: ClassChoice, settings: RuleSettings): FeatureGroup[] {
  const groups: FeatureGroup[] = [],
    sub = canonicalSubclass(c.name, c.subclass),
    level = c.level
  const add = (key: string, label: string, limit: number, rows: Row[], block: number) => {
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
        subclass: sub,
        source: 'Official 2014 option · mechanical summary',
        url: `https://www.worldanvil.com/block/${block}`,
        eligible: level >= (unlock ?? 1),
      })),
    })
  }
  if (level >= 3 && ['Cavalier', 'Samurai', 'Phantom'].includes(sub)) {
    const names =
      sub === 'Cavalier'
        ? ['Animal Handling', 'History', 'Insight', 'Performance', 'Persuasion']
        : sub === 'Samurai'
          ? ['History', 'Insight', 'Performance', 'Persuasion']
          : [
              'Acrobatics',
              'Animal Handling',
              'Arcana',
              'Athletics',
              'Deception',
              'History',
              'Insight',
              'Intimidation',
              'Investigation',
              'Medicine',
              'Nature',
              'Perception',
              'Performance',
              'Persuasion',
              'Religion',
              'Sleight of Hand',
              'Stealth',
              'Survival',
            ]
    add(
      'training',
      sub === 'Phantom' ? 'Whispers of the Dead' : 'Bonus proficiency',
      1,
      [
        ...names.map(
          (name) =>
            [
              name,
              'Passive',
              `Gain ${name} proficiency. ${sub === 'Phantom' ? 'Replace this choice after any short/long rest.' : ''}`,
            ] as Row,
        ),
        [
          sub === 'Phantom' ? 'Tool proficiency' : 'Language',
          'Passive',
          sub === 'Phantom'
            ? 'Choose one tool proficiency instead of a skill; record its name in the spreadsheet.'
            : 'Choose one language instead of a skill; record it in the spreadsheet.',
        ],
      ],
      sub === 'Phantom' ? 912090 : sub === 'Cavalier' ? 1204927 : 1258787,
    )
  }
  if (sub === 'Purple Dragon Knight' && level >= 7)
    add(
      'royal-envoy',
      'Royal Envoy replacement',
      1,
      ['Animal Handling', 'Insight', 'Intimidation', 'Performance'].map((name) => [
        name,
        'Passive',
        `Choose ${name} only if you were already proficient in Persuasion before Royal Envoy. Persuasion proficiency is still doubled.`,
      ]),
      1011335,
    )
  if (sub === 'College of Swords' && level >= 3)
    add(
      'style',
      'Swords Fighting Style',
      1,
      [
        ['Dueling', 'Passive', '+2 damage with a melee weapon in one hand and no other weapon.'],
        ['Two-Weapon Fighting', 'Passive', 'Add ability modifier to off-hand attack damage.'],
      ],
      213944,
    )
  if (sub === 'Path of the Storm Herald' && level >= 3)
    add(
      'storm',
      'Storm environment',
      1,
      [
        ['Desert', 'Passive', 'Fire aura; heat/fire defenses; level 14 reaction retaliation.'],
        [
          'Sea',
          'Passive',
          'Lightning aura; swim/breathing/lightning defenses; level 14 prone effect.',
        ],
        ['Tundra', 'Passive', 'Temporary-HP aura; cold defenses; level 14 speed reduction.'],
      ],
      1465604,
    )
  if (sub === 'Path of the Beast' && level >= 3)
    add(
      'beast',
      'Current beast form',
      1,
      [
        ['Bite', 'Passive', 'Strength d8 piercing; once/turn below half maximum HP, hit heals PB.'],
        [
          'Claws',
          'Passive',
          'Strength d6 slashing; once/turn claw Attack-action attack grants another claw attack.',
        ],
        [
          'Tail',
          'Reaction',
          'Strength d8 piercing with reach. Visible attack within10 hits: add d8 AC, potentially causing miss. Only while raging in tail form.',
        ],
      ],
      1090639,
    )
  if (sub === 'The Genie')
    add(
      'genie',
      'Genie patron',
      1,
      [
        ['Dao', 'Passive', 'Bludgeoning Wrath/resistance; Dao expanded spells.'],
        ['Djinni', 'Passive', 'Thunder Wrath/resistance; Djinni expanded spells.'],
        ['Efreeti', 'Passive', 'Fire Wrath/resistance; Efreeti expanded spells.'],
        ['Marid', 'Passive', 'Cold Wrath/resistance; Marid expanded spells.'],
      ],
      956640,
    )
  if (sub === 'Divine Soul')
    add(
      'affinity',
      'Divine affinity',
      1,
      [
        ['Good', 'Passive', 'Extra known spell: Cure Wounds.'],
        ['Evil', 'Passive', 'Extra known spell: Inflict Wounds.'],
        ['Law', 'Passive', 'Extra known spell: Bless.'],
        ['Chaos', 'Passive', 'Extra known spell: Bane.'],
        ['Neutrality', 'Passive', 'Extra known spell: Protection from Evil and Good.'],
      ],
      412267,
    )
  if (sub === 'Lunar Sorcery')
    add(
      'moon',
      'Current lunar phase',
      1,
      [
        ['Full Moon', 'Passive', 'Free Shield; abjuration/divination Metamagic discount at6.'],
        ['New Moon', 'Passive', 'Free Ray of Sickness; enchantment/necromancy discount at6.'],
        ['Crescent Moon', 'Passive', 'Free Color Spray; illusion/transmutation discount at6.'],
      ],
      1506954,
    )
  if (sub === 'Rune Knight' && level >= 3)
    add(
      'rune',
      'Known runes',
      2 + (level >= 7 ? 1 : 0) + (level >= 10 ? 1 : 0) + (level >= 15 ? 1 : 0),
      [
        [
          'Cloud',
          'Reaction',
          'Sleight of Hand/Deception advantage. Visible attack hits within30: transfer its roll to another visible target within30 other than attacker, using same roll.',
          '1 / short or long rest; 2 at15',
        ],
        [
          'Fire',
          'Passive',
          'Double proficiency on proficient-tool checks. Weapon hit: +2d6 fire; Strength save or restrained 1 minute, 2d6 fire at turn start, repeat save at turn end.',
          '1 / short or long rest; 2 at15',
        ],
        [
          'Frost',
          'Bonus action',
          'Animal Handling/Intimidation advantage. Activate 10 minutes: +2 Strength/Constitution checks and saves.',
          '1 / short or long rest; 2 at15',
        ],
        [
          'Stone',
          'Reaction',
          'Insight advantage/darkvision120. Visible creature ends turn within30: Wisdom save or charmed/incapacitated/speed0 for1 minute; repeat each turn’s end.',
          '1 / short or long rest; 2 at15',
        ],
        [
          'Hill',
          'Bonus action',
          'Poison-save advantage/poison resistance. Activate1 minute: bludgeoning/piercing/slashing resistance.',
          '1 / short or long rest; 2 at15',
          7,
        ],
        [
          'Storm',
          'Bonus action',
          'Arcana advantage/cannot be surprised unless incapacitated. Activate1 minute: reaction before visible roll within60 grants advantage/disadvantage.',
          '1 / short or long rest; 2 at15',
          7,
        ],
      ],
      1275884,
    )
  if (sub === 'Arcane Archer' && level >= 3)
    add(
      'shot',
      'Known Arcane Shots',
      2 + [7, 10, 15, 18].filter((l) => level >= l).length,
      [
        [
          'Banishing Arrow',
          'Passive',
          'Charisma save or banished until next turn’s end, speed0/incapacitated; level18 adds2d6 force.',
        ],
        [
          'Beguiling Arrow',
          'Passive',
          '+2d6 psychic; Wisdom save or charmed by chosen ally within30 until next turn/harmed by ally;4d6 at18.',
        ],
        ['Bursting Arrow', 'Passive', 'Target and all creatures within10 take2d6 force;4d6 at18.'],
        [
          'Enfeebling Arrow',
          'Passive',
          '+2d6 necrotic; Constitution save or halve weapon damage until next turn;4d6 at18.',
        ],
        [
          'Grasping Arrow',
          'Passive',
          '+2d6 poison; -10 speed,2d6 slashing first movement each turn. Action Athletics vs spell DC removes brambles, otherwise1 minute;4d6 dice at18.',
        ],
        [
          'Piercing Arrow',
          'Action',
          'One Attack-action attack becomes a30-foot ×1-foot line, ignores cover: Dexterity save, arrow damage +d6 piercing, half on success;2d6 at18. No attack roll.',
        ],
        [
          'Seeking Arrow',
          'Action',
          'One Attack-action attack seeks a creature seen in last minute within bow range, bypasses cover: Dexterity save, arrow damage +d6 force, half on success;2d6 at18. Learn location on failed save.',
        ],
        [
          'Shadow Arrow',
          'Passive',
          '+2d6 psychic; Wisdom save or cannot see beyond5 feet until next turn;4d6 at18.',
        ],
      ].map((row) => [row[0], row[1], row[2], '1 Arcane Shot; pool2 / short or long rest'] as Row),
      1646008,
    )
  if (c.name === 'Artificer' && level >= 2) {
    const rows: Row[] = [
      [
        'Armor of Magical Strength',
        'Reaction',
        'Attuned armor:6 charges, d6 recovery at dawn. Spend1 to add Intelligence to Strength check/save, or react to avoid being knocked prone.',
      ],
      [
        'Enhanced Arcane Focus',
        'Passive',
        'Attuned wand/staff/rod: +1 spell attacks (+2 at10), ignore half cover.',
      ],
      ['Enhanced Defense', 'Passive', 'Armor/shield +1 AC, +2 at10.'],
      ['Enhanced Weapon', 'Passive', 'Weapon +1 attack/damage, +2 at10.'],
      [
        'Homunculus Servant',
        'Bonus action',
        'Gem/crystal worth100 gp becomes heart; linked servant stat block. Bonus-command action, otherwise Dodge; moves/reacts independently.',
      ],
      [
        'Mind Sharpener',
        'Reaction',
        'Armor/robes:4 charges, d4 recovery at dawn. After wearer fails concentration save, spend1 to succeed.',
      ],
      [
        'Repeating Shot',
        'Passive',
        'Attuned ammunition weapon: +1 attack/damage, ignore loading, creates ammunition when needed.',
      ],
      [
        'Returning Weapon',
        'Passive',
        'Thrown weapon +1 attack/damage; returns immediately after ranged attack.',
      ],
      [
        'Boots of the Winding Path',
        'Bonus action',
        'Attuned boots: teleport15 feet to visible unoccupied space occupied earlier this turn.',
        undefined,
        6,
      ],
      [
        'Radiant Weapon',
        'Reaction',
        'Attuned weapon +1 attack/damage; bonus toggle30/30 light. Hit within30: charge forces Constitution save or blindness until attacker’s next turn.4 charges/d4 dawn.',
        undefined,
        6,
      ],
      [
        'Repulsion Shield',
        'Reaction',
        'Attuned shield +1 AC; melee hit: spend charge push attacker15 feet.4 charges/d4 dawn.',
        undefined,
        6,
      ],
      [
        'Resistant Armor',
        'Passive',
        'Attuned armor: chosen acid/cold/fire/force/lightning/necrotic/poison/psychic/radiant/thunder resistance.',
        undefined,
        6,
      ],
      [
        'Spell-Refueling Ring',
        'Action',
        'Attuned ring: recover one expended slot level3 or lower, once per dawn.',
        undefined,
        6,
      ],
      [
        'Helm of Awareness',
        'Passive',
        'Attuned helmet: initiative advantage; cannot be surprised unless incapacitated.',
        undefined,
        10,
      ],
      [
        'Arcane Propulsion Armor',
        'Passive',
        'Attuned armor: +5 walk, replaces limbs, cannot be forcibly removed; gauntlets are magic melee weapons, d8 force, thrown20/60 with return.',
        undefined,
        14,
      ],
    ]
    const replicas: [number, string[]][] = [
      [
        2,
        [
          'Alchemy Jug',
          'Bag of Holding',
          'Cap of Water Breathing',
          'Goggles of Night',
          'Rope of Climbing',
          'Sending Stones',
          'Wand of Magic Detection',
          'Wand of Secrets',
        ],
      ],
      [
        6,
        [
          'Boots of Elvenkind',
          'Cloak of Elvenkind',
          'Cloak of the Manta Ray',
          'Eyes of Charming',
          'Gloves of Thievery',
          'Lantern of Revealing',
          'Pipes of Haunting',
          'Ring of Water Walking',
        ],
      ],
      [
        10,
        [
          'Boots of Striding and Springing',
          'Boots of the Winterlands',
          'Bracers of Archery',
          'Brooch of Shielding',
          'Cloak of Protection',
          'Eyes of the Eagle',
          'Gauntlets of Ogre Power',
          'Gloves of Missile Snaring',
          'Gloves of Swimming and Climbing',
          'Hat of Disguise',
          'Headband of Intellect',
          'Helm of Telepathy',
          'Medallion of Thoughts',
          'Necklace of Adaptation',
          'Periapt of Wound Closure',
          'Pipes of the Sewers',
          'Quiver of Ehlonna',
          'Ring of Jumping',
          'Ring of Mind Shielding',
          'Slippers of Spider Climbing',
          'Ventilating Lungs',
          'Winged Boots',
        ],
      ],
      [
        14,
        [
          'Amulet of Health',
          'Arcane Propulsion Arm',
          'Belt of Hill Giant Strength',
          'Boots of Levitation',
          'Boots of Speed',
          'Bracers of Defense',
          'Cloak of the Bat',
          'Dimensional Shackles',
          'Gem of Seeing',
          'Horn of Blasting',
          'Ring of Free Action',
          'Ring of Protection',
          'Ring of the Ram',
        ],
      ],
    ]
    for (const [unlock, names] of replicas)
      for (const name of names)
        rows.push([
          `Replicate · ${name}`,
          'Passive',
          `Replicate ${name}; item effects and attunement still apply. Requires appropriate nonmagical base item.`,
          undefined,
          unlock,
        ])
    add(
      'infusion',
      'Learned infusions',
      4 + 2 * [6, 10, 14, 18].filter((l) => level >= l).length,
      rows,
      1541283,
    )
    const learned = groups.at(-1)!
    const activeRows = learned.options
      .filter((o) => o.eligible && settings.selections?.includes(o.id))
      .map((o) => [o.name, o.economy, o.detail, o.cost, o.level] as Row)
    add(
      'infused',
      'Active infused items',
      2 + [6, 10, 14, 18].filter((l) => level >= l).length,
      activeRows,
      1541283,
    )
    if (sub === 'Armorer' && level >= 9)
      add(
        'armored-infused',
        'Armor-only extra infusions',
        2,
        activeRows.filter((row) =>
          /Armor|Defense|Weapon|Sharpener|Helm|Boots|Repeating|Returning|Radiant/.test(row[0]),
        ),
        930018,
      )
    if (sub === 'Armorer' && level >= 3)
      add(
        'armor',
        'Current armor model',
        1,
        [
          [
            'Guardian',
            'Bonus action',
            'Defensive Field grants Artificer level temporary HP, PB times/long rest; thunder gauntlets protect allies.',
          ],
          [
            'Infiltrator',
            'Action',
            'Lightning Launcher ranged attacks, range90/300, d6 lightning +extra d6 once/turn; Stealth advantage.',
          ],
        ],
        832980,
      )
  }
  return groups
}

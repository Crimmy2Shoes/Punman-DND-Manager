import { Plus, Trash2 } from 'lucide-react'
import { Panel, Field, Note, Toggle, num } from './components'
import { newItem } from './character'
import type { Character, Item } from './character'
export default function Inventory({
  c,
  replace,
}: {
  c: Character
  replace: (c: Character) => void
}) {
  const update = (patch: Partial<Character>) => replace({ ...c, ...patch }),
    edit = (id: string, patch: Partial<Item>) =>
      update({ items: c.items.map((x) => (x.id === id ? { ...x, ...patch } : x)) })
  const weight = c.items.reduce((sum, x) => sum + x.quantity * x.weight, 0),
    coinCount = Object.values(c.wallet).reduce((a, b) => a + b, 0),
    attuned = c.items.filter((x) => x.attuned).length,
    limit = c.classes.some((x) => x.name === 'Rogue' && x.subclass === 'Thief' && x.level >= 13)
      ? 4
      : 3
  return (
    <>
      <Panel
        title="Coin purse"
        subtitle={`Equivalent to ${(c.wallet.cp / 100 + c.wallet.sp / 10 + c.wallet.ep / 2 + c.wallet.gp + c.wallet.pp * 10).toLocaleString(undefined, { maximumFractionDigits: 2 })} GP`}
      >
        <div className="coin-grid">
          {(['cp', 'sp', 'ep', 'gp', 'pp'] as const).map((k) => (
            <Field
              key={k}
              label={k.toUpperCase()}
              value={c.wallet[k]}
              onChange={(v) => update({ wallet: { ...c.wallet, [k]: num(v) } })}
            />
          ))}
        </div>
      </Panel>
      <Panel
        title="Your adventuring kit"
        subtitle={`${(weight + coinCount / 50).toFixed(2)} lb. including coins`}
      >
        <p className="hint">
          Item weight is per unit. Coins weigh 1 lb. per 50. Ammunition and consumables use quantity
          controls.
        </p>
        <div className="entry-list">
          {c.items.map((item) => (
            <details className="entry" key={item.id}>
              <summary>
                <strong>{item.name}</strong>
                <span>
                  ×{item.quantity}
                  {item.equipped ? ' · Equipped' : ''}
                  {item.attuned ? ' · Attuned' : ''}
                </span>
              </summary>
              <div className="entry-body">
                <div className="field-grid">
                  <Field
                    label="Item name"
                    value={item.name}
                    onChange={(v) => edit(item.id, { name: v })}
                  />
                  <Field
                    label="Quantity"
                    value={item.quantity}
                    max={99999}
                    onChange={(v) => edit(item.id, { quantity: num(v, 0, 99999) })}
                  />
                  <Field
                    label="Weight per item (lb)"
                    value={item.weight}
                    step={0.01}
                    onChange={(v) =>
                      edit(item.id, { weight: Math.max(0, Math.min(999999, Number(v) || 0)) })
                    }
                  />
                </div>
                <div className="actions">
                  <Toggle
                    label="Equipped"
                    checked={item.equipped}
                    onChange={() => edit(item.id, { equipped: !item.equipped })}
                  />
                  <Toggle
                    label="Requires attunement"
                    checked={item.requiresAttunement}
                    onChange={() => edit(item.id, { requiresAttunement: !item.requiresAttunement })}
                  />
                  <Toggle
                    label="Attuned"
                    checked={item.attuned}
                    onChange={() => edit(item.id, { attuned: !item.attuned })}
                  />
                  <button
                    disabled={!item.quantity}
                    onClick={() => edit(item.id, { quantity: Math.max(0, item.quantity - 1) })}
                  >
                    Use one
                  </button>
                  <button
                    onClick={() => edit(item.id, { quantity: Math.min(99999, item.quantity + 1) })}
                  >
                    Add one
                  </button>
                  <button
                    aria-label={`Delete ${item.name}`}
                    onClick={() => update({ items: c.items.filter((x) => x.id !== item.id) })}
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
                <Note
                  label="Item effects & notes"
                  value={item.notes}
                  onChange={(v) => edit(item.id, { notes: v })}
                />
              </div>
            </details>
          ))}
        </div>
        <button
          className="add-button"
          disabled={c.items.length >= 500}
          onClick={() => update({ items: [...c.items, newItem()] })}
        >
          <Plus size={15} /> Add item
        </button>
        <Note
          label="Equipment & legacy inventory notes"
          value={c.inventory}
          onChange={(v) => update({ inventory: v })}
        />
      </Panel>
      <Panel title="Magic item attunement" subtitle={`${attuned} / ${limit} items attuned`}>
        {attuned > limit && (
          <p className="notice" role="alert">
            You are above the normal attunement limit. Confirm any exception with your DM.
          </p>
        )}
        <Note
          label="Attunement rules, effects & legacy notes"
          value={c.attunement}
          onChange={(v) => update({ attunement: v })}
        />
        <p className="hint">
          Apply magic item bonuses in Character and add charge counters in Play.
        </p>
      </Panel>
      <Panel title="Pages from your journey">
        <Field
          label="Appearance"
          value={c.appearance}
          onChange={(v) => update({ appearance: v })}
        />
        <Note
          label="Backstory, personality & session notes"
          value={c.notes}
          onChange={(v) => update({ notes: v })}
        />
      </Panel>
    </>
  )
}

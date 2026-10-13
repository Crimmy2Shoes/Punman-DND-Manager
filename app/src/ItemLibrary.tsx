import { useState } from 'react'
import { Modal } from './components'
import { ITEM_CATALOG as items } from './itemCatalog'
import type { ItemDefinition } from './itemCatalog'
export { findItem, priceInGold } from './itemCatalog'
export default function ItemLibrary({
  onClose,
  onAdd,
  initial,
}: {
  onClose: () => void
  onAdd?: (item: ItemDefinition) => void
  initial?: ItemDefinition
}) {
  const [query, setQuery] = useState(''),
    [category, setCategory] = useState(''),
    [attuned, setAttuned] = useState(false),
    [page, setPage] = useState(0),
    [selected, setSelected] = useState<ItemDefinition | null>(initial ?? null)
  const search = query.trim().toLowerCase()
  const rank = (name: string) =>
    name.toLowerCase() === search
      ? 0
      : name.toLowerCase().startsWith(search)
        ? 1
        : name.toLowerCase().includes(search)
          ? 2
          : 3
  const filtered = items
    .filter(
      (i) =>
        (!category || i.category === category) &&
        (!attuned || i.attunement) &&
        `${i.name} ${i.type} ${i.detail}`.toLowerCase().includes(search),
    )
    .sort((a, b) =>
      search
        ? rank(a.name) - rank(b.name) || a.name.localeCompare(b.name)
        : a.name.localeCompare(b.name),
    )
  const pages = Math.max(1, Math.ceil(filtered.length / 8)),
    current = Math.min(page, pages - 1)
  return (
    <Modal title={selected ? selected.name : 'Item library · SRD 5.1'} onClose={onClose}>
      {selected ? (
        <>
          <div className="ability-detail-meta">
            <span>{selected.type}</span>
            <span>{selected.rarity}</span>
            <span>{selected.attunement ? 'Requires attunement' : 'No attunement'}</span>
            <span>{selected.cost || 'Price not specified'}</span>
            <span>
              {selected.weight === null ? 'Weight not specified' : `${selected.weight} lb`}
            </span>
          </div>
          <p className="ability-full-text">{selected.detail}</p>
          <a
            href={`https://media.wizards.com/2023/downloads/dnd/SRD_CC_v5.1.pdf#page=${selected.page}`}
            target="_blank"
            rel="noreferrer"
          >
            SRD 5.1 · page {selected.page}
          </a>
          <div className="actions">
            <button onClick={() => setSelected(null)}>Back to items</button>
            {onAdd && (
              <button className="primary" onClick={() => onAdd(selected)}>
                Add to inventory
              </button>
            )}
          </div>
        </>
      ) : (
        <>
          <div className="manager-tools">
            <label className="field">
              <span>Find an item</span>
              <input
                aria-label="Search item library"
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value)
                  setPage(0)
                }}
              />
            </label>
            <label className="field">
              <span>Category</span>
              <select
                aria-label="Item category"
                value={category}
                onChange={(e) => {
                  setCategory(e.target.value)
                  setPage(0)
                }}
              >
                <option value="">All items</option>
                {[...new Set(items.map((i) => i.category))].map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
            </label>
            <label>
              <input
                type="checkbox"
                checked={attuned}
                onChange={(e) => {
                  setAttuned(e.target.checked)
                  setPage(0)
                }}
              />{' '}
              Requires attunement
            </label>
          </div>
          <div className="manager-list">
            {filtered.slice(current * 8, current * 8 + 8).map((item) => (
              <button className="manager-entry" key={item.name} onClick={() => setSelected(item)}>
                <span>
                  <strong>{item.name}</strong>
                  <small>
                    {item.rarity} · {item.type}
                    {item.attunement ? ' · Attunement' : ''}
                    {item.cost ? ` · ${item.cost}` : ''}
                  </small>
                </span>
                <span aria-hidden="true">Details →</span>
              </button>
            ))}
          </div>
          {!filtered.length && <p>No matching items.</p>}
          <div className="manager-pages">
            <button disabled={current === 0} onClick={() => setPage(current - 1)}>
              Previous items
            </button>
            <span>
              {filtered.length} items · {current + 1} / {pages}
            </span>
            <button disabled={current === pages - 1} onClick={() => setPage(current + 1)}>
              Next items
            </button>
          </div>
          <details className="coverage-note">
            <summary>Item coverage</summary>
            <p>
              Licensed SRD 5.1 equipment and magic items. Variants such as +1/+2/+3 share a
              definition. Items from other official books and custom items can be entered manually.
              Adding an item stages inventory cells; effects, charges and attunement are not
              automatically applied to sheet calculations.
            </p>
          </details>
        </>
      )}
    </Modal>
  )
}

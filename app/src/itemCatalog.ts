import items from './data/legacy-items.json' with { type: 'json' }
export type ItemDefinition = (typeof items)[number]
export const ITEM_CATALOG = items
const norm = (s: string) => s.toLowerCase().replace(/[’']/g, '').trim()
export const findItem = (name: string) => items.find((i) => norm(i.name) === norm(name))
export function priceInGold(cost: string): number | null {
  const match = /^([\d,]+(?:\.\d+)?) (cp|sp|ep|gp|pp)$/.exec(cost)
  return match
    ? Number(match[1].replace(/,/g, '')) *
        ({ cp: 0.01, sp: 0.1, ep: 0.5, gp: 1, pp: 10 }[match[2]] ?? 1)
    : null
}

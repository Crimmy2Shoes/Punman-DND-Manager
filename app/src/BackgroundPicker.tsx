import { useEffect, useId, useRef, useState } from 'react'
import type { Workbook } from './sheetModel'
export default function BackgroundPicker({
  book,
  options,
  value,
  disabled,
  onChange,
}: {
  book: Workbook
  options: string[]
  value: string
  disabled: boolean
  onChange: (value: string) => void
}) {
  const [open, setOpen] = useState(false),
    [active, setActive] = useState(0)
  const root = useRef<HTMLDivElement>(null),
    trigger = useRef<HTMLButtonElement>(null),
    buttons = useRef<(HTMLButtonElement | null)[]>([])
  const listId = useId(),
    previewId = useId()
  const items = ['', ...options.filter(Boolean)]
  if (value && !items.includes(value)) items.push(value)
  const preview = items[active] ?? ''
  const main = book.sheets.find((s) => s.title === 'v2.1')
  const entry = Object.entries(main?.cells ?? {}).find(
    ([a, c]) => /^AX\d+$/.test(a) && String(c.value).toLowerCase() === preview.toLowerCase(),
  )
  const skills = entry ? String(main?.cells['AY' + entry[0].slice(2)]?.value ?? '') : ''
  useEffect(() => {
    if (!open) return
    const close = (e: PointerEvent) => {
      if (!root.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('pointerdown', close)
    return () => document.removeEventListener('pointerdown', close)
  }, [open])
  const focus = (index: number) => {
    const next = Math.max(0, Math.min(items.length - 1, index))
    setActive(next)
    buttons.current[next]?.focus()
  }
  return (
    <div
      className="field background-picker"
      ref={root}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node)) setOpen(false)
      }}
    >
      <span>Background</span>
      <button
        ref={trigger}
        type="button"
        role="combobox"
        aria-label="Background"
        aria-controls={listId}
        aria-expanded={open}
        aria-haspopup="listbox"
        disabled={disabled}
        onClick={() => {
          setActive(Math.max(0, items.indexOf(value)))
          setOpen(!open)
        }}
        onKeyDown={(e) => {
          if (['ArrowDown', 'ArrowUp'].includes(e.key)) {
            e.preventDefault()
            setOpen(true)
            setTimeout(() => focus(Math.max(0, items.indexOf(value))), 0)
          }
        }}
      >
        {value || 'Choose background'}
        <span aria-hidden="true">⌄</span>
      </button>
      {open && (
        <div className="background-menu">
          <div
            id={listId}
            role="listbox"
            aria-label="Background options"
            onKeyDown={(e) => {
              if (['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(e.key)) {
                e.preventDefault()
                focus(
                  e.key === 'Home'
                    ? 0
                    : e.key === 'End'
                      ? items.length - 1
                      : active + (e.key === 'ArrowDown' ? 1 : -1),
                )
              }
              if (e.key === 'Escape') {
                e.preventDefault()
                setOpen(false)
                trigger.current?.focus()
              }
            }}
          >
            {items.map((option, i) => (
              <button
                type="button"
                role="option"
                key={option}
                ref={(node) => {
                  buttons.current[i] = node
                }}
                tabIndex={active === i ? 0 : -1}
                aria-selected={value === option}
                aria-describedby={active === i && preview ? previewId : undefined}
                onMouseEnter={() => setActive(i)}
                onFocus={() => setActive(i)}
                onClick={() => {
                  onChange(option)
                  setOpen(false)
                  trigger.current?.focus()
                }}
              >
                {option || 'No background'}
                {value === option && <span aria-hidden="true">✓</span>}
              </button>
            ))}
          </div>
          <div className="background-preview" id={previewId} role="tooltip">
            <strong>{preview || 'Choose a background'}</strong>
            {preview && (
              <>
                <small>Skill proficiencies</small>
                <p>{skills || 'No effects listed in this workbook.'}</p>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

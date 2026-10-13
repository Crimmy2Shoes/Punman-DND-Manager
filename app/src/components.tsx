import { useEffect, useRef, useId, useState } from 'react'
import type { ReactNode } from 'react'
import { X } from 'lucide-react'
export function Panel({
  title,
  subtitle,
  children,
  className = '',
}: {
  title: string
  subtitle?: string
  children: ReactNode
  className?: string
}) {
  return (
    <section className={`panel ${className}`}>
      <header className="panel-heading">
        <h2>{title}</h2>
        {subtitle && <span>{subtitle}</span>}
      </header>
      {children}
    </section>
  )
}
export function Field({
  label,
  value,
  onChange,
  min = 0,
  max = 999999,
  step = 1,
  disabled = false,
}: {
  label: string
  value: string | number
  onChange: (value: string) => void
  min?: number
  max?: number
  step?: number
  disabled?: boolean
}) {
  const [draft, setDraft] = useState(String(value))
  const [error, setError] = useState('')
  const [focused, setFocused] = useState(false)
  const hintId = useId()
  useEffect(() => {
    if (!focused) setDraft(String(value))
  }, [value, focused])
  const numeric = typeof value === 'number'
  const validate = (raw: string) => {
    if (!numeric) return raw.length > 100000 ? 'Use fewer than 100,000 characters.' : ''
    if (!raw.trim()) return 'Enter a number; your saved value has not changed.'
    const number = Number(raw)
    if (!Number.isFinite(number) || number < min || number > max)
      return `Enter a value from ${min} to ${max}. Your saved value has not changed.`
    if (step === 1 && !Number.isInteger(number))
      return 'Use a whole number. Your saved value has not changed.'
    return ''
  }
  return (
    <label className="field">
      <span>{label}</span>
      <input
        aria-label={label}
        type={typeof value === 'number' ? 'number' : 'text'}
        value={draft}
        disabled={disabled}
        maxLength={numeric ? undefined : 100000}
        aria-invalid={!!error}
        aria-describedby={error ? hintId : undefined}
        min={min}
        max={max}
        step={step}
        onFocus={() => setFocused(true)}
        onChange={(e) => {
          const raw = e.target.value
          setDraft(raw)
          const issue = validate(raw)
          setError(issue)
          if (!issue) onChange(raw)
        }}
        onBlur={() => {
          setFocused(false)
          if (validate(draft)) {
            setDraft(String(value))
            setError(
              'Previous value kept. ' +
                (numeric ? `Allowed range: ${min}–${max}.` : 'Text is too long.'),
            )
          } else setError('')
        }}
      />
      {error && (
        <small id={hintId} className="field-error">
          {error}
        </small>
      )}
    </label>
  )
}
export function Select({
  label,
  value,
  onChange,
  options,
}: {
  label: string
  value: string | number
  onChange: (v: string) => void
  options: (string | { value: string | number; label: string })[]
}) {
  return (
    <label className="field">
      <span>{label}</span>
      <select aria-label={label} value={value} onChange={(e) => onChange(e.target.value)}>
        {options.map((o) =>
          typeof o === 'string' ? (
            <option key={o}>{o}</option>
          ) : (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ),
        )}
      </select>
    </label>
  )
}
export function Choice({
  label,
  value,
  onChange,
  options,
  hint,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  options: string[]
  hint?: string
}) {
  const [custom, setCustom] = useState(!!value && !options.includes(value))
  const isCustom = custom || (!!value && !options.includes(value))
  return (
    <div className="choice-field">
      <Select
        label={label}
        value={isCustom ? '__custom__' : value}
        options={[
          { value: '', label: 'Not selected' },
          ...options,
          { value: '__custom__', label: 'Other / custom…' },
        ]}
        onChange={(v) => {
          if (v === '__custom__') setCustom(true)
          else {
            setCustom(false)
            onChange(v)
          }
        }}
      />
      {isCustom && (
        <Field label={`Custom ${label.toLowerCase()}`} value={value} onChange={onChange} />
      )}{' '}
      {hint && <small className="field-help">{hint}</small>}
    </div>
  )
}
export function Note({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  placeholder?: string
}) {
  return (
    <label className="note">
      <span>{label}</span>
      <textarea
        maxLength={100000}
        aria-label={label}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
      />
    </label>
  )
}
export function Toggle({
  label,
  checked,
  onChange,
  disabled = false,
}: {
  label: string
  checked: boolean
  onChange: () => void
  disabled?: boolean
}) {
  return (
    <label className="check">
      <input type="checkbox" checked={checked} onChange={onChange} disabled={disabled} />
      {label}
    </label>
  )
}
export function Modal({
  title,
  children,
  onClose,
}: {
  title: string
  children: ReactNode
  onClose: () => void
}) {
  const titleId = useId()
  const ref = useRef<HTMLDialogElement>(null)
  useEffect(() => {
    const dialog = ref.current
    dialog?.showModal()
    return () => dialog?.close()
  }, [])
  return (
    <dialog
      aria-labelledby={titleId}
      ref={ref}
      onCancel={(e) => {
        e.preventDefault()
        onClose()
      }}
      onClick={(e) => {
        if (e.target === ref.current) onClose()
      }}
    >
      <header className="modal-heading">
        <h2 id={titleId}>{title}</h2>
        <button aria-label="Close dialog" onClick={onClose}>
          <X size={20} />
        </button>
      </header>
      {children}
    </dialog>
  )
}
export const num = (value: string, min = 0, max = 999999) =>
  Math.max(min, Math.min(max, Math.trunc(Number(value) || 0)))
export type Update<T> = (patch: Partial<T>) => void

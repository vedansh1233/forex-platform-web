import clsx from 'clsx'
import { AlertCircle, Loader2 } from 'lucide-react'
import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode, SelectHTMLAttributes } from 'react'
import { useId } from 'react'

// --- Button ---

type ButtonVariant = 'primary' | 'secondary' | 'ghost'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  loading?: boolean
}

const buttonVariants: Record<ButtonVariant, string> = {
  primary: 'bg-accent-500 text-ink-950 hover:bg-accent-400 disabled:bg-accent-600/60',
  secondary: 'bg-ink-700 text-ink-100 hover:bg-ink-600 disabled:opacity-60',
  ghost: 'text-ink-300 hover:bg-ink-800 hover:text-ink-100 disabled:opacity-60',
}

export function Button({ variant = 'primary', loading, className, children, disabled, ...props }: ButtonProps) {
  return (
    <button
      className={clsx(
        'inline-flex h-10 items-center justify-center gap-2 rounded-lg px-4 text-sm font-semibold transition-colors disabled:cursor-not-allowed',
        buttonVariants[variant],
        className,
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading && <Loader2 className="size-4 animate-spin" aria-hidden />}
      {children}
    </button>
  )
}

// --- Text field with label and error ---

interface FieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string
  error?: string
  hint?: string
}

export function Field({ label, error, hint, className, ...props }: FieldProps) {
  const id = useId()
  const describedBy = error ? `${id}-error` : hint ? `${id}-hint` : undefined
  return (
    <div className={clsx('flex flex-col gap-1.5', className)}>
      <label htmlFor={id} className="text-sm font-medium text-ink-300">
        {label}
      </label>
      <input
        id={id}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
        className={clsx(
          'h-10 rounded-lg border bg-ink-900 px-3 text-sm text-ink-100 placeholder:text-ink-400 transition-colors',
          'focus:border-accent-400 focus:outline-none',
          error ? 'border-red-400/70' : 'border-ink-700',
        )}
        {...props}
      />
      {error ? (
        <p id={`${id}-error`} className="text-xs text-red-300">
          {error}
        </p>
      ) : hint ? (
        <p id={`${id}-hint`} className="text-xs text-ink-400">
          {hint}
        </p>
      ) : null}
    </div>
  )
}

// --- Select ---

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label: string
  hideLabel?: boolean
}

export function Select({ label, hideLabel, className, children, ...props }: SelectProps) {
  const id = useId()
  return (
    <div className={clsx('flex flex-col gap-1.5', className)}>
      <label htmlFor={id} className={clsx('text-sm font-medium text-ink-300', hideLabel && 'sr-only')}>
        {label}
      </label>
      <select
        id={id}
        className="h-10 rounded-lg border border-ink-700 bg-ink-900 px-3 text-sm text-ink-100 focus:border-accent-400 focus:outline-none"
        {...props}
      >
        {children}
      </select>
    </div>
  )
}

// --- Segmented control (e.g. chart range) ---

export function Segmented<T extends string | number>({
  label,
  options,
  value,
  onChange,
}: {
  label: string
  options: { value: T; label: string }[]
  value: T
  onChange: (value: T) => void
}) {
  return (
    <div role="radiogroup" aria-label={label} className="inline-flex rounded-lg border border-ink-700 bg-ink-900 p-0.5">
      {options.map((option) => (
        <button
          key={String(option.value)}
          type="button"
          role="radio"
          aria-checked={option.value === value}
          onClick={() => onChange(option.value)}
          className={clsx(
            'rounded-md px-3 py-1.5 text-xs font-semibold transition-colors',
            option.value === value ? 'bg-ink-700 text-ink-100' : 'text-ink-400 hover:text-ink-100',
          )}
        >
          {option.label}
        </button>
      ))}
    </div>
  )
}

// --- Card ---

export function Card({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={clsx('rounded-2xl border border-ink-700 bg-ink-900 p-6', className)}>{children}</div>
}

// --- Alert ---

export function ErrorAlert({ children }: { children: ReactNode }) {
  return (
    <div role="alert" className="flex items-start gap-2 rounded-lg border border-red-400/30 bg-red-500/10 p-3 text-sm text-red-200">
      <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden />
      <span>{children}</span>
    </div>
  )
}

// --- Spinner ---

export function FullPageSpinner() {
  return (
    <div className="grid min-h-dvh place-items-center">
      <Loader2 className="size-8 animate-spin text-accent-400" aria-label="Loading" />
    </div>
  )
}

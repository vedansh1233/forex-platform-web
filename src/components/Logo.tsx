import { TrendingUp } from 'lucide-react'

/** @param compact show only the mark below the md breakpoint (the app's mobile top bar) */
export function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <span className="inline-flex shrink-0 items-center gap-2 text-lg font-bold tracking-tight whitespace-nowrap" aria-label="FX Desk">
      <span className="grid size-8 place-items-center rounded-lg bg-accent-500 text-ink-950">
        <TrendingUp className="size-5" aria-hidden />
      </span>
      <span className={compact ? 'hidden md:inline' : undefined} aria-hidden>
        FX Desk
      </span>
    </span>
  )
}

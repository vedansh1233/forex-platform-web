import { TrendingUp } from 'lucide-react'

/** @param compact show only the mark below the md breakpoint (the app's mobile top bar) */
export function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <span className="group inline-flex shrink-0 items-center gap-2 text-lg font-bold tracking-tight whitespace-nowrap" aria-label="FX Desk">
      <span className="btn-glow grid size-8 place-items-center rounded-lg text-ink-950">
        <TrendingUp className="size-5 transition-transform duration-500 group-hover:-rotate-12" aria-hidden />
      </span>
      <span className={compact ? 'hidden font-display md:inline' : 'font-display'} aria-hidden>
        FX Desk
      </span>
    </span>
  )
}

import { TrendingUp } from 'lucide-react'

export function Logo() {
  return (
    <span className="inline-flex shrink-0 items-center gap-2 text-lg font-bold tracking-tight whitespace-nowrap">
      <span className="grid size-8 place-items-center rounded-lg bg-accent-500 text-ink-950">
        <TrendingUp className="size-5" aria-hidden />
      </span>
      FX Desk
    </span>
  )
}

import clsx from 'clsx'
import { Loader2, Zap } from 'lucide-react'
import { DEMO_STEP_LABELS, useDemoLogin } from '../hooks/useDemoLogin'

/** "Try the live demo": signs in to a fresh, pre-funded demo account in one click. */
/** @param quiet a secondary-looking button, for pages whose main action is something else */
export function DemoButton({ className, size = 'md', quiet = false }: { className?: string; size?: 'md' | 'lg'; quiet?: boolean }) {
  const demo = useDemoLogin()

  return (
    <div className={clsx('flex flex-col items-center gap-2', className)}>
      <button
        type="button"
        onClick={() => void demo.start()}
        disabled={demo.pending}
        className={clsx(
          'inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition-colors disabled:cursor-wait',
          quiet ? 'border border-accent-500/40 bg-accent-500/10 text-accent-300 hover:bg-accent-500/20' : 'btn-glow text-ink-950',
          size === 'lg' ? 'h-13 px-7 text-base' : 'h-10 w-full px-4 text-sm',
        )}
      >
        {demo.pending ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <Zap className="size-4" aria-hidden />}
        <span aria-live="polite">{demo.step ? DEMO_STEP_LABELS[demo.step] : 'Try the live demo'}</span>
      </button>
      {demo.error ? (
        <p role="alert" className="text-xs text-red-300">
          {demo.error}
        </p>
      ) : (
        <p className="text-xs text-ink-400">No sign-up. A funded demo account in one click.</p>
      )}
    </div>
  )
}

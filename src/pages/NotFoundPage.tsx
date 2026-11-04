import { Link } from 'react-router'

export function NotFoundPage() {
  return (
    <div className="grid min-h-dvh place-items-center px-4 text-center">
      <div>
        <p className="font-mono text-5xl font-semibold text-accent-400">404</p>
        <h1 className="mt-3 text-xl font-semibold">Page not found</h1>
        <Link to="/" className="mt-6 inline-block text-sm font-medium text-accent-300 hover:underline">
          Back to dashboard
        </Link>
      </div>
    </div>
  )
}

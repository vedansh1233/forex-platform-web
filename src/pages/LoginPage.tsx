import { useState, type FormEvent } from 'react'
import { Link, useLocation, useNavigate } from 'react-router'
import { ApiError } from '../api/client'
import { useAuth } from '../auth/useAuth'
import { AuthShell } from '../components/AuthShell'
import { DemoButton } from '../components/DemoButton'
import { Button, ErrorAlert, Field } from '../components/ui'

export function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const from = (location.state as { from?: string } | null)?.from ?? '/'

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<ApiError | null>(null)
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSubmitting(true)
    setError(null)
    try {
      await login({ email, password })
      navigate(from, { replace: true })
    } catch (err) {
      setError(err instanceof ApiError ? err : new ApiError(0, 'Something went wrong'))
      setSubmitting(false)
    }
  }

  return (
    <AuthShell
      title="Welcome back"
      subtitle="Log in to your trading desk."
      footer={
        <>
          New here?{' '}
          <Link to="/register" className="font-medium text-accent-300 hover:underline">
            Create an account
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
        {error && Object.keys(error.fieldErrors).length === 0 && <ErrorAlert>{error.message}</ErrorAlert>}
        <Field
          label="Email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          error={error?.fieldErrors.email}
        />
        <Field
          label="Password"
          type="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          error={error?.fieldErrors.password}
        />
        <Button type="submit" loading={submitting} className="mt-2 w-full">
          Log in
        </Button>
      </form>
      <div className="my-5 flex items-center gap-3 text-xs text-ink-400" aria-hidden>
        <span className="h-px flex-1 bg-ink-700" />
        or
        <span className="h-px flex-1 bg-ink-700" />
      </div>
      <DemoButton quiet />
    </AuthShell>
  )
}

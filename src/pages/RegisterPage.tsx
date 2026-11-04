import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router'
import { ApiError } from '../api/client'
import { useAuth } from '../auth/useAuth'
import { AuthShell } from '../components/AuthShell'
import { Button, ErrorAlert, Field } from '../components/ui'

export function RegisterPage() {
  const { register } = useAuth()
  const navigate = useNavigate()

  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<ApiError | null>(null)
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSubmitting(true)
    setError(null)
    try {
      // The backend validates too and returns per-field messages, shown below each input
      await register({ fullName, email, password })
      navigate('/', { replace: true })
    } catch (err) {
      setError(err instanceof ApiError ? err : new ApiError(0, 'Something went wrong'))
      setSubmitting(false)
    }
  }

  return (
    <AuthShell
      title="Create your account"
      subtitle="Start with a $10,000 demo balance. No real money involved."
      footer={
        <>
          Already have an account?{' '}
          <Link to="/login" className="font-medium text-accent-300 hover:underline">
            Log in
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
        {error && Object.keys(error.fieldErrors).length === 0 && <ErrorAlert>{error.message}</ErrorAlert>}
        <Field
          label="Full name"
          autoComplete="name"
          required
          maxLength={100}
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          error={error?.fieldErrors.fullName}
        />
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
          autoComplete="new-password"
          required
          minLength={8}
          maxLength={72}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          error={error?.fieldErrors.password}
          hint="At least 8 characters."
        />
        <Button type="submit" loading={submitting} className="mt-2 w-full">
          Create account
        </Button>
      </form>
    </AuthShell>
  )
}

import { useState } from 'react'
import { Link } from 'react-router-dom'
import AuthForm from '../components/AuthForm'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'

function ForgotPasswordPage() {
  const [values, setValues] = useState({ email: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const { forgotPassword } = useAuth()
  const { addToast } = useToast()

  const handleChange = (event) => {
    const { name, value } = event.target
    setValues((current) => ({ ...current, [name]: value }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setLoading(true)
    setError('')

    try {
      await forgotPassword(values.email)
      addToast({ title: 'Reset email sent. Check your inbox.' })
    } catch (requestError) {
      setError(requestError.message)
      addToast({ title: requestError.message, type: 'error' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="px-4 py-10 sm:px-6">
      <AuthForm
        title="Forgot Password"
        subtitle="Enter your email to generate a password reset link."
        submitLabel="Generate Reset Link"
        values={values}
        onChange={handleChange}
        onSubmit={handleSubmit}
        error={error}
        loading={loading}
        footer={
          <div className="mt-5 space-y-3 text-sm text-white/65">
            <p>
              Back to{' '}
              <Link to="/login" className="text-gold">
                login
              </Link>
            </p>
          </div>
        }
      />
    </main>
  )
}

export default ForgotPasswordPage

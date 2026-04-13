import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import AuthForm from '../components/AuthForm'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'

function ResetPasswordPage() {
  const [values, setValues] = useState({ password: '', confirmPassword: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const { token } = useParams()
  const { resetPassword } = useAuth()
  const { addToast } = useToast()
  const navigate = useNavigate()

  const handleChange = (event) => {
    const { name, value } = event.target
    setValues((current) => ({ ...current, [name]: value }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')

    if (values.password !== values.confirmPassword) {
      const message = 'Passwords do not match.'
      setError(message)
      addToast({ title: message, type: 'error' })
      return
    }

    setLoading(true)

    try {
      await resetPassword(token, values.password)
      addToast({ title: 'Password reset successful.' })
      navigate('/login')
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
        title="Reset Password"
        subtitle="Choose a new password for your account."
        submitLabel="Reset Password"
        values={values}
        onChange={handleChange}
        onSubmit={handleSubmit}
        error={error}
        loading={loading}
        footer={
          <p className="mt-5 text-sm text-white/65">
            Back to{' '}
            <Link to="/login" className="text-gold">
              login
            </Link>
          </p>
        }
      />
    </main>
  )
}

export default ResetPasswordPage

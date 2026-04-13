import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import AuthForm from '../components/AuthForm'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'

function LoginPage() {
  const [values, setValues] = useState({ email: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const { addToast } = useToast()
  const navigate = useNavigate()

  const handleChange = (event) => {
    const { name, value } = event.target
    setValues((current) => ({ ...current, [name]: value }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setLoading(true)
    setError('')

    try {
      await login(values)
      addToast({ title: 'Login successful.' })
      navigate('/')
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
        title="Login"
        subtitle="Sign in to your account to continue shopping or manage your store."
        submitLabel="Login"
        values={values}
        onChange={handleChange}
        onSubmit={handleSubmit}
        error={error}
        loading={loading}
        extra={
          <Link to="/forgot-password" className="block text-sm text-gold">
            Forgot password?
          </Link>
        }
        footer={
          <p className="mt-5 text-sm text-white/65">
            Don&apos;t have an account?{' '}
            <Link to="/signup" className="text-gold">
              Create one
            </Link>
          </p>
        }
      />
    </main>
  )
}

export default LoginPage

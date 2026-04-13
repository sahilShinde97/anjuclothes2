import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import AuthForm from '../components/AuthForm'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'

function SignupPage() {
  const [values, setValues] = useState({ name: '', email: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { register } = useAuth()
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
      await register(values)
      addToast({ title: 'Account created successfully.' })
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
        title="Create Account"
        subtitle="Sign up to shop and access your account. Admin role is assigned from the backend."
        submitLabel="Sign Up"
        values={values}
        onChange={handleChange}
        onSubmit={handleSubmit}
        error={error}
        loading={loading}
        footer={
          <p className="mt-5 text-sm text-white/65">
            Already have an account?{' '}
            <Link to="/login" className="text-gold">
              Login
            </Link>
          </p>
        }
      />
    </main>
  )
}

export default SignupPage

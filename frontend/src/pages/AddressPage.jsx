import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'

function AddressPage() {
  const { user, updateProfile, refreshProfile } = useAuth()
  const { addToast } = useToast()
  const navigate = useNavigate()
  const [values, setValues] = useState({ name: '', phone: '', address: '' })
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (user) {
      setValues({ name: user.name || '', phone: user.phone || '', address: user.address || '' })
    }
  }, [user])

  useEffect(() => {
    refreshProfile().catch(() => {})
  }, [])

  const handleChange = (event) => {
    const { name, value } = event.target
    setValues((current) => ({ ...current, [name]: value }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setLoading(true)
    try {
      await updateProfile(values)
      addToast({ title: 'Address updated successfully.' })
      navigate('/checkout')
    } catch (error) {
      addToast({ title: error.message, type: 'error' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="mx-auto max-w-3xl px-4 py-6 sm:px-6">
      <section className="rounded-[1.6rem] border border-white/10 bg-[#141416] p-5 shadow-glow sm:p-6">
        <p className="text-sm uppercase tracking-[0.24em] text-gold">Address</p>
        <h1 className="mt-2 font-heading text-4xl text-white">Shipping details</h1>
        <form onSubmit={handleSubmit} className="mt-5 grid gap-4 sm:grid-cols-2">
          <label className="space-y-2 sm:col-span-2"><span className="text-sm font-medium">Name</span><input name="name" value={values.name} onChange={handleChange} className="min-h-[48px] w-full rounded-2xl border border-white/10 bg-white/5 px-4 text-sm outline-none" /></label>
          <label className="space-y-2"><span className="text-sm font-medium">Phone</span><input name="phone" value={values.phone} onChange={handleChange} className="min-h-[48px] w-full rounded-2xl border border-white/10 bg-white/5 px-4 text-sm outline-none" /></label>
          <div />
          <label className="space-y-2 sm:col-span-2"><span className="text-sm font-medium">Address</span><textarea name="address" rows="5" value={values.address} onChange={handleChange} className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm outline-none" /></label>
          <div className="sm:col-span-2 flex gap-3">
            <button type="submit" disabled={loading} className="inline-flex min-h-[48px] items-center justify-center rounded-full bg-gold px-5 text-sm font-semibold text-black disabled:opacity-70">{loading ? 'Saving...' : 'Save Address'}</button>
          </div>
        </form>
      </section>
    </main>
  )
}

export default AddressPage

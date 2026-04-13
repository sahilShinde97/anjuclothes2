function AuthForm({ title, subtitle, submitLabel, values, onChange, onSubmit, error, loading, extra, footer }) {
  return (
    <section className="mx-auto max-w-md rounded-[1.6rem] border border-white/10 bg-[#141416] p-5 shadow-glow sm:p-6">
      <p className="text-sm uppercase tracking-[0.24em] text-gold">Account</p>
      <h1 className="mt-2 font-heading text-4xl text-white">{title}</h1>
      <p className="mt-3 text-sm leading-7 text-white/65">{subtitle}</p>

      <form onSubmit={onSubmit} className="mt-5 space-y-4">
        {'name' in values ? (
          <label className="block space-y-2">
            <span className="text-sm font-medium">Name</span>
            <input required name="name" value={values.name} onChange={onChange} className="min-h-[48px] w-full rounded-2xl border border-white/10 bg-white/5 px-4 text-sm outline-none" />
          </label>
        ) : null}

        <label className="block space-y-2">
          <span className="text-sm font-medium">Email</span>
          <input required type="email" name="email" value={values.email} onChange={onChange} className="min-h-[48px] w-full rounded-2xl border border-white/10 bg-white/5 px-4 text-sm outline-none" />
        </label>

        {'password' in values ? (
          <label className="block space-y-2">
            <span className="text-sm font-medium">Password</span>
            <input required type="password" name="password" value={values.password} onChange={onChange} className="min-h-[48px] w-full rounded-2xl border border-white/10 bg-white/5 px-4 text-sm outline-none" />
          </label>
        ) : null}

        {'confirmPassword' in values ? (
          <label className="block space-y-2">
            <span className="text-sm font-medium">Confirm Password</span>
            <input required type="password" name="confirmPassword" value={values.confirmPassword} onChange={onChange} className="min-h-[48px] w-full rounded-2xl border border-white/10 bg-white/5 px-4 text-sm outline-none" />
          </label>
        ) : null}

        {extra}

        <button type="submit" disabled={loading} className="inline-flex min-h-[48px] w-full items-center justify-center rounded-full bg-gold px-5 text-sm font-semibold uppercase tracking-[0.18em] text-black transition hover:bg-[#e5c17f] disabled:opacity-70">
          {loading ? 'Please wait...' : submitLabel}
        </button>

        {error ? <p className="text-sm text-red-400">{error}</p> : null}
      </form>

      {footer}
    </section>
  )
}

export default AuthForm

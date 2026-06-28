function PageLoader({ label = 'Loading' }) {
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 px-4 py-16" role="status" aria-live="polite">
      <div className="h-10 w-10 animate-spin rounded-full border-[3px] border-white/20 border-t-gold" />
      <p className="text-xs uppercase tracking-[0.18em] text-white/60">{label}</p>
    </div>
  )
}

export default PageLoader

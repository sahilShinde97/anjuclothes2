function SkeletonCard() {
  return (
    <div className="overflow-hidden rounded-[1.5rem] border border-white/10 bg-[#141416] p-4 shadow-glow animate-pulse">
      <div className="aspect-[4/5] rounded-[1.2rem] bg-white/5" />
      <div className="mt-4 h-5 w-3/4 rounded-full bg-white/5" />
      <div className="mt-3 h-5 w-1/3 rounded-full bg-white/5" />
      <div className="mt-4 h-11 rounded-full bg-white/5" />
    </div>
  )
}

export default SkeletonCard

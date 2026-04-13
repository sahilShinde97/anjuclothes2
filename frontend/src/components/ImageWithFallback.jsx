import { useState } from 'react'

function ImageWithFallback({ src, alt, className, fallbackClassName = '' }) {
  const [failed, setFailed] = useState(false)

  if (failed || !src) {
    return (
      <div className={`flex items-center justify-center bg-white/5 text-xs uppercase tracking-[0.18em] text-white/45 ${className} ${fallbackClassName}`}>
        No Image
      </div>
    )
  }

  return <img src={src} alt={alt} className={className} onError={() => setFailed(true)} />
}

export default ImageWithFallback

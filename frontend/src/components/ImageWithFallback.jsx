import { useEffect, useRef, useState } from 'react'

function ImageWithFallback({
  src,
  alt,
  className,
  fallbackClassName = '',
  loading = 'lazy',
  fetchPriority = 'auto',
  sizes,
}) {
  const [failed, setFailed] = useState(false)
  const [loaded, setLoaded] = useState(false)
  const imageRef = useRef(null)

  useEffect(() => {
    setFailed(false)
    setLoaded(false)
  }, [src])

  useEffect(() => {
    if (!src) {
      return undefined
    }

    const imageElement = imageRef.current
    if (imageElement?.complete && imageElement.naturalWidth > 0) {
      setLoaded(true)
      return undefined
    }

    const fallbackTimer = window.setTimeout(() => {
      setLoaded(true)
    }, 1400)

    return () => window.clearTimeout(fallbackTimer)
  }, [src])

  if (failed || !src) {
    return (
      <div className={`flex items-center justify-center bg-white/5 text-xs uppercase tracking-[0.18em] text-white/45 ${className} ${fallbackClassName}`}>
        No Image
      </div>
    )
  }

  return (
    <div className={`relative overflow-hidden ${className}`}>
      {!loaded ? (
        <div className="absolute inset-0 animate-pulse bg-white/10" aria-hidden="true" />
      ) : null}
      <img
        ref={imageRef}
        src={src}
        alt={alt}
        className={`${className} transition-opacity duration-300 opacity-100`}
        onError={() => setFailed(true)}
        onLoad={() => setLoaded(true)}
        loading={loading}
        decoding="async"
        fetchPriority={fetchPriority}
        sizes={sizes}
      />
    </div>
  )
}

export default ImageWithFallback

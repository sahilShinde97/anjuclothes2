import { memo, useEffect, useMemo, useRef, useState } from 'react'
import { getOptimizedImageUrl, getOptimizedSrcSet, IMAGE_SIZES } from '../lib/images'

function ImageWithFallback({
  src,
  alt,
  className = '',
  loading = 'lazy',
  fetchPriority = 'auto',
  sizes,
  width,
  height,
  preset = 'card',
}) {
  const [failed, setFailed] = useState(false)
  const [loaded, setLoaded] = useState(false)
  const imageRef = useRef(null)
  const resolvedWidth = width || IMAGE_SIZES[preset] || IMAGE_SIZES.card
  const optimizedSrc = useMemo(
    () => getOptimizedImageUrl(src, { width: resolvedWidth, height, preset }),
    [height, preset, resolvedWidth, src],
  )
  const srcSet = useMemo(
    () => (loading === 'eager' ? getOptimizedSrcSet(src, [480, 640, 960, 1200]) : getOptimizedSrcSet(src)),
    [loading, src],
  )

  useEffect(() => {
    setFailed(false)
    setLoaded(false)
  }, [optimizedSrc])

  useEffect(() => {
    if (!optimizedSrc) {
      return undefined
    }

    const imageElement = imageRef.current
    if (imageElement?.complete && imageElement.naturalWidth > 0) {
      setLoaded(true)
      return undefined
    }

    return undefined
  }, [optimizedSrc])

  if (failed || !optimizedSrc) {
    return (
      <div
        aria-label={alt}
        className={`flex items-center justify-center bg-white/5 text-xs uppercase tracking-[0.18em] text-white/45 ${className}`}
      >
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
        src={optimizedSrc}
        srcSet={srcSet}
        alt={alt}
        width={resolvedWidth}
        height={height}
        sizes={sizes || (preset === 'banner' ? '100vw' : preset === 'card' ? '(max-width: 640px) 50vw, 25vw' : undefined)}
        className="h-full w-full object-cover transition-opacity duration-300"
        style={{ opacity: loaded ? 1 : 0 }}
        onError={() => setFailed(true)}
        onLoad={() => setLoaded(true)}
        loading={loading}
        decoding="async"
        fetchPriority={fetchPriority}
      />
    </div>
  )
}

export default memo(ImageWithFallback)

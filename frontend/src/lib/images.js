export const IMAGE_SIZES = {
  thumb: 160,
  card: 420,
  hero: 800,
  banner: 1200,
  gallery: 960,
}

export function getOptimizedImageUrl(src, options = {}) {
  if (!src) {
    return src
  }

  const preset = options.preset && IMAGE_SIZES[options.preset]
  const width = options.width || preset || IMAGE_SIZES.card
  const { height, quality = 'auto' } = options

  if (src.includes('res.cloudinary.com') && src.includes('/upload/')) {
    const transforms = ['f_auto', `q_${quality}`, 'dpr_auto', `w_${width}`]

    if (height) {
      transforms.push(`h_${height}`, 'c_fill')
    }

    return src.replace('/upload/', `/upload/${transforms.join(',')}/`)
  }

  if (src.includes('images.unsplash.com')) {
    try {
      const url = new URL(src)
      url.searchParams.set('auto', 'format')
      url.searchParams.set('q', quality === 'auto' ? '75' : String(quality))
      url.searchParams.set('w', String(width))
      if (height) {
        url.searchParams.set('h', String(height))
        url.searchParams.set('fit', 'crop')
      }
      return url.toString()
    } catch {
      return src
    }
  }

  return src
}

export function getOptimizedSrcSet(src, widths = [320, 480, 640, 800]) {
  if (!src || !src.includes('res.cloudinary.com')) {
    return undefined
  }

  return widths
    .map((width) => `${getOptimizedImageUrl(src, { width })} ${width}w`)
    .join(', ')
}

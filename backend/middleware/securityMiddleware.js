const DANGEROUS_KEYS = ['$where', '$regex', '$ne', '$gt', '$gte', '$lt', '$lte', '$in', '$nin', '$or', '$and']

function sanitizeString(value) {
  if (typeof value !== 'string') {
    return value
  }

  return value
    .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+="[^"]*"/gi, '')
    .trim()
}

function sanitizeValue(value) {
  if (Array.isArray(value)) {
    return value.map(sanitizeValue)
  }

  if (value && typeof value === 'object') {
    const output = {}
    for (const [key, nestedValue] of Object.entries(value)) {
      if (key.startsWith('$') || key.includes('.') || DANGEROUS_KEYS.includes(key)) {
        continue
      }
      output[key] = sanitizeValue(nestedValue)
    }
    return output
  }

  return sanitizeString(value)
}

export function sanitizeRequest(req, _res, next) {
  req.body = sanitizeValue(req.body)
  req.query = sanitizeValue(req.query)
  req.params = sanitizeValue(req.params)
  next()
}

export function requireIdempotencyKey(req, res, next) {
  const key = req.headers['x-idempotency-key']
  if (!key || typeof key !== 'string' || key.trim().length < 10) {
    return res.status(400).json({ message: 'Valid idempotency key is required.' })
  }
  req.idempotencyKey = key.trim().slice(0, 128)
  return next()
}

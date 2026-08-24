export function parseAmericanOdds(text: string): number | null {
  const cleaned = text.trim().replace(/^\+/, '')
  const value = Number(cleaned)
  if (!Number.isFinite(value) || value === 0) return null
  if (Math.abs(value) < 100) return null
  return value
}

export function parseStake(text: string): number | null {
  const value = Number(text.trim().replace(/^\$/, ''))
  if (!Number.isFinite(value) || value <= 0) return null
  return value
}

export function parsePositiveInt(text: string): number | null {
  const value = Number(text.trim())
  if (!Number.isFinite(value) || value < 0) return null
  return Math.round(value)
}

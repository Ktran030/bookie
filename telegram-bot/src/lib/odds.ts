export type OddsFormat = 'american' | 'decimal'

/** Converts American odds (e.g. +150, -200) to decimal odds (e.g. 2.5, 1.5). */
export function americanToDecimal(american: number): number {
  if (american === 0) throw new Error('American odds cannot be 0')
  return american > 0 ? 1 + american / 100 : 1 + 100 / -american
}

/** Converts decimal odds (must be > 1) to American odds. */
export function decimalToAmerican(decimal: number): number {
  if (decimal <= 1) throw new Error('Decimal odds must be greater than 1')
  return decimal >= 2 ? (decimal - 1) * 100 : -100 / (decimal - 1)
}

/** Normalizes odds of either format into decimal odds. */
export function toDecimal(value: number, format: OddsFormat): number {
  return format === 'american' ? americanToDecimal(value) : value
}

/** Converts decimal odds into the market's implied probability (0-1), vig included. */
export function impliedProbability(decimal: number): number {
  return 1 / decimal
}

/** Formats American odds with an explicit +/- sign. */
export function formatAmerican(american: number): string {
  const rounded = Math.round(american)
  return rounded > 0 ? `+${rounded}` : `${rounded}`
}

export function formatDecimal(decimal: number): string {
  return decimal.toFixed(3)
}

export function formatPercent(fraction: number): string {
  return `${(fraction * 100).toFixed(2)}%`
}

export function formatCurrency(amount: number): string {
  const sign = amount < 0 ? '-' : ''
  return `${sign}$${Math.abs(amount).toFixed(2)}`
}

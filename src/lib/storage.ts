import type { Bet } from '../types/bet'

const STORAGE_KEY = 'bookie.bets.v1'

export function loadBets(): Bet[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export function saveBets(bets: Bet[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(bets))
}

export function generateId(): string {
  return crypto.randomUUID()
}

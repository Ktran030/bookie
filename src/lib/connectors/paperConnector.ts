import type { BookConnector, PlaceBetConfirmation, PlaceBetOrder } from '../../types/connector'

const PAPER_BALANCE_KEY = 'bookie.paperBalance.v1'
const DEFAULT_BALANCE = 1000

function getBalance(): number {
  const raw = localStorage.getItem(PAPER_BALANCE_KEY)
  return raw ? Number(raw) : DEFAULT_BALANCE
}

function setBalance(balance: number): void {
  localStorage.setItem(PAPER_BALANCE_KEY, String(balance))
}

export function resetPaperBalance(): void {
  setBalance(DEFAULT_BALANCE)
}

/**
 * A fully automated connector that executes instantly — against a fake,
 * locally-stored balance instead of a real sportsbook. It exists to prove
 * out the automated-placement pipeline end-to-end (this is what a real
 * connector would plug into) without touching a real account or violating
 * any sportsbook's terms of service. See README.md in this folder.
 */
export const paperConnector: BookConnector = {
  id: 'paper',
  label: 'Paper trading (simulated, automated)',
  description:
    'Instantly "places" the hedge against a fake balance stored on this device. Fully automated, zero real-world risk.',
  isAutomated: true,
  async placeBet(order: PlaceBetOrder): Promise<PlaceBetConfirmation> {
    const balance = getBalance()
    if (order.stake > balance) {
      return {
        success: false,
        message: `Insufficient paper balance ($${balance.toFixed(2)}) for a $${order.stake.toFixed(2)} stake.`,
        placedAt: new Date().toISOString(),
      }
    }
    setBalance(balance - order.stake)
    return {
      success: true,
      message: `Paper bet placed at ${order.book}: $${order.stake.toFixed(2)} on ${order.side} (${order.market}). Remaining paper balance: $${(balance - order.stake).toFixed(2)}.`,
      placedAt: new Date().toISOString(),
    }
  },
}

export function getPaperBalance(): number {
  return getBalance()
}

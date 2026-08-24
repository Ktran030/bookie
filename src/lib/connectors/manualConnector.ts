import type { BookConnector, PlaceBetConfirmation, PlaceBetOrder } from '../../types/connector'
import { formatAmerican } from '../odds'

/**
 * The default, always-available connector. It never touches a real
 * sportsbook account — it just hands back a copy-pasteable bet slip
 * so you can place the hedge yourself in that book's app or site.
 */
export const manualConnector: BookConnector = {
  id: 'manual',
  label: 'Manual (copy bet slip)',
  description: 'Generates the exact bet to place yourself. No account access, no automation.',
  isAutomated: false,
  async placeBet(order: PlaceBetOrder): Promise<PlaceBetConfirmation> {
    const slip = [
      `Book: ${order.book}`,
      `Event: ${order.event}`,
      `Market: ${order.market}`,
      `Side: ${order.side}`,
      `Odds: ${formatAmerican(order.americanOdds)}`,
      `Stake: $${order.stake.toFixed(2)}`,
    ].join('\n')

    return {
      success: true,
      message: `Place this bet manually:\n${slip}`,
      placedAt: new Date().toISOString(),
    }
  },
}

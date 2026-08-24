export interface PlaceBetOrder {
  book: string
  event: string
  market: string
  side: string
  americanOdds: number
  stake: number
}

export interface PlaceBetConfirmation {
  success: boolean
  /** Human-readable outcome, e.g. a confirmation number or an instruction. */
  message: string
  placedAt: string
}

/**
 * A BookConnector is the only extension point meant for placing a hedge bet
 * at a second sportsbook. `isAutomated` connectors execute without a human
 * in the loop; non-automated ones hand back instructions for a person to
 * execute manually. See src/lib/connectors/README.md before implementing a
 * connector against a real sportsbook.
 */
export interface BookConnector {
  id: string
  label: string
  description: string
  isAutomated: boolean
  placeBet(order: PlaceBetOrder): Promise<PlaceBetConfirmation>
}

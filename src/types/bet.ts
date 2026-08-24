export type BetStatus = 'open' | 'hedged' | 'won' | 'lost' | 'pushed'

export interface Bet {
  id: string
  createdAt: string
  book: string
  event: string
  market: string
  side: string
  americanOdds: number
  stake: number
  status: BetStatus
  /** id of the opposing bet this one hedges, if any */
  hedgeOfBetId?: string
  notes?: string
}

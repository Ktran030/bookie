import { impliedProbability } from './odds.js'

export interface HedgeInput {
  /** Stake already placed on the original bet, in dollars. */
  originalStake: number
  /** Decimal odds of the original bet (already placed at book A). */
  originalDecimalOdds: number
  /** Decimal odds currently available for the opposing side at book B. */
  hedgeDecimalOdds: number
}

export interface HedgeResult {
  /** Stake to place at book B that equalizes profit across both outcomes. */
  hedgeStakeForEqualProfit: number
  /** Total amount at risk across both books once the hedge is placed. */
  totalStaked: number
  /** Profit/loss if the original bet's side wins, given the equalizing hedge stake. */
  profitIfOriginalWins: number
  /** Profit/loss if the hedge bet's side wins, given the equalizing hedge stake. */
  profitIfHedgeWins: number
  /** The smaller of the two profits above — what you're guaranteed to walk away with. */
  guaranteedProfit: number
  /** True when the combined implied probabilities are under 100%, i.e. a true (risk-free, profit-guaranteed) arbitrage exists. */
  isArbitrage: boolean
  /** Combined implied probability of both legs; under 1.0 means an arbitrage exists. */
  combinedImpliedProbability: number
}

/**
 * Computes the hedge stake at book B that makes profit identical no matter which
 * side wins: hedgeStake = (originalStake * originalDecimalOdds) / hedgeDecimalOdds.
 * Whether that equal profit is positive (true arbitrage) or negative (a paid-for
 * reduction in variance) depends on the two books' odds.
 */
export function computeHedge({
  originalStake,
  originalDecimalOdds,
  hedgeDecimalOdds,
}: HedgeInput): HedgeResult {
  if (originalStake <= 0) throw new Error('Original stake must be positive')
  if (originalDecimalOdds <= 1) throw new Error('Original decimal odds must be > 1')
  if (hedgeDecimalOdds <= 1) throw new Error('Hedge decimal odds must be > 1')

  const originalPayout = originalStake * originalDecimalOdds
  const hedgeStakeForEqualProfit = originalPayout / hedgeDecimalOdds

  const profitIfOriginalWins = originalPayout - originalStake - hedgeStakeForEqualProfit
  const profitIfHedgeWins =
    hedgeStakeForEqualProfit * hedgeDecimalOdds - hedgeStakeForEqualProfit - originalStake

  const combinedImpliedProbability =
    impliedProbability(originalDecimalOdds) + impliedProbability(hedgeDecimalOdds)

  return {
    hedgeStakeForEqualProfit,
    totalStaked: originalStake + hedgeStakeForEqualProfit,
    profitIfOriginalWins,
    profitIfHedgeWins,
    guaranteedProfit: Math.min(profitIfOriginalWins, profitIfHedgeWins),
    isArbitrage: combinedImpliedProbability < 1,
    combinedImpliedProbability,
  }
}

export interface HedgeAtCustomStakeResult {
  profitIfOriginalWins: number
  profitIfHedgeWins: number
  totalStaked: number
}

/** Same outcome math as computeHedge, but for a hedge stake you choose yourself. */
export function evaluateCustomHedgeStake(
  input: HedgeInput & { hedgeStake: number },
): HedgeAtCustomStakeResult {
  const { originalStake, originalDecimalOdds, hedgeDecimalOdds, hedgeStake } = input
  const originalPayout = originalStake * originalDecimalOdds
  return {
    profitIfOriginalWins: originalPayout - originalStake - hedgeStake,
    profitIfHedgeWins: hedgeStake * hedgeDecimalOdds - hedgeStake - originalStake,
    totalStaked: originalStake + hedgeStake,
  }
}

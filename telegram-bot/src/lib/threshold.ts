/**
 * A two-outcome American-odds market has no vig exactly when the two sides'
 * odds are sign-flipped mirrors of each other (+150 <-> -150: 40% + 60% = 100%).
 * We use that mirror as the "fair" line to measure odds drift against, in
 * American-odds points, matching how bettors already talk about lines.
 *
 * This is most meaningful for odds roughly in the -300..+300 range, where
 * American points move close to linearly with implied probability. Far
 * outside that range the same point gap represents a much bigger probability
 * swing, so a fixed point threshold gets more conservative automatically.
 */
export function mirrorAmerican(americanOdds: number): number {
  return -americanOdds
}

export interface ThresholdCheck {
  mirrorOdds: number
  /** hedgeOdds - mirrorOdds. Positive means the hedge odds are BETTER than fair, negative means worse. */
  pointsFromFair: number
  withinThreshold: boolean
}

/**
 * Checks how far the hedge book's odds have drifted from the fair mirror of
 * the original bet's odds, in American-odds points. `maxPointsWorse` is how
 * much worse than fair you're willing to accept before flagging it.
 */
export function checkOddsDrift(
  originalAmericanOdds: number,
  hedgeAmericanOdds: number,
  maxPointsWorse: number,
): ThresholdCheck {
  const mirrorOdds = mirrorAmerican(originalAmericanOdds)
  const pointsFromFair = hedgeAmericanOdds - mirrorOdds
  return {
    mirrorOdds,
    pointsFromFair,
    withinThreshold: pointsFromFair >= -maxPointsWorse,
  }
}

export const DEFAULT_MAX_POINTS_WORSE = 30

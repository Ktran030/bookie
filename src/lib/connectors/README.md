# Book connectors

`BookConnector` (see `src/types/connector.ts`) is the extension point for
placing the hedge leg of a bet at a second sportsbook. Two connectors ship
today:

- **manualConnector** — always safe, produces a bet slip for you to enter
  yourself.
- **paperConnector** — fully automated, but against a fake balance stored in
  `localStorage`. Use it to test the automated-placement flow risk-free.

## Why there's no connector for DraftKings / FanDuel / BetMGM / etc.

None of the major US sportsbooks publish a public API for retail bettors to
place bets programmatically. The only way to automate placement against them
today is to reverse-engineer their private app/web APIs and script a login,
which:

- **Violates their Terms of Service.** Every major book's ToS prohibits bots,
  scripts, or automated wagering, and reserves the right to void bets, seize
  winnings, and permanently ban the account.
- **Is fragile and unsafe to run unattended.** These endpoints change without
  notice, are protected by device fingerprinting/CAPTCHAs, and a bug in a bet
  submission script places a real, unconfirmed, real-money wager.
- **Puts your funds at risk with no recourse.** A banned account can mean
  frozen funds pending "review," with no customer support path built for bots.

If you have a legitimate integration available to you — e.g. an affiliate or
B2B odds/settlement API a book has actually issued to you — implement
`BookConnector` against it and register it in `src/lib/connectors/index.ts`.
Everything else in this app (the hedge math, the tracker, the UI) will work
with it unmodified. Absent that, use the manual connector: the app still
computes the exact stake and bet slip for you, you just place it yourself.

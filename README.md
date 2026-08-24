# Bookie

A hedge-betting assistant: log a bet you've already placed at one sportsbook,
enter the odds available for the opposing side at another book, and it
computes the exact stake to hedge with, your guaranteed outcome either way,
and whether it's a true (risk-free) arbitrage.

## Features

- **Hedge Calculator** — American or decimal odds in, exact hedge stake and
  profit/loss for both outcomes out, plus an arbitrage flag.
- **Bet Tracker** — logs every bet (and its linked hedge) to `localStorage`,
  with running totals and realized P&L as you settle bets.
- **Automation** — a pluggable `BookConnector` interface for placing the
  hedge leg. Ships with a manual connector (generates a bet slip for you to
  enter yourself) and a fully automated paper-trading connector (executes
  instantly against a fake local balance, for testing the flow risk-free).
  See `src/lib/connectors/README.md` for why there's no connector that logs
  into real sportsbook accounts.

## Development

```bash
npm install
npm run dev      # start the dev server
npm run build    # typecheck + production build
```

Built with React, TypeScript, Vite, and Tailwind CSS v4. All data lives in
the browser's `localStorage` — there is no backend.

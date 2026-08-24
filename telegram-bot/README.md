# Bookie hedge bot (Telegram)

A Telegram bot for the workflow: you place a bet at one book, tell the bot,
then when you check the other book you get an instant, exact hedge stake —
with a configurable cutoff so it flags lines that have drifted too far to be
worth hedging. **It never logs into any sportsbook or places a bet for you.**
You place every bet yourself; the bot only does the math and remembers your
history. See the root [README](../README.md) and
[src/lib/connectors/README.md](../src/lib/connectors/README.md) in the web
app for why real auto-placement isn't on the table.

## How the math works

- `originalOdds` is the American odds you already got on your side.
- The bot computes the **mirror** of that (sign-flipped: +150 → -150), which
  is the exact no-vig fair line for the opposing side.
- Your `/threshold` setting (default 30) is how many points worse than that
  mirror you're willing to accept at the second book before the bot warns
  you instead of quietly running the numbers. E.g. with a 30-point limit and
  a +150 original bet, hedge odds worse than -180 get flagged.
- The hedge stake itself is `(originalStake × originalDecimalOdds) ÷ hedgeDecimalOdds`
  — the stake that makes your profit identical no matter which side wins.

## Commands

- `/bet` — walks you through logging a bet you just placed (book, event/side, odds, stake)
- `/hedge` — pick an open bet, tell it the other book's current odds, get the hedge stake + a confirm/skip button
- `/history` — last 10 bets logged
- `/pnl` — total staked and realized profit/loss across settled bets
- `/threshold [points]` — view or change your odds-drift cutoff
- `/cancel` — bail out of `/bet` or `/hedge` mid-flow

## Run it locally

```bash
npm install
cp .env.example .env   # then paste in your bot token
npm run dev
```

Getting a token: open Telegram, message **@BotFather**, send `/newbot`,
follow the prompts, and it gives you a token like `123456:AAF...`. Paste
that into `.env` as `TELEGRAM_BOT_TOKEN`.

## Running it 24/7

This doesn't need to live on a Raspberry Pi or any machine you own — it's a
small process that just waits for Telegram messages, so a cheap always-on
host is simpler and more reliable (no dependency on your home power/internet,
no port forwarding). Two options:

### Fly.io (recommended)

```bash
fly launch --no-deploy   # creates the app from fly.toml, skip the initial deploy prompt
fly volumes create bookie_data --size 1   # persistent disk for the SQLite file
fly secrets set TELEGRAM_BOT_TOKEN=123456:AAF...
fly deploy
```

`fly.toml` and the `Dockerfile` are already set up — the bot's SQLite database
lives on the `bookie_data` volume so it survives redeploys. Note: the Docker
build wasn't verified in this environment (no Docker daemon available here);
if `fly deploy` fails on the build step, run `docker build .` locally first
to debug it before retrying.

### Your Raspberry Pi

If you'd rather run it on the Pi anyway (e.g. to keep everything local), it
works the same way — just less resilient to power/internet blips at home:

```bash
docker build -t bookie-hedge-bot .
docker run -d --restart unless-stopped \
  -e TELEGRAM_BOT_TOKEN=123456:AAF... \
  -v bookie_data:/app/data \
  bookie-hedge-bot
```

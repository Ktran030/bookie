import 'dotenv/config'
import { Telegraf, Scenes, session } from 'telegraf'
import type { MyContext } from './context.js'
import { store } from './db.js'
import { betScene } from './scenes/betScene.js'
import { hedgeScene } from './scenes/hedgeScene.js'
import { americanToDecimal, formatAmerican, formatCurrency } from './lib/odds.js'
import { parsePositiveInt } from './parse.js'
import { DEFAULT_MAX_POINTS_WORSE } from './lib/threshold.js'

const token = process.env.TELEGRAM_BOT_TOKEN
if (!token) {
  throw new Error('TELEGRAM_BOT_TOKEN is not set. Create a bot with @BotFather and put the token in .env')
}

const bot = new Telegraf<MyContext>(token)
bot.use(session())

const stage = new Scenes.Stage<MyContext>([betScene, hedgeScene])
bot.use(stage.middleware())

const HELP_TEXT = [
  'Bookie hedge bot — logs bets and tells you the exact hedge to place at another book.',
  '',
  '/bet — log a bet you just placed',
  '/hedge — get the hedge stake for an open bet, checked against your odds-drift limit',
  '/history — your last 10 bets',
  '/pnl — totals across all logged bets',
  '/threshold [points] — view or set your max acceptable points-worse-than-fair (default 30)',
  '/cancel — stop whatever you\'re in the middle of',
].join('\n')

bot.start((ctx) => ctx.reply(HELP_TEXT))
bot.help((ctx) => ctx.reply(HELP_TEXT))

bot.command('cancel', async (ctx) => {
  if (ctx.scene.current) {
    await ctx.scene.leave()
    await ctx.reply('Cancelled.')
  } else {
    await ctx.reply('Nothing to cancel.')
  }
})

bot.command('bet', (ctx) => ctx.scene.enter('bet-wizard'))
bot.command('hedge', (ctx) => ctx.scene.enter('hedge-wizard'))

bot.command('threshold', async (ctx) => {
  const chatId = String(ctx.chat.id)
  const arg = ctx.message.text.split(' ').slice(1).join(' ').trim()
  if (!arg) {
    await ctx.reply(`Current limit: ${store.getMaxPointsWorse(chatId)} points worse than fair.`)
    return
  }
  const value = parsePositiveInt(arg)
  if (value === null) {
    await ctx.reply(`Send a non-negative number of points, e.g. /threshold ${DEFAULT_MAX_POINTS_WORSE}`)
    return
  }
  store.setMaxPointsWorse(chatId, value)
  await ctx.reply(`Limit set to ${value} points worse than fair.`)
})

bot.command('history', async (ctx) => {
  const chatId = String(ctx.chat.id)
  const bets = store.listRecent(chatId, 10)
  if (bets.length === 0) {
    await ctx.reply('No bets logged yet.')
    return
  }
  const lines = bets.map(
    (b) =>
      `[${b.status}] ${b.book} — ${b.side} ${formatAmerican(b.americanOdds)} for ${formatCurrency(b.stake)}${
        b.hedgeOfBetId ? ' (hedge)' : ''
      }`,
  )
  await ctx.reply(lines.join('\n'))
})

bot.command('pnl', async (ctx) => {
  const chatId = String(ctx.chat.id)
  const bets = store.listRecent(chatId, 500)
  const staked = bets.reduce((sum, b) => sum + b.stake, 0)
  const realized = bets.reduce((sum, b) => {
    if (b.status === 'won') return sum + b.stake * (americanToDecimal(b.americanOdds) - 1)
    if (b.status === 'lost') return sum - b.stake
    return sum
  }, 0)
  await ctx.reply(
    `Bets logged: ${bets.length}\nTotal staked: ${formatCurrency(staked)}\nRealized P&L: ${formatCurrency(realized)}`,
  )
})

bot.launch()
console.log('Bookie hedge bot running (long polling).')

process.once('SIGINT', () => bot.stop('SIGINT'))
process.once('SIGTERM', () => bot.stop('SIGTERM'))

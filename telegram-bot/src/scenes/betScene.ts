import { Markup, Scenes } from 'telegraf'
import type { BetWizardState, MyContext } from '../context.js'
import { store } from '../db.js'
import { parseAmericanOdds, parseStake } from '../parse.js'
import { formatAmerican, formatCurrency } from '../lib/odds.js'

function state(ctx: MyContext): BetWizardState {
  return ctx.wizard.state as BetWizardState
}

export const betScene = new Scenes.WizardScene<MyContext>(
  'bet-wizard',
  async (ctx) => {
    await ctx.reply("Which book did you bet at? (e.g. \"DraftKings\")\n\nSend /cancel anytime to stop.")
    return ctx.wizard.next()
  },
  async (ctx) => {
    if (!ctx.message || !('text' in ctx.message)) {
      await ctx.reply('Please send the book name as text.')
      return
    }
    state(ctx).book = ctx.message.text.trim()
    await ctx.reply('What did you bet on? (event + side, e.g. "Lakers @ Celtics - Lakers ML")')
    return ctx.wizard.next()
  },
  async (ctx) => {
    if (!ctx.message || !('text' in ctx.message)) {
      await ctx.reply('Please send the event/side as text.')
      return
    }
    const text = ctx.message.text.trim()
    state(ctx).event = text
    state(ctx).side = text
    await ctx.reply('What odds did you get? American format, e.g. +150 or -130')
    return ctx.wizard.next()
  },
  async (ctx) => {
    if (!ctx.message || !('text' in ctx.message)) {
      await ctx.reply('Please send the odds as text, e.g. +150 or -130.')
      return
    }
    const odds = parseAmericanOdds(ctx.message.text)
    if (odds === null) {
      await ctx.reply('That doesn\'t look like valid American odds. Try something like +150 or -130.')
      return
    }
    state(ctx).americanOdds = odds
    await ctx.reply('How much did you stake, in dollars? (e.g. 100)')
    return ctx.wizard.next()
  },
  async (ctx) => {
    if (!ctx.message || !('text' in ctx.message)) {
      await ctx.reply('Please send the stake as a number, e.g. 100.')
      return
    }
    const stake = parseStake(ctx.message.text)
    if (stake === null) {
      await ctx.reply('That doesn\'t look like a valid stake. Try a positive number, e.g. 100.')
      return
    }
    const s = state(ctx)
    const bet = store.addBet({
      chatId: String(ctx.chat!.id),
      book: s.book!,
      event: s.event!,
      side: s.side!,
      americanOdds: s.americanOdds!,
      stake,
      status: 'open',
      hedgeOfBetId: null,
    })
    await ctx.reply(
      `Logged:\n${bet.book} — ${bet.side}\n${formatAmerican(bet.americanOdds)} for ${formatCurrency(bet.stake)}\n\n` +
        `When you check the other book, send /hedge to get your hedge stake.`,
      Markup.removeKeyboard(),
    )
    return ctx.scene.leave()
  },
)

import { Markup, Scenes } from 'telegraf'
import type { HedgeWizardState, MyContext } from '../context.js'
import { store } from '../db.js'
import { parseAmericanOdds } from '../parse.js'
import { formatAmerican, formatCurrency, formatPercent, toDecimal } from '../lib/odds.js'
import { computeHedge } from '../lib/hedge.js'
import { checkOddsDrift } from '../lib/threshold.js'

function state(ctx: MyContext): HedgeWizardState {
  return ctx.wizard.state as HedgeWizardState
}

export const hedgeScene = new Scenes.WizardScene<MyContext>(
  'hedge-wizard',
  async (ctx) => {
    const chatId = String(ctx.chat!.id)
    const openBets = store.listOpenBets(chatId)
    if (openBets.length === 0) {
      await ctx.reply('No open (unhedged) bets logged. Use /bet to log one first.')
      return ctx.scene.leave()
    }
    const lines = openBets.map(
      (b, i) => `${i + 1}. ${b.book} — ${b.side} (${formatAmerican(b.americanOdds)}, ${formatCurrency(b.stake)})`,
    )
    await ctx.reply(`Which bet are you hedging? Reply with a number:\n\n${lines.join('\n')}`)
    ;(ctx.wizard.state as any).openBetIds = openBets.map((b) => b.id)
    return ctx.wizard.next()
  },
  async (ctx) => {
    if (!ctx.message || !('text' in ctx.message)) {
      await ctx.reply('Reply with the number of the bet.')
      return
    }
    const ids = (ctx.wizard.state as any).openBetIds as string[]
    const index = Number(ctx.message.text.trim()) - 1
    if (!Number.isInteger(index) || index < 0 || index >= ids.length) {
      await ctx.reply(`Please reply with a number between 1 and ${ids.length}.`)
      return
    }
    state(ctx).betId = ids[index]
    await ctx.reply('Which book are you checking for the hedge?')
    return ctx.wizard.next()
  },
  async (ctx) => {
    if (!ctx.message || !('text' in ctx.message)) {
      await ctx.reply('Please send the book name as text.')
      return
    }
    state(ctx).hedgeBook = ctx.message.text.trim()
    await ctx.reply('What are the current odds for the opposing side there? (American, e.g. -130)')
    return ctx.wizard.next()
  },
  async (ctx) => {
    if (!ctx.message || !('text' in ctx.message)) {
      await ctx.reply('Please send the odds as text, e.g. -130.')
      return
    }
    const hedgeOdds = parseAmericanOdds(ctx.message.text)
    if (hedgeOdds === null) {
      await ctx.reply("That doesn't look like valid American odds. Try something like +150 or -130.")
      return
    }

    const s = state(ctx)
    const bet = store.getBet(s.betId!)
    if (!bet) {
      await ctx.reply('That original bet is gone. Start over with /hedge.')
      return ctx.scene.leave()
    }

    const maxPointsWorse = store.getMaxPointsWorse(String(ctx.chat!.id))
    const drift = checkOddsDrift(bet.americanOdds, hedgeOdds, maxPointsWorse)
    const result = computeHedge({
      originalStake: bet.stake,
      originalDecimalOdds: toDecimal(bet.americanOdds, 'american'),
      hedgeDecimalOdds: toDecimal(hedgeOdds, 'american'),
    })
    ;(ctx.wizard.state as any).hedgeOdds = hedgeOdds
    ;(ctx.wizard.state as any).hedgeStake = result.hedgeStakeForEqualProfit

    const warning = drift.withinThreshold
      ? ''
      : `\n⚠️ These odds are ${Math.abs(drift.pointsFromFair).toFixed(0)} points worse than fair (your limit is ${maxPointsWorse}). Consider skipping.\n`

    await ctx.reply(
      [
        `${bet.book} ${formatAmerican(bet.americanOdds)} vs ${s.hedgeBook} ${formatAmerican(hedgeOdds)}`,
        warning,
        `Hedge stake: ${formatCurrency(result.hedgeStakeForEqualProfit)}`,
        `Total staked: ${formatCurrency(result.totalStaked)}`,
        `If ${bet.side} wins: ${formatCurrency(result.profitIfOriginalWins)}`,
        `If hedge side wins: ${formatCurrency(result.profitIfHedgeWins)}`,
        `${result.isArbitrage ? '✅ True arbitrage' : 'Locks in a fixed result'} (combined implied prob: ${formatPercent(result.combinedImpliedProbability)})`,
      ]
        .filter(Boolean)
        .join('\n'),
      Markup.inlineKeyboard([
        Markup.button.callback('✅ I placed it', 'confirm_hedge'),
        Markup.button.callback('❌ Skip', 'skip_hedge'),
      ]),
    )
    return ctx.wizard.next()
  },
)

hedgeScene.action('confirm_hedge', async (ctx) => {
  await ctx.answerCbQuery()
  const s = state(ctx)
  const bet = store.getBet(s.betId!)
  if (!bet) {
    await ctx.editMessageText('That original bet is gone.')
    return ctx.scene.leave()
  }
  const hedgeOdds = (ctx.wizard.state as any).hedgeOdds as number
  const hedgeStake = (ctx.wizard.state as any).hedgeStake as number
  store.addBet({
    chatId: String(ctx.chat!.id),
    book: s.hedgeBook!,
    event: bet.event,
    side: `opposing: ${bet.side}`,
    americanOdds: hedgeOdds,
    stake: hedgeStake,
    status: 'open',
    hedgeOfBetId: bet.id,
  })
  store.updateStatus(bet.id, 'hedged')
  await ctx.editMessageText('Logged. Both legs are tracked — use /history to see them.')
  return ctx.scene.leave()
})

hedgeScene.action('skip_hedge', async (ctx) => {
  await ctx.answerCbQuery()
  await ctx.editMessageText('Skipped. Original bet stays open — /hedge again anytime.')
  return ctx.scene.leave()
})

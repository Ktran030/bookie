import { useState } from 'react'
import { Badge, Button, Card, Stat } from '../components/ui'
import { connectors } from '../lib/connectors'
import { getPaperBalance, resetPaperBalance } from '../lib/connectors/paperConnector'
import { formatCurrency } from '../lib/odds'

export function AutomationPage() {
  const [balance, setBalance] = useState(getPaperBalance())

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <h2 className="mb-2 text-lg font-semibold text-slate-100">How hedge placement works here</h2>
        <p className="text-sm text-slate-400">
          The Calculator page can "place" your hedge bet through a pluggable{' '}
          <code className="rounded bg-slate-800 px-1 py-0.5 text-xs">BookConnector</code>. Two ship with the app:
        </p>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          {connectors.map((c) => (
            <div key={c.id} className="rounded-lg border border-slate-800 p-4">
              <div className="mb-1 flex items-center gap-2">
                <span className="font-medium text-slate-200">{c.label}</span>
                <Badge tone={c.isAutomated ? 'good' : 'neutral'}>{c.isAutomated ? 'automated' : 'manual'}</Badge>
              </div>
              <p className="text-xs text-slate-500">{c.description}</p>
            </div>
          ))}
        </div>
      </Card>

      <Card>
        <h2 className="mb-2 text-lg font-semibold text-slate-100">Paper trading balance</h2>
        <p className="mb-4 text-sm text-slate-400">
          The paper connector deducts from a fake balance stored only on this device, so you can test the fully
          automated placement flow with zero real-world risk.
        </p>
        <div className="flex items-center gap-6">
          <Stat label="Paper balance" value={formatCurrency(balance)} />
          <Button
            variant="secondary"
            onClick={() => {
              resetPaperBalance()
              setBalance(getPaperBalance())
            }}
          >
            Reset to $1,000
          </Button>
        </div>
      </Card>

      <Card>
        <h2 className="mb-2 text-lg font-semibold text-amber-400">
          Why there's no auto-placement connector for real sportsbooks
        </h2>
        <div className="space-y-2 text-sm text-slate-400">
          <p>
            DraftKings, FanDuel, BetMGM, and the other major US books don't offer a public API for retail bettors to
            place bets programmatically. The only way to automate placement against them is to script a login and
            replicate their private app/web traffic, which:
          </p>
          <ul className="list-disc space-y-1 pl-5">
            <li>
              <span className="font-medium text-slate-300">Violates their Terms of Service</span> — every major book
              prohibits bots or automated wagering, and can void bets, seize winnings, or permanently ban the account.
            </li>
            <li>
              <span className="font-medium text-slate-300">Is fragile and unsafe unattended</span> — private
              endpoints change without notice and are protected by anti-bot defenses; a bug in a bet-submission
              script places a real, unconfirmed, real-money wager.
            </li>
            <li>
              <span className="font-medium text-slate-300">Puts your funds at risk with no recourse</span> — a banned
              account often means frozen funds under "review," with no support path built for bots.
            </li>
          </ul>
          <p>
            If you have a legitimate integration (e.g. an affiliate or B2B API a book has actually issued you),
            implement <code className="rounded bg-slate-800 px-1 py-0.5 text-xs">BookConnector</code> against it in{' '}
            <code className="rounded bg-slate-800 px-1 py-0.5 text-xs">src/lib/connectors/</code> — every other part
            of this app works with it unmodified. Otherwise, use the manual connector: the app still computes the
            exact stake and bet slip, you just place it yourself.
          </p>
        </div>
      </Card>
    </div>
  )
}

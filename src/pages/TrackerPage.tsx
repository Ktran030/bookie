import { useEffect, useMemo, useState } from 'react'
import { Badge, Button, Card, Select, Stat } from '../components/ui'
import { americanToDecimal, formatAmerican, formatCurrency } from '../lib/odds'
import { loadBets, saveBets } from '../lib/storage'
import type { Bet, BetStatus } from '../types/bet'

const STATUS_TONE: Record<BetStatus, 'neutral' | 'good' | 'bad' | 'warn'> = {
  open: 'neutral',
  hedged: 'warn',
  won: 'good',
  lost: 'bad',
  pushed: 'neutral',
}

function betProfitIfSettled(bet: Bet): number {
  if (bet.status === 'won') return bet.stake * (americanToDecimal(bet.americanOdds) - 1)
  if (bet.status === 'lost') return -bet.stake
  return 0
}

export function TrackerPage({ refreshKey }: { refreshKey: number }) {
  const [bets, setBets] = useState<Bet[]>([])

  useEffect(() => {
    setBets(loadBets())
  }, [refreshKey])

  const totals = useMemo(() => {
    const staked = bets.reduce((sum, b) => sum + b.stake, 0)
    const settled = bets.filter((b) => b.status === 'won' || b.status === 'lost')
    const realizedPnl = settled.reduce((sum, b) => sum + betProfitIfSettled(b), 0)
    return { staked, realizedPnl, count: bets.length }
  }, [bets])

  function updateBet(id: string, patch: Partial<Bet>) {
    const next = bets.map((b) => (b.id === id ? { ...b, ...patch } : b))
    setBets(next)
    saveBets(next)
  }

  function removeBet(id: string) {
    const next = bets.filter((b) => b.id !== id)
    setBets(next)
    saveBets(next)
  }

  const sorted = [...bets].sort((a, b) => b.createdAt.localeCompare(a.createdAt))

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <div className="grid grid-cols-3 gap-4">
          <Stat label="Bets logged" value={String(totals.count)} />
          <Stat label="Total staked" value={formatCurrency(totals.staked)} />
          <Stat
            label="Realized P&L"
            value={formatCurrency(totals.realizedPnl)}
            tone={totals.realizedPnl > 0 ? 'good' : totals.realizedPnl < 0 ? 'bad' : 'neutral'}
          />
        </div>
      </Card>

      <Card>
        <h2 className="mb-4 text-lg font-semibold text-slate-100">Logged bets</h2>
        {sorted.length === 0 ? (
          <p className="text-sm text-slate-500">
            No bets logged yet. Use the Calculator tab to log a bet and its hedge.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] border-collapse text-sm">
              <thead>
                <tr className="border-b border-slate-800 text-left text-xs uppercase tracking-wide text-slate-500">
                  <th className="py-2 pr-3">Book</th>
                  <th className="py-2 pr-3">Event / Side</th>
                  <th className="py-2 pr-3">Odds</th>
                  <th className="py-2 pr-3">Stake</th>
                  <th className="py-2 pr-3">Status</th>
                  <th className="py-2 pr-3">Linked hedge</th>
                  <th className="py-2 pr-3" />
                </tr>
              </thead>
              <tbody>
                {sorted.map((bet) => (
                  <tr key={bet.id} className="border-b border-slate-900">
                    <td className="py-2 pr-3 font-medium text-slate-200">{bet.book}</td>
                    <td className="py-2 pr-3 text-slate-300">
                      <div>{bet.event}</div>
                      <div className="text-xs text-slate-500">
                        {bet.market} — {bet.side}
                      </div>
                    </td>
                    <td className="py-2 pr-3 tabular-nums text-slate-300">{formatAmerican(bet.americanOdds)}</td>
                    <td className="py-2 pr-3 tabular-nums text-slate-300">{formatCurrency(bet.stake)}</td>
                    <td className="py-2 pr-3">
                      <Select
                        value={bet.status}
                        onChange={(e) => updateBet(bet.id, { status: e.target.value as BetStatus })}
                        className="!py-1 text-xs"
                      >
                        <option value="open">Open</option>
                        <option value="hedged">Hedged</option>
                        <option value="won">Won</option>
                        <option value="lost">Lost</option>
                        <option value="pushed">Pushed</option>
                      </Select>
                    </td>
                    <td className="py-2 pr-3">
                      {bet.hedgeOfBetId ? (
                        <Badge tone="warn">hedges another bet</Badge>
                      ) : sorted.some((b) => b.hedgeOfBetId === bet.id) ? (
                        <Badge tone={STATUS_TONE[bet.status]}>has hedge</Badge>
                      ) : (
                        <span className="text-xs text-slate-600">—</span>
                      )}
                    </td>
                    <td className="py-2 pr-3">
                      <Button variant="danger" onClick={() => removeBet(bet.id)} className="!px-2 !py-1 text-xs">
                        Delete
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  )
}

import { useMemo, useState } from 'react'
import { Badge, Button, Card, Field, Select, Stat, TextInput } from '../components/ui'
import { connectors, getConnector } from '../lib/connectors'
import { computeHedge } from '../lib/hedge'
import { formatCurrency, formatPercent, toDecimal, type OddsFormat } from '../lib/odds'
import { generateId, loadBets, saveBets } from '../lib/storage'
import type { Bet } from '../types/bet'

interface OddsFieldState {
  format: OddsFormat
  value: string
}

function OddsInput({
  state,
  onChange,
}: {
  state: OddsFieldState
  onChange: (next: OddsFieldState) => void
}) {
  return (
    <div className="flex gap-2">
      <TextInput
        type="number"
        step="any"
        placeholder={state.format === 'american' ? 'e.g. -110 or +150' : 'e.g. 1.91'}
        value={state.value}
        onChange={(e) => onChange({ ...state, value: e.target.value })}
        className="flex-1"
      />
      <Select
        value={state.format}
        onChange={(e) => onChange({ ...state, format: e.target.value as OddsFormat })}
        className="w-28"
      >
        <option value="american">American</option>
        <option value="decimal">Decimal</option>
      </Select>
    </div>
  )
}

export function CalculatorPage({ onBetsChanged }: { onBetsChanged: () => void }) {
  const [book, setBook] = useState('DraftKings')
  const [event, setEvent] = useState('')
  const [market, setMarket] = useState('Moneyline')
  const [side, setSide] = useState('')
  const [stake, setStake] = useState('100')
  const [originalOdds, setOriginalOdds] = useState<OddsFieldState>({ format: 'american', value: '150' })

  const [hedgeBook, setHedgeBook] = useState('FanDuel')
  const [hedgeSide, setHedgeSide] = useState('')
  const [hedgeOdds, setHedgeOdds] = useState<OddsFieldState>({ format: 'american', value: '-130' })

  const [connectorId, setConnectorId] = useState(connectors[0].id)
  const [actionMessage, setActionMessage] = useState<string | null>(null)
  const [originalBetId, setOriginalBetId] = useState<string | null>(null)

  const result = useMemo(() => {
    const stakeNum = Number(stake)
    const origDecimal = originalOdds.value === '' ? NaN : toDecimal(Number(originalOdds.value), originalOdds.format)
    const hedgeDecimal = hedgeOdds.value === '' ? NaN : toDecimal(Number(hedgeOdds.value), hedgeOdds.format)
    if (!stakeNum || stakeNum <= 0 || !Number.isFinite(origDecimal) || !Number.isFinite(hedgeDecimal)) {
      return null
    }
    try {
      return computeHedge({
        originalStake: stakeNum,
        originalDecimalOdds: origDecimal,
        hedgeDecimalOdds: hedgeDecimal,
      })
    } catch {
      return null
    }
  }, [stake, originalOdds, hedgeOdds])

  function logOriginalBet() {
    const stakeNum = Number(stake)
    const americanOdds =
      originalOdds.format === 'american' ? Number(originalOdds.value) : toDecimal(Number(originalOdds.value), 'decimal')
    const bet: Bet = {
      id: generateId(),
      createdAt: new Date().toISOString(),
      book,
      event: event || 'Untitled event',
      market,
      side: side || 'Side A',
      americanOdds,
      stake: stakeNum,
      status: 'open',
    }
    saveBets([...loadBets(), bet])
    setOriginalBetId(bet.id)
    onBetsChanged()
    setActionMessage(`Logged original bet at ${book}.`)
  }

  async function placeHedge() {
    if (!result) return
    const connector = getConnector(connectorId)
    const americanOdds = hedgeOdds.format === 'american' ? Number(hedgeOdds.value) : Number(hedgeOdds.value)
    const confirmation = await connector.placeBet({
      book: hedgeBook,
      event: event || 'Untitled event',
      market,
      side: hedgeSide || 'Side B',
      americanOdds,
      stake: result.hedgeStakeForEqualProfit,
    })

    if (confirmation.success) {
      const bets = loadBets()
      const hedgeBet: Bet = {
        id: generateId(),
        createdAt: new Date().toISOString(),
        book: hedgeBook,
        event: event || 'Untitled event',
        market,
        side: hedgeSide || 'Side B',
        americanOdds,
        stake: result.hedgeStakeForEqualProfit,
        status: 'open',
        hedgeOfBetId: originalBetId ?? undefined,
      }
      const updated = originalBetId
        ? bets.map((b) => (b.id === originalBetId ? { ...b, status: 'hedged' as const } : b))
        : bets
      saveBets([...updated, hedgeBet])
      onBetsChanged()
    }
    setActionMessage(confirmation.message)
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card>
        <h2 className="mb-4 text-lg font-semibold text-slate-100">1. Bet you already placed</h2>
        <div className="grid gap-4">
          <Field label="Book">
            <TextInput value={book} onChange={(e) => setBook(e.target.value)} placeholder="e.g. DraftKings" />
          </Field>
          <Field label="Event">
            <TextInput value={event} onChange={(e) => setEvent(e.target.value)} placeholder="e.g. Lakers @ Celtics" />
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Market">
              <TextInput value={market} onChange={(e) => setMarket(e.target.value)} />
            </Field>
            <Field label="Your side">
              <TextInput value={side} onChange={(e) => setSide(e.target.value)} placeholder="e.g. Lakers ML" />
            </Field>
          </div>
          <Field label="Stake ($)">
            <TextInput type="number" step="any" value={stake} onChange={(e) => setStake(e.target.value)} />
          </Field>
          <Field label="Your odds">
            <OddsInput state={originalOdds} onChange={setOriginalOdds} />
          </Field>
          <Button variant="secondary" onClick={logOriginalBet}>
            Log this bet to tracker
          </Button>
        </div>
      </Card>

      <Card>
        <h2 className="mb-4 text-lg font-semibold text-slate-100">2. Hedge at another book</h2>
        <div className="grid gap-4">
          <Field label="Book">
            <TextInput value={hedgeBook} onChange={(e) => setHedgeBook(e.target.value)} placeholder="e.g. FanDuel" />
          </Field>
          <Field label="Opposing side">
            <TextInput value={hedgeSide} onChange={(e) => setHedgeSide(e.target.value)} placeholder="e.g. Celtics ML" />
          </Field>
          <Field label="Odds available there">
            <OddsInput state={hedgeOdds} onChange={setHedgeOdds} />
          </Field>

          <Field label="Placement method">
            <Select value={connectorId} onChange={(e) => setConnectorId(e.target.value)}>
              {connectors.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.label}
                </option>
              ))}
            </Select>
          </Field>
          <p className="text-xs text-slate-500">{getConnector(connectorId).description}</p>
        </div>
      </Card>

      <Card className="lg:col-span-2">
        <h2 className="mb-4 text-lg font-semibold text-slate-100">Result</h2>
        {!result ? (
          <p className="text-sm text-slate-500">Enter a stake and odds for both legs to see the hedge.</p>
        ) : (
          <div className="flex flex-col gap-5">
            <div className="flex items-center gap-3">
              <Badge tone={result.isArbitrage ? 'good' : 'warn'}>
                {result.isArbitrage ? 'True arbitrage — guaranteed profit' : 'Hedge reduces variance (locks in a fixed outcome)'}
              </Badge>
              <span className="text-xs text-slate-500">
                Combined implied probability: {formatPercent(result.combinedImpliedProbability)}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              <Stat label="Hedge stake" value={formatCurrency(result.hedgeStakeForEqualProfit)} />
              <Stat label="Total staked" value={formatCurrency(result.totalStaked)} />
              <Stat
                label="If your side wins"
                value={formatCurrency(result.profitIfOriginalWins)}
                tone={result.profitIfOriginalWins >= 0 ? 'good' : 'bad'}
              />
              <Stat
                label="If hedge side wins"
                value={formatCurrency(result.profitIfHedgeWins)}
                tone={result.profitIfHedgeWins >= 0 ? 'good' : 'bad'}
              />
            </div>
            <div>
              <Stat
                label="Guaranteed outcome"
                value={formatCurrency(result.guaranteedProfit)}
                tone={result.guaranteedProfit >= 0 ? 'good' : 'bad'}
              />
            </div>
            <div className="flex items-center gap-3 border-t border-slate-800 pt-4">
              <Button onClick={placeHedge}>Place hedge via {getConnector(connectorId).label}</Button>
              {actionMessage && <span className="whitespace-pre-line text-xs text-slate-400">{actionMessage}</span>}
            </div>
          </div>
        )}
      </Card>
    </div>
  )
}

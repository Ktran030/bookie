import { useState } from 'react'
import { AutomationPage } from './pages/AutomationPage'
import { CalculatorPage } from './pages/CalculatorPage'
import { TrackerPage } from './pages/TrackerPage'

type Tab = 'calculator' | 'tracker' | 'automation'

const TABS: { id: Tab; label: string }[] = [
  { id: 'calculator', label: 'Hedge Calculator' },
  { id: 'tracker', label: 'Bet Tracker' },
  { id: 'automation', label: 'Automation' },
]

function App() {
  const [tab, setTab] = useState<Tab>('calculator')
  const [refreshKey, setRefreshKey] = useState(0)

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <header className="border-b border-slate-800">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-5">
          <div>
            <h1 className="text-xl font-bold tracking-tight">Bookie</h1>
            <p className="text-xs text-slate-500">Hedge bets across sportsbooks with the math done for you</p>
          </div>
          <nav className="flex gap-1 rounded-lg bg-slate-900 p-1">
            {TABS.map((t) => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                  tab === t.id ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {t.label}
              </button>
            ))}
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-8">
        {tab === 'calculator' && <CalculatorPage onBetsChanged={() => setRefreshKey((k) => k + 1)} />}
        {tab === 'tracker' && <TrackerPage refreshKey={refreshKey} />}
        {tab === 'automation' && <AutomationPage />}
      </main>
    </div>
  )
}

export default App

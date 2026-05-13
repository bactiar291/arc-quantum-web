import { Fuel, GitBranchPlus, Send, Shuffle, Terminal } from 'lucide-react'
import { useState } from 'react'

import { Dashboard } from './components/Dashboard'
import { Header } from './components/Header'
import { QuantumVisual } from './components/QuantumVisual'
import { StatusBar } from './components/StatusBar'
import { BridgePanel } from './components/panels/BridgePanel'
import { GasPanel } from './components/panels/GasPanel'
import { OfficialSwapPanel } from './components/panels/OfficialSwapPanel'
import { StableSendPanel } from './components/panels/StableSendPanel'
import { Button } from './components/ui/Button'
import { Panel } from './components/ui/Panel'
import { ArcKitProvider } from './hooks/useArcAppKit'

type TabId = 'swap' | 'send' | 'bridge' | 'gas'

const tabs: Array<{ id: TabId; label: string; icon: typeof Shuffle }> = [
  { id: 'swap', label: 'Swap', icon: Shuffle },
  { id: 'send', label: 'Send', icon: Send },
  { id: 'bridge', label: 'Bridge', icon: GitBranchPlus },
  { id: 'gas', label: 'Gas', icon: Fuel }
]

function ActivePanel({ tab }: { tab: TabId }) {
  if (tab === 'send') return <StableSendPanel />
  if (tab === 'bridge') return <BridgePanel />
  if (tab === 'gas') return <GasPanel />
  return <OfficialSwapPanel />
}

function Shell() {
  const [activeTab, setActiveTab] = useState<TabId>('swap')
  const active = tabs.find((tab) => tab.id === activeTab) ?? tabs[0]
  const ActiveIcon = active.icon

  return (
    <div className="min-h-screen overflow-x-hidden bg-quantum-black text-white">
      <div className="grid-noise" />
      <Header />

      <main className="mx-auto grid w-full max-w-[1520px] grid-cols-1 gap-5 px-4 pb-24 pt-4 md:px-6 xl:grid-cols-[minmax(0,1fr)_390px]">
        <section className="space-y-5">
          <Panel className="animate-reveal" shadow="cyan">
            <div className="mb-4 flex flex-col justify-between gap-3 border-b-2 border-white pb-4 md:flex-row md:items-center">
              <div>
                <div className="flex items-center gap-3 font-display text-4xl leading-none md:text-5xl">
                  <ActiveIcon className="h-8 w-8 text-quantum-yellow" />
                  {active.label}
                </div>
                <div className="mt-1 flex items-center gap-2 font-mono text-xs uppercase text-white/60">
                  <Terminal className="h-4 w-4 text-quantum-cyan" />
                  Arc Testnet stablecoin console
                </div>
              </div>
              <div className="border-2 border-white bg-black px-3 py-2 font-mono text-xs uppercase text-quantum-green">
                Official Circle App Kit
              </div>
            </div>

            <nav className="grid grid-cols-2 gap-3 md:grid-cols-4">
              {tabs.map((tab) => {
                const Icon = tab.icon
                return (
                  <Button
                    key={tab.id}
                    variant={activeTab === tab.id ? 'primary' : 'ghost'}
                    onClick={() => setActiveTab(tab.id)}
                    className="w-full"
                  >
                    <Icon className="h-5 w-5" />
                    {tab.label}
                  </Button>
                )
              })}
            </nav>
          </Panel>

          <ActivePanel tab={activeTab} />
        </section>

        <aside className="space-y-5">
          <Dashboard />
          <QuantumVisual />
        </aside>
      </main>

      <StatusBar />
    </div>
  )
}

export default function App() {
  return (
    <ArcKitProvider>
      <Shell />
    </ArcKitProvider>
  )
}

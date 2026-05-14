import { GitBranchPlus, Rocket, Send, Shuffle, Terminal, Waves } from 'lucide-react'
import { useState } from 'react'

import { ActionReactor, ProtocolMatrix, type ReactorTab } from './components/ActionReactor'
import { Dashboard } from './components/Dashboard'
import { Header } from './components/Header'
import { IntroGate } from './components/IntroGate'
import { PrivyAppProvider } from './components/PrivyAppProvider'
import { QuantumVisual } from './components/QuantumVisual'
import { SignalRail } from './components/SignalRail'
import { StatusBar } from './components/StatusBar'
import { BridgePanel } from './components/panels/BridgePanel'
import { DeployPanel } from './components/panels/DeployPanel'
import { FaucetPanel } from './components/panels/FaucetPanel'
import { OfficialSwapPanel } from './components/panels/OfficialSwapPanel'
import { StableSendPanel } from './components/panels/StableSendPanel'
import { Button } from './components/ui/Button'
import { Panel } from './components/ui/Panel'
import { ArcKitProvider } from './hooks/useArcAppKit'

type TabId = ReactorTab

const tabs: Array<{ id: TabId; label: string; icon: typeof Shuffle }> = [
  { id: 'swap', label: 'Swap', icon: Shuffle },
  { id: 'send', label: 'Send', icon: Send },
  { id: 'bridge', label: 'Bridge', icon: GitBranchPlus },
  { id: 'faucet', label: 'Faucet', icon: Waves },
  { id: 'deploy', label: 'Deploy', icon: Rocket }
]

function ActivePanel({ tab }: { tab: TabId }) {
  if (tab === 'send') return <StableSendPanel />
  if (tab === 'bridge') return <BridgePanel />
  if (tab === 'faucet') return <FaucetPanel />
  if (tab === 'deploy') return <DeployPanel />
  return <OfficialSwapPanel />
}

function Shell() {
  const [entered, setEntered] = useState(
    () => sessionStorage.getItem('arc-quantum-entered') === '1'
  )
  const [activeTab, setActiveTab] = useState<TabId>('swap')
  const active = tabs.find((tab) => tab.id === activeTab) ?? tabs[0]
  const ActiveIcon = active.icon

  if (!entered) {
    return (
      <IntroGate
        onEnter={() => {
          sessionStorage.setItem('arc-quantum-entered', '1')
          setEntered(true)
        }}
      />
    )
  }

  return (
    <div className="min-h-screen overflow-x-hidden bg-quantum-paper text-quantum-black">
      <div className="cyber-band" />
      <div className="grid-noise" />
      <Header />

      <main className="mx-auto grid w-full max-w-[1520px] grid-cols-1 gap-5 px-4 pb-24 pt-4 md:px-6 xl:grid-cols-[minmax(0,1fr)_390px]">
        <section className="space-y-5">
          <Panel className="animate-reveal hero-panel p-3 md:p-4" shadow="cyan">
            <div className="mb-3 flex flex-col justify-between gap-2 border-b-4 border-quantum-black pb-3 md:flex-row md:items-center">
              <div>
                <div className="flex items-center gap-2 font-display text-3xl leading-none md:text-4xl">
                  <ActiveIcon className="h-7 w-7 text-quantum-yellow" />
                  {active.label}
                </div>
                <div className="mt-1 flex items-center gap-2 font-mono text-xs uppercase text-quantum-black/60">
                  <Terminal className="h-4 w-4 text-quantum-cyan" />
                  Privy login / Circle AppKit / public RPC
                </div>
              </div>
              <div className="border-4 border-quantum-black bg-quantum-green px-3 py-1.5 font-mono text-[11px] uppercase text-quantum-black shadow-[5px_5px_0_#111]">
                Privy Auth / Wallet Gas
              </div>
            </div>

            <nav className="grid grid-cols-2 gap-3 md:grid-cols-5">
              {tabs.map((tab) => {
                const Icon = tab.icon
                return (
                  <Button
                    key={tab.id}
                    variant={activeTab === tab.id ? 'primary' : 'ghost'}
                    onClick={() => setActiveTab(tab.id)}
                    className="aspect-[1.6/1] w-full flex-col gap-1 px-2 py-2 text-lg md:aspect-square"
                  >
                    <Icon className="h-5 w-5" />
                    {tab.label}
                  </Button>
                )
              })}
            </nav>
          </Panel>

          <ActivePanel tab={activeTab} />
          <ActionReactor activeTab={activeTab} />
          <ProtocolMatrix activeTab={activeTab} />
        </section>

        <aside className="space-y-5 xl:sticky xl:top-5 xl:self-start">
          <Dashboard />
          <QuantumVisual />
          <SignalRail />
        </aside>
      </main>

      <StatusBar />
    </div>
  )
}

export default function App() {
  return (
    <PrivyAppProvider>
      <ArcKitProvider>
        <Shell />
      </ArcKitProvider>
    </PrivyAppProvider>
  )
}

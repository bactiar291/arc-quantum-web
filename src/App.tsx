import { GitBranchPlus, Rocket, Send, Shuffle, Waves } from 'lucide-react'
import { useState } from 'react'

import type { ReactorTab } from './components/ActionReactor'
import { Dashboard } from './components/Dashboard'
import { Header } from './components/Header'
import { IntroGate } from './components/IntroGate'
import { PrivyAppProvider } from './components/PrivyAppProvider'
import { StatusBar } from './components/StatusBar'
import { BridgePanel } from './components/panels/BridgePanel'
import { DeployPanel } from './components/panels/DeployPanel'
import { FaucetPanel } from './components/panels/FaucetPanel'
import { OfficialSwapPanel } from './components/panels/OfficialSwapPanel'
import { StableSendPanel } from './components/panels/StableSendPanel'
import { Button } from './components/ui/Button'
import { Panel } from './components/ui/Panel'
import { ArcKitProvider } from './hooks/useArcAppKit'

const INTRO_KEY = 'arc-quantum-entered-v2'

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
    () => localStorage.getItem(INTRO_KEY) === '1'
  )
  const [activeTab, setActiveTab] = useState<TabId>('swap')
  const active = tabs.find((tab) => tab.id === activeTab) ?? tabs[0]
  const ActiveIcon = active.icon

  if (!entered) {
    return (
      <IntroGate
        onEnter={() => {
          localStorage.setItem(INTRO_KEY, '1')
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

      <main className="mx-auto grid w-full max-w-[1120px] grid-cols-1 gap-4 px-3 pb-20 pt-3 md:px-4 lg:grid-cols-[minmax(420px,520px)_minmax(300px,1fr)]">
        <section className="space-y-3">
          <Panel className="animate-reveal hero-panel p-3" shadow="cyan">
            <div className="mb-3 flex items-center justify-between gap-3 border-b-2 border-quantum-black/15 pb-2">
              <div>
                <div className="flex items-center gap-2 font-display text-2xl leading-none md:text-3xl">
                  <ActiveIcon className="h-5 w-5 text-quantum-yellow" />
                  {active.label}
                </div>
              </div>
              <div className="border-2 border-quantum-black bg-quantum-green px-2 py-1 font-mono text-[10px] uppercase text-quantum-black shadow-[2px_2px_0_#111]">
                AppKit / Arc
              </div>
            </div>

            <nav className="scrollbar-none grid grid-cols-5 gap-2 overflow-x-auto pb-1">
              {tabs.map((tab) => {
                const Icon = tab.icon
                return (
                  <Button
                    key={tab.id}
                    variant={activeTab === tab.id ? 'primary' : 'ghost'}
                    onClick={() => setActiveTab(tab.id)}
                    className="aspect-square min-h-0 min-w-0 flex-col gap-1 px-1 py-2 text-xs md:text-sm"
                  >
                    <Icon className="h-4 w-4" />
                    {tab.label}
                  </Button>
                )
              })}
            </nav>
          </Panel>

          <ActivePanel tab={activeTab} />
        </section>

        <aside className="space-y-3 lg:sticky lg:top-20 lg:self-start">
          <Dashboard />
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

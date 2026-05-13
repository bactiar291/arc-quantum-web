import { Activity, Boxes, Coins, Rocket, Send, Shuffle } from 'lucide-react'

import { Dashboard } from './components/Dashboard'
import { Header } from './components/Header'
import { QuantumVisual } from './components/QuantumVisual'
import { SessionInit } from './components/SessionInit'
import { StatusBar } from './components/StatusBar'
import { TabNav } from './components/TabNav'
import { DeployPanel } from './components/panels/DeployPanel'
import { LiquidityPanel } from './components/panels/LiquidityPanel'
import { SendPanel } from './components/panels/SendPanel'
import { SwapPanel } from './components/panels/SwapPanel'
import { Panel } from './components/ui/Panel'
import { quantumFactoryAddress, quantumRouterAddress } from './lib/contracts'
import { useAppStore, type AppTab } from './store/useAppStore'

const tabIcons: Record<AppTab, typeof Shuffle> = {
  swap: Shuffle,
  liquidity: Boxes,
  send: Send,
  deploy: Rocket
}

function ActivePanel() {
  const activeTab = useAppStore((state) => state.activeTab)

  if (activeTab === 'liquidity') return <LiquidityPanel />
  if (activeTab === 'send') return <SendPanel />
  if (activeTab === 'deploy') return <DeployPanel />
  return <SwapPanel />
}

export default function App() {
  const activeTab = useAppStore((state) => state.activeTab)
  const ActiveIcon = tabIcons[activeTab]

  return (
    <div className="min-h-screen overflow-x-hidden bg-quantum-black text-white">
      <div className="grid-noise" />
      <Header />

      <main className="mx-auto grid w-full max-w-[1520px] grid-cols-1 gap-5 px-4 pb-24 pt-4 md:px-6 xl:grid-cols-[1fr_360px]">
        <section className="space-y-5">
          <Panel className="animate-reveal" shadow="cyan">
            <div className="mb-4 flex flex-col justify-between gap-3 border-b-2 border-white pb-4 md:flex-row md:items-center">
              <div>
                <div className="flex items-center gap-3 font-display text-4xl leading-none md:text-5xl">
                  <ActiveIcon className="h-8 w-8 text-quantum-yellow" />
                  {activeTab}
                </div>
                <p className="mt-1 max-w-3xl font-mono text-xs uppercase text-white/70">
                  Arc Testnet execution console. Smart account holds assets;
                  session key executes after owner approval.
                </p>
              </div>
              <div className="flex items-center gap-2 border-2 border-white bg-black px-3 py-2 font-mono text-xs uppercase text-quantum-cyan">
                <Activity className="h-4 w-4" />
                LIVE RPC
              </div>
            </div>
            <TabNav />
          </Panel>

          <div className="grid grid-cols-1 gap-5 2xl:grid-cols-[minmax(0,1fr)_420px]">
            <ActivePanel />
            <div className="space-y-5">
              <SessionInit />
              <QuantumVisual />
            </div>
          </div>
        </section>

        <aside className="space-y-5">
          <Dashboard />
          <Panel>
            <div className="flex items-center gap-2 border-b-2 border-white pb-3 font-display text-3xl">
              <Coins className="h-6 w-6 text-quantum-yellow" />
              ROUTER
            </div>
            <p className="mt-3 font-mono text-xs uppercase leading-5 text-white/70">
              {quantumRouterAddress && quantumFactoryAddress
                ? 'Router/factory configured. Swap still needs pool liquidity and smart-account token balance.'
                : 'Router/factory missing. Swap/liquidity are blocked until AMM contracts are deployed and env is set.'}
            </p>
            <div className="mt-3 space-y-2 font-mono text-[11px] uppercase">
              <div className="truncate text-quantum-yellow">
                Router: {quantumRouterAddress ?? 'missing'}
              </div>
              <div className="truncate text-quantum-cyan">
                Factory: {quantumFactoryAddress ?? 'missing'}
              </div>
            </div>
          </Panel>
        </aside>
      </main>

      <StatusBar />
    </div>
  )
}

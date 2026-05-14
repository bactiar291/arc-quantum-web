import { ArrowRight, GitBranchPlus, Send, ShieldCheck, Shuffle } from 'lucide-react'

import { QuantumLogo } from './QuantumLogo'
import { Button } from './ui/Button'

interface IntroGateProps {
  onEnter: () => void
}

const features = [
  { label: 'Swap', value: 'USDC <-> EURC', icon: Shuffle, color: 'text-quantum-cyan' },
  { label: 'Bridge', value: 'Sepolia <-> Arc', icon: GitBranchPlus, color: 'text-quantum-green' },
  { label: 'Send', value: 'Stable transfer', icon: Send, color: 'text-quantum-orange' },
  { label: 'Sign', value: 'Wallet locked', icon: ShieldCheck, color: 'text-quantum-purple' }
]

export function IntroGate({ onEnter }: IntroGateProps) {
  return (
    <div className="relative min-h-screen overflow-hidden bg-quantum-black text-white">
      <div className="cyber-band" />
      <div className="grid-noise" />
      <main className="relative z-10 mx-auto grid min-h-screen w-full max-w-[1320px] items-center gap-8 px-4 py-8 md:px-6 lg:grid-cols-[1.05fr_0.95fr]">
        <section className="space-y-6">
          <QuantumLogo size="lg" className="h-36 w-36" />
          <div>
            <p className="font-mono text-xs uppercase text-quantum-green">
              Arc Testnet stablecoin console
            </p>
            <h1 className="mt-2 max-w-3xl font-display text-7xl leading-[0.86] text-white md:text-8xl">
              ARC QUANTUM GAS
            </h1>
            <p className="mt-4 max-w-2xl font-mono text-sm uppercase leading-6 text-white/70">
              Swap, bridge, send, deploy random tokens. Wallet signer mode aktif;
              sponsor AA disiapkan terpisah.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button onClick={onEnter} variant="cyan" className="min-w-48">
              Enter Lab
              <ArrowRight className="h-5 w-5" />
            </Button>
            <div className="border-2 border-white bg-black px-4 py-3 font-mono text-xs uppercase text-quantum-yellow shadow-[4px_4px_0_#FF5578]">
              Circle App Kit live
            </div>
          </div>
        </section>

        <section className="intro-scan border-2 border-white bg-black/70 p-4 shadow-[8px_8px_0_#B884FF] md:p-5">
          <div className="mb-4 border-b-2 border-white pb-3 font-display text-4xl">
            LIVE MODULES
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {features.map((feature) => {
              const Icon = feature.icon
              return (
                <div key={feature.label} className="border-2 border-white bg-quantum-panel p-4">
                  <Icon className={`mb-3 h-7 w-7 ${feature.color}`} />
                  <div className="font-display text-4xl leading-none">{feature.label}</div>
                  <div className="mt-2 font-mono text-[11px] uppercase text-white/60">
                    {feature.value}
                  </div>
                </div>
              )
            })}
          </div>
        </section>
      </main>
    </div>
  )
}

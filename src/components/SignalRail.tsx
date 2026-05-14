import { Activity, Gauge, RadioTower, ShieldCheck, Zap } from 'lucide-react'
import type { CSSProperties } from 'react'

import { useAppStore } from '../store/useAppStore'
import { Panel } from './ui/Panel'

const lanes = [
  ['SWAP', 'quote engine', 'bg-quantum-cyan'],
  ['SEND', 'token vector', 'bg-quantum-green'],
  ['FAUCET', 'fuel link', 'bg-quantum-yellow'],
  ['DEPLOY', 'bytecode forge', 'bg-quantum-red']
] as const

export function SignalRail() {
  const txHistory = useAppStore((state) => state.txHistory)
  const deployedTokens = useAppStore((state) => state.deployedTokens)
  const latest = txHistory[0]
  const pending = txHistory.filter((tx) => tx.status === 'pending').length
  const success = txHistory.filter((tx) => tx.status === 'success').length
  const error = txHistory.filter((tx) => tx.status === 'error').length

  return (
    <Panel className="signal-rail animate-reveal bg-quantum-black p-0 text-white" shadow="cyan">
      <div className="signal-rail-grid" />
      <div className="relative z-10 border-b-4 border-white bg-white px-4 py-3 text-quantum-black">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 font-display text-3xl leading-none">
            <RadioTower className="h-6 w-6 text-quantum-red" />
            LIVE SIGNAL
          </div>
          <div className="border-4 border-quantum-black bg-quantum-yellow px-2 py-1 font-mono text-[10px] uppercase shadow-[4px_4px_0_#111]">
            {latest?.status ?? 'ready'}
          </div>
        </div>
      </div>

      <div className="relative z-10 space-y-3 p-4">
        <div className="grid grid-cols-4 gap-2 font-mono text-[10px] uppercase text-quantum-black">
          {[
            ['RUN', pending, 'bg-quantum-yellow'],
            ['OK', success, 'bg-quantum-green'],
            ['ERR', error, 'bg-quantum-red'],
            ['CA', deployedTokens.length, 'bg-quantum-cyan']
          ].map(([label, value, tone]) => (
            <div
              key={label}
              className={`${tone} border-4 border-white px-2 py-2 shadow-[4px_4px_0_#fff]`}
            >
              <div>{label}</div>
              <div className="font-display text-2xl leading-none">{value}</div>
            </div>
          ))}
        </div>

        <div className="signal-ring" aria-hidden="true">
          <span />
          <i />
          <b />
        </div>

        <div className="space-y-2">
          {lanes.map(([label, desc, tone], index) => {
            const live = latest?.kind.toUpperCase() === label || latest?.summary.toUpperCase().includes(label)
            return (
              <div
                key={label}
                className={`signal-lane ${live ? 'signal-lane-live' : ''}`}
                style={{ '--lane-delay': `${index * 120}ms` } as CSSProperties}
              >
                <span className={`${tone} h-8 w-8 border-4 border-white`} />
                <div className="min-w-0 flex-1">
                  <div className="font-display text-2xl leading-none">{label}</div>
                  <div className="truncate font-mono text-[10px] uppercase text-white/58">{desc}</div>
                </div>
                <Activity className="h-4 w-4 text-quantum-yellow" />
              </div>
            )
          })}
        </div>

        <div className="grid grid-cols-[1fr_auto] gap-2 border-4 border-white bg-white p-2 text-quantum-black shadow-[5px_5px_0_#00e5ff]">
          <div className="font-mono text-[10px] uppercase">
            <div className="text-quantum-black/55">Latest</div>
            <div className="truncate">{latest?.summary ?? 'waiting for first tx'}</div>
          </div>
          <div className="grid h-10 w-10 place-items-center border-4 border-quantum-black bg-quantum-purple">
            {pending ? <Zap className="h-5 w-5" /> : <ShieldCheck className="h-5 w-5" />}
          </div>
        </div>

        <div className="signal-meter border-4 border-white bg-quantum-paper p-2 shadow-[5px_5px_0_#ff4d8d]">
          <Gauge className="h-4 w-4 text-quantum-purple" />
          <span />
          <span />
          <span />
          <span />
        </div>
      </div>
    </Panel>
  )
}

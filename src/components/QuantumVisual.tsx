import devMark from '../assets/quantum-dev.svg'
import { Panel } from './ui/Panel'

export function QuantumVisual() {
  return (
    <Panel className="min-h-[360px] animate-reveal overflow-hidden" shadow="yellow">
      <div className="scanline" />
      <div className="relative z-10 flex h-full min-h-[320px] flex-col justify-between">
        <div>
          <div className="font-display text-5xl leading-none text-quantum-yellow">
            QUANTUM CORE
          </div>
          <p className="mt-2 max-w-sm font-mono text-xs uppercase leading-5 text-white/70">
            Arc liquidity signal / Lugert dev mark
          </p>
        </div>

        <div className="quantum-stage" aria-hidden="true">
          <div className="quantum-cube">
            <span />
            <span />
            <span />
          </div>
          <div className="orbit orbit-a" />
          <div className="orbit orbit-b" />
          <div className="orbit orbit-c" />
        </div>

        <img
          src={devMark}
          alt="Lugert developer mark"
          className="absolute bottom-0 right-0 w-36 border-2 border-white bg-black shadow-[4px_4px_0_#5FC8BA] md:w-44"
        />
      </div>
    </Panel>
  )
}

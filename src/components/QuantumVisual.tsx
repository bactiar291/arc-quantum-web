import { Panel } from './ui/Panel'

export function QuantumVisual() {
  return (
    <Panel className="min-h-[360px] animate-reveal overflow-hidden bg-quantum-yellow" shadow="red">
      <div className="scanline" />
      <div className="relative z-10 flex h-full min-h-[320px] flex-col justify-between">
        <div>
          <div className="font-display text-5xl leading-none text-quantum-ink">
            ARC PAINT CORE
          </div>
          <p className="mt-2 max-w-sm font-mono text-xs uppercase leading-5 text-quantum-ink/70">
            Abstract 2D cross mark, moving mesh, hard-shadow brutal console.
          </p>
        </div>

        <div className="quantum-stage" aria-hidden="true">
          <div className="paint-core">
            <span />
            <i />
            <b />
            <em className="paint-dot paint-dot-a" />
            <em className="paint-dot paint-dot-b" />
          </div>
        </div>

        <div className="absolute bottom-4 right-4 border-4 border-quantum-black bg-white px-3 py-2 font-mono text-xs uppercase text-quantum-ink shadow-[5px_5px_0_#111]">
          AppKit / Public RPC
        </div>
      </div>
    </Panel>
  )
}

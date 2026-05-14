import { Atom, LoaderCircle } from 'lucide-react'

interface QuantumBusyOverlayProps {
  active: boolean
  title: string
  subtitle: string
  tone?: 'cyan' | 'yellow' | 'green' | 'purple'
}

export function QuantumBusyOverlay({
  active,
  title,
  subtitle,
  tone = 'cyan'
}: QuantumBusyOverlayProps) {
  if (!active) return null

  return (
    <div className={`quantum-busy quantum-busy-${tone}`} role="status" aria-live="polite">
      <div className="quantum-busy-card">
        <div className="quantum-loader-stage" aria-hidden="true">
          <div className="quantum-loader-core">
            <Atom className="h-10 w-10" />
          </div>
          <div className="quantum-loader-orbit quantum-loader-orbit-a" />
          <div className="quantum-loader-orbit quantum-loader-orbit-b" />
          <div className="quantum-loader-orbit quantum-loader-orbit-c" />
          <div className="quantum-loader-particle quantum-loader-particle-a" />
          <div className="quantum-loader-particle quantum-loader-particle-b" />
          <div className="quantum-loader-particle quantum-loader-particle-c" />
        </div>
        <div className="mt-5 flex items-center justify-center gap-2 font-display text-3xl">
          <LoaderCircle className="h-6 w-6 animate-spin" />
          {title}
        </div>
        <div className="mt-2 max-w-sm text-center font-mono text-xs uppercase text-quantum-black/60">
          {subtitle}
        </div>
      </div>
    </div>
  )
}

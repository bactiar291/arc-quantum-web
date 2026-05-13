import { ExternalLink } from 'lucide-react'
import type { Hex } from 'viem'

import { txUrl } from '../../lib/arc'

interface TxStatusProps {
  hash?: Hex
  error?: string
  busy?: boolean
}

export function TxStatus({ hash, error, busy }: TxStatusProps) {
  if (!hash && !error && !busy) return null

  return (
    <div className="mt-4 border-2 border-white bg-black p-3 font-mono text-xs uppercase">
      {busy ? (
        <div className="animate-glitch text-quantum-yellow">QUANTUM PROCESSING...</div>
      ) : null}
      {hash ? (
        <a
          href={txUrl(hash)}
          target="_blank"
          rel="noreferrer"
          className="mt-2 flex items-center gap-2 text-quantum-cyan hover:text-quantum-yellow"
        >
          TX {hash.slice(0, 10)}...{hash.slice(-6)}
          <ExternalLink className="h-4 w-4" />
        </a>
      ) : null}
      {error ? <div className="mt-2 text-quantum-red">{error}</div> : null}
    </div>
  )
}

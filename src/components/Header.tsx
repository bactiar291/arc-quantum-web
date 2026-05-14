import { PlugZap, ShieldCheck, Terminal } from 'lucide-react'

import { useArcAppKit } from '../hooks/useArcAppKit'
import { QuantumLogo } from './QuantumLogo'
import { Button } from './ui/Button'

function shortAddress(address: string) {
  return `${address.slice(0, 6)}...${address.slice(-4)}`
}

export function Header() {
  const { account, connect, isConnecting, isSignedIn, chainId } = useArcAppKit()

  return (
    <header className="sticky top-0 z-30 border-b-2 border-white bg-quantum-black/92 px-4 py-3 backdrop-blur md:px-6">
      <div className="mx-auto flex max-w-[1520px] flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3">
          <QuantumLogo size="sm" className="h-14 w-14" />
          <div>
            <h1 className="font-display text-4xl leading-none tracking-normal md:text-5xl">
              ARC QUANTUM GAS
            </h1>
            <div className="flex items-center gap-2 font-mono text-[11px] uppercase text-quantum-cyan">
              <Terminal className="h-3.5 w-3.5" />
              App Kit signer / wallet gas active
            </div>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="border-2 border-white bg-black px-3 py-2 font-mono text-[11px] uppercase text-white/70">
            CHAIN <b className="text-quantum-cyan">{chainId || 'OFF'}</b>
          </div>
          <div className="border-2 border-white bg-black px-3 py-2 font-mono text-[11px] uppercase text-white/70">
            SIGN <b className={isSignedIn ? 'text-quantum-green' : 'text-quantum-orange'}>{isSignedIn ? 'LOCKED' : 'REQ'}</b>
          </div>
          <Button onClick={connect} disabled={isConnecting} className="min-w-44">
            {isSignedIn ? <ShieldCheck className="h-5 w-5" /> : <PlugZap className="h-5 w-5" />}
            {account ? shortAddress(account) : isConnecting ? 'Signing In' : 'Sign In'}
          </Button>
        </div>
      </div>
    </header>
  )
}

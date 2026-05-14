import { Cpu, PlugZap, Terminal } from 'lucide-react'

import { useArcAppKit } from '../hooks/useArcAppKit'
import { Button } from './ui/Button'

function shortAddress(address: string) {
  return `${address.slice(0, 6)}...${address.slice(-4)}`
}

export function Header() {
  const { account, connect, isConnecting, chainId } = useArcAppKit()

  return (
    <header className="sticky top-0 z-30 border-b-2 border-white bg-quantum-black/95 px-4 py-3 backdrop-blur md:px-6">
      <div className="mx-auto flex max-w-[1520px] flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3">
          <div className="grid h-12 w-12 place-items-center border-2 border-white bg-quantum-yellow text-black shadow-[4px_4px_0_#7EE6D6]">
            <Cpu className="h-7 w-7" />
          </div>
          <div>
            <h1 className="font-display text-4xl leading-none tracking-normal md:text-5xl">
              ARC QUANTUM GAS
            </h1>
            <div className="flex items-center gap-2 font-mono text-[11px] uppercase text-quantum-cyan">
              <Terminal className="h-3.5 w-3.5" />
              App Kit wallet signer / ZeroDev sponsor env
            </div>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="border-2 border-white bg-black px-3 py-2 font-mono text-[11px] uppercase text-white/70">
            CHAIN <b className="text-quantum-cyan">{chainId || 'OFF'}</b>
          </div>
          <Button onClick={connect} disabled={isConnecting} className="min-w-44">
            <PlugZap className="h-5 w-5" />
            {account ? shortAddress(account) : isConnecting ? 'Connecting' : 'Connect'}
          </Button>
        </div>
      </div>
    </header>
  )
}

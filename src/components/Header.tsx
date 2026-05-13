import { ConnectButton } from '@rainbow-me/rainbowkit'
import { Cpu, Terminal } from 'lucide-react'

export function Header() {
  return (
    <header className="sticky top-0 z-30 border-b-2 border-white bg-black/95 px-4 py-3 backdrop-blur md:px-6">
      <div className="mx-auto flex max-w-[1520px] flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3">
          <div className="grid h-12 w-12 place-items-center border-2 border-white bg-quantum-yellow text-black shadow-[4px_4px_0_#00FFE5]">
            <Cpu className="h-7 w-7" />
          </div>
          <div>
            <h1 className="font-display text-4xl leading-none tracking-normal md:text-5xl">
              ARC QUANTUM LAB
            </h1>
            <div className="flex items-center gap-2 font-mono text-[11px] uppercase text-quantum-cyan">
              <Terminal className="h-3.5 w-3.5" />
              Testnet dapp / zero backend / session EOA
            </div>
          </div>
        </div>
        <ConnectButton chainStatus="icon" accountStatus="address" showBalance={false} />
      </div>
    </header>
  )
}

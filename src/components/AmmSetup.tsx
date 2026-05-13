import { Coins, RotateCcw, Wrench } from 'lucide-react'
import { useState } from 'react'

import { useAmmSetup } from '../hooks/useAmm'
import { Button } from './ui/Button'
import { Panel } from './ui/Panel'
import { TxStatus } from './ui/TxStatus'

const short = (value: string) => `${value.slice(0, 8)}...${value.slice(-6)}`

export function AmmSetup() {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const { factoryAddress, routerAddress, deployAmm, resetAmmConfig } = useAmmSetup()
  const ready = Boolean(factoryAddress && routerAddress)

  const runSetup = async () => {
    setBusy(true)
    setError('')
    try {
      await deployAmm()
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : String(caught))
    } finally {
      setBusy(false)
    }
  }

  return (
    <Panel shadow={ready ? 'cyan' : 'yellow'}>
      <div className="flex items-center gap-2 border-b-2 border-white pb-3 font-display text-3xl">
        <Coins className="h-6 w-6 text-quantum-yellow" />
        ARC AMM
      </div>
      <p className="mt-3 font-mono text-xs uppercase leading-5 text-white/70">
        Deploy factory/router once from connected wallet. After that approve,
        liquidity, and swap use the saved AMM address.
      </p>
      <div className="mt-3 space-y-2 font-mono text-[11px] uppercase">
        <div className="truncate text-quantum-yellow">
          Router: {routerAddress ? short(routerAddress) : 'missing'}
        </div>
        <div className="truncate text-quantum-cyan">
          Factory: {factoryAddress ? short(factoryAddress) : 'missing'}
        </div>
      </div>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <Button disabled={ready || busy} onClick={() => void runSetup()}>
          <Wrench className="h-5 w-5" />
          Setup AMM
        </Button>
        <Button variant="ghost" disabled={!ready || busy} onClick={resetAmmConfig}>
          <RotateCcw className="h-5 w-5" />
          Reset AMM
        </Button>
      </div>
      <TxStatus busy={busy} error={error} />
    </Panel>
  )
}

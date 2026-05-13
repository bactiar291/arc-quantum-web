import { Rocket } from 'lucide-react'
import { useState } from 'react'
import type { Address, Hex } from 'viem'

import { addressUrl } from '../../lib/arc'
import { useDeploy } from '../../hooks/useDeploy'
import { useSession } from '../../hooks/useSession'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'
import { Panel } from '../ui/Panel'
import { TxStatus } from '../ui/TxStatus'

export function DeployPanel() {
  const [name, setName] = useState('Quantum Token')
  const [symbol, setSymbol] = useState('QTM')
  const [supply, setSupply] = useState('1000000')
  const [decimals, setDecimals] = useState(18)
  const [busy, setBusy] = useState(false)
  const [hash, setHash] = useState<Hex>()
  const [contractAddress, setContractAddress] = useState<Address>()
  const [error, setError] = useState('')
  const { deployToken } = useDeploy()
  const { isSessionActive } = useSession()

  const runDeploy = async () => {
    setBusy(true)
    setError('')
    setHash(undefined)
    setContractAddress(undefined)
    try {
      const result = await deployToken({ name, symbol, supply, decimals })
      setHash(result.hash)
      setContractAddress(result.value)
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : String(caught))
    } finally {
      setBusy(false)
    }
  }

  return (
    <Panel className="animate-reveal" shadow="yellow">
      <div className="mb-5 flex items-center gap-2 border-b-2 border-white pb-3 font-display text-4xl">
        <Rocket className="h-7 w-7 text-quantum-yellow" />
        AUTO DEPLOY CONTRACT
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Input
          label="Token Name"
          value={name}
          onChange={(event) => setName(event.target.value)}
        />
        <Input
          label="Symbol"
          value={symbol}
          onChange={(event) => setSymbol(event.target.value)}
        />
        <Input
          label="Total Supply"
          value={supply}
          onChange={(event) => setSupply(event.target.value)}
          inputMode="decimal"
        />
        <Input
          label="Decimals"
          type="number"
          min={0}
          max={18}
          value={decimals}
          onChange={(event) => setDecimals(Number(event.target.value))}
        />
      </div>

      <div className="mt-5">
        <Button disabled={!isSessionActive || busy} onClick={() => void runDeploy()}>
          <Rocket className="h-5 w-5" />
          Deploy Contract
        </Button>
      </div>

      {contractAddress ? (
        <div className="mt-4 border-2 border-quantum-cyan bg-black p-3 font-mono text-xs uppercase">
          <div className="text-white/55">Contract Address</div>
          <a
            href={addressUrl(contractAddress)}
            target="_blank"
            rel="noreferrer"
            className="break-all text-quantum-cyan hover:text-quantum-yellow"
          >
            {contractAddress}
          </a>
        </div>
      ) : null}

      <TxStatus hash={hash} error={error} busy={busy} />
    </Panel>
  )
}

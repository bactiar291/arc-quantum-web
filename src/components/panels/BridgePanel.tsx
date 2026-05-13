import { GitBranchPlus } from 'lucide-react'
import { useState } from 'react'
import { isAddress, type Address } from 'viem'

import { useArcAppKit } from '../../hooks/useArcAppKit'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'
import { Panel } from '../ui/Panel'

export function BridgePanel() {
  const [amount, setAmount] = useState('1')
  const [recipient, setRecipient] = useState('')
  const [status, setStatus] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const { account, bridgeUsdcToArc, connect, isConnected, isConnecting } =
    useArcAppKit()

  const target = recipient || account || ''
  const validRecipient = !recipient || isAddress(recipient)

  const run = async () => {
    setBusy(true)
    setStatus('')
    setError('')
    try {
      const result = await bridgeUsdcToArc({
        amount,
        recipient: recipient ? (recipient as Address) : undefined
      })
      setStatus(`${result.state.toUpperCase()} / ${result.steps.length} STEPS`)
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : String(caught))
    } finally {
      setBusy(false)
    }
  }

  return (
    <Panel className="animate-reveal" shadow="yellow">
      <div className="mb-5 flex items-center gap-2 border-b-2 border-white pb-3 font-display text-4xl">
        <GitBranchPlus className="h-7 w-7 text-quantum-yellow" />
        USDC BRIDGE
      </div>

      <div className="space-y-4">
        <div className="grid gap-3 md:grid-cols-2">
          <div className="border-2 border-white bg-black p-4">
            <div className="font-display text-4xl">SEPOLIA</div>
            <div className="font-mono text-xs uppercase text-white/55">Source</div>
          </div>
          <div className="border-2 border-white bg-black p-4">
            <div className="font-display text-4xl">ARC</div>
            <div className="font-mono text-xs uppercase text-white/55">Destination</div>
          </div>
        </div>

        <Input
          label="USDC Amount"
          inputMode="decimal"
          value={amount}
          onChange={(event) => setAmount(event.target.value)}
        />
        <Input
          label="Recipient Override"
          value={recipient}
          onChange={(event) => setRecipient(event.target.value)}
          placeholder={account || '0x...'}
          hint="Empty = connected wallet"
        />

        <div className="truncate border-2 border-white bg-black p-3 font-mono text-xs text-quantum-cyan">
          TO {target || 'CONNECT WALLET'}
        </div>

        {!isConnected ? (
          <Button className="w-full" onClick={connect} disabled={isConnecting}>
            Connect Wallet
          </Button>
        ) : (
          <Button
            className="w-full"
            onClick={run}
            disabled={!amount || !validRecipient || busy}
          >
            {busy ? 'Bridging' : 'Bridge USDC'}
          </Button>
        )}

        {status ? (
          <div className="border-2 border-white bg-black p-3 font-mono text-xs text-quantum-green">
            {status}
          </div>
        ) : null}
        {error ? (
          <div className="break-words border-2 border-quantum-red bg-black p-3 font-mono text-xs text-quantum-red">
            {error}
          </div>
        ) : null}
      </div>
    </Panel>
  )
}

import { ArrowUpDown, GitBranchPlus } from 'lucide-react'
import { useState } from 'react'
import { isAddress, type Address } from 'viem'

import { useArcAppKit } from '../../hooks/useArcAppKit'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'
import { Panel } from '../ui/Panel'

export function BridgePanel() {
  const [direction, setDirection] = useState<'SEPOLIA_TO_ARC' | 'ARC_TO_SEPOLIA'>(
    'SEPOLIA_TO_ARC'
  )
  const [amount, setAmount] = useState('1')
  const [recipient, setRecipient] = useState('')
  const [customRecipient, setCustomRecipient] = useState(false)
  const [status, setStatus] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const { account, bridgeUsdc, connect, isConnected, isConnecting } =
    useArcAppKit()

  const fromChain = direction === 'SEPOLIA_TO_ARC' ? 'SEPOLIA' : 'ARC'
  const toChain = direction === 'SEPOLIA_TO_ARC' ? 'ARC' : 'SEPOLIA'
  const target = customRecipient && recipient ? recipient : account || ''
  const validRecipient = Boolean(target && isAddress(target))

  const flip = () => {
    setDirection((value) =>
      value === 'SEPOLIA_TO_ARC' ? 'ARC_TO_SEPOLIA' : 'SEPOLIA_TO_ARC'
    )
    setStatus('')
    setError('')
  }

  const run = async () => {
    setBusy(true)
    setStatus('')
    setError('')
    try {
      const result = await bridgeUsdc({
        amount,
        direction,
        recipient: target as Address
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
        <div className="grid gap-3 md:grid-cols-[1fr_56px_1fr]">
          <div className="border-2 border-white bg-black p-4">
            <div className="font-display text-4xl">{fromChain}</div>
            <div className="font-mono text-xs uppercase text-white/55">Source</div>
          </div>
          <button
            className="grid min-h-14 place-items-center border-2 border-white bg-quantum-cyan text-black shadow-[4px_4px_0_#000]"
            onClick={flip}
            type="button"
            aria-label="Flip bridge direction"
          >
            <ArrowUpDown className="h-6 w-6" />
          </button>
          <div className="border-2 border-white bg-black p-4">
            <div className="font-display text-4xl">{toChain}</div>
            <div className="font-mono text-xs uppercase text-white/55">Destination</div>
          </div>
        </div>

        <Input
          label="USDC Amount"
          inputMode="decimal"
          value={amount}
          onChange={(event) => setAmount(event.target.value)}
        />
        <div className="space-y-2">
          <div className="truncate border-2 border-white bg-black p-3 font-mono text-xs text-quantum-cyan">
            RECIPIENT {target || 'CONNECT WALLET'}
          </div>
          <button
            className="font-mono text-[11px] uppercase text-quantum-yellow underline decoration-2 underline-offset-4"
            onClick={() => setCustomRecipient((value) => !value)}
            type="button"
          >
            {customRecipient ? 'Use connected wallet' : 'Change to another address'}
          </button>
          {customRecipient ? (
            <Input
              label="Custom Recipient"
              value={recipient}
              onChange={(event) => setRecipient(event.target.value)}
              placeholder={account || '0x...'}
              hint="Empty = connected wallet"
            />
          ) : null}
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
            {busy ? 'Bridging' : `Bridge ${fromChain} to ${toChain}`}
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

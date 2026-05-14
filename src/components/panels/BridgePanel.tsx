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
  const [txHash, setTxHash] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const { account, bridgeUsdc, connect, isConnected, isConnecting, isSignedIn, signIn } =
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
    setTxHash('')
    setError('')
  }

  const run = async () => {
    setBusy(true)
    setStatus('')
    setTxHash('')
    setError('')
    try {
      const result = await bridgeUsdc({
        amount,
        direction,
        recipient: target as Address
      })
      const hash = [...result.steps].reverse().find((step) => step.txHash)?.txHash ?? ''
      setTxHash(hash)
      setStatus(
        result.state === 'success'
          ? 'BRIDGE SUBMITTED / FORWARDER MINT'
          : 'BRIDGE PENDING / FORWARDER MINT'
      )
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : String(caught))
    } finally {
      setBusy(false)
    }
  }

  return (
    <Panel className="compact-action-panel animate-reveal" shadow="yellow">
      <div className="mb-3 flex items-center gap-2 border-b-4 border-quantum-black pb-3 font-display text-3xl">
        <GitBranchPlus className="h-7 w-7 text-quantum-yellow" />
        USDC BRIDGE
      </div>

      <div className="space-y-3">
        <div className="grid gap-2 md:grid-cols-[1fr_52px_1fr]">
          <div className="mini-swap-box bg-quantum-yellow">
            <div className="font-display text-3xl">{fromChain}</div>
            <div className="font-mono text-xs uppercase text-quantum-black/55">Source</div>
          </div>
          <button
            className="grid min-h-14 place-items-center border-4 border-quantum-black bg-quantum-cyan text-quantum-black shadow-[5px_5px_0_#111]"
            onClick={flip}
            type="button"
            aria-label="Flip bridge direction"
          >
            <ArrowUpDown className="h-6 w-6" />
          </button>
          <div className="mini-swap-box bg-quantum-green">
            <div className="font-display text-3xl">{toChain}</div>
            <div className="font-mono text-xs uppercase text-quantum-black/55">Destination</div>
          </div>
        </div>

        <Input
          label="USDC Amount"
          inputMode="decimal"
          value={amount}
          onChange={(event) => setAmount(event.target.value)}
          className="compact-input"
        />
        <div className="space-y-2">
          <div className="truncate border-4 border-quantum-black bg-white p-3 font-mono text-xs text-quantum-cyan shadow-[5px_5px_0_#111]">
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
              className="compact-input"
            />
          ) : null}
        </div>

        {!isConnected ? (
          <Button className="w-full" onClick={connect} disabled={isConnecting}>
            Connect Wallet
          </Button>
        ) : !isSignedIn ? (
          <Button className="w-full" variant="cyan" onClick={signIn} disabled={isConnecting}>
            Verify Wallet
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
          <div className="space-y-1 border-4 border-quantum-black bg-quantum-green p-3 font-mono text-xs text-quantum-black shadow-[5px_5px_0_#111]">
            <div>{status}</div>
            {txHash ? <div className="break-all text-quantum-black/65">{txHash}</div> : null}
          </div>
        ) : null}
        {error ? (
          <div className="break-words border-4 border-quantum-black bg-quantum-red p-3 font-mono text-xs text-quantum-black shadow-[5px_5px_0_#111]">
            {error}
          </div>
        ) : null}
      </div>
    </Panel>
  )
}

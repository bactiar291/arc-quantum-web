import { CircleDollarSign, ShieldCheck, Shuffle } from 'lucide-react'
import { useMemo, useState } from 'react'
import type { Address, Hex } from 'viem'

import { quantumRouterAddress } from '../../lib/contracts'
import { findToken } from '../../lib/tokens'
import { useSession } from '../../hooks/useSession'
import { useSwap } from '../../hooks/useSwap'
import { useAppStore } from '../../store/useAppStore'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'
import { Panel } from '../ui/Panel'
import { TokenSelect } from '../ui/TokenSelect'
import { TxStatus } from '../ui/TxStatus'

export function SwapPanel() {
  const tokens = useAppStore((state) => state.deployedTokens)
  const [tokenIn, setTokenIn] = useState<Address | ''>('')
  const [tokenOut, setTokenOut] = useState<Address | ''>('')
  const [amount, setAmount] = useState('')
  const [slippage, setSlippage] = useState(50)
  const [busy, setBusy] = useState(false)
  const [hash, setHash] = useState<Hex>()
  const [error, setError] = useState('')
  const { isSessionActive } = useSession()
  const { approveRouter, executeSwap } = useSwap()

  const inputToken = useMemo(() => findToken(tokens, tokenIn), [tokens, tokenIn])
  const disabled =
    !isSessionActive || !quantumRouterAddress || !inputToken || !tokenOut || busy

  const run = async (mode: 'approve' | 'swap') => {
    setBusy(true)
    setError('')
    setHash(undefined)
    try {
      const result =
        mode === 'approve'
          ? await approveRouter(tokenIn as Address)
          : await executeSwap({
              tokenIn: tokenIn as Address,
              tokenOut: tokenOut as Address,
              amount,
              decimals: inputToken?.decimals ?? 18,
              slippageBps: slippage
            })
      setHash(result.hash)
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : String(caught))
    } finally {
      setBusy(false)
    }
  }

  return (
    <Panel className="animate-reveal" shadow="yellow">
      <div className="mb-5 flex items-center gap-2 border-b-2 border-white pb-3 font-display text-4xl">
        <Shuffle className="h-7 w-7 text-quantum-yellow" />
        QUANTUM SWAP
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <TokenSelect label="Token In" value={tokenIn} onChange={setTokenIn} />
        <TokenSelect label="Token Out" value={tokenOut} onChange={setTokenOut} />
        <Input
          label="Amount In"
          value={amount}
          onChange={(event) => setAmount(event.target.value)}
          placeholder="0.0"
          inputMode="decimal"
        />
        <Input
          label="Slippage BPS"
          type="number"
          min={1}
          max={2000}
          value={slippage}
          onChange={(event) => setSlippage(Number(event.target.value))}
          hint="50 = 0.5%"
        />
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <Button
          variant="cyan"
          disabled={!isSessionActive || !quantumRouterAddress || !tokenIn || busy}
          onClick={() => void run('approve')}
        >
          <ShieldCheck className="h-5 w-5" />
          Approve Max
        </Button>
        <Button disabled={disabled} onClick={() => void run('swap')}>
          <CircleDollarSign className="h-5 w-5" />
          Quantum Swap
        </Button>
      </div>

      <TxStatus hash={hash} error={error} busy={busy} />
    </Panel>
  )
}

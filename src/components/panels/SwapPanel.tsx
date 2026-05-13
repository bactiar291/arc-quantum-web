import { ArrowLeftRight, CircleDollarSign, ShieldCheck, Shuffle } from 'lucide-react'
import { useState } from 'react'
import type { Hex } from 'viem'

import { quantumRouterAddress } from '../../lib/contracts'
import { EURC_TOKEN, USDC_TOKEN } from '../../lib/tokens'
import { useSession } from '../../hooks/useSession'
import { useSwap } from '../../hooks/useSwap'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'
import { Panel } from '../ui/Panel'
import { TxStatus } from '../ui/TxStatus'

type SwapDirection = 'usdcToEurc' | 'eurcToUsdc'

export function SwapPanel() {
  const [direction, setDirection] = useState<SwapDirection>('usdcToEurc')
  const [amount, setAmount] = useState('')
  const [slippage, setSlippage] = useState(50)
  const [busy, setBusy] = useState(false)
  const [hash, setHash] = useState<Hex>()
  const [error, setError] = useState('')
  const { isSessionActive } = useSession()
  const { approveRouter, executeSwap } = useSwap()

  const tokenIn = direction === 'usdcToEurc' ? USDC_TOKEN : EURC_TOKEN
  const tokenOut = direction === 'usdcToEurc' ? EURC_TOKEN : USDC_TOKEN
  const disabled = !isSessionActive || !quantumRouterAddress || busy
  const swapDisabled = disabled || !amount

  const run = async (mode: 'approve' | 'swap') => {
    setBusy(true)
    setError('')
    setHash(undefined)
    try {
      const result =
        mode === 'approve'
          ? await approveRouter(tokenIn.address)
          : await executeSwap({
              tokenIn: tokenIn.address,
              tokenOut: tokenOut.address,
              amount,
              decimals: tokenIn.decimals,
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

      <div className="mb-4 border-2 border-white bg-black p-4 shadow-[4px_4px_0_#00FFE5]">
        <div className="font-display text-2xl text-quantum-yellow">
          FIXED ARC PAIR
        </div>
        <div className="mt-2 grid gap-3 md:grid-cols-[1fr_auto_1fr] md:items-center">
          <div className="border-2 border-white p-3">
            <div className="font-display text-3xl">{tokenIn.symbol}</div>
            <div className="truncate font-mono text-xs text-white/50">
              {tokenIn.address}
            </div>
          </div>
          <Button
            variant="cyan"
            className="w-full md:w-14"
            onClick={() =>
              setDirection((current) =>
                current === 'usdcToEurc' ? 'eurcToUsdc' : 'usdcToEurc'
              )
            }
          >
            <ArrowLeftRight className="h-5 w-5" />
          </Button>
          <div className="border-2 border-white p-3">
            <div className="font-display text-3xl">{tokenOut.symbol}</div>
            <div className="truncate font-mono text-xs text-white/50">
              {tokenOut.address}
            </div>
          </div>
        </div>
        <div className="mt-3 font-mono text-xs uppercase text-white/60">
          Fund smart account with {tokenIn.symbol}. Output returns to smart
          account.
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Input
          label={`${tokenIn.symbol} Amount`}
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
          disabled={disabled}
          onClick={() => void run('approve')}
        >
          <ShieldCheck className="h-5 w-5" />
          Approve Max
        </Button>
        <Button disabled={swapDisabled} onClick={() => void run('swap')}>
          <CircleDollarSign className="h-5 w-5" />
          Quantum Swap
        </Button>
      </div>

      <TxStatus hash={hash} error={error} busy={busy} />
    </Panel>
  )
}

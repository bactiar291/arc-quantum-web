import { Boxes, ShieldCheck } from 'lucide-react'
import { useState } from 'react'
import type { Hex } from 'viem'

import { quantumRouterAddress } from '../../lib/contracts'
import { EURC_TOKEN, USDC_TOKEN } from '../../lib/tokens'
import { useLiquidity } from '../../hooks/useLiquidity'
import { useSession } from '../../hooks/useSession'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'
import { Panel } from '../ui/Panel'
import { TxStatus } from '../ui/TxStatus'

export function LiquidityPanel() {
  const [amountA, setAmountA] = useState('')
  const [amountB, setAmountB] = useState('')
  const [busy, setBusy] = useState(false)
  const [hash, setHash] = useState<Hex>()
  const [error, setError] = useState('')
  const { isSessionActive } = useSession()
  const { approveRouter, addLiquidity } = useLiquidity()

  const tokenA = USDC_TOKEN
  const tokenB = EURC_TOKEN
  const disabled = !isSessionActive || !quantumRouterAddress || busy
  const liquidityDisabled = disabled || !amountA || !amountB

  const runApprove = async (token: typeof USDC_TOKEN) => {
    setBusy(true)
    setError('')
    setHash(undefined)
    try {
      const result = await approveRouter(token.address)
      setHash(result.hash)
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : String(caught))
    } finally {
      setBusy(false)
    }
  }

  const runLiquidity = async () => {
    setBusy(true)
    setError('')
    setHash(undefined)
    try {
      const result = await addLiquidity({
        tokenA: tokenA.address,
        tokenB: tokenB.address,
        amountA,
        amountB,
        decimalsA: tokenA.decimals,
        decimalsB: tokenB.decimals
      })
      setHash(result.hash)
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : String(caught))
    } finally {
      setBusy(false)
    }
  }

  return (
    <Panel className="animate-reveal" shadow="cyan">
      <div className="mb-5 flex items-center gap-2 border-b-2 border-white pb-3 font-display text-4xl">
        <Boxes className="h-7 w-7 text-quantum-cyan" />
        ADD LIQUIDITY
      </div>

      <div className="mb-4 border-2 border-white bg-black p-4 shadow-[4px_4px_0_#00FFE5]">
        <div className="font-display text-2xl text-quantum-cyan">
          FIXED ARC POOL
        </div>
        <div className="mt-2 grid gap-3 md:grid-cols-2">
          {[tokenA, tokenB].map((token) => (
            <div key={token.address} className="border-2 border-white p-3">
              <div className="font-display text-3xl">{token.symbol}</div>
              <div className="truncate font-mono text-xs text-white/50">
                {token.address}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Input
          label={`${tokenA.symbol} Amount`}
          value={amountA}
          onChange={(event) => setAmountA(event.target.value)}
          inputMode="decimal"
          placeholder="0.0"
        />
        <Input
          label={`${tokenB.symbol} Amount`}
          value={amountB}
          onChange={(event) => setAmountB(event.target.value)}
          inputMode="decimal"
          placeholder="0.0"
        />
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        <Button
          variant="cyan"
          disabled={disabled}
          onClick={() => void runApprove(tokenA)}
        >
          <ShieldCheck className="h-5 w-5" />
          Approve A
        </Button>
        <Button
          variant="cyan"
          disabled={disabled}
          onClick={() => void runApprove(tokenB)}
        >
          <ShieldCheck className="h-5 w-5" />
          Approve B
        </Button>
        <Button disabled={liquidityDisabled} onClick={() => void runLiquidity()}>
          <Boxes className="h-5 w-5" />
          Add Liquidity
        </Button>
      </div>

      <TxStatus hash={hash} error={error} busy={busy} />
    </Panel>
  )
}

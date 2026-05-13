import { Boxes, ShieldCheck } from 'lucide-react'
import { useMemo, useState } from 'react'
import type { Address, Hex } from 'viem'

import { quantumRouterAddress } from '../../lib/contracts'
import { findToken } from '../../lib/tokens'
import { useLiquidity } from '../../hooks/useLiquidity'
import { useSession } from '../../hooks/useSession'
import { useAppStore } from '../../store/useAppStore'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'
import { Panel } from '../ui/Panel'
import { TokenSelect } from '../ui/TokenSelect'
import { TxStatus } from '../ui/TxStatus'

export function LiquidityPanel() {
  const tokens = useAppStore((state) => state.deployedTokens)
  const [tokenA, setTokenA] = useState<Address | ''>('')
  const [tokenB, setTokenB] = useState<Address | ''>('')
  const [amountA, setAmountA] = useState('')
  const [amountB, setAmountB] = useState('')
  const [busy, setBusy] = useState(false)
  const [hash, setHash] = useState<Hex>()
  const [error, setError] = useState('')
  const { isSessionActive } = useSession()
  const { approveRouter, addLiquidity } = useLiquidity()

  const selectedA = useMemo(() => findToken(tokens, tokenA), [tokens, tokenA])
  const selectedB = useMemo(() => findToken(tokens, tokenB), [tokens, tokenB])
  const disabled =
    !isSessionActive ||
    !quantumRouterAddress ||
    !selectedA ||
    !selectedB ||
    tokenA === tokenB ||
    busy

  const runApprove = async (token: Address | '') => {
    setBusy(true)
    setError('')
    setHash(undefined)
    try {
      const result = await approveRouter(token as Address)
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
        tokenA: tokenA as Address,
        tokenB: tokenB as Address,
        amountA,
        amountB,
        decimalsA: selectedA?.decimals ?? 18,
        decimalsB: selectedB?.decimals ?? 18
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

      <div className="grid gap-4 md:grid-cols-2">
        <TokenSelect label="Token A" value={tokenA} onChange={setTokenA} />
        <TokenSelect label="Token B" value={tokenB} onChange={setTokenB} />
        <Input
          label="Amount A"
          value={amountA}
          onChange={(event) => setAmountA(event.target.value)}
          inputMode="decimal"
          placeholder="0.0"
        />
        <Input
          label="Amount B"
          value={amountB}
          onChange={(event) => setAmountB(event.target.value)}
          inputMode="decimal"
          placeholder="0.0"
        />
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        <Button
          variant="cyan"
          disabled={!isSessionActive || !quantumRouterAddress || !tokenA || busy}
          onClick={() => void runApprove(tokenA)}
        >
          <ShieldCheck className="h-5 w-5" />
          Approve A
        </Button>
        <Button
          variant="cyan"
          disabled={!isSessionActive || !quantumRouterAddress || !tokenB || busy}
          onClick={() => void runApprove(tokenB)}
        >
          <ShieldCheck className="h-5 w-5" />
          Approve B
        </Button>
        <Button disabled={disabled} onClick={() => void runLiquidity()}>
          <Boxes className="h-5 w-5" />
          Add Liquidity
        </Button>
      </div>

      <TxStatus hash={hash} error={error} busy={busy} />
    </Panel>
  )
}

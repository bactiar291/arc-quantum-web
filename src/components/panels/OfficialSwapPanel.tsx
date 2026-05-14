import { ArrowDown, RefreshCw, Shuffle } from 'lucide-react'
import { useState } from 'react'

import { useArcAppKit } from '../../hooks/useArcAppKit'
import { EURC_TOKEN, USDC_TOKEN } from '../../lib/tokens'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'
import { Panel } from '../ui/Panel'

type Direction = 'USDC_TO_EURC' | 'EURC_TO_USDC'

export function OfficialSwapPanel() {
  const [direction, setDirection] = useState<Direction>('USDC_TO_EURC')
  const [amount, setAmount] = useState('1')
  const [slippageBps, setSlippageBps] = useState(50)
  const [quote, setQuote] = useState('')
  const [hash, setHash] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState<'quote' | 'swap' | null>(null)
  const { connect, estimateSwap, executeSwap, isConnected, isConnecting } =
    useArcAppKit()

  const tokenIn = direction === 'USDC_TO_EURC' ? USDC_TOKEN : EURC_TOKEN
  const tokenOut = direction === 'USDC_TO_EURC' ? EURC_TOKEN : USDC_TOKEN
  const disabled = busy !== null || !amount

  const flip = () => {
    setDirection((value) =>
      value === 'USDC_TO_EURC' ? 'EURC_TO_USDC' : 'USDC_TO_EURC'
    )
    setQuote('')
    setHash('')
    setError('')
  }

  const runQuote = async () => {
    setBusy('quote')
    setQuote('')
    setError('')
    try {
      const result = await estimateSwap({ amount, direction, slippageBps })
      setQuote(`${result.estimatedOutput.amount} ${result.estimatedOutput.token}`)
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : String(caught))
    } finally {
      setBusy(null)
    }
  }

  const runSwap = async () => {
    setBusy('swap')
    setHash('')
    setError('')
    try {
      const result = await executeSwap({ amount, direction, slippageBps })
      setHash(result.txHash)
      if (result.amountOut) setQuote(`${result.amountOut} ${result.tokenOut}`)
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : String(caught))
    } finally {
      setBusy(null)
    }
  }

  return (
    <Panel className="animate-reveal" shadow="yellow">
      <div className="mb-5 flex items-center gap-2 border-b-2 border-white pb-3 font-display text-4xl">
        <Shuffle className="h-7 w-7 text-quantum-yellow" />
        ARC STABLE SWAP
      </div>

      <div className="space-y-3">
        <div className="border-2 border-white bg-black p-4">
          <div className="mb-3 font-mono text-[11px] uppercase text-white/55">
            From
          </div>
          <div className="grid gap-3 md:grid-cols-[1fr_190px]">
            <Input
              label="Amount"
              inputMode="decimal"
              value={amount}
              onChange={(event) => setAmount(event.target.value)}
            />
            <div className="border-2 border-white bg-quantum-panel p-3">
              <div className="font-display text-4xl leading-none">
                {tokenIn.symbol}
              </div>
              <div className="truncate font-mono text-[11px] text-white/50">
                {tokenIn.address}
              </div>
            </div>
          </div>
        </div>

        <button
          className="mx-auto grid h-12 w-12 place-items-center border-2 border-white bg-quantum-cyan text-black shadow-[4px_4px_0_#000]"
          onClick={flip}
          aria-label="Flip swap direction"
        >
          <ArrowDown className="h-6 w-6" />
        </button>

        <div className="border-2 border-white bg-black p-4">
          <div className="mb-3 font-mono text-[11px] uppercase text-white/55">
            To
          </div>
          <div className="border-2 border-white bg-quantum-panel p-4">
            <div className="font-display text-5xl leading-none">
              {tokenOut.symbol}
            </div>
            <div className="truncate font-mono text-xs text-white/50">
              {tokenOut.address}
            </div>
            <div className="mt-3 border-2 border-white bg-black p-3 font-mono text-sm text-quantum-cyan">
              {quote || 'QUOTE READY AFTER ESTIMATE'}
            </div>
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-[1fr_160px]">
          <Input
            label="Slippage BPS"
            type="number"
            min={10}
            max={500}
            value={slippageBps}
            onChange={(event) => setSlippageBps(Number(event.target.value))}
            hint="50 = 0.5%"
          />
          <Button variant="ghost" onClick={runQuote} disabled={disabled}>
            <RefreshCw className="h-5 w-5" />
            {busy === 'quote' ? 'Quoting' : 'Quote'}
          </Button>
        </div>

        {!isConnected ? (
          <Button className="w-full" onClick={connect} disabled={isConnecting}>
            Connect Arc Wallet
          </Button>
        ) : (
          <Button className="w-full" onClick={runSwap} disabled={disabled}>
            {busy === 'swap' ? 'Swapping' : 'Swap Wallet Gas'}
          </Button>
        )}

        <div className="border-2 border-white bg-black p-3 font-mono text-[11px] uppercase leading-5 text-white/60">
          Mode aktif: Circle App Kit wallet signer. Sponsor AA belum dipakai di
          path swap ini, jadi konfirmasi wallet/gas popup masih normal.
        </div>

        {hash ? (
          <div className="break-all border-2 border-white bg-black p-3 font-mono text-xs text-quantum-green">
            TX {hash}
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

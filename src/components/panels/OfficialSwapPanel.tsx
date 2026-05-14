import { ArrowDown, RefreshCw, Shuffle } from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'

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
  const [quoteBusy, setQuoteBusy] = useState(false)
  const [swapBusy, setSwapBusy] = useState(false)
  const quoteRequest = useRef(0)
  const { connect, estimateSwap, executeSwap, isConnected, isConnecting, isSignedIn, signIn } =
    useArcAppKit()

  const tokenIn = direction === 'USDC_TO_EURC' ? USDC_TOKEN : EURC_TOKEN
  const tokenOut = direction === 'USDC_TO_EURC' ? EURC_TOKEN : USDC_TOKEN
  const trimmedAmount = amount.trim()
  const validAmount = /^\d+(\.\d+)?$/.test(trimmedAmount) && Number(trimmedAmount) > 0
  const disabled = swapBusy || !validAmount

  const flip = () => {
    setDirection((value) =>
      value === 'USDC_TO_EURC' ? 'EURC_TO_USDC' : 'USDC_TO_EURC'
    )
    setQuote('REFRESHING QUOTE...')
    setHash('')
    setError('')
  }

  const runQuote = useCallback(async () => {
    if (!isConnected) {
      setQuote('CONNECT WALLET FOR LIVE QUOTE')
      return
    }
    if (!validAmount) {
      setQuote('TYPE VALID AMOUNT')
      return
    }
    const requestId = quoteRequest.current + 1
    quoteRequest.current = requestId
    setQuoteBusy(true)
    setQuote('REFRESHING QUOTE...')
    setError('')
    try {
      const result = await estimateSwap({ amount: trimmedAmount, direction, slippageBps })
      if (requestId !== quoteRequest.current) return
      setQuote(`${result.estimatedOutput.amount} ${result.estimatedOutput.token}`)
    } catch (caught) {
      if (requestId !== quoteRequest.current) return
      setError(caught instanceof Error ? caught.message : String(caught))
      setQuote('QUOTE FAILED - RETRY')
    } finally {
      if (requestId === quoteRequest.current) setQuoteBusy(false)
    }
  }, [direction, estimateSwap, isConnected, slippageBps, trimmedAmount, validAmount])

  useEffect(() => {
    if (!isConnected) {
      setQuote('CONNECT WALLET FOR LIVE QUOTE')
      return
    }
    if (!validAmount) {
      setQuote('TYPE VALID AMOUNT')
      return
    }
    setQuote('REFRESHING QUOTE...')
    const timer = window.setTimeout(() => {
      void runQuote()
    }, 450)
    return () => window.clearTimeout(timer)
  }, [direction, isConnected, runQuote, slippageBps, validAmount])

  const runSwap = async () => {
    setSwapBusy(true)
    setHash('')
    setError('')
    try {
      const result = await executeSwap({ amount: trimmedAmount, direction, slippageBps })
      setHash(result.txHash)
      if (result.amountOut) setQuote(`${result.amountOut} ${result.tokenOut}`)
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : String(caught))
    } finally {
      setSwapBusy(false)
    }
  }

  return (
    <Panel className="animate-reveal" shadow="yellow">
      <div className="mb-5 flex items-center gap-2 border-b-4 border-quantum-black pb-3 font-display text-4xl">
        <Shuffle className="h-7 w-7 text-quantum-yellow" />
        ARC STABLE SWAP
      </div>

      <div className="space-y-3">
        <div className="border-4 border-quantum-black bg-white p-4 shadow-[5px_5px_0_#111]">
          <div className="mb-3 font-mono text-[11px] uppercase text-quantum-black/55">
            From
          </div>
          <div className="grid gap-3 md:grid-cols-[1fr_190px]">
            <Input
              label="Amount"
              inputMode="decimal"
              value={amount}
              onChange={(event) => setAmount(event.target.value)}
            />
            <div className="border-4 border-quantum-black bg-quantum-yellow p-3">
              <div className="font-display text-4xl leading-none">
                {tokenIn.symbol}
              </div>
              <div className="truncate font-mono text-[11px] text-quantum-black/50">
                {tokenIn.address}
              </div>
            </div>
          </div>
        </div>

        <div className="border-4 border-quantum-black bg-quantum-purple p-3 font-mono text-xs uppercase leading-5 text-quantum-black shadow-[5px_5px_0_#111]">
          Official Circle Swap on Arc Testnet is limited to supported stable
          assets. Tokens deployed from this app need an AMM router and liquidity
          pool before they can be swapped.
        </div>

        <button
          className="mx-auto grid h-12 w-12 place-items-center border-4 border-quantum-black bg-quantum-cyan text-quantum-black shadow-[5px_5px_0_#111]"
          onClick={flip}
          aria-label="Flip swap direction"
        >
          <ArrowDown className="h-6 w-6" />
        </button>

        <div className="border-4 border-quantum-black bg-white p-4 shadow-[5px_5px_0_#111]">
          <div className="mb-3 font-mono text-[11px] uppercase text-quantum-black/55">
            To
          </div>
          <div className="border-4 border-quantum-black bg-quantum-green p-4">
            <div className="font-display text-5xl leading-none">
              {tokenOut.symbol}
            </div>
            <div className="truncate font-mono text-xs text-quantum-black/50">
              {tokenOut.address}
            </div>
            <div className="mt-3 border-4 border-quantum-black bg-white p-3 font-mono text-sm text-quantum-cyan shadow-[5px_5px_0_#111]">
              <div className={quoteBusy ? 'animate-pulse text-quantum-yellow' : ''}>
                {quote || 'QUOTE AUTO REFRESHING'}
              </div>
              <div className="mt-1 text-[10px] uppercase text-quantum-black/40">
                Updates after pair, amount, or slippage change.
              </div>
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
          <Button variant="ghost" onClick={() => void runQuote()} disabled={quoteBusy || disabled}>
            <RefreshCw className={quoteBusy ? 'h-5 w-5 animate-spin' : 'h-5 w-5'} />
            {quoteBusy ? 'Refreshing' : 'Refresh Quote'}
          </Button>
        </div>

        {!isConnected ? (
          <Button className="w-full" onClick={connect} disabled={isConnecting}>
            Connect Arc Wallet
          </Button>
        ) : !isSignedIn ? (
          <Button className="w-full" variant="cyan" onClick={signIn} disabled={isConnecting}>
            Verify Wallet
          </Button>
        ) : (
          <Button className="w-full" onClick={runSwap} disabled={disabled}>
            {swapBusy ? 'Swapping' : 'Swap Wallet Gas'}
          </Button>
        )}

        {hash ? (
          <div className="break-all border-4 border-quantum-black bg-quantum-green p-3 font-mono text-xs text-quantum-black shadow-[5px_5px_0_#111]">
            TX {hash}
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

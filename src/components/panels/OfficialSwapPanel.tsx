import { ArrowDown, RefreshCw, Shuffle } from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { formatUnits } from 'viem'
import { useReadContract } from 'wagmi'

import { useArcAppKit } from '../../hooks/useArcAppKit'
import { ARC_CHAIN_ID } from '../../lib/arc'
import { erc20Abi } from '../../lib/contracts'
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
  const { account, connect, estimateSwap, executeSwap, isConnected, isConnecting, isSignedIn, signIn } =
    useArcAppKit()

  const tokenIn = direction === 'USDC_TO_EURC' ? USDC_TOKEN : EURC_TOKEN
  const tokenOut = direction === 'USDC_TO_EURC' ? EURC_TOKEN : USDC_TOKEN
  const trimmedAmount = amount.trim()
  const validAmount = /^\d+(\.\d+)?$/.test(trimmedAmount) && Number(trimmedAmount) > 0
  const disabled = swapBusy || !validAmount
  const { data: tokenInBalance, isLoading: balanceLoading } = useReadContract({
    address: tokenIn.address,
    abi: erc20Abi,
    functionName: 'balanceOf',
    args: account ? [account] : undefined,
    chainId: ARC_CHAIN_ID,
    query: {
      enabled: Boolean(account),
      refetchInterval: account ? 4000 : false,
      refetchOnWindowFocus: true
    }
  })
  const balanceValue = typeof tokenInBalance === 'bigint' ? tokenInBalance : null
  const balanceLabel = !account
    ? '-'
    : balanceLoading
      ? '...'
      : balanceValue !== null
        ? formatUnits(balanceValue, tokenIn.decimals).replace(/(\.\d{0,6})\d+$/, '$1').replace(/\.0+$/, '')
        : '0'
  const numericQuote = Number.parseFloat(quote)
  const numericAmount = Number.parseFloat(trimmedAmount)
  const rate =
    Number.isFinite(numericQuote) && Number.isFinite(numericAmount) && numericAmount > 0
      ? numericQuote / numericAmount
      : null

  const setPercentAmount = (percent: number) => {
    if (balanceValue === null || balanceValue <= 0n) return
    const nextValue = (balanceValue * BigInt(percent)) / 100n
    setAmount(formatUnits(nextValue, tokenIn.decimals))
    setHash('')
    setError('')
  }

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
    <Panel className="compact-action-panel animate-reveal" shadow="yellow">
      <div className="mb-3 flex items-center gap-2 border-b-4 border-quantum-black pb-3 font-display text-3xl">
        <Shuffle className="h-7 w-7 text-quantum-yellow" />
        ARC STABLE SWAP
      </div>

      <div className="space-y-2">
        <div className="mini-swap-box bg-white">
          <div className="mb-2 flex items-center justify-between gap-3 font-mono text-[11px] uppercase text-quantum-black/55">
            <span>From</span>
            <span>
              Bal {balanceLabel} {tokenIn.symbol}
            </span>
          </div>
          <div className="grid gap-2 md:grid-cols-[1fr_150px]">
            <Input
              label="Amount"
              inputMode="decimal"
              value={amount}
              onChange={(event) => setAmount(event.target.value)}
              className="compact-input"
            />
            <div className="border-4 border-quantum-black bg-quantum-yellow p-3 shadow-[4px_4px_0_#111]">
              <div className="font-display text-3xl leading-none">
                {tokenIn.symbol}
              </div>
              <div className="truncate font-mono text-[11px] text-quantum-black/50">
                {tokenIn.address}
              </div>
            </div>
          </div>
          <div className="mt-2 grid grid-cols-4 gap-2">
            {[25, 50, 75, 100].map((percent) => (
              <button
                key={percent}
                className="border-4 border-quantum-black bg-quantum-paper px-2 py-1 font-mono text-[11px] uppercase shadow-[3px_3px_0_#111] disabled:opacity-40"
                disabled={balanceValue === null || balanceValue <= 0n}
                onClick={() => setPercentAmount(percent)}
                type="button"
              >
                {percent}%
              </button>
            ))}
          </div>
        </div>

        <div className="grid gap-2 md:grid-cols-[1fr_52px_1fr]">
          <div className="mini-swap-box bg-quantum-purple font-mono text-[11px] uppercase leading-4 text-quantum-black">
            Circle route: USDC / EURC only on Arc Testnet.
          </div>
          <button
            className="grid min-h-12 place-items-center border-4 border-quantum-black bg-quantum-cyan text-quantum-black shadow-[4px_4px_0_#111]"
            onClick={flip}
            aria-label="Flip swap direction"
            type="button"
          >
            <ArrowDown className="h-6 w-6" />
          </button>
          <div className="mini-swap-box bg-quantum-green">
            <div className="mb-1 font-mono text-[11px] uppercase text-quantum-black/55">To</div>
            <div className="flex items-end justify-between gap-2">
              <div>
                <div className="font-display text-4xl leading-none">{tokenOut.symbol}</div>
                <div className="max-w-[160px] truncate font-mono text-[10px] text-quantum-black/50">
                  {tokenOut.address}
                </div>
              </div>
              <div className="text-right font-mono text-[11px] uppercase">
                <div className={quoteBusy ? 'animate-pulse text-quantum-yellow' : 'text-quantum-black'}>
                  {quote || 'AUTO'}
                </div>
                <div className="text-quantum-black/45">Est. output</div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid gap-2 md:grid-cols-[1fr_150px_150px]">
          <Input
            label="Slippage BPS"
            type="number"
            min={10}
            max={500}
            value={slippageBps}
            onChange={(event) => setSlippageBps(Number(event.target.value))}
            hint={`${(slippageBps / 100).toFixed(2)}%`}
            className="compact-input"
          />
          <div className="mini-swap-box bg-white font-mono text-[11px] uppercase">
            <div className="text-quantum-black/55">Rate</div>
            <div className="truncate text-quantum-cyan">
              {rate ? `1 ${tokenIn.symbol} ≈ ${rate.toFixed(6)} ${tokenOut.symbol}` : '-'}
            </div>
          </div>
          <Button variant="ghost" onClick={() => void runQuote()} disabled={quoteBusy || disabled}>
            <RefreshCw className={quoteBusy ? 'h-5 w-5 animate-spin' : 'h-5 w-5'} />
            {quoteBusy ? 'Quote' : 'Refresh'}
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

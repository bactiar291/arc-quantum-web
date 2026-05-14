import { ArrowDown, ChevronDown, Settings, Shuffle } from 'lucide-react'
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
import { QuantumBusyOverlay } from '../ui/QuantumBusyOverlay'

type Direction = 'USDC_TO_EURC' | 'EURC_TO_USDC'

export function OfficialSwapPanel() {
  const [direction, setDirection] = useState<Direction>('USDC_TO_EURC')
  const [amount, setAmount] = useState('1')
  const [slippageBps, setSlippageBps] = useState(50)
  const [quote, setQuote] = useState('')
  const [hash, setHash] = useState('')
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
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
    setNotice('')
  }

  const flip = () => {
    setDirection((value) =>
      value === 'USDC_TO_EURC' ? 'EURC_TO_USDC' : 'USDC_TO_EURC'
    )
    setQuote('REFRESHING QUOTE...')
    setHash('')
    setError('')
    setNotice('')
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
    setNotice('')
    try {
      const result = await executeSwap({ amount: trimmedAmount, direction, slippageBps })
      setHash(result.txHash)
      if ((result as { pending?: boolean }).pending) {
        setNotice('TX SUBMITTED. ARC CONFIRMATION STILL PENDING; DO NOT RESEND.')
      }
      if (result.amountOut) setQuote(`${result.amountOut} ${result.tokenOut}`)
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : String(caught))
    } finally {
      setSwapBusy(false)
    }
  }

  return (
    <>
    <QuantumBusyOverlay
      active={swapBusy}
      title="Quantum Swap"
      subtitle={`${tokenIn.symbol} -> ${tokenOut.symbol} executing on Arc Testnet`}
      tone="cyan"
    />
    <div className="mx-auto w-full max-w-[430px]">
      <Panel className="compact-action-panel animate-reveal" shadow="yellow">
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2 font-display text-2xl">
            <Shuffle className="h-5 w-5 text-quantum-yellow" />
            Swap
          </div>
          <button
            className="grid h-8 w-8 place-items-center border-2 border-quantum-black/20 text-quantum-black/50 hover:border-quantum-black hover:text-quantum-black"
            onClick={() => void runQuote()}
            type="button"
            aria-label="Refresh quote settings"
          >
            <Settings className="h-4 w-4" />
          </button>
        </div>

        <div className="border-2 border-quantum-black/10 bg-quantum-paper p-3 hover:border-quantum-black/20">
          <div className="mb-2 font-mono text-[11px] uppercase text-quantum-black/50">
            You pay
          </div>
          <div className="flex items-center gap-3">
            <Input
              aria-label="Amount to pay"
              className="min-h-0 flex-1 border-0 bg-transparent p-0 text-xl font-bold shadow-none focus:bg-transparent focus:shadow-none"
              inputMode="decimal"
              value={amount}
              onChange={(event) => {
                setAmount(event.target.value)
                setNotice('')
              }}
            />
            <div className="flex items-center gap-2 border-2 border-quantum-black bg-quantum-yellow px-3 py-1.5">
              <span className="font-display text-base">{tokenIn.symbol}</span>
              <ChevronDown className="h-3 w-3" />
            </div>
          </div>
          <div className="mt-2 flex justify-between font-mono text-xs text-quantum-black/40">
            <span>≈ ${Number(amount || 0).toFixed(2)}</span>
            <span>
              Balance: {balanceLabel} {tokenIn.symbol}
            </span>
          </div>
          <div className="mt-2 grid grid-cols-4 gap-2">
            {[25, 50, 75, 100].map((percent) => (
              <button
                key={percent}
                className="rounded border border-quantum-black/20 px-2 py-1 font-mono text-[11px] text-quantum-black/55 hover:border-quantum-black disabled:opacity-40"
                disabled={balanceValue === null || balanceValue <= 0n}
                onClick={() => setPercentAmount(percent)}
                type="button"
              >
                {percent}%
              </button>
            ))}
          </div>
        </div>

        <div className="my-1 flex justify-center">
          <button
            onClick={flip}
            aria-label="Flip swap direction"
            className="grid h-9 w-9 place-items-center border-2 border-quantum-black bg-white shadow-[3px_3px_0_#111] transition-transform active:translate-x-px active:translate-y-px"
            type="button"
          >
            <ArrowDown className="h-4 w-4" />
          </button>
        </div>

        <div className="border-2 border-quantum-black/10 bg-quantum-paper p-3">
          <div className="mb-2 font-mono text-[11px] uppercase text-quantum-black/50">
            You receive
          </div>
          <div className="flex items-center gap-3">
            <div
              className={`flex-1 font-display text-xl ${
                quoteBusy ? 'animate-pulse text-quantum-black/30' : ''
              }`}
            >
              {quote || '-'}
            </div>
            <div className="flex items-center gap-2 border-2 border-quantum-black bg-quantum-green px-3 py-1.5">
              <span className="font-display text-base">{tokenOut.symbol}</span>
              <ChevronDown className="h-3 w-3" />
            </div>
          </div>
          <div className="mt-2 font-mono text-xs text-quantum-black/40">
            {quoteBusy
              ? 'Refreshing...'
              : rate
                ? `1 ${tokenIn.symbol} ≈ ${rate.toFixed(6)} ${tokenOut.symbol}`
                : 'Auto-refreshes on change'}
          </div>
        </div>

        <div className="mt-3 flex items-center justify-between gap-3 border-t border-quantum-black/10 pt-3">
          <span className="font-mono text-xs text-quantum-black/50">Slippage</span>
          <div className="flex gap-1">
            {[10, 50, 100].map((bps) => (
              <button
                key={bps}
                onClick={() => setSlippageBps(bps)}
                className={`rounded border px-2 py-0.5 font-mono text-[11px] ${
                  slippageBps === bps
                    ? 'border-quantum-black bg-quantum-black text-white'
                    : 'border-quantum-black/20 text-quantum-black/50 hover:border-quantum-black/50'
                }`}
                type="button"
              >
                {bps / 100}%
              </button>
            ))}
          </div>
        </div>

        {!isConnected ? (
          <Button className="mt-3 w-full" onClick={connect} disabled={isConnecting}>
            Connect Wallet
          </Button>
        ) : !isSignedIn ? (
          <Button className="mt-3 w-full" variant="cyan" onClick={signIn} disabled={isConnecting}>
            Verify Wallet
          </Button>
        ) : (
          <Button className="mt-3 w-full" onClick={runSwap} disabled={disabled || swapBusy}>
            {swapBusy ? 'Swapping...' : `Swap ${tokenIn.symbol} -> ${tokenOut.symbol}`}
          </Button>
        )}

        {hash ? (
          <div className="mt-3 break-all rounded border-2 border-quantum-green bg-quantum-green/20 p-2 font-mono text-xs">
            {notice ? 'PENDING' : 'OK'} {hash}
          </div>
        ) : null}
        {notice ? (
          <div className="mt-3 rounded border-2 border-quantum-yellow bg-quantum-yellow/20 p-2 font-mono text-xs text-quantum-black">
            {notice}
          </div>
        ) : null}
        {error ? (
          <div className="mt-3 break-words rounded border-2 border-quantum-red/50 bg-quantum-red/10 p-2 font-mono text-xs text-quantum-red">
            {error}
          </div>
        ) : null}
      </Panel>
    </div>
    </>
  )
}

import { useQueryClient } from '@tanstack/react-query'
import { Dice5, Send } from 'lucide-react'
import { useMemo, useState } from 'react'
import { formatUnits, isAddress, parseUnits, type Address } from 'viem'
import { useBalance, useReadContract } from 'wagmi'

import { useArcAppKit } from '../../hooks/useArcAppKit'
import { ARC_CHAIN_ID } from '../../lib/arc'
import { erc20Abi } from '../../lib/contracts'
import { mergeTokens, USDC_TOKEN } from '../../lib/tokens'
import { useAppStore, type Token } from '../../store/useAppStore'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'
import { Panel } from '../ui/Panel'

type SendAsset =
  | {
      id: 'native'
      kind: 'native'
      name: string
      symbol: string
      decimals: number
    }
  | {
      id: string
      kind: 'erc20'
      token: Token
      address: Address
      name: string
      symbol: string
      decimals: number
    }

const nativeAsset = {
  id: 'native',
  kind: 'native',
  name: 'Arc Native USDC',
  symbol: 'USDC',
  decimals: 18
} satisfies SendAsset

function randomAddress() {
  const bytes = crypto.getRandomValues(new Uint8Array(20))
  const hex = Array.from(bytes)
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('')
  return `0x${hex}` as Address
}

function trimBalance(value: string) {
  const [whole, fraction = ''] = value.split('.')
  const shortFraction = fraction.slice(0, 6).replace(/0+$/, '')
  return shortFraction ? `${whole}.${shortFraction}` : whole
}

function shortAddress(value: Address) {
  return `${value.slice(0, 8)}...${value.slice(-6)}`
}

function parseAmount(amount: string, decimals: number) {
  try {
    const value = parseUnits(amount || '0', decimals)
    return value > 0n ? value : null
  } catch {
    return null
  }
}

export function StableSendPanel() {
  const queryClient = useQueryClient()
  const [assetId, setAssetId] = useState(USDC_TOKEN.address.toLowerCase())
  const [amount, setAmount] = useState('0.1')
  const [to, setTo] = useState('')
  const [hash, setHash] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const deployedTokens = useAppStore((state) => state.deployedTokens)
  const {
    account,
    connect,
    isConnected,
    isConnecting,
    isSignedIn,
    sendErc20Wallet,
    sendNativeWallet,
    signIn
  } = useArcAppKit()
  const validRecipient = isAddress(to)

  const assets = useMemo<SendAsset[]>(
    () => [
      nativeAsset,
      ...mergeTokens(deployedTokens).map((token) => ({
        id: token.address.toLowerCase(),
        kind: 'erc20' as const,
        token,
        address: token.address,
        name: token.name,
        symbol: token.symbol,
        decimals: token.decimals
      }))
    ],
    [deployedTokens]
  )

  const selectedAsset =
    assets.find((asset) => asset.id === assetId) ?? assets[0] ?? nativeAsset
  const amountValue = parseAmount(amount, selectedAsset.decimals)

  const { data: nativeBalance, isLoading: nativeLoading } = useBalance({
    address: account ?? undefined,
    chainId: ARC_CHAIN_ID,
    query: {
      enabled: Boolean(account && selectedAsset.kind === 'native'),
      refetchInterval: account ? 4000 : false,
      refetchOnWindowFocus: true
    }
  })

  const { data: erc20Balance, isLoading: erc20Loading } = useReadContract({
    address: selectedAsset.kind === 'erc20' ? selectedAsset.address : USDC_TOKEN.address,
    abi: erc20Abi,
    functionName: 'balanceOf',
    args: account ? [account] : undefined,
    chainId: ARC_CHAIN_ID,
    query: {
      enabled: Boolean(account && selectedAsset.kind === 'erc20'),
      refetchInterval: account ? 4000 : false,
      refetchOnWindowFocus: true
    }
  })

  const balanceValue =
    selectedAsset.kind === 'native'
      ? nativeBalance?.value ?? null
      : typeof erc20Balance === 'bigint'
        ? erc20Balance
        : null
  const balanceLoading =
    selectedAsset.kind === 'native' ? nativeLoading : erc20Loading
  const balanceLabel = !account
    ? '-'
    : balanceLoading
      ? '...'
      : balanceValue !== null
        ? trimBalance(formatUnits(balanceValue, selectedAsset.decimals))
        : '0'
  const invalidAmount = !amountValue
  const insufficient =
    amountValue !== null && balanceValue !== null && amountValue > balanceValue
  const cannotSend = !validRecipient || invalidAmount || insufficient || busy
  const setPercentAmount = (percent: number) => {
    if (balanceValue === null || balanceValue <= 0n) return
    const nextValue = (balanceValue * BigInt(percent)) / 100n
    setAmount(formatUnits(nextValue, selectedAsset.decimals))
    setHash('')
    setError('')
  }

  const run = async () => {
    if (cannotSend) return
    setBusy(true)
    setHash('')
    setError('')
    try {
      const recipient = to as Address
      if (selectedAsset.kind === 'native') {
        const result = await sendNativeWallet({ amount, to: recipient })
        setHash(result.txHash)
      } else {
        const result = await sendErc20Wallet({
          tokenAddress: selectedAsset.address,
          symbol: selectedAsset.symbol,
          decimals: selectedAsset.decimals,
          amount,
          to: recipient
        })
        setHash(result.txHash)
      }
      await queryClient.invalidateQueries()
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : String(caught))
    } finally {
      setBusy(false)
    }
  }

  return (
    <Panel className="compact-action-panel animate-reveal" shadow="cyan">
      <div className="mb-3 flex items-center gap-2 border-b-4 border-quantum-black pb-3 font-display text-3xl">
        <Send className="h-7 w-7 text-quantum-cyan" />
        DIRECT SEND
      </div>

      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
          {assets.map((asset) => (
            <Button
              key={asset.id}
              variant={assetId === asset.id ? 'cyan' : 'ghost'}
              className="min-h-10 flex-col gap-0 px-2 py-1 text-sm"
              onClick={() => setAssetId(asset.id)}
            >
              <span>{asset.kind === 'native' ? 'Native' : asset.symbol}</span>
              <span className="font-mono text-[10px] leading-none opacity-70">
                {asset.kind === 'native' ? 'Gas Token' : shortAddress(asset.address)}
              </span>
            </Button>
          ))}
        </div>

        <div className="mini-swap-box bg-white font-mono text-xs uppercase">
          <div className="flex items-center justify-between gap-3">
            <span className="text-quantum-black/55">Wallet Balance</span>
            <span className="text-quantum-cyan">
              {balanceLabel} {selectedAsset.symbol}
            </span>
          </div>
          <div className="mt-2 break-all text-quantum-black/45">
            {account ? account : 'Connect wallet first'}
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          <div>
            <Input
              label="Amount"
              inputMode="decimal"
              value={amount}
              onChange={(event) => setAmount(event.target.value)}
              className="compact-input"
            />
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
          <div className="space-y-2">
            <Input
              label="Recipient"
              value={to}
              onChange={(event) => setTo(event.target.value)}
              placeholder="0x..."
              className="compact-input"
            />
            <Button variant="ghost" className="w-full text-base" onClick={() => setTo(randomAddress())}>
              <Dice5 className="h-5 w-5" />
              Random Address
            </Button>
          </div>
        </div>

        {invalidAmount && amount ? (
          <div className="border-4 border-quantum-black bg-quantum-red p-3 font-mono text-xs uppercase text-quantum-black shadow-[5px_5px_0_#111]">
            Amount invalid or zero.
          </div>
        ) : null}
        {insufficient ? (
          <div className="border-4 border-quantum-black bg-quantum-red p-3 font-mono text-xs uppercase text-quantum-black shadow-[5px_5px_0_#111]">
            Wallet balance insufficient.
          </div>
        ) : null}

        {!isConnected ? (
          <Button className="w-full" onClick={connect} disabled={isConnecting}>
            Connect Arc Wallet
          </Button>
        ) : !isSignedIn ? (
          <Button className="w-full" variant="cyan" onClick={signIn} disabled={isConnecting}>
            Verify Wallet
          </Button>
        ) : (
          <Button className="w-full" onClick={run} disabled={cannotSend}>
            {busy ? 'Sending' : `Send ${selectedAsset.symbol}`}
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

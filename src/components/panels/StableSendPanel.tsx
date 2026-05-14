import { useQueryClient } from '@tanstack/react-query'
import { Dice5, Send } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
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
  name: 'Native Gas USDC',
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
  const gasMode = useAppStore((state) => state.gasMode)
  const deployedTokens = useAppStore((state) => state.deployedTokens)
  const {
    account,
    connect,
    isConnected,
    isConnecting,
    isSignedIn,
    prepareSponsorAccount,
    sendErc20Sponsored,
    sendErc20Wallet,
    sendNativeSponsored,
    sendNativeWallet,
    signIn,
    sponsorAccountAddress
  } = useArcAppKit()
  const validRecipient = isAddress(to)
  const sponsorMode = gasMode === 'sponsor'

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
  const senderAddress = sponsorMode
    ? sponsorAccountAddress ?? undefined
    : account ?? undefined
  const amountValue = parseAmount(amount, selectedAsset.decimals)

  const { data: nativeBalance, isLoading: nativeLoading } = useBalance({
    address: senderAddress,
    chainId: ARC_CHAIN_ID,
    query: {
      enabled: Boolean(senderAddress && selectedAsset.kind === 'native'),
      refetchInterval: senderAddress ? 4000 : false,
      refetchOnWindowFocus: true
    }
  })

  const { data: erc20Balance, isLoading: erc20Loading } = useReadContract({
    address: selectedAsset.kind === 'erc20' ? selectedAsset.address : USDC_TOKEN.address,
    abi: erc20Abi,
    functionName: 'balanceOf',
    args: senderAddress ? [senderAddress] : undefined,
    chainId: ARC_CHAIN_ID,
    query: {
      enabled: Boolean(senderAddress && selectedAsset.kind === 'erc20'),
      refetchInterval: senderAddress ? 4000 : false,
      refetchOnWindowFocus: true
    }
  })

  useEffect(() => {
    if (assets.some((asset) => asset.id === assetId)) return
    setAssetId(assets[0]?.id ?? 'native')
  }, [assetId, assets])

  useEffect(() => {
    if (!sponsorMode || !isConnected || !isSignedIn || sponsorAccountAddress) return
    void prepareSponsorAccount().catch(() => undefined)
  }, [isConnected, isSignedIn, prepareSponsorAccount, sponsorAccountAddress, sponsorMode])

  const balanceValue =
    selectedAsset.kind === 'native'
      ? nativeBalance?.value ?? null
      : typeof erc20Balance === 'bigint'
        ? erc20Balance
        : null
  const balanceLoading =
    selectedAsset.kind === 'native' ? nativeLoading : erc20Loading
  const balanceLabel = !senderAddress
    ? '-'
    : balanceLoading
      ? '...'
      : balanceValue !== null
        ? trimBalance(formatUnits(balanceValue, selectedAsset.decimals))
        : '0'
  const invalidAmount = !amountValue
  const insufficient =
    amountValue !== null && balanceValue !== null && amountValue > balanceValue
  const cannotSend =
    !validRecipient ||
    invalidAmount ||
    insufficient ||
    busy ||
    (sponsorMode && !sponsorAccountAddress)

  const run = async () => {
    if (cannotSend) return
    setBusy(true)
    setHash('')
    setError('')
    try {
      const recipient = to as Address
      if (selectedAsset.kind === 'native') {
        const result = sponsorMode
          ? await sendNativeSponsored({ amount, to: recipient })
          : await sendNativeWallet({ amount, to: recipient })
        setHash(result.txHash)
      } else {
        const request = {
          tokenAddress: selectedAsset.address,
          symbol: selectedAsset.symbol,
          decimals: selectedAsset.decimals,
          amount,
          to: recipient
        }
        const result = sponsorMode
          ? await sendErc20Sponsored(request)
          : await sendErc20Wallet(request)
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
    <Panel className="animate-reveal" shadow="cyan">
      <div className="mb-5 flex items-center gap-2 border-b-2 border-white pb-3 font-display text-4xl">
        <Send className="h-7 w-7 text-quantum-cyan" />
        DIRECT SEND
      </div>

      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
          {assets.map((asset) => (
            <Button
              key={asset.id}
              variant={assetId === asset.id ? 'cyan' : 'ghost'}
              className="min-h-14 flex-col gap-1 px-2 py-2 text-lg"
              onClick={() => setAssetId(asset.id)}
            >
              <span>{asset.kind === 'native' ? 'Native' : asset.symbol}</span>
              <span className="font-mono text-[10px] leading-none opacity-70">
                {asset.kind === 'native' ? 'Gas Token' : shortAddress(asset.address)}
              </span>
            </Button>
          ))}
        </div>

        <div className="border-2 border-white bg-black p-3 font-mono text-xs uppercase">
          <div className="flex items-center justify-between gap-3">
            <span className="text-white/55">
              {sponsorMode ? 'Smart Account Balance' : 'Wallet Balance'}
            </span>
            <span className="text-quantum-cyan">
              {balanceLabel} {selectedAsset.symbol}
            </span>
          </div>
          <div className="mt-2 break-all text-white/45">
            {senderAddress ? senderAddress : 'Connect + sign in first'}
          </div>
        </div>

        <Input
          label="Amount"
          inputMode="decimal"
          value={amount}
          onChange={(event) => setAmount(event.target.value)}
        />
        <Input
          label="Recipient"
          value={to}
          onChange={(event) => setTo(event.target.value)}
          placeholder="0x..."
        />

        <Button variant="ghost" className="w-full" onClick={() => setTo(randomAddress())}>
          <Dice5 className="h-5 w-5" />
          Random Address
        </Button>

        {sponsorMode ? (
          <div className="border-2 border-quantum-orange bg-black p-3 font-mono text-xs uppercase leading-5">
            <div className="text-quantum-orange">Sponsor Gas Beta</div>
            <div className="text-white/60">
              Paymaster pays gas only. Sender is ZeroDev smart account, so fund
              it with the selected asset before sponsored send.
            </div>
            <div className="mt-2 break-all border-2 border-white bg-quantum-panel p-2 text-quantum-cyan">
              {sponsorAccountAddress ?? 'Preparing smart account...'}
            </div>
            <div className="mt-2 grid gap-2 sm:grid-cols-2">
              <Button
                variant="orange"
                className="min-h-8 px-2 py-1 text-base"
                onClick={() => void prepareSponsorAccount()}
                disabled={!isConnected || !isSignedIn || busy}
              >
                Prepare Smart
              </Button>
              <Button
                variant="cyan"
                className="min-h-8 px-2 py-1 text-base"
                onClick={() =>
                  sponsorAccountAddress && navigator.clipboard.writeText(sponsorAccountAddress)
                }
                disabled={!sponsorAccountAddress}
              >
                Copy Smart
              </Button>
            </div>
          </div>
        ) : null}

        {invalidAmount && amount ? (
          <div className="border-2 border-quantum-red bg-black p-3 font-mono text-xs uppercase text-quantum-red">
            Amount invalid or zero.
          </div>
        ) : null}
        {insufficient ? (
          <div className="border-2 border-quantum-red bg-black p-3 font-mono text-xs uppercase text-quantum-red">
            {sponsorMode
              ? 'Smart account balance insufficient. Paymaster only pays gas.'
              : 'Wallet balance insufficient.'}
          </div>
        ) : null}

        {!isConnected ? (
          <Button className="w-full" onClick={connect} disabled={isConnecting}>
            Connect Arc Wallet
          </Button>
        ) : !isSignedIn ? (
          <Button className="w-full" variant="cyan" onClick={signIn} disabled={isConnecting}>
            Sign In To Unlock
          </Button>
        ) : (
          <Button className="w-full" onClick={run} disabled={cannotSend}>
            {busy
              ? 'Sending'
              : sponsorMode
                ? `Sponsored Send ${selectedAsset.symbol}`
                : `Send ${selectedAsset.symbol}`}
          </Button>
        )}

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

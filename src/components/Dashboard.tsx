import { useQueryClient } from '@tanstack/react-query'
import { ArrowLeftRight, Copy, RefreshCw, ShieldCheck, WalletCards } from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { formatUnits, type Address } from 'viem'
import { useBalance, useReadContract } from 'wagmi'

import { ARC_CHAIN_ID, SEPOLIA_CHAIN_ID, txUrl } from '../lib/arc'
import { erc20Abi } from '../lib/contracts'
import { EURC_TOKEN, SEPOLIA_USDC_TOKEN, USDC_TOKEN } from '../lib/tokens'
import { useAppStore, type Token } from '../store/useAppStore'
import { useArcAppKit } from '../hooks/useArcAppKit'
import { Button } from './ui/Button'
import { Panel } from './ui/Panel'

function trimBalance(value: string) {
  const [whole, fraction = ''] = value.split('.')
  const shortFraction = fraction.slice(0, 6).replace(/0+$/, '')
  return shortFraction ? `${whole}.${shortFraction}` : whole
}

function BalanceRow({
  chain,
  label,
  symbol,
  address,
  value
}: {
  chain: string
  label: string
  symbol: string
  address?: string
  value: string
}) {
  return (
    <div className="border-4 border-quantum-black bg-white p-2 font-mono text-[11px] uppercase shadow-[4px_4px_0_#111]">
      <div className="mb-1 flex items-center justify-between gap-3">
        <span className="text-quantum-black/55">{chain}</span>
        <span className="text-quantum-yellow">{symbol}</span>
      </div>
      <div className="grid grid-cols-[1fr_auto] gap-3">
        <div className="min-w-0">
          <div className="truncate text-quantum-black">{label}</div>
          {address ? (
            <div className="truncate text-quantum-black/40">{address}</div>
          ) : (
            <div className="text-quantum-black/40">native gas balance</div>
          )}
        </div>
        <div className="text-right text-quantum-cyan">{value}</div>
      </div>
    </div>
  )
}

function NativeBalance({
  chainId,
  chain,
  label,
  symbol,
  owner
}: {
  chainId: number
  chain: string
  label: string
  symbol: string
  owner?: Address
}) {
  const { data, isLoading, error } = useBalance({
    address: owner,
    chainId,
    query: {
      enabled: Boolean(owner),
      refetchInterval: owner ? 4000 : false,
      refetchOnWindowFocus: true
    }
  })

  const value = !owner
    ? '-'
    : error
      ? 'ERR'
      : isLoading
        ? '...'
        : data
          ? trimBalance(data.formatted)
          : '0'

  return (
    <BalanceRow chain={chain} label={label} symbol={symbol} value={value} />
  )
}

function TokenBalance({
  chainId,
  chain,
  token,
  owner
}: {
  chainId: number
  chain: string
  token: Token
  owner?: Address
}) {
  const { data, isLoading, error } = useReadContract({
    address: token.address,
    abi: erc20Abi,
    functionName: 'balanceOf',
    args: owner ? [owner] : undefined,
    chainId,
    query: {
      enabled: Boolean(owner),
      refetchInterval: owner ? 4000 : false,
      refetchOnWindowFocus: true
    }
  })

  const value = !owner
    ? '-'
    : error
      ? 'ERR'
      : isLoading
        ? '...'
        : typeof data === 'bigint'
          ? trimBalance(formatUnits(data, token.decimals))
          : '0'

  return (
    <BalanceRow
      address={token.address}
      chain={chain}
      label={token.name}
      symbol={token.symbol}
      value={value}
    />
  )
}

export function Dashboard() {
  const queryClient = useQueryClient()
  const [refreshing, setRefreshing] = useState(false)
  const {
    authToken,
    privyAuthenticated,
    privyEnabled,
    privyServerAuthError,
    privyServerVerified,
    privyUserId,
    walletLabel
  } = useArcAppKit()
  const txHistory = useAppStore((state) => state.txHistory)
  const removeTx = useAppStore((state) => state.removeTx)
  const clearTxHistory = useAppStore((state) => state.clearTxHistory)
  const ownerAddress = useAppStore((state) => state.userAddress)
  const deployedTokens = useAppStore((state) => state.deployedTokens)
  const pendingCount = txHistory.filter((tx) => tx.status === 'pending').length
  const txSignal = useMemo(
    () => txHistory.map((tx) => `${tx.id}:${tx.status}`).join('|'),
    [txHistory]
  )

  const refreshBalances = useCallback(async () => {
    setRefreshing(true)
    try {
      await queryClient.invalidateQueries()
    } finally {
      window.setTimeout(() => setRefreshing(false), 350)
    }
  }, [queryClient])

  useEffect(() => {
    if (!txHistory.some((tx) => tx.status === 'success')) return
    void refreshBalances()
  }, [refreshBalances, txHistory, txSignal])

  const copyBearer = useCallback(async () => {
    if (!authToken) return
    await navigator.clipboard.writeText(`Bearer ${authToken}`)
  }, [authToken])

  const maskedToken = authToken
    ? `${authToken.slice(0, 10)}...${authToken.slice(-8)}`
    : 'not issued'

  return (
    <Panel className="dashboard-panel animate-reveal p-3 md:p-4">
      <div className="flex items-center gap-2 border-b-4 border-quantum-black pb-2 font-display text-2xl">
        <WalletCards className="h-6 w-6 text-quantum-yellow" />
        ARC WALLET
      </div>

      <div className="mt-3 space-y-2">
        <div className="border-4 border-quantum-black bg-quantum-yellow p-2 font-mono text-[11px] uppercase shadow-[4px_4px_0_#111]">
          <div className="mb-1 flex items-center gap-2 text-quantum-cyan">
            <ArrowLeftRight className="h-4 w-4" />
            Sepolia to Arc balance view
          </div>
          <div className="truncate text-quantum-black/55">
            {ownerAddress ?? 'connect wallet to read balances'}
          </div>
          <div className="mt-3 grid gap-2 sm:grid-cols-[1fr_auto]">
            <div className="border-4 border-quantum-black bg-white px-3 py-2 text-quantum-black/65">
              REFRESH QUEUE{' '}
              <b className={pendingCount ? 'text-quantum-yellow' : 'text-quantum-green'}>
                {pendingCount ? `${pendingCount} PENDING` : 'READY'}
              </b>
            </div>
            <Button
              variant="cyan"
              className="min-h-8 px-2 py-1 text-base"
              onClick={() => void refreshBalances()}
              disabled={refreshing}
            >
              <RefreshCw className={refreshing ? 'h-4 w-4 animate-spin' : 'h-4 w-4'} />
              {refreshing ? 'Sync' : 'Refresh'}
            </Button>
          </div>
        </div>

        <div className="border-4 border-quantum-black bg-white p-2 font-mono text-[11px] uppercase shadow-[4px_4px_0_#111]">
          <div className="mb-2 flex items-center gap-2 text-quantum-purple">
            <ShieldCheck className="h-4 w-4" />
            Privy Session
          </div>
          <div className="grid gap-2">
            <div className="flex justify-between gap-3">
              <span className="text-quantum-black/55">Mode</span>
              <b className={privyEnabled ? 'text-quantum-green' : 'text-quantum-red'}>
                {privyEnabled ? 'enabled' : 'fallback'}
              </b>
            </div>
            <div className="flex justify-between gap-3">
              <span className="text-quantum-black/55">Login</span>
              <b className={privyAuthenticated ? 'text-quantum-green' : 'text-quantum-red'}>
                {privyAuthenticated ? walletLabel || 'active' : 'off'}
              </b>
            </div>
            <div className="flex justify-between gap-3">
              <span className="text-quantum-black/55">Server Verify</span>
              <b
                className={
                  privyServerVerified
                    ? 'text-quantum-green'
                    : privyServerVerified === false
                      ? 'text-quantum-red'
                      : 'text-quantum-black/55'
                }
              >
                {privyServerVerified === null ? 'standby' : privyServerVerified ? 'valid' : 'miss'}
              </b>
            </div>
            <div className="truncate text-quantum-black/55">
              USER {privyUserId ?? 'none'}
            </div>
            <div className="grid grid-cols-[1fr_auto] gap-2">
              <div className="truncate border-4 border-quantum-black bg-quantum-paper px-2 py-1">
                {maskedToken}
              </div>
              <Button
                variant="cyan"
                className="min-h-8 px-2 py-1 text-base"
                onClick={() => void copyBearer()}
                disabled={!authToken}
              >
                <Copy className="h-4 w-4" />
                Copy
              </Button>
            </div>
            {privyServerAuthError ? (
              <div className="text-quantum-red">{privyServerAuthError}</div>
            ) : null}
          </div>
        </div>

        <div className="space-y-2">
          <div className="font-display text-xl">SEPOLIA</div>
          <NativeBalance
            chain="Sepolia"
            chainId={SEPOLIA_CHAIN_ID}
            label="Sepolia ETH gas"
            owner={ownerAddress ?? undefined}
            symbol="ETH"
          />
          <TokenBalance
            chain="Sepolia"
            chainId={SEPOLIA_CHAIN_ID}
            owner={ownerAddress ?? undefined}
            token={SEPOLIA_USDC_TOKEN}
          />
        </div>

        <div className="space-y-2">
          <div className="font-display text-xl">ARC TESTNET</div>
          <NativeBalance
            chain="Arc"
            chainId={ARC_CHAIN_ID}
            label="Arc native gas"
            owner={ownerAddress ?? undefined}
            symbol="USDC"
          />
          <TokenBalance
            chain="Arc"
            chainId={ARC_CHAIN_ID}
            owner={ownerAddress ?? undefined}
            token={USDC_TOKEN}
          />
          <TokenBalance
            chain="Arc"
            chainId={ARC_CHAIN_ID}
            owner={ownerAddress ?? undefined}
            token={EURC_TOKEN}
          />
          {deployedTokens.slice(0, 4).map((token) => (
            <TokenBalance
              key={token.address}
              chain="Arc"
              chainId={ARC_CHAIN_ID}
              owner={ownerAddress ?? undefined}
              token={token}
            />
          ))}
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between gap-3">
            <div className="font-display text-xl">RECENT TX</div>
            <Button
              variant="red"
              className="min-h-8 px-2 py-1 text-base"
              onClick={clearTxHistory}
              disabled={!txHistory.length}
            >
              Clear
            </Button>
          </div>
          {txHistory.length ? (
            txHistory.slice(0, 8).map((tx) => (
              <div
                key={tx.id}
                className="border-4 border-quantum-black bg-white p-3 font-mono text-[11px] uppercase shadow-[5px_5px_0_#111]"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-quantum-black">{tx.summary}</span>
                  <div className="flex items-center gap-2">
                    <span
                      className={
                        tx.status === 'success'
                          ? 'text-quantum-green'
                          : tx.status === 'error'
                            ? 'text-quantum-red'
                            : 'text-quantum-yellow'
                      }
                    >
                      {tx.status}
                    </span>
                    <button
                      aria-label={`Delete ${tx.summary}`}
                      className="border-4 border-quantum-black bg-quantum-red px-2 py-1 text-quantum-black"
                      onClick={() => removeTx(tx.id)}
                    >
                      DEL
                    </button>
                  </div>
                </div>
                {tx.hash ? (
                  <a
                    className="mt-1 block truncate text-quantum-cyan hover:text-quantum-yellow"
                    href={txUrl(tx.hash)}
                    target="_blank"
                    rel="noreferrer"
                  >
                    {tx.hash}
                  </a>
                ) : null}
                {tx.error ? (
                  <div className="mt-1 text-quantum-red">{tx.error}</div>
                ) : null}
              </div>
            ))
          ) : (
            <div className="border-4 border-quantum-black bg-white p-3 font-mono text-xs uppercase text-quantum-black/50 shadow-[5px_5px_0_#111]">
              No transaction yet.
            </div>
          )}
        </div>
      </div>
    </Panel>
  )
}

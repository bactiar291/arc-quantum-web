import { ArrowLeftRight, WalletCards } from 'lucide-react'
import { formatUnits, type Address } from 'viem'
import { useBalance, useReadContract } from 'wagmi'

import { ARC_CHAIN_ID, SEPOLIA_CHAIN_ID, txUrl } from '../lib/arc'
import { erc20Abi } from '../lib/contracts'
import { EURC_TOKEN, SEPOLIA_USDC_TOKEN, USDC_TOKEN } from '../lib/tokens'
import { useAppStore, type Token } from '../store/useAppStore'
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
    <div className="border-2 border-white bg-black p-3 font-mono text-xs uppercase">
      <div className="mb-2 flex items-center justify-between gap-3">
        <span className="text-white/55">{chain}</span>
        <span className="text-quantum-yellow">{symbol}</span>
      </div>
      <div className="grid grid-cols-[1fr_auto] gap-3">
        <div className="min-w-0">
          <div className="truncate text-white">{label}</div>
          {address ? (
            <div className="truncate text-white/40">{address}</div>
          ) : (
            <div className="text-white/40">native gas balance</div>
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
    query: { enabled: Boolean(owner) }
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
    query: { enabled: Boolean(owner) }
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
  const txHistory = useAppStore((state) => state.txHistory)
  const removeTx = useAppStore((state) => state.removeTx)
  const clearTxHistory = useAppStore((state) => state.clearTxHistory)
  const ownerAddress = useAppStore((state) => state.userAddress)

  return (
    <Panel className="animate-reveal">
      <div className="flex items-center gap-2 border-b-2 border-white pb-3 font-display text-3xl">
        <WalletCards className="h-6 w-6 text-quantum-yellow" />
        ARC WALLET
      </div>

      <div className="mt-4 space-y-3">
        <div className="border-2 border-white bg-black p-3 font-mono text-[11px] uppercase">
          <div className="mb-1 flex items-center gap-2 text-quantum-cyan">
            <ArrowLeftRight className="h-4 w-4" />
            Sepolia to Arc balance view
          </div>
          <div className="truncate text-white/55">
            {ownerAddress ?? 'connect wallet to read balances'}
          </div>
        </div>

        <div className="space-y-2">
          <div className="font-display text-2xl">SEPOLIA</div>
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
          <div className="font-display text-2xl">ARC TESTNET</div>
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
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between gap-3">
            <div className="font-display text-2xl">RECENT TX</div>
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
                className="border-2 border-white bg-black p-3 font-mono text-[11px] uppercase"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-white">{tx.summary}</span>
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
                      className="border-2 border-white bg-quantum-red px-2 py-1 text-white"
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
            <div className="border-2 border-white bg-black p-3 font-mono text-xs uppercase text-white/50">
              No transaction yet.
            </div>
          )}
        </div>
      </div>
    </Panel>
  )
}

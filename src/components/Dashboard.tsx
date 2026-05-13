import { Plus, Trash2, WalletCards } from 'lucide-react'
import { useState } from 'react'
import { formatUnits, isAddress, type Address } from 'viem'
import { useReadContract } from 'wagmi'

import { ARC_CHAIN_ID, txUrl } from '../lib/arc'
import { erc20Abi } from '../lib/contracts'
import { useSession } from '../hooks/useSession'
import { useAppStore, type Token } from '../store/useAppStore'
import { Button } from './ui/Button'
import { Input } from './ui/Input'
import { Panel } from './ui/Panel'

function TokenBalance({ token, owner }: { token: Token; owner?: Address }) {
  const { data } = useReadContract({
    address: token.address,
    abi: erc20Abi,
    functionName: 'balanceOf',
    args: owner ? [owner] : undefined,
    chainId: ARC_CHAIN_ID,
    query: { enabled: Boolean(owner) }
  })

  return (
    <div className="grid grid-cols-[1fr_auto] gap-2 border-2 border-white bg-black p-3 font-mono text-xs uppercase">
      <div className="min-w-0">
        <div className="truncate text-quantum-yellow">{token.symbol}</div>
        <div className="truncate text-white/45">{token.address}</div>
      </div>
      <div className="text-right text-quantum-cyan">
        {typeof data === 'bigint' ? formatUnits(data, token.decimals) : '0'}
      </div>
    </div>
  )
}

export function Dashboard() {
  const [address, setAddress] = useState('')
  const [symbol, setSymbol] = useState('')
  const [decimals, setDecimals] = useState(18)
  const tokens = useAppStore((state) => state.deployedTokens)
  const txHistory = useAppStore((state) => state.txHistory)
  const addToken = useAppStore((state) => state.addToken)
  const removeToken = useAppStore((state) => state.removeToken)
  const { smartAccountAddress } = useSession()

  const importToken = () => {
    if (!isAddress(address)) return
    addToken({
      address,
      name: symbol || 'Imported Token',
      symbol: (symbol || 'TOKEN').toUpperCase(),
      decimals,
      createdAt: Date.now()
    })
    setAddress('')
    setSymbol('')
    setDecimals(18)
  }

  return (
    <Panel className="animate-reveal">
      <div className="flex items-center gap-2 border-b-2 border-white pb-3 font-display text-3xl">
        <WalletCards className="h-6 w-6 text-quantum-yellow" />
        WALLET DASHBOARD
      </div>

      <div className="mt-4 space-y-3">
        <div className="grid grid-cols-1 gap-3">
          <Input
            label="Import Token"
            value={address}
            onChange={(event) => setAddress(event.target.value)}
            placeholder="0x..."
          />
          <div className="grid grid-cols-[1fr_96px] gap-3">
            <Input
              label="Symbol"
              value={symbol}
              onChange={(event) => setSymbol(event.target.value)}
              placeholder="ARC"
            />
            <Input
              label="Dec"
              type="number"
              min={0}
              max={18}
              value={decimals}
              onChange={(event) => setDecimals(Number(event.target.value))}
            />
          </div>
          <Button variant="cyan" onClick={importToken} disabled={!isAddress(address)}>
            <Plus className="h-5 w-5" />
            Add Token
          </Button>
        </div>

        <div className="space-y-2">
          <div className="font-display text-2xl">BALANCES</div>
          {tokens.length ? (
            tokens.map((token) => (
              <div key={token.address} className="grid grid-cols-[1fr_auto] gap-2">
                <TokenBalance token={token} owner={smartAccountAddress ?? undefined} />
                <button
                  aria-label={`Remove ${token.symbol}`}
                  className="grid w-11 place-items-center border-2 border-white bg-quantum-red text-white shadow-[3px_3px_0_#FFE500]"
                  onClick={() => removeToken(token.address)}
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))
          ) : (
            <div className="border-2 border-white bg-black p-3 font-mono text-xs uppercase text-white/50">
              No tokens yet. Deploy or import token.
            </div>
          )}
        </div>

        <div className="space-y-2">
          <div className="font-display text-2xl">RECENT TX</div>
          {txHistory.length ? (
            txHistory.slice(0, 8).map((tx) => (
              <div
                key={tx.id}
                className="border-2 border-white bg-black p-3 font-mono text-[11px] uppercase"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-white">{tx.summary}</span>
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

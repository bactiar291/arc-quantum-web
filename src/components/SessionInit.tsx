import { Copy, KeyRound, RotateCcw, ShieldAlert } from 'lucide-react'
import { useBalance } from 'wagmi'

import { ARC_CHAIN_ID, addressUrl } from '../lib/arc'
import { useSession } from '../hooks/useSession'
import { Button } from './ui/Button'
import { Panel } from './ui/Panel'

const short = (value: string) => `${value.slice(0, 8)}...${value.slice(-6)}`

export function SessionInit() {
  const {
    sessionAddress,
    sessionExpiry,
    isSessionActive,
    initializeSession,
    clearSession
  } = useSession()

  const { data: balance } = useBalance({
    address: sessionAddress ?? undefined,
    chainId: ARC_CHAIN_ID,
    query: { enabled: Boolean(sessionAddress) }
  })

  const copySession = async () => {
    if (sessionAddress) await navigator.clipboard.writeText(sessionAddress)
  }

  return (
    <Panel shadow={isSessionActive ? 'cyan' : 'red'} className="animate-reveal">
      <div className="flex items-start justify-between gap-3 border-b-2 border-white pb-3">
        <div>
          <div className="flex items-center gap-2 font-display text-3xl leading-none">
            <KeyRound className="h-6 w-6 text-quantum-yellow" />
            SESSION KEY
          </div>
          <p className="mt-1 font-mono text-[11px] uppercase text-white/65">
            One typed signature creates local session EOA.
          </p>
        </div>
        <div
          className={`border-2 px-2 py-1 font-mono text-[10px] uppercase ${
            isSessionActive
              ? 'border-quantum-green text-quantum-green'
              : 'border-quantum-red text-quantum-red'
          }`}
        >
          {isSessionActive ? 'ACTIVE' : 'OFF'}
        </div>
      </div>

      <div className="mt-4 space-y-3 font-mono text-xs uppercase">
        <div className="border-2 border-quantum-cyan bg-black p-3">
          <div className="text-white/55">Session Address</div>
          {sessionAddress ? (
            <a
              href={addressUrl(sessionAddress)}
              target="_blank"
              rel="noreferrer"
              className="break-all text-quantum-cyan hover:text-quantum-yellow"
            >
              {short(sessionAddress)}
            </a>
          ) : (
            <span className="text-white/45">Not generated</span>
          )}
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="border-2 border-white bg-black p-3">
            <div className="text-white/55">Gas Balance</div>
            <div className="text-quantum-yellow">
              {balance ? `${balance.formatted} ${balance.symbol}` : '0'}
            </div>
          </div>
          <div className="border-2 border-white bg-black p-3">
            <div className="text-white/55">Expiry</div>
            <div className="text-quantum-cyan">
              {sessionExpiry
                ? new Date(sessionExpiry).toLocaleString()
                : 'None'}
            </div>
          </div>
        </div>
      </div>

      <div className="mt-4 flex flex-col gap-3 sm:flex-row">
        <Button onClick={() => void initializeSession()} className="flex-1">
          <KeyRound className="h-5 w-5" />
          Init Session
        </Button>
        <Button variant="cyan" onClick={() => void copySession()} disabled={!sessionAddress}>
          <Copy className="h-5 w-5" />
          Copy
        </Button>
        <Button variant="red" onClick={clearSession}>
          <RotateCcw className="h-5 w-5" />
          Reset
        </Button>
      </div>

      <div className="mt-4 flex gap-2 border-2 border-quantum-red bg-black p-3 font-mono text-[11px] uppercase leading-5 text-white/70">
        <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0 text-quantum-red" />
        Testnet only. EOA session must hold gas and tokens; wallet signature is
        local authorization, not universal on-chain delegation.
      </div>
    </Panel>
  )
}

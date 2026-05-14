import { LogOut, PlugZap, ShieldCheck, Terminal } from 'lucide-react'

import { useArcAppKit } from '../hooks/useArcAppKit'
import { QuantumLogo } from './QuantumLogo'
import { Button } from './ui/Button'

function shortAddress(address: string) {
  return `${address.slice(0, 6)}...${address.slice(-4)}`
}

export function Header() {
  const {
    account,
    chainId,
    connect,
    isConnecting,
    isSignedIn,
    lastError,
    privyAuthenticated,
    privyEnabled,
    signIn,
    signOut,
    walletLabel
  } = useArcAppKit()
  const action = account && !isSignedIn ? signIn : connect
  const label = account
    ? isSignedIn
      ? shortAddress(account)
      : 'Verify'
    : isConnecting
      ? 'Connecting'
      : privyEnabled
        ? 'Login'
        : 'Connect'

  return (
    <header className="sticky top-0 z-30 border-b-4 border-quantum-black bg-white/90 px-4 py-3 backdrop-blur md:px-6">
      <div className="mx-auto flex max-w-[1520px] flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3">
          <QuantumLogo size="sm" className="h-14 w-14" />
          <div>
            <h1 className="font-display text-4xl leading-none tracking-normal md:text-5xl">
              ARC QUANTUM LAB
            </h1>
            <div className="flex items-center gap-2 font-mono text-[11px] uppercase text-quantum-ink/65">
              <Terminal className="h-3.5 w-3.5" />
              Privy auth / AppKit signer / public RPC
            </div>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="border-4 border-quantum-black bg-quantum-yellow px-3 py-2 font-mono text-[11px] uppercase text-quantum-ink shadow-[5px_5px_0_#111]">
            CHAIN <b className="text-quantum-cyan">{chainId || 'OFF'}</b>
          </div>
          <div className="border-4 border-quantum-black bg-white px-3 py-2 font-mono text-[11px] uppercase text-quantum-ink shadow-[5px_5px_0_#111]">
            AUTH{' '}
            <b className={privyAuthenticated ? 'text-quantum-green' : 'text-quantum-red'}>
              {privyAuthenticated ? walletLabel || 'PRIVY' : 'OFF'}
            </b>
          </div>
          {lastError ? (
            <div className="max-w-[260px] truncate border-4 border-quantum-black bg-quantum-red px-3 py-2 font-mono text-[11px] uppercase text-quantum-ink shadow-[5px_5px_0_#111]">
              {lastError}
            </div>
          ) : null}
          {account && isSignedIn ? (
            <div className="inline-flex min-h-11 min-w-36 items-center justify-center gap-2 border-4 border-quantum-black bg-quantum-green px-4 py-2 font-display text-xl uppercase leading-none text-quantum-ink shadow-[5px_5px_0_#111]">
              <ShieldCheck className="h-5 w-5" />
              {label}
            </div>
          ) : (
            <Button onClick={action} disabled={isConnecting} className="min-w-36">
              <PlugZap className="h-5 w-5" />
              {label}
            </Button>
          )}
          {account || privyAuthenticated ? (
            <Button
              variant="red"
              onClick={signOut}
              disabled={isConnecting}
              className="min-w-0 px-3"
            >
              <LogOut className="h-5 w-5" />
              Disconnect
            </Button>
          ) : null}
        </div>
      </div>
    </header>
  )
}

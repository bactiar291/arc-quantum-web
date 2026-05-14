import { LogOut, PlugZap, ShieldCheck, Terminal } from 'lucide-react'

import { useArcAppKit } from '../hooks/useArcAppKit'
import { QuantumLogo } from './QuantumLogo'
import { Button } from './ui/Button'
import { CopyAddress } from './ui/CopyAddress'

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
    <header className="sticky top-0 z-30 border-b-2 border-quantum-black bg-white/92 px-3 py-2 backdrop-blur md:px-4">
      <div className="mx-auto flex max-w-[1120px] flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3">
          <QuantumLogo size="sm" className="h-10 w-10" />
          <div>
            <h1 className="font-display text-2xl leading-none tracking-normal md:text-3xl">
              ARC QUANTUM LAB
            </h1>
            <div className="hidden items-center gap-2 font-mono text-[10px] uppercase text-quantum-ink/55 md:flex">
              <Terminal className="h-3.5 w-3.5" />
              Privy / Circle AppKit / Arc public RPC
            </div>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="border-2 border-quantum-black bg-quantum-yellow px-2 py-1.5 font-mono text-[10px] uppercase text-quantum-ink shadow-[2px_2px_0_#111]">
            CHAIN <b className="text-quantum-cyan">{chainId || 'OFF'}</b>
          </div>
          <div className="border-2 border-quantum-black bg-white px-2 py-1.5 font-mono text-[10px] uppercase text-quantum-ink shadow-[2px_2px_0_#111]">
            AUTH{' '}
            <b className={privyAuthenticated ? 'text-quantum-green' : 'text-quantum-red'}>
              {privyAuthenticated ? walletLabel || 'PRIVY' : 'OFF'}
            </b>
          </div>
          {lastError ? (
            <div className="max-w-[220px] truncate border-2 border-quantum-black bg-quantum-red px-2 py-1.5 font-mono text-[10px] uppercase text-quantum-ink shadow-[2px_2px_0_#111]">
              {lastError}
            </div>
          ) : null}
          {account && isSignedIn ? (
            <div className="inline-flex min-h-10 min-w-32 items-center justify-center gap-2 border-2 border-quantum-black bg-quantum-green px-3 py-2 font-display text-base uppercase leading-none text-quantum-ink shadow-[2px_2px_0_#111] md:text-lg">
              <ShieldCheck className="h-4 w-4" />
              <span>{label}</span>
              <CopyAddress
                address={account}
                iconOnly
                className="h-6 w-6 border-quantum-black/70 shadow-none"
              />
            </div>
          ) : (
            <Button onClick={action} disabled={isConnecting} className="min-w-32">
              <PlugZap className="h-4 w-4" />
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
              <LogOut className="h-4 w-4" />
              Disconnect
            </Button>
          ) : null}
        </div>
      </div>
    </header>
  )
}

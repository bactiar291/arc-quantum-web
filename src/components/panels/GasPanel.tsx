import { Fuel, KeyRound, ShieldCheck, TriangleAlert } from 'lucide-react'
import { useEffect, useState } from 'react'

import { useArcAppKit } from '../../hooks/useArcAppKit'
import { useAppStore } from '../../store/useAppStore'
import { Button } from '../ui/Button'
import { Panel } from '../ui/Panel'

function StatusRow({
  label,
  value,
  ok
}: {
  label: string
  value: string
  ok: boolean
}) {
  return (
    <div className="grid gap-2 border-2 border-white bg-black p-3 font-mono text-xs uppercase md:grid-cols-[150px_1fr_70px]">
      <span className="text-white/55">{label}</span>
      <span className="truncate text-quantum-cyan">{value}</span>
      <span className={ok ? 'text-quantum-green' : 'text-quantum-red'}>
        {ok ? 'READY' : 'MISS'}
      </span>
    </div>
  )
}

export function GasPanel() {
  const [showSignature, setShowSignature] = useState(false)
  const [zeroDevReady, setZeroDevReady] = useState(false)
  const gasMode = useAppStore((state) => state.gasMode)
  const setGasMode = useAppStore((state) => state.setGasMode)
  const { account, authSignature, isSignedIn, signInExpiresAt, signOut } = useArcAppKit()
  const aaPrepared = zeroDevReady

  useEffect(() => {
    let alive = true
    fetch('/api/zerodev/status', { cache: 'no-store' })
      .then((response) => response.json())
      .then((data: { ready?: boolean }) => {
        if (alive) setZeroDevReady(Boolean(data.ready))
      })
      .catch(() => {
        if (alive) setZeroDevReady(false)
      })
    return () => {
      alive = false
    }
  }, [])

  return (
    <Panel className="animate-reveal" shadow="cyan">
      <div className="mb-5 flex items-center gap-2 border-b-2 border-white pb-3 font-display text-4xl">
        <Fuel className="h-7 w-7 text-quantum-cyan" />
        GAS CONTROL
      </div>

      <div className="space-y-3">
        <div className="grid gap-3 md:grid-cols-2">
          <Button
            variant={gasMode === 'wallet' ? 'cyan' : 'ghost'}
            onClick={() => setGasMode('wallet')}
          >
            Wallet Gas
          </Button>
          <Button
            variant={gasMode === 'sponsor' ? 'orange' : 'ghost'}
            onClick={() => setGasMode('sponsor')}
          >
            Sponsor Gas
          </Button>
        </div>

        <div className="border-2 border-white bg-black p-3 font-mono text-xs uppercase leading-5">
          <div className="text-white/55">Selected Mode</div>
          <div className={gasMode === 'sponsor' ? 'text-quantum-orange' : 'text-quantum-cyan'}>
            {gasMode === 'sponsor'
              ? 'Sponsor requested. Send tab uses ZeroDev UserOperation beta.'
              : 'Wallet gas live. MetaMask popup expected.'}
          </div>
        </div>

        <StatusRow
          label="Circle Kit"
          value="SERVER PROXY"
          ok
        />
        <StatusRow
          label="ZeroDev Project"
          value="SERVER SIDE"
          ok={zeroDevReady}
        />
        <StatusRow
          label="Passkey Server"
          value="NOT REQUIRED"
          ok={zeroDevReady}
        />
        <StatusRow
          label="Sponsored RPC"
          value="SERVER SIDE"
          ok={zeroDevReady}
        />

        <div className="grid gap-3 md:grid-cols-3">
          <div className="border-2 border-white bg-black p-4">
            <ShieldCheck className="mb-3 h-7 w-7 text-quantum-green" />
            <div className="font-display text-3xl">APP KIT</div>
            <div className="font-mono text-xs uppercase text-white/55">
              Active path. Wallet confirms and pays gas.
            </div>
          </div>
          <div className="border-2 border-white bg-black p-4">
            <KeyRound className="mb-3 h-7 w-7 text-quantum-purple" />
            <div className="font-display text-3xl">ZERODEV</div>
            <div className="font-mono text-xs uppercase text-white/55">
              Sponsored send beta is wired through server RPC proxy.
            </div>
          </div>
          <div className="border-2 border-white bg-black p-4">
            <TriangleAlert className="mb-3 h-7 w-7 text-quantum-orange" />
            <div className="font-display text-3xl">SECURITY</div>
            <div className="font-mono text-xs uppercase text-white/55">
              Kit key stays server-side through fixed Circle proxy.
            </div>
          </div>
        </div>

        <div className="border-2 border-quantum-orange bg-black p-3 font-mono text-xs uppercase leading-5 text-quantum-orange">
          Sponsor gas currently applies to Send tab beta for native and ERC20 transfers.
          Swap, bridge, and deploy still use wallet signer, so popup is expected there.
        </div>

        <div className="border-2 border-quantum-purple bg-black p-3 font-mono text-xs uppercase leading-5">
          <div className="mb-2 flex items-center justify-between gap-3">
            <div>
              <div className="text-white/55">Sign-In Proof Vault</div>
              <div className={isSignedIn ? 'text-quantum-green' : 'text-quantum-orange'}>
                {isSignedIn ? 'LOCKED / persisted 7 days' : 'Not signed in'}
              </div>
            </div>
            <Button
              variant="ghost"
              className="min-h-8 px-2 py-1 text-base"
              onClick={signOut}
              disabled={!isSignedIn}
            >
              Reset Sign
            </Button>
          </div>
          <div className="truncate text-white/55">Wallet {account ?? '-'}</div>
          <div className="text-white/55">
            Expiry {signInExpiresAt ? new Date(signInExpiresAt).toLocaleString() : '-'}
          </div>
          <div className="mt-2 break-all border-2 border-white bg-quantum-panel p-2 text-quantum-cyan">
            {showSignature && authSignature ? authSignature : authSignature ? 'Signature hidden' : '-'}
          </div>
          <div className="mt-2 grid gap-2 sm:grid-cols-2">
            <Button
              variant="purple"
              className="min-h-8 px-2 py-1 text-base"
              onClick={() => setShowSignature((value) => !value)}
              disabled={!authSignature}
            >
              {showSignature ? 'Hide Signature' : 'Reveal Signature'}
            </Button>
            <Button
              variant="cyan"
              className="min-h-8 px-2 py-1 text-base"
              onClick={() => authSignature && navigator.clipboard.writeText(authSignature)}
              disabled={!authSignature || !showSignature}
            >
              Copy Signature
            </Button>
          </div>
          <div className="mt-3 border-2 border-quantum-yellow bg-black p-2 text-quantum-yellow">
            EOA private key never enters this DApp. ZeroDev smart account and paymaster do
            not have a user-revealable private key.
          </div>
        </div>

        <Button variant={aaPrepared ? 'orange' : 'red'} className="w-full" disabled>
          {aaPrepared ? 'AA Env Prepared / Send Sponsor Live' : 'AA Env Missing / Wallet Gas Live'}
        </Button>
      </div>
    </Panel>
  )
}

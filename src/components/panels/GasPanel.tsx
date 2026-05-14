import { Fuel, KeyRound, ShieldCheck, TriangleAlert } from 'lucide-react'

import {
  envStatus,
} from '../../lib/env'
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
  const aaPrepared =
    envStatus.circleKit &&
    envStatus.zeroDevProject &&
    envStatus.zeroDevPasskey &&
    envStatus.zeroDevRpc

  return (
    <Panel className="animate-reveal" shadow="cyan">
      <div className="mb-5 flex items-center gap-2 border-b-2 border-white pb-3 font-display text-4xl">
        <Fuel className="h-7 w-7 text-quantum-cyan" />
        GAS CONTROL
      </div>

      <div className="space-y-3">
        <StatusRow
          label="Circle Kit"
          value="SERVER PROXY"
          ok={envStatus.circleKit}
        />
        <StatusRow
          label="ZeroDev Project"
          value="SERVER SIDE"
          ok={envStatus.zeroDevProject}
        />
        <StatusRow
          label="Passkey Server"
          value="SERVER SIDE"
          ok={envStatus.zeroDevPasskey}
        />
        <StatusRow
          label="Sponsored RPC"
          value="SERVER SIDE"
          ok={envStatus.zeroDevRpc}
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
              Env configured. AA sponsor execution not wired yet.
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
          Sponsor gas needs ZeroDev smart-account execution. Current swap/bridge/send
          uses Circle App Kit wallet signer, so MetaMask popup is expected.
        </div>

        <Button variant={aaPrepared ? 'orange' : 'red'} className="w-full" disabled>
          {aaPrepared ? 'AA Env Prepared / Wallet Gas Live' : 'AA Env Missing / Wallet Gas Live'}
        </Button>
      </div>
    </Panel>
  )
}

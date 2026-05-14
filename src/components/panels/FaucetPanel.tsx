import { Copy, ExternalLink, Waves } from 'lucide-react'

import { useArcAppKit } from '../../hooks/useArcAppKit'
import { Button } from '../ui/Button'
import { Panel } from '../ui/Panel'

const faucetUrl = 'https://faucet.circle.com/'

export function FaucetPanel() {
  const { account, connect, isConnecting } = useArcAppKit()

  return (
    <Panel className="animate-reveal bg-quantum-cyan" shadow="red">
      <div className="mb-5 flex items-center gap-2 border-b-4 border-quantum-black pb-3 font-display text-4xl">
        <Waves className="h-7 w-7 text-quantum-red" />
        CIRCLE FAUCET
      </div>

      <div className="grid gap-4 md:grid-cols-[1fr_220px]">
        <div className="border-4 border-quantum-black bg-white p-4 font-mono text-xs uppercase leading-5 shadow-[5px_5px_0_#111]">
          Circle blocks iframe embedding, so claims must open on the official
          faucet page. This panel keeps the flow inside the app: copy wallet,
          open faucet, paste address, claim test USDC.
        </div>
        <div className="border-4 border-quantum-black bg-quantum-yellow p-4 font-mono text-xs uppercase shadow-[5px_5px_0_#111]">
          <div className="text-quantum-black/55">Connected Wallet</div>
          <div className="mt-2 break-all text-quantum-black">
            {account ?? 'Connect wallet first'}
          </div>
        </div>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        {!account ? (
          <Button onClick={connect} disabled={isConnecting} className="w-full sm:col-span-1">
            Connect Wallet
          </Button>
        ) : (
          <Button
            variant="cyan"
            className="w-full sm:col-span-1"
            onClick={() => navigator.clipboard.writeText(account)}
          >
            <Copy className="h-5 w-5" />
            Copy Address
          </Button>
        )}

        <Button
          variant="red"
          className="w-full sm:col-span-2"
          onClick={() => window.open(faucetUrl, '_blank', 'noopener,noreferrer')}
        >
          Open Official Faucet
          <ExternalLink className="h-5 w-5" />
        </Button>
      </div>

      <div className="mt-5 border-4 border-quantum-black bg-white p-3 font-mono text-xs uppercase shadow-[5px_5px_0_#111]">
        Faucet source:{' '}
        <a
          href={faucetUrl}
          target="_blank"
          rel="noreferrer"
          className="text-quantum-red underline decoration-4 underline-offset-4"
        >
          faucet.circle.com
        </a>
      </div>
    </Panel>
  )
}

import { Copy, ExternalLink, Waves } from 'lucide-react'

import { useArcAppKit } from '../../hooks/useArcAppKit'
import { Button } from '../ui/Button'
import { Panel } from '../ui/Panel'

const faucetUrl = 'https://faucet.circle.com/'

export function FaucetPanel() {
  const { account, connect, isConnecting } = useArcAppKit()

  return (
    <Panel className="compact-action-panel animate-reveal bg-quantum-cyan" shadow="red">
      <div className="mb-3 flex items-center gap-2 border-b-4 border-quantum-black pb-3 font-display text-3xl">
        <Waves className="h-7 w-7 text-quantum-red" />
        CIRCLE FAUCET
      </div>

      <div className="grid gap-3 md:grid-cols-[1fr_220px]">
        <div className="mini-swap-box bg-white font-mono text-[11px] uppercase leading-4">
          Official faucet opens outside because Circle blocks iframe embedding.
          Copy wallet, open faucet, paste address, claim test USDC.
        </div>
        <div className="mini-swap-box bg-quantum-yellow font-mono text-xs uppercase">
          <div className="text-quantum-black/55">Connected Wallet</div>
          <div className="mt-2 break-all text-quantum-black">
            {account ?? 'Connect wallet first'}
          </div>
        </div>
      </div>

      <div className="mt-3 grid gap-3 sm:grid-cols-3">
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

      <div className="mt-3 border-4 border-quantum-black bg-white p-3 font-mono text-xs uppercase shadow-[5px_5px_0_#111]">
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

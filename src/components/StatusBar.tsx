import { useBlockNumber } from 'wagmi'

import { useArcAppKit } from '../hooks/useArcAppKit'
import { ARC_CHAIN_ID } from '../lib/arc'

export function StatusBar() {
  const { data: blockNumber } = useBlockNumber({
    chainId: ARC_CHAIN_ID,
    watch: true
  })
  const { account } = useArcAppKit()

  return (
    <footer className="fixed bottom-0 left-0 right-0 z-30 border-t-4 border-quantum-black bg-white px-4 py-2 font-mono text-[11px] uppercase text-quantum-black shadow-[0_-6px_0_#00C2A8] md:px-6">
      <div className="mx-auto flex max-w-[1520px] flex-wrap items-center justify-between gap-2">
        <span>
          WALLET:{' '}
          <b className={account ? 'text-quantum-green' : 'text-quantum-red'}>
            {account ? `${account.slice(0, 6)}...${account.slice(-4)}` : 'OFF'}
          </b>
        </span>
        <span>
          EXECUTION:{' '}
          <b className="text-quantum-yellow">WALLET GAS</b>
        </span>
        <span>
          BLOCK:{' '}
          <b className="text-quantum-cyan">
            {blockNumber ? blockNumber.toString() : 'SYNCING'}
          </b>
        </span>
      </div>
    </footer>
  )
}

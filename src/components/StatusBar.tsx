import { useBlockNumber } from 'wagmi'

import { useArcAppKit } from '../hooks/useArcAppKit'
import { ARC_CHAIN_ID } from '../lib/arc'
import { envStatus } from '../lib/env'

export function StatusBar() {
  const { data: blockNumber } = useBlockNumber({
    chainId: ARC_CHAIN_ID,
    watch: true
  })
  const { account } = useArcAppKit()
  const gasReady = envStatus.zeroDevProject && envStatus.zeroDevRpc

  return (
    <footer className="fixed bottom-0 left-0 right-0 z-30 border-t-2 border-white bg-black px-4 py-2 font-mono text-[11px] uppercase text-white md:px-6">
      <div className="mx-auto flex max-w-[1520px] flex-wrap items-center justify-between gap-2">
        <span>
          WALLET:{' '}
          <b className={account ? 'text-quantum-green' : 'text-quantum-red'}>
            {account ? `${account.slice(0, 6)}...${account.slice(-4)}` : 'OFF'}
          </b>
        </span>
        <span>
          GAS ENV:{' '}
          <b className={gasReady ? 'text-quantum-green' : 'text-quantum-yellow'}>
            {gasReady ? 'READY' : 'WALLET GAS'}
          </b>
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

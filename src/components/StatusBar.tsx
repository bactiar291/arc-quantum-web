import { useBlockNumber } from 'wagmi'

import { ARC_CHAIN_ID } from '../lib/arc'
import { useSession } from '../hooks/useSession'

export function StatusBar() {
  const { data: blockNumber } = useBlockNumber({
    chainId: ARC_CHAIN_ID,
    watch: true
  })
  const { isSessionActive, sessionExpiry } = useSession()
  const expires = sessionExpiry
    ? new Date(sessionExpiry).toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit'
      })
    : 'NONE'

  return (
    <footer className="fixed bottom-0 left-0 right-0 z-30 border-t-2 border-white bg-black px-4 py-2 font-mono text-[11px] uppercase text-white md:px-6">
      <div className="mx-auto flex max-w-[1520px] flex-wrap items-center justify-between gap-2">
        <span>
          SESSION:{' '}
          <b className={isSessionActive ? 'text-quantum-green' : 'text-quantum-red'}>
            {isSessionActive ? 'ACTIVE' : 'OFF'}
          </b>
        </span>
        <span>EXPIRES: {expires}</span>
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

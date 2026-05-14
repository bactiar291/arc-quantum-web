import { Dice5, Rocket } from 'lucide-react'
import { useRef, useState } from 'react'

import { useArcAppKit } from '../../hooks/useArcAppKit'
import { addressUrl } from '../../lib/arc'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'
import { Panel } from '../ui/Panel'

const adjectives = [
  'Neon',
  'Plasma',
  'Violet',
  'Ion',
  'Nova',
  'Turbo',
  'Signal',
  'Flux'
]
const nouns = ['Pulse', 'Relay', 'Vector', 'Mint', 'Circuit', 'Orbit', 'Vault', 'Core']

function randomInt(min: number, max: number) {
  const bytes = crypto.getRandomValues(new Uint32Array(1))
  return min + (bytes[0] % (max - min + 1))
}

function pick(values: string[]) {
  return values[randomInt(0, values.length - 1)]
}

function randomSymbol(used: Set<string>) {
  for (let index = 0; index < 20; index += 1) {
    const raw = `${pick(adjectives)[0]}${pick(nouns)[0]}${randomInt(100, 999)}`
      .toUpperCase()
      .slice(0, 6)
    if (!used.has(raw)) return raw
  }
  return `Q${Date.now().toString(36).toUpperCase().slice(-5)}`
}

export function DeployPanel() {
  const usedSymbols = useRef(new Set<string>())
  const [name, setName] = useState('Neon Pulse')
  const [symbol, setSymbol] = useState('NP100')
  const [supply, setSupply] = useState('1000000')
  const [decimals, setDecimals] = useState(6)
  const [busy, setBusy] = useState(false)
  const [txHash, setTxHash] = useState('')
  const [contractAddress, setContractAddress] = useState('')
  const [error, setError] = useState('')
  const { connect, deployToken, isConnected, isConnecting } = useArcAppKit()

  const generate = () => {
    const suffix = Date.now().toString(36).toUpperCase().slice(-4)
    const nextName = `${pick(adjectives)} ${pick(nouns)} ${suffix}`
    const nextSymbol = randomSymbol(usedSymbols.current)
    usedSymbols.current.add(nextSymbol)
    setName(nextName)
    setSymbol(nextSymbol)
    setSupply(String(randomInt(100_000, 9_900_000)))
    setDecimals([6, 8, 18][randomInt(0, 2)])
    setError('')
    setTxHash('')
    setContractAddress('')
  }

  const runDeploy = async () => {
    setBusy(true)
    setError('')
    setTxHash('')
    setContractAddress('')
    try {
      const result = await deployToken({ name, symbol, supply, decimals })
      setTxHash(result.txHash)
      setContractAddress(result.contractAddress)
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : String(caught))
    } finally {
      setBusy(false)
    }
  }

  return (
    <Panel className="animate-reveal" shadow="red">
      <div className="mb-5 flex items-center gap-2 border-b-2 border-white pb-3 font-display text-4xl">
        <Rocket className="h-7 w-7 text-quantum-orange" />
        RANDOM TOKEN DEPLOY
      </div>

      <div className="mb-4 grid gap-3 md:grid-cols-[1fr_220px]">
        <div className="border-2 border-white bg-black p-4 font-mono text-xs uppercase leading-5 text-white/65">
          Generate membuat name, ticker, supply, decimals acak dan unik selama
          sesi browser. Deploy tetap wallet signer dan butuh popup gas.
        </div>
        <Button variant="purple" onClick={generate} className="w-full">
          <Dice5 className="h-5 w-5" />
          Generate
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Input
          label="Token Name"
          value={name}
          onChange={(event) => setName(event.target.value)}
        />
        <Input
          label="Symbol"
          value={symbol}
          onChange={(event) => setSymbol(event.target.value.toUpperCase())}
        />
        <Input
          label="Total Supply"
          value={supply}
          onChange={(event) => setSupply(event.target.value)}
          inputMode="decimal"
        />
        <Input
          label="Decimals"
          type="number"
          min={0}
          max={18}
          value={decimals}
          onChange={(event) => setDecimals(Number(event.target.value))}
        />
      </div>

      <div className="mt-5">
        {!isConnected ? (
          <Button className="w-full" onClick={connect} disabled={isConnecting}>
            Sign In Arc Wallet
          </Button>
        ) : (
          <Button className="w-full" onClick={() => void runDeploy()} disabled={busy}>
            <Rocket className="h-5 w-5" />
            {busy ? 'Deploying' : 'Deploy Generated Token'}
          </Button>
        )}
      </div>

      {contractAddress ? (
        <div className="mt-4 border-2 border-quantum-cyan bg-black p-3 font-mono text-xs uppercase">
          <div className="text-white/55">Contract Address</div>
          <a
            href={addressUrl(contractAddress as `0x${string}`)}
            target="_blank"
            rel="noreferrer"
            className="break-all text-quantum-cyan hover:text-quantum-yellow"
          >
            {contractAddress}
          </a>
        </div>
      ) : null}

      {txHash ? (
        <div className="mt-4 break-all border-2 border-white bg-black p-3 font-mono text-xs text-quantum-green">
          TX {txHash}
        </div>
      ) : null}
      {error ? (
        <div className="mt-4 break-words border-2 border-quantum-red bg-black p-3 font-mono text-xs text-quantum-red">
          {error}
        </div>
      ) : null}
    </Panel>
  )
}

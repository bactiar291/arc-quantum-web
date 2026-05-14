import { Dice5, Send } from 'lucide-react'
import { useState } from 'react'
import { isAddress, type Address } from 'viem'

import { useArcAppKit } from '../../hooks/useArcAppKit'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'
import { Panel } from '../ui/Panel'

function randomAddress() {
  const bytes = crypto.getRandomValues(new Uint8Array(20))
  const hex = Array.from(bytes)
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('')
  return `0x${hex}` as Address
}

export function StableSendPanel() {
  const [token, setToken] = useState<'USDC' | 'EURC'>('USDC')
  const [amount, setAmount] = useState('0.1')
  const [to, setTo] = useState('')
  const [hash, setHash] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const { connect, isConnected, isConnecting, isSignedIn, sendToken, signIn } = useArcAppKit()
  const valid = isAddress(to)

  const run = async () => {
    setBusy(true)
    setHash('')
    setError('')
    try {
      const result = await sendToken({ token, amount, to: to as Address })
      setHash(result.txHash || '')
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : String(caught))
    } finally {
      setBusy(false)
    }
  }

  return (
    <Panel className="animate-reveal" shadow="cyan">
      <div className="mb-5 flex items-center gap-2 border-b-2 border-white pb-3 font-display text-4xl">
        <Send className="h-7 w-7 text-quantum-cyan" />
        DIRECT SEND
      </div>

      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          {(['USDC', 'EURC'] as const).map((item) => (
            <Button
              key={item}
              variant={token === item ? 'cyan' : 'ghost'}
              onClick={() => setToken(item)}
            >
              {item}
            </Button>
          ))}
        </div>

        <Input
          label="Amount"
          inputMode="decimal"
          value={amount}
          onChange={(event) => setAmount(event.target.value)}
        />
        <Input
          label="Recipient"
          value={to}
          onChange={(event) => setTo(event.target.value)}
          placeholder="0x..."
        />

        <Button variant="ghost" className="w-full" onClick={() => setTo(randomAddress())}>
          <Dice5 className="h-5 w-5" />
          Random Address
        </Button>

        {!isConnected ? (
          <Button className="w-full" onClick={connect} disabled={isConnecting}>
            Connect Arc Wallet
          </Button>
        ) : !isSignedIn ? (
          <Button className="w-full" variant="cyan" onClick={signIn} disabled={isConnecting}>
            Sign In To Unlock
          </Button>
        ) : (
          <Button className="w-full" onClick={run} disabled={!valid || !amount || busy}>
            {busy ? 'Sending' : `Send ${token}`}
          </Button>
        )}

        {hash ? (
          <div className="break-all border-2 border-white bg-black p-3 font-mono text-xs text-quantum-green">
            TX {hash}
          </div>
        ) : null}
        {error ? (
          <div className="break-words border-2 border-quantum-red bg-black p-3 font-mono text-xs text-quantum-red">
            {error}
          </div>
        ) : null}
      </div>
    </Panel>
  )
}

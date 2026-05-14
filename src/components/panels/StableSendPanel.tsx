import { Dice5, Send } from 'lucide-react'
import { useEffect, useState } from 'react'
import { isAddress, type Address } from 'viem'

import { useArcAppKit } from '../../hooks/useArcAppKit'
import { useAppStore } from '../../store/useAppStore'
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
  const gasMode = useAppStore((state) => state.gasMode)
  const {
    connect,
    isConnected,
    isConnecting,
    isSignedIn,
    prepareSponsorAccount,
    sendToken,
    sendTokenSponsored,
    signIn,
    sponsorAccountAddress
  } = useArcAppKit()
  const valid = isAddress(to)
  const sponsorMode = gasMode === 'sponsor'

  useEffect(() => {
    if (!sponsorMode || !isConnected || !isSignedIn || sponsorAccountAddress) return
    void prepareSponsorAccount().catch(() => undefined)
  }, [isConnected, isSignedIn, prepareSponsorAccount, sponsorAccountAddress, sponsorMode])

  const run = async () => {
    setBusy(true)
    setHash('')
    setError('')
    try {
      if (sponsorMode) {
        const result = await sendTokenSponsored({ token, amount, to: to as Address })
        setHash(result.txHash)
      } else {
        const result = await sendToken({ token, amount, to: to as Address })
        setHash(result.txHash || '')
      }
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

        {sponsorMode ? (
          <div className="border-2 border-quantum-orange bg-black p-3 font-mono text-xs uppercase leading-5">
            <div className="text-quantum-orange">Sponsor Gas Beta</div>
            <div className="text-white/60">
              Sender is ZeroDev smart account. Fund this smart account with {token}
              before sponsored send.
            </div>
            <div className="mt-2 break-all border-2 border-white bg-quantum-panel p-2 text-quantum-cyan">
              {sponsorAccountAddress ?? 'Preparing smart account...'}
            </div>
            <div className="mt-2 grid gap-2 sm:grid-cols-2">
              <Button
                variant="orange"
                className="min-h-8 px-2 py-1 text-base"
                onClick={() => void prepareSponsorAccount()}
                disabled={!isConnected || !isSignedIn || busy}
              >
                Prepare Smart
              </Button>
              <Button
                variant="cyan"
                className="min-h-8 px-2 py-1 text-base"
                onClick={() =>
                  sponsorAccountAddress && navigator.clipboard.writeText(sponsorAccountAddress)
                }
                disabled={!sponsorAccountAddress}
              >
                Copy Smart
              </Button>
            </div>
          </div>
        ) : null}

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
            {busy ? 'Sending' : sponsorMode ? `Sponsored Send ${token}` : `Send ${token}`}
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

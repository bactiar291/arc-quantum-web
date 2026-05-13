import { Dice5, Send } from 'lucide-react'
import { useMemo, useState } from 'react'
import { isAddress, type Address, type Hex } from 'viem'

import { useSend, randomAddress } from '../../hooks/useSend'
import { useSession } from '../../hooks/useSession'
import { findToken } from '../../lib/tokens'
import { useAppStore } from '../../store/useAppStore'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'
import { Panel } from '../ui/Panel'
import { TokenSelect } from '../ui/TokenSelect'
import { TxStatus } from '../ui/TxStatus'

export function SendPanel() {
  const tokens = useAppStore((state) => state.deployedTokens)
  const [token, setToken] = useState<Address | ''>('')
  const [amount, setAmount] = useState('')
  const [recipient, setRecipient] = useState('')
  const [randomMode, setRandomMode] = useState(false)
  const [batchCount, setBatchCount] = useState(3)
  const [busy, setBusy] = useState(false)
  const [hash, setHash] = useState<Hex>()
  const [error, setError] = useState('')
  const { isSessionActive } = useSession()
  const { sendToken, batchSendRandom } = useSend()
  const selectedToken = useMemo(() => findToken(tokens, token), [tokens, token])

  const disabled =
    !isSessionActive ||
    !selectedToken ||
    busy ||
    (!randomMode && !isAddress(recipient))

  const runSend = async () => {
    setBusy(true)
    setError('')
    setHash(undefined)
    try {
      if (randomMode && batchCount > 1) {
        await batchSendRandom(
          token as Address,
          amount,
          selectedToken?.decimals ?? 18,
          batchCount
        )
        return
      }
      const to = randomMode ? randomAddress() : (recipient as Address)
      const result = await sendToken({
        token: token as Address,
        amount,
        decimals: selectedToken?.decimals ?? 18,
        to
      })
      setHash(result.hash)
      if (randomMode) setRecipient(to)
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : String(caught))
    } finally {
      setBusy(false)
    }
  }

  return (
    <Panel className="animate-reveal" shadow="red">
      <div className="mb-5 flex items-center gap-2 border-b-2 border-white pb-3 font-display text-4xl">
        <Send className="h-7 w-7 text-quantum-red" />
        SEND TOKEN
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <TokenSelect label="Token" value={token} onChange={setToken} />
        <Input
          label="Amount"
          value={amount}
          onChange={(event) => setAmount(event.target.value)}
          inputMode="decimal"
          placeholder="0.0"
        />
        <Input
          label="Recipient"
          value={recipient}
          onChange={(event) => setRecipient(event.target.value)}
          placeholder="0x..."
          disabled={randomMode}
          hint={randomMode ? 'Generated at execution time' : 'Manual EVM address'}
        />
        <Input
          label="Batch Count"
          type="number"
          min={1}
          max={20}
          value={batchCount}
          onChange={(event) => setBatchCount(Number(event.target.value))}
          hint="Used only in random mode"
        />
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-[1fr_1fr]">
        <Button
          variant={randomMode ? 'cyan' : 'ghost'}
          onClick={() => setRandomMode((value) => !value)}
        >
          <Dice5 className="h-5 w-5" />
          {randomMode ? 'Random On' : 'Manual Mode'}
        </Button>
        <Button disabled={disabled} onClick={() => void runSend()}>
          <Send className="h-5 w-5" />
          Send
        </Button>
      </div>

      <TxStatus hash={hash} error={error} busy={busy} />
    </Panel>
  )
}

import { encodeFunctionData, isAddress, parseUnits, type Address } from 'viem'

import { erc20Abi } from '../lib/contracts'
import { useSession } from './useSession'
import { useTrackedTx } from './useTrackedTx'

interface SendParams {
  token: Address
  amount: string
  decimals: number
  to: Address
}

export function randomAddress() {
  const bytes = crypto.getRandomValues(new Uint8Array(20))
  const hex = Array.from(bytes)
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('')
  return `0x${hex}` as Address
}

export function useSend() {
  const { sendSessionTransaction } = useSession()
  const track = useTrackedTx()

  const sendToken = async (params: SendParams) => {
    if (!isAddress(params.to)) throw new Error('Recipient address invalid.')
    const amount = parseUnits(params.amount || '0', params.decimals)
    if (amount <= 0n) throw new Error('Amount must be greater than zero.')

    const data = encodeFunctionData({
      abi: erc20Abi,
      functionName: 'transfer',
      args: [params.to, amount]
    })

    return track('send', `Send token to ${params.to.slice(0, 10)}...`, async () => {
      const { hash } = await sendSessionTransaction({ to: params.token, data })
      return { hash }
    })
  }

  const batchSendRandom = async (
    token: Address,
    amount: string,
    decimals: number,
    count: number
  ) => {
    if (count < 1 || count > 20) throw new Error('Batch count must be 1-20.')
    const recipients = Array.from({ length: count }, () => randomAddress())
    for (const to of recipients) {
      await sendToken({ token, amount, decimals, to })
      await new Promise((resolve) =>
        window.setTimeout(resolve, 500 + Math.random() * 1200)
      )
    }
    return recipients
  }

  return { sendToken, batchSendRandom }
}

import { encodeFunctionData, parseUnits, type Address } from 'viem'

import { arcPublicClient } from '../lib/arc'
import {
  erc20Abi,
  maxUint256,
  quantumRouterAbi,
  quantumRouterAddress
} from '../lib/contracts'
import { useSession } from './useSession'
import { useTrackedTx } from './useTrackedTx'

interface SwapParams {
  tokenIn: Address
  tokenOut: Address
  amount: string
  decimals: number
  slippageBps: number
  recipient?: Address
}

export function useSwap() {
  const { sessionAddress, sendSessionTransaction } = useSession()
  const track = useTrackedTx()

  const approveRouter = async (token: Address) => {
    if (!quantumRouterAddress) throw new Error('Router address missing.')
    const data = encodeFunctionData({
      abi: erc20Abi,
      functionName: 'approve',
      args: [quantumRouterAddress, maxUint256]
    })
    return track('approve', 'Approve router for token spend', async () => {
      const { hash } = await sendSessionTransaction({ to: token, data })
      return { hash }
    })
  }

  const executeSwap = async (params: SwapParams) => {
    if (!quantumRouterAddress) throw new Error('Router address missing.')
    if (!sessionAddress) throw new Error('Session address missing.')

    const amountIn = parseUnits(params.amount || '0', params.decimals)
    if (amountIn <= 0n) throw new Error('Amount must be greater than zero.')

    const path = [params.tokenIn, params.tokenOut] as Address[]
    const amounts = await arcPublicClient.readContract({
      address: quantumRouterAddress,
      abi: quantumRouterAbi,
      functionName: 'getAmountsOut',
      args: [amountIn, path]
    })
    const quotedOut = amounts[amounts.length - 1] ?? 0n
    const amountOutMin =
      (quotedOut * BigInt(10_000 - params.slippageBps)) / 10_000n
    const deadline = BigInt(Math.floor(Date.now() / 1000) + 60 * 20)

    const data = encodeFunctionData({
      abi: quantumRouterAbi,
      functionName: 'swapExactTokensForTokens',
      args: [
        amountIn,
        amountOutMin,
        path,
        params.recipient ?? sessionAddress,
        deadline
      ]
    })

    return track('swap', 'Quantum swap', async () => {
      const { hash } = await sendSessionTransaction({
        to: quantumRouterAddress,
        data
      })
      return { hash }
    })
  }

  return { approveRouter, executeSwap }
}

import { encodeFunctionData, parseUnits, type Address } from 'viem'

import { arcPublicClient } from '../lib/arc'
import {
  erc20Abi,
  maxUint256,
  quantumRouterAbi
} from '../lib/contracts'
import { useAmmConfig } from './useAmm'
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
  const { smartAccountAddress, sendSessionTransaction } = useSession()
  const { routerAddress } = useAmmConfig()
  const track = useTrackedTx()

  const approveRouter = async (token: Address) => {
    if (!routerAddress) throw new Error('Router address missing. Run Setup AMM first.')
    const data = encodeFunctionData({
      abi: erc20Abi,
      functionName: 'approve',
      args: [routerAddress, maxUint256]
    })
    return track('approve', 'Approve router for token spend', async () => {
      const { hash } = await sendSessionTransaction({ to: token, data })
      return { hash }
    })
  }

  const executeSwap = async (params: SwapParams) => {
    if (!routerAddress) throw new Error('Router address missing. Run Setup AMM first.')
    if (!smartAccountAddress) throw new Error('Smart account missing.')
    const router = routerAddress
    const recipient = params.recipient ?? smartAccountAddress

    const amountIn = parseUnits(params.amount || '0', params.decimals)
    if (amountIn <= 0n) throw new Error('Amount must be greater than zero.')

    const path = [params.tokenIn, params.tokenOut] as Address[]
    const amounts = await arcPublicClient.readContract({
      address: routerAddress,
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
        recipient,
        deadline
      ]
    })

    return track('swap', 'Quantum swap', async () => {
      const { hash } = await sendSessionTransaction({
        to: router,
        data
      })
      return { hash }
    })
  }

  return { approveRouter, executeSwap }
}

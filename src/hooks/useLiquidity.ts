import { encodeFunctionData, parseUnits, type Address } from 'viem'

import {
  erc20Abi,
  maxUint256,
  quantumRouterAbi,
  quantumRouterAddress
} from '../lib/contracts'
import { useSession } from './useSession'
import { useTrackedTx } from './useTrackedTx'

interface LiquidityParams {
  tokenA: Address
  tokenB: Address
  amountA: string
  amountB: string
  decimalsA: number
  decimalsB: number
  recipient?: Address
}

export function useLiquidity() {
  const { sessionAddress, sendSessionTransaction } = useSession()
  const track = useTrackedTx()

  const approveRouter = async (token: Address) => {
    if (!quantumRouterAddress) throw new Error('Router address missing.')
    const data = encodeFunctionData({
      abi: erc20Abi,
      functionName: 'approve',
      args: [quantumRouterAddress, maxUint256]
    })
    return track('approve', 'Approve router for liquidity', async () => {
      const { hash } = await sendSessionTransaction({ to: token, data })
      return { hash }
    })
  }

  const addLiquidity = async (params: LiquidityParams) => {
    if (!quantumRouterAddress) throw new Error('Router address missing.')
    if (!sessionAddress) throw new Error('Session address missing.')

    const amountA = parseUnits(params.amountA || '0', params.decimalsA)
    const amountB = parseUnits(params.amountB || '0', params.decimalsB)
    if (amountA <= 0n || amountB <= 0n) {
      throw new Error('Both amounts must be greater than zero.')
    }

    const data = encodeFunctionData({
      abi: quantumRouterAbi,
      functionName: 'addLiquidity',
      args: [
        params.tokenA,
        params.tokenB,
        amountA,
        amountB,
        params.recipient ?? sessionAddress,
        BigInt(Math.floor(Date.now() / 1000) + 60 * 20)
      ]
    })

    return track('liquidity', 'Add quantum liquidity', async () => {
      const { hash } = await sendSessionTransaction({
        to: quantumRouterAddress,
        data
      })
      return { hash }
    })
  }

  return { approveRouter, addLiquidity }
}

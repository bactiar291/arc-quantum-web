import { encodeFunctionData, parseUnits, type Address } from 'viem'

import {
  erc20Abi,
  maxUint256,
  quantumRouterAbi
} from '../lib/contracts'
import { useAmmConfig } from './useAmm'
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
    return track('approve', 'Approve router for liquidity', async () => {
      const { hash } = await sendSessionTransaction({ to: token, data })
      return { hash }
    })
  }

  const addLiquidity = async (params: LiquidityParams) => {
    if (!routerAddress) throw new Error('Router address missing. Run Setup AMM first.')
    if (!smartAccountAddress) throw new Error('Smart account missing.')
    const router = routerAddress
    const recipient = params.recipient ?? smartAccountAddress

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
        recipient,
        BigInt(Math.floor(Date.now() / 1000) + 60 * 20)
      ]
    })

    return track('liquidity', 'Add quantum liquidity', async () => {
      const { hash } = await sendSessionTransaction({
        to: router,
        data
      })
      return { hash }
    })
  }

  return { approveRouter, addLiquidity }
}

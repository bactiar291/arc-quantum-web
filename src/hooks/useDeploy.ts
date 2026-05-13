import { encodeDeployData, parseUnits } from 'viem'

import { quantumTokenBytecode } from '../lib/bytecode'
import { quantumTokenAbi } from '../lib/contracts'
import { useAppStore } from '../store/useAppStore'
import { useSession } from './useSession'
import { useTrackedTx } from './useTrackedTx'

interface DeployParams {
  name: string
  symbol: string
  supply: string
  decimals: number
}

export function useDeploy() {
  const { sessionAccount, deployFromSmartAccount } = useSession()
  const addToken = useAppStore((state) => state.addToken)
  const track = useTrackedTx()

  const deployToken = async (params: DeployParams) => {
    if (!sessionAccount) throw new Error('Session inactive.')
    if (!params.name.trim()) throw new Error('Token name required.')
    if (!params.symbol.trim()) throw new Error('Token symbol required.')
    if (params.decimals < 0 || params.decimals > 18) {
      throw new Error('Decimals must be 0-18.')
    }

    const supply = parseUnits(params.supply || '0', params.decimals)
    if (supply <= 0n) throw new Error('Supply must be greater than zero.')
    if (quantumTokenBytecode === '0x') {
      throw new Error('QuantumToken bytecode missing.')
    }

    const initCode = encodeDeployData({
      abi: quantumTokenAbi,
      bytecode: quantumTokenBytecode,
      args: [params.name.trim(), params.symbol.trim().toUpperCase(), supply, params.decimals]
    })

    return track('deploy', `Deploy ${params.symbol.toUpperCase()}`, async () => {
      const result = await deployFromSmartAccount(initCode)
      addToken({
        address: result.address,
        name: params.name.trim(),
        symbol: params.symbol.trim().toUpperCase(),
        decimals: params.decimals,
        createdAt: Date.now(),
        txHash: result.hash
      })
      return { hash: result.hash, value: result.address }
    })
  }

  return { deployToken }
}

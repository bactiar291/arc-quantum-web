import { createWalletClient, http, parseUnits, type Address } from 'viem'

import { ARC_RPC_URL, arcPublicClient, arcTestnet } from '../lib/arc'
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
  const { sessionAccount } = useSession()
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

    const wallet = createWalletClient({
      account: sessionAccount,
      chain: arcTestnet,
      transport: http(ARC_RPC_URL)
    })

    return track('deploy', `Deploy ${params.symbol.toUpperCase()}`, async () => {
      const hash = await wallet.deployContract({
        abi: quantumTokenAbi,
        bytecode: quantumTokenBytecode,
        args: [params.name.trim(), params.symbol.trim().toUpperCase(), supply, params.decimals]
      })
      const receipt = await arcPublicClient.waitForTransactionReceipt({ hash })
      if (!receipt.contractAddress) {
        throw new Error('Deploy receipt has no contract address.')
      }
      addToken({
        address: receipt.contractAddress as Address,
        name: params.name.trim(),
        symbol: params.symbol.trim().toUpperCase(),
        decimals: params.decimals,
        createdAt: Date.now(),
        txHash: hash
      })
      return { hash, value: receipt.contractAddress as Address }
    })
  }

  return { deployToken }
}

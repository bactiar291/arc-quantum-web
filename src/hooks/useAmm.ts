import { useCallback } from 'react'
import type { Address } from 'viem'
import { useAccount, useWalletClient } from 'wagmi'

import { ARC_CHAIN_ID, arcPublicClient } from '../lib/arc'
import { quantumFactoryBytecode, quantumRouterBytecode } from '../lib/bytecode'
import {
  envQuantumFactoryAddress,
  envQuantumRouterAddress,
  quantumFactoryAbi,
  quantumRouterAbi
} from '../lib/contracts'
import { useAppStore } from '../store/useAppStore'
import { useTrackedTx } from './useTrackedTx'

export function useAmmConfig() {
  const storedFactory = useAppStore((state) => state.ammFactoryAddress)
  const storedRouter = useAppStore((state) => state.ammRouterAddress)

  return {
    factoryAddress: storedFactory ?? envQuantumFactoryAddress,
    routerAddress: storedRouter ?? envQuantumRouterAddress,
    isRuntimeConfig: Boolean(storedFactory && storedRouter)
  }
}

export function useAmmSetup() {
  const { address } = useAccount()
  const { data: walletClient } = useWalletClient({ chainId: ARC_CHAIN_ID })
  const setAmmConfig = useAppStore((state) => state.setAmmConfig)
  const resetAmmConfig = useAppStore((state) => state.resetAmmConfig)
  const track = useTrackedTx()
  const { factoryAddress, routerAddress } = useAmmConfig()

  const deployAmm = useCallback(async () => {
    if (!address || !walletClient) throw new Error('Connect wallet first.')
    if (factoryAddress && routerAddress) return { factoryAddress, routerAddress }

    let factory = factoryAddress
    if (!factory) {
      const result = await track('amm', 'Deploy Quantum Factory', async () => {
        const hash = await walletClient.deployContract({
          account: address,
          abi: quantumFactoryAbi,
          bytecode: quantumFactoryBytecode
        })
        const receipt = await arcPublicClient.waitForTransactionReceipt({ hash })
        if (!receipt.contractAddress) throw new Error('Factory deploy failed.')
        return { hash, value: receipt.contractAddress }
      })
      factory = result.value
      if (!factory) throw new Error('Factory deploy failed.')
    }

    const routerResult = await track('amm', 'Deploy Quantum Router', async () => {
      const hash = await walletClient.deployContract({
        account: address,
        abi: quantumRouterAbi,
        bytecode: quantumRouterBytecode,
        args: [factory as Address]
      })
      const receipt = await arcPublicClient.waitForTransactionReceipt({ hash })
      if (!receipt.contractAddress) throw new Error('Router deploy failed.')
      return { hash, value: receipt.contractAddress }
    })
    const router = routerResult.value
    if (!router) throw new Error('Router deploy failed.')

    setAmmConfig(factory, router)
    return {
      factoryAddress: factory,
      routerAddress: router
    }
  }, [address, factoryAddress, routerAddress, setAmmConfig, track, walletClient])

  return {
    factoryAddress,
    routerAddress,
    deployAmm,
    resetAmmConfig
  }
}

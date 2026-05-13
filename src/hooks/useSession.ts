import { useCallback, useEffect, useMemo } from 'react'
import {
  createWalletClient,
  encodeFunctionData,
  parseEventLogs,
  type Address,
  type Hex,
  type TransactionReceipt
} from 'viem'
import { generatePrivateKey, privateKeyToAccount } from 'viem/accounts'
import { useAccount, useWalletClient } from 'wagmi'

import { ARC_CHAIN_ID, arcPublicClient, arcTestnet, arcTransport } from '../lib/arc'
import { smartSessionAccountBytecode } from '../lib/bytecode'
import { smartSessionAccountAbi } from '../lib/contracts'
import {
  clearStoredSession,
  decryptSessionKey,
  encryptSessionKey,
  readStoredSession,
  saveStoredSession
} from '../lib/session'
import { useAppStore } from '../store/useAppStore'

interface SessionTxRequest {
  to: Address
  data?: Hex
  value?: bigint
}

interface SessionTxResult {
  hash: Hex
  receipt: TransactionReceipt
}

const sessionLifetimeSeconds = 30 * 24 * 60 * 60

const requireExecutorGas = async (executor: Address) => {
  const balance = await arcPublicClient.getBalance({ address: executor })
  if (balance === 0n) {
    throw new Error(
      'Executor gas is 0. Send Arc native USDC gas to the executor key, then retry. ERC20 USDC token balance is not gas.'
    )
  }
}

export function useSession() {
  const { address, isConnected } = useAccount()
  const { data: walletClient } = useWalletClient({ chainId: ARC_CHAIN_ID })
  const {
    sessionKey,
    sessionAddress,
    smartAccountAddress,
    sessionExpiry,
    sessionSignature,
    setWallet,
    setSession,
    resetSession
  } = useAppStore()

  const isSessionActive = Boolean(
    sessionKey && sessionAddress && smartAccountAddress && sessionExpiry > Date.now()
  )

  useEffect(() => {
    setWallet((address as Address | undefined) ?? null, isConnected)
  }, [address, isConnected, setWallet])

  useEffect(() => {
    if (!address) {
      resetSession()
      return
    }

    const stored = readStoredSession(address)
    if (!stored?.smartAccountAddress) return
    if (stored.owner.toLowerCase() !== address.toLowerCase()) return
    if (stored.expiresAt <= Date.now()) {
      clearStoredSession(address)
      resetSession()
      return
    }

    decryptSessionKey(stored.encryptedKey, address)
      .then((key) =>
        setSession(
          key,
          stored.sessionAddress,
          stored.smartAccountAddress,
          stored.expiresAt,
          stored.signature
        )
      )
      .catch(() => {
        clearStoredSession(address)
        resetSession()
      })
  }, [address, resetSession, setSession])

  const sessionAccount = useMemo(() => {
    if (!sessionKey || !isSessionActive) return null
    return privateKeyToAccount(sessionKey)
  }, [isSessionActive, sessionKey])

  const initializeSession = useCallback(async () => {
    if (isSessionActive && smartAccountAddress) return smartAccountAddress
    if (!address || !walletClient) {
      throw new Error('Connect wallet to initialize session.')
    }

    const privateKey = generatePrivateKey()
    const account = privateKeyToAccount(privateKey)
    const expires = BigInt(Math.floor(Date.now() / 1000) + sessionLifetimeSeconds)

    const deployHash = await walletClient.deployContract({
      account: address,
      abi: smartSessionAccountAbi,
      bytecode: smartSessionAccountBytecode,
      args: [address]
    })
    const deployReceipt = await arcPublicClient.waitForTransactionReceipt({
      hash: deployHash
    })
    if (!deployReceipt.contractAddress) {
      throw new Error('Smart account deploy failed.')
    }
    const smartAccount = deployReceipt.contractAddress
    const enableHash = await walletClient.writeContract({
      account: address,
      address: smartAccount,
      abi: smartSessionAccountAbi,
      functionName: 'enableSession',
      args: [account.address, expires]
    })
    await arcPublicClient.waitForTransactionReceipt({ hash: enableHash })

    const expiresAt = Number(expires) * 1000
    const encryptedKey = await encryptSessionKey(privateKey, address)

    saveStoredSession({
      owner: address,
      sessionAddress: account.address,
      smartAccountAddress: smartAccount,
      encryptedKey,
      expiresAt,
      signature: null,
      createdAt: Date.now()
    })

    setSession(privateKey, account.address, smartAccount, expiresAt, null)
    return smartAccount
  }, [address, isSessionActive, setSession, smartAccountAddress, walletClient])

  const clearSession = useCallback(() => {
    if (address) clearStoredSession(address)
    resetSession()
  }, [address, resetSession])

  const sendSessionTransaction = useCallback(
    async (request: SessionTxRequest): Promise<SessionTxResult> => {
      if (!sessionAccount) {
        throw new Error('Session inactive. Initialize session first.')
      }
      if (!smartAccountAddress) {
        throw new Error('Smart account missing. Initialize session first.')
      }

      const wallet = createWalletClient({
        account: sessionAccount,
        chain: arcTestnet,
        transport: arcTransport
      })

      const data = encodeFunctionData({
        abi: smartSessionAccountAbi,
        functionName: 'execute',
        args: [request.to, request.value ?? 0n, request.data ?? '0x']
      })

      await requireExecutorGas(sessionAccount.address)

      const gas = await arcPublicClient.estimateGas({
        account: sessionAccount.address,
        to: smartAccountAddress,
        data,
        value: 0n
      })
      const gasWithBuffer = gas + gas / 5n

      const hash = await wallet.sendTransaction({
        account: sessionAccount,
        chain: arcTestnet,
        to: smartAccountAddress,
        data,
        value: 0n,
        gas: gasWithBuffer
      })
      const receipt = await arcPublicClient.waitForTransactionReceipt({ hash })
      return { hash, receipt }
    },
    [sessionAccount, smartAccountAddress]
  )

  const deployFromSmartAccount = useCallback(
    async (initCode: Hex, value = 0n): Promise<SessionTxResult & { address: Address }> => {
      if (!sessionAccount) {
        throw new Error('Session inactive. Initialize session first.')
      }
      if (!smartAccountAddress) {
        throw new Error('Smart account missing. Initialize session first.')
      }

      const wallet = createWalletClient({
        account: sessionAccount,
        chain: arcTestnet,
        transport: arcTransport
      })
      const data = encodeFunctionData({
        abi: smartSessionAccountAbi,
        functionName: 'deploy',
        args: [initCode, value]
      })
      await requireExecutorGas(sessionAccount.address)

      const gas = await arcPublicClient.estimateGas({
        account: sessionAccount.address,
        to: smartAccountAddress,
        data,
        value: 0n
      })
      const hash = await wallet.sendTransaction({
        account: sessionAccount,
        chain: arcTestnet,
        to: smartAccountAddress,
        data,
        value: 0n,
        gas: gas + gas / 5n
      })
      const receipt = await arcPublicClient.waitForTransactionReceipt({ hash })
      const logs = parseEventLogs({
        abi: smartSessionAccountAbi,
        eventName: 'ContractDeployed',
        logs: receipt.logs
      })
      const deployed = logs[0]?.args.deployed
      if (!deployed) throw new Error('Deploy event missing.')
      return { hash, receipt, address: deployed }
    },
    [sessionAccount, smartAccountAddress]
  )

  return {
    sessionKey,
    sessionAddress,
    smartAccountAddress,
    sessionAccount,
    sessionExpiry,
    sessionSignature,
    isSessionActive,
    initializeSession,
    clearSession,
    sendSessionTransaction,
    deployFromSmartAccount
  }
}

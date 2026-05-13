import { useCallback, useEffect, useMemo } from 'react'
import {
  createWalletClient,
  http,
  type Address,
  type Hex,
  type TransactionReceipt
} from 'viem'
import { generatePrivateKey, privateKeyToAccount } from 'viem/accounts'
import { useAccount, useWalletClient } from 'wagmi'

import { ARC_CHAIN_ID, ARC_RPC_URL, arcPublicClient, arcTestnet } from '../lib/arc'
import {
  clearStoredSession,
  decryptSessionKey,
  encryptSessionKey,
  readStoredSession,
  saveStoredSession
} from '../lib/session'
import { useAppStore } from '../store/useAppStore'

interface SessionTxRequest {
  to?: Address
  data?: Hex
  value?: bigint
}

interface SessionTxResult {
  hash: Hex
  receipt: TransactionReceipt
}

const oneDaySeconds = 24 * 60 * 60

export function useSession() {
  const { address, isConnected } = useAccount()
  const { data: walletClient } = useWalletClient({ chainId: ARC_CHAIN_ID })
  const {
    sessionKey,
    sessionAddress,
    sessionExpiry,
    sessionSignature,
    setWallet,
    setSession,
    resetSession
  } = useAppStore()

  const isSessionActive = Boolean(
    sessionKey && sessionAddress && sessionExpiry > Date.now()
  )

  useEffect(() => {
    setWallet((address as Address | undefined) ?? null, isConnected)
  }, [address, isConnected, setWallet])

  useEffect(() => {
    if (!address) {
      resetSession()
      return
    }

    const stored = readStoredSession()
    if (!stored) return
    if (stored.owner.toLowerCase() !== address.toLowerCase()) return
    if (stored.expiresAt <= Date.now()) {
      clearStoredSession()
      resetSession()
      return
    }

    decryptSessionKey(stored.encryptedKey, address)
      .then((key) =>
        setSession(key, stored.sessionAddress, stored.expiresAt, stored.signature)
      )
      .catch(() => {
        clearStoredSession()
        resetSession()
      })
  }, [address, resetSession, setSession])

  const sessionAccount = useMemo(() => {
    if (!sessionKey || !isSessionActive) return null
    return privateKeyToAccount(sessionKey)
  }, [isSessionActive, sessionKey])

  const initializeSession = useCallback(async () => {
    if (!address || !walletClient) {
      throw new Error('Connect wallet to initialize session.')
    }

    const privateKey = generatePrivateKey()
    const account = privateKeyToAccount(privateKey)
    const expires = BigInt(Math.floor(Date.now() / 1000) + oneDaySeconds)

    const signature = await walletClient.signTypedData({
      account: address,
      domain: {
        name: 'ArcQuantumLab',
        version: '1',
        chainId: ARC_CHAIN_ID
      },
      types: {
        Session: [
          { name: 'key', type: 'address' },
          { name: 'expires', type: 'uint256' }
        ]
      },
      primaryType: 'Session',
      message: {
        key: account.address,
        expires
      }
    })

    const expiresAt = Number(expires) * 1000
    const encryptedKey = await encryptSessionKey(privateKey, address)

    saveStoredSession({
      owner: address,
      sessionAddress: account.address,
      encryptedKey,
      expiresAt,
      signature,
      createdAt: Date.now()
    })

    setSession(privateKey, account.address, expiresAt, signature)
    return account.address
  }, [address, setSession, walletClient])

  const clearSession = useCallback(() => {
    clearStoredSession()
    resetSession()
  }, [resetSession])

  const sendSessionTransaction = useCallback(
    async (request: SessionTxRequest): Promise<SessionTxResult> => {
      if (!sessionAccount) {
        throw new Error('Session inactive. Initialize session first.')
      }

      const wallet = createWalletClient({
        account: sessionAccount,
        chain: arcTestnet,
        transport: http(ARC_RPC_URL)
      })

      const gas = await arcPublicClient.estimateGas({
        account: sessionAccount.address,
        to: request.to,
        data: request.data,
        value: request.value ?? 0n
      })
      const gasWithBuffer = gas + gas / 5n

      const hash = await wallet.sendTransaction({
        account: sessionAccount,
        chain: arcTestnet,
        to: request.to,
        data: request.data,
        value: request.value ?? 0n,
        gas: gasWithBuffer
      })
      const receipt = await arcPublicClient.waitForTransactionReceipt({ hash })
      return { hash, receipt }
    },
    [sessionAccount]
  )

  return {
    sessionKey,
    sessionAddress,
    sessionAccount,
    sessionExpiry,
    sessionSignature,
    isSessionActive,
    initializeSession,
    clearSession,
    sendSessionTransaction
  }
}

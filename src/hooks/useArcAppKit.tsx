/* eslint-disable react-refresh/only-export-components */
import {
  AppKit,
  BridgeChain,
  getErrorMessage,
  SwapChain,
  TransferSpeed,
  type BridgeResult,
  type BridgeStep,
  type SendParams,
  type SwapEstimate,
  type SwapParams,
  type SwapResult
} from '@circle-fin/app-kit'
import {
  createViemAdapterFromProvider,
  type ViemAdapter
} from '@circle-fin/adapter-viem-v2'
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode
} from 'react'
import {
  createPublicClient,
  encodeDeployData,
  encodeFunctionData,
  formatUnits,
  http,
  isAddress,
  parseUnits,
  type Address,
  type EIP1193Provider,
  type Hex
} from 'viem'

import {
  ARC_CHAIN_ID,
  ARC_EXPLORER,
  ARC_RPC_URLS,
  SEPOLIA_CHAIN_ID,
  SEPOLIA_EXPLORER,
  SEPOLIA_RPC_URL,
  arcPublicClient,
  arcTestnet,
  arcTransport
} from '../lib/arc'
import { quantumTokenBytecode } from '../lib/bytecode'
import { erc20Abi, quantumTokenAbi } from '../lib/contracts'
import { CIRCLE_KIT_KEY } from '../lib/env'
import { EURC_TOKEN } from '../lib/tokens'
import { PRIVY_ACCESS_TOKEN_STORAGE_KEY } from '../polyfills'
import { useAppStore } from '../store/useAppStore'
import { usePrivyBridge } from '../components/PrivyAppProvider'
import { useTrackedTx } from './useTrackedTx'

type StableToken = 'USDC' | 'EURC'
type SwapDirection = 'USDC_TO_EURC' | 'EURC_TO_USDC'
type BridgeDirection = 'SEPOLIA_TO_ARC' | 'ARC_TO_SEPOLIA'
type BridgeEstimate = Awaited<ReturnType<AppKit['estimateBridge']>>

interface SwapRequest {
  amount: string
  direction: SwapDirection
  slippageBps: number
}

interface SendRequest {
  token: StableToken
  amount: string
  to: Address
}

interface Erc20SendRequest {
  tokenAddress: Address
  symbol: string
  decimals: number
  amount: string
  to: Address
}

interface NativeSendRequest {
  amount: string
  to: Address
}

interface BridgeRequest {
  amount: string
  direction: BridgeDirection
  recipient?: Address
}

interface DeployRequest {
  name: string
  symbol: string
  supply: string
  decimals: number
}

interface DeployResult {
  txHash: Hex
  contractAddress: Address
}

interface HashResult {
  txHash: Hex
}

interface StoredSignIn {
  account: Address
  signature: Hex
  token: string
  issuedAt: string
  expiresAt: number
}

interface ArcKitContextValue {
  account: Address | null
  chainId: number | null
  isConnected: boolean
  isConnecting: boolean
  isSignedIn: boolean
  authSignature: Hex | null
  authToken: string | null
  privyEnabled: boolean
  privyAuthenticated: boolean
  privyServerVerified: boolean | null
  privyServerAuthError: string | null
  privyUserId: string | null
  walletLabel: string | null
  signInExpiresAt: number
  lastError: string | null
  connect: () => Promise<void>
  signIn: () => Promise<void>
  signOut: () => Promise<void>
  switchToArc: () => Promise<void>
  estimateSwap: (request: SwapRequest) => Promise<SwapEstimate>
  executeSwap: (request: SwapRequest) => Promise<SwapResult>
  sendToken: (request: SendRequest) => Promise<BridgeStep>
  sendErc20Wallet: (request: Erc20SendRequest) => Promise<HashResult>
  sendNativeWallet: (request: NativeSendRequest) => Promise<HashResult>
  bridgeUsdc: (request: BridgeRequest) => Promise<BridgeResult>
  deployToken: (request: DeployRequest) => Promise<DeployResult>
}

const ArcKitContext = createContext<ArcKitContextValue | null>(null)
const signInStorageKey = 'arc_quantum_signin_v2'
const manualDisconnectKey = 'arc_quantum_manual_disconnect_v1'
const signInLifetimeMs = 7 * 24 * 60 * 60 * 1000

function getInjectedProvider() {
  const provider = window.ethereum
  if (!provider) throw new Error('Injected wallet tidak ditemukan.')
  return provider
}

function normalizeError(error: unknown) {
  const kitMessage = getErrorMessage(error)
  const message = kitMessage || (error instanceof Error ? error.message : String(error))
  if (/createSwap failed|Failed to fetch|Maximum retry attempts/i.test(message)) {
    return [
      'Circle swap route gagal.',
      'Proxy Vercel sudah aktif; kalau masih gagal cek Circle Kit Key domain/API dan saldo input.',
      `Raw: ${message}`
    ].join(' ')
  }
  return message
}

function swapTokens(direction: SwapDirection) {
  if (direction === 'USDC_TO_EURC') {
    return { tokenIn: 'USDC', tokenOut: 'EURC' } as const
  }
  return { tokenIn: 'EURC', tokenOut: 'USDC' } as const
}

function txHashFromStep(step: BridgeStep) {
  return step.txHash?.startsWith('0x') ? (step.txHash as Hex) : undefined
}

function bridgeHash(result: BridgeResult) {
  const step = [...result.steps].reverse().find((item) => item.txHash)
  return step?.txHash?.startsWith('0x') ? (step.txHash as Hex) : undefined
}

function bridgeFeeCap(estimate: BridgeEstimate) {
  const fee = estimate.fees.reduce((total, item) => {
    if (!item.amount) return total
    try {
      return total + parseUnits(item.amount, 6)
    } catch {
      return total
    }
  }, 0n)
  if (fee <= 0n) return undefined
  const buffered = fee + fee / 5n + 10_000n
  return formatUnits(buffered, 6)
}

function bridgeStepLabel(step: BridgeStep, index: number) {
  const hash = step.txHash?.startsWith('0x') ? ` tx=${step.txHash.slice(0, 10)}...` : ''
  const category = step.errorCategory ? ` category=${step.errorCategory}` : ''
  const reason = step.errorMessage ? ` reason=${step.errorMessage}` : ''
  return `${index + 1}. ${step.name}: ${step.state}${category}${hash}${reason}`
}

function bridgeFailureMessage(result: BridgeResult) {
  const details = result.steps.map(bridgeStepLabel).join(' | ')
  return `Bridge failed before completion. ${details || 'No step details.'}`
}

function isForwarderFallbackError(error: unknown) {
  const message = error instanceof Error ? error.message : String(error)
  if (/user_rejected|reject|denied|insufficient|balance|allowance|funds/i.test(message)) {
    return false
  }
  return /forwarder|route|unsupported|not supported|maxFee|fee/i.test(message)
}

async function requestAccounts(provider: EIP1193Provider) {
  const accounts = (await provider.request({
    method: 'eth_requestAccounts'
  })) as Address[]
  if (!accounts[0] || !isAddress(accounts[0])) {
    throw new Error('Wallet account tidak valid.')
  }
  return accounts[0]
}

async function authorizedAccount(provider: EIP1193Provider) {
  const accounts = (await provider.request({ method: 'eth_accounts' })) as Address[]
  return accounts[0] && isAddress(accounts[0]) ? accounts[0] : null
}

function readStoredSignIns() {
  const raw = localStorage.getItem(signInStorageKey)
  if (!raw) return {} as Record<string, StoredSignIn>
  try {
    return JSON.parse(raw) as Record<string, StoredSignIn>
  } catch {
    localStorage.removeItem(signInStorageKey)
    return {} as Record<string, StoredSignIn>
  }
}

function clearStoredSignIn(account?: Address | null) {
  if (!account) {
    localStorage.removeItem(signInStorageKey)
    return
  }
  const stored = readStoredSignIns()
  delete stored[account.toLowerCase()]
  localStorage.setItem(signInStorageKey, JSON.stringify(stored))
}

function readStoredSignIn(account: Address) {
  const stored = readStoredSignIns()[account.toLowerCase()]
  if (!stored || stored.expiresAt <= Date.now()) {
    if (stored) clearStoredSignIn(account)
    return null
  }
  return stored
}

function saveStoredSignIn(auth: StoredSignIn) {
  const stored = readStoredSignIns()
  stored[auth.account.toLowerCase()] = auth
  localStorage.setItem(signInStorageKey, JSON.stringify(stored))
}

function isManualDisconnect() {
  return localStorage.getItem(manualDisconnectKey) === '1'
}

function setManualDisconnect(value: boolean) {
  if (value) {
    localStorage.setItem(manualDisconnectKey, '1')
    return
  }
  localStorage.removeItem(manualDisconnectKey)
}

function base64Url(value: string) {
  const bytes = new TextEncoder().encode(value)
  let binary = ''
  for (const byte of bytes) binary += String.fromCharCode(byte)
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function buildAuthToken({
  address,
  nonce,
  issuedAt,
  expiresAt,
  signature
}: {
  address: Address
  nonce: Hex
  issuedAt: string
  expiresAt: number
  signature: Hex
}) {
  const header = { alg: 'EIP712', typ: 'JWT' }
  const payload = {
    iss: 'Arc Quantum Lab',
    sub: address,
    aud: window.location.origin,
    chainId: ARC_CHAIN_ID,
    nonce,
    iat: Math.floor(Date.parse(issuedAt) / 1000),
    exp: Math.floor(expiresAt / 1000)
  }
  return `${base64Url(JSON.stringify(header))}.${base64Url(
    JSON.stringify(payload)
  )}.${base64Url(signature)}`
}

async function signInWallet(provider: EIP1193Provider, address: Address): Promise<StoredSignIn> {
  const looseProvider = provider as {
    request: (args: { method: string; params?: unknown[] }) => Promise<unknown>
  }
  const bytes = crypto.getRandomValues(new Uint8Array(32))
  const nonce = `0x${Array.from(bytes)
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('')}` as Hex
  const issuedAt = new Date().toISOString()
  const expiresAt = Date.now() + signInLifetimeMs
  const expiresAtIso = new Date(expiresAt).toISOString()
  const typedData = {
    domain: {
      name: 'Arc Quantum Lab',
      version: '1',
      chainId: ARC_CHAIN_ID
    },
    types: {
      EIP712Domain: [
        { name: 'name', type: 'string' },
        { name: 'version', type: 'string' },
        { name: 'chainId', type: 'uint256' }
      ],
      SignIn: [
        { name: 'wallet', type: 'address' },
        { name: 'statement', type: 'string' },
        { name: 'nonce', type: 'bytes32' },
        { name: 'issuedAt', type: 'string' },
        { name: 'expiresAt', type: 'string' }
      ]
    },
    primaryType: 'SignIn',
    message: {
      wallet: address,
      statement:
        'Sign in to Arc Quantum Lab. This proves wallet ownership and does not spend gas.',
      nonce,
      issuedAt,
      expiresAt: expiresAtIso
    }
  }

  try {
    const signature = (await provider.request({
      method: 'eth_signTypedData_v4',
      params: [address, JSON.stringify(typedData)]
    })) as Hex
    const token = buildAuthToken({ address, nonce, issuedAt, expiresAt, signature })
    return { account: address, signature, token, issuedAt, expiresAt }
  } catch (error) {
    const code = (error as { code?: number }).code
    if (code === 4001) throw error
    const signature = (await looseProvider.request({
      method: 'personal_sign',
      params: [
        `Arc Quantum Lab sign in\nWallet: ${address}\nNonce: ${nonce}\nIssued: ${issuedAt}\nExpires: ${expiresAtIso}`,
        address
      ]
    })) as Hex
    const token = buildAuthToken({ address, nonce, issuedAt, expiresAt, signature })
    return { account: address, signature, token, issuedAt, expiresAt }
  }
}

async function currentChainId(provider: EIP1193Provider) {
  const value = (await provider.request({ method: 'eth_chainId' })) as string
  return Number.parseInt(value, 16)
}

async function switchChain(
  provider: EIP1193Provider,
  params: {
    chainId: number
    chainName: string
    nativeCurrency: { name: string; symbol: string; decimals: number }
    rpcUrls: string[]
    blockExplorerUrls: string[]
  }
) {
  const hexChainId = `0x${params.chainId.toString(16)}`
  try {
    await provider.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: hexChainId }]
    })
  } catch (error) {
    const code = (error as { code?: number }).code
    if (code !== 4902) throw error
    await provider.request({
      method: 'wallet_addEthereumChain',
      params: [
        {
          chainId: hexChainId,
          chainName: params.chainName,
          nativeCurrency: params.nativeCurrency,
          rpcUrls: params.rpcUrls,
          blockExplorerUrls: params.blockExplorerUrls
        }
      ]
    })
  }
}

export function ArcKitProvider({ children }: { children: ReactNode }) {
  const [adapter, setAdapter] = useState<ViemAdapter | null>(null)
  const [account, setAccount] = useState<Address | null>(null)
  const [chainId, setChainId] = useState<number | null>(null)
  const [isConnecting, setIsConnecting] = useState(false)
  const [isSignedIn, setIsSignedIn] = useState(false)
  const [authSignature, setAuthSignature] = useState<Hex | null>(null)
  const [authToken, setAuthToken] = useState<string | null>(null)
  const [signInExpiresAt, setSignInExpiresAt] = useState(0)
  const [lastError, setLastError] = useState<string | null>(null)
  const privy = usePrivyBridge()
  const setWallet = useAppStore((state) => state.setWallet)
  const addToken = useAppStore((state) => state.addToken)
  const track = useTrackedTx()
  const kit = useMemo(() => new AppKit(), [])

  const resetWalletState = useCallback(() => {
    setWallet(null, false)
    setAccount(null)
    setAdapter(null)
    setChainId(null)
    setIsSignedIn(false)
    setAuthSignature(null)
    setAuthToken(null)
    setSignInExpiresAt(0)
  }, [setWallet])

  const resolveProvider = useCallback(async () => {
    const privyProvider = await privy.getProvider()
    if (privyProvider) return privyProvider
    return getInjectedProvider()
  }, [privy])

  const applyStoredAuth = useCallback((address: Address) => {
    const stored = readStoredSignIn(address)
    setIsSignedIn(Boolean(stored))
    setAuthSignature(stored?.signature ?? null)
    setAuthToken(stored?.token ?? null)
    setSignInExpiresAt(stored?.expiresAt ?? 0)
  }, [])

  const buildAdapter = useCallback(async (request = true) => {
    const provider = await resolveProvider()
    const providerAddress = request
      ? await requestAccounts(provider)
      : await authorizedAccount(provider)
    const address = providerAddress ?? privy.account
    if (!address) throw new Error('Wallet belum connected.')
    const nextAdapter = await createViemAdapterFromProvider({
      provider,
      capabilities: { addressContext: 'user-controlled' },
      getPublicClient: ({ chain }) =>
        createPublicClient({
          chain: chain.id === ARC_CHAIN_ID ? arcTestnet : chain,
          transport:
            chain.id === ARC_CHAIN_ID
              ? arcTransport
              : http(SEPOLIA_RPC_URL, { retryCount: 3, timeout: 10_000 })
        })
    })
    setAdapter(nextAdapter)
    setAccount(address)
    setWallet(address, true)
    applyStoredAuth(address)
    setChainId(await currentChainId(provider))
    return { adapter: nextAdapter, address }
  }, [applyStoredAuth, privy.account, resolveProvider, setWallet])

  useEffect(() => {
    if (privy.enabled) return
    const provider = window.ethereum
    if (!provider) return
    let alive = true
    const walletEvents = provider as EIP1193Provider & {
      on?: (event: string, handler: (...args: unknown[]) => void) => void
      removeListener?: (event: string, handler: (...args: unknown[]) => void) => void
    }
    const restore = async () => {
      if (isManualDisconnect()) return
      try {
        const result = await buildAdapter(false)
        if (!alive) return
        applyStoredAuth(result.address)
      } catch {
        if (alive) resetWalletState()
      }
    }
    const handleAccountsChanged = () => {
      void restore()
    }
    const handleChainChanged = () => {
      void currentChainId(provider).then((nextChainId) => {
        if (alive) setChainId(nextChainId)
      })
    }
    void restore()
    walletEvents.on?.('accountsChanged', handleAccountsChanged)
    walletEvents.on?.('chainChanged', handleChainChanged)
    return () => {
      alive = false
      walletEvents.removeListener?.('accountsChanged', handleAccountsChanged)
      walletEvents.removeListener?.('chainChanged', handleChainChanged)
    }
  }, [applyStoredAuth, buildAdapter, privy.enabled, resetWalletState])

  useEffect(() => {
    if (!privy.enabled) return
    if (!privy.ready) return
    if (!privy.account) {
      resetWalletState()
      return
    }
    let alive = true
    void buildAdapter(false).catch(() => {
      if (alive) resetWalletState()
    })
    return () => {
      alive = false
    }
  }, [buildAdapter, privy.account, privy.enabled, privy.ready, resetWalletState])

  useEffect(() => {
    if (!privy.enabled) return
    if (privy.accessToken) {
      setAuthToken(privy.accessToken)
      setIsSignedIn(true)
      setSignInExpiresAt(0)
      return
    }
    if (account) applyStoredAuth(account)
  }, [account, applyStoredAuth, privy.accessToken, privy.enabled])

  const switchToArc = useCallback(async () => {
    const provider = await resolveProvider()
    await switchChain(provider, {
      chainId: ARC_CHAIN_ID,
      chainName: 'Arc Testnet',
      nativeCurrency: { name: 'USDC', symbol: 'USDC', decimals: 18 },
      rpcUrls: ARC_RPC_URLS,
      blockExplorerUrls: [ARC_EXPLORER]
    })
    setChainId(ARC_CHAIN_ID)
  }, [resolveProvider])

  const switchToSepolia = useCallback(async () => {
    const provider = await resolveProvider()
    await switchChain(provider, {
      chainId: SEPOLIA_CHAIN_ID,
      chainName: 'Ethereum Sepolia',
      nativeCurrency: { name: 'Sepolia Ether', symbol: 'ETH', decimals: 18 },
      rpcUrls: [SEPOLIA_RPC_URL],
      blockExplorerUrls: [SEPOLIA_EXPLORER]
    })
    setChainId(SEPOLIA_CHAIN_ID)
  }, [resolveProvider])

  const connect = useCallback(async () => {
    setIsConnecting(true)
    setLastError(null)
    const wasManualDisconnect = isManualDisconnect()
    setManualDisconnect(false)
    try {
      if (
        privy.enabled &&
        (wasManualDisconnect || !privy.ready || !privy.authenticated || !privy.account)
      ) {
        await privy.connect()
        return
      }
      await buildAdapter(true)
      await switchToArc()
    } catch (error) {
      setLastError(normalizeError(error))
    } finally {
      setIsConnecting(false)
    }
  }, [buildAdapter, privy, switchToArc])

  const signIn = useCallback(async () => {
    setIsConnecting(true)
    setLastError(null)
    setManualDisconnect(false)
    try {
      if (privy.enabled && (!privy.authenticated || !privy.account)) {
        await privy.connect()
        return
      }
      const provider = await resolveProvider()
      const result = account && adapter ? { adapter, address: account } : await buildAdapter(true)
      await switchToArc()
      const auth = await signInWallet(provider, result.address)
      saveStoredSignIn(auth)
      const privyToken = await privy.refreshAccessToken()
      setIsSignedIn(true)
      setAuthSignature(auth.signature)
      setAuthToken(privyToken ?? auth.token)
      setSignInExpiresAt(auth.expiresAt)
    } catch (error) {
      setLastError(normalizeError(error))
    } finally {
      setIsConnecting(false)
    }
  }, [account, adapter, buildAdapter, privy, resolveProvider, switchToArc])

  const signOut = useCallback(async () => {
    setIsConnecting(true)
    setLastError(null)
    clearStoredSignIn(account)
    setManualDisconnect(true)
    resetWalletState()
    sessionStorage.removeItem(PRIVY_ACCESS_TOKEN_STORAGE_KEY)
    try {
      await privy.logout()
    } catch (error) {
      setLastError(normalizeError(error))
    } finally {
      setIsConnecting(false)
    }
  }, [account, privy, resetWalletState])

  const readyAdapter = useCallback(async () => {
    await switchToArc()
    return adapter ?? (await buildAdapter(true)).adapter
  }, [adapter, buildAdapter, switchToArc])

  const ensureCircleProxyAuth = useCallback(async () => {
    if (!privy.enabled) return
    const token = privy.accessToken ?? (await privy.refreshAccessToken())
    if (!token) throw new Error('Privy auth token missing.')
    sessionStorage.setItem(PRIVY_ACCESS_TOKEN_STORAGE_KEY, token)
  }, [privy])

  const estimateSwap = useCallback(
    async ({ amount, direction, slippageBps }: SwapRequest) => {
      await ensureCircleProxyAuth()
      const activeAdapter = await readyAdapter()
      const { tokenIn, tokenOut } = swapTokens(direction)
      return kit.estimateSwap({
        from: { adapter: activeAdapter, chain: SwapChain.Arc_Testnet },
        tokenIn,
        tokenOut,
        amountIn: amount,
        config: {
          kitKey: CIRCLE_KIT_KEY,
          slippageBps
        }
      } satisfies SwapParams)
    },
    [ensureCircleProxyAuth, kit, readyAdapter]
  )

  const executeSwap = useCallback(
    async (request: SwapRequest) => {
      await ensureCircleProxyAuth()
      const { tokenIn, tokenOut } = swapTokens(request.direction)
      const tracked = await track('swap', `Swap ${tokenIn} to ${tokenOut}`, async () => {
        const activeAdapter = await readyAdapter()
        const result = await kit.swap({
          from: { adapter: activeAdapter, chain: SwapChain.Arc_Testnet },
          tokenIn,
          tokenOut,
          amountIn: request.amount,
          config: {
            kitKey: CIRCLE_KIT_KEY,
            slippageBps: request.slippageBps
          }
        } satisfies SwapParams)
        return {
          hash: result.txHash.startsWith('0x') ? (result.txHash as Hex) : undefined,
          value: result
        }
      })
      if (!tracked.value) throw new Error('Swap result kosong.')
      return tracked.value
    },
    [ensureCircleProxyAuth, kit, readyAdapter, track]
  )

  const sendToken = useCallback(
    async ({ token, amount, to }: SendRequest) => {
      await ensureCircleProxyAuth()
      const tracked = await track('send', `Send ${token} to ${to.slice(0, 10)}...`, async () => {
        const activeAdapter = await readyAdapter()
        const tokenParam: SendParams['token'] =
          token === 'USDC' ? 'USDC' : EURC_TOKEN.address
        const result = await kit.send({
          from: { adapter: activeAdapter, chain: 'Arc_Testnet' },
          to,
          amount,
          token: tokenParam
        })
        return { hash: txHashFromStep(result), value: result }
      })
      if (!tracked.value) throw new Error('Send result kosong.')
      return tracked.value
    },
    [ensureCircleProxyAuth, kit, readyAdapter, track]
  )

  const sendErc20Wallet = useCallback(
    async ({ tokenAddress, symbol, decimals, amount, to }: Erc20SendRequest) => {
      const value = parseUnits(amount || '0', decimals)
      if (value <= 0n) throw new Error('Amount must be greater than zero.')
      const data = encodeFunctionData({
        abi: erc20Abi,
        functionName: 'transfer',
        args: [to, value]
      })
      const tracked = await track(
        'send',
        `Wallet send ${symbol} to ${to.slice(0, 10)}...`,
        async () => {
          await switchToArc()
          const provider = await resolveProvider()
          const from = account ?? (await requestAccounts(provider))
          const hash = (await provider.request({
            method: 'eth_sendTransaction',
            params: [{ from, to: tokenAddress, data, value: '0x0' }]
          })) as Hex
          return { hash, value: { txHash: hash } }
        }
      )
      if (!tracked.value) throw new Error('Wallet send result kosong.')
      return tracked.value
    },
    [account, resolveProvider, switchToArc, track]
  )

  const sendNativeWallet = useCallback(
    async ({ amount, to }: NativeSendRequest) => {
      const value = parseUnits(amount || '0', 18)
      if (value <= 0n) throw new Error('Amount must be greater than zero.')
      const tracked = await track('send', `Wallet native send to ${to.slice(0, 10)}...`, async () => {
        await switchToArc()
        const provider = await resolveProvider()
        const from = account ?? (await requestAccounts(provider))
        const hash = (await provider.request({
          method: 'eth_sendTransaction',
          params: [{ from, to, value: `0x${value.toString(16)}` }]
        })) as Hex
        return { hash, value: { txHash: hash } }
      })
      if (!tracked.value) throw new Error('Wallet native send result kosong.')
      return tracked.value
    },
    [account, resolveProvider, switchToArc, track]
  )

  const bridgeUsdc = useCallback(
    async ({ amount, direction, recipient }: BridgeRequest) => {
      await ensureCircleProxyAuth()
      const summary =
        direction === 'SEPOLIA_TO_ARC'
          ? 'Bridge USDC Sepolia to Arc'
          : 'Bridge USDC Arc to Sepolia'
      const tracked = await track('bridge', summary, async () => {
        if (!recipient) throw new Error('Recipient bridge wajib valid.')
        if (direction === 'SEPOLIA_TO_ARC') {
          await switchToSepolia()
        } else {
          await switchToArc()
        }
        const activeAdapter = adapter ?? (await buildAdapter(true)).adapter
        const destinationChain =
          direction === 'SEPOLIA_TO_ARC'
            ? BridgeChain.Arc_Testnet
            : BridgeChain.Ethereum_Sepolia
        const from = {
          adapter: activeAdapter,
          chain:
            direction === 'SEPOLIA_TO_ARC'
              ? BridgeChain.Ethereum_Sepolia
              : BridgeChain.Arc_Testnet
        } as const
        const forwarderParams = {
          from,
          to: {
            chain: destinationChain,
            recipientAddress: recipient,
            useForwarder: true
          },
          amount,
          token: 'USDC',
          config: {
            transferSpeed: TransferSpeed.FAST,
            batchTransactions: true
          }
        } as const
        const standardParams = {
          from: {
            adapter: activeAdapter,
            chain: from.chain
          },
          to: {
            adapter: activeAdapter,
            chain: destinationChain,
            recipientAddress: recipient
          },
          amount,
          token: 'USDC',
          config: {
            transferSpeed: TransferSpeed.FAST,
            batchTransactions: true
          }
        } as const

        let result: BridgeResult
        try {
          const estimate = await kit.estimateBridge(forwarderParams)
          const maxFee = bridgeFeeCap(estimate)
          result = await kit.bridge({
            ...forwarderParams,
            config: {
              ...forwarderParams.config,
              ...(maxFee ? { maxFee } : {})
            }
          })
        } catch (error) {
          if (!isForwarderFallbackError(error)) throw error
          const estimate = await kit.estimateBridge(standardParams)
          const maxFee = bridgeFeeCap(estimate)
          result = await kit.bridge({
            ...standardParams,
            config: {
              ...standardParams.config,
              ...(maxFee ? { maxFee } : {})
            }
          })
        }

        if (result.state === 'error') throw new Error(bridgeFailureMessage(result))
        return { hash: bridgeHash(result), value: result }
      })
      if (!tracked.value) throw new Error('Bridge result kosong.')
      return tracked.value
    },
    [adapter, buildAdapter, ensureCircleProxyAuth, kit, switchToArc, switchToSepolia, track]
  )

  const deployToken = useCallback(
    async ({ name, symbol, supply, decimals }: DeployRequest) => {
      const trimmedName = name.trim()
      const trimmedSymbol = symbol.trim().toUpperCase()
      if (!trimmedName) throw new Error('Token name required.')
      if (!trimmedSymbol) throw new Error('Token symbol required.')
      if (decimals < 0 || decimals > 18) throw new Error('Decimals must be 0-18.')
      const parsedSupply = parseUnits(supply || '0', decimals)
      if (parsedSupply <= 0n) throw new Error('Supply must be greater than zero.')

      const data = encodeDeployData({
        abi: quantumTokenAbi,
        bytecode: quantumTokenBytecode,
        args: [trimmedName, trimmedSymbol, parsedSupply, decimals]
      })

      const tracked = await track('deploy', `Deploy ${trimmedSymbol}`, async () => {
        await readyAdapter()
        const provider = await resolveProvider()
        const from = account ?? (await requestAccounts(provider))
        const hash = (await provider.request({
          method: 'eth_sendTransaction',
          params: [{ from, data, value: '0x0' }]
        })) as Hex
        const receipt = await arcPublicClient.waitForTransactionReceipt({ hash })
        if (!receipt.contractAddress) throw new Error('Contract address missing.')
        return {
          hash,
          value: {
            txHash: hash,
            contractAddress: receipt.contractAddress
          }
        }
      })

      if (!tracked.value) throw new Error('Deploy result kosong.')
      addToken({
        address: tracked.value.contractAddress,
        name: trimmedName,
        symbol: trimmedSymbol,
        decimals,
        createdAt: Date.now(),
        txHash: tracked.value.txHash
      })
      return tracked.value
    },
    [account, addToken, readyAdapter, resolveProvider, track]
  )

  const value = useMemo(
    () => ({
      account,
      chainId,
      isConnected: Boolean(account),
      isConnecting,
      isSignedIn,
      authSignature,
      authToken,
      privyEnabled: privy.enabled,
      privyAuthenticated: privy.authenticated,
      privyServerVerified: privy.serverVerified,
      privyServerAuthError: privy.serverAuthError,
      privyUserId: privy.userId,
      walletLabel: privy.walletLabel,
      signInExpiresAt,
      lastError,
      connect,
      signIn,
      signOut,
      switchToArc,
      estimateSwap,
      executeSwap,
      sendToken,
      sendErc20Wallet,
      sendNativeWallet,
      bridgeUsdc,
      deployToken
    }),
    [
      account,
      authSignature,
      authToken,
      bridgeUsdc,
      chainId,
      connect,
      deployToken,
      estimateSwap,
      executeSwap,
      isSignedIn,
      isConnecting,
      lastError,
      privy.authenticated,
      privy.enabled,
      privy.serverAuthError,
      privy.serverVerified,
      privy.userId,
      privy.walletLabel,
      sendErc20Wallet,
      sendNativeWallet,
      signIn,
      signInExpiresAt,
      signOut,
      sendToken,
      switchToArc
    ]
  )

  return <ArcKitContext.Provider value={value}>{children}</ArcKitContext.Provider>
}

export function useArcAppKit() {
  const context = useContext(ArcKitContext)
  if (!context) throw new Error('useArcAppKit must be used inside ArcKitProvider.')
  return context
}

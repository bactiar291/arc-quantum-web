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
  useMemo,
  useState,
  type ReactNode
} from 'react'
import {
  createPublicClient,
  http,
  isAddress,
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
  arcTestnet,
  arcTransport
} from '../lib/arc'
import { CIRCLE_KIT_KEY } from '../lib/env'
import { EURC_TOKEN } from '../lib/tokens'
import { useAppStore } from '../store/useAppStore'
import { useTrackedTx } from './useTrackedTx'

type StableToken = 'USDC' | 'EURC'
type SwapDirection = 'USDC_TO_EURC' | 'EURC_TO_USDC'
type BridgeDirection = 'SEPOLIA_TO_ARC' | 'ARC_TO_SEPOLIA'

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

interface BridgeRequest {
  amount: string
  direction: BridgeDirection
  recipient?: Address
}

interface ArcKitContextValue {
  account: Address | null
  chainId: number | null
  isConnected: boolean
  isConnecting: boolean
  lastError: string | null
  connect: () => Promise<void>
  switchToArc: () => Promise<void>
  estimateSwap: (request: SwapRequest) => Promise<SwapEstimate>
  executeSwap: (request: SwapRequest) => Promise<SwapResult>
  sendToken: (request: SendRequest) => Promise<BridgeStep>
  bridgeUsdc: (request: BridgeRequest) => Promise<BridgeResult>
}

const ArcKitContext = createContext<ArcKitContextValue | null>(null)

function getProvider() {
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

async function requestAccounts(provider: EIP1193Provider) {
  const accounts = (await provider.request({
    method: 'eth_requestAccounts'
  })) as Address[]
  if (!accounts[0] || !isAddress(accounts[0])) {
    throw new Error('Wallet account tidak valid.')
  }
  return accounts[0]
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
  const [lastError, setLastError] = useState<string | null>(null)
  const setWallet = useAppStore((state) => state.setWallet)
  const track = useTrackedTx()
  const kit = useMemo(() => new AppKit(), [])

  const buildAdapter = useCallback(async () => {
    const provider = getProvider()
    const address = await requestAccounts(provider)
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
    setChainId(await currentChainId(provider))
    return nextAdapter
  }, [setWallet])

  const switchToArc = useCallback(async () => {
    const provider = getProvider()
    await switchChain(provider, {
      chainId: ARC_CHAIN_ID,
      chainName: 'Arc Testnet',
      nativeCurrency: { name: 'USDC', symbol: 'USDC', decimals: 18 },
      rpcUrls: ARC_RPC_URLS,
      blockExplorerUrls: [ARC_EXPLORER]
    })
    setChainId(ARC_CHAIN_ID)
  }, [])

  const switchToSepolia = useCallback(async () => {
    const provider = getProvider()
    await switchChain(provider, {
      chainId: SEPOLIA_CHAIN_ID,
      chainName: 'Ethereum Sepolia',
      nativeCurrency: { name: 'Sepolia Ether', symbol: 'ETH', decimals: 18 },
      rpcUrls: [SEPOLIA_RPC_URL],
      blockExplorerUrls: [SEPOLIA_EXPLORER]
    })
    setChainId(SEPOLIA_CHAIN_ID)
  }, [])

  const connect = useCallback(async () => {
    setIsConnecting(true)
    setLastError(null)
    try {
      await switchToArc()
      await buildAdapter()
    } catch (error) {
      setLastError(normalizeError(error))
      throw error
    } finally {
      setIsConnecting(false)
    }
  }, [buildAdapter, switchToArc])

  const readyAdapter = useCallback(async () => {
    if (!CIRCLE_KIT_KEY) throw new Error('VITE_CIRCLE_KIT_KEY belum diset.')
    await switchToArc()
    return adapter ?? (await buildAdapter())
  }, [adapter, buildAdapter, switchToArc])

  const estimateSwap = useCallback(
    async ({ amount, direction, slippageBps }: SwapRequest) => {
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
    [kit, readyAdapter]
  )

  const executeSwap = useCallback(
    async (request: SwapRequest) => {
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
    [kit, readyAdapter, track]
  )

  const sendToken = useCallback(
    async ({ token, amount, to }: SendRequest) => {
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
    [kit, readyAdapter, track]
  )

  const bridgeUsdc = useCallback(
    async ({ amount, direction, recipient }: BridgeRequest) => {
      const summary =
        direction === 'SEPOLIA_TO_ARC'
          ? 'Bridge USDC Sepolia to Arc'
          : 'Bridge USDC Arc to Sepolia'
      const tracked = await track('send', summary, async () => {
        if (direction === 'SEPOLIA_TO_ARC') {
          await switchToSepolia()
        } else {
          await switchToArc()
        }
        const activeAdapter = adapter ?? (await buildAdapter())
        const result = await kit.bridge({
          from: {
            adapter: activeAdapter,
            chain:
              direction === 'SEPOLIA_TO_ARC'
                ? BridgeChain.Ethereum_Sepolia
                : BridgeChain.Arc_Testnet
          },
          to: {
            adapter: activeAdapter,
            chain:
              direction === 'SEPOLIA_TO_ARC'
                ? BridgeChain.Arc_Testnet
                : BridgeChain.Ethereum_Sepolia,
            recipientAddress: recipient
          },
          amount,
          token: 'USDC',
          config: {
            transferSpeed: TransferSpeed.FAST
          }
        })
        return { hash: bridgeHash(result), value: result }
      })
      if (!tracked.value) throw new Error('Bridge result kosong.')
      return tracked.value
    },
    [adapter, buildAdapter, kit, switchToArc, switchToSepolia, track]
  )

  const value = useMemo(
    () => ({
      account,
      chainId,
      isConnected: Boolean(account),
      isConnecting,
      lastError,
      connect,
      switchToArc,
      estimateSwap,
      executeSwap,
      sendToken,
      bridgeUsdc
    }),
    [
      account,
      bridgeUsdc,
      chainId,
      connect,
      estimateSwap,
      executeSwap,
      isConnecting,
      lastError,
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

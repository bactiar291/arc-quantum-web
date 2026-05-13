import {
  createPublicClient,
  defineChain,
  fallback,
  http,
  type Address,
  type Hex
} from 'viem'

export const ARC_CHAIN_ID = Number(import.meta.env.VITE_ARC_CHAIN_ID || 5042002)
export const ARC_PRIMARY_RPC_URL =
  import.meta.env.VITE_ARC_RPC_URL || 'https://rpc.testnet.arc.network'
export const ARC_FALLBACK_RPC_URL =
  import.meta.env.VITE_ARC_FALLBACK_RPC_URL || 'https://rpc.testnet.arc.network'
export const ARC_RPC_URLS = Array.from(
  new Set([ARC_PRIMARY_RPC_URL, ARC_FALLBACK_RPC_URL].filter(Boolean))
)
export const ARC_EXPLORER =
  import.meta.env.VITE_ARC_EXPLORER || 'https://testnet.arcscan.app'

export const arcTransport = fallback(
  ARC_RPC_URLS.map((url) =>
    http(url, {
      retryCount: 3,
      timeout: 10_000
    })
  ),
  { rank: false }
)

export const arcTestnet = defineChain({
  id: ARC_CHAIN_ID,
  name: 'Arc Testnet',
  nativeCurrency: {
    name: 'USDC',
    symbol: 'USDC',
    decimals: 18
  },
  rpcUrls: {
    default: { http: ARC_RPC_URLS },
    public: { http: ARC_RPC_URLS }
  },
  blockExplorers: {
    default: {
      name: 'ArcScan',
      url: ARC_EXPLORER
    }
  },
  testnet: true
})

export const arcPublicClient = createPublicClient({
  chain: arcTestnet,
  transport: arcTransport
})

export function txUrl(hash: Hex) {
  return `${ARC_EXPLORER.replace(/\/$/, '')}/tx/${hash}`
}

export function addressUrl(address: Address) {
  return `${ARC_EXPLORER.replace(/\/$/, '')}/address/${address}`
}

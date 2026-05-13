import { createPublicClient, defineChain, http, type Address, type Hex } from 'viem'

export const ARC_CHAIN_ID = Number(import.meta.env.VITE_ARC_CHAIN_ID || 5042002)
export const ARC_RPC_URL =
  import.meta.env.VITE_ARC_RPC_URL || 'https://rpc.testnet.arc.network'
export const ARC_EXPLORER =
  import.meta.env.VITE_ARC_EXPLORER || 'https://testnet.arcscan.app'

export const arcTestnet = defineChain({
  id: ARC_CHAIN_ID,
  name: 'Arc Testnet',
  nativeCurrency: {
    name: 'USDC',
    symbol: 'USDC',
    decimals: 6
  },
  rpcUrls: {
    default: { http: [ARC_RPC_URL] },
    public: { http: [ARC_RPC_URL] }
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
  transport: http(ARC_RPC_URL)
})

export function txUrl(hash: Hex) {
  return `${ARC_EXPLORER.replace(/\/$/, '')}/tx/${hash}`
}

export function addressUrl(address: Address) {
  return `${ARC_EXPLORER.replace(/\/$/, '')}/address/${address}`
}

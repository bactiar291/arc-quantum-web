import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Address, Hex } from 'viem'

export type AppTab = 'swap' | 'liquidity' | 'send' | 'deploy'
export type TxKind = 'session' | 'swap' | 'liquidity' | 'send' | 'deploy' | 'approve'
export type TxStatus = 'pending' | 'success' | 'error'

export interface Token {
  address: Address
  name: string
  symbol: string
  decimals: number
  createdAt: number
  txHash?: Hex
}

export interface Transaction {
  id: string
  kind: TxKind
  hash?: Hex
  status: TxStatus
  summary: string
  timestamp: number
  error?: string
}

interface AppState {
  userAddress: Address | null
  isConnected: boolean
  sessionKey: Hex | null
  sessionAddress: Address | null
  smartAccountAddress: Address | null
  sessionExpiry: number
  sessionSignature: Hex | null
  deployedTokens: Token[]
  tokenBalances: Record<string, string>
  pendingTx: Hex | null
  txHistory: Transaction[]
  activeTab: AppTab
  setWallet: (address: Address | null, isConnected: boolean) => void
  setSession: (
    key: Hex | null,
    address: Address | null,
    smartAccountAddress: Address | null,
    expiry: number,
    signature?: Hex | null
  ) => void
  resetSession: () => void
  setActiveTab: (tab: AppTab) => void
  addToken: (token: Token) => void
  removeToken: (address: Address) => void
  setPendingTx: (hash: Hex | null) => void
  addTx: (tx: Transaction) => void
  removeTx: (id: string) => void
  clearTxHistory: () => void
  updateTx: (id: string, patch: Partial<Transaction>) => void
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      userAddress: null,
      isConnected: false,
      sessionKey: null,
      sessionAddress: null,
      smartAccountAddress: null,
      sessionExpiry: 0,
      sessionSignature: null,
      deployedTokens: [],
      tokenBalances: {},
      pendingTx: null,
      txHistory: [],
      activeTab: 'swap',
      setWallet: (address, isConnected) => set({ userAddress: address, isConnected }),
      setSession: (
        sessionKey,
        sessionAddress,
        smartAccountAddress,
        sessionExpiry,
        sessionSignature
      ) =>
        set({
          sessionKey,
          sessionAddress,
          smartAccountAddress,
          sessionExpiry,
          sessionSignature
        }),
      resetSession: () =>
        set({
          sessionKey: null,
          sessionAddress: null,
          smartAccountAddress: null,
          sessionExpiry: 0,
          sessionSignature: null
        }),
      setActiveTab: (activeTab) => set({ activeTab }),
      addToken: (token) =>
        set((state) => {
          const next = state.deployedTokens.filter(
            (item) => item.address.toLowerCase() !== token.address.toLowerCase()
          )
          return { deployedTokens: [token, ...next] }
        }),
      removeToken: (address) =>
        set((state) => ({
          deployedTokens: state.deployedTokens.filter(
            (item) => item.address.toLowerCase() !== address.toLowerCase()
          )
        })),
      setPendingTx: (pendingTx) => set({ pendingTx }),
      addTx: (tx) =>
        set((state) => ({
          txHistory: [tx, ...state.txHistory].slice(0, 30)
        })),
      removeTx: (id) =>
        set((state) => ({
          txHistory: state.txHistory.filter((tx) => tx.id !== id)
        })),
      clearTxHistory: () => set({ txHistory: [] }),
      updateTx: (id, patch) =>
        set((state) => ({
          txHistory: state.txHistory.map((tx) =>
            tx.id === id ? { ...tx, ...patch } : tx
          )
        }))
    }),
    {
      name: 'arc-quantum-lab-store',
      partialize: (state) => ({
        deployedTokens: state.deployedTokens,
        txHistory: state.txHistory,
        activeTab: state.activeTab
      })
    }
  )
)

export function createTx(kind: TxKind, summary: string): Transaction {
  return {
    id: `${kind}-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    kind,
    summary,
    status: 'pending',
    timestamp: Date.now()
  }
}

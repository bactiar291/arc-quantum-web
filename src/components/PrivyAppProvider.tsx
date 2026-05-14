/* eslint-disable react-refresh/only-export-components */
import {
  PrivyProvider,
  useActiveWallet,
  usePrivy,
  useWallets
} from '@privy-io/react-auth'
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode
} from 'react'
import { sepolia } from 'viem/chains'
import { isAddress, type Address, type EIP1193Provider } from 'viem'

import { arcTestnet } from '../lib/arc'
import { PRIVY_APP_ID, PRIVY_CLIENT_ID } from '../lib/env'
import { PRIVY_ACCESS_TOKEN_STORAGE_KEY } from '../polyfills'

type EthereumPrivyWallet = {
  type: 'ethereum'
  address: string
  chainId?: string
  walletClientType: string
  connectorType: string
  meta?: { name?: string }
  getEthereumProvider: () => Promise<EIP1193Provider>
}

interface PrivyBridgeState {
  enabled: boolean
  ready: boolean
  authenticated: boolean
  account: Address | null
  walletLabel: string | null
  userId: string | null
  accessToken: string | null
  serverVerified: boolean | null
  serverAuthError: string | null
  connect: () => Promise<void>
  logout: () => Promise<void>
  getProvider: () => Promise<EIP1193Provider | null>
  refreshAccessToken: () => Promise<string | null>
}

const disabledBridge: PrivyBridgeState = {
  enabled: false,
  ready: true,
  authenticated: false,
  account: null,
  walletLabel: null,
  userId: null,
  accessToken: null,
  serverVerified: null,
  serverAuthError: null,
  connect: async () => undefined,
  logout: async () => undefined,
  getProvider: async () => null,
  refreshAccessToken: async () => null
}

const PrivyBridgeContext = createContext<PrivyBridgeState>(disabledBridge)

function isEthereumWallet(wallet: unknown): wallet is EthereumPrivyWallet {
  if (!wallet || typeof wallet !== 'object') return false
  const candidate = wallet as Partial<EthereumPrivyWallet>
  return (
    candidate.type === 'ethereum' &&
    typeof candidate.address === 'string' &&
    isAddress(candidate.address) &&
    typeof candidate.getEthereumProvider === 'function'
  )
}

function shortUserId(userId: string | null) {
  if (!userId) return null
  return userId.length > 18 ? `${userId.slice(0, 12)}...${userId.slice(-4)}` : userId
}

function PrivyBridge({ children }: { children: ReactNode }) {
  const {
    authenticated,
    connectOrCreateWallet,
    getAccessToken,
    login,
    logout,
    ready,
    user
  } = usePrivy()
  const { ready: walletsReady, wallets } = useWallets()
  const { wallet: activeWallet } = useActiveWallet()
  const [accessToken, setAccessToken] = useState<string | null>(null)
  const [serverVerified, setServerVerified] = useState<boolean | null>(null)
  const [serverAuthError, setServerAuthError] = useState<string | null>(null)

  const ethereumWallet = useMemo(() => {
    if (isEthereumWallet(activeWallet)) return activeWallet
    return wallets.find(isEthereumWallet) ?? null
  }, [activeWallet, wallets])

  const refreshAccessToken = useCallback(async () => {
    if (!authenticated) return null
    const token = await getAccessToken()
    setAccessToken(token)
    if (token) {
      sessionStorage.setItem(PRIVY_ACCESS_TOKEN_STORAGE_KEY, token)
    } else {
      sessionStorage.removeItem(PRIVY_ACCESS_TOKEN_STORAGE_KEY)
    }
    return token
  }, [authenticated, getAccessToken])

  useEffect(() => {
    let alive = true
    if (!ready || !authenticated) {
      setAccessToken(null)
      setServerVerified(null)
      setServerAuthError(null)
      sessionStorage.removeItem(PRIVY_ACCESS_TOKEN_STORAGE_KEY)
      return
    }
    void getAccessToken().then((token) => {
      if (!alive) return
      setAccessToken(token)
      if (token) {
        sessionStorage.setItem(PRIVY_ACCESS_TOKEN_STORAGE_KEY, token)
      } else {
        sessionStorage.removeItem(PRIVY_ACCESS_TOKEN_STORAGE_KEY)
      }
    })
    return () => {
      alive = false
    }
  }, [authenticated, getAccessToken, ready, user?.id])

  useEffect(() => {
    let alive = true
    if (!accessToken) {
      setServerVerified(null)
      setServerAuthError(null)
      return
    }
    void fetch('/api/auth/privy/verify', {
      headers: { authorization: `Bearer ${accessToken}` }
    })
      .then(async (response) => {
        const body = (await response.json().catch(() => ({}))) as { error?: string }
        if (!alive) return
        setServerVerified(response.ok)
        setServerAuthError(response.ok ? null : body.error || 'Privy verify failed')
      })
      .catch((error: unknown) => {
        if (!alive) return
        setServerVerified(false)
        setServerAuthError(error instanceof Error ? error.message : 'Privy verify failed')
      })
    return () => {
      alive = false
    }
  }, [accessToken])

  const connect = useCallback(async () => {
    if (!ready) return
    if (!authenticated) {
      login({
        loginMethods: ['email', 'wallet', 'google', 'twitter', 'discord']
      })
      return
    }
    if (!ethereumWallet) connectOrCreateWallet()
  }, [authenticated, connectOrCreateWallet, ethereumWallet, login, ready])

  const getProvider = useCallback(async () => {
    if (!ethereumWallet) return null
    return (await ethereumWallet.getEthereumProvider()) as unknown as EIP1193Provider
  }, [ethereumWallet])

  const value = useMemo<PrivyBridgeState>(
    () => ({
      enabled: true,
      ready: ready && walletsReady,
      authenticated,
      account: ethereumWallet?.address && isAddress(ethereumWallet.address)
        ? ethereumWallet.address
        : null,
      walletLabel:
        ethereumWallet?.meta?.name ??
        ethereumWallet?.walletClientType ??
        shortUserId(user?.id ?? null),
      userId: user?.id ?? null,
      accessToken,
      serverVerified,
      serverAuthError,
      connect,
      logout,
      getProvider,
      refreshAccessToken
    }),
    [
      accessToken,
      authenticated,
      connect,
      ethereumWallet,
      getProvider,
      logout,
      ready,
      refreshAccessToken,
      serverAuthError,
      serverVerified,
      user?.id,
      walletsReady
    ]
  )

  return <PrivyBridgeContext.Provider value={value}>{children}</PrivyBridgeContext.Provider>
}

export function PrivyAppProvider({ children }: { children: ReactNode }) {
  if (!PRIVY_APP_ID) {
    return <PrivyBridgeContext.Provider value={disabledBridge}>{children}</PrivyBridgeContext.Provider>
  }

  return (
    <PrivyProvider
      appId={PRIVY_APP_ID}
      clientId={PRIVY_CLIENT_ID || undefined}
      config={{
        appearance: {
          theme: '#0f1428',
          accentColor: '#00d8ff',
          landingHeader: 'Arc Quantum Lab',
          loginMessage: 'Email, Google, X, Discord, or wallet login.',
          showWalletLoginFirst: false,
          walletList: [
            'rabby_wallet',
            'detected_ethereum_wallets',
            'metamask',
            'coinbase_wallet',
            'rainbow',
            'wallet_connect'
          ]
        },
        captchaEnabled: true,
        defaultChain: arcTestnet,
        embeddedWallets: {
          ethereum: {
            createOnLogin: 'users-without-wallets'
          }
        },
        loginMethods: ['email', 'wallet', 'google', 'twitter', 'discord'],
        supportedChains: [arcTestnet, sepolia]
      }}
    >
      <PrivyBridge>{children}</PrivyBridge>
    </PrivyProvider>
  )
}

export function usePrivyBridge() {
  return useContext(PrivyBridgeContext)
}

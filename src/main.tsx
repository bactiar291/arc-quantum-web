import '@rainbow-me/rainbowkit/styles.css'
import './styles/globals.css'

import { RainbowKitProvider, getDefaultConfig } from '@rainbow-me/rainbowkit'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { WagmiProvider } from 'wagmi'

import App from './App'
import { arcTestnet, arcTransport } from './lib/arc'

const queryClient = new QueryClient()

const config = getDefaultConfig({
  appName: 'Arc Quantum Lab',
  projectId:
    import.meta.env.VITE_WALLETCONNECT_PROJECT_ID || 'arc-quantum-lab-local',
  chains: [arcTestnet],
  transports: {
    [arcTestnet.id]: arcTransport
  },
  ssr: false
})

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider modalSize="compact">
          <BrowserRouter>
            <App />
          </BrowserRouter>
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  </React.StrictMode>
)

import './polyfills'
import './styles/globals.css'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { createConfig, WagmiProvider } from 'wagmi'
import { injected } from 'wagmi/connectors'
import { sepolia } from 'wagmi/chains'

import App from './App'
import { arcTestnet, arcTransport, sepoliaTransport } from './lib/arc'

const queryClient = new QueryClient()

const config = createConfig({
  chains: [arcTestnet, sepolia],
  connectors: [injected()],
  transports: {
    [arcTestnet.id]: arcTransport,
    [sepolia.id]: sepoliaTransport
  }
})

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </QueryClientProvider>
    </WagmiProvider>
  </React.StrictMode>
)

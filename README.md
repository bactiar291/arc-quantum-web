# Arc Quantum Lab

Bright neo-brutalist Arc Testnet web app for Circle AppKit flows:
swap, bridge, send, and random ERC20 deploy.

## Commands

```bash
npm install
npm run dev
npm run lint
npm run build
```

## Env

Use public Arc RPC by default. Keep secret keys server-side only.

```env
VITE_ARC_RPC_URL=https://rpc.testnet.arc.network
VITE_ARC_FALLBACK_RPC_URL=https://rpc.testnet.arc.network
VITE_ARC_CHAIN_ID=5042002
VITE_ARC_EXPLORER=https://testnet.arcscan.app
VITE_SEPOLIA_RPC_URL=https://ethereum-sepolia-rpc.publicnode.com
VITE_ARC_USDC_ADDRESS=0x3600000000000000000000000000000000000000
VITE_ARC_EURC_ADDRESS=0x89B50855Aa3bE2F677cD6303Cec089B5F319D72a
VITE_SEPOLIA_USDC_ADDRESS=0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238

CIRCLE_KIT_KEY=KIT_KEY:YOUR_ID:YOUR_SECRET
```

## Execution Model

The app uses the connected EVM wallet as signer. Wallet popups are expected
for swap, bridge, send, and deploy.

## Default Tokens

- Arc native gas: USDC
- Arc USDC ERC20: `0x3600000000000000000000000000000000000000`
- Arc EURC ERC20: `0x89B50855Aa3bE2F677cD6303Cec089B5F319D72a`
- Sepolia USDC: `0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238`

Circle official Swap on Arc Testnet supports only its supported stable assets.
New random ERC20 deploys can be sent from the wallet after deploy, but need an
AMM/router/liquidity path before they can be swapped.

## Deploy

Vercel config is included in `vercel.json`.

Do not commit tokens, kit keys, private keys, cookies, or RPC secrets.

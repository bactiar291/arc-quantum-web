# Arc Quantum Lab

Neo-brutalist Arc Testnet DApp for session-wallet execution:
swap, liquidity, token send, random batch send, and ERC20 deploy.

## Commands

```bash
npm install
npm run dev
npm run lint
npm run build
```

## Env

Copy `.env.example` to `.env.local` and fill router/factory after contract deploy.

```env
VITE_ARC_RPC_URL=https://rpc.testnet.arc.network
VITE_ARC_CHAIN_ID=5042002
VITE_ARC_EXPLORER=https://testnet.arcscan.app
VITE_QUANTUM_ROUTER_ADDRESS=
VITE_QUANTUM_FACTORY_ADDRESS=
```

## Session Model

The app creates an ephemeral EOA session key after one EIP-712 typed
signature. That EOA signs later transactions automatically from the browser.

Important: plain EOAs cannot delegate universal signing authority on-chain.
The session wallet must hold Arc Testnet gas and token balances/allowances.
Use testnet funds only.

## Contracts

Contracts live in `contracts/src`:

- `QuantumToken.sol`: ERC20 template used by UI deploy.
- `QuantumFactory.sol`: pair factory.
- `QuantumPair.sol`: two-token constant-product AMM pair.
- `QuantumRouter.sol`: add liquidity and two-token swap router.

Compile:

```bash
/root/.solcx/solc-v0.8.27 --optimize --bin --abi \
  -o contracts/build --overwrite \
  contracts/src/QuantumToken.sol \
  contracts/src/QuantumFactory.sol \
  contracts/src/QuantumRouter.sol
```

## Deploy

Vercel config is included in `vercel.json`.

Do not put tokens in git, shell history, or frontend env. Use Vercel/GitHub
dashboard login or short-lived CI secrets.

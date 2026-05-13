# Arc Quantum Lab

Neo-brutalist Arc Testnet DApp for smart-session execution:
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

The app deploys a `SmartSessionAccount` owned by the connected wallet, then
enables an ephemeral session key on-chain. The session key executes calls
through the smart account without repeated MetaMask popups.

Assets for swap/send/deploy sit in the smart account. The connected EOA stays
owner and can revoke the session. The session key still needs enough native gas
to submit transactions to the smart account because this app has no backend
relayer/paymaster. Use testnet funds only.

## Contracts

Contracts live in `contracts/src`:

- `QuantumToken.sol`: ERC20 template used by UI deploy.
- `QuantumFactory.sol`: pair factory.
- `QuantumPair.sol`: two-token constant-product AMM pair.
- `QuantumRouter.sol`: add liquidity and two-token swap router.
- `SmartSessionAccount.sol`: owner-controlled smart account with expiring
  session keys and contract deployment.

Compile:

```bash
/root/.solcx/solc-v0.8.27 --optimize --bin --abi \
  -o contracts/build --overwrite \
  contracts/src/QuantumToken.sol \
  contracts/src/QuantumFactory.sol \
  contracts/src/QuantumRouter.sol \
  contracts/src/SmartSessionAccount.sol
```

## Deploy

Vercel config is included in `vercel.json`.

Do not put tokens in git, shell history, or frontend env. Use Vercel/GitHub
dashboard login or short-lived CI secrets.

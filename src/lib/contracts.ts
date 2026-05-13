import { isAddress, type Address } from 'viem'

const optionalAddress = (value: string | undefined): Address | undefined => {
  if (!value || !isAddress(value)) return undefined
  return value
}

export const envQuantumRouterAddress = optionalAddress(
  import.meta.env.VITE_QUANTUM_ROUTER_ADDRESS
)

export const envQuantumFactoryAddress = optionalAddress(
  import.meta.env.VITE_QUANTUM_FACTORY_ADDRESS
)

export const quantumRouterAddress = envQuantumRouterAddress
export const quantumFactoryAddress = envQuantumFactoryAddress

export const maxUint256 = (1n << 256n) - 1n

export const erc20Abi = [
  {
    type: 'function',
    name: 'name',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ type: 'string' }]
  },
  {
    type: 'function',
    name: 'symbol',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ type: 'string' }]
  },
  {
    type: 'function',
    name: 'decimals',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ type: 'uint8' }]
  },
  {
    type: 'function',
    name: 'balanceOf',
    stateMutability: 'view',
    inputs: [{ name: 'account', type: 'address' }],
    outputs: [{ type: 'uint256' }]
  },
  {
    type: 'function',
    name: 'approve',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'spender', type: 'address' },
      { name: 'amount', type: 'uint256' }
    ],
    outputs: [{ type: 'bool' }]
  },
  {
    type: 'function',
    name: 'transfer',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'to', type: 'address' },
      { name: 'amount', type: 'uint256' }
    ],
    outputs: [{ type: 'bool' }]
  }
] as const

export const quantumTokenAbi = [
  {
    type: 'constructor',
    inputs: [
      { name: 'name_', type: 'string' },
      { name: 'symbol_', type: 'string' },
      { name: 'supply_', type: 'uint256' },
      { name: 'decimals_', type: 'uint8' }
    ],
    stateMutability: 'nonpayable'
  },
  ...erc20Abi,
  {
    type: 'function',
    name: 'totalSupply',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ type: 'uint256' }]
  }
] as const

export const quantumRouterAbi = [
  {
    type: 'constructor',
    stateMutability: 'nonpayable',
    inputs: [{ name: 'factory_', type: 'address' }]
  },
  {
    type: 'function',
    name: 'factory',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ type: 'address' }]
  },
  {
    type: 'function',
    name: 'getAmountsOut',
    stateMutability: 'view',
    inputs: [
      { name: 'amountIn', type: 'uint256' },
      { name: 'path', type: 'address[]' }
    ],
    outputs: [{ name: 'amounts', type: 'uint256[]' }]
  },
  {
    type: 'function',
    name: 'swapExactTokensForTokens',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'amountIn', type: 'uint256' },
      { name: 'amountOutMin', type: 'uint256' },
      { name: 'path', type: 'address[]' },
      { name: 'to', type: 'address' },
      { name: 'deadline', type: 'uint256' }
    ],
    outputs: [{ name: 'amounts', type: 'uint256[]' }]
  },
  {
    type: 'function',
    name: 'addLiquidity',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'tokenA', type: 'address' },
      { name: 'tokenB', type: 'address' },
      { name: 'amountADesired', type: 'uint256' },
      { name: 'amountBDesired', type: 'uint256' },
      { name: 'to', type: 'address' },
      { name: 'deadline', type: 'uint256' }
    ],
    outputs: [
      { name: 'amountA', type: 'uint256' },
      { name: 'amountB', type: 'uint256' },
      { name: 'liquidity', type: 'uint256' }
    ]
  }
] as const

export const quantumFactoryAbi = [
  {
    type: 'function',
    name: 'getPair',
    stateMutability: 'view',
    inputs: [
      { name: 'tokenA', type: 'address' },
      { name: 'tokenB', type: 'address' }
    ],
    outputs: [{ type: 'address' }]
  },
  {
    type: 'function',
    name: 'createPair',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'tokenA', type: 'address' },
      { name: 'tokenB', type: 'address' }
    ],
    outputs: [{ name: 'pair', type: 'address' }]
  }
] as const

export const smartSessionAccountAbi = [
  {
    type: 'constructor',
    stateMutability: 'payable',
    inputs: [{ name: 'owner_', type: 'address' }]
  },
  {
    type: 'event',
    name: 'SessionEnabled',
    inputs: [
      { name: 'key', type: 'address', indexed: true },
      { name: 'expiresAt', type: 'uint64', indexed: false }
    ],
    anonymous: false
  },
  {
    type: 'event',
    name: 'SessionRevoked',
    inputs: [{ name: 'key', type: 'address', indexed: true }],
    anonymous: false
  },
  {
    type: 'event',
    name: 'ContractDeployed',
    inputs: [
      { name: 'deployed', type: 'address', indexed: true },
      { name: 'value', type: 'uint256', indexed: false }
    ],
    anonymous: false
  },
  {
    type: 'function',
    name: 'owner',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ type: 'address' }]
  },
  {
    type: 'function',
    name: 'nonce',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ type: 'uint256' }]
  },
  {
    type: 'function',
    name: 'enableSession',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'key', type: 'address' },
      { name: 'expiresAt', type: 'uint64' }
    ],
    outputs: []
  },
  {
    type: 'function',
    name: 'revokeSession',
    stateMutability: 'nonpayable',
    inputs: [{ name: 'key', type: 'address' }],
    outputs: []
  },
  {
    type: 'function',
    name: 'isSessionActive',
    stateMutability: 'view',
    inputs: [{ name: 'key', type: 'address' }],
    outputs: [{ type: 'bool' }]
  },
  {
    type: 'function',
    name: 'execute',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'to', type: 'address' },
      { name: 'value', type: 'uint256' },
      { name: 'data', type: 'bytes' }
    ],
    outputs: [{ name: 'result', type: 'bytes' }]
  },
  {
    type: 'function',
    name: 'executeBatch',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'targets', type: 'address[]' },
      { name: 'values', type: 'uint256[]' },
      { name: 'payloads', type: 'bytes[]' }
    ],
    outputs: [{ name: 'results', type: 'bytes[]' }]
  },
  {
    type: 'function',
    name: 'deploy',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'initCode', type: 'bytes' },
      { name: 'value', type: 'uint256' }
    ],
    outputs: [{ name: 'deployed', type: 'address' }]
  }
] as const

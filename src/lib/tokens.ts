import { isAddress, type Address } from 'viem'

import type { Token } from '../store/useAppStore'

export const USDC_TOKEN: Token = {
  address: '0x3600000000000000000000000000000000000000',
  name: 'USDC',
  symbol: 'USDC',
  decimals: 6,
  createdAt: 0
}

export const EURC_TOKEN: Token = {
  address: '0x89B50855Aa3bE2F677cD6303Cec089B5F319D72a',
  name: 'EURC',
  symbol: 'EURC',
  decimals: 6,
  createdAt: 0
}

export const DEFAULT_TOKENS = [USDC_TOKEN, EURC_TOKEN] satisfies Token[]

export const DEFAULT_TOKEN_ADDRESSES = new Set(
  DEFAULT_TOKENS.map((token) => token.address.toLowerCase())
)

export function mergeTokens(tokens: Token[]) {
  const merged = [...DEFAULT_TOKENS]
  for (const token of tokens) {
    if (
      merged.some(
        (item) => item.address.toLowerCase() === token.address.toLowerCase()
      )
    ) {
      continue
    }
    merged.push(token)
  }
  return merged
}

export function findToken(tokens: Token[], address: Address | '') {
  if (!address || !isAddress(address)) return undefined
  return tokens.find((token) => token.address.toLowerCase() === address.toLowerCase())
}

import { isAddress, type Address } from 'viem'

import type { Token } from '../store/useAppStore'

export function findToken(tokens: Token[], address: Address | '') {
  if (!address || !isAddress(address)) return undefined
  return tokens.find((token) => token.address.toLowerCase() === address.toLowerCase())
}

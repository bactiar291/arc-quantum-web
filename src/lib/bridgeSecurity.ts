import type { Address } from 'viem'

export const CIRCLE_CCTP_TESTNET = {
  bridge: '0xC5567a5E3370d4DBfB0540025078e283e36A363d',
  adapter: '0xBBD70b01a1CAbc96d5b7b129Ae1AAabdf50dd40b',
  sepoliaUsdc: '0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238',
  sepoliaTokenMessengerV2: '0x8fe6b999dc680ccfdd5bf7eb0974218be2542daa',
  sepoliaMessageTransmitterV2: '0xe737e5cebeeba77efe34d4aa090756590b1ce275',
  arcUsdc: '0x3600000000000000000000000000000000000000',
  arcTokenMessengerV2: '0x8FE6B999Dc680CcFDD5Bf7EB0974218be2542DAA',
  arcMessageTransmitterV2: '0xE737e5cEBEEBa77EFE34D4aa090756590b1CE275'
} as const satisfies Record<string, Address>

export const CCTP_SAFE_BRIDGE_NOTE =
  'Official Circle CCTP v2 standard mode. No forwarder, no batch, exact approval only.'


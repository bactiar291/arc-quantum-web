export const CIRCLE_KIT_KEY = import.meta.env.VITE_CIRCLE_KIT_KEY || ''
export const ZERODEV_PROJECT_ID = import.meta.env.VITE_ZERODEV_PROJECT_ID || ''
export const ZERODEV_PASSKEY_SERVER_URL =
  import.meta.env.VITE_ZERODEV_PASSKEY_SERVER_URL || ''
export const ZERODEV_RPC_URL = import.meta.env.VITE_ZERODEV_RPC_URL || ''
export const ARC_USDC_ADDRESS = import.meta.env.VITE_ARC_USDC_ADDRESS || ''
export const ARC_EURC_ADDRESS = import.meta.env.VITE_ARC_EURC_ADDRESS || ''
export const SEPOLIA_USDC_ADDRESS = import.meta.env.VITE_SEPOLIA_USDC_ADDRESS || ''

export function redact(value: string) {
  if (!value) return 'NOT SET'
  if (value.length <= 14) return `${value.slice(0, 4)}...`
  return `${value.slice(0, 10)}...${value.slice(-6)}`
}

export const envStatus = {
  circleKit: Boolean(CIRCLE_KIT_KEY),
  zeroDevProject: Boolean(ZERODEV_PROJECT_ID),
  zeroDevPasskey: Boolean(ZERODEV_PASSKEY_SERVER_URL),
  zeroDevRpc: Boolean(ZERODEV_RPC_URL)
}

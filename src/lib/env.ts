export const CIRCLE_KIT_KEY = 'KIT_KEY:browser:proxy'
export const ARC_USDC_ADDRESS = import.meta.env.VITE_ARC_USDC_ADDRESS || ''
export const ARC_EURC_ADDRESS = import.meta.env.VITE_ARC_EURC_ADDRESS || ''
export const SEPOLIA_USDC_ADDRESS = import.meta.env.VITE_SEPOLIA_USDC_ADDRESS || ''
export const ZERODEV_READY = import.meta.env.VITE_ZERODEV_READY === 'true'

export const envStatus = {
  circleKit: true,
  zeroDevProject: ZERODEV_READY,
  zeroDevPasskey: ZERODEV_READY,
  zeroDevRpc: ZERODEV_READY
}

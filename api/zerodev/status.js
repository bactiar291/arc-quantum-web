/* global process */

export default function handler(_request, response) {
  response.setHeader('cache-control', 'no-store')
  response.status(200).json({
    ready: Boolean(process.env.ZERODEV_RPC_URL || process.env.VITE_ZERODEV_RPC_URL)
  })
}

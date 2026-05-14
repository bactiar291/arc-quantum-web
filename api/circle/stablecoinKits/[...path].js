/* global URL, fetch, process */

import { PrivyClient } from '@privy-io/node'

import { applyRateLimit } from '../../_rateLimit.js'

const TARGET = 'https://api.circle.com/v1/stablecoinKits'
const PREFIX = '/api/circle/stablecoinKits/'
let privyClient

function getPrivyClient() {
  const appId = process.env.PRIVY_APP_ID || process.env.VITE_PRIVY_APP_ID
  const appSecret = process.env.PRIVY_APP_SECRET
  if (!appId || !appSecret) {
    throw new Error('Privy server env missing.')
  }
  if (!privyClient) {
    privyClient = new PrivyClient({ appId, appSecret })
  }
  return privyClient
}

export default async function handler(request, response) {
  response.setHeader('cache-control', 'no-store')
  if (applyRateLimit(request, response)) return

  const authHeader = Array.isArray(request.headers.authorization)
    ? request.headers.authorization[0]
    : request.headers.authorization
  const privyToken = authHeader?.replace(/^Bearer\s+/i, '')

  if (!privyToken) {
    response.status(401).json({ error: 'Unauthorized' })
    return
  }

  try {
    await getPrivyClient().utils().auth().verifyAccessToken(privyToken)
  } catch {
    response.status(401).json({ error: 'Invalid auth token' })
    return
  }

  const incomingUrl = new URL(request.url, `https://${request.headers.host || 'localhost'}`)
  const path = incomingUrl.pathname.startsWith(PREFIX)
    ? incomingUrl.pathname.slice(PREFIX.length)
    : ''

  if (!/^(quote|swap)(\/|$)/.test(path)) {
    response.status(404).json({ error: 'Unsupported Circle route' })
    return
  }

  const targetUrl = new URL(`${TARGET}/${path}`)
  for (const [key, value] of incomingUrl.searchParams.entries()) {
    targetUrl.searchParams.append(key, value)
  }

  const kitKey = process.env.CIRCLE_KIT_KEY
  if (!kitKey) {
    response.status(503).json({ error: 'Service unavailable' })
    return
  }

  const headers = {
    'content-type': request.headers['content-type'] || 'application/json',
    authorization: `Bearer ${kitKey}`
  }

  try {
    const body =
      request.body && typeof request.body === 'object'
        ? JSON.stringify(request.body)
        : request.body

    const circleResponse = await fetch(targetUrl, {
      method: request.method,
      headers,
      body: ['GET', 'HEAD'].includes(request.method) ? undefined : body
    })

    const text = await circleResponse.text()
    response
      .status(circleResponse.status)
      .setHeader('content-type', circleResponse.headers.get('content-type') || 'application/json')
      .send(text)
  } catch {
    response.status(502).json({ error: 'Circle Stablecoin proxy fetch failed' })
  }
}

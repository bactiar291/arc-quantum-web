/* global process */

import { PrivyClient } from '@privy-io/node'

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
  if (!['GET', 'POST'].includes(request.method)) {
    response.setHeader('allow', 'GET, POST')
    response.status(405).json({ ok: false, error: 'Method not allowed' })
    return
  }

  const header = Array.isArray(request.headers.authorization)
    ? request.headers.authorization[0]
    : request.headers.authorization
  const token = header?.replace(/^Bearer\s+/i, '')

  if (!token) {
    response.status(401).json({ ok: false, error: 'Missing bearer token' })
    return
  }

  try {
    const claims = await getPrivyClient().utils().auth().verifyAccessToken(token)
    response.setHeader('cache-control', 'no-store')
    response.status(200).json({
      ok: true,
      claims: {
        appId: claims.app_id,
        userId: claims.user_id,
        sessionId: claims.session_id,
        issuedAt: claims.issued_at,
        expiration: claims.expiration,
        issuer: claims.issuer
      }
    })
  } catch (error) {
    response.status(401).json({
      ok: false,
      error: error instanceof Error ? error.message : 'Privy token invalid'
    })
  }
}

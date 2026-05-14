/* global URL, fetch, process */

const TARGET = 'https://api.circle.com/v1/stablecoinKits'
const PREFIX = '/api/circle/stablecoinKits/'

export default async function handler(request, response) {
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

  const kitKey =
    process.env.CIRCLE_KIT_KEY ||
    process.env.VITE_CIRCLE_KIT_KEY ||
    request.headers.authorization?.replace(/^Bearer\s+/i, '') ||
    ''

  const headers = {
    'content-type': request.headers['content-type'] || 'application/json',
    authorization: kitKey ? `Bearer ${kitKey}` : ''
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
      .setHeader('cache-control', 'no-store')
      .setHeader('content-type', circleResponse.headers.get('content-type') || 'application/json')
      .send(text)
  } catch {
    response.status(502).json({ error: 'Circle Stablecoin proxy fetch failed' })
  }
}

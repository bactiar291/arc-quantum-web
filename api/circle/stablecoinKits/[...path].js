/* global URL, fetch */

const TARGET = 'https://api.circle.com/v1/stablecoinKits'

export default async function handler(request, response) {
  const path = Array.isArray(request.query.path)
    ? request.query.path.join('/')
    : request.query.path || ''

  if (!/^(quote|swap|status)(\/|$)/.test(path)) {
    response.status(404).json({ error: 'Unsupported Circle route' })
    return
  }

  const targetUrl = new URL(`${TARGET}/${path}`)
  for (const [key, value] of Object.entries(request.query)) {
    if (key === 'path') continue
    if (Array.isArray(value)) {
      value.forEach((item) => targetUrl.searchParams.append(key, item))
    } else if (value !== undefined) {
      targetUrl.searchParams.set(key, value)
    }
  }

  const headers = {
    'content-type': request.headers['content-type'] || 'application/json',
    authorization: request.headers.authorization || ''
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

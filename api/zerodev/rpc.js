/* global process, fetch */

async function readBody(request) {
  if (request.body) {
    return typeof request.body === 'string' ? request.body : JSON.stringify(request.body)
  }

  return new Promise((resolve, reject) => {
    let body = ''
    request.on('data', (chunk) => {
      body += chunk
    })
    request.on('end', () => resolve(body))
    request.on('error', reject)
  })
}

export default async function handler(request, response) {
  if (request.method !== 'POST') {
    response.setHeader('allow', 'POST')
    return response.status(405).json({ error: 'Method not allowed' })
  }

  const target = process.env.ZERODEV_RPC_URL || process.env.VITE_ZERODEV_RPC_URL
  if (!target) {
    return response.status(500).json({ error: 'ZERODEV_RPC_URL is not configured' })
  }

  const upstream = await fetch(target, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: await readBody(request)
  })

  const text = await upstream.text()
  response.status(upstream.status)
  response.setHeader('content-type', upstream.headers.get('content-type') || 'application/json')
  response.send(text)
}

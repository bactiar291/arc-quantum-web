const WINDOW_MS = 60_000
const MAX_REQUESTS = 30

const store = new Map<string, { count: number; reset: number }>()

export default function middleware(request: Request) {
  const url = new URL(request.url)
  if (!url.pathname.startsWith('/api/')) return undefined

  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown'
  const now = Date.now()
  const entry = store.get(ip)

  if (!entry || now > entry.reset) {
    store.set(ip, { count: 1, reset: now + WINDOW_MS })
    return undefined
  }

  if (entry.count >= MAX_REQUESTS) {
    return new Response('Too Many Requests', {
      status: 429,
      headers: {
        'Retry-After': String(Math.ceil((entry.reset - now) / 1000)),
        'X-RateLimit-Limit': String(MAX_REQUESTS),
        'X-RateLimit-Remaining': '0'
      }
    })
  }

  entry.count += 1
  return undefined
}

export const config = {
  matcher: '/api/:path*'
}

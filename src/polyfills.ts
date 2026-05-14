import { Buffer } from 'buffer'
import process from 'process'

const runtime = globalThis as typeof globalThis & {
  Buffer?: typeof Buffer
  global?: typeof globalThis
  process?: typeof process
}

runtime.Buffer ??= Buffer
runtime.global ??= globalThis
runtime.process ??= process

const nativeFetch = globalThis.fetch?.bind(globalThis)
export const PRIVY_ACCESS_TOKEN_STORAGE_KEY = 'arc_quantum_privy_access_token'

function readPrivyAccessToken() {
  try {
    return sessionStorage.getItem(PRIVY_ACCESS_TOKEN_STORAGE_KEY)
  } catch {
    return null
  }
}

if (nativeFetch) {
  globalThis.fetch = ((input: RequestInfo | URL, init?: RequestInit) => {
    const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url
    if (url.startsWith('https://api.circle.com/v1/stablecoinKits/logs')) {
      return Promise.resolve(new Response(null, { status: 204, statusText: 'No Content' }))
    }
    if (url.startsWith('https://api.circle.com/v1/stablecoinKits/')) {
      const nextUrl = url.replace(
        'https://api.circle.com/v1/stablecoinKits/',
        '/api/circle/stablecoinKits/'
      )
      const headers = new Headers(
        init?.headers ?? (input instanceof Request ? input.headers : undefined)
      )
      const privyToken = readPrivyAccessToken()
      if (privyToken) {
        headers.set('authorization', `Bearer ${privyToken}`)
      } else {
        headers.delete('authorization')
      }
      const nextInput = input instanceof Request ? new Request(nextUrl, input) : nextUrl
      return nativeFetch(nextInput, { ...init, headers })
    }
    return nativeFetch(input, init)
  }) as typeof fetch
}

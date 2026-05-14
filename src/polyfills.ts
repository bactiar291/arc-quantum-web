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

if (nativeFetch) {
  globalThis.fetch = ((input: RequestInfo | URL, init?: RequestInit) => {
    const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url
    if (url.startsWith('https://api.circle.com/v1/stablecoinKits/')) {
      const nextUrl = url.replace(
        'https://api.circle.com/v1/stablecoinKits/',
        '/api/circle/stablecoinKits/'
      )
      const nextInput = input instanceof Request ? new Request(nextUrl, input) : nextUrl
      return nativeFetch(nextInput, init)
    }
    return nativeFetch(input, init)
  }) as typeof fetch
}

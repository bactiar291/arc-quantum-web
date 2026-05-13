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

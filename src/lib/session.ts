import type { Address, Hex } from 'viem'

const storageKey = 'arc_quantum_session_v1'
const textEncoder = new TextEncoder()
const textDecoder = new TextDecoder()

export interface StoredSession {
  owner: Address
  sessionAddress: Address
  smartAccountAddress: Address
  encryptedKey: string
  expiresAt: number
  signature: Hex | null
  createdAt: number
}

interface CipherPayload {
  iv: string
  data: string
}

function bytesToBase64(bytes: Uint8Array) {
  let binary = ''
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte)
  })
  return btoa(binary)
}

function base64ToBytes(value: string) {
  const binary = atob(value)
  const bytes = new Uint8Array(binary.length)
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index)
  }
  return bytes
}

async function cryptoKey(owner: Address) {
  const material = `${window.location.origin}:ArcQuantumLab:${owner.toLowerCase()}`
  const digest = await crypto.subtle.digest('SHA-256', textEncoder.encode(material))
  return crypto.subtle.importKey('raw', digest, 'AES-GCM', false, [
    'encrypt',
    'decrypt'
  ])
}

export async function encryptSessionKey(privateKey: Hex, owner: Address) {
  const iv = crypto.getRandomValues(new Uint8Array(12))
  const key = await cryptoKey(owner)
  const encrypted = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    textEncoder.encode(privateKey)
  )
  const payload: CipherPayload = {
    iv: bytesToBase64(iv),
    data: bytesToBase64(new Uint8Array(encrypted))
  }
  return JSON.stringify(payload)
}

export async function decryptSessionKey(payload: string, owner: Address) {
  const parsed = JSON.parse(payload) as CipherPayload
  const key = await cryptoKey(owner)
  const decrypted = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: base64ToBytes(parsed.iv) },
    key,
    base64ToBytes(parsed.data)
  )
  return textDecoder.decode(decrypted) as Hex
}

export function saveStoredSession(session: StoredSession) {
  localStorage.setItem(storageKey, JSON.stringify(session))
}

export function readStoredSession() {
  const raw = localStorage.getItem(storageKey)
  if (!raw) return null
  try {
    return JSON.parse(raw) as StoredSession
  } catch {
    localStorage.removeItem(storageKey)
    return null
  }
}

export function clearStoredSession() {
  localStorage.removeItem(storageKey)
}

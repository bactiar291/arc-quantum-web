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

type StoredSessions = Record<string, StoredSession>

function isStoredSession(value: unknown): value is StoredSession {
  return (
    typeof value === 'object' &&
    value !== null &&
    'owner' in value &&
    typeof value.owner === 'string' &&
    'sessionAddress' in value
  )
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

function readStoredSessions(): StoredSessions {
  const raw = localStorage.getItem(storageKey)
  if (!raw) return {}
  try {
    const parsed = JSON.parse(raw) as unknown
    if (isStoredSession(parsed)) {
      return { [parsed.owner.toLowerCase()]: parsed }
    }
    return parsed as StoredSessions
  } catch {
    localStorage.removeItem(storageKey)
    return {}
  }
}

export function saveStoredSession(session: StoredSession) {
  const sessions = readStoredSessions()
  sessions[session.owner.toLowerCase()] = session
  localStorage.setItem(storageKey, JSON.stringify(sessions))
}

export function readStoredSession(owner: Address) {
  return readStoredSessions()[owner.toLowerCase()] ?? null
}

export function clearStoredSession(owner?: Address) {
  if (!owner) {
    localStorage.removeItem(storageKey)
    return
  }
  const sessions = readStoredSessions()
  delete sessions[owner.toLowerCase()]
  localStorage.setItem(storageKey, JSON.stringify(sessions))
}

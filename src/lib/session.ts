import type { Address, Hex } from 'viem'

const storageKey = 'arc_quantum_session_v1'
const sessionKeyPrefix = 'arc_quantum_session_key_'
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
  salt: string
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

function sessionStorageKey(owner: Address) {
  return `${sessionKeyPrefix}${owner.toLowerCase()}`
}

async function cryptoKey(owner: Address, salt: Uint8Array) {
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    textEncoder.encode(`ArcQuantumLab:${owner.toLowerCase()}`),
    'HKDF',
    false,
    ['deriveKey']
  )
  return crypto.subtle.deriveKey(
    {
      name: 'HKDF',
      hash: 'SHA-256',
      salt,
      info: textEncoder.encode('session-key-v2')
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  )
}

export async function encryptSessionKey(privateKey: Hex, owner: Address) {
  const iv = crypto.getRandomValues(new Uint8Array(12))
  const salt = crypto.getRandomValues(new Uint8Array(16))
  const key = await cryptoKey(owner, salt)
  const encrypted = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    textEncoder.encode(privateKey)
  )
  const payload: CipherPayload = {
    iv: bytesToBase64(iv),
    salt: bytesToBase64(salt),
    data: bytesToBase64(new Uint8Array(encrypted))
  }
  return JSON.stringify(payload)
}

export async function decryptSessionKey(payload: string, owner: Address) {
  const parsed = JSON.parse(payload) as CipherPayload
  if (!parsed.salt) {
    clearStoredSession(owner)
    throw new Error('Session expired, please re-initialize')
  }
  const key = await cryptoKey(owner, base64ToBytes(parsed.salt))
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
  sessionStorage.setItem(sessionStorageKey(session.owner), session.encryptedKey)
  sessions[session.owner.toLowerCase()] = {
    ...session,
    encryptedKey: '__session_storage__'
  }
  localStorage.setItem(storageKey, JSON.stringify(sessions))
}

export function readStoredSession(owner: Address) {
  const stored = readStoredSessions()[owner.toLowerCase()]
  if (!stored) return null
  if (stored.encryptedKey !== '__session_storage__') return stored
  const encryptedKey = sessionStorage.getItem(sessionStorageKey(owner))
  if (!encryptedKey) {
    clearStoredSession(owner)
    return null
  }
  return { ...stored, encryptedKey }
}

export function clearStoredSession(owner?: Address) {
  if (!owner) {
    const sessions = readStoredSessions()
    Object.values(sessions).forEach((session) => {
      sessionStorage.removeItem(sessionStorageKey(session.owner))
    })
    for (let index = sessionStorage.length - 1; index >= 0; index -= 1) {
      const key = sessionStorage.key(index)
      if (key?.startsWith(sessionKeyPrefix)) sessionStorage.removeItem(key)
    }
    localStorage.removeItem(storageKey)
    return
  }
  const sessions = readStoredSessions()
  sessionStorage.removeItem(sessionStorageKey(owner))
  delete sessions[owner.toLowerCase()]
  localStorage.setItem(storageKey, JSON.stringify(sessions))
}

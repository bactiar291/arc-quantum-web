import {
  Activity,
  Boxes,
  Radio,
  Rocket,
  Send,
  Shuffle,
  Waves,
  type LucideIcon
} from 'lucide-react'
import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react'
import * as THREE from 'three'

import { useAppStore, type Transaction } from '../store/useAppStore'
import { Panel } from './ui/Panel'

export type ReactorTab = 'swap' | 'send' | 'faucet' | 'deploy'
type ReactorStatus = 'idle' | 'pending' | 'success' | 'error'

interface ModeConfig {
  title: string
  label: string
  icon: LucideIcon
  colors: [string, string, string]
  pulse: string
  telemetry: [string, string, string, string]
}

const modeConfig: Record<ReactorTab, ModeConfig> = {
  swap: {
    title: 'SWAP REACTOR',
    label: 'USDC / EURC ROTOR',
    icon: Shuffle,
    colors: ['#00e5ff', '#ffd60a', '#ff4d8d'],
    pulse: 'bg-quantum-cyan',
    telemetry: ['PAIR', 'QUOTE', 'SLIP', 'ROUTE']
  },
  send: {
    title: 'SEND ARRAY',
    label: 'TOKEN VECTOR',
    icon: Send,
    colors: ['#00c2a8', '#00e5ff', '#ff9f1c'],
    pulse: 'bg-quantum-green',
    telemetry: ['TO', 'VALUE', 'GAS', 'HASH']
  },
  faucet: {
    title: 'FAUCET STREAM',
    label: 'TESTNET FUEL',
    icon: Waves,
    colors: ['#ffd60a', '#00c2a8', '#00e5ff'],
    pulse: 'bg-quantum-yellow',
    telemetry: ['CLAIM', 'ARC', 'SEPOLIA', 'SYNC']
  },
  deploy: {
    title: 'DEPLOY FORGE',
    label: 'ERC20 BYTECODE PRESS',
    icon: Rocket,
    colors: ['#ff4d8d', '#ff9f1c', '#8a5cf6'],
    pulse: 'bg-quantum-red',
    telemetry: ['NAME', 'SYMBOL', 'SUPPLY', 'CA']
  }
}

function matchesMode(mode: ReactorTab, tx: Transaction) {
  const summary = tx.summary.toLowerCase()
  if (mode === 'send') return tx.kind === 'send' && !summary.includes('bridge')
  if (mode === 'swap') return tx.kind === 'swap' || summary.includes('swap')
  if (mode === 'deploy') return tx.kind === 'deploy'
  return false
}

function statusTone(status: ReactorStatus) {
  if (status === 'pending') return 'PROCESSING'
  if (status === 'success') return 'CONFIRMED'
  if (status === 'error') return 'REVERTED'
  return 'STANDBY'
}

function makeCoreGeometry(mode: ReactorTab) {
  if (mode === 'swap') return new THREE.TorusKnotGeometry(0.78, 0.22, 150, 18, 2, 3)
  if (mode === 'deploy') return new THREE.IcosahedronGeometry(0.98, 2)
  if (mode === 'send') return new THREE.OctahedronGeometry(1.05, 2)
  return new THREE.SphereGeometry(0.92, 42, 28)
}

function makeParticleField(colors: THREE.Color[]) {
  const count = 520
  const positions = new Float32Array(count * 3)
  const palette = new Float32Array(count * 3)

  for (let index = 0; index < count; index += 1) {
    const radius = 1.25 + Math.random() * 2.9
    const theta = Math.random() * Math.PI * 2
    const phi = Math.acos(2 * Math.random() - 1)
    const offset = index * 3
    positions[offset] = radius * Math.sin(phi) * Math.cos(theta)
    positions[offset + 1] = radius * Math.sin(phi) * Math.sin(theta)
    positions[offset + 2] = radius * Math.cos(phi)

    const color = colors[index % colors.length]
    palette[offset] = color.r
    palette[offset + 1] = color.g
    palette[offset + 2] = color.b
  }

  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
  geometry.setAttribute('color', new THREE.BufferAttribute(palette, 3))
  const material = new THREE.PointsMaterial({
    size: 0.035,
    vertexColors: true,
    transparent: true,
    opacity: 0.82
  })
  return new THREE.Points(geometry, material)
}

function disposeObject(object: THREE.Object3D) {
  const disposable = object as THREE.Object3D & {
    geometry?: THREE.BufferGeometry
    material?: THREE.Material | THREE.Material[]
  }
  disposable.geometry?.dispose()
  if (Array.isArray(disposable.material)) {
    disposable.material.forEach((material) => material.dispose())
    return
  }
  disposable.material?.dispose()
}

function QuantumCanvas({ mode, status }: { mode: ReactorTab; status: ReactorStatus }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [fallback, setFallback] = useState(false)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return undefined

    const config = modeConfig[mode]
    const palette = config.colors.map((color) => new THREE.Color(color))
    let renderer: THREE.WebGLRenderer

    try {
      renderer = new THREE.WebGLRenderer({
        alpha: true,
        antialias: true,
        canvas,
        powerPreference: 'high-performance',
        preserveDrawingBuffer: true
      })
    } catch {
      setFallback(true)
      return undefined
    }

    setFallback(false)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2))
    renderer.outputColorSpace = THREE.SRGBColorSpace

    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 100)
    camera.position.set(0, 0, 5.5)

    const rig = new THREE.Group()
    scene.add(rig)

    const coreMaterial = new THREE.MeshStandardMaterial({
      color: palette[0],
      emissive: palette[1],
      emissiveIntensity: status === 'pending' ? 0.48 : 0.24,
      metalness: 0.48,
      roughness: 0.24
    })
    const core = new THREE.Mesh(makeCoreGeometry(mode), coreMaterial)
    rig.add(core)

    const ringMaterial = new THREE.MeshBasicMaterial({
      color: palette[2],
      transparent: true,
      opacity: 0.92
    })
    const ringA = new THREE.Mesh(new THREE.TorusGeometry(1.62, 0.018, 12, 190), ringMaterial)
    const ringB = new THREE.Mesh(new THREE.TorusGeometry(1.28, 0.014, 12, 190), ringMaterial.clone())
    ringA.rotation.x = Math.PI / 2.8
    ringB.rotation.y = Math.PI / 2.7
    rig.add(ringA, ringB)

    const orbit = new THREE.Group()
    const nodeGeometry = new THREE.SphereGeometry(0.065, 16, 12)
    for (let index = 0; index < 18; index += 1) {
      const node = new THREE.Mesh(
        nodeGeometry,
        new THREE.MeshStandardMaterial({
          color: palette[index % palette.length],
          emissive: palette[index % palette.length],
          emissiveIntensity: 0.35
        })
      )
      const angle = (index / 18) * Math.PI * 2
      node.position.set(Math.cos(angle) * 1.8, Math.sin(angle) * 1.8, Math.sin(angle * 2) * 0.35)
      orbit.add(node)
    }
    rig.add(orbit)

    const particles = makeParticleField(palette)
    scene.add(particles)

    scene.add(new THREE.AmbientLight(0xffffff, 0.62))
    const lightA = new THREE.PointLight(palette[0], 2.2, 10)
    const lightB = new THREE.PointLight(palette[2], 1.5, 9)
    lightA.position.set(2.6, 2.2, 3.4)
    lightB.position.set(-3, -1.5, 2.7)
    scene.add(lightA, lightB)

    let frameId = 0
    const resize = () => {
      const { clientWidth, clientHeight } = canvas
      const width = Math.max(clientWidth, 1)
      const height = Math.max(clientHeight, 1)
      renderer.setSize(width, height, false)
      camera.aspect = width / height
      camera.updateProjectionMatrix()
    }

    const animate = (time: number) => {
      const t = time * 0.001
      const speed = status === 'pending' ? 1.9 : status === 'error' ? 0.55 : 0.95
      rig.rotation.y = t * 0.38 * speed
      rig.rotation.x = Math.sin(t * 0.48) * 0.18
      core.rotation.x = t * 0.72 * speed
      core.rotation.z = t * 0.42 * speed
      ringA.rotation.z = t * 0.86 * speed
      ringB.rotation.x = t * -0.72 * speed
      orbit.rotation.z = t * 1.15 * speed
      particles.rotation.y = t * 0.12 * speed
      particles.rotation.x = Math.sin(t * 0.16) * 0.08
      renderer.render(scene, camera)
      frameId = window.requestAnimationFrame(animate)
    }

    resize()
    animate(0)
    window.addEventListener('resize', resize)

    return () => {
      window.cancelAnimationFrame(frameId)
      window.removeEventListener('resize', resize)
      scene.traverse(disposeObject)
      renderer.dispose()
    }
  }, [mode, status])

  return (
    <div className="reactor-canvas-wrap" data-reactor-mode={mode}>
      <canvas
        ref={canvasRef}
        className="reactor-canvas"
        data-testid="quantum-reactor-canvas"
        aria-hidden="true"
      />
      {fallback ? <div className="reactor-fallback" aria-hidden="true" /> : null}
      <div className="reactor-hud-line reactor-hud-a" />
      <div className="reactor-hud-line reactor-hud-b" />
    </div>
  )
}

export function ActionReactor({ activeTab }: { activeTab: ReactorTab }) {
  const txHistory = useAppStore((state) => state.txHistory)
  const latestTx = useMemo(
    () => txHistory.find((tx) => matchesMode(activeTab, tx)) ?? null,
    [activeTab, txHistory]
  )
  const status = (latestTx?.status ?? 'idle') as ReactorStatus
  const config = modeConfig[activeTab]
  const Icon = config.icon
  const counters = useMemo(
    () => ({
      pending: txHistory.filter((tx) => tx.status === 'pending').length,
      success: txHistory.filter((tx) => tx.status === 'success').length,
      error: txHistory.filter((tx) => tx.status === 'error').length
    }),
    [txHistory]
  )

  return (
    <Panel className="animate-reveal overflow-hidden bg-quantum-black p-0 text-white" shadow="cyan">
      <div className="relative min-h-[300px]">
        <div className="reactor-bg" />
        <QuantumCanvas mode={activeTab} status={status} />

        <div className="relative z-10 grid min-h-[300px] grid-rows-[auto_1fr_auto]">
          <div className="flex flex-col gap-2 border-b-4 border-white/80 bg-white/95 p-3 text-quantum-black md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-3">
              <div className={`grid h-10 w-10 place-items-center border-4 border-quantum-black ${config.pulse} shadow-[5px_5px_0_#111]`}>
                <Icon className="h-6 w-6" />
              </div>
              <div>
                <div className="font-display text-3xl leading-none md:text-4xl">
                  {config.title}
                </div>
                <div className="font-mono text-[11px] uppercase text-quantum-black/55">
                  {config.label}
                </div>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2 font-mono text-[10px] uppercase">
              <div className="border-4 border-quantum-black bg-quantum-green px-2 py-1">
                OK {counters.success}
              </div>
              <div className="border-4 border-quantum-black bg-quantum-yellow px-2 py-1">
                RUN {counters.pending}
              </div>
              <div className="border-4 border-quantum-black bg-quantum-red px-2 py-1">
                ERR {counters.error}
              </div>
            </div>
          </div>

          <div className="relative">
            <div className="absolute left-3 top-3 max-w-[72%] truncate border-4 border-white bg-quantum-black/85 px-3 py-2 font-mono text-[11px] uppercase text-white shadow-[5px_5px_0_#00e5ff]">
              <span className={status === 'pending' ? 'animate-pulse text-quantum-yellow' : 'text-quantum-cyan'}>
                {statusTone(status)}
              </span>
              {latestTx ? <span className="ml-2 text-white/55">{latestTx.summary}</span> : null}
            </div>
            <div className="absolute bottom-4 right-4 hidden max-w-[360px] border-4 border-white bg-white/95 p-3 font-mono text-[11px] uppercase text-quantum-black shadow-[5px_5px_0_#ff4d8d] md:block">
              {latestTx?.hash ? latestTx.hash : 'NO ACTIVE HASH'}
            </div>
          </div>

          <div className="grid gap-2 border-t-4 border-white/80 bg-white/95 p-3 text-quantum-black md:grid-cols-4">
            {config.telemetry.map((item, index) => (
              <div
                key={item}
                className="relative overflow-hidden border-4 border-quantum-black bg-quantum-paper px-3 py-3 font-mono text-[11px] uppercase shadow-[5px_5px_0_#111]"
              >
                <div className="signal-stream" style={{ animationDelay: `${index * 160}ms` }} />
                <div className="relative z-10 flex items-center justify-between gap-2">
                  <span className="text-quantum-black/55">{item}</span>
                  <span>{status === 'pending' ? 'LIVE' : 'READY'}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Panel>
  )
}

export function ProtocolMatrix({ activeTab }: { activeTab: ReactorTab }) {
  const txHistory = useAppStore((state) => state.txHistory)
  const modes = Object.entries(modeConfig) as Array<[ReactorTab, ModeConfig]>
  const latest = txHistory[0]

  return (
    <Panel className="animate-reveal bg-white" shadow="red">
      <div className="mb-3 flex flex-col gap-2 border-b-4 border-quantum-black pb-3 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-2 font-display text-3xl leading-none">
          <Activity className="h-6 w-6 text-quantum-red" />
          PROTOCOL MATRIX
        </div>
        <div className="border-4 border-quantum-black bg-quantum-cyan px-3 py-2 font-mono text-[11px] uppercase shadow-[5px_5px_0_#111]">
          {latest ? latest.status : 'ready'} / {txHistory.length} tx
        </div>
      </div>

      <div className="grid gap-3 lg:grid-cols-4">
        {modes.map(([mode, config], index) => {
          const Icon = config.icon
          const active = mode === activeTab
          return (
            <div
              key={mode}
              className={`route-cell ${active ? 'route-cell-active' : ''}`}
              style={{ '--route-delay': `${index * 140}ms` } as CSSProperties}
            >
              <div className={`mb-2 grid h-9 w-9 place-items-center border-4 border-quantum-black ${config.pulse}`}>
                <Icon className="h-5 w-5" />
              </div>
              <div className="font-display text-2xl leading-none">{mode.toUpperCase()}</div>
              <div className="mt-1 font-mono text-[10px] uppercase text-quantum-black/55">
                {config.label}
              </div>
              <div className="mt-3 grid grid-cols-3 gap-1">
                {config.colors.map((color) => (
                  <span
                    key={color}
                    className="h-3 border-2 border-quantum-black"
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>
          )
        })}
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-[1fr_220px]">
        <div className="overflow-hidden border-4 border-quantum-black bg-quantum-black py-3 font-mono text-xs uppercase text-white shadow-[5px_5px_0_#111]">
          <div className="matrix-marquee">
            ARC TESTNET / CIRCLE APPKIT / PRIVY AUTH / PUBLIC RPC / LIVE BALANCE / ROUTE ENGINE
          </div>
        </div>
        <div className="grid place-items-center border-4 border-quantum-black bg-quantum-yellow p-3 font-mono text-xs uppercase shadow-[5px_5px_0_#111]">
          <Radio className="mb-1 h-5 w-5" />
          Reactor Online
        </div>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-3">
        {['QUOTE', 'SIGN', 'FINALIZE'].map((item, index) => (
          <div
            key={item}
            className="matrix-step border-4 border-quantum-black bg-quantum-paper p-3 font-mono text-xs uppercase shadow-[5px_5px_0_#111]"
            style={{ '--route-delay': `${index * 180}ms` } as CSSProperties}
          >
            <Boxes className="mb-2 h-5 w-5 text-quantum-purple" />
            {item}
          </div>
        ))}
      </div>
    </Panel>
  )
}

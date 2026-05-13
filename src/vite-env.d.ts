/// <reference types="vite/client" />

declare module '*.svg' {
  const src: string
  export default src
}

interface Window {
  ethereum?: import('viem').EIP1193Provider
}

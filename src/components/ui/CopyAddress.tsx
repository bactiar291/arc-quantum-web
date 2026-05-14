import { Check, Copy } from 'lucide-react'
import { useState, type MouseEvent } from 'react'
import { clsx } from 'clsx'

interface CopyAddressProps {
  address?: string | null
  label?: string
  iconOnly?: boolean
  className?: string
}

async function copyText(value: string) {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(value)
    return
  }

  const input = document.createElement('textarea')
  input.value = value
  input.setAttribute('readonly', 'true')
  input.style.position = 'fixed'
  input.style.opacity = '0'
  document.body.appendChild(input)
  input.select()
  document.execCommand('copy')
  document.body.removeChild(input)
}

export function CopyAddress({
  address,
  label = 'Copy',
  iconOnly = false,
  className
}: CopyAddressProps) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async (event: MouseEvent<HTMLButtonElement>) => {
    event.preventDefault()
    event.stopPropagation()
    if (!address) return
    await copyText(address)
    setCopied(true)
    window.setTimeout(() => setCopied(false), 1200)
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      disabled={!address}
      title={address ? `Copy ${address}` : 'No address'}
      aria-label={address ? `Copy address ${address}` : 'No address to copy'}
      className={clsx(
        'inline-flex h-7 items-center justify-center gap-1 border-2 border-quantum-black bg-white px-2 font-mono text-[10px] uppercase text-quantum-black shadow-[2px_2px_0_#111] transition-transform active:translate-x-px active:translate-y-px disabled:cursor-not-allowed disabled:opacity-45',
        iconOnly && 'w-7 px-0',
        copied && 'bg-quantum-green',
        className
      )}
    >
      {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
      {iconOnly ? null : <span>{copied ? 'Copied' : label}</span>}
    </button>
  )
}

import type { Address } from 'viem'

import { mergeTokens } from '../../lib/tokens'
import { useAppStore } from '../../store/useAppStore'

interface TokenSelectProps {
  label: string
  value: Address | ''
  onChange: (address: Address | '') => void
}

export function TokenSelect({ label, value, onChange }: TokenSelectProps) {
  const tokens = mergeTokens(useAppStore((state) => state.deployedTokens))

  return (
    <label className="block">
      <span className="mb-2 block font-display text-xl uppercase leading-none">
        {label}
      </span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value as Address | '')}
        className="input-quantum w-full px-3 py-3 font-mono text-sm"
      >
        <option value="">SELECT TOKEN</option>
        {tokens.map((token) => (
          <option key={token.address} value={token.address}>
            {token.symbol} / {token.address.slice(0, 8)}...
            {token.address.slice(-4)}
          </option>
        ))}
      </select>
    </label>
  )
}

import type { SelectHTMLAttributes } from 'react'
import { ASSETS } from '../lib/currencies'
import { Select } from './ui'

/** Select of every tradable asset, grouped into currencies and crypto. */
export function AssetSelect({
  label,
  hideLabel,
  ...props
}: { label: string; hideLabel?: boolean } & SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <Select label={label} hideLabel={hideLabel} {...props}>
      <optgroup label="Currencies">
        {ASSETS.filter((a) => a.type === 'FIAT').map((a) => (
          <option key={a.code} value={a.code}>
            {a.code} · {a.name}
          </option>
        ))}
      </optgroup>
      <optgroup label="Crypto">
        {ASSETS.filter((a) => a.type === 'CRYPTO').map((a) => (
          <option key={a.code} value={a.code}>
            {a.code} · {a.name}
          </option>
        ))}
      </optgroup>
    </Select>
  )
}

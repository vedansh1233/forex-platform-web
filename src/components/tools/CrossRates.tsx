import { Link } from 'react-router'
import { Card } from '../ui'
import { CURRENCIES } from '../../lib/currencies'
import { crossRate, type UsdRates } from '../../lib/fx'
import { formatRate } from '../../lib/format'

/** Every pair at once: row currency = base, column currency = quote ("1 row = x column"). */
export function CrossRates({ usd }: { usd: UsdRates }) {
  return (
    <Card className="p-0">
      <div className="border-b border-ink-800 px-6 py-4">
        <h2 className="font-semibold">Cross rates</h2>
        <p className="mt-0.5 text-sm text-ink-400">Each cell shows how much of the column currency 1 unit of the row currency buys. Click a cell to trade it.</p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[44rem] border-collapse text-right font-mono text-sm tabular-nums">
          <caption className="sr-only">Cross exchange rates between the 8 supported currencies</caption>
          <thead>
            <tr className="text-xs text-ink-400">
              <th scope="col" className="px-3 py-2 text-left font-semibold">
                <span className="sr-only">Base</span>
              </th>
              {CURRENCIES.map((c) => (
                <th key={c} scope="col" className="px-3 py-2 font-semibold text-ink-300">
                  {c}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {CURRENCIES.map((row) => (
              <tr key={row} className="border-t border-ink-800">
                <th scope="row" className="px-3 py-2 text-left text-xs font-semibold text-ink-300">
                  {row}
                </th>
                {CURRENCIES.map((col) =>
                  row === col ? (
                    <td key={col} className="px-3 py-2 text-ink-600" aria-label="Same currency">
                      —
                    </td>
                  ) : (
                    <td key={col} className="p-0">
                      <Link
                        to={`/trade?from=${row}&to=${col}`}
                        title={`1 ${row} = ${formatRate(crossRate(usd, row, col))} ${col}`}
                        className="block px-3 py-2 text-ink-100 transition-colors hover:bg-ink-800 hover:text-accent-300"
                      >
                        {formatRate(crossRate(usd, row, col))}
                      </Link>
                    </td>
                  ),
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  )
}

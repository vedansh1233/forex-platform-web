import { ArrowLeftRight } from 'lucide-react'
import { useState } from 'react'
import { Card, Field, Segmented, Select } from '../ui'
import { CURRENCIES } from '../../lib/currencies'
import { crossRate, pipSize, pipValue, positionSize, profitLoss, type UsdRates } from '../../lib/fx'
import { formatMoney, formatRate } from '../../lib/format'

type Tool = 'pip' | 'position' | 'pnl' | 'convert'

const TOOLS: { value: Tool; label: string }[] = [
  { value: 'pip', label: 'Pip value' },
  { value: 'position', label: 'Position size' },
  { value: 'pnl', label: 'Profit / loss' },
  { value: 'convert', label: 'Converter' },
]

const LOTS = [
  { label: 'Standard lot', units: 100_000 },
  { label: 'Mini lot', units: 10_000 },
  { label: 'Micro lot', units: 1_000 },
]

/** Parses a text input; empty or invalid -> NaN, so results show "—" instead of nonsense. */
const num = (value: string) => (value.trim() === '' ? NaN : Number(value))
const ok = (n: number) => Number.isFinite(n)

export function Calculators({ usd, defaultBalance }: { usd: UsdRates; defaultBalance: number }) {
  const [tool, setTool] = useState<Tool>('pip')
  const [base, setBase] = useState('EUR')
  const [quote, setQuote] = useState('USD')
  const [account, setAccount] = useState('USD')

  function setPair(nextBase: string, nextQuote: string) {
    if (nextBase === nextQuote) return
    setBase(nextBase)
    setQuote(nextQuote)
  }

  const rate = crossRate(usd, base, quote)

  return (
    <Card className="flex flex-col gap-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="font-semibold">Trading calculators</h2>
        <div className="overflow-x-auto">
          <Segmented label="Calculator" options={TOOLS} value={tool} onChange={setTool} />
        </div>
      </div>

      {tool !== 'convert' && (
        <div className="grid gap-4 sm:grid-cols-3">
          <Select label="Base currency" value={base} onChange={(e) => setPair(e.target.value, quote)}>
            {CURRENCIES.map((c) => (
              <option key={c} value={c} disabled={c === quote}>
                {c}
              </option>
            ))}
          </Select>
          <Select label="Quote currency" value={quote} onChange={(e) => setPair(base, e.target.value)}>
            {CURRENCIES.map((c) => (
              <option key={c} value={c} disabled={c === base}>
                {c}
              </option>
            ))}
          </Select>
          <Select label="Account currency" value={account} onChange={(e) => setAccount(e.target.value)}>
            {CURRENCIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </Select>
        </div>
      )}

      {tool !== 'convert' && (
        <p className="-mt-2 text-sm text-ink-400">
          {base}/{quote} is at <span className="font-mono text-ink-100">{ok(rate) ? formatRate(rate) : '—'}</span>. One pip
          is <span className="font-mono text-ink-100">{pipSize(quote)}</span>.
        </p>
      )}

      {tool === 'pip' && <PipValue usd={usd} base={base} quote={quote} account={account} />}
      {tool === 'position' && (
        <PositionSize usd={usd} base={base} quote={quote} account={account} defaultBalance={defaultBalance} />
      )}
      {tool === 'pnl' && <ProfitLoss usd={usd} base={base} quote={quote} account={account} currentRate={rate} />}
      {tool === 'convert' && <Converter usd={usd} />}
    </Card>
  )
}

interface PairProps {
  usd: UsdRates
  base: string
  quote: string
  account: string
}

function Result({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-xl bg-ink-800/60 px-4 py-3">
      <p className="text-xs text-ink-400">{label}</p>
      <p className="mt-1 font-mono text-xl font-semibold tabular-nums">{value}</p>
      {hint && <p className="mt-0.5 text-xs text-ink-400">{hint}</p>}
    </div>
  )
}

function PipValue({ usd, base, quote, account }: PairProps) {
  const [units, setUnits] = useState('100000')
  const value = pipValue(usd, quote, num(units), account)

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div className="flex flex-col gap-3">
        <Field
          label={`Position size (units of ${base})`}
          type="number"
          inputMode="decimal"
          min="0"
          step="any"
          value={units}
          onChange={(e) => setUnits(e.target.value)}
        />
        <div className="flex flex-wrap gap-2">
          {LOTS.map((lot) => (
            <button
              key={lot.units}
              type="button"
              onClick={() => setUnits(String(lot.units))}
              className="rounded-md bg-ink-800 px-2.5 py-1 text-xs font-medium text-ink-300 hover:bg-ink-700 hover:text-ink-100"
            >
              {lot.label} · {lot.units.toLocaleString('en-US')}
            </button>
          ))}
        </div>
      </div>
      <div className="grid gap-3 sm:grid-cols-2" aria-live="polite">
        <Result label="Value of 1 pip" value={ok(value) ? formatMoney(value, account) : '—'} />
        <Result label="Value of 10 pips" value={ok(value) ? formatMoney(value * 10, account) : '—'} />
      </div>
    </div>
  )
}

function PositionSize({ usd, base, quote, account, defaultBalance }: PairProps & { defaultBalance: number }) {
  const [balance, setBalance] = useState(String(Math.round(defaultBalance)))
  const [risk, setRisk] = useState('2')
  const [stop, setStop] = useState('25')
  const { riskAmount, units } = positionSize(usd, quote, account, num(balance), num(risk), num(stop))

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3">
        <Field
          label={`Balance (${account})`}
          type="number"
          inputMode="decimal"
          min="0"
          step="any"
          value={balance}
          onChange={(e) => setBalance(e.target.value)}
        />
        <Field label="Risk (%)" type="number" inputMode="decimal" min="0" step="any" value={risk} onChange={(e) => setRisk(e.target.value)} />
        <Field
          label="Stop loss (pips)"
          type="number"
          inputMode="decimal"
          min="0"
          step="any"
          value={stop}
          onChange={(e) => setStop(e.target.value)}
        />
      </div>
      <div className="grid gap-3 sm:grid-cols-2" aria-live="polite">
        <Result label="Amount at risk" value={ok(riskAmount) ? formatMoney(riskAmount, account) : '—'} />
        <Result
          label={`Position size (${base})`}
          value={ok(units) ? Math.floor(units).toLocaleString('en-US') : '—'}
          hint={ok(units) ? `${(units / 100_000).toFixed(2)} standard lots` : undefined}
        />
      </div>
    </div>
  )
}

function ProfitLoss({ usd, base, quote, account, currentRate }: PairProps & { currentRate: number }) {
  const [direction, setDirection] = useState<'buy' | 'sell'>('buy')
  const [units, setUnits] = useState('10000')
  const [entry, setEntry] = useState(() => (ok(currentRate) ? currentRate.toFixed(quote === 'JPY' ? 3 : 5) : ''))
  const [exit, setExit] = useState('')
  const result = profitLoss(usd, quote, account, direction, num(units), num(entry), num(exit))
  const positive = result.inAccount > 0

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div className="flex flex-col gap-4">
        <Segmented
          label="Direction"
          options={[
            { value: 'buy', label: `Buy ${base}` },
            { value: 'sell', label: `Sell ${base}` },
          ]}
          value={direction}
          onChange={setDirection}
        />
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Units" type="number" inputMode="decimal" min="0" step="any" value={units} onChange={(e) => setUnits(e.target.value)} />
          <Field label="Entry price" type="number" inputMode="decimal" step="any" value={entry} onChange={(e) => setEntry(e.target.value)} />
          <Field
            label="Exit price"
            type="number"
            inputMode="decimal"
            step="any"
            placeholder={ok(currentRate) ? currentRate.toFixed(quote === 'JPY' ? 3 : 5) : ''}
            value={exit}
            onChange={(e) => setExit(e.target.value)}
          />
        </div>
      </div>
      <div className="grid gap-3 sm:grid-cols-2" aria-live="polite">
        <Result label="Pips gained / lost" value={ok(result.pips) ? result.pips.toFixed(1) : '—'} />
        <Result
          label={positive ? 'Profit' : result.inAccount < 0 ? 'Loss' : 'Profit / loss'}
          value={ok(result.inAccount) ? formatMoney(result.inAccount, account) : '—'}
          hint={ok(result.inQuote) && quote !== account ? `${formatMoney(result.inQuote, quote)} in ${quote}` : undefined}
        />
      </div>
    </div>
  )
}

function Converter({ usd }: { usd: UsdRates }) {
  const [amount, setAmount] = useState('1000')
  const [from, setFrom] = useState('USD')
  const [to, setTo] = useState('EUR')
  const rate = crossRate(usd, from, to)
  const converted = num(amount) * rate

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div className="grid items-end gap-4 sm:grid-cols-[1fr_auto_1fr]">
        <div className="grid grid-cols-[1fr_6rem] gap-2 sm:col-span-3">
          <Field label="Amount" type="number" inputMode="decimal" min="0" step="any" value={amount} onChange={(e) => setAmount(e.target.value)} />
          <Select label="From" value={from} onChange={(e) => setFrom(e.target.value)}>
            {CURRENCIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </Select>
        </div>
        <button
          type="button"
          onClick={() => {
            setFrom(to)
            setTo(from)
          }}
          className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-ink-800 px-3 text-sm font-medium text-ink-300 hover:bg-ink-700 hover:text-ink-100 sm:col-span-3 sm:justify-self-start"
        >
          <ArrowLeftRight className="size-4" aria-hidden />
          Swap
        </button>
        <Select label="To" value={to} onChange={(e) => setTo(e.target.value)} className="sm:col-span-3">
          {CURRENCIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </Select>
      </div>
      <div className="grid gap-3 sm:grid-cols-2" aria-live="polite">
        <Result label={`${from} → ${to}`} value={ok(converted) ? formatMoney(converted, to) : '—'} />
        <Result
          label="Rate"
          value={ok(rate) ? `1 ${from} = ${formatRate(rate)} ${to}` : '—'}
          hint={ok(rate) && rate !== 0 ? `1 ${to} = ${formatRate(1 / rate)} ${from}` : undefined}
        />
      </div>
    </div>
  )
}

import { parseEuroNumber } from '../utils/helpers'

/* ── Density Gauge ─────────────────────────────────────────────
   Horizontal bar for FAR / Building Intensity values.
   Scale: Low 0-1 · Medium 1-3 · High 3-6 · Very High 6+       */

interface DensityGaugeProps {
  value: string | number | null
}

const DENSITY_BANDS = [
  { max: 1,  label: 'Low density',      color: 'bg-emerald-400 dark:bg-emerald-500' },
  { max: 3,  label: 'Medium density',   color: 'bg-amber-400 dark:bg-amber-500' },
  { max: 6,  label: 'High density',     color: 'bg-orange-400 dark:bg-orange-500' },
  { max: Infinity, label: 'Very high density', color: 'bg-red-400 dark:bg-red-500' },
]

export function DensityGauge({ value }: DensityGaugeProps) {
  const num = parseEuroNumber(value)
  if (num === null) return null

  const cap = 15
  const pct = Math.min((num / cap) * 100, 100)
  const band = DENSITY_BANDS.find(b => num <= b.max) || DENSITY_BANDS[3]

  // Tick positions as % of cap
  const ticks = [0, 1, 3, 6, 15]

  return (
    <div className="space-y-1">
      <div className="flex items-baseline justify-between">
        <span className="text-2xl font-bold text-neutral-900 dark:text-white transition-colors duration-500">
          {String(value)}
        </span>
        <span className="text-[10px] md:text-xs text-neutral-500 dark:text-neutral-400 transition-colors duration-500">
          {band.label}
        </span>
      </div>
      <div className="relative h-2 bg-neutral-200 dark:bg-neutral-700 rounded-full overflow-hidden transition-colors duration-500">
        <div
          className={`h-full rounded-full transition-all duration-700 ${band.color}`}
          style={{ width: `${Math.max(pct, 3)}%` }}
        />
      </div>
      <div className="relative h-3">
        {ticks.map(t => (
          <span
            key={t}
            className="absolute text-[8px] text-neutral-400 dark:text-neutral-500 -translate-x-1/2 transition-colors duration-500"
            style={{ left: `${(t / cap) * 100}%` }}
          >
            {t}
          </span>
        ))}
      </div>
    </div>
  )
}

/* ── Percent Ring ──────────────────────────────────────────────
   SVG donut for percentage values (green space, coverage, DF…) */

interface PercentRingProps {
  value: string | number | null
  /** Tailwind stroke class */
  color?: string
  size?: number
  /** Optional threshold line, e.g. 2 for DF minimum */
  threshold?: number
  thresholdLabel?: string
}

export function PercentRing({
  value,
  color = 'stroke-emerald-500 dark:stroke-emerald-400',
  size = 72,
  threshold,
  thresholdLabel,
}: PercentRingProps) {
  const num = parseEuroNumber(value)
  if (num === null) return null

  const capped = Math.min(num, 100)
  const thresholdClamped =
    threshold !== undefined ? Math.max(0, Math.min(threshold, 100)) : undefined
  const r = 28
  const circ = 2 * Math.PI * r

  return (
    <div className="flex items-center gap-3">
      <svg
        width={size}
        height={size}
        viewBox="0 0 72 72"
        className="shrink-0 -rotate-90"
      >
        {/* Background ring */}
        <circle
          cx="36" cy="36" r={r}
          fill="none"
          strokeWidth="7"
          className="stroke-neutral-200 dark:stroke-neutral-700 transition-colors duration-500"
        />
        {/* Value arc */}
        <circle
          cx="36" cy="36" r={r}
          fill="none"
          strokeWidth="7"
          className={`${color} transition-all duration-700`}
          strokeDasharray={circ}
          strokeDashoffset={circ - (capped / 100) * circ}
          strokeLinecap="round"
        />
        {/* Threshold marker */}
        {thresholdClamped !== undefined && (
          <line
            x1="36" y1={36 - r - 5}
            x2="36" y2={36 - r + 5}
            strokeWidth="1.5"
            className="stroke-red-500"
            transform={`rotate(${(thresholdClamped / 100) * 360 + 90}, 36, 36)`}
          />
        )}
        {/* Center text */}
        <text
          x="36" y="36"
          textAnchor="middle"
          dominantBaseline="central"
          className="fill-neutral-900 dark:fill-white transition-colors duration-500 rotate-90"
          style={{ transformOrigin: '36px 36px' }}
          fontSize="14"
          fontWeight="700"
        >
          {num % 1 === 0 ? num : num.toFixed(1)}
        </text>
      </svg>
      {threshold !== undefined && thresholdLabel && (
        <span className="text-[9px] text-neutral-500 dark:text-neutral-400 leading-tight transition-colors duration-500">
          {thresholdLabel}
        </span>
      )}
    </div>
  )
}

/* ── Metric Bar ────────────────────────────────────────────────
   Simple horizontal bar for numeric-ish values that aren't
   strict percentages (e.g. avg floors, sDA %)                    */

interface MetricBarProps {
  value: string | number | null
  max?: number
  unit?: string
  color?: string
}

export function MetricBar({
  value,
  max = 100,
  unit = '%',
  color = 'bg-primary-500 dark:bg-primary-400',
}: MetricBarProps) {
  const num = parseEuroNumber(value)
  if (num === null) return null

  const pct = Math.min((num / max) * 100, 100)

  return (
    <div className="space-y-1">
      <div className="flex items-baseline gap-1">
        <span className="text-lg font-bold text-neutral-900 dark:text-white transition-colors duration-500">
          {num % 1 === 0 ? num : num.toFixed(1)}
        </span>
        <span className="text-xs text-neutral-500 dark:text-neutral-400 transition-colors duration-500">{unit}</span>
      </div>
      <div className="h-1.5 bg-neutral-200 dark:bg-neutral-700 rounded-full overflow-hidden transition-colors duration-500">
        <div
          className={`h-full rounded-full transition-all duration-700 ${color}`}
          style={{ width: `${Math.max(pct, 2)}%` }}
        />
      </div>
    </div>
  )
}

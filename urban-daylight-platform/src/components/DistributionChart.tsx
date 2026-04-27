import type { DistributionData } from '../types'

interface DistributionChartProps {
  data: DistributionData
  title?: string
  color?: 'amber' | 'blue' | 'green'
  height?: number
  unitLabel?: string
}

const COLOR_MAP = {
  amber: {
    bar: 'bg-amber-500 dark:bg-amber-400',
    barHover: 'hover:bg-amber-600 dark:hover:bg-amber-300',
    text: 'text-amber-700 dark:text-amber-300',
  },
  blue: {
    bar: 'bg-blue-500 dark:bg-blue-400',
    barHover: 'hover:bg-blue-600 dark:hover:bg-blue-300',
    text: 'text-blue-700 dark:text-blue-300',
  },
  green: {
    bar: 'bg-emerald-500 dark:bg-emerald-400',
    barHover: 'hover:bg-emerald-600 dark:hover:bg-emerald-300',
    text: 'text-emerald-700 dark:text-emerald-300',
  },
}

export default function DistributionChart({ data, title, color = 'amber', height = 120, unitLabel }: DistributionChartProps) {
  const colors = COLOR_MAP[color]
  const values = data.bins.map(b => b.value ?? 0)
  const maxVal = Math.max(...values, 1)

  return (
    <div className="space-y-2">
      {title && (
        <h6 className={`text-xs font-semibold uppercase tracking-wide ${colors.text}`}>
          {title}
        </h6>
      )}
      <div className="flex items-end gap-1" style={{ height }}>
        {data.bins.map((bin, i) => {
          const val = bin.value ?? 0
          const pct = (val / maxVal) * 100
          return (
            <div key={i} className="flex-1 flex flex-col items-center gap-1 h-full justify-end group relative">
              {/* Tooltip */}
              <div className="absolute -top-8 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 text-[10px] font-medium px-1.5 py-0.5 rounded whitespace-nowrap pointer-events-none z-10">
                {val}{data.unit === '%' ? '%' : ''}
              </div>
              {/* Bar */}
              <div
                className={`w-full rounded-t-sm transition-all duration-300 ${colors.bar} ${colors.barHover} min-h-[2px]`}
                style={{ height: `${Math.max(pct, 2)}%` }}
              />
            </div>
          )
        })}
      </div>
      {/* Labels */}
      <div className="flex gap-1">
        {data.bins.map((bin, i) => (
          <div key={i} className="flex-1 text-center">
            <span className="text-[9px] md:text-[10px] text-neutral-500 dark:text-neutral-400 leading-tight">
              {bin.label}
            </span>
          </div>
        ))}
      </div>
      {/* Unit label */}
      <div className="text-center">
        <span className="text-[10px] text-neutral-400 dark:text-neutral-500">
          {unitLabel ?? (data.unit === 'hours' ? 'Hours of sunlight' : data.unit === '%' ? 'Share (%)' : data.unit)}
        </span>
      </div>
    </div>
  )
}

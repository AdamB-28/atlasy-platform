import type { StreetSimulationInput } from '../utils/streetGeometry'

interface StreetSunSimulatorProps {
  enabled: boolean
  onEnabledChange: (enabled: boolean) => void
  angle: number
  onAngleChange: (angle: number) => void
  sunFrom: 'left' | 'right'
  onSunFromChange: (direction: 'left' | 'right') => void
  dataA: StreetSimulationInput | null
  dataB?: StreetSimulationInput | null
  labelA: string
  labelB?: string
}

export default function StreetSunSimulator({ enabled, onEnabledChange, angle, onAngleChange, sunFrom, onSunFromChange, dataA, dataB, labelA, labelB }: StreetSunSimulatorProps) {
  const shadowReading = (label: string, data: StreetSimulationInput | null) => {
    if (!enabled) return `${label}: sun and shadow hidden`
    if (!data) return `${label}: not enough source dimensions`
    const shadowLength = data.estimatedHeightM / Math.tan((angle * Math.PI) / 180)
    return `${label}: ≈${shadowLength.toFixed(1)} m shadow${shadowLength >= data.widthM ? ` · spans W ${data.widthLabel}` : ''}`
  }

  return (
    <section className="mt-6 border-t border-neutral-200 pt-5 dark:border-neutral-700" aria-labelledby="street-sun-simulator-title">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h4 id="street-sun-simulator-title" className="text-base font-semibold text-neutral-900 dark:text-white">Sun angle and street shadow</h4>
          <p className="mt-1 max-w-3xl text-xs leading-relaxed text-neutral-600 dark:text-neutral-400">Adjust the sun overlay directly on the street diagrams. Shadow length follows H / tan(angle); this simplified simulation assumes sunlight perpendicular to the street.</p>
        </div>
        <div className="flex flex-wrap items-end gap-4">
          <label className="inline-flex min-h-9 items-center gap-2 text-xs font-semibold text-neutral-700 dark:text-neutral-200">
            <input type="checkbox" checked={enabled} onChange={(event) => onEnabledChange(event.target.checked)} className="h-4 w-4" />
            Show sun &amp; shadow
          </label>
          <label className={`grid gap-1 text-xs font-medium text-neutral-700 dark:text-neutral-200 ${enabled ? '' : 'opacity-50'}`}>
            <span>Drag to set sun altitude · {angle}°</span>
            <input type="range" min="10" max="80" step="1" value={angle} disabled={!enabled} onChange={(event) => onAngleChange(Number(event.target.value))} className="sun-angle-slider w-64 max-w-[calc(100vw-3rem)]" aria-label="Sun altitude angle" />
          </label>
          <div role="group" aria-label="Sun direction" className={`inline-flex rounded-md border border-neutral-300 bg-neutral-100 p-1 dark:border-neutral-700 dark:bg-neutral-800 ${enabled ? '' : 'pointer-events-none opacity-50'}`}>
            <button type="button" aria-pressed={sunFrom === 'left'} onClick={() => onSunFromChange('left')} className={`min-h-9 rounded px-3 text-xs font-semibold ${sunFrom === 'left' ? 'bg-white text-neutral-900 shadow-sm dark:bg-neutral-700 dark:text-white' : 'text-neutral-600 dark:text-neutral-300'}`}>From left</button>
            <button type="button" aria-pressed={sunFrom === 'right'} onClick={() => onSunFromChange('right')} className={`min-h-9 rounded px-3 text-xs font-semibold ${sunFrom === 'right' ? 'bg-white text-neutral-900 shadow-sm dark:bg-neutral-700 dark:text-white' : 'text-neutral-600 dark:text-neutral-300'}`}>From right</button>
          </div>
        </div>
      </div>
      <p className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs tabular-nums text-neutral-600 dark:text-neutral-400" aria-live="polite">
        <span>{shadowReading(labelA, dataA)}</span>
        {labelB !== undefined && <span>{shadowReading(labelB, dataB ?? null)}</span>}
      </p>
    </section>
  )
}

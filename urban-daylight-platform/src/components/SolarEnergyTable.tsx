import type { SolarEnergySpecs } from '../types'

interface SolarEnergyTableProps {
  specs: SolarEnergySpecs
}

function formatNumber(val: number | null): string {
  if (val === null) return '—'
  if (val >= 1_000_000) return `${(val / 1_000_000).toFixed(1)}M`
  if (val >= 1_000) return `${(val / 1_000).toFixed(1)}k`
  return val.toLocaleString('en-US', { maximumFractionDigits: 1 })
}

export default function SolarEnergyTable({ specs }: SolarEnergyTableProps) {
  const rows = [
    { label: 'Total Roof Area', value: specs.area, unit: 'm²' },
    { label: 'Total Solar Energy', value: specs.totalSolarEnergy, unit: 'kWh' },
    { label: 'Avg Solar Energy Density', value: specs.avgSolarEnergy, unit: 'kWh/m²' },
    { label: 'Panel Area (60% coverage)', value: specs.panelArea, unit: 'm²' },
    { label: 'Annual Electricity (20% eff.)', value: specs.annualElectricity, unit: 'kWh' },
  ].filter(r => r.value !== null)

  if (rows.length === 0) return null

  return (
    <div className="overflow-hidden rounded-lg border border-neutral-200 dark:border-neutral-700">
      <table className="w-full text-sm">
        <tbody>
          {rows.map((row, i) => (
            <tr
              key={i}
              className={i % 2 === 0 ? 'bg-white dark:bg-neutral-800' : 'bg-neutral-50 dark:bg-neutral-800/50'}
            >
              <td className="px-3 py-2 text-neutral-600 dark:text-neutral-400 text-xs md:text-sm">
                {row.label}
              </td>
              <td className="px-3 py-2 text-right font-semibold text-neutral-900 dark:text-white text-xs md:text-sm">
                {formatNumber(row.value)}
                <span className="text-neutral-400 dark:text-neutral-500 font-normal ml-1 text-[10px] md:text-xs">{row.unit}</span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

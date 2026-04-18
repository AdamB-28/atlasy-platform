interface UrbanSectionDiagramProps {
  heightToWidthRatio: string | null
  streetWidth: string | null
}

function parseRatios(hw: string): { h: number; w: number; label: string }[] {
  const results: { h: number; w: number; label: string }[] = []
  // Match patterns like "1,4 - 1,9:1", "1:1", "0,74 (1: 1,35)", "1,85 (1:0,54)"
  const segments = hw.split(';').map(s => s.trim()).filter(Boolean)
  for (const seg of segments) {
    // Try "between X - Y:1" or "X - Y:1"
    const rangeMatch = seg.match(/([\d,\.]+)\s*-\s*([\d,\.]+)\s*:\s*1/)
    if (rangeMatch) {
      const low = parseFloat(rangeMatch[1].replace(',', '.'))
      const high = parseFloat(rangeMatch[2].replace(',', '.'))
      const avg = (low + high) / 2
      results.push({ h: avg, w: 1, label: `${rangeMatch[1]}–${rangeMatch[2]}:1` })
      continue
    }
    // Try "X:1" or "X (1: Y)"
    const simpleMatch = seg.match(/([\d,\.]+)\s*(?:\(?\s*1\s*:\s*([\d,\.]+)\s*\)?)/)
    if (simpleMatch) {
      const val = parseFloat(simpleMatch[1].replace(',', '.'))
      if (simpleMatch[2]) {
        // It's in format "X (1:Y)" meaning H/W = X, or inverse
        results.push({ h: val, w: 1, label: seg.trim() })
      } else {
        results.push({ h: val, w: 1, label: seg.trim() })
      }
      continue
    }
    // Try plain "1:1"
    const plainMatch = seg.match(/([\d,\.]+)\s*:\s*([\d,\.]+)/)
    if (plainMatch) {
      const h = parseFloat(plainMatch[1].replace(',', '.'))
      const w = parseFloat(plainMatch[2].replace(',', '.'))
      results.push({ h, w, label: seg.trim() })
    }
  }
  return results
}

function parseWidths(sw: string): { min: number; max: number; label: string }[] {
  const results: { min: number; max: number; label: string }[] = []
  const segments = sw.split(',').map(s => s.trim()).filter(Boolean)
  for (const seg of segments) {
    const rangeMatch = seg.match(/([\d,\.]+)\s*-\s*([\d,\.]+)\s*m?/)
    if (rangeMatch) {
      const min = parseFloat(rangeMatch[1].replace(',', '.'))
      const max = parseFloat(rangeMatch[2].replace(',', '.'))
      results.push({ min, max, label: `${rangeMatch[1]}–${rangeMatch[2]}m` })
      continue
    }
    const singleMatch = seg.match(/([\d,\.]+)\s*m?/)
    if (singleMatch) {
      const val = parseFloat(singleMatch[1].replace(',', '.'))
      results.push({ min: val, max: val, label: `${singleMatch[1]}m` })
    }
  }
  return results
}

export default function UrbanSectionDiagram({ heightToWidthRatio, streetWidth }: UrbanSectionDiagramProps) {
  const ratios = heightToWidthRatio ? parseRatios(heightToWidthRatio) : []
  const widths = streetWidth ? parseWidths(streetWidth) : []

  if (ratios.length === 0 && widths.length === 0) return null

  const viewWidth = 300
  const viewHeight = 160
  const groundY = viewHeight - 25
  const maxBuildingH = groundY - 20

  return (
    <div className="space-y-4">
      {/* H/W Ratio Diagram */}
      {ratios.length > 0 && (
        <div className="p-3 bg-neutral-50 dark:bg-neutral-800/50 rounded-lg border border-neutral-200 dark:border-neutral-700">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-neutral-500 dark:text-neutral-400 mb-2">
            Height-to-Width Section
          </p>
          <svg viewBox={`0 0 ${viewWidth} ${viewHeight}`} className="w-full" style={{ maxHeight: 140 }}>
            {/* Ground */}
            <line x1="0" y1={groundY} x2={viewWidth} y2={groundY} stroke="currentColor" strokeWidth="1" className="text-neutral-300 dark:text-neutral-600" />

            {ratios.map((r, i) => {
              const sectionW = viewWidth / ratios.length
              const cx = sectionW * i + sectionW / 2
              const ratio = r.h / (r.w || 1)
              const scale = Math.min(1, 1.5 / ratio)
              const bldgW = 35 * scale
              const streetW = 40 * scale
              const bldgH = Math.min(maxBuildingH, Math.max(30, ratio * streetW))

              const leftX = cx - streetW / 2 - bldgW
              const rightX = cx + streetW / 2

              return (
                <g key={i}>
                  {/* Left building */}
                  <rect x={leftX} y={groundY - bldgH} width={bldgW} height={bldgH}
                    className="fill-neutral-400 dark:fill-neutral-500" rx="1" />
                  {/* Right building */}
                  <rect x={rightX} y={groundY - bldgH} width={bldgW} height={bldgH}
                    className="fill-neutral-400 dark:fill-neutral-500" rx="1" />
                  {/* Street */}
                  <rect x={cx - streetW / 2} y={groundY} width={streetW} height={4}
                    className="fill-neutral-200 dark:fill-neutral-700" />
                  {/* W dimension */}
                  <line x1={cx - streetW / 2} y1={groundY + 10} x2={cx + streetW / 2} y2={groundY + 10}
                    stroke="currentColor" strokeWidth="0.5" className="text-blue-500" markerStart="url(#arrowL)" markerEnd="url(#arrowR)" />
                  <text x={cx} y={groundY + 19} textAnchor="middle" className="fill-blue-600 dark:fill-blue-400" fontSize="8" fontWeight="600">W</text>
                  {/* H dimension */}
                  <line x1={leftX - 6} y1={groundY} x2={leftX - 6} y2={groundY - bldgH}
                    stroke="currentColor" strokeWidth="0.5" className="text-red-500" />
                  <text x={leftX - 10} y={groundY - bldgH / 2} textAnchor="middle" className="fill-red-600 dark:fill-red-400" fontSize="8" fontWeight="600"
                    transform={`rotate(-90, ${leftX - 10}, ${groundY - bldgH / 2})`}>H</text>
                  {/* Label */}
                  <text x={cx} y={12} textAnchor="middle" className="fill-neutral-700 dark:fill-neutral-300" fontSize="9" fontWeight="600">
                    {r.label}
                  </text>
                </g>
              )
            })}
            <defs>
              <marker id="arrowL" markerWidth="4" markerHeight="4" refX="0" refY="2" orient="auto">
                <path d="M4,0 L0,2 L4,4" fill="none" stroke="currentColor" strokeWidth="0.5" className="text-blue-500" />
              </marker>
              <marker id="arrowR" markerWidth="4" markerHeight="4" refX="4" refY="2" orient="auto">
                <path d="M0,0 L4,2 L0,4" fill="none" stroke="currentColor" strokeWidth="0.5" className="text-blue-500" />
              </marker>
            </defs>
          </svg>
        </div>
      )}

      {/* Street Widths */}
      {widths.length > 0 && (
        <div className="p-3 bg-neutral-50 dark:bg-neutral-800/50 rounded-lg border border-neutral-200 dark:border-neutral-700">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-neutral-500 dark:text-neutral-400 mb-2">
            Street Widths
          </p>
          <div className="flex items-end gap-2">
            {widths.map((w, i) => {
              const maxW = Math.max(...widths.map(x => x.max))
              const pct = ((w.min + w.max) / 2 / maxW) * 100
              return (
                <div key={i} className="flex-1 flex flex-col items-center gap-1">
                  <span className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">{w.label}</span>
                  <div
                    className="w-full bg-blue-200 dark:bg-blue-800 rounded-sm border border-blue-300 dark:border-blue-700 transition-all"
                    style={{ height: Math.max(12, pct * 0.4) }}
                  />
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

interface UrbanSectionDiagramProps {
  heightToWidthRatio: string | null
  streetWidth: string | null
}

function parseRatios(hw: string): { h: number; w: number; label: string }[] {
  const results: { h: number; w: number; label: string }[] = []
  const segments = hw.split(';').map(s => s.trim()).filter(Boolean)
  for (const seg of segments) {
    const rangeMatch = seg.match(/([\d,\.]+)\s*-\s*([\d,\.]+)\s*:\s*1/)
    if (rangeMatch) {
      const low = parseFloat(rangeMatch[1].replace(',', '.'))
      const high = parseFloat(rangeMatch[2].replace(',', '.'))
      const avg = (low + high) / 2
      results.push({ h: avg, w: 1, label: `${rangeMatch[1]}–${rangeMatch[2]}:1` })
      continue
    }
    const simpleMatch = seg.match(/([\d,\.]+)\s*(?:\(?\s*1\s*:\s*([\d,\.]+)\s*\)?)/)
    if (simpleMatch) {
      const val = parseFloat(simpleMatch[1].replace(',', '.'))
      results.push({ h: val, w: 1, label: seg.trim() })
      continue
    }
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

/** Street cross-section SVG: shows sidewalks, road, buildings, trees at proportional widths */
function StreetSection({ width, label, index }: { width: { min: number; max: number; label: string }; label: string; index: number }) {
  const avg = (width.min + width.max) / 2
  // Scale: 1m = 8px, capped at reasonable viewport
  const mScale = 8
  const streetPx = avg * mScale
  const sidewalkPx = Math.min(20, streetPx * 0.15)
  const bldgW = 28
  const totalW = bldgW + sidewalkPx + streetPx + sidewalkPx + bldgW + 40 // extra for labels
  const viewH = 110
  const groundY = viewH - 18

  // Buildings
  const bldgH = 50
  const leftBldgX = 10
  const leftSidewalkX = leftBldgX + bldgW
  const roadX = leftSidewalkX + sidewalkPx
  const rightSidewalkX = roadX + streetPx
  const rightBldgX = rightSidewalkX + sidewalkPx

  // Tree positions (one on each sidewalk)
  const treeY = groundY - 14
  const treeLX = leftSidewalkX + sidewalkPx / 2
  const treeRX = rightSidewalkX + sidewalkPx / 2

  // Dimension line
  const dimY = groundY + 12

  // Colors based on index
  const roadColors = ['fill-slate-300 dark:fill-slate-600', 'fill-slate-350 dark:fill-slate-550', 'fill-slate-300 dark:fill-slate-600']
  const roadColor = roadColors[index % roadColors.length]

  return (
    <div className="flex flex-col items-center">
      <p className="text-[10px] font-semibold text-neutral-600 dark:text-neutral-400 mb-1 transition-colors duration-500">
        {label}
      </p>
      <svg viewBox={`0 0 ${totalW} ${viewH}`} className="w-full" style={{ maxWidth: Math.max(200, totalW), maxHeight: 100 }}>
        {/* Sky gradient */}
        <defs>
          <linearGradient id={`sky-${index}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" className="[stop-color:theme(colors.sky.100)] dark:[stop-color:theme(colors.sky.900)]" stopOpacity="0.3" />
            <stop offset="100%" stopColor="transparent" />
          </linearGradient>
        </defs>

        {/* Left building */}
        <rect x={leftBldgX} y={groundY - bldgH} width={bldgW} height={bldgH}
          className="fill-neutral-300 dark:fill-neutral-600" rx="1" />
        {/* Windows on left building */}
        {[0, 1, 2].map(row => [0, 1].map(col => (
          <rect key={`lw-${row}-${col}`}
            x={leftBldgX + 5 + col * 12} y={groundY - bldgH + 8 + row * 15}
            width="8" height="10" rx="0.5"
            className="fill-sky-200/60 dark:fill-sky-700/40" />
        )))}

        {/* Left sidewalk */}
        <rect x={leftSidewalkX} y={groundY - 2} width={sidewalkPx} height={4}
          className="fill-amber-200 dark:fill-amber-800" rx="0.5" />

        {/* Road surface */}
        <rect x={roadX} y={groundY - 2} width={streetPx} height={4}
          className={roadColor} rx="0.5" />
        {/* Road center dashes */}
        {streetPx > 30 && Array.from({ length: Math.floor(streetPx / 16) }).map((_, i) => (
          <rect key={`dash-${i}`}
            x={roadX + 6 + i * 16} y={groundY - 0.5}
            width="8" height="1"
            className="fill-white/70 dark:fill-white/30" />
        ))}

        {/* Right sidewalk */}
        <rect x={rightSidewalkX} y={groundY - 2} width={sidewalkPx} height={4}
          className="fill-amber-200 dark:fill-amber-800" rx="0.5" />

        {/* Right building */}
        <rect x={rightBldgX} y={groundY - bldgH} width={bldgW} height={bldgH}
          className="fill-neutral-300 dark:fill-neutral-600" rx="1" />
        {/* Windows on right building */}
        {[0, 1, 2].map(row => [0, 1].map(col => (
          <rect key={`rw-${row}-${col}`}
            x={rightBldgX + 5 + col * 12} y={groundY - bldgH + 8 + row * 15}
            width="8" height="10" rx="0.5"
            className="fill-sky-200/60 dark:fill-sky-700/40" />
        )))}

        {/* Trees */}
        {sidewalkPx > 12 && (
          <>
            {/* Left tree */}
            <rect x={treeLX - 1} y={treeY + 4} width="2" height="10"
              className="fill-amber-700 dark:fill-amber-600" />
            <circle cx={treeLX} cy={treeY} r="6"
              className="fill-emerald-400 dark:fill-emerald-600" />
            <circle cx={treeLX - 3} cy={treeY + 2} r="4"
              className="fill-emerald-500 dark:fill-emerald-700" />
            <circle cx={treeLX + 3} cy={treeY + 2} r="4"
              className="fill-emerald-500 dark:fill-emerald-700" />
            {/* Right tree */}
            <rect x={treeRX - 1} y={treeY + 4} width="2" height="10"
              className="fill-amber-700 dark:fill-amber-600" />
            <circle cx={treeRX} cy={treeY} r="6"
              className="fill-emerald-400 dark:fill-emerald-600" />
            <circle cx={treeRX - 3} cy={treeY + 2} r="4"
              className="fill-emerald-500 dark:fill-emerald-700" />
            <circle cx={treeRX + 3} cy={treeY + 2} r="4"
              className="fill-emerald-500 dark:fill-emerald-700" />
          </>
        )}

        {/* Ground line */}
        <line x1={leftBldgX} y1={groundY + 2} x2={rightBldgX + bldgW}
          y2={groundY + 2} strokeWidth="0.5"
          className="stroke-neutral-300 dark:stroke-neutral-600" />

        {/* Width dimension */}
        <line x1={roadX} y1={dimY} x2={roadX + streetPx} y2={dimY}
          strokeWidth="0.8" className="stroke-blue-500 dark:stroke-blue-400"
          markerStart={`url(#arrL-${index})`} markerEnd={`url(#arrR-${index})`} />
        <text x={roadX + streetPx / 2} y={dimY - 3}
          textAnchor="middle" fontSize="9" fontWeight="700"
          className="fill-blue-600 dark:fill-blue-400">
          {width.label}
        </text>

        {/* Arrow markers */}
        <defs>
          <marker id={`arrL-${index}`} markerWidth="5" markerHeight="5" refX="0" refY="2.5" orient="auto">
            <path d="M5,0 L0,2.5 L5,5" fill="none" strokeWidth="0.8" className="stroke-blue-500 dark:stroke-blue-400" />
          </marker>
          <marker id={`arrR-${index}`} markerWidth="5" markerHeight="5" refX="5" refY="2.5" orient="auto">
            <path d="M0,0 L5,2.5 L0,5" fill="none" strokeWidth="0.8" className="stroke-blue-500 dark:stroke-blue-400" />
          </marker>
        </defs>
      </svg>
    </div>
  )
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
        <div className="p-3 bg-neutral-50 dark:bg-neutral-800/50 rounded-lg border border-neutral-200 dark:border-neutral-700 transition-colors duration-500">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-neutral-500 dark:text-neutral-400 mb-2 transition-colors duration-500">
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

      {/* Street Cross-Sections */}
      {widths.length > 0 && (
        <div className="p-3 bg-neutral-50 dark:bg-neutral-800/50 rounded-lg border border-neutral-200 dark:border-neutral-700 transition-colors duration-500">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-neutral-500 dark:text-neutral-400 mb-3 transition-colors duration-500">
            Street Cross-Sections
          </p>
          <div className={`grid gap-4 ${widths.length === 1 ? 'grid-cols-1 max-w-xs mx-auto' : widths.length === 2 ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'}`}>
            {widths.map((w, i) => (
              <StreetSection
                key={i}
                width={w}
                label={`Street ${i + 1}`}
                index={i}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

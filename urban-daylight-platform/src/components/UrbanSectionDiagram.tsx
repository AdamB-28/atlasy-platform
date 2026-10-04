import { useState, type ReactElement, type SVGProps } from 'react'
import { Maximize2 } from 'lucide-react'
import DiagramLightbox from './DiagramLightbox'
import { parseRatios, parseWidths } from '../utils/streetGeometry'

type EnlargeDiagram = (title: string, diagram: ReactElement<SVGProps<SVGSVGElement>>) => void

interface UrbanSectionDiagramProps {
  heightToWidthRatio: string | null
  streetWidth: string | null
  showNotes?: boolean
  sunAngle?: number
  sunFrom?: 'left' | 'right'
}

interface StreetGeometry {
  averageWidthM: number
  estimatedHeightM: number | null
  floorCount: number
  buildingDepthM: number
  scale: number
  buildingWidth: number
  sidewalkWidth: number
  roadWidth: number
  leftBuildingX: number
  leftSidewalkX: number
  roadX: number
  rightSidewalkX: number
  rightBuildingX: number
  totalWidth: number
  viewHeight: number
  groundY: number
}

function getStreetGeometry(width: { min: number; max: number }, heightToWidthRatio: number | null): StreetGeometry {
  const averageWidthM = (width.min + width.max) / 2
  const estimatedHeightM = heightToWidthRatio === null ? null : averageWidthM * heightToWidthRatio
  let scale = Math.max(2.6, Math.min(5.2, 110 / averageWidthM))
  if (estimatedHeightM !== null && estimatedHeightM * scale > 118) scale = 118 / estimatedHeightM

  const buildingDepthM = Math.max(8, Math.min(16, averageWidthM * 0.45))
  const buildingWidth = buildingDepthM * scale
  const facadeToFacadeWidth = averageWidthM * scale
  const sidewalkWidth = Math.max(10, Math.min(24, facadeToFacadeWidth * 0.12))
  const roadWidth = Math.max(8, facadeToFacadeWidth - sidewalkWidth * 2)
  const leftBuildingX = 30
  const leftSidewalkX = leftBuildingX + buildingWidth
  const roadX = leftSidewalkX + sidewalkWidth
  const rightSidewalkX = roadX + roadWidth
  const rightBuildingX = rightSidewalkX + sidewalkWidth
  const viewHeight = 158

  return {
    averageWidthM,
    estimatedHeightM,
    floorCount: estimatedHeightM === null ? 0 : Math.max(1, Math.round(estimatedHeightM / 3)),
    buildingDepthM,
    scale,
    buildingWidth,
    sidewalkWidth,
    roadWidth,
    leftBuildingX,
    leftSidewalkX,
    roadX,
    rightSidewalkX,
    rightBuildingX,
    totalWidth: rightBuildingX + buildingWidth + 30,
    viewHeight,
    groundY: viewHeight - 24,
  }
}

function StreetPlan({ width, label, geometry, onEnlarge, sunAngle, sunFrom }: { width: { label: string }; label: string; geometry: StreetGeometry; onEnlarge: EnlargeDiagram; sunAngle?: number; sunFrom: 'left' | 'right' }) {
  const { estimatedHeightM, buildingWidth, sidewalkWidth, roadWidth, leftBuildingX, leftSidewalkX, roadX, rightSidewalkX, rightBuildingX, totalWidth, viewHeight } = geometry
  const heightLabel = estimatedHeightM === null ? 'H not reported' : `H ≈ ${Math.round(estimatedHeightM)}m`
  const blockYs = [10, 52, 94]
  const blockHeight = 34
  const dimensionY = viewHeight - 10
  const shadowLength = sunAngle !== undefined && estimatedHeightM !== null
    ? geometry.scale * estimatedHeightM / Math.tan((sunAngle * Math.PI) / 180)
    : 0
  const sunLeft = sunFrom === 'left'
  const shadowStart = sunLeft ? leftBuildingX + buildingWidth : rightBuildingX
  const receivingFacade = sunLeft ? rightBuildingX : leftBuildingX + buildingWidth
  const shadowEnd = sunLeft ? shadowStart + shadowLength : shadowStart - shadowLength
  const shadowX = Math.min(shadowStart, shadowEnd)
  const shadowWidth = Math.abs(shadowEnd - shadowStart)
  const shadowPastFacade = Math.max(0, shadowLength - Math.abs(receivingFacade - shadowStart))
  const facadeShadeWidth = Math.min(buildingWidth, shadowPastFacade)
  const shadowBeyondBlockM = Math.max(0, shadowLength / geometry.scale - geometry.averageWidthM - geometry.buildingDepthM)
  const receivingBuildingX = sunLeft ? rightBuildingX : leftBuildingX
  const shadowContinues = shadowPastFacade > buildingWidth
  const continuationStartX = sunLeft ? rightBuildingX + buildingWidth : leftBuildingX
  const continuationEndX = sunLeft ? totalWidth - 4 : 4
  const sunX = sunFrom === 'left' ? leftBuildingX - 10 : rightBuildingX + buildingWidth + 10
  const carWidth = 1.8 * geometry.scale
  const carLength = 4.5 * geometry.scale
  const carX = roadX + roadWidth / 2 - carWidth / 2
  const carY = viewHeight / 2 - carLength / 2
  const treeRadius = Math.max(2, 1.25 * geometry.scale)
  const personRadius = Math.max(1.4, 0.22 * geometry.scale)
  const showSun = sunAngle !== undefined && estimatedHeightM !== null

  const diagram = (
      <svg viewBox={`0 0 ${totalWidth} ${viewHeight}`} className="block w-full" style={{ maxWidth: '100%', maxHeight: 140 }} role="img" aria-label={`${label} top view. Source facade-to-facade street width ${width.label}; ${heightLabel}; 4.5 metre car and 1.7 metre person shown at schematic scale.`}>
        <rect x={leftSidewalkX} y="8" width={sidewalkWidth} height={viewHeight - 28} className="fill-amber-100 dark:fill-amber-900/70" />
        <rect x={roadX} y="8" width={roadWidth} height={viewHeight - 28} className="fill-neutral-200 dark:fill-neutral-700" />
        <line x1={roadX + roadWidth / 2} y1="12" x2={roadX + roadWidth / 2} y2={dimensionY - 5} strokeDasharray="5 5" strokeWidth="1.5" className="stroke-white dark:stroke-neutral-400" />
        <rect x={rightSidewalkX} y="8" width={sidewalkWidth} height={viewHeight - 28} className="fill-amber-100 dark:fill-amber-900/70" />
        {blockYs.map((y, index) => (
          <g key={index}>
            <rect x={leftBuildingX} y={y} width={buildingWidth} height={blockHeight} rx="2" className="fill-neutral-300 dark:fill-neutral-600" />
            <rect x={rightBuildingX} y={y} width={buildingWidth} height={blockHeight} rx="2" className="fill-neutral-300 dark:fill-neutral-600" />
          </g>
        ))}
        {showSun && shadowWidth > 0 && <rect x={shadowX} y="8" width={shadowWidth} height={viewHeight - 28} className="fill-slate-800/30 dark:fill-slate-100/25" />}
        {showSun && facadeShadeWidth > 0 && blockYs.map((y) => (
          <rect key={`facade-shadow-${y}`} x={sunLeft ? receivingBuildingX : receivingBuildingX + buildingWidth - facadeShadeWidth} y={y} width={facadeShadeWidth} height={blockHeight} className="fill-slate-800/60 dark:fill-slate-100/45" />
        ))}
        {showSun && shadowContinues && (
          <g aria-hidden="true">
            <line x1={continuationStartX} y1={viewHeight / 2} x2={continuationEndX} y2={viewHeight / 2} className="stroke-slate-700 dark:stroke-slate-200" strokeWidth="1" strokeDasharray="3 2" />
            <polygon points={sunLeft ? `${continuationEndX},${viewHeight / 2} ${continuationEndX - 4},${viewHeight / 2 - 2.5} ${continuationEndX - 4},${viewHeight / 2 + 2.5}` : `${continuationEndX},${viewHeight / 2} ${continuationEndX + 4},${viewHeight / 2 - 2.5} ${continuationEndX + 4},${viewHeight / 2 + 2.5}`} className="fill-slate-700 dark:fill-slate-200" />
          </g>
        )}
        <text x={leftBuildingX + buildingWidth / 2} y={viewHeight / 2 + 3} textAnchor="middle" fontSize="7" fontWeight="700" className="fill-red-700 dark:fill-red-300" transform={`rotate(-90, ${leftBuildingX + buildingWidth / 2}, ${viewHeight / 2})`}>{heightLabel}</text>
        <text x={rightBuildingX + buildingWidth / 2} y={viewHeight / 2 + 3} textAnchor="middle" fontSize="7" fontWeight="700" className="fill-red-700 dark:fill-red-300" transform={`rotate(-90, ${rightBuildingX + buildingWidth / 2}, ${viewHeight / 2})`}>{heightLabel}</text>
        {[30, 112].flatMap((position) => [leftSidewalkX + sidewalkWidth / 2, rightSidewalkX + sidewalkWidth / 2].map((treeX, side) => (
          <g key={`tree-${position}-${side}`}>
            <circle cx={treeX} cy={position} r={treeRadius} className="fill-emerald-400 dark:fill-emerald-600" />
            <circle cx={treeX - treeRadius * 0.38} cy={position - treeRadius * 0.1} r={treeRadius * 0.68} className="fill-emerald-500 dark:fill-emerald-700" />
            <circle cx={treeX + treeRadius * 0.38} cy={position - treeRadius * 0.1} r={treeRadius * 0.68} className="fill-emerald-500 dark:fill-emerald-700" />
            <circle cx={treeX} cy={position + treeRadius * 0.35} r={treeRadius * 0.52} className="fill-emerald-600 dark:fill-emerald-800" />
          </g>
        )))}
        <rect x={carX} y={carY} width={carWidth} height={carLength} rx={carWidth * 0.25} className="fill-slate-600 stroke-white dark:fill-slate-300 dark:stroke-neutral-700" strokeWidth="1" />
        <rect x={carX + carWidth * 0.16} y={carY + carLength * 0.12} width={carWidth * 0.68} height={carLength * 0.16} rx="1" className="fill-slate-500 dark:fill-slate-400" />
        <rect x={carX + carWidth * 0.2} y={carY + carLength * 0.32} width={carWidth * 0.6} height={carLength * 0.3} rx="1" className="fill-sky-200 dark:fill-sky-800" />
        <rect x={carX + carWidth * 0.2} y={carY + carLength * 0.68} width={carWidth * 0.6} height={carLength * 0.16} rx="1" className="fill-slate-500 dark:fill-slate-400" />
        {[0.18, 0.82].map((position) => (
          <rect key={position} x={carX - carWidth * 0.08} y={carY + carLength * position} width={carWidth * 1.16} height={carWidth * 0.14} rx="1" className="fill-neutral-900 dark:fill-neutral-800" />
        ))}
        <circle cx={leftSidewalkX + sidewalkWidth / 2} cy="72" r={personRadius} className="fill-neutral-950 dark:fill-white" />
        <line x1={leftSidewalkX + sidewalkWidth / 2} y1={72 + personRadius} x2={leftSidewalkX + sidewalkWidth / 2} y2={72 + personRadius * 2.6} strokeWidth={Math.max(1, personRadius * 0.7)} className="stroke-neutral-950 dark:stroke-white" />
        {showSun && (
          <g aria-hidden="true">
            <circle cx={sunX} cy="18" r="4" className="fill-amber-400 stroke-amber-600" strokeWidth="1" />
            <text x={sunX} y="29" textAnchor="middle" fontSize="6" fontWeight="700" className="fill-amber-800 dark:fill-amber-200">{sunAngle}°</text>
            <line x1={sunFrom === 'left' ? leftSidewalkX : rightBuildingX} y1="18" x2={sunFrom === 'left' ? rightBuildingX : leftSidewalkX} y2="18" className="stroke-amber-500" strokeWidth="1" strokeDasharray="3 3" />
          </g>
        )}
        <line x1={leftSidewalkX} y1={dimensionY} x2={rightBuildingX} y2={dimensionY} strokeWidth="1" className="stroke-blue-600 dark:stroke-blue-400" />
        <line x1={leftSidewalkX} y1={dimensionY - 4} x2={leftSidewalkX} y2={dimensionY + 2} strokeWidth="1" className="stroke-blue-600 dark:stroke-blue-400" />
        <line x1={rightBuildingX} y1={dimensionY - 4} x2={rightBuildingX} y2={dimensionY + 2} strokeWidth="1" className="stroke-blue-600 dark:stroke-blue-400" />
        <text x={(leftSidewalkX + rightBuildingX) / 2} y={dimensionY - 3} textAnchor="middle" fontSize="8" fontWeight="700" className="fill-blue-700 dark:fill-blue-300">W {width.label}</text>
    </svg>
  )

  return (
    <div>
      <p className="mb-1 text-[10px] font-semibold text-neutral-600 dark:text-neutral-400">{label} · Top view</p>
      <button type="button" onClick={() => onEnlarge(`${label} · Top view`, diagram)} aria-label={`Enlarge ${label} top view`} title="Enlarge diagram" className="group relative block w-full cursor-zoom-in rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500">
        {diagram}
        <span className="absolute right-2 top-2 inline-flex h-8 w-8 items-center justify-center rounded bg-white/90 text-neutral-700 opacity-70 shadow-sm transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100 dark:bg-neutral-900/90 dark:text-white" aria-hidden="true"><Maximize2 className="h-4 w-4" /></span>
      </button>
      {showSun && shadowContinues && <p className="mt-1 text-[10px] font-medium text-neutral-600 dark:text-neutral-300">Dashed arrow · projection continues ≈{Math.round(shadowBeyondBlockM)}m beyond the shown blocks</p>}
    </div>
  )
}

/** Street cross-section SVG with meter-based assumptions (e.g. ~3m floor height). */
function StreetSection({
  widthLabel,
  label,
  index,
  geometry,
  onEnlarge,
  sunAngle,
  sunFrom,
}: {
  widthLabel: string
  label: string
  index: number
  geometry: StreetGeometry
  onEnlarge: EnlargeDiagram
  sunAngle?: number
  sunFrom: 'left' | 'right'
}) {
  if (geometry.estimatedHeightM === null) return null

  const buildingHeightM = geometry.estimatedHeightM
  const floorCount = geometry.floorCount
  const treeHeightM = Math.max(6, Math.min(12, buildingHeightM * 0.35))
  const scale = geometry.scale
  const sidewalkPx = geometry.sidewalkWidth
  const streetPx = geometry.roadWidth
  const bldgW = geometry.buildingWidth
  const totalW = geometry.totalWidth
  const viewH = geometry.viewHeight
  const groundY = geometry.groundY
  const bldgH = buildingHeightM * scale
  const floorBandPx = bldgH / floorCount
  const windowColumns = Math.max(2, Math.min(7, Math.floor(geometry.buildingDepthM / 2.2)))
  const windowW = Math.max(3.5, Math.min(8, (bldgW - 8) / (windowColumns * 1.7)))
  const windowH = Math.max(3, Math.min(8, floorBandPx * 0.5))
  const windowGap = (bldgW - windowColumns * windowW) / (windowColumns + 1)
  const leftBldgX = geometry.leftBuildingX
  const leftSidewalkX = geometry.leftSidewalkX
  const roadX = geometry.roadX
  const rightSidewalkX = geometry.rightSidewalkX
  const rightBldgX = geometry.rightBuildingX

  // Tree positions (one on each sidewalk)
  const treeHeightPx = treeHeightM * scale
  const treeCrownR = Math.max(3, Math.min(7, treeHeightPx * 0.16))
  const trunkW = Math.max(2, Math.min(4, treeCrownR * 0.35))
  const trunkH = Math.max(8, treeHeightPx - treeCrownR * 1.7)
  const treeY = groundY - trunkH - treeCrownR
  const treeLX = leftSidewalkX + sidewalkPx * 0.25
  const treeRX = rightSidewalkX + sidewalkPx * 0.75
  const carWidth = 1.8 * scale
  const carHeight = 1.5 * scale
  const carX = roadX + streetPx * 0.28
  const carY = groundY - carHeight
  const personHeight = 1.7 * scale
  const personWidth = 0.45 * scale
  const personX = leftSidewalkX + sidewalkPx * 0.78
  const personY = groundY - personHeight
  const personHeadRadius = Math.max(0.8, 0.12 * scale)
  const showSun = sunAngle !== undefined
  const sunFromLeft = sunFrom === 'left'
  const angleRadians = ((sunAngle ?? 35) * Math.PI) / 180
  const shadowLength = bldgH / Math.tan(angleRadians)
  const roofY = groundY - bldgH
   const shadowStart = sunFromLeft ? leftBldgX + bldgW : rightBldgX
  const receivingFacade = sunFromLeft ? rightBldgX : leftBldgX + bldgW
  const shadowEnd = sunFromLeft ? shadowStart + shadowLength : shadowStart - shadowLength
  const facadeShadeHeight = Math.max(
    0,
    Math.min(bldgH, (shadowLength - Math.abs(receivingFacade - shadowStart)) * Math.tan(angleRadians)),
  )
  const shadowBeyondBlockM = Math.max(0, shadowLength / scale - geometry.averageWidthM - geometry.buildingDepthM)
  const receivingBuildingX = sunFromLeft ? rightBldgX : leftBldgX
  const shadowContinues = shadowLength > Math.abs(receivingFacade - shadowStart) + bldgW
  const continuationStartX = sunFromLeft ? rightBldgX + bldgW : leftBldgX
  const continuationEndX = sunFromLeft ? Math.min(totalW - 4, shadowStart + shadowLength) : Math.max(4, shadowStart - shadowLength)
  const continuationStartY = roofY + Math.abs(continuationStartX - shadowStart) * Math.tan(angleRadians)
  const continuationEndY = roofY + Math.abs(continuationEndX - shadowStart) * Math.tan(angleRadians)
  const rayTargetX = shadowStart
  const rayHorizontal = showSun
    ? Math.max(2, Math.min(60, (sunFromLeft ? rayTargetX - 10 : totalW - rayTargetX - 10), Math.max(2, (roofY - 12) / Math.tan(angleRadians))))
    : 0
  const sunX = sunFromLeft ? rayTargetX - rayHorizontal : rayTargetX + rayHorizontal
  const sunY = roofY - Math.tan(angleRadians) * rayHorizontal

  // Dimension line
  const dimY = groundY + 12

  // Colors based on index
  const roadColors = ['fill-slate-300 dark:fill-slate-600', 'fill-slate-350 dark:fill-slate-550', 'fill-slate-300 dark:fill-slate-600']
  const roadColor = roadColors[index % roadColors.length]

  const diagram = (
    <svg viewBox={`0 0 ${totalW} ${viewH}`} className="block w-full" role="img" aria-label={`${label} cross-section. Source facade-to-facade street width W ${widthLabel}; estimated building height H about ${Math.round(buildingHeightM)} metres.`} style={{ maxWidth: '100%', maxHeight: 140 }}>
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
        {Array.from({ length: floorCount }).map((_, row) => {
          const y = groundY - (row + 1) * floorBandPx + (floorBandPx - windowH) / 2

          return Array.from({ length: windowColumns }).map((__, col) => (
            <rect
              key={`lw-${row}-${col}`}
              x={leftBldgX + windowGap + col * (windowW + windowGap)}
              y={y}
              width={windowW}
              height={windowH}
              rx="0.5"
              className="fill-sky-200/60 dark:fill-sky-700/40"
            />
          ))
        })}

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

        {showSun && (
          <g aria-hidden="true">
            <line x1={sunX} y1={sunY} x2={rayTargetX} y2={roofY} className="stroke-amber-500" strokeWidth="1.5" strokeDasharray="4 3" />
            <circle cx={sunX} cy={sunY} r="4" className="fill-amber-400 stroke-amber-600" strokeWidth="1" />
          </g>
        )}

        {/* Right building */}
        <rect x={rightBldgX} y={groundY - bldgH} width={bldgW} height={bldgH}
          className="fill-neutral-300 dark:fill-neutral-600" rx="1" />
        {/* Windows on right building */}
        {Array.from({ length: floorCount }).map((_, row) => {
          const y = groundY - (row + 1) * floorBandPx + (floorBandPx - windowH) / 2

          return Array.from({ length: windowColumns }).map((__, col) => (
            <rect
              key={`rw-${row}-${col}`}
              x={rightBldgX + windowGap + col * (windowW + windowGap)}
              y={y}
              width={windowW}
              height={windowH}
              rx="0.5"
              className="fill-sky-200/60 dark:fill-sky-700/40"
            />
          ))
        })}

        {showSun && shadowEnd !== shadowStart && (
          <polygon points={`${shadowStart},${groundY} ${shadowStart},${roofY} ${shadowEnd},${groundY}`} className="fill-slate-800/35 dark:fill-slate-100/30" />
        )}
        {showSun && facadeShadeHeight > 0 && (
          <rect x={receivingBuildingX} y={groundY - facadeShadeHeight} width={bldgW} height={facadeShadeHeight} className="fill-slate-800/60 dark:fill-slate-100/45" />
        )}
        {showSun && shadowContinues && (
          <g aria-hidden="true">
            <line x1={continuationStartX} y1={continuationStartY} x2={continuationEndX} y2={continuationEndY} className="stroke-slate-700 dark:stroke-slate-200" strokeWidth="1.5" strokeDasharray="3 2" />
            {continuationEndY < groundY && (
              <polygon points={sunFromLeft ? `${continuationEndX},${continuationEndY} ${continuationEndX - 4},${continuationEndY - 2.5} ${continuationEndX - 4},${continuationEndY + 2.5}` : `${continuationEndX},${continuationEndY} ${continuationEndX + 4},${continuationEndY - 2.5} ${continuationEndX + 4},${continuationEndY + 2.5}`} className="fill-slate-700 dark:fill-slate-200" />
            )}
          </g>
        )}

        {/* Schematic car: 4.5 m long and 1.8 m wide, shown front-on in this section. */}
        <path d={`M ${carX} ${groundY} L ${carX} ${carY + carHeight * 0.45} Q ${carX} ${carY + carHeight * 0.25} ${carX + carWidth * 0.25} ${carY + carHeight * 0.25} L ${carX + carWidth * 0.75} ${carY + carHeight * 0.25} Q ${carX + carWidth} ${carY + carHeight * 0.25} ${carX + carWidth} ${carY + carHeight * 0.45} L ${carX + carWidth} ${groundY} Z`} className="fill-slate-700 stroke-white dark:fill-slate-300 dark:stroke-neutral-800" strokeWidth="0.8" />
        <path d={`M ${carX + carWidth * 0.22} ${carY + carHeight * 0.48} L ${carX + carWidth * 0.32} ${carY + carHeight * 0.31} L ${carX + carWidth * 0.68} ${carY + carHeight * 0.31} L ${carX + carWidth * 0.78} ${carY + carHeight * 0.48} Z`} className="fill-sky-200 dark:fill-sky-800" />
        <rect x={carX + carWidth * 0.27} y={carY + carHeight * 0.65} width={carWidth * 0.46} height={carHeight * 0.09} rx="1" className="fill-neutral-500 dark:fill-neutral-400" />
        <rect x={carX + carWidth * 0.06} y={carY + carHeight * 0.55} width={carWidth * 0.16} height={carHeight * 0.12} rx="1" className="fill-amber-200" />
        <rect x={carX + carWidth * 0.78} y={carY + carHeight * 0.55} width={carWidth * 0.16} height={carHeight * 0.12} rx="1" className="fill-amber-200" />
        <circle cx={carX + carWidth * 0.25} cy={groundY - 1} r={Math.max(1, 0.12 * scale)} className="fill-neutral-900 dark:fill-neutral-200" />
        <circle cx={carX + carWidth * 0.75} cy={groundY - 1} r={Math.max(1, 0.12 * scale)} className="fill-neutral-900 dark:fill-neutral-200" />

        {/* Schematic pedestrian: 1.7 m tall, positioned on the sidewalk. */}
        <circle cx={personX} cy={personY + personHeadRadius} r={personHeadRadius} className="fill-neutral-900 dark:fill-neutral-100" />
        <rect x={personX - personWidth * 0.25} y={personY + personHeadRadius * 2} width={personWidth * 0.5} height={personHeight * 0.4} rx={personWidth * 0.2} className="fill-neutral-900 dark:fill-neutral-100" />
        <line x1={personX - personWidth * 0.36} y1={personY + personHeight * 0.42} x2={personX + personWidth * 0.36} y2={personY + personHeight * 0.42} className="stroke-neutral-900 dark:stroke-neutral-100" strokeWidth={Math.max(1, personWidth * 0.28)} />
        <line x1={personX} y1={groundY - personHeight * 0.35} x2={personX - personWidth * 0.3} y2={groundY} className="stroke-neutral-900 dark:stroke-neutral-100" strokeWidth={Math.max(1, personWidth * 0.3)} />
        <line x1={personX} y1={groundY - personHeight * 0.35} x2={personX + personWidth * 0.3} y2={groundY} className="stroke-neutral-900 dark:stroke-neutral-100" strokeWidth={Math.max(1, personWidth * 0.3)} />

        {/* Trees */}
        {sidewalkPx > 12 && (
          <>
            {/* Left tree */}
            <rect x={treeLX - trunkW / 2} y={treeY + treeCrownR * 0.9} width={trunkW} height={trunkH}
              className="fill-amber-700 dark:fill-amber-600" />
            <circle cx={treeLX} cy={treeY} r={treeCrownR}
              className="fill-emerald-400 dark:fill-emerald-600" />
            <circle cx={treeLX - treeCrownR * 0.45} cy={treeY + treeCrownR * 0.25} r={treeCrownR * 0.68}
              className="fill-emerald-500 dark:fill-emerald-700" />
            <circle cx={treeLX + treeCrownR * 0.45} cy={treeY + treeCrownR * 0.25} r={treeCrownR * 0.68}
              className="fill-emerald-500 dark:fill-emerald-700" />
            {/* Right tree */}
            <rect x={treeRX - trunkW / 2} y={treeY + treeCrownR * 0.9} width={trunkW} height={trunkH}
              className="fill-amber-700 dark:fill-amber-600" />
            <circle cx={treeRX} cy={treeY} r={treeCrownR}
              className="fill-emerald-400 dark:fill-emerald-600" />
            <circle cx={treeRX - treeCrownR * 0.45} cy={treeY + treeCrownR * 0.25} r={treeCrownR * 0.68}
              className="fill-emerald-500 dark:fill-emerald-700" />
            <circle cx={treeRX + treeCrownR * 0.45} cy={treeY + treeCrownR * 0.25} r={treeCrownR * 0.68}
              className="fill-emerald-500 dark:fill-emerald-700" />
          </>
        )}

        {/* Ground line */}
        <line x1={leftBldgX} y1={groundY + 2} x2={rightBldgX + bldgW}
          y2={groundY + 2} strokeWidth="0.5"
          className="stroke-neutral-300 dark:stroke-neutral-600" />

        {/* Estimated building-height dimension */}
        <line x1={leftBldgX - 5} y1={groundY} x2={leftBldgX - 5} y2={groundY - bldgH}
          strokeWidth="0.8" className="stroke-red-500 dark:stroke-red-400" />
        <line x1={leftBldgX - 7} y1={groundY} x2={leftBldgX - 3} y2={groundY}
          strokeWidth="0.8" className="stroke-red-500 dark:stroke-red-400" />
        <line x1={leftBldgX - 7} y1={groundY - bldgH} x2={leftBldgX - 3} y2={groundY - bldgH}
          strokeWidth="0.8" className="stroke-red-500 dark:stroke-red-400" />
        <text x={leftBldgX - 9} y={groundY - bldgH / 2} textAnchor="middle" fontSize="7" fontWeight="700"
          className="fill-red-600 dark:fill-red-400" transform={`rotate(-90, ${leftBldgX - 9}, ${groundY - bldgH / 2})`}>
          H ≈ {Math.round(buildingHeightM)}m
        </text>

        {/* Width dimension */}
        <line x1={leftSidewalkX} y1={dimY} x2={rightBldgX} y2={dimY}
          strokeWidth="0.8" className="stroke-blue-500 dark:stroke-blue-400"
          markerStart={`url(#arrL-${index})`} markerEnd={`url(#arrR-${index})`} />
        <line x1={leftSidewalkX} y1={dimY - 3} x2={leftSidewalkX} y2={dimY + 2} strokeWidth="0.8" className="stroke-blue-500 dark:stroke-blue-400" />
        <line x1={rightBldgX} y1={dimY - 3} x2={rightBldgX} y2={dimY + 2} strokeWidth="0.8" className="stroke-blue-500 dark:stroke-blue-400" />
        <text x={(leftSidewalkX + rightBldgX) / 2} y={dimY - 3}
          textAnchor="middle" fontSize="9" fontWeight="700"
          className="fill-blue-600 dark:fill-blue-400">
          W {widthLabel}
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
  )

  return (
    <div className="flex flex-col items-center">
      <p className="text-[10px] font-semibold text-neutral-600 dark:text-neutral-400 mb-1 transition-colors duration-500">
        {label} · Cross-section
      </p>
      <button type="button" onClick={() => onEnlarge(`${label} · Cross-section`, diagram)} aria-label={`Enlarge ${label} cross-section`} title="Enlarge diagram" className="group relative block w-full cursor-zoom-in rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500">
        {diagram}
        <span className="absolute right-2 top-2 inline-flex h-8 w-8 items-center justify-center rounded bg-white/90 text-neutral-700 opacity-70 shadow-sm transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100 dark:bg-neutral-900/90 dark:text-white" aria-hidden="true"><Maximize2 className="h-4 w-4" /></span>
      </button>
      {showSun && shadowContinues && <p className="mt-1 text-center text-[10px] font-medium text-neutral-600 dark:text-neutral-300">Dashed arrow · unobstructed projection continues ≈{Math.round(shadowBeyondBlockM)}m beyond the opposite block</p>}
    </div>
  )
}

export default function UrbanSectionDiagram({ heightToWidthRatio, streetWidth, showNotes = true, sunAngle, sunFrom = 'left' }: UrbanSectionDiagramProps) {
  const [enlargedDiagram, setEnlargedDiagram] = useState<{ title: string; diagram: ReactElement<SVGProps<SVGSVGElement>> } | null>(null)
  const ratios = heightToWidthRatio ? parseRatios(heightToWidthRatio) : []
  const widths = streetWidth ? parseWidths(streetWidth) : []
  const ratioValues = ratios.map((ratio) => ratio.h / (ratio.w || 1))
  const streetRatios = widths.map((_, index) => {
    if (ratioValues.length === 1) return ratioValues[0]
    if (ratioValues.length === widths.length) return ratioValues[index]
    return null
  })

  if (ratios.length === 0 && widths.length === 0) return null

  const viewWidth = 300
  const viewHeight = 160
  const groundY = viewHeight - 25
  const maxBuildingH = groundY - 20
  const onEnlarge: EnlargeDiagram = (title, diagram) => setEnlargedDiagram({ title, diagram })

  return (
    <div className="space-y-4">
      {showNotes && (
        <p className="max-w-4xl text-xs leading-relaxed text-neutral-600 dark:text-neutral-400">
          H:W compares building height (H) with road width (W). Blue W is measured; red H is estimated from the paired ratio and average width. Floor rows use about 3 m per storey; window bays scale with estimated facade width and are schematic.
        </p>
      )}
      {/* H/W Ratio Diagram */}
      {ratios.length > 0 && (
        <div className="p-3 bg-neutral-50 dark:bg-neutral-800/50 rounded-lg border border-neutral-200 dark:border-neutral-700 transition-colors duration-500">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-neutral-500 dark:text-neutral-400 mb-2 transition-colors duration-500">
            Height-to-Width Section
          </p>
          {showNotes && <p className="mb-2 text-xs text-neutral-600 dark:text-neutral-400">Source H:W ratios shown as normalized profiles, not metre-scaled building heights.</p>}
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
          {showNotes && <p className="mb-3 text-xs leading-relaxed text-neutral-600 dark:text-neutral-400">Ratios pair with widths in source order when counts match; one ratio applies to every listed street. When pairing is ambiguous, no height is inferred. Top-view footprints, sidewalks, and trees are schematic.</p>}
          <div className={`grid gap-4 ${widths.length === 1 ? 'grid-cols-1 max-w-xs mx-auto' : widths.length === 2 ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-1 sm:grid-cols-2 2xl:grid-cols-3'}`}>
            {widths.map((w, i) => {
              const label = `Street ${i + 1}`
              const geometry = getStreetGeometry(w, streetRatios[i])
              return (
                <div key={i} className="min-w-0 space-y-3">
                  {streetRatios[i] !== null ? (
                    <StreetSection widthLabel={w.label} label={label} index={i} geometry={geometry} onEnlarge={onEnlarge} sunAngle={sunAngle} sunFrom={sunFrom} />
                  ) : (
                    <p className="text-[10px] text-neutral-500 dark:text-neutral-400">{label} · Cross-section unavailable: no unambiguous source H:W ratio.</p>
                  )}
                  <StreetPlan width={w} label={label} geometry={geometry} onEnlarge={onEnlarge} sunAngle={sunAngle} sunFrom={sunFrom} />
                </div>
              )
            })}
          </div>
        </div>
      )}
      {enlargedDiagram && (
        <DiagramLightbox
          title={enlargedDiagram.title}
          diagram={enlargedDiagram.diagram}
          onClose={() => setEnlargedDiagram(null)}
        />
      )}
    </div>
  )
}

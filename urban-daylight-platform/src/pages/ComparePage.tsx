import { useEffect, useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { ArrowLeft, ArrowLeftRight, ChevronDown, ChevronUp, Lightbulb, Minus, TrendingDown, TrendingUp } from 'lucide-react'
import Layout from '../components/Layout'
import SafeImage from '../components/SafeImage'
import { LoadingSpinner, NoData } from '../components/LoadingStates'
import { ComparisonDistributionChart } from '../components/DistributionChart'
import SolarEnergyTable from '../components/SolarEnergyTable'
import UrbanSectionDiagram from '../components/UrbanSectionDiagram'
import StreetSunSimulator from '../components/StreetSunSimulator'
import { useCities, useCity } from '../hooks/useCitiesData'
import { findImageLink, formatMetricValue, getCityFolderName, hasData, tempSourcePath, valueContainsUnit } from '../utils/helpers'
import AdminDataPanel from '../components/AdminDataPanel'
import type { ImageLink } from '../types'
import { generateDaylightInsights, generateUrbanFormInsights, generateUrbanMorphologyInsights } from '../utils/insights'
import { getFirstStreetSimulationInput } from '../utils/streetGeometry'

type CompareMode = 'between' | 'same'

interface Insight {
  title: string
  content: string
  category: 'better' | 'neutral' | 'worse'
}

export default function ComparePage() {
  const { cityAId, cityBId, cityId } = useParams<{ cityAId?: string; cityBId?: string; cityId?: string }>()
  const [searchParams, setSearchParams] = useSearchParams()
  const navigate = useNavigate()
  const { cities } = useCities()
  const [showUrbanFormInsights, setShowUrbanFormInsights] = useState(false)
  const [showMorphologyInsights, setShowMorphologyInsights] = useState(false)
  const [showDaylightInsights, setShowDaylightInsights] = useState(false)

  const routeSameCity = Boolean(cityId)
  const modeFromUrl = searchParams.get('mode') === 'same' ? 'same' : 'between'
  const mode: CompareMode = routeSameCity ? 'same' : modeFromUrl

  const selectedCityAId = cityId ?? cityAId ?? ''
  const selectedCityBId = mode === 'same' ? selectedCityAId : (cityBId ?? '')

  const { city: cityA, loading: loadingA } = useCity(selectedCityAId)
  const { city: cityB, loading: loadingB } = useCity(selectedCityBId)

  const resolveQuarterId = (cityKey: 'quarterA' | 'quarterB', city: typeof cityA | null) => {
    const fallback = city?.analysisUnits[0]?.id
    if (!fallback) return null

    const raw = searchParams.get(cityKey.replace('quarter', 'unit')) ?? searchParams.get(cityKey)
    if (!raw) return fallback

    return city.analysisUnits.some((quarter) => String(quarter.id) === raw) ? raw : fallback
  }

  const quarterAId = resolveQuarterId('quarterA', cityA)
  const quarterBId = resolveQuarterId('quarterB', cityB)
  const quarterA = cityA?.analysisUnits.find((quarter) => String(quarter.id) === String(quarterAId)) ?? cityA?.analysisUnits[0] ?? null
  const quarterB = cityB?.analysisUnits.find((quarter) => String(quarter.id) === String(quarterBId)) ?? cityB?.analysisUnits[0] ?? null

  useEffect(() => {
    if (!cityA || !cityB) return

    const next = new URLSearchParams(searchParams)
    let changed = false

    if (next.get('mode') !== mode) {
      next.set('mode', mode)
      changed = true
    }

    if (quarterA?.id && next.get('unitA') !== String(quarterA.id)) {
      next.set('unitA', String(quarterA.id))
      changed = true
    }

    if (quarterB?.id && next.get('unitB') !== String(quarterB.id)) {
      next.set('unitB', String(quarterB.id))
      changed = true
    }

    if (mode === 'same' && quarterA?.id && quarterB?.id && String(quarterA.id) === String(quarterB.id) && cityA.analysisUnits.length > 1) {
      const alternative = cityA.analysisUnits.find((quarter) => String(quarter.id) !== String(quarterA.id))
      if (alternative) {
        next.set('unitB', String(alternative.id))
        changed = true
      }
    }

    if (changed) {
      setSearchParams(next, { replace: true })
    }
  }, [cityA, cityB, mode, quarterA?.id, quarterB?.id, searchParams, setSearchParams])

  if (loadingA || loadingB) return <Layout><LoadingSpinner /></Layout>
  if (!cityA || !cityB) return <Layout><NoData message="Cities not found" /></Layout>
  if (!quarterA || !quarterB) return <Layout><NoData message="Analysis unit data not found" /></Layout>

  const cityFolderA = getCityFolderName(cityA.name)
  const cityFolderB = getCityFolderName(cityB.name)

  const getImagePathA = (imageName: string | null) => (imageName ? `${import.meta.env.BASE_URL}${cityFolderA}/${imageName}.PNG` : '')
  const getImagePathB = (imageName: string | null) => (imageName ? `${import.meta.env.BASE_URL}${cityFolderB}/${imageName}.PNG` : '')

  const panelNameA = mode === 'same' ? `${cityA.name} - ${quarterA?.name ?? 'Analysis unit'}` : cityA.name
  const panelNameB = mode === 'same' ? `${cityB.name} - ${quarterB?.name ?? 'Analysis unit'}` : cityB.name
  const sameAnalysisScale = (quarterA.comparisonKey ?? quarterA.analysisLevel) === (quarterB.comparisonKey ?? quarterB.analysisLevel)

  const urbanFormInsights = mode === 'same' ? [] : generateUrbanFormInsights(cityA, cityB)
  const morphologyInsights = generateUrbanMorphologyInsights(cityA, cityB, quarterA, quarterB, panelNameA, panelNameB)
  const daylightInsights = sameAnalysisScale
    ? generateDaylightInsights(cityA, cityB, quarterA, quarterB, panelNameA, panelNameB)
    : []

  const queryString = (nextMode: CompareMode, nextQuarterA?: number | string, nextQuarterB?: number | string) => {
    const params = new URLSearchParams()
    params.set('mode', nextMode)
    if (nextQuarterA) params.set('unitA', String(nextQuarterA))
    if (nextQuarterB) params.set('unitB', String(nextQuarterB))
    return `?${params.toString()}`
  }

  const switchToBetweenMode = () => {
    const defaultCityB = cities.find((city) => city.id !== cityA.id)
    if (!defaultCityB) return
    navigate(`/compare/${cityA.id}/${defaultCityB.id}${queryString('between', quarterA?.id, defaultCityB.analysisUnits[0]?.id)}`)
  }

  const switchToSameMode = () => {
    const alternativeQuarter = cityA.analysisUnits.find((quarter) => quarter.id !== quarterA?.id)
    navigate(`/compare/${cityA.id}${queryString('same', quarterA?.id, alternativeQuarter?.id ?? quarterA?.id)}`)
  }

  const updateQuarterParams = (nextQuarterA?: number | string, nextQuarterB?: number | string) => {
    const next = new URLSearchParams(searchParams)
    if (nextQuarterA) next.set('unitA', String(nextQuarterA))
    if (nextQuarterB) next.set('unitB', String(nextQuarterB))
    next.set('mode', mode)
    setSearchParams(next)
  }

  const onQuarterAChange = (value: string) => {
    const parsed = value
    if (!parsed) return

    if (mode === 'same' && quarterB && String(quarterB.id) === parsed && cityA.analysisUnits.length > 1) {
      const alternative = cityA.analysisUnits.find((quarter) => String(quarter.id) !== parsed)
      updateQuarterParams(parsed, alternative?.id)
      return
    }

    updateQuarterParams(parsed, quarterB?.id)
  }

  const onQuarterBChange = (value: string) => {
    const parsed = value
    if (!parsed) return
    if (mode === 'same' && quarterA && parsed === String(quarterA.id) && cityA.analysisUnits.length > 1) return
    updateQuarterParams(quarterA?.id, parsed)
  }

  const InsightsSection = ({ insights, isOpen, onToggle }: { insights: Insight[]; isOpen: boolean; onToggle: () => void }) => {
    if (!insights.length) return null

    return (
      <div className="mt-4">
        <button onClick={onToggle} className="w-full flex items-center justify-between p-3 bg-primary-100 dark:bg-primary-900/30 hover:bg-primary-200 dark:hover:bg-primary-800/30 rounded-lg transition-colors duration-500 border border-primary-200 dark:border-primary-700">
          <div className="flex items-center gap-2">
            <Lightbulb className="w-4 h-4 text-primary-600 dark:text-primary-400" />
            <span className="text-sm font-semibold text-primary-900 dark:text-primary-100 transition-colors duration-500">{isOpen ? 'Hide' : 'Show'} Educational Insights ({insights.length})</span>
          </div>
          {isOpen ? <ChevronUp className="w-4 h-4 text-primary-600 dark:text-primary-400" /> : <ChevronDown className="w-4 h-4 text-primary-600 dark:text-primary-400" />}
        </button>

        {isOpen && (
          <div className="mt-3 space-y-3 animate-in fade-in slide-in-from-top-2 duration-300">
            {insights.map((insight, idx) => (
              <div key={idx} className="p-4 bg-white dark:bg-neutral-800 rounded-lg border border-primary-200 dark:border-primary-700 shadow-sm transition-colors duration-500">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 mt-1">
                    {insight.category === 'better' && <TrendingUp className="w-5 h-5 text-green-600" />}
                    {insight.category === 'worse' && <TrendingDown className="w-5 h-5 text-orange-600" />}
                    {insight.category === 'neutral' && <Minus className="w-5 h-5 text-neutral-400" />}
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-neutral-900 dark:text-white mb-1 transition-colors duration-500">{insight.title}</h4>
                    <p className="text-sm text-neutral-700 dark:text-neutral-300 leading-relaxed transition-colors duration-500">{insight.content}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    )
  }

  const ComparisonMetric = ({ label, valueA, valueB, unit }: { label: string; valueA: string | number | null | undefined; valueB: string | number | null | undefined; unit?: string }) => {
    const hasA = hasData(valueA)
    const hasB = hasData(valueB)

    if (!hasA && !hasB) return null

    const shouldShowUnitA = unit ? !valueContainsUnit(valueA ?? null, unit) : false
    const shouldShowUnitB = unit ? !valueContainsUnit(valueB ?? null, unit) : false

    return (
      <div className="border-b border-neutral-200 dark:border-neutral-700 py-4 last:border-b-0 transition-colors duration-500">
        <p className="text-xs md:text-sm font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wide mb-3 transition-colors duration-500">{label}</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
          <div className="relative p-3 md:p-4 rounded-lg border border-blue-200 dark:border-blue-700 bg-blue-50 dark:bg-blue-900/20 transition-colors duration-500">
            <p className="text-xl md:text-2xl font-bold text-blue-900 dark:text-blue-200">{hasA ? formatMetricValue(valueA ?? null) : 'Not reported'}{hasA && shouldShowUnitA && <span className="text-xs md:text-sm text-neutral-600 dark:text-neutral-400 ml-1">{unit}</span>}</p>
          </div>
          <div className="relative p-3 md:p-4 rounded-lg border border-amber-200 dark:border-amber-700 bg-amber-50 dark:bg-amber-900/20 transition-colors duration-500">
            <p className="text-xl md:text-2xl font-bold text-amber-900 dark:text-amber-200">{hasB ? formatMetricValue(valueB ?? null) : 'Not reported'}{hasB && shouldShowUnitB && <span className="text-xs md:text-sm text-neutral-600 dark:text-neutral-400 ml-1">{unit}</span>}</p>
          </div>
        </div>
      </div>
    )
  }

  const ComparisonImage = ({ imageA, imageB, title, leftTitle, rightTitle, field, linksA, linksB }: { imageA: string | null; imageB: string | null; title: string; leftTitle: string; rightTitle: string; field?: string; linksA?: ImageLink[]; linksB?: ImageLink[] }) => {
    const hasA = hasData(imageA)
    const hasB = hasData(imageB)
    if (!hasA && !hasB) return null
    const linkA = field ? findImageLink(linksA, field) : null
    const linkB = field ? findImageLink(linksB, field) : null

    return (
      <div className="mb-6 md:mb-8">
        <h4 className="font-semibold text-sm md:text-base text-neutral-900 dark:text-white mb-3 md:mb-4 transition-colors duration-500">{title}</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
          <div>
            {hasA ? <div className="border-2 border-blue-300 dark:border-blue-700 rounded-lg overflow-hidden transition-colors duration-500"><div className="bg-blue-100 dark:bg-blue-900 px-3 py-1.5 text-xs font-semibold text-blue-900 dark:text-blue-100 uppercase tracking-wide transition-colors duration-500">{leftTitle}</div><SafeImage src={getImagePathA(imageA)} alt={`${leftTitle} - ${title}`} className="w-full aspect-video object-cover" imageLink={linkA} /></div> : <div className="aspect-video bg-neutral-100 dark:bg-neutral-800 rounded-lg flex items-center justify-center border border-neutral-200 dark:border-neutral-700 transition-colors duration-500"><p className="text-xs md:text-sm text-neutral-400 dark:text-neutral-500">No data available</p></div>}
          </div>
          <div>
            {hasB ? <div className="border-2 border-amber-300 dark:border-amber-700 rounded-lg overflow-hidden transition-colors duration-500"><div className="bg-amber-100 dark:bg-amber-900 px-3 py-1.5 text-xs font-semibold text-amber-900 dark:text-amber-100 uppercase tracking-wide transition-colors duration-500">{rightTitle}</div><SafeImage src={getImagePathB(imageB)} alt={`${rightTitle} - ${title}`} className="w-full aspect-video object-cover" imageLink={linkB} /></div> : <div className="aspect-video bg-neutral-100 dark:bg-neutral-800 rounded-lg flex items-center justify-center border border-neutral-200 dark:border-neutral-700 transition-colors duration-500"><p className="text-xs md:text-sm text-neutral-400 dark:text-neutral-500">No data available</p></div>}
          </div>
        </div>
      </div>
    )
  }

  const ComparisonStreetSection = () => {
    const [streetSunAngle, setStreetSunAngle] = useState(35)
    const [streetSunFrom, setStreetSunFrom] = useState<'left' | 'right'>('left')
    const hasSectionA = hasData(quarterA.indicators.heightToWidthRatio) || hasData(quarterA.indicators.streetWidth)
    const hasSectionB = hasData(quarterB.indicators.heightToWidthRatio) || hasData(quarterB.indicators.streetWidth)

    if (!hasSectionA || !hasSectionB) return null

    return (
      <div className="card mb-12">
        <h3 className="text-2xl font-bold text-neutral-900 dark:text-white mb-6 transition-colors duration-500">Street Geometry & Cross-Sections</h3>
        <p className="mb-5 max-w-5xl text-sm leading-relaxed text-neutral-600 dark:text-neutral-400">Blue W spans facade-to-facade using the source street width. Red H is estimated as H:W × average W, not directly measured. Dark fill marks the receiving facade; a dashed arrow shows where the shadow would continue if that building were absent. Both views share scale; surroundings are schematic.</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
          <div className="p-3 md:p-4 rounded-lg border-2 border-blue-300 dark:border-blue-700 bg-blue-50 dark:bg-blue-900/20 transition-colors duration-500">
            <div className="text-xs font-semibold text-blue-900 dark:text-blue-100 uppercase tracking-wide mb-3">{panelNameA}</div>
            <UrbanSectionDiagram
              heightToWidthRatio={quarterA.indicators.heightToWidthRatio}
              streetWidth={quarterA.indicators.streetWidth}
              showNotes={false}
              sunAngle={streetSunAngle}
              sunFrom={streetSunFrom}
            />
          </div>
          <div className="p-3 md:p-4 rounded-lg border-2 border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-900/20 transition-colors duration-500">
            <div className="text-xs font-semibold text-amber-900 dark:text-amber-100 uppercase tracking-wide mb-3">{panelNameB}</div>
            <UrbanSectionDiagram
              heightToWidthRatio={quarterB.indicators.heightToWidthRatio}
              streetWidth={quarterB.indicators.streetWidth}
              showNotes={false}
              sunAngle={streetSunAngle}
              sunFrom={streetSunFrom}
            />
          </div>
        </div>
        <StreetSunSimulator
          angle={streetSunAngle}
          onAngleChange={setStreetSunAngle}
          sunFrom={streetSunFrom}
          onSunFromChange={setStreetSunFrom}
          dataA={getFirstStreetSimulationInput(quarterA.indicators.heightToWidthRatio, quarterA.indicators.streetWidth)}
          dataB={getFirstStreetSimulationInput(quarterB.indicators.heightToWidthRatio, quarterB.indicators.streetWidth)}
          labelA={panelNameA}
          labelB={panelNameB}
        />
      </div>
    )
  }

  const hasComparableSunHours =
    hasData(quarterA.sunHours) || hasData(quarterB.sunHours) ||
    Boolean(quarterA.sunHoursDistribution?.ground || quarterB.sunHoursDistribution?.ground) ||
    Boolean(quarterA.sunHoursDistribution?.facades || quarterB.sunHoursDistribution?.facades) ||
    Boolean(quarterA.sunHoursDistribution?.roofs || quarterB.sunHoursDistribution?.roofs)

  const hasComparableDaylightPotential =
    hasData(quarterA.daylightPotential) || hasData(quarterB.daylightPotential) ||
    hasData(quarterA.daylightPotential2) || hasData(quarterB.daylightPotential2) ||
    Boolean(quarterA.daylightPotentialDistribution || quarterB.daylightPotentialDistribution)

  const hasComparableSolarEnergy =
    hasData(quarterA.solarEnergy) || hasData(quarterB.solarEnergy) ||
    Boolean(quarterA.solarEnergySpecs || quarterB.solarEnergySpecs)

  return (
    <Layout>
      <section className="bg-white dark:bg-neutral-800 border-b border-neutral-200 dark:border-neutral-700 transition-colors duration-500">
        <div className="container mx-auto px-4 sm:px-6 py-4 sm:py-6">
          <button onClick={() => navigate('/')} className="flex items-center gap-2 text-neutral-600 dark:text-neutral-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors mb-4"><ArrowLeft className="w-4 h-4" /><span className="text-sm font-medium">Back to Home</span></button>

          <div className="mb-4">
            <div className="inline-block px-3 py-1 bg-primary-100 dark:bg-primary-900/30 text-primary-800 dark:text-primary-200 text-xs font-semibold rounded-full mb-2 md:mb-3 uppercase tracking-wide transition-colors duration-500">Comparison Mode</div>
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-neutral-900 dark:text-white transition-colors duration-500">Side-by-Side Analysis</h1>
            <p className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-400 mt-2 mb-3 transition-colors duration-500">Compare case studies or inspect different analysis units within one place.</p>
            <div role="group" aria-label="Comparison mode" className="inline-flex max-w-full rounded-lg border border-neutral-300 bg-neutral-100 p-1 dark:border-neutral-700 dark:bg-neutral-800">
              <button onClick={switchToBetweenMode} aria-pressed={mode === 'between'} className={`min-h-10 rounded-md px-4 text-sm font-semibold transition-colors ${mode === 'between' ? 'bg-white text-neutral-900 shadow-sm dark:bg-neutral-700 dark:text-white' : 'text-neutral-600 hover:text-neutral-900 dark:text-neutral-300 dark:hover:text-white'}`}>Between Cities</button>
              <button onClick={switchToSameMode} aria-pressed={mode === 'same'} className={`min-h-10 rounded-md px-4 text-sm font-semibold transition-colors ${mode === 'same' ? 'bg-white text-neutral-900 shadow-sm dark:bg-neutral-700 dark:text-white' : 'text-neutral-600 hover:text-neutral-900 dark:text-neutral-300 dark:hover:text-white'}`}>Same Place, Different Units</button>
            </div>
          </div>

          {mode === 'between' ? (
            <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] gap-3 md:gap-4 items-center mt-6">
              <div className="rounded-md border-l-4 border-blue-600 bg-blue-50/70 p-3 md:p-4 dark:bg-blue-950/30">
                <label className="text-xs font-semibold text-blue-900 dark:text-blue-100 uppercase tracking-wide mb-2 block transition-colors duration-500">City A</label>
                <select value={cityA.id} onChange={(event) => navigate(`/compare/${event.target.value}/${cityB.id}${queryString('between', quarterA?.id, quarterB?.id)}`)} className="w-full p-2 border border-blue-300 dark:border-blue-700 rounded-lg font-semibold text-sm md:text-base text-neutral-900 dark:text-white bg-white dark:bg-neutral-800 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors duration-500">{cities.map((city) => <option key={city.id} value={city.id} disabled={city.id === cityB.id}>{city.name}</option>)}</select>
              </div>
              <div className="flex justify-center py-2 md:py-0"><ArrowLeftRight className="w-5 h-5 md:w-6 md:h-6 text-neutral-400 dark:text-neutral-500 transform rotate-90 md:rotate-0" /></div>
              <div className="rounded-md border-l-4 border-amber-500 bg-amber-50/70 p-3 md:p-4 dark:bg-amber-950/30">
                <label className="text-xs font-semibold text-amber-900 dark:text-amber-100 uppercase tracking-wide mb-2 block transition-colors duration-500">City B</label>
                <select value={cityB.id} onChange={(event) => navigate(`/compare/${cityA.id}/${event.target.value}${queryString('between', quarterA?.id, quarterB?.id)}`)} className="w-full p-2 border border-amber-300 dark:border-amber-700 rounded-lg font-semibold text-sm md:text-base text-neutral-900 dark:text-white bg-white dark:bg-neutral-800 focus:outline-none focus:ring-2 focus:ring-amber-500 transition-colors duration-500">{cities.map((city) => <option key={city.id} value={city.id} disabled={city.id === cityA.id}>{city.name}</option>)}</select>
              </div>
            </div>
          ) : (
            <div className="mt-6 rounded-md border-l-4 border-blue-600 bg-blue-50/70 p-3 md:p-4 dark:bg-blue-950/30">
              <label className="text-xs font-semibold text-blue-900 dark:text-blue-100 uppercase tracking-wide mb-2 block transition-colors duration-500">City</label>
              <select value={cityA.id} onChange={(event) => navigate(`/compare/${event.target.value}${queryString('same')}`)} className="w-full p-2 border border-blue-300 dark:border-blue-700 rounded-lg font-semibold text-sm md:text-base text-neutral-900 dark:text-white bg-white dark:bg-neutral-800 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors duration-500">{cities.map((city) => <option key={city.id} value={city.id}>{city.name}</option>)}</select>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <div className="rounded-md border-l-4 border-blue-600 bg-blue-50/50 p-3 md:p-4 dark:bg-blue-950/20">
              <label className="text-xs font-semibold text-blue-900 dark:text-blue-100 uppercase tracking-wide mb-2 block transition-colors duration-500">Analysis unit A</label>
              <select value={quarterA?.id ?? ''} onChange={(event) => onQuarterAChange(event.target.value)} className="w-full p-2 border border-blue-300 dark:border-blue-700 rounded-lg font-semibold text-sm md:text-base text-neutral-900 dark:text-white bg-white dark:bg-neutral-800 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors duration-500">{cityA.analysisUnits.map((quarter) => <option key={quarter.id} value={quarter.id}>{quarter.name}</option>)}</select>
            </div>
            <div className="rounded-md border-l-4 border-amber-500 bg-amber-50/50 p-3 md:p-4 dark:bg-amber-950/20">
              <label className="text-xs font-semibold text-amber-900 dark:text-amber-100 uppercase tracking-wide mb-2 block transition-colors duration-500">Analysis unit B</label>
              <select value={quarterB?.id ?? ''} onChange={(event) => onQuarterBChange(event.target.value)} className="w-full p-2 border border-amber-300 dark:border-amber-700 rounded-lg font-semibold text-sm md:text-base text-neutral-900 dark:text-white bg-white dark:bg-neutral-800 focus:outline-none focus:ring-2 focus:ring-amber-500 transition-colors duration-500">{cityB.analysisUnits.map((quarter) => <option key={quarter.id} value={quarter.id} disabled={mode === 'same' && quarterA?.id === quarter.id && cityB.analysisUnits.length > 1}>{quarter.name}</option>)}</select>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <div>
              <AdminDataPanel title={`${cityA.name} · source row ${cityA.source.row}`} data={cityA} sourcePath={tempSourcePath(cityA.source.tempPath)} sourceCell={`${cityA.source.sheet} row ${cityA.source.row}`} />
              <AdminDataPanel title={`${quarterA.name} · source row ${quarterA.sourceRow ?? 'see parent record'}`} data={quarterA} sourcePath={tempSourcePath(cityA.source.tempPath)} sourceCell={quarterA.sourceRow ? `Arkusz1 row ${quarterA.sourceRow}` : null} />
            </div>
            <div>
              <AdminDataPanel title={`${cityB.name} · source row ${cityB.source.row}`} data={cityB} sourcePath={tempSourcePath(cityB.source.tempPath)} sourceCell={`${cityB.source.sheet} row ${cityB.source.row}`} />
              <AdminDataPanel title={`${quarterB.name} · source row ${quarterB.sourceRow ?? 'see parent record'}`} data={quarterB} sourcePath={tempSourcePath(cityB.source.tempPath)} sourceCell={quarterB.sourceRow ? `Arkusz1 row ${quarterB.sourceRow}` : null} />
            </div>
          </div>
        </div>
      </section>

      <div className="container mx-auto px-4 sm:px-6 py-8 sm:py-12">
        <div className="mb-14 border-b border-neutral-200 pb-8 dark:border-neutral-700">
          <h3 className="mb-5 text-xl font-semibold text-neutral-900 dark:text-white">Urban Indicators</h3>
          <p className="mb-4 max-w-4xl text-sm leading-relaxed text-neutral-600 dark:text-neutral-400">FAR is total floor area relative to site area; green-space ratio is the reported share of green space. Average floors, building coverage, and tree count describe the selected analysis unit. Values are shown only where reported.</p>
          {mode === 'same' ? <><ComparisonMetric label="Building Intensity (FAR)" valueA={quarterA?.indicators.buildingIntensity} valueB={quarterB?.indicators.buildingIntensity} /><ComparisonMetric label="Green Space Ratio" valueA={quarterA?.indicators.greenSpaceRatio} valueB={quarterB?.indicators.greenSpaceRatio} unit="%" /></> : <><ComparisonMetric label="Building Intensity (FAR)" valueA={cityA.urbanIndicators.buildingIntensity} valueB={cityB.urbanIndicators.buildingIntensity} /><ComparisonMetric label="Green Space Ratio" valueA={cityA.urbanIndicators.greenSpacePercentage} valueB={cityB.urbanIndicators.greenSpacePercentage} unit="%" /></>}
          <ComparisonMetric label="Average Floors" valueA={quarterA?.indicators.avgFloors} valueB={quarterB?.indicators.avgFloors} />
          <ComparisonMetric label="Building Coverage" valueA={quarterA?.indicators.buildingCoverage} valueB={quarterB?.indicators.buildingCoverage} unit="%" />
          <ComparisonMetric label="Tree Count" valueA={quarterA?.indicators.treeCount} valueB={quarterB?.indicators.treeCount} />
          <InsightsSection insights={morphologyInsights} isOpen={showMorphologyInsights} onToggle={() => setShowMorphologyInsights(!showMorphologyInsights)} />
        </div>

        <div className="mb-14 border-b border-neutral-200 pb-8 dark:border-neutral-700">
          <h3 className="mb-5 text-xl font-semibold text-neutral-900 dark:text-white">Urban Form</h3>
          <p className="mb-4 max-w-4xl text-sm leading-relaxed text-neutral-600 dark:text-neutral-400">The plan is a top-down view of built and open space; the 3D image shows building massing. Both images belong to the selected units below.</p>
          <ComparisonImage imageA={quarterA?.plan ?? null} imageB={quarterB?.plan ?? null} title="Urban Block Plan" leftTitle={panelNameA} rightTitle={panelNameB} field="plan" linksA={quarterA.imageLinks} linksB={quarterB.imageLinks} />
          <ComparisonImage imageA={quarterA?.form3d ?? null} imageB={quarterB?.form3d ?? null} title="3D Form" leftTitle={panelNameA} rightTitle={panelNameB} field="form3d" linksA={quarterA.imageLinks} linksB={quarterB.imageLinks} />
          <InsightsSection insights={urbanFormInsights} isOpen={showUrbanFormInsights} onToggle={() => setShowUrbanFormInsights(!showUrbanFormInsights)} />
        </div>

        <div className="mb-14 border-b border-neutral-200 pb-8 dark:border-neutral-700">
          <h3 className="mb-5 text-xl font-semibold text-neutral-900 dark:text-white">Seasonal Shading</h3>
          <p className="mb-4 max-w-4xl text-sm leading-relaxed text-neutral-600 dark:text-neutral-400">The image pairs show source-provided shading for the equinoxes, summer solstice, and winter solstice. Color scales remain as supplied in each study.</p>
          <ComparisonImage imageA={quarterA?.shadingAnalysis?.marchSeptember ?? cityA.shadingAnalysis.marchSeptember} imageB={quarterB?.shadingAnalysis?.marchSeptember ?? cityB.shadingAnalysis.marchSeptember} title="March/September (Equinox)" leftTitle={panelNameA} rightTitle={panelNameB} field="shadingAnalysis.marchSeptember" linksA={cityA.imageLinks} linksB={cityB.imageLinks} />
          <ComparisonImage imageA={quarterA?.shadingAnalysis?.june ?? cityA.shadingAnalysis.june} imageB={quarterB?.shadingAnalysis?.june ?? cityB.shadingAnalysis.june} title="June (Summer Solstice)" leftTitle={panelNameA} rightTitle={panelNameB} field="shadingAnalysis.june" linksA={cityA.imageLinks} linksB={cityB.imageLinks} />
          <ComparisonImage imageA={quarterA?.shadingAnalysis?.december ?? cityA.shadingAnalysis.december} imageB={quarterB?.shadingAnalysis?.december ?? cityB.shadingAnalysis.december} title="December (Winter Solstice)" leftTitle={panelNameA} rightTitle={panelNameB} field="shadingAnalysis.december" linksA={cityA.imageLinks} linksB={cityB.imageLinks} />
        </div>

        <ComparisonStreetSection />

        {hasComparableSunHours && (
          <div className="mb-14 border-b border-neutral-200 pb-8 dark:border-neutral-700">
            <h3 className="mb-5 text-xl font-semibold text-neutral-900 dark:text-white">Sun Hours Analysis</h3>
            <p className="mb-4 max-w-4xl text-sm leading-relaxed text-neutral-600 dark:text-neutral-400">Maps show the selected unit. Each chart groups the area receiving a daily-sunlight range on 21 March: the Y-axis is surface-area share, and the X-axis is hours of sunlight.</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 items-start mb-6">
              <div className="rounded-lg border-2 border-blue-300 dark:border-blue-700 overflow-hidden">
                <div className="bg-blue-100 dark:bg-blue-900 px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-blue-900 dark:text-blue-100">{panelNameA}</div>
                {hasData(quarterA.sunHours) ? <SafeImage src={getImagePathA(quarterA.sunHours)} alt={`${panelNameA} sun hours map`} className="w-full aspect-video object-cover" imageLink={findImageLink(quarterA.imageLinks, 'sunHours')} /> : <p className="p-4 text-sm text-neutral-500">No sun-hours map reported.</p>}
              </div>
              <div className="rounded-lg border-2 border-amber-300 dark:border-amber-700 overflow-hidden">
                <div className="bg-amber-100 dark:bg-amber-900 px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-amber-900 dark:text-amber-100">{panelNameB}</div>
                {hasData(quarterB.sunHours) ? <SafeImage src={getImagePathB(quarterB.sunHours)} alt={`${panelNameB} sun hours map`} className="w-full aspect-video object-cover" imageLink={findImageLink(quarterB.imageLinks, 'sunHours')} /> : <p className="p-4 text-sm text-neutral-500">No sun-hours map reported.</p>}
              </div>
            </div>
            <div className="space-y-6">
              <ComparisonDistributionChart dataA={quarterA.sunHoursDistribution?.ground} dataB={quarterB.sunHoursDistribution?.ground} labelA={panelNameA} labelB={panelNameB} title="Ground" measureAxisLabel="Ground area share (%)" categoryAxisLabel="Daily sunlight hours on 21 March" />
              <ComparisonDistributionChart dataA={quarterA.sunHoursDistribution?.facades} dataB={quarterB.sunHoursDistribution?.facades} labelA={panelNameA} labelB={panelNameB} title="Facades and other surfaces" measureAxisLabel="Facade and other area share (%)" categoryAxisLabel="Daily sunlight hours on 21 March" />
              <ComparisonDistributionChart dataA={quarterA.sunHoursDistribution?.roofs} dataB={quarterB.sunHoursDistribution?.roofs} labelA={panelNameA} labelB={panelNameB} title="Roofs" measureAxisLabel="Roof area share (%)" categoryAxisLabel="Daily sunlight hours on 21 March" />
            </div>
          </div>
        )}

        {hasComparableDaylightPotential && (
          <div className="mb-14 border-b border-neutral-200 pb-8 dark:border-neutral-700">
            <h3 className="mb-5 text-xl font-semibold text-neutral-900 dark:text-white">Daylight Potential</h3>
            <p className="mb-4 max-w-4xl text-sm leading-relaxed text-neutral-600 dark:text-neutral-400">The maps show reported daylight-potential results. The paired chart groups facade area by score band; compare the shares within the same band, not the color of separate source maps.</p>
            <ComparisonImage
              imageA={quarterA.daylightPotential}
              imageB={quarterB.daylightPotential}
              title="Daylight Potential (Primary)"
              leftTitle={panelNameA}
              rightTitle={panelNameB}
              field="daylightPotential"
              linksA={quarterA.imageLinks}
              linksB={quarterB.imageLinks}
            />
            <ComparisonImage
              imageA={quarterA.daylightPotential2 ?? null}
              imageB={quarterB.daylightPotential2 ?? null}
              title="Daylight Potential (Secondary)"
              leftTitle={panelNameA}
              rightTitle={panelNameB}
              field="daylightPotential2"
              linksA={quarterA.imageLinks}
              linksB={quarterB.imageLinks}
            />
            <ComparisonDistributionChart
              dataA={quarterA.daylightPotentialDistribution}
              dataB={quarterB.daylightPotentialDistribution}
              labelA={panelNameA}
              labelB={panelNameB}
              title="Facade distribution"
              measureAxisLabel="Facade area share (%)"
              categoryAxisLabel="Daylight-potential score band"
            />
          </div>
        )}

        {hasComparableSolarEnergy && (
          <div className="mb-14 border-b border-neutral-200 pb-8 dark:border-neutral-700">
            <h3 className="mb-5 text-xl font-semibold text-neutral-900 dark:text-white">Solar Energy Analysis</h3>
            <p className="mb-4 max-w-4xl text-sm leading-relaxed text-neutral-600 dark:text-neutral-400">The maps are source-generated solar analyses. The specifications list reported area and energy figures; blank entries mean that value was not provided.</p>
            <ComparisonImage
              imageA={quarterA.solarEnergy ?? null}
              imageB={quarterB.solarEnergy ?? null}
              title="Solar Energy Map"
              leftTitle={panelNameA}
              rightTitle={panelNameB}
              field="solarEnergy"
              linksA={quarterA.imageLinks}
              linksB={quarterB.imageLinks}
            />
            {(quarterA.solarEnergySpecs || quarterB.solarEnergySpecs) && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                {quarterA.solarEnergySpecs ? <div className="p-3 md:p-4 rounded-lg border border-blue-200 dark:border-blue-700 bg-white dark:bg-neutral-800 transition-colors duration-500">
                  <h4 className="text-sm font-semibold text-blue-900 dark:text-blue-100 mb-3">{panelNameA} Solar Specs</h4>
                  <SolarEnergyTable specs={quarterA.solarEnergySpecs} />
                </div> : <p className="p-4 text-sm text-neutral-500">{panelNameA}: no solar specifications reported.</p>}
                {quarterB.solarEnergySpecs ? <div className="p-3 md:p-4 rounded-lg border border-amber-200 dark:border-amber-700 bg-white dark:bg-neutral-800 transition-colors duration-500">
                  <h4 className="text-sm font-semibold text-amber-900 dark:text-amber-100 mb-3">{panelNameB} Solar Specs</h4>
                  <SolarEnergyTable specs={quarterB.solarEnergySpecs} />
                </div> : <p className="p-4 text-sm text-neutral-500">{panelNameB}: no solar specifications reported.</p>}
              </div>
            )}
          </div>
        )}

        <div className="mb-14 border-b border-neutral-200 pb-8 last:border-b-0 dark:border-neutral-700">
          <h3 className="mb-5 text-xl font-semibold text-neutral-900 dark:text-white">Daylight Performance Metrics</h3>
          <p className="mb-4 max-w-4xl text-sm leading-relaxed text-neutral-600 dark:text-neutral-400">DF compares indoor with outdoor illuminance under the study sky condition. sDA reports floor-area daylight autonomy against the study target; UDI describes how often illuminance falls within a useful range. Criteria can differ by study.</p>
          {sameAnalysisScale ? (
            <>
              <ComparisonMetric label="DF · Scenario 1" valueA={quarterA?.daylightFactor?.simulation1?.avgValue} valueB={quarterB?.daylightFactor?.simulation1?.avgValue} unit="%" />
              <ComparisonImage imageA={quarterA?.daylightFactor?.simulation1?.image ?? null} imageB={quarterB?.daylightFactor?.simulation1?.image ?? null} title="Daylight Factor Distribution" leftTitle={panelNameA} rightTitle={panelNameB} field="daylightFactor.simulation1.image" linksA={quarterA.imageLinks} linksB={quarterB.imageLinks} />
              <ComparisonMetric label="sDA · Scenario 1" valueA={quarterA?.spatialDaylightAutonomy?.simulation1?.autonomy} valueB={quarterB?.spatialDaylightAutonomy?.simulation1?.autonomy} unit="%" />
              <ComparisonImage imageA={quarterA?.spatialDaylightAutonomy?.simulation1?.image ?? null} imageB={quarterB?.spatialDaylightAutonomy?.simulation1?.image ?? null} title="Spatial Daylight Autonomy" leftTitle={panelNameA} rightTitle={panelNameB} field="spatialDaylightAutonomy.simulation1.image" linksA={quarterA.imageLinks} linksB={quarterB.imageLinks} />
              <ComparisonMetric label="UDI · Scenario 1" valueA={quarterA?.usefulDaylightIlluminance?.simulation1?.avgValue} valueB={quarterB?.usefulDaylightIlluminance?.simulation1?.avgValue} unit="%" />
              <ComparisonImage imageA={quarterA?.usefulDaylightIlluminance?.simulation1?.image ?? null} imageB={quarterB?.usefulDaylightIlluminance?.simulation1?.image ?? null} title="Useful Daylight Illuminance" leftTitle={panelNameA} rightTitle={panelNameB} field="usefulDaylightIlluminance.simulation1.image" linksA={quarterA.imageLinks} linksB={quarterB.imageLinks} />
              <InsightsSection insights={daylightInsights} isOpen={showDaylightInsights} onToggle={() => setShowDaylightInsights(!showDaylightInsights)} />
            </>
          ) : (
            <p className="border-l-4 border-amber-500 bg-amber-50 dark:bg-amber-950/40 p-4 text-sm text-neutral-700 dark:text-neutral-200">
              Daylight metrics are not directly compared: the selected units use different spatial scales or simulation criteria.
            </p>
          )}
        </div>
      </div>
    </Layout>
  )
}

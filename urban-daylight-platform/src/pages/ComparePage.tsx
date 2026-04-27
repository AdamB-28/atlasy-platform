import { useEffect, useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { ArrowLeft, ArrowLeftRight, ChevronDown, ChevronUp, Lightbulb, Minus, TrendingDown, TrendingUp } from 'lucide-react'
import Layout from '../components/Layout'
import SafeImage from '../components/SafeImage'
import { LoadingSpinner, NoData } from '../components/LoadingStates'
import DistributionChart from '../components/DistributionChart'
import SolarEnergyTable from '../components/SolarEnergyTable'
import UrbanSectionDiagram from '../components/UrbanSectionDiagram'
import { useCities, useCity } from '../hooks/useCitiesData'
import { formatMetricValue, getCityFolderName, hasData, valueContainsUnit } from '../utils/helpers'
import { generateDaylightInsights, generateUrbanFormInsights, generateUrbanMorphologyInsights } from '../utils/insights'

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
    const fallback = city?.quarters[0]?.id
    if (!fallback) return null

    const raw = searchParams.get(cityKey)
    if (!raw) return fallback

    const parsed = Number.parseInt(raw, 10)
    if (!Number.isInteger(parsed)) return fallback

    return city.quarters.some((quarter) => quarter.id === parsed) ? parsed : fallback
  }

  const quarterAId = resolveQuarterId('quarterA', cityA)
  const quarterBId = resolveQuarterId('quarterB', cityB)
  const quarterA = cityA?.quarters.find((quarter) => quarter.id === quarterAId) ?? cityA?.quarters[0] ?? null
  const quarterB = cityB?.quarters.find((quarter) => quarter.id === quarterBId) ?? cityB?.quarters[0] ?? null

  useEffect(() => {
    if (!cityA || !cityB) return

    const next = new URLSearchParams(searchParams)
    let changed = false

    if (next.get('mode') !== mode) {
      next.set('mode', mode)
      changed = true
    }

    if (quarterA?.id && next.get('quarterA') !== String(quarterA.id)) {
      next.set('quarterA', String(quarterA.id))
      changed = true
    }

    if (quarterB?.id && next.get('quarterB') !== String(quarterB.id)) {
      next.set('quarterB', String(quarterB.id))
      changed = true
    }

    if (mode === 'same' && quarterA?.id && quarterB?.id && quarterA.id === quarterB.id && cityA.quarters.length > 1) {
      const alternative = cityA.quarters.find((quarter) => quarter.id !== quarterA.id)
      if (alternative) {
        next.set('quarterB', String(alternative.id))
        changed = true
      }
    }

    if (changed) {
      setSearchParams(next, { replace: true })
    }
  }, [cityA, cityB, mode, quarterA?.id, quarterB?.id, searchParams, setSearchParams])

  if (loadingA || loadingB) return <Layout><LoadingSpinner /></Layout>
  if (!cityA || !cityB) return <Layout><NoData message="Cities not found" /></Layout>
  if (!quarterA || !quarterB) return <Layout><NoData message="Quarter data not found" /></Layout>

  const cityFolderA = getCityFolderName(cityA.name)
  const cityFolderB = getCityFolderName(cityB.name)

  const getImagePathA = (imageName: string | null) => (imageName ? `${import.meta.env.BASE_URL}${cityFolderA}/${imageName}.PNG` : '')
  const getImagePathB = (imageName: string | null) => (imageName ? `${import.meta.env.BASE_URL}${cityFolderB}/${imageName}.PNG` : '')

  const panelNameA = mode === 'same' ? `${cityA.name} - ${quarterA?.name ?? 'Quarter'}` : cityA.name
  const panelNameB = mode === 'same' ? `${cityB.name} - ${quarterB?.name ?? 'Quarter'}` : cityB.name

  const urbanFormInsights = mode === 'same' ? [] : generateUrbanFormInsights(cityA, cityB)
  const morphologyInsights = generateUrbanMorphologyInsights(cityA, cityB, quarterA, quarterB, panelNameA, panelNameB)
  const daylightInsights = generateDaylightInsights(cityA, cityB, quarterA, quarterB, panelNameA, panelNameB)

  const queryString = (nextMode: CompareMode, nextQuarterA?: number, nextQuarterB?: number) => {
    const params = new URLSearchParams()
    params.set('mode', nextMode)
    if (nextQuarterA) params.set('quarterA', String(nextQuarterA))
    if (nextQuarterB) params.set('quarterB', String(nextQuarterB))
    return `?${params.toString()}`
  }

  const switchToBetweenMode = () => {
    const defaultCityB = cities.find((city) => city.id !== cityA.id)
    if (!defaultCityB) return
    navigate(`/compare/${cityA.id}/${defaultCityB.id}${queryString('between', quarterA?.id, defaultCityB.quarters[0]?.id)}`)
  }

  const switchToSameMode = () => {
    const alternativeQuarter = cityA.quarters.find((quarter) => quarter.id !== quarterA?.id)
    navigate(`/compare/${cityA.id}${queryString('same', quarterA?.id, alternativeQuarter?.id ?? quarterA?.id)}`)
  }

  const updateQuarterParams = (nextQuarterA?: number, nextQuarterB?: number) => {
    const next = new URLSearchParams(searchParams)
    if (nextQuarterA) next.set('quarterA', String(nextQuarterA))
    if (nextQuarterB) next.set('quarterB', String(nextQuarterB))
    next.set('mode', mode)
    setSearchParams(next)
  }

  const onQuarterAChange = (value: string) => {
    const parsed = Number.parseInt(value, 10)
    if (!Number.isInteger(parsed)) return

    if (mode === 'same' && quarterB && quarterB.id === parsed && cityA.quarters.length > 1) {
      const alternative = cityA.quarters.find((quarter) => quarter.id !== parsed)
      updateQuarterParams(parsed, alternative?.id)
      return
    }

    updateQuarterParams(parsed, quarterB?.id)
  }

  const onQuarterBChange = (value: string) => {
    const parsed = Number.parseInt(value, 10)
    if (!Number.isInteger(parsed)) return
    if (mode === 'same' && quarterA && parsed === quarterA.id && cityA.quarters.length > 1) return
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

  const ComparisonMetric = ({ label, valueA, valueB, unit, higherIsBetter = true }: { label: string; valueA: string | number | null | undefined; valueB: string | number | null | undefined; unit?: string; higherIsBetter?: boolean }) => {
    const hasA = hasData(valueA)
    const hasB = hasData(valueB)

    if (!hasA || !hasB) return null

    let isBetter: 'A' | 'B' | 'equal' | null = null
    const numA = typeof valueA === 'number' ? valueA : parseFloat(String(valueA))
    const numB = typeof valueB === 'number' ? valueB : parseFloat(String(valueB))
    if (!isNaN(numA) && !isNaN(numB)) {
      if (numA > numB) isBetter = higherIsBetter ? 'A' : 'B'
      if (numB > numA) isBetter = higherIsBetter ? 'B' : 'A'
      if (numB === numA) isBetter = 'equal'
    }

    const shouldShowUnitA = unit ? !valueContainsUnit(valueA ?? null, unit) : false
    const shouldShowUnitB = unit ? !valueContainsUnit(valueB ?? null, unit) : false

    return (
      <div className="border-b border-neutral-200 dark:border-neutral-700 py-4 last:border-b-0 transition-colors duration-500">
        <p className="text-xs md:text-sm font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wide mb-3 transition-colors duration-500">{label}</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
          <div className={`relative p-3 md:p-4 rounded-lg border-2 transition-colors duration-500 ${isBetter === 'A' ? 'bg-green-50 dark:bg-green-900/30 border-green-400 dark:border-green-700 shadow-sm' : 'bg-blue-50 dark:bg-blue-900/30 border-blue-200 dark:border-blue-700'}`}>
            <p className={`text-xl md:text-2xl font-bold transition-colors duration-500 ${isBetter === 'A' ? 'text-green-800 dark:text-green-300' : 'text-blue-900 dark:text-blue-300'}`}>{formatMetricValue(valueA ?? null)}{shouldShowUnitA && <span className="text-xs md:text-sm text-neutral-600 dark:text-neutral-400 ml-1">{unit}</span>}</p>
          </div>
          <div className={`relative p-3 md:p-4 rounded-lg border-2 transition-colors duration-500 ${isBetter === 'B' ? 'bg-green-50 dark:bg-green-900/30 border-green-400 dark:border-green-700 shadow-sm' : 'bg-amber-50 dark:bg-amber-900/30 border-amber-200 dark:border-amber-700'}`}>
            <p className={`text-xl md:text-2xl font-bold transition-colors duration-500 ${isBetter === 'B' ? 'text-green-800 dark:text-green-300' : 'text-amber-900 dark:text-amber-300'}`}>{formatMetricValue(valueB ?? null)}{shouldShowUnitB && <span className="text-xs md:text-sm text-neutral-600 dark:text-neutral-400 ml-1">{unit}</span>}</p>
          </div>
        </div>
      </div>
    )
  }

  const ComparisonImage = ({ imageA, imageB, title, leftTitle, rightTitle }: { imageA: string | null; imageB: string | null; title: string; leftTitle: string; rightTitle: string }) => {
    const hasA = hasData(imageA)
    const hasB = hasData(imageB)
    if (!hasA || !hasB) return null

    return (
      <div className="mb-6 md:mb-8">
        <h4 className="font-semibold text-sm md:text-base text-neutral-900 dark:text-white mb-3 md:mb-4 transition-colors duration-500">{title}</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
          <div>
            {hasA ? <div className="border-2 border-blue-300 dark:border-blue-700 rounded-lg overflow-hidden transition-colors duration-500"><div className="bg-blue-100 dark:bg-blue-900 px-3 py-1.5 text-xs font-semibold text-blue-900 dark:text-blue-100 uppercase tracking-wide transition-colors duration-500">{leftTitle}</div><SafeImage src={getImagePathA(imageA)} alt={`${leftTitle} - ${title}`} className="w-full aspect-video object-cover" /></div> : <div className="aspect-video bg-neutral-100 dark:bg-neutral-800 rounded-lg flex items-center justify-center border border-neutral-200 dark:border-neutral-700 transition-colors duration-500"><p className="text-xs md:text-sm text-neutral-400 dark:text-neutral-500">No data available</p></div>}
          </div>
          <div>
            {hasB ? <div className="border-2 border-amber-300 dark:border-amber-700 rounded-lg overflow-hidden transition-colors duration-500"><div className="bg-amber-100 dark:bg-amber-900 px-3 py-1.5 text-xs font-semibold text-amber-900 dark:text-amber-100 uppercase tracking-wide transition-colors duration-500">{rightTitle}</div><SafeImage src={getImagePathB(imageB)} alt={`${rightTitle} - ${title}`} className="w-full aspect-video object-cover" /></div> : <div className="aspect-video bg-neutral-100 dark:bg-neutral-800 rounded-lg flex items-center justify-center border border-neutral-200 dark:border-neutral-700 transition-colors duration-500"><p className="text-xs md:text-sm text-neutral-400 dark:text-neutral-500">No data available</p></div>}
          </div>
        </div>
      </div>
    )
  }

  const ComparisonStreetSection = () => {
    const hasSectionA = hasData(quarterA.indicators.heightToWidthRatio) || hasData(quarterA.indicators.streetWidth)
    const hasSectionB = hasData(quarterB.indicators.heightToWidthRatio) || hasData(quarterB.indicators.streetWidth)

    if (!hasSectionA || !hasSectionB) return null

    return (
      <div className="card mb-12">
        <h3 className="text-2xl font-bold text-neutral-900 dark:text-white mb-6 transition-colors duration-500">Street Geometry & Cross-Sections</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
          <div className="p-3 md:p-4 rounded-lg border-2 border-blue-300 dark:border-blue-700 bg-blue-50 dark:bg-blue-900/20 transition-colors duration-500">
            <div className="text-xs font-semibold text-blue-900 dark:text-blue-100 uppercase tracking-wide mb-3">{panelNameA}</div>
            <UrbanSectionDiagram
              heightToWidthRatio={quarterA.indicators.heightToWidthRatio}
              streetWidth={quarterA.indicators.streetWidth}
            />
          </div>
          <div className="p-3 md:p-4 rounded-lg border-2 border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-900/20 transition-colors duration-500">
            <div className="text-xs font-semibold text-amber-900 dark:text-amber-100 uppercase tracking-wide mb-3">{panelNameB}</div>
            <UrbanSectionDiagram
              heightToWidthRatio={quarterB.indicators.heightToWidthRatio}
              streetWidth={quarterB.indicators.streetWidth}
            />
          </div>
        </div>
      </div>
    )
  }

  const hasComparableSunHours =
    (hasData(quarterA.sunHours) && hasData(quarterB.sunHours)) ||
    (Boolean(quarterA.sunHoursDistribution?.ground) && Boolean(quarterB.sunHoursDistribution?.ground)) ||
    (Boolean(quarterA.sunHoursDistribution?.facades) && Boolean(quarterB.sunHoursDistribution?.facades))

  const hasComparableDaylightPotential =
    (hasData(quarterA.daylightPotential) && hasData(quarterB.daylightPotential)) ||
    (hasData(quarterA.daylightPotential2) && hasData(quarterB.daylightPotential2)) ||
    (Boolean(quarterA.daylightPotentialDistribution) && Boolean(quarterB.daylightPotentialDistribution))

  const hasComparableSolarEnergy =
    (hasData(quarterA.solarEnergy) && hasData(quarterB.solarEnergy)) ||
    (Boolean(quarterA.solarEnergySpecs) && Boolean(quarterB.solarEnergySpecs))

  return (
    <Layout>
      <section className="bg-white dark:bg-neutral-800 border-b border-neutral-200 dark:border-neutral-700 transition-colors duration-500">
        <div className="container mx-auto px-4 sm:px-6 py-4 sm:py-6">
          <button onClick={() => navigate('/')} className="flex items-center gap-2 text-neutral-600 dark:text-neutral-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors mb-4"><ArrowLeft className="w-4 h-4" /><span className="text-sm font-medium">Back to Home</span></button>

          <div className="mb-4">
            <div className="inline-block px-3 py-1 bg-primary-100 dark:bg-primary-900/30 text-primary-800 dark:text-primary-200 text-xs font-semibold rounded-full mb-2 md:mb-3 uppercase tracking-wide transition-colors duration-500">Comparison Mode</div>
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-neutral-900 dark:text-white transition-colors duration-500">Side-by-Side Analysis</h1>
            <p className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-400 mt-2 mb-3 transition-colors duration-500">Compare different examples or compare two quarters inside the same place.</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
              <button onClick={switchToBetweenMode} className={`px-4 py-2 rounded-lg border text-sm font-semibold transition-colors duration-500 ${mode === 'between' ? 'bg-primary-600 text-white border-primary-600' : 'bg-white dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 border-neutral-300 dark:border-neutral-700 hover:border-primary-400'}`}>Between Cities</button>
              <button onClick={switchToSameMode} className={`px-4 py-2 rounded-lg border text-sm font-semibold transition-colors duration-500 ${mode === 'same' ? 'bg-primary-600 text-white border-primary-600' : 'bg-white dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 border-neutral-300 dark:border-neutral-700 hover:border-primary-400'}`}>Same City, Different Quarters</button>
            </div>
          </div>

          {mode === 'between' ? (
            <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] gap-3 md:gap-4 items-center mt-6">
              <div className="p-3 md:p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border-2 border-blue-300 dark:border-blue-700 transition-colors duration-500">
                <label className="text-xs font-semibold text-blue-900 dark:text-blue-100 uppercase tracking-wide mb-2 block transition-colors duration-500">City A</label>
                <select value={cityA.id} onChange={(event) => navigate(`/compare/${event.target.value}/${cityB.id}${queryString('between', quarterA?.id, quarterB?.id)}`)} className="w-full p-2 border border-blue-300 dark:border-blue-700 rounded-lg font-semibold text-sm md:text-base text-neutral-900 dark:text-white bg-white dark:bg-neutral-800 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors duration-500">{cities.map((city) => <option key={city.id} value={city.id} disabled={city.id === cityB.id}>{city.name}</option>)}</select>
              </div>
              <div className="flex justify-center py-2 md:py-0"><ArrowLeftRight className="w-5 h-5 md:w-6 md:h-6 text-neutral-400 dark:text-neutral-500 transform rotate-90 md:rotate-0" /></div>
              <div className="p-3 md:p-4 bg-amber-50 dark:bg-amber-900/20 rounded-lg border-2 border-amber-300 dark:border-amber-700 transition-colors duration-500">
                <label className="text-xs font-semibold text-amber-900 dark:text-amber-100 uppercase tracking-wide mb-2 block transition-colors duration-500">City B</label>
                <select value={cityB.id} onChange={(event) => navigate(`/compare/${cityA.id}/${event.target.value}${queryString('between', quarterA?.id, quarterB?.id)}`)} className="w-full p-2 border border-amber-300 dark:border-amber-700 rounded-lg font-semibold text-sm md:text-base text-neutral-900 dark:text-white bg-white dark:bg-neutral-800 focus:outline-none focus:ring-2 focus:ring-amber-500 transition-colors duration-500">{cities.map((city) => <option key={city.id} value={city.id} disabled={city.id === cityA.id}>{city.name}</option>)}</select>
              </div>
            </div>
          ) : (
            <div className="mt-6 p-3 md:p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border-2 border-blue-300 dark:border-blue-700 transition-colors duration-500">
              <label className="text-xs font-semibold text-blue-900 dark:text-blue-100 uppercase tracking-wide mb-2 block transition-colors duration-500">City</label>
              <select value={cityA.id} onChange={(event) => navigate(`/compare/${event.target.value}${queryString('same')}`)} className="w-full p-2 border border-blue-300 dark:border-blue-700 rounded-lg font-semibold text-sm md:text-base text-neutral-900 dark:text-white bg-white dark:bg-neutral-800 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors duration-500">{cities.map((city) => <option key={city.id} value={city.id}>{city.name}</option>)}</select>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <div className="p-3 md:p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-700 transition-colors duration-500">
              <label className="text-xs font-semibold text-blue-900 dark:text-blue-100 uppercase tracking-wide mb-2 block transition-colors duration-500">Quarter A</label>
              <select value={quarterA?.id ?? ''} onChange={(event) => onQuarterAChange(event.target.value)} className="w-full p-2 border border-blue-300 dark:border-blue-700 rounded-lg font-semibold text-sm md:text-base text-neutral-900 dark:text-white bg-white dark:bg-neutral-800 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors duration-500">{cityA.quarters.map((quarter) => <option key={quarter.id} value={quarter.id}>{quarter.name}</option>)}</select>
            </div>
            <div className="p-3 md:p-4 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-700 transition-colors duration-500">
              <label className="text-xs font-semibold text-amber-900 dark:text-amber-100 uppercase tracking-wide mb-2 block transition-colors duration-500">Quarter B</label>
              <select value={quarterB?.id ?? ''} onChange={(event) => onQuarterBChange(event.target.value)} className="w-full p-2 border border-amber-300 dark:border-amber-700 rounded-lg font-semibold text-sm md:text-base text-neutral-900 dark:text-white bg-white dark:bg-neutral-800 focus:outline-none focus:ring-2 focus:ring-amber-500 transition-colors duration-500">{cityB.quarters.map((quarter) => <option key={quarter.id} value={quarter.id} disabled={mode === 'same' && quarterA?.id === quarter.id && cityB.quarters.length > 1}>{quarter.name}</option>)}</select>
            </div>
          </div>
        </div>
      </section>

      <div className="container mx-auto px-4 sm:px-6 py-8 sm:py-12">
        <div className="card mb-12">
          <h3 className="text-2xl font-bold text-neutral-900 dark:text-white mb-6 transition-colors duration-500">Urban Indicators</h3>
          {mode === 'same' ? <><ComparisonMetric label="Building Intensity" valueA={quarterA?.indicators.buildingIntensity} valueB={quarterB?.indicators.buildingIntensity} /><ComparisonMetric label="Green Space" valueA={quarterA?.indicators.greenSpaceRatio} valueB={quarterB?.indicators.greenSpaceRatio} unit="%" higherIsBetter={true} /></> : <><ComparisonMetric label="Building Intensity" valueA={cityA.urbanIndicators.buildingIntensity} valueB={cityB.urbanIndicators.buildingIntensity} /><ComparisonMetric label="Green Space" valueA={cityA.urbanIndicators.greenSpacePercentage} valueB={cityB.urbanIndicators.greenSpacePercentage} unit="%" higherIsBetter={true} /></>}
          <ComparisonMetric label="Average Floors" valueA={quarterA?.indicators.avgFloors} valueB={quarterB?.indicators.avgFloors} />
          <ComparisonMetric label="Building Coverage" valueA={quarterA?.indicators.buildingCoverage} valueB={quarterB?.indicators.buildingCoverage} unit="%" higherIsBetter={false} />
          <ComparisonMetric label="Tree Count" valueA={quarterA?.indicators.treeCount} valueB={quarterB?.indicators.treeCount} higherIsBetter={true} />
          <InsightsSection insights={morphologyInsights} isOpen={showMorphologyInsights} onToggle={() => setShowMorphologyInsights(!showMorphologyInsights)} />
        </div>

        <div className="card mb-12">
          <h3 className="text-2xl font-bold text-neutral-900 dark:text-white mb-6 transition-colors duration-500">Urban Form</h3>
          <ComparisonImage imageA={quarterA?.plan ?? null} imageB={quarterB?.plan ?? null} title="Quarter Plan" leftTitle={panelNameA} rightTitle={panelNameB} />
          <ComparisonImage imageA={quarterA?.form3d ?? null} imageB={quarterB?.form3d ?? null} title="3D Form" leftTitle={panelNameA} rightTitle={panelNameB} />
          <InsightsSection insights={urbanFormInsights} isOpen={showUrbanFormInsights} onToggle={() => setShowUrbanFormInsights(!showUrbanFormInsights)} />
        </div>

        <div className="card mb-12">
          <h3 className="text-2xl font-bold text-neutral-900 dark:text-white mb-6 transition-colors duration-500">Seasonal Shading</h3>
          <ComparisonImage imageA={quarterA?.shadingAnalysis?.marchSeptember ?? cityA.shadingAnalysis.marchSeptember} imageB={quarterB?.shadingAnalysis?.marchSeptember ?? cityB.shadingAnalysis.marchSeptember} title="March/September (Equinox)" leftTitle={panelNameA} rightTitle={panelNameB} />
          <ComparisonImage imageA={quarterA?.shadingAnalysis?.june ?? cityA.shadingAnalysis.june} imageB={quarterB?.shadingAnalysis?.june ?? cityB.shadingAnalysis.june} title="June (Summer Solstice)" leftTitle={panelNameA} rightTitle={panelNameB} />
          <ComparisonImage imageA={quarterA?.shadingAnalysis?.december ?? cityA.shadingAnalysis.december} imageB={quarterB?.shadingAnalysis?.december ?? cityB.shadingAnalysis.december} title="December (Winter Solstice)" leftTitle={panelNameA} rightTitle={panelNameB} />
        </div>

        <ComparisonStreetSection />

        {hasComparableSunHours && (
          <div className="card mb-12">
            <h3 className="text-2xl font-bold text-neutral-900 dark:text-white mb-6 transition-colors duration-500">Sun Hours Analysis</h3>
            <ComparisonImage
              imageA={quarterA.sunHours}
              imageB={quarterB.sunHours}
              title="Sun Hours Map"
              leftTitle={panelNameA}
              rightTitle={panelNameB}
            />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
              {quarterA.sunHoursDistribution?.ground && quarterB.sunHoursDistribution?.ground && (
                <div className="p-3 md:p-4 rounded-lg border border-blue-200 dark:border-blue-700 bg-white dark:bg-neutral-800 transition-colors duration-500 space-y-4">
                  <h4 className="text-sm font-semibold text-blue-900 dark:text-blue-100">{panelNameA} Ground Distribution</h4>
                  <DistributionChart data={quarterA.sunHoursDistribution.ground} title="Ground Level" color="amber" />
                </div>
              )}
              {quarterA.sunHoursDistribution?.facades && quarterB.sunHoursDistribution?.facades && (
                <div className="p-3 md:p-4 rounded-lg border border-blue-200 dark:border-blue-700 bg-white dark:bg-neutral-800 transition-colors duration-500 space-y-4">
                  <h4 className="text-sm font-semibold text-blue-900 dark:text-blue-100">{panelNameA} Facades Distribution</h4>
                  <DistributionChart data={quarterA.sunHoursDistribution.facades} title="Facades, Roofs & Other" color="amber" />
                </div>
              )}
              {quarterA.sunHoursDistribution?.ground && quarterB.sunHoursDistribution?.ground && (
                <div className="p-3 md:p-4 rounded-lg border border-amber-200 dark:border-amber-700 bg-white dark:bg-neutral-800 transition-colors duration-500 space-y-4">
                  <h4 className="text-sm font-semibold text-amber-900 dark:text-amber-100">{panelNameB} Ground Distribution</h4>
                  <DistributionChart data={quarterB.sunHoursDistribution.ground} title="Ground Level" color="amber" />
                </div>
              )}
              {quarterA.sunHoursDistribution?.facades && quarterB.sunHoursDistribution?.facades && (
                <div className="p-3 md:p-4 rounded-lg border border-amber-200 dark:border-amber-700 bg-white dark:bg-neutral-800 transition-colors duration-500 space-y-4">
                  <h4 className="text-sm font-semibold text-amber-900 dark:text-amber-100">{panelNameB} Facades Distribution</h4>
                  <DistributionChart data={quarterB.sunHoursDistribution.facades} title="Facades, Roofs & Other" color="amber" />
                </div>
              )}
            </div>
          </div>
        )}

        {hasComparableDaylightPotential && (
          <div className="card mb-12">
            <h3 className="text-2xl font-bold text-neutral-900 dark:text-white mb-6 transition-colors duration-500">Daylight Potential</h3>
            <ComparisonImage
              imageA={quarterA.daylightPotential}
              imageB={quarterB.daylightPotential}
              title="Daylight Potential (Primary)"
              leftTitle={panelNameA}
              rightTitle={panelNameB}
            />
            <ComparisonImage
              imageA={quarterA.daylightPotential2 ?? null}
              imageB={quarterB.daylightPotential2 ?? null}
              title="Daylight Potential (Secondary)"
              leftTitle={panelNameA}
              rightTitle={panelNameB}
            />
            {quarterA.daylightPotentialDistribution && quarterB.daylightPotentialDistribution && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
              <div className="p-3 md:p-4 rounded-lg border border-blue-200 dark:border-blue-700 bg-white dark:bg-neutral-800 transition-colors duration-500">
                <h4 className="text-sm font-semibold text-blue-900 dark:text-blue-100 mb-3">{panelNameA} Facade Distribution</h4>
                <DistributionChart data={quarterA.daylightPotentialDistribution} color="blue" unitLabel="Daylight potential (scores)" />
              </div>
              <div className="p-3 md:p-4 rounded-lg border border-amber-200 dark:border-amber-700 bg-white dark:bg-neutral-800 transition-colors duration-500">
                <h4 className="text-sm font-semibold text-amber-900 dark:text-amber-100 mb-3">{panelNameB} Facade Distribution</h4>
                <DistributionChart data={quarterB.daylightPotentialDistribution} color="blue" unitLabel="Daylight potential (scores)" />
              </div>
            </div>
            )}
          </div>
        )}

        {hasComparableSolarEnergy && (
          <div className="card mb-12">
            <h3 className="text-2xl font-bold text-neutral-900 dark:text-white mb-6 transition-colors duration-500">Solar Energy Analysis</h3>
            <ComparisonImage
              imageA={quarterA.solarEnergy ?? null}
              imageB={quarterB.solarEnergy ?? null}
              title="Solar Energy Map"
              leftTitle={panelNameA}
              rightTitle={panelNameB}
            />
            {quarterA.solarEnergySpecs && quarterB.solarEnergySpecs && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                <div className="p-3 md:p-4 rounded-lg border border-blue-200 dark:border-blue-700 bg-white dark:bg-neutral-800 transition-colors duration-500">
                  <h4 className="text-sm font-semibold text-blue-900 dark:text-blue-100 mb-3">{panelNameA} Solar Specs</h4>
                  <SolarEnergyTable specs={quarterA.solarEnergySpecs} />
                </div>
                <div className="p-3 md:p-4 rounded-lg border border-amber-200 dark:border-amber-700 bg-white dark:bg-neutral-800 transition-colors duration-500">
                  <h4 className="text-sm font-semibold text-amber-900 dark:text-amber-100 mb-3">{panelNameB} Solar Specs</h4>
                  <SolarEnergyTable specs={quarterB.solarEnergySpecs} />
                </div>
              </div>
            )}
          </div>
        )}

        <div className="card mb-12">
          <h3 className="text-2xl font-bold text-neutral-900 dark:text-white mb-6 transition-colors duration-500">Daylight Performance Metrics</h3>
          <ComparisonMetric label="Average DF" valueA={quarterA?.daylightFactor?.simulation1?.avgValue} valueB={quarterB?.daylightFactor?.simulation1?.avgValue} unit="%" higherIsBetter={true} />
          <ComparisonImage imageA={quarterA?.daylightFactor?.simulation1?.image ?? null} imageB={quarterB?.daylightFactor?.simulation1?.image ?? null} title="Daylight Factor Distribution" leftTitle={panelNameA} rightTitle={panelNameB} />
          <ComparisonMetric label="sDA Value" valueA={quarterA?.spatialDaylightAutonomy?.simulation1?.autonomy} valueB={quarterB?.spatialDaylightAutonomy?.simulation1?.autonomy} unit="%" higherIsBetter={true} />
          <ComparisonImage imageA={quarterA?.spatialDaylightAutonomy?.simulation1?.image ?? null} imageB={quarterB?.spatialDaylightAutonomy?.simulation1?.image ?? null} title="Spatial Daylight Autonomy" leftTitle={panelNameA} rightTitle={panelNameB} />
          <ComparisonMetric label="Average UDI" valueA={quarterA?.usefulDaylightIlluminance?.simulation1?.avgValue} valueB={quarterB?.usefulDaylightIlluminance?.simulation1?.avgValue} unit="%" higherIsBetter={true} />
          <ComparisonImage imageA={quarterA?.usefulDaylightIlluminance?.simulation1?.image ?? null} imageB={quarterB?.usefulDaylightIlluminance?.simulation1?.image ?? null} title="Useful Daylight Illuminance" leftTitle={panelNameA} rightTitle={panelNameB} />
          <InsightsSection insights={daylightInsights} isOpen={showDaylightInsights} onToggle={() => setShowDaylightInsights(!showDaylightInsights)} />
        </div>
      </div>
    </Layout>
  )
}

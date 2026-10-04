import { useParams, useNavigate, useSearchParams } from 'react-router-dom'
import { ArrowLeft, MapPin, Calendar, Building, Leaf, Train, GitCompare, ChevronRight, Lightbulb, ChevronDown, ChevronUp, Sun } from 'lucide-react'
import Layout from '../components/Layout'
import QuarterDetail from '../components/QuarterDetail'
import SafeImage from '../components/SafeImage'
import DistributionChart from '../components/DistributionChart'
import SolarEnergyTable from '../components/SolarEnergyTable'
import AdminDataPanel from '../components/AdminDataPanel'
import { LoadingSpinner, ErrorMessage, NoData } from '../components/LoadingStates'
import { useCity, useCities } from '../hooks/useCitiesData'
import { hasData, getCityFolderName, findImageLink, tempSourcePath } from '../utils/helpers'
import { useEffect, useMemo, useState, type ChangeEvent } from 'react'
import { DensityGauge, PercentRing } from '../components/MetricVisuals'
import type { City } from '../types'

const EMPTY_ANALYSIS_UNITS: City['analysisUnits'] = []

export default function CityPage() {
  const { cityId } = useParams<{ cityId: string }>()
  const { city, loading, error } = useCity(cityId || '')
  const { cities, notices } = useCities()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const [showUrbanInsights, setShowUrbanInsights] = useState(false)
  const [showShadingInsights, setShowShadingInsights] = useState(false)
  const [showCityPicker, setShowCityPicker] = useState(false)

  const cityFolder = getCityFolderName(city?.name ?? '')
  const getImagePath = (imageName: string | null) => {
    if (!imageName) return ''
    return `${import.meta.env.BASE_URL}${cityFolder}/${imageName}.PNG`
  }

  const cityQuarters = city?.analysisUnits ?? EMPTY_ANALYSIS_UNITS
  const otherCities = city ? cities.filter(c => c.id !== city.id) : []

  const selectedQuarterId = useMemo(() => {
    const fallback = cityQuarters[0]?.id
    if (!fallback) return null

    const requestedQuarter = searchParams.get('unit') ?? searchParams.get('quarter')
    if (!requestedQuarter) return fallback

    const exists = cityQuarters.some((quarter) => String(quarter.id) === requestedQuarter)
    return exists ? requestedQuarter : fallback
  }, [cityQuarters, searchParams])

  const selectedQuarter = useMemo(() => {
    if (selectedQuarterId === null) return null
    return cityQuarters.find((quarter) => String(quarter.id) === String(selectedQuarterId)) ?? cityQuarters[0] ?? null
  }, [cityQuarters, selectedQuarterId])

  useEffect(() => {
    if (selectedQuarterId === null) return

    const current = searchParams.get('unit')
    if (current === String(selectedQuarterId)) return

    const next = new URLSearchParams(searchParams)
    next.set('unit', String(selectedQuarterId))
    setSearchParams(next, { replace: true })
  }, [searchParams, selectedQuarterId, setSearchParams])

  const handleQuarterChange = (event: ChangeEvent<HTMLSelectElement>) => {
    const next = new URLSearchParams(searchParams)
    next.set('unit', event.target.value)
    setSearchParams(next)
  }

  const navigateToCompare = (otherCityId: string, otherCityFirstQuarterId?: number | string) => {
    if (!city) return

    const quarterA = selectedQuarter?.id ?? cityQuarters[0]?.id
    const quarterB = otherCityFirstQuarterId
    const params = new URLSearchParams()

    params.set('mode', 'between')
    if (quarterA) params.set('unitA', String(quarterA))
    if (quarterB) params.set('unitB', String(quarterB))

    navigate(`/compare/${city.id}/${otherCityId}?${params.toString()}`)
    setShowCityPicker(false)
  }

  const navigateToSameCityQuarterCompare = () => {
    if (!city || cityQuarters.length < 2 || !selectedQuarter) return

    const alternativeQuarter = cityQuarters.find((quarter) => quarter.id !== selectedQuarter.id)
    if (!alternativeQuarter) return

    const params = new URLSearchParams()
    params.set('mode', 'same')
    params.set('unitA', String(selectedQuarter.id))
    params.set('unitB', String(alternativeQuarter.id))

    navigate(`/compare/${city.id}?${params.toString()}`)
  }

  if (loading) return <Layout><LoadingSpinner /></Layout>
  if (error) return <Layout><ErrorMessage error={error} /></Layout>
  if (!city) return <Layout><NoData message="City not found" /></Layout>
  
  return (
    <Layout>
      {/* Header */}
      <section className="bg-white dark:bg-neutral-800 border-b border-neutral-200 dark:border-neutral-700 transition-colors duration-500">
        <div className="container mx-auto px-4 sm:px-6 py-4 sm:py-6">
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 text-neutral-600 dark:text-neutral-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm font-medium">Back to Home</span>
          </button>
          
          <div className="flex flex-col gap-4">
            <div className="flex-1">
              <div className="inline-block px-3 py-1 bg-primary-100 dark:bg-primary-900/30 text-primary-800 dark:text-primary-200 text-xs font-semibold rounded-full mb-2 md:mb-3 uppercase tracking-wide transition-colors duration-500">
                Case Study
              </div>
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-neutral-900 dark:text-white mb-3 transition-colors duration-500">{city.name}</h1>
              {city.location.country && (
                <div className="flex items-center gap-2 text-sm md:text-base text-neutral-600 dark:text-neutral-400 transition-colors duration-500">
                  <MapPin className="w-4 h-4" />
                  <span>{city.location.country}</span>
                </div>
              )}
              <div className="mt-3 md:mt-4 p-3 bg-primary-50 dark:bg-primary-900/20 border-l-4 border-primary-500 rounded transition-colors duration-500">
                <p className="text-xs sm:text-sm text-neutral-700 dark:text-neutral-300 transition-colors duration-500">
                  <strong>Data note:</strong> Only reported measurements are shown. Missing values are not estimated.
                </p>
              </div>
              <p className="mt-3 text-xs text-neutral-500 dark:text-neutral-400" data-testid="data-provenance">
                Source: {city.source.file}, {city.source.sheet}, row {city.source.row} · {city.source.status === 'partial' ? 'Partial dataset' : 'Source data'}
              </p>
              {notices.map((notice) => (
                <p key={notice} className="mt-2 max-w-3xl text-xs text-amber-800 dark:text-amber-200" role="note">{notice}</p>
              ))}
              <AdminDataPanel
                title={`${city.name} · source row ${city.source.row}`}
                data={city}
                sourcePath={tempSourcePath(city.source.tempPath)}
                sourceCell={`${city.source.sheet} row ${city.source.row}`}
              />
              {city.imageLinks && city.imageLinks.length > 0 && (
                <AdminDataPanel title={`${city.name} · all linked images (${city.imageLinks.length})`} data={city.imageLinks} />
              )}
            </div>
            
            {otherCities.length > 0 && (
              <div className="w-full md:w-auto">
                <div className="md:relative">
                  <button
                    onClick={() => setShowCityPicker((visible) => !visible)}
                    aria-expanded={showCityPicker}
                    aria-controls="compare-city-picker"
                    className="btn-primary flex items-center justify-center gap-2 w-full text-sm md:text-base"
                  >
                    <GitCompare className="w-4 h-4" />
                    <span className="hidden sm:inline">Compare with Another City</span>
                    <span className="sm:hidden">Compare</span>
                  </button>
                  
                  <div
                    id="compare-city-picker"
                    className={`md:absolute right-0 top-full mt-2 w-full md:w-80 bg-white dark:bg-neutral-800 rounded-lg shadow-xl border border-neutral-200 dark:border-neutral-700 transition-all duration-200 z-10 overflow-y-auto ${showCityPicker ? 'visible max-h-96 opacity-100' : 'invisible max-h-0 opacity-0'}`}
                  >
                    <div className="p-3">
                      <p className="text-[10px] md:text-xs text-neutral-500 dark:text-neutral-400 uppercase tracking-wide font-semibold mb-2 px-2 transition-colors duration-500">
                        Select a city to compare
                      </p>
                      {otherCities.map((otherCity) => (
                        <button
                          key={otherCity.id}
                          onClick={() => navigateToCompare(otherCity.id, otherCity.analysisUnits[0]?.id)}
                          className="w-full text-left px-3 md:px-4 py-2 md:py-3 rounded-md hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-colors flex items-center justify-between group/item">
                          <div>
                            <div className="text-sm md:text-base font-medium text-neutral-900 dark:text-white group-hover/item:text-primary-600 dark:group-hover/item:text-primary-400 transition-colors duration-500">
                            {otherCity.name}
                          </div>
                            <div className="text-xs md:text-sm text-neutral-500 dark:text-neutral-400">{otherCity.location.country}</div>
                          </div>
                          <ChevronRight className="w-3.5 h-3.5 md:w-4 md:h-4 text-neutral-400 dark:text-neutral-500 group-hover/item:text-primary-600 dark:group-hover/item:text-primary-400" />
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              </div>
            )}
          </div>
        </div>
      </section>
      
      <div className="container mx-auto px-4 sm:px-6 py-8 sm:py-12">
        {/* Timeline and Location */}
        {(hasData(city.timeline.years) || hasData(city.location.imageUrl)) && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 lg:gap-8 mb-8 sm:mb-12">
            {hasData(city.timeline.years) && (
              <div className="card">
                <div className="flex items-center gap-3 mb-4">
                  <Calendar className="w-4 h-4 md:w-5 md:h-5 text-primary-600" />
                  <h3 className="section-title mb-0 text-base md:text-lg">Timeline</h3>
                </div>
                <p className="text-xl md:text-2xl font-semibold text-neutral-900 dark:text-white mb-3 transition-colors duration-500">{city.timeline.years}</p>
                {hasData(city.timeline.description) && (
                  <p className="text-xs md:text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed transition-colors duration-500">{city.timeline.description}</p>
                )}
              </div>
            )}
            
            {hasData(city.location.imageUrl) && (
              <div className="card">
                <h3 className="section-title text-base md:text-lg">Location</h3>
                <SafeImage
                  src={getImagePath(city.location.imageUrl)}
                  alt={`${city.name} location`}
                  className="w-full rounded-lg"
                  imageLink={findImageLink(city.imageLinks, 'location.imageUrl')}
                />
              </div>
            )}
          </div>
        )}
        
        {/* Urban Analysis */}
        {(hasData(city.overview.schwarzplanImage) || hasData(city.overview.model3dImage)) && (
          <div className="mb-8 md:mb-12">
            <h2 className="text-xl md:text-2xl font-bold text-neutral-900 dark:text-white mb-4 md:mb-6 transition-colors duration-500">Urban Analysis</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
              {hasData(city.overview.schwarzplanImage) && (
                <div className="card">
                  <h3 className="section-title text-base md:text-lg">Schwarzplan</h3>
                  <p className="text-xs md:text-sm text-neutral-600 dark:text-neutral-400 mb-4 transition-colors duration-500">
                    Figure-ground diagram showing the relationship between built and unbuilt space
                  </p>
                  <SafeImage
                    src={getImagePath(city.overview.schwarzplanImage)}
                    alt={`${city.name} Schwarzplan`}
                    imageLink={findImageLink(city.imageLinks, 'overview.schwarzplanImage')}
                    className="w-full rounded-lg"
                  />
                </div>
              )}
              
              {hasData(city.overview.model3dImage) && (
                <div className="card">
                  <h3 className="section-title text-base md:text-lg">3D Model</h3>
                  <p className="text-xs md:text-sm text-neutral-600 dark:text-neutral-400 mb-4 transition-colors duration-500">
                    Three-dimensional representation of the urban form
                  </p>
                  <SafeImage
                    src={getImagePath(city.overview.model3dImage)}
                    alt={`${city.name} 3D model`}
                    imageLink={findImageLink(city.imageLinks, 'overview.model3dImage')}
                    className="w-full rounded-lg"
                  />
                </div>
              )}
            </div>
          </div>
        )}

        {hasData(city.siteAnalysis?.urbanBlocksImage) && (
          <section className="mb-8 md:mb-12 border-y border-neutral-200 dark:border-neutral-700 py-6">
            <div className="grid md:grid-cols-[minmax(220px,0.7fr)_minmax(0,1.3fr)] gap-5 md:gap-8 items-center">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-primary-700 dark:text-primary-300">Study area</p>
                <h2 className="mt-2 text-xl md:text-2xl font-bold text-neutral-900 dark:text-white">Where the blocks sit</h2>
                <p className="mt-2 text-sm leading-relaxed text-neutral-600 dark:text-neutral-300">
                  The source marks the analyzed urban blocks within the wider site. Use this locator to connect block-level measurements to their urban context.
                </p>
              </div>
              <SafeImage
                src={getImagePath(city.siteAnalysis?.urbanBlocksImage ?? null)}
                alt={`${city.name} study-area locator showing the analyzed urban blocks`}
                imageLink={findImageLink(city.imageLinks, 'siteAnalysis.urbanBlocksImage')}
                className="w-full max-h-[440px] object-contain rounded-md bg-white dark:bg-neutral-800"
              />
            </div>
          </section>
        )}
        
        {/* Urban Indicators */}
        <div className="mb-8 md:mb-12">
          <h2 className="text-xl md:text-2xl font-bold text-neutral-900 dark:text-white mb-4 md:mb-6 transition-colors duration-500">Urban Indicators</h2>
          
          {/* Building Intensity – full-width density gauge */}
          {hasData(city.urbanIndicators.buildingIntensity) && (
            <div className="card mb-4">
              <div className="flex items-center gap-3 mb-3">
                <Building className="w-4 h-4 md:w-5 md:h-5 text-primary-600" />
                <h3 className="text-sm md:text-base font-semibold text-neutral-900 dark:text-white transition-colors duration-500">Building Intensity (FAR)</h3>
              </div>
              <DensityGauge value={city.urbanIndicators.buildingIntensity} />
              {hasData(city.urbanIndicators.buildingTypes) && (
                <p className="text-xs md:text-sm text-neutral-600 dark:text-neutral-400 mt-3 leading-relaxed transition-colors duration-500">
                  {city.urbanIndicators.buildingTypes}
                </p>
              )}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6">
            {hasData(city.urbanIndicators.greenSpacePercentage) && (
              <div className="card">
                <div className="flex items-center gap-3 mb-3">
                  <Leaf className="w-4 h-4 md:w-5 md:h-5 text-green-600" />
                  <h3 className="text-sm md:text-base font-semibold text-neutral-900 dark:text-white transition-colors duration-500">Green Space</h3>
                </div>
                <PercentRing
                  value={city.urbanIndicators.greenSpacePercentage}
                  color="stroke-emerald-500 dark:stroke-emerald-400"
                />
              </div>
            )}
            
            {hasData(city.urbanIndicators.transport) && (
              <div className="card">
                <div className="flex items-center gap-3 mb-3">
                  <Train className="w-4 h-4 md:w-5 md:h-5 text-primary-600" />
                  <h3 className="text-sm md:text-base font-semibold text-neutral-900 dark:text-white transition-colors duration-500">Transport</h3>
                </div>
                <p className="text-xs md:text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed transition-colors duration-500">
                  {city.urbanIndicators.transport}
                </p>
              </div>
            )}

            {hasData(city.urbanIndicators.greenBlueInfrastructure) && (
              <div className="card sm:col-span-2">
                <div className="flex items-center gap-3 mb-3">
                  <Leaf className="w-4 h-4 md:w-5 md:h-5 text-emerald-600" />
                  <h3 className="text-sm md:text-base font-semibold text-neutral-900 dark:text-white transition-colors duration-500">Green, Natural & Blue Infrastructure</h3>
                </div>
                <p className="text-xs md:text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed transition-colors duration-500">
                  {city.urbanIndicators.greenBlueInfrastructure}
                </p>
              </div>
            )}
          </div>
          
          {/* Urban Indicators Insights */}
          <div className="mt-4 md:mt-6">
            <button
              onClick={() => setShowUrbanInsights(!showUrbanInsights)}
              className="w-full flex items-center justify-between p-3 bg-primary-100 dark:bg-primary-900/30 hover:bg-primary-200 dark:hover:bg-primary-800/30 rounded-lg transition-colors duration-500 border border-primary-200 dark:border-primary-700">
              <div className="flex items-center gap-2">
                <Lightbulb className="w-3.5 h-3.5 md:w-4 md:h-4 text-primary-600 dark:text-primary-400" />
                <span className="text-xs md:text-sm font-semibold text-primary-900 dark:text-primary-100 transition-colors duration-500">
  {showUrbanInsights ? 'Hide' : 'Show'} Urban Indicators Guide
                </span>
              </div>
              {showUrbanInsights ? <ChevronUp className="w-3.5 h-3.5 md:w-4 md:h-4 text-primary-600 dark:text-primary-400" /> : <ChevronDown className="w-3.5 h-3.5 md:w-4 md:h-4 text-primary-600 dark:text-primary-400" />}
            </button>
            
            {showUrbanInsights && (
              <div className="mt-3 p-4 bg-white dark:bg-neutral-800 rounded-lg border border-primary-200 dark:border-primary-700 shadow-sm space-y-3 animate-in fade-in slide-in-from-top-2 duration-300 transition-colors">
                <div>
                  <h4 className="text-sm md:text-base font-semibold text-neutral-900 dark:text-white mb-1 transition-colors duration-500">Building Intensity</h4>
                  <p className="text-xs md:text-sm text-neutral-700 dark:text-neutral-300 leading-relaxed transition-colors duration-500">
                    Measures urban density and development concentration. Higher values indicate more compact urban form, which can affect daylight access and energy consumption patterns.
                  </p>
                </div>
                <div>
                  <h4 className="text-sm md:text-base font-semibold text-neutral-900 dark:text-white mb-1 transition-colors duration-500">Green Space Percentage</h4>
                  <p className="text-xs md:text-sm text-neutral-700 dark:text-neutral-300 leading-relaxed transition-colors duration-500">
                    Proportion of vegetation and open areas. Green spaces improve microclimate, reduce urban heat island effects, and contribute to better environmental quality. Higher percentages generally indicate better environmental performance.
                  </p>
                </div>
                <div>
                  <h4 className="text-sm md:text-base font-semibold text-neutral-900 dark:text-white mb-1 transition-colors duration-500">Building Coverage</h4>
                  <p className="text-xs md:text-sm text-neutral-700 dark:text-neutral-300 leading-relaxed transition-colors duration-500">
                    Percentage of land covered by buildings. Lower coverage typically allows for better ventilation, green space integration, and natural daylight penetration into urban spaces.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
        
        {/* Shading Analysis */}
        {(hasData(city.shadingAnalysis.marchSeptember) || 
          hasData(city.shadingAnalysis.june) || 
          hasData(city.shadingAnalysis.december)) && (
          <div className="mb-8 md:mb-12">
            <h2 className="text-xl md:text-2xl font-bold text-neutral-900 dark:text-white mb-4 md:mb-6 transition-colors duration-500">Seasonal Shading Analysis</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
              {hasData(city.shadingAnalysis.marchSeptember) && (
                <div className="card">
                  <h3 className="section-title text-base md:text-lg">March & September</h3>
                  <p className="text-xs md:text-sm text-neutral-600 dark:text-neutral-400 mb-4 transition-colors duration-500">Equinox conditions</p>
                  <SafeImage
                    src={getImagePath(city.shadingAnalysis.marchSeptember)}
                    imageLink={findImageLink(city.imageLinks, 'shadingAnalysis.marchSeptember')}
                    alt="Shading analysis - March/September"
                    className="w-full rounded-lg"
                  />
                </div>
              )}
              
              {hasData(city.shadingAnalysis.june) && (
                <div className="card">
                  <h3 className="section-title text-base md:text-lg">June</h3>
                  <p className="text-xs md:text-sm text-neutral-600 dark:text-neutral-400 mb-4 transition-colors duration-500">Summer solstice</p>
                  <SafeImage
                    src={getImagePath(city.shadingAnalysis.june)}
                    imageLink={findImageLink(city.imageLinks, 'shadingAnalysis.june')}
                    alt="Shading analysis - June"
                    className="w-full rounded-lg"
                  />
                </div>
              )}
              
              {hasData(city.shadingAnalysis.december) && (
                <div className="card">
                  <h3 className="section-title text-base md:text-lg">December</h3>
                  <p className="text-xs md:text-sm text-neutral-600 dark:text-neutral-400 mb-4 transition-colors duration-500">Winter solstice</p>
                  <SafeImage
                    src={getImagePath(city.shadingAnalysis.december)}
                    imageLink={findImageLink(city.imageLinks, 'shadingAnalysis.december')}
                    alt="Shading analysis - December"
                    className="w-full rounded-lg"
                  />
                </div>
              )}
            </div>
            
            {/* Shading Analysis Insights */}
            <div className="mt-4 md:mt-6">
              <button
                onClick={() => setShowShadingInsights(!showShadingInsights)}
                className="w-full flex items-center justify-between p-3 bg-primary-100 dark:bg-primary-900/30 hover:bg-primary-200 dark:hover:bg-primary-800/30 rounded-lg transition-colors duration-500 border border-primary-200 dark:border-primary-700">
                <div className="flex items-center gap-2">
                  <Lightbulb className="w-3.5 h-3.5 md:w-4 md:h-4 text-primary-600 dark:text-primary-400" />
                  <span className="text-xs md:text-sm font-semibold text-primary-900 dark:text-primary-100 transition-colors duration-500">
                    {showShadingInsights ? 'Hide' : 'Show'} Seasonal Shading Guide
                  </span>
                </div>
                {showShadingInsights ? <ChevronUp className="w-3.5 h-3.5 md:w-4 md:h-4 text-primary-600 dark:text-primary-400" /> : <ChevronDown className="w-3.5 h-3.5 md:w-4 md:h-4 text-primary-600 dark:text-primary-400" />}
              </button>
              
              {showShadingInsights && (
                <div className="mt-3 p-4 bg-white dark:bg-neutral-800 rounded-lg border border-primary-200 dark:border-primary-700 shadow-sm space-y-3 animate-in fade-in slide-in-from-top-2 duration-300 transition-colors">
                  <div>
                    <h4 className="text-sm md:text-base font-semibold text-neutral-900 dark:text-white mb-1 transition-colors duration-500">Why Study Seasonal Shading?</h4>
                    <p className="text-xs md:text-sm text-neutral-700 dark:text-neutral-300 leading-relaxed transition-colors duration-500">
                      Seasonal shading patterns reveal how building heights and orientations affect daylight access throughout the year. Understanding these patterns is crucial for passive solar design and energy-efficient urban planning.
                    </p>
                  </div>
                  <div>
                    <h4 className="text-sm md:text-base font-semibold text-neutral-900 dark:text-white mb-1 transition-colors duration-500">Equinox (March/September)</h4>
                    <p className="text-xs md:text-sm text-neutral-700 dark:text-neutral-300 leading-relaxed transition-colors duration-500">
                      Shows balanced daylight conditions when day and night are equal length. These conditions represent average shading patterns throughout spring and autumn.
                    </p>
                  </div>
                  <div>
                    <h4 className="text-sm md:text-base font-semibold text-neutral-900 dark:text-white mb-1 transition-colors duration-500">Summer Solstice (June)</h4>
                    <p className="text-xs md:text-sm text-neutral-700 dark:text-neutral-300 leading-relaxed transition-colors duration-500">
                      Longest day of the year with highest sun angle. Shorter shadows mean better natural daylight penetration but require strategies to prevent overheating.
                    </p>
                  </div>
                  <div>
                    <h4 className="text-sm md:text-base font-semibold text-neutral-900 dark:text-white mb-1 transition-colors duration-500">Winter Solstice (December)</h4>
                    <p className="text-xs md:text-sm text-neutral-700 dark:text-neutral-300 leading-relaxed transition-colors duration-500">
                      Shortest day with lowest sun angle creates longest shadows. This is the most challenging period for daylight access and reveals where buildings obstruct winter sunlight.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
        
        {/* Site-Level Analysis */}
        {city.siteAnalysis && (hasData(city.siteAnalysis.sunHoursImage) || 
          hasData(city.siteAnalysis.daylightPotentialImage) || 
          hasData(city.siteAnalysis.solarEnergyImage)) && (
          <div className="mb-8 md:mb-12">
            <h2 className="text-xl md:text-2xl font-bold text-neutral-900 dark:text-white mb-4 md:mb-6 transition-colors duration-500">Site-Level Analysis</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
              {hasData(city.siteAnalysis.sunHoursImage) && (
                <div className="card">
                  <div className="flex items-center gap-3 mb-3">
                    <Sun className="w-4 h-4 md:w-5 md:h-5 text-amber-500" />
                    <h3 className="section-title mb-0 text-base md:text-lg">Sun Hours</h3>
                  </div>
                  <SafeImage
                    src={getImagePath(city.siteAnalysis.sunHoursImage)}
                    imageLink={findImageLink(city.imageLinks, 'siteAnalysis.sunHoursImage')}
                    alt={`${city.name} sun hours analysis`}
                    className="w-full rounded-lg"
                  />
                  {city.siteAnalysis.sunHoursDistribution?.ground && (
                    <div className="mt-5"><DistributionChart data={city.siteAnalysis.sunHoursDistribution.ground} title="Ground-level exposure" color="amber" /></div>
                  )}
                  {city.siteAnalysis.sunHoursDistribution?.facades && (
                    <div className="mt-5"><DistributionChart data={city.siteAnalysis.sunHoursDistribution.facades} title="Facades and roofs" color="amber" /></div>
                  )}
                </div>
              )}
              {hasData(city.siteAnalysis.daylightPotentialImage) && (
                <div className="card">
                  <div className="flex items-center gap-3 mb-3">
                    <Lightbulb className="w-4 h-4 md:w-5 md:h-5 text-yellow-500" />
                    <h3 className="section-title mb-0 text-base md:text-lg">Daylight Potential</h3>
                  </div>
                  <SafeImage
                    imageLink={findImageLink(city.imageLinks, 'siteAnalysis.daylightPotentialImage')}
                    src={getImagePath(city.siteAnalysis.daylightPotentialImage)}
                    alt={`${city.name} daylight potential`}
                    className="w-full rounded-lg"
                  />
                  {city.siteAnalysis.daylightPotentialDistribution && (
                    <div className="mt-5"><DistributionChart data={city.siteAnalysis.daylightPotentialDistribution} title="Facade daylight-potential scores" color="green" /></div>
                  )}
                </div>
              )}
              {hasData(city.siteAnalysis.solarEnergyImage) && (
                <div className="card">
                  <div className="flex items-center gap-3 mb-3">
                    <Sun className="w-4 h-4 md:w-5 md:h-5 text-orange-500" />
                    <h3 className="section-title mb-0 text-base md:text-lg">Solar Energy Analysis</h3>
                  </div>
                  <SafeImage
                    imageLink={findImageLink(city.imageLinks, 'siteAnalysis.solarEnergyImage')}
                    src={getImagePath(city.siteAnalysis.solarEnergyImage)}
                    alt={`${city.name} solar energy analysis`}
                    className="w-full rounded-lg"
                  />
                  {city.siteAnalysis.solarEnergySpecs && (
                    <div className="mt-5"><SolarEnergyTable specs={city.siteAnalysis.solarEnergySpecs} /></div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
        
        {/* Quarters */}
        {city.analysisUnits.length > 0 && (
          <div>
            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 mb-4 md:mb-6">
              <h2 className="text-xl md:text-2xl font-bold text-neutral-900 dark:text-white transition-colors duration-500">
              Explore Analysis Units
              </h2>

              {city.analysisUnits.length > 1 && selectedQuarter && (
                <div className="w-full sm:w-72">
                  <label className="text-xs font-semibold uppercase tracking-wide text-neutral-500 dark:text-neutral-400 block mb-2 transition-colors duration-500">
                    Selected block or analysis
                  </label>
                  <select
                    value={selectedQuarter.id}
                    onChange={handleQuarterChange}
                    className="w-full p-2 border border-primary-300 dark:border-primary-700 rounded-lg font-semibold text-sm md:text-base text-neutral-900 dark:text-white bg-white dark:bg-neutral-800 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-colors duration-500"
                  >
                    {city.analysisUnits.map((quarter) => (
                      <option key={quarter.id} value={quarter.id}>
                        {quarter.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {city.analysisUnits.length > 1 && selectedQuarter && (
              <div className="mb-6">
                <button
                  onClick={navigateToSameCityQuarterCompare}
                  className="btn-primary text-sm md:text-base"
                >
                  Compare Analysis Units in {city.name}
                </button>
              </div>
            )}

            {selectedQuarter && (
              <div className="border-t border-neutral-200 dark:border-neutral-700 pt-12 first:border-t-0 first:pt-0 transition-colors duration-500">
                <QuarterDetail quarter={selectedQuarter} cityName={city.name} sourcePath={city.source.tempPath} />
              </div>
            )}

            {!selectedQuarter && (
              <div className="card">
                <NoData message="Analysis unit data not found" />
              </div>
            )}
            </div>
        )}
      </div>
    </Layout>
  )
}

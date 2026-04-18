import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Lightbulb, TrendingUp, TrendingDown, Minus, ChevronDown, ChevronUp, ArrowLeftRight } from 'lucide-react'
import Layout from '../components/Layout'
import SafeImage from '../components/SafeImage'
import { LoadingSpinner, NoData } from '../components/LoadingStates'
import { useCity, useCities } from '../hooks/useCitiesData'
import { hasData, formatMetricValue, getCityFolderName } from '../utils/helpers'
import { 
  generateUrbanFormInsights, 
  generateDaylightInsights, 
  generateUrbanMorphologyInsights 
} from '../utils/insights'

export default function ComparePage() {
  const { cityAId, cityBId } = useParams<{ cityAId: string; cityBId: string }>()
  const { city: cityA, loading: loadingA } = useCity(cityAId || '')
  const { city: cityB, loading: loadingB } = useCity(cityBId || '')
  const { cities } = useCities()
  const navigate = useNavigate()
  const [showUrbanFormInsights, setShowUrbanFormInsights] = useState(false)
  const [showMorphologyInsights, setShowMorphologyInsights] = useState(false)
  const [showDaylightInsights, setShowDaylightInsights] = useState(false)
  
  if (loadingA || loadingB) return <Layout><LoadingSpinner /></Layout>
  if (!cityA || !cityB) return <Layout><NoData message="Cities not found" /></Layout>
  
  const cityFolderA = getCityFolderName(cityA.name)
  const cityFolderB = getCityFolderName(cityB.name)
  
  const getImagePathA = (imageName: string | null) => {
    if (!imageName) return ''
    return `${import.meta.env.BASE_URL}${cityFolderA}/${imageName}.PNG`
  }
  
  const getImagePathB = (imageName: string | null) => {
    if (!imageName) return ''
    return `${import.meta.env.BASE_URL}${cityFolderB}/${imageName}.PNG`
  }
  
  // Get first quarter from each city for comparison
  const quarterA = cityA.quarters[0]
  const quarterB = cityB.quarters[0]
  
  // Generate insights
  const urbanFormInsights = generateUrbanFormInsights(cityA, cityB)
  const daylightInsights = generateDaylightInsights(cityA, cityB, quarterA, quarterB)
  const morphologyInsights = generateUrbanMorphologyInsights(cityA, cityB, quarterA, quarterB)
  
  const InsightsSection = ({ 
    insights, 
    isOpen, 
    onToggle 
  }: { 
    insights: any[]; 
    isOpen: boolean; 
    onToggle: () => void;
  }) => {
    if (insights.length === 0) return null
    
    return (
      <div className="mt-4">
        <button
          onClick={onToggle}
          className="w-full flex items-center justify-between p-3 bg-primary-100 dark:bg-primary-900/30 hover:bg-primary-200 dark:hover:bg-primary-800/30 rounded-lg transition-colors duration-500 border border-primary-200 dark:border-primary-700"
        >
          <div className="flex items-center gap-2">
            <Lightbulb className="w-4 h-4 text-primary-600 dark:text-primary-400" />
            <span className="text-sm font-semibold text-primary-900 dark:text-primary-100 transition-colors duration-500">
              {isOpen ? 'Hide' : 'Show'} Educational Insights ({insights.length})
            </span>
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
  
  const ComparisonMetric = ({ 
    label, 
    valueA, 
    valueB, 
    unit,
    higherIsBetter = true
  }: { 
    label: string; 
    valueA: any; 
    valueB: any; 
    unit?: string;
    higherIsBetter?: boolean;
  }) => {
    const hasA = hasData(valueA)
    const hasB = hasData(valueB)
    
    // Compare values to determine which is better
    let isBetter: 'A' | 'B' | 'equal' | null = null
    if (hasA && hasB) {
      const numA = typeof valueA === 'number' ? valueA : parseFloat(valueA)
      const numB = typeof valueB === 'number' ? valueB : parseFloat(valueB)
      
      if (!isNaN(numA) && !isNaN(numB)) {
        if (numA > numB) {
          isBetter = higherIsBetter ? 'A' : 'B'
        } else if (numB > numA) {
          isBetter = higherIsBetter ? 'B' : 'A'
        } else {
          isBetter = 'equal'
        }
      }
    }
    
    return (
      <div className="border-b border-neutral-200 dark:border-neutral-700 py-4 last:border-b-0 transition-colors duration-500">
        <p className="text-xs md:text-sm font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wide mb-3 transition-colors duration-500">
          {label}
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
          <div className={`relative p-3 md:p-4 rounded-lg border-2 transition-colors duration-500 ${
            isBetter === 'A' 
              ? 'bg-green-50 dark:bg-green-900/30 border-green-400 dark:border-green-700 shadow-sm' 
              : 'bg-blue-50 dark:bg-blue-900/30 border-blue-200 dark:border-blue-700'
          }`}>
            {hasA ? (
              <>
                {isBetter === 'A' && (
                  <div className="absolute -top-2 -right-2 bg-green-600 dark:bg-green-500 text-white px-2 py-0.5 md:py-1 rounded-full text-[10px] md:text-xs font-bold shadow-md flex items-center gap-0.5 md:gap-1 transition-colors duration-500">
                    <TrendingUp className="w-2.5 h-2.5 md:w-3 md:h-3" />
                    <span className="hidden sm:inline">BETTER</span>
                    <span className="sm:hidden">✓</span>
                  </div>
                )}
                <p className={`text-xl md:text-2xl font-bold transition-colors duration-500 ${
                  isBetter === 'A' ? 'text-green-800 dark:text-green-300' : 'text-blue-900 dark:text-blue-300'
                }`}>
                  {formatMetricValue(valueA)}
                  {unit && <span className="text-xs md:text-sm text-neutral-600 dark:text-neutral-400 ml-1">{unit}</span>}
                </p>
              </>
            ) : (
              <p className="text-xs md:text-sm text-neutral-400 dark:text-neutral-500">No data</p>
            )}
          </div>
          <div className={`relative p-3 md:p-4 rounded-lg border-2 transition-colors duration-500 ${
            isBetter === 'B' 
              ? 'bg-green-50 dark:bg-green-900/30 border-green-400 dark:border-green-700 shadow-sm' 
              : 'bg-amber-50 dark:bg-amber-900/30 border-amber-200 dark:border-amber-700'
          }`}>
            {hasB ? (
              <>
                {isBetter === 'B' && (
                  <div className="absolute -top-2 -right-2 bg-green-600 dark:bg-green-500 text-white px-2 py-0.5 md:py-1 rounded-full text-[10px] md:text-xs font-bold shadow-md flex items-center gap-0.5 md:gap-1 transition-colors duration-500">
                    <TrendingUp className="w-2.5 h-2.5 md:w-3 md:h-3" />
                    <span className="hidden sm:inline">BETTER</span>
                    <span className="sm:hidden">✓</span>
                  </div>
                )}
                <p className={`text-xl md:text-2xl font-bold transition-colors duration-500 ${
                  isBetter === 'B' ? 'text-green-800 dark:text-green-300' : 'text-amber-900 dark:text-amber-300'
                }`}>
                  {formatMetricValue(valueB)}
                  {unit && <span className="text-xs md:text-sm text-neutral-600 dark:text-neutral-400 ml-1">{unit}</span>}
                </p>
              </>
            ) : (
              <p className="text-xs md:text-sm text-neutral-400 dark:text-neutral-500">No data</p>
            )}
          </div>
        </div>
      </div>
    )
  }
  
  const ComparisonImage = ({ 
    imageA, 
    imageB, 
    title 
  }: { 
    imageA: string | null; 
    imageB: string | null; 
    title: string;
  }) => {
    const hasA = hasData(imageA)
    const hasB = hasData(imageB)
    
    if (!hasA && !hasB) return null
    
    return (
      <div className="mb-6 md:mb-8">
        <h4 className="font-semibold text-sm md:text-base text-neutral-900 dark:text-white mb-3 md:mb-4 transition-colors duration-500">{title}</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
          <div className="relative">
            {hasA ? (
              <div className="border-2 border-blue-300 dark:border-blue-700 rounded-lg overflow-hidden transition-colors duration-500">
                <div className="bg-blue-100 dark:bg-blue-900 px-3 py-1.5 text-xs font-semibold text-blue-900 dark:text-blue-100 uppercase tracking-wide transition-colors duration-500">
                  City A
                </div>
                <SafeImage
                  src={getImagePathA(imageA)}
                  alt={`${cityA.name} - ${title}`}
                  className="w-full aspect-video object-cover"
                />
              </div>
            ) : (
              <div className="aspect-video bg-neutral-100 dark:bg-neutral-800 rounded-lg flex items-center justify-center border border-neutral-200 dark:border-neutral-700 transition-colors duration-500">
                <p className="text-xs md:text-sm text-neutral-400 dark:text-neutral-500">No data available</p>
              </div>
            )}
          </div>
          <div className="relative">
            {hasB ? (
              <div className="border-2 border-amber-300 dark:border-amber-700 rounded-lg overflow-hidden transition-colors duration-500">
                <div className="bg-amber-100 dark:bg-amber-900 px-3 py-1.5 text-xs font-semibold text-amber-900 dark:text-amber-100 uppercase tracking-wide transition-colors duration-500">
                  City B
                </div>
                <SafeImage
                  src={getImagePathB(imageB)}
                  alt={`${cityB.name} - ${title}`}
                  className="w-full aspect-video object-cover"
                />
              </div>
            ) : (
              <div className="aspect-video bg-neutral-100 dark:bg-neutral-800 rounded-lg flex items-center justify-center border border-neutral-200 dark:border-neutral-700 transition-colors duration-500">
                <p className="text-xs md:text-sm text-neutral-400 dark:text-neutral-500">No data available</p>
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }
  
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
          
          <div className="mb-4">
            <div className="inline-block px-3 py-1 bg-primary-100 dark:bg-primary-900/30 text-primary-800 dark:text-primary-200 text-xs font-semibold rounded-full mb-2 md:mb-3 uppercase tracking-wide transition-colors duration-500">
              Comparison Mode
            </div>
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-neutral-900 dark:text-white transition-colors duration-500">Side-by-Side Analysis</h1>
            <p className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-400 mt-2 mb-3 transition-colors duration-500">
              💡 <strong>Tip:</strong> Click "Show Insights" buttons in each section to learn about the differences
            </p>
            <div className="flex flex-wrap items-center gap-3 md:gap-4 p-3 bg-neutral-50 dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700 transition-colors duration-500">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 md:w-4 md:h-4 rounded bg-blue-400 border-2 border-blue-600"></div>
                <span className="text-[10px] md:text-xs font-medium text-neutral-700 dark:text-neutral-300">City A</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 md:w-4 md:h-4 rounded bg-amber-400 border-2 border-amber-600"></div>
                <span className="text-[10px] md:text-xs font-medium text-neutral-700 dark:text-neutral-300">City B</span>
              </div>
              <div className="flex items-center gap-2 w-full sm:w-auto sm:ml-auto">
                <div className="w-3 h-3 md:w-4 md:h-4 rounded bg-green-400 border-2 border-green-600"></div>
                <span className="text-[10px] md:text-xs font-medium text-neutral-700 dark:text-neutral-300">Better Performance</span>
              </div>
            </div>
          </div>
          
          {/* City Selectors */}
          <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] gap-3 md:gap-4 items-center mt-6">
            <div className="p-3 md:p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border-2 border-blue-300 dark:border-blue-700 transition-colors duration-500">
              <label className="text-xs font-semibold text-blue-900 dark:text-blue-100 uppercase tracking-wide mb-2 block transition-colors duration-500">
                City A
              </label>
              <select
                value={cityA.id}
                onChange={(e) => navigate(`/compare/${e.target.value}/${cityB.id}`)}
                className="w-full p-2 border border-blue-300 dark:border-blue-700 rounded-lg font-semibold text-sm md:text-base text-neutral-900 dark:text-white bg-white dark:bg-neutral-800 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors duration-500"
              >
                {cities.map((city) => (
                  <option key={city.id} value={city.id} disabled={city.id === cityB.id}>
                    {city.name}
                  </option>
                ))}
              </select>
              {cityA.location.country && (
                <p className="text-neutral-600 dark:text-neutral-400 text-xs md:text-sm mt-2 transition-colors duration-500">{cityA.location.country}</p>
              )}
            </div>
            
            <div className="flex justify-center py-2 md:py-0">
              <ArrowLeftRight className="w-5 h-5 md:w-6 md:h-6 text-neutral-400 dark:text-neutral-500 transform rotate-90 md:rotate-0" />
            </div>
            
            <div className="p-3 md:p-4 bg-amber-50 dark:bg-amber-900/20 rounded-lg border-2 border-amber-300 dark:border-amber-700 transition-colors duration-500">
              <label className="text-xs font-semibold text-amber-900 dark:text-amber-100 uppercase tracking-wide mb-2 block transition-colors duration-500">
                City B
              </label>
              <select
                value={cityB.id}
                onChange={(e) => navigate(`/compare/${cityA.id}/${e.target.value}`)}
                className="w-full p-2 border border-amber-300 dark:border-amber-700 rounded-lg font-semibold text-sm md:text-base text-neutral-900 dark:text-white bg-white dark:bg-neutral-800 focus:outline-none focus:ring-2 focus:ring-amber-500 transition-colors duration-500"
              >
                {cities.map((city) => (
                  <option key={city.id} value={city.id} disabled={city.id === cityA.id}>
                    {city.name}
                  </option>
                ))}
              </select>
              {cityB.location.country && (
                <p className="text-neutral-600 dark:text-neutral-400 text-xs md:text-sm mt-2 transition-colors duration-500">{cityB.location.country}</p>
              )}
            </div>
          </div>
        </div>
      </section>
      
      <div className="container mx-auto px-4 sm:px-6 py-8 sm:py-12">
        
        {/* Urban Indicators Comparison */}
        <div className="card mb-12">
          <h3 className="text-2xl font-bold text-neutral-900 dark:text-white mb-6 transition-colors duration-500">Urban Indicators</h3>
          <ComparisonMetric
            label="Building Intensity"
            valueA={cityA.urbanIndicators.buildingIntensity}
            valueB={cityB.urbanIndicators.buildingIntensity}
          />
          <ComparisonMetric
            label="Green Space"
            valueA={cityA.urbanIndicators.greenSpacePercentage}
            valueB={cityB.urbanIndicators.greenSpacePercentage}
            unit="%"
            higherIsBetter={true}
          />
          {quarterA && quarterB && (
            <>
              <ComparisonMetric
                label="Average Floors"
                valueA={quarterA.indicators.avgFloors}
                valueB={quarterB.indicators.avgFloors}
              />
              <ComparisonMetric
                label="Building Coverage"
                valueA={quarterA.indicators.buildingCoverage}
                valueB={quarterB.indicators.buildingCoverage}
                unit="%"
                higherIsBetter={false}
              />
              <ComparisonMetric
                label="Tree Count"
                valueA={quarterA.indicators.treeCount}
                valueB={quarterB.indicators.treeCount}
                higherIsBetter={true}
              />
            </>
          )}
          
          <InsightsSection 
            insights={morphologyInsights} 
            isOpen={showMorphologyInsights} 
            onToggle={() => setShowMorphologyInsights(!showMorphologyInsights)} 
          />
        </div>
        
        {/* Urban Form Comparison */}
        <div className="card mb-12">
          <h3 className="text-2xl font-bold text-neutral-900 dark:text-white mb-6 transition-colors duration-500">Urban Form</h3>
          <ComparisonImage
            imageA={cityA.overview.schwarzplanImage}
            imageB={cityB.overview.schwarzplanImage}
            title="Schwarzplan (Figure-Ground)"
          />
          <ComparisonImage
            imageA={cityA.overview.model3dImage}
            imageB={cityB.overview.model3dImage}
            title="3D Model"
          />
          
          <InsightsSection 
            insights={urbanFormInsights} 
            isOpen={showUrbanFormInsights} 
            onToggle={() => setShowUrbanFormInsights(!showUrbanFormInsights)} 
          />
        </div>
        
        {/* Shading Analysis Comparison */}
        <div className="card mb-12">
          <h3 className="text-2xl font-bold text-neutral-900 dark:text-white mb-6 transition-colors duration-500">Seasonal Shading</h3>
          <ComparisonImage
            imageA={cityA.shadingAnalysis.marchSeptember}
            imageB={cityB.shadingAnalysis.marchSeptember}
            title="March/September (Equinox)"
          />
          <ComparisonImage
            imageA={cityA.shadingAnalysis.june}
            imageB={cityB.shadingAnalysis.june}
            title="June (Summer Solstice)"
          />
          <ComparisonImage
            imageA={cityA.shadingAnalysis.december}
            imageB={cityB.shadingAnalysis.december}
            title="December (Winter Solstice)"
          />
        </div>
        
        {/* Daylight Metrics Comparison */}
        {quarterA && quarterB && (
          <div className="card mb-12">
            <h3 className="text-2xl font-bold text-neutral-900 dark:text-white mb-6 transition-colors duration-500">Daylight Performance Metrics</h3>
            
            {(quarterA.daylightFactor || quarterB.daylightFactor) && (
              <>
                <h4 className="font-semibold text-neutral-900 dark:text-white mb-4 transition-colors duration-500">Daylight Factor (DF)</h4>
                <ComparisonMetric
                  label="Average DF"
                  valueA={quarterA.daylightFactor?.simulation1?.avgValue}
                  valueB={quarterB.daylightFactor?.simulation1?.avgValue}
                  unit="%"
                  higherIsBetter={true}
                />
                <ComparisonImage
                  imageA={quarterA.daylightFactor?.simulation1?.image || null}
                  imageB={quarterB.daylightFactor?.simulation1?.image || null}
                  title="Daylight Factor Distribution"
                />
              </>
            )}
            
            {(quarterA.spatialDaylightAutonomy || quarterB.spatialDaylightAutonomy) && (
              <>
                <h4 className="font-semibold text-neutral-900 dark:text-white mt-8 mb-4 transition-colors duration-500">Spatial Daylight Autonomy (sDA)</h4>
                <ComparisonMetric
                  label="sDA Value"
                  valueA={quarterA.spatialDaylightAutonomy?.simulation1?.autonomy}
                  valueB={quarterB.spatialDaylightAutonomy?.simulation1?.autonomy}
                  unit="%"
                  higherIsBetter={true}
                />
                <ComparisonImage
                  imageA={quarterA.spatialDaylightAutonomy?.simulation1?.image || null}
                  imageB={quarterB.spatialDaylightAutonomy?.simulation1?.image || null}
                  title="Spatial Daylight Autonomy"
                />
              </>
            )}
            
            {(quarterA.usefulDaylightIlluminance || quarterB.usefulDaylightIlluminance) && (
              <>
                <h4 className="font-semibold text-neutral-900 dark:text-white mt-8 mb-4 transition-colors duration-500">Useful Daylight Illuminance (UDI)</h4>
                <ComparisonMetric
                  label="Average UDI"
                  valueA={quarterA.usefulDaylightIlluminance?.simulation1?.avgValue}
                  valueB={quarterB.usefulDaylightIlluminance?.simulation1?.avgValue}
                  unit="%"
                  higherIsBetter={true}
                />
                <ComparisonImage
                  imageA={quarterA.usefulDaylightIlluminance?.simulation1?.image || null}
                  imageB={quarterB.usefulDaylightIlluminance?.simulation1?.image || null}
                  title="Useful Daylight Illuminance"
                />
              </>
            )}
            
            <InsightsSection 
              insights={daylightInsights} 
              isOpen={showDaylightInsights} 
              onToggle={() => setShowDaylightInsights(!showDaylightInsights)} 
            />
          </div>
        )}
      </div>
    </Layout>
  )
}

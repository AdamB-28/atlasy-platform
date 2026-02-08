import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, MapPin, Calendar, Building, Leaf, Train, GitCompare, ChevronRight, Lightbulb, ChevronDown, ChevronUp } from 'lucide-react'
import Layout from '../components/Layout'
import QuarterDetail from '../components/QuarterDetail'
import SafeImage from '../components/SafeImage'
import { LoadingSpinner, ErrorMessage, NoData } from '../components/LoadingStates'
import { useCity, useCities } from '../hooks/useCitiesData'
import { hasData, getCityFolderName } from '../utils/helpers'
import { useState } from 'react'

export default function CityPage() {
  const { cityId } = useParams<{ cityId: string }>()
  const { city, loading, error } = useCity(cityId || '')
  const { cities } = useCities()
  const navigate = useNavigate()
  const [showUrbanInsights, setShowUrbanInsights] = useState(false)
  const [showShadingInsights, setShowShadingInsights] = useState(false)
  
  if (loading) return <Layout><LoadingSpinner /></Layout>
  if (error) return <Layout><ErrorMessage error={error} /></Layout>
  if (!city) return <Layout><NoData message="City not found" /></Layout>
  
  const cityFolder = getCityFolderName(city.name)
  const getImagePath = (imageName: string | null) => {
    if (!imageName) return ''
    return `${import.meta.env.BASE_URL}${cityFolder}/${imageName}.PNG`
  }
  
  const otherCities = cities.filter(c => c.id !== city.id)
  
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
                City Analysis
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
                  💡 <strong>Next step:</strong> Scroll down to explore metrics, or use "Compare" button to analyze against another city
                </p>
              </div>
            </div>
            
            {otherCities.length > 0 && (
              <div className="w-full md:w-auto">
                <div className="md:relative group">
                  <button className="btn-primary flex items-center justify-center gap-2 w-full text-sm md:text-base">
                    <GitCompare className="w-4 h-4" />
                    <span className="hidden sm:inline">Compare with Another City</span>
                    <span className="sm:hidden">Compare</span>
                  </button>
                  
                  <div className="md:absolute right-0 top-full mt-2 w-full md:w-80 bg-white dark:bg-neutral-800 rounded-lg shadow-xl border border-neutral-200 dark:border-neutral-700 md:opacity-0 md:invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-10 max-h-0 md:max-h-none overflow-hidden group-hover:max-h-96">
                    <div className="p-3">
                      <p className="text-[10px] md:text-xs text-neutral-500 dark:text-neutral-400 uppercase tracking-wide font-semibold mb-2 px-2 transition-colors duration-500">
                        Select a city to compare
                      </p>
                      {otherCities.map((otherCity) => (
                        <button
                          key={otherCity.id}
                          onClick={() => navigate(`/compare/${city.id}/${otherCity.id}`)}
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
                    className="w-full rounded-lg"
                  />
                </div>
              )}
            </div>
          </div>
        )}
        
        {/* Urban Indicators */}
        <div className="mb-8 md:mb-12">
          <h2 className="text-xl md:text-2xl font-bold text-neutral-900 dark:text-white mb-4 md:mb-6 transition-colors duration-500">Urban Indicators</h2>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            {hasData(city.urbanIndicators.buildingIntensity) && (
              <div className="card">
                <div className="flex items-center gap-3 mb-3">
                  <Building className="w-4 h-4 md:w-5 md:h-5 text-primary-600" />
                  <h3 className="text-sm md:text-base font-semibold text-neutral-900 dark:text-white transition-colors duration-500">Building Intensity</h3>
                </div>
                <p className="text-xl md:text-2xl font-bold text-neutral-900 dark:text-white transition-colors duration-500">
                  {city.urbanIndicators.buildingIntensity}
                </p>
                {hasData(city.urbanIndicators.buildingTypes) && (
                  <p className="text-xs md:text-sm text-neutral-600 dark:text-neutral-400 mt-3 leading-relaxed transition-colors duration-500">
                    {city.urbanIndicators.buildingTypes}
                  </p>
                )}
              </div>
            )}
            
            {hasData(city.urbanIndicators.greenSpacePercentage) && (
              <div className="card">
                <div className="flex items-center gap-3 mb-3">
                  <Leaf className="w-4 h-4 md:w-5 md:h-5 text-green-600" />
                  <h3 className="text-sm md:text-base font-semibold text-neutral-900 dark:text-white transition-colors duration-500">Green Space</h3>
                </div>
                <p className="text-xl md:text-2xl font-bold text-neutral-900 dark:text-white transition-colors duration-500">
                  {city.urbanIndicators.greenSpacePercentage}
                </p>
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
        
        {/* Quarters */}
        {city.quarters.length > 0 && (
          <div>
            <h2 className="text-xl md:text-2xl font-bold text-neutral-900 dark:text-white mb-4 md:mb-6 transition-colors duration-500">
              Detailed Analysis by Quarter
            </h2>
            
            <div className="space-y-12">
              {city.quarters.map((quarter) => (
                <div key={quarter.id} className="border-t border-neutral-200 dark:border-neutral-700 pt-12 first:border-t-0 first:pt-0 transition-colors duration-500">
                  <QuarterDetail quarter={quarter} cityName={city.name} />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </Layout>
  )
}

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Sun, Globe, TrendingUp, Info } from 'lucide-react'
import Layout from '../components/Layout'
import InteractiveMap from '../components/InteractiveMap'
import CityCard from '../components/CityCard'
import { LoadingSpinner, ErrorMessage } from '../components/LoadingStates'
import { useCities } from '../hooks/useCitiesData'
import type { City } from '../types'

export default function HomePage() {
  const { cities, loading, error } = useCities()
  const [selectedCity, setSelectedCity] = useState<City | null>(null)
  const navigate = useNavigate()
  
  if (loading) return <Layout><LoadingSpinner /></Layout>
  if (error) return <Layout><ErrorMessage error={error} /></Layout>
  
  const handleCityClick = (city: City) => {
    setSelectedCity(city)
  }
  
  const handleCitySelect = (city: City) => {
    navigate(`/city/${city.id}`)
  }
  
  return (
    <Layout>
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-primary-50 to-neutral-50 dark:from-neutral-800 dark:to-black border-b border-neutral-200 dark:border-neutral-700 transition-colors duration-500">
        <div className="container mx-auto px-4 sm:px-6 py-8 sm:py-12 md:py-16">
          <div>
            <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-neutral-900 dark:text-white mb-4 sm:mb-6 transition-colors duration-500">
              Understanding Urban Daylight & Energy Performance
            </h1>
            <p className="text-sm sm:text-base md:text-lg text-neutral-600 dark:text-neutral-300 mb-4 sm:mb-6 md:mb-8 leading-relaxed transition-colors duration-500">
              An educational platform for architecture, urbanism, and energy engineering students 
              to explore how cities interact with daylight, energy, and environmental performance. 
              Compare real-world case studies and learn from data-driven analysis.
            </p>
            
            {/* How to Use Instructions */}
            <div className="bg-white dark:bg-neutral-800 rounded-lg border-2 border-primary-200 dark:border-primary-700 p-4 sm:p-6 mb-4 sm:mb-6 transition-colors duration-500">
              <h2 className="text-lg sm:text-xl font-bold text-neutral-900 dark:text-white mb-3 sm:mb-4 flex items-center gap-2 transition-colors duration-500">
                <span className="text-2xl">📖</span>
                How to Use This Platform
              </h2>
              <ol className="space-y-2 sm:space-y-3 text-xs sm:text-sm md:text-base text-neutral-700 dark:text-neutral-300 transition-colors duration-500">
                <li className="flex gap-2 sm:gap-3">
                  <span className="font-bold text-primary-600 flex-shrink-0 text-sm sm:text-base">1.</span>
                  <span><strong className="text-neutral-900 dark:text-white">Explore Cities:</strong> Click on a city in the sidebar or on the interactive map below</span>
                </li>
                <li className="flex gap-2 sm:gap-3">
                  <span className="font-bold text-primary-600 flex-shrink-0 text-sm sm:text-base">2.</span>
                  <span><strong className="text-neutral-900 dark:text-white">View Details:</strong> See comprehensive urban analysis, daylight metrics, and performance data</span>
                </li>
                <li className="flex gap-2 sm:gap-3">
                  <span className="font-bold text-primary-600 flex-shrink-0 text-sm sm:text-base">3.</span>
                  <span><strong className="text-neutral-900 dark:text-white">Compare:</strong> Click "Compare with..." button to analyze two cities side by side</span>
                </li>
                <li className="flex gap-2 sm:gap-3">
                  <span className="font-bold text-primary-600 flex-shrink-0 text-sm sm:text-base">4.</span>
                  <span><strong className="text-neutral-900 dark:text-white">Learn Insights:</strong> Toggle "Show Insights" in comparison mode for educational explanations</span>
                </li>
              </ol>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 md:gap-6 mt-6 sm:mt-8 md:mt-12">
              <div className="flex items-start gap-2 sm:gap-3 p-3 sm:p-4 bg-white dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700 transition-colors duration-500">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center flex-shrink-0 transition-colors duration-500">
                  <Sun className="w-5 h-5 sm:w-6 sm:h-6 text-primary-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-neutral-900 dark:text-white text-xs sm:text-sm md:text-base">Daylight Analysis</h3>
                  <p className="text-[10px] sm:text-xs md:text-sm text-neutral-600 dark:text-neutral-400 mt-1 transition-colors duration-500">
                    Study daylight factors, autonomy, and illuminance metrics
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-2 sm:gap-3 p-3 sm:p-4 bg-white dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700 transition-colors duration-500">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center flex-shrink-0 transition-colors duration-500">
                  <Globe className="w-5 h-5 sm:w-6 sm:h-6 text-primary-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-neutral-900 dark:text-white text-xs sm:text-sm md:text-base">Urban Morphology</h3>
                  <p className="text-[10px] sm:text-xs md:text-sm text-neutral-600 dark:text-neutral-400 mt-1 transition-colors duration-500">
                    Explore density, form, and spatial configuration
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-2 sm:gap-3 p-3 sm:p-4 bg-white dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700 transition-colors duration-500">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center flex-shrink-0 transition-colors duration-500">
                  <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6 text-primary-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-neutral-900 dark:text-white text-xs sm:text-sm md:text-base">Energy Performance</h3>
                  <p className="text-[10px] sm:text-xs md:text-sm text-neutral-600 dark:text-neutral-400 mt-1 transition-colors duration-500">
                    Analyze solar potential and environmental impact
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      
      {/* IEA Mission Context */}
      <section className="bg-white dark:bg-neutral-900 border-b border-neutral-200 dark:border-neutral-700 py-8 sm:py-12 transition-colors duration-500">
        <div className="container mx-auto px-4 sm:px-6">
          <div>
            <div className="flex items-start gap-3 sm:gap-4 p-4 sm:p-6 bg-primary-50 dark:bg-primary-900/20 rounded-lg border border-primary-100 dark:border-primary-800 transition-colors duration-500">
              <Info className="w-5 h-5 sm:w-6 sm:h-6 text-primary-600 flex-shrink-0 mt-0.5 sm:mt-1" />
              <div>
                <h3 className="text-sm sm:text-base font-semibold text-neutral-900 dark:text-white mb-2">Educational Context</h3>
                <p className="text-xs sm:text-sm text-neutral-700 dark:text-neutral-300 leading-relaxed transition-colors duration-500">
                  This platform draws inspiration from the <strong>International Energy Agency (IEA)</strong>'s 
                  mission to promote energy security and sustainable urban development. The IEA emphasizes 
                  data-driven decision-making, transparency, and education in addressing global energy challenges. 
                  Similarly, this resource aims to educate the next generation of architects and urban planners 
                  on the critical relationship between built environment design and energy performance.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
      
      {/* Main Exploration Section */}
      <section className="py-6 sm:py-8 md:py-12">
        <div className="container mx-auto px-4 sm:px-6">
          <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-neutral-900 dark:text-white mb-4 sm:mb-6 md:mb-8 transition-colors duration-500">Explore Cities</h2>
          
          <div className="grid lg:grid-cols-[320px_1fr] xl:grid-cols-[380px_1fr] gap-4 sm:gap-6 md:gap-8 items-start">
            {/* Sidebar - City List */}
            <aside className="space-y-3 sm:space-y-4">
              <div className="lg:sticky lg:top-24">
                <h3 className="text-xs sm:text-sm font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wide mb-3 sm:mb-4 transition-colors duration-500">
                  📍 Locations Studied ({cities.length})
                </h3>
                <p className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-400 mb-3 sm:mb-4 lg:hidden transition-colors duration-500">
                  👇 Click a city below or tap markers on the map
                </p>
                
                <div className="space-y-3">
                  {cities.map((city) => (
                    <div 
                      key={city.id}
                      className={`transition-all ${
                        selectedCity?.id === city.id 
                          ? 'ring-2 ring-primary-500 rounded-lg' 
                          : ''
                      }`}
                    >
                      <CityCard
                        name={city.name}
                        country={city.location.country}
                        onClick={() => handleCityClick(city)}
                      />
                    </div>
                  ))}
                </div>
                
                {selectedCity && (
                  <div className="mt-4 sm:mt-6 p-4 sm:p-6 bg-gradient-to-br from-primary-50 to-primary-100 dark:from-primary-900/30 dark:to-primary-800/30 border-2 border-primary-300 dark:border-primary-700 rounded-lg shadow-md transition-colors duration-500">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-2 h-2 rounded-full bg-primary-600 dark:bg-primary-400 animate-pulse"></div>
                      <p className="text-xs sm:text-sm font-semibold text-primary-900 dark:text-primary-100 uppercase tracking-wide transition-colors duration-500">
                        Selected City
                      </p>
                    </div>
                    <p className="text-base sm:text-lg font-bold text-neutral-900 dark:text-white mb-2 transition-colors duration-500">
                      {selectedCity.name}
                    </p>
                    <p className="text-xs text-neutral-600 dark:text-neutral-400 text-center mt-2 transition-colors duration-500">
                      Use the button below the map to view complete analysis
                    </p>
                  </div>
                )}
              </div>
            </aside>
            
            {/* Main Content - Map */}
            <div className="space-y-3 sm:space-y-4">
              <div className="h-[350px] sm:h-[450px] lg:h-[550px] xl:h-[600px] bg-white dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700 overflow-hidden shadow-sm transition-colors duration-500">
                <InteractiveMap
                  cities={cities}
                  selectedCity={selectedCity}
                  onCitySelect={handleCityClick}
                />
              </div>
              
              {selectedCity && (
                <button
                  onClick={() => handleCitySelect(selectedCity)}
                  className="w-full btn-primary text-sm sm:text-base py-3 sm:py-4 shadow-lg hover:shadow-xl transform hover:scale-[1.02] transition-all"
                >
                  View Complete Analysis of {selectedCity.name} →
                </button>
              )}
            </div>
          </div>
        </div>
      </section>
      
      {/* Educational Note */}
      <section className="bg-neutral-100 dark:bg-black py-8 sm:py-12 transition-colors duration-500">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="max-w-4xl mx-auto text-center">
            <h3 className="text-xl sm:text-2xl font-bold text-neutral-900 dark:text-white mb-3 sm:mb-4 transition-colors duration-500">
              Why Study Urban Daylight?
            </h3>
            <p className="text-xs sm:text-sm md:text-base text-neutral-700 dark:text-neutral-300 leading-relaxed mb-4 sm:mb-6 transition-colors duration-500">
              Access to natural daylight is fundamental to human wellbeing, energy efficiency, and 
              sustainable urban design. Understanding how urban form influences daylight availability 
              helps architects and planners create healthier, more livable cities while reducing 
              artificial lighting demand and associated carbon emissions.
            </p>
            <p className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-400 transition-colors duration-500">
              This platform currently features <strong>{cities.length} case studies</strong> from 
              diverse urban contexts, with more to come.
            </p>
          </div>
        </div>
      </section>
    </Layout>
  )
}

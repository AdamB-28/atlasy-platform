import { hasData, formatMetricValue, getCityFolderName } from '../utils/helpers'
import type { Quarter } from '../types'
import SafeImage from './SafeImage'

interface MetricCardProps {
  label: string
  value: string | number | null
  unit?: string
}

function MetricCard({ label, value, unit }: MetricCardProps) {
  if (!hasData(value)) {
    return (
      <div className="p-3 md:p-4 bg-neutral-50 dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700 transition-colors duration-500">
        <p className="metric-label text-xs md:text-sm">{label}</p>
        <p className="text-xs md:text-sm text-neutral-400 dark:text-neutral-500 mt-2">No data available</p>
      </div>
    )
  }
  
  return (
    <div className="p-3 md:p-4 bg-white dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700 transition-colors duration-500">
      <p className="metric-label text-xs md:text-sm">{label}</p>
      <p className="metric-value text-xl md:text-2xl">
        {formatMetricValue(value)}
        {unit && <span className="text-xs md:text-base text-neutral-500 dark:text-neutral-400 ml-1">{unit}</span>}
      </p>
    </div>
  )
}

interface QuarterDetailProps {
  quarter: Quarter
  cityName: string
}

export default function QuarterDetail({ quarter, cityName }: QuarterDetailProps) {
  const cityFolder = getCityFolderName(cityName)
  const getImagePath = (imageName: string | null) => {
    if (!imageName) return ''
    return `${import.meta.env.BASE_URL}${cityFolder}/${imageName}.PNG`
  }
  
  return (
    <div className="space-y-6 md:space-y-8">
      {/* Quarter Header */}
      <div>
        <h3 className="text-xl md:text-2xl font-bold text-neutral-900 dark:text-white mb-2 transition-colors duration-500">{quarter.name}</h3>
        {hasData(quarter.function) && (
          <p className="text-sm md:text-base text-neutral-600 dark:text-neutral-400 transition-colors duration-500">{quarter.function}</p>
        )}
      </div>
      
      {/* Plans and 3D Views */}
      {(hasData(quarter.plan) || hasData(quarter.form3d)) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
          {hasData(quarter.plan) && (
            <div className="card">
              <h4 className="section-title text-base md:text-lg">Site Plan</h4>
              <SafeImage
                src={getImagePath(quarter.plan)}
                alt={`${quarter.name} plan`}
                className="w-full rounded-lg"
              />
            </div>
          )}
          
          {hasData(quarter.form3d) && (
            <div className="card">
              <h4 className="section-title text-base md:text-lg">3D Form</h4>
              <SafeImage
                src={getImagePath(quarter.form3d)}
                alt={`${quarter.name} 3D`}
                className="w-full rounded-lg"
              />
            </div>
          )}
        </div>
      )}
      
      {/* Urban Indicators */}
      <div className="card">
        <h4 className="section-title text-base md:text-lg">Urban Indicators</h4>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
          <MetricCard 
            label="Building Intensity" 
            value={quarter.indicators.buildingIntensity}
          />
          <MetricCard 
            label="Green Space Ratio" 
            value={quarter.indicators.greenSpaceRatio}
            unit="%"
          />
          <MetricCard 
            label="Building Coverage" 
            value={quarter.indicators.buildingCoverage}
            unit="%"
          />
          <MetricCard 
            label="Average Floors" 
            value={quarter.indicators.avgFloors}
          />
          <MetricCard 
            label="Tree Count" 
            value={quarter.indicators.treeCount}
          />
          <MetricCard 
            label="H/W Ratio" 
            value={quarter.indicators.heightToWidthRatio}
          />
          <MetricCard 
            label="Street Width" 
            value={quarter.indicators.streetWidth}
          />
        </div>
      </div>
      
      {/* Sun Hours Analysis */}
      {hasData(quarter.sunHours) && (
        <div className="card">
          <h4 className="section-title text-base md:text-lg">Sun Hours Analysis</h4>
          <SafeImage
            src={getImagePath(quarter.sunHours)}
            alt="Sun hours analysis"
            className="w-full rounded-lg"
          />
        </div>
      )}
      
      {/* Daylight Potential */}
      {(hasData(quarter.daylightPotential) || hasData(quarter.daylightPotential2)) && (
        <div className="card">
          <h4 className="section-title text-base md:text-lg">Daylight Potential</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
            {hasData(quarter.daylightPotential) && (
              <div>
                <SafeImage
                  src={getImagePath(quarter.daylightPotential)}
                  alt="Daylight potential"
                  className="w-full rounded-lg"
                />
              </div>
            )}
            {hasData(quarter.daylightPotential2) && (
              <div>
                <SafeImage
                  src={getImagePath(quarter.daylightPotential2 || null)}
                  alt="Daylight potential 2"
                  className="w-full rounded-lg"
                />
              </div>
            )}
          </div>
        </div>
      )}
      
      {/* Solar Energy Analysis */}
      {hasData(quarter.solarEnergy) && (
        <div className="card">
          <h4 className="section-title text-base md:text-lg">Solar Energy Analysis</h4>
          <SafeImage
            src={getImagePath(quarter.solarEnergy || null)}
            alt="Solar energy analysis"
            className="w-full rounded-lg"
          />
        </div>
      )}
      
      {/* Daylight Factor (DF) */}
      {quarter.daylightFactor && (
        <div className="card">
          <h4 className="section-title text-base md:text-lg">Daylight Factor (DF) Analysis</h4>
          <p className="text-xs md:text-sm text-neutral-600 dark:text-neutral-400 mb-4 md:mb-6 transition-colors duration-500">
            The Daylight Factor measures the ratio of interior illuminance to exterior illuminance 
            under overcast sky conditions, expressed as a percentage.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
            {/* Worst Case */}
            {hasData(quarter.daylightFactor.simulation1?.image) && (
              <div className="space-y-3">
                <h5 className="text-sm md:text-base font-semibold text-neutral-900 dark:text-white transition-colors duration-500">Worst Case Scenario</h5>
                <SafeImage
                  src={getImagePath(quarter.daylightFactor.simulation1.image)}
                  alt="Daylight Factor - Worst Case"
                  className="w-full rounded-lg border border-neutral-200 dark:border-neutral-700"
                />
                {hasData(quarter.daylightFactor.simulation1.avgValue) && (
                  <MetricCard
                    label="Average DF"
                    value={quarter.daylightFactor.simulation1.avgValue || null}
                    unit="%"
                  />
                )}
                {hasData(quarter.daylightFactor.simulation1.description) && (
                  <p className="text-xs md:text-sm text-neutral-600 dark:text-neutral-400 p-3 md:p-4 bg-neutral-50 dark:bg-neutral-800 rounded-lg transition-colors duration-500">
                    {quarter.daylightFactor.simulation1.description}
                  </p>
                )}
              </div>
            )}
            
            {/* Best Case */}
            {hasData(quarter.daylightFactor.simulation2?.image) && (
              <div className="space-y-3">
                <h5 className="text-sm md:text-base font-semibold text-neutral-900 dark:text-white transition-colors duration-500">Best Case Scenario</h5>
                <SafeImage
                  src={getImagePath(quarter.daylightFactor.simulation2.image)}
                  alt="Daylight Factor - Best Case"
                  className="w-full rounded-lg border border-neutral-200 dark:border-neutral-700"
                />
                {hasData(quarter.daylightFactor.simulation2.avgValue) && (
                  <MetricCard
                    label="Average DF"
                    value={quarter.daylightFactor.simulation2.avgValue || null}
                    unit="%"
                  />
                )}
                {hasData(quarter.daylightFactor.simulation2.description) && (
                  <p className="text-xs md:text-sm text-neutral-600 dark:text-neutral-400 p-3 md:p-4 bg-neutral-50 dark:bg-neutral-800 rounded-lg transition-colors duration-500">
                    {quarter.daylightFactor.simulation2.description}
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      )}
      
      {/* Spatial Daylight Autonomy (sDA) */}
      {quarter.spatialDaylightAutonomy && (
        <div className="card">
          <h4 className="section-title text-base md:text-lg">Spatial Daylight Autonomy (sDA)</h4>
          <p className="text-xs md:text-sm text-neutral-600 dark:text-neutral-400 mb-4 md:mb-6 transition-colors duration-500">
            sDA measures the percentage of floor area that receives adequate daylight (typically 300 lux) 
            for at least 50% of annual occupied hours.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
            {hasData(quarter.spatialDaylightAutonomy.simulation1?.image) && (
              <div className="space-y-3">
                <h5 className="text-sm md:text-base font-semibold text-neutral-900 dark:text-white transition-colors duration-500">Worst Case Scenario</h5>
                <SafeImage
                  src={getImagePath(quarter.spatialDaylightAutonomy.simulation1.image)}
                  alt="sDA - Worst Case"
                  className="w-full rounded-lg border border-neutral-200 dark:border-neutral-700"
                />
                {hasData(quarter.spatialDaylightAutonomy.simulation1.autonomy) && (
                  <MetricCard
                    label="Autonomy"
                    value={quarter.spatialDaylightAutonomy.simulation1.autonomy || null}
                    unit="%"
                  />
                )}
              </div>
            )}
            
            {hasData(quarter.spatialDaylightAutonomy.simulation2?.image) && (
              <div className="space-y-3">
                <h5 className="text-sm md:text-base font-semibold text-neutral-900 dark:text-white transition-colors duration-500">Best Case Scenario</h5>
                <SafeImage
                  src={getImagePath(quarter.spatialDaylightAutonomy.simulation2.image)}
                  alt="sDA - Best Case"
                  className="w-full rounded-lg border border-neutral-200 dark:border-neutral-700"
                />
                {hasData(quarter.spatialDaylightAutonomy.simulation2.autonomy) && (
                  <MetricCard
                    label="Autonomy"
                    value={quarter.spatialDaylightAutonomy.simulation2.autonomy || null}
                    unit="%"
                  />
                )}
              </div>
            )}
          </div>
          
          {hasData(quarter.spatialDaylightAutonomy.interpretation) && (
            <div className="mt-4 md:mt-6 p-3 md:p-4 bg-primary-50 dark:bg-primary-900/20 border border-primary-100 dark:border-primary-800 rounded-lg transition-colors duration-500">
              <h5 className="text-sm md:text-base font-semibold text-neutral-900 dark:text-white mb-2 transition-colors duration-500">Interpretation</h5>
              <p className="text-xs md:text-sm text-neutral-700 dark:text-neutral-300 transition-colors duration-500">
                {quarter.spatialDaylightAutonomy.interpretation}
              </p>
            </div>
          )}
        </div>
      )}
      
      {/* Useful Daylight Illuminance (UDI) */}
      {quarter.usefulDaylightIlluminance && (
        <div className="card">
          <h4 className="section-title text-base md:text-lg">Useful Daylight Illuminance (UDI)</h4>
          <p className="text-xs md:text-sm text-neutral-600 dark:text-neutral-400 mb-4 md:mb-6 transition-colors duration-500">
            UDI measures the percentage of time when daylight levels are within a useful range 
            (typically 100-3000 lux), avoiding both insufficient and excessive daylight.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
            {hasData(quarter.usefulDaylightIlluminance.simulation1?.image) && (
              <div className="space-y-3">
                <h5 className="text-sm md:text-base font-semibold text-neutral-900 dark:text-white transition-colors duration-500">Worst Case Scenario</h5>
                <SafeImage
                  src={getImagePath(quarter.usefulDaylightIlluminance.simulation1.image)}
                  alt="UDI - Worst Case"
                  className="w-full rounded-lg border border-neutral-200 dark:border-neutral-700"
                />
                {hasData(quarter.usefulDaylightIlluminance.simulation1.avgValue) && (
                  <MetricCard
                    label="Average UDI"
                    value={quarter.usefulDaylightIlluminance.simulation1.avgValue || null}
                    unit="%"
                  />
                )}
              </div>
            )}
            
            {hasData(quarter.usefulDaylightIlluminance.simulation2?.image) && (
              <div className="space-y-3">
                <h5 className="text-sm md:text-base font-semibold text-neutral-900 dark:text-white transition-colors duration-500">Best Case Scenario</h5>
                <SafeImage
                  src={getImagePath(quarter.usefulDaylightIlluminance.simulation2.image)}
                  alt="UDI - Best Case"
                  className="w-full rounded-lg border border-neutral-200 dark:border-neutral-700"
                />
                {hasData(quarter.usefulDaylightIlluminance.simulation2.avgValue) && (
                  <MetricCard
                    label="Average UDI"
                    value={quarter.usefulDaylightIlluminance.simulation2.avgValue || null}
                    unit="%"
                  />
                )}
              </div>
            )}
          </div>
          
          {hasData(quarter.usefulDaylightIlluminance.interpretation) && (
            <div className="mt-4 md:mt-6 p-3 md:p-4 bg-primary-50 dark:bg-primary-900/20 border border-primary-100 dark:border-primary-800 rounded-lg transition-colors duration-500">
              <h5 className="text-sm md:text-base font-semibold text-neutral-900 dark:text-white mb-2 transition-colors duration-500">Interpretation</h5>
              <p className="text-xs md:text-sm text-neutral-700 dark:text-neutral-300 transition-colors duration-500">
                {quarter.usefulDaylightIlluminance.interpretation}
              </p>
            </div>
          )}
          
          {hasData(quarter.usefulDaylightIlluminance.conclusions) && (
            <div className="mt-4 p-3 md:p-4 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg transition-colors duration-500">
              <h5 className="text-sm md:text-base font-semibold text-neutral-900 dark:text-white mb-2 transition-colors duration-500">Conclusions</h5>
              <p className="text-xs md:text-sm text-neutral-700 dark:text-neutral-300 transition-colors duration-500">
                {quarter.usefulDaylightIlluminance.conclusions}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

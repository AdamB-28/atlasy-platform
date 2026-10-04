import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowUpRight, ChevronDown, ChevronUp, MapPin, Sun } from 'lucide-react'
import Layout from '../components/Layout'
import InteractiveMap from '../components/InteractiveMap'
import CityCard from '../components/CityCard'
import DistributionChart from '../components/DistributionChart'
import SolarEnergyTable from '../components/SolarEnergyTable'
import AdminDataPanel from '../components/AdminDataPanel'
import { LoadingSpinner, ErrorMessage } from '../components/LoadingStates'
import { useCities } from '../hooks/useCitiesData'
import { tempSourcePath } from '../utils/helpers'
import type { City, DaylightBenchmark, UnassignedProfile } from '../types'

function BenchmarkExplorer({ benchmarks, unassignedProfiles, sourceFolder }: { benchmarks: DaylightBenchmark[]; unassignedProfiles: UnassignedProfile[]; sourceFolder?: string }) {
  const [benchmarkId, setBenchmarkId] = useState(benchmarks[0]?.id ?? '')
  const [showReading, setShowReading] = useState(false)
  const benchmark = benchmarks.find((item) => item.id === benchmarkId) ?? benchmarks[0]

  if (!benchmark) return null

  const measuredBins = benchmark.distribution.bins.filter((bin) => bin.value !== null)
  const peak = measuredBins.reduce<(typeof measuredBins)[number] | null>(
    (highest, bin) => !highest || (bin.value ?? 0) > (highest.value ?? 0) ? bin : highest,
    null
  )

  return (
    <section className="border-y border-neutral-200 dark:border-neutral-700 bg-amber-50/70 dark:bg-neutral-800/70 py-10 sm:py-14">
      <div className="container mx-auto px-4 sm:px-6">
        <div className="grid lg:grid-cols-[minmax(220px,0.8fr)_minmax(0,1.4fr)] gap-8 lg:gap-14 items-start">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-amber-800 dark:text-amber-300">Reference set · 01</p>
            <h2 className="mt-2 text-2xl md:text-3xl font-bold text-neutral-900 dark:text-white">Facade daylight potential</h2>
            <p className="mt-3 text-sm text-neutral-700 dark:text-neutral-300 leading-relaxed">
              Five European references show how facade area is distributed across daylight-potential bands. This set is separate from the mapped case studies.
            </p>
            <label htmlFor="benchmark-place" className="block mt-6 mb-2 text-xs font-semibold uppercase tracking-wide text-neutral-600 dark:text-neutral-300">Reference place</label>
            <select
              id="benchmark-place"
              value={benchmark.id}
              onChange={(event) => { setBenchmarkId(event.target.value); setShowReading(false) }}
              className="w-full min-h-11 px-3 border border-neutral-300 dark:border-neutral-600 rounded-md bg-white dark:bg-neutral-900 text-sm text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
            >
              {benchmarks.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
            </select>
            <p className="mt-3 text-xs text-neutral-500 dark:text-neutral-400">Source: {benchmark.source.file}, row {benchmark.source.row}. Values are area shares.</p>
            <AdminDataPanel title={`${benchmark.name} · ${benchmark.source.file}`} data={benchmark} sourcePath={tempSourcePath(benchmark.source.tempPath) ?? (sourceFolder ? `${sourceFolder}/${benchmark.source.file}` : benchmark.source.file)} sourceCell={`${benchmark.source.sheet} row ${benchmark.source.row}`} />
          </div>

          <div>
            <div className="flex items-baseline justify-between gap-4 mb-4">
              <h3 className="text-lg font-semibold text-neutral-900 dark:text-white">{benchmark.name}</h3>
              <span className="text-xs text-neutral-500 dark:text-neutral-400">Score band · area share (%)</span>
            </div>
            <div className="max-w-2xl">
              <DistributionChart data={benchmark.distribution} color="green" height={190} unitLabel="Facade area within each score band (%)" />
            </div>
            <div className="mt-5 border-t border-amber-200 dark:border-neutral-600 pt-4">
              <button
                type="button"
                onClick={() => setShowReading((visible) => !visible)}
                aria-expanded={showReading}
                className="inline-flex items-center gap-2 text-sm font-semibold text-amber-900 dark:text-amber-200 hover:text-amber-700 dark:hover:text-amber-100"
              >
                {showReading ? 'Close reading prompt' : 'Open reading prompt'}
                {showReading ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>
              {showReading && (
                <div className="mt-3 max-w-2xl text-sm text-neutral-700 dark:text-neutral-300">
                  <p><strong>Look first:</strong> which score band contains the largest share, and how much facade area sits in the lowest bands?</p>
                  <p className="mt-2"><strong>Observed peak:</strong> {peak ? `${peak.value}% falls in the ${peak.label} band.` : 'No measured bins are available.'} A peak describes this distribution; it is not a pass/fail score.</p>
                </div>
              )}
            </div>
            {benchmark.context && (
              <div className="mt-7 border-t border-neutral-200 dark:border-neutral-700 pt-5">
                <h3 className="text-base font-semibold text-neutral-900 dark:text-white">Urban context</h3>
                <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">{benchmark.context.country || 'Country not stated in source'}</p>
                <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
                  {benchmark.context.floorAreaRatio !== null && benchmark.context.floorAreaRatio !== undefined && (
                    <div className="border-l-2 border-primary-500 pl-3"><p className="text-xs text-neutral-500">Floor area ratio</p><p className="font-semibold text-neutral-900 dark:text-white">{benchmark.context.floorAreaRatio}</p></div>
                  )}
                  {benchmark.context.greenSpaceRatio && (
                    <div className="border-l-2 border-emerald-500 pl-3"><p className="text-xs text-neutral-500">Green area ratio</p><p className="font-semibold text-neutral-900 dark:text-white">{benchmark.context.greenSpaceRatio}</p></div>
                  )}
                  {benchmark.context.solarEnergySpecs && <div className="col-span-2 sm:col-span-3"><SolarEnergyTable specs={benchmark.context.solarEnergySpecs} /></div>}
                </div>
                {benchmark.context.buildingTypes && <p className="mt-4 text-sm text-neutral-700 dark:text-neutral-300 leading-relaxed">{benchmark.context.buildingTypes}</p>}
                {benchmark.context.transport && <p className="mt-3 text-sm text-neutral-700 dark:text-neutral-300 leading-relaxed">{benchmark.context.transport}</p>}
                {benchmark.context.greenBlueInfrastructure && <p className="mt-3 text-sm text-neutral-700 dark:text-neutral-300 leading-relaxed">{benchmark.context.greenBlueInfrastructure}</p>}
                {benchmark.context.sunHoursDistribution && (
                  <div className="mt-5 grid sm:grid-cols-2 gap-5">
                    {benchmark.context.sunHoursDistribution.ground && <DistributionChart data={benchmark.context.sunHoursDistribution.ground} title="Site sun hours · ground" color="amber" />}
                    {benchmark.context.sunHoursDistribution.facades && <DistributionChart data={benchmark.context.sunHoursDistribution.facades} title="Site sun hours · facades and roofs" color="amber" />}
                  </div>
                )}
                {benchmark.context.daylightPotentialDistribution && (
                  <div className="mt-5 max-w-2xl">
                    <DistributionChart data={benchmark.context.daylightPotentialDistribution} title="Site daylight potential · Arkusz 1" color="green" unitLabel="Area share within each score band (%)" />
                  </div>
                )}
                {benchmark.context.sourceNote && <p className="mt-3 text-xs text-amber-800 dark:text-amber-200">{benchmark.context.sourceNote}</p>}
                {benchmark.context.source && <p className="mt-3 text-[11px] text-neutral-500">Additional context: {benchmark.context.source.file}, Arkusz 1 row {benchmark.context.source.row}.</p>}
              </div>
            )}
            {benchmark.unassignedProfiles?.map((profile) => (
              <div key={profile.sourceRow} className="mt-5 border-t border-dashed border-amber-400 pt-4">
                <h3 className="text-sm font-semibold text-neutral-900 dark:text-white">{profile.name} · source row {profile.sourceRow}</h3>
                <p className="mt-1 text-xs text-amber-800 dark:text-amber-200">{profile.attributionNote}</p>
                <div className="mt-4 grid sm:grid-cols-2 gap-5">
                  {profile.sunHoursDistribution?.ground && <DistributionChart data={profile.sunHoursDistribution.ground} title="Ground" color="amber" />}
                  {profile.sunHoursDistribution?.facades && <DistributionChart data={profile.sunHoursDistribution.facades} title="Facades" color="amber" />}
                  {profile.sunHoursDistribution?.roofs && <DistributionChart data={profile.sunHoursDistribution.roofs} title="Roofs" color="amber" />}
                  {profile.daylightPotentialDistribution && <DistributionChart data={profile.daylightPotentialDistribution} title="Daylight potential" color="green" />}
                </div>
                <AdminDataPanel title={`Unassigned profile · source row ${profile.sourceRow}`} data={profile} sourcePath={tempSourcePath(profile.source?.tempPath)} sourceCell={`${profile.source?.sheet ?? 'Arkusz1'} row ${profile.sourceRow}`} />
              </div>
            ))}
          </div>
        </div>
      </div>
      {unassignedProfiles.length > 0 && (
        <div className="container mx-auto px-4 sm:px-6 pb-8">
          <div className="border-t border-dashed border-amber-400 pt-5">
            <p className="text-xs font-semibold uppercase tracking-wide text-amber-800 dark:text-amber-200">Unattributed source rows</p>
            <p className="mt-1 text-xs text-neutral-600 dark:text-neutral-400">Measurements without a place or block ID stay separate to avoid guessing their location.</p>
            {unassignedProfiles.map((profile) => (
              <div key={profile.sourceRow} className="mt-4 grid sm:grid-cols-[180px_1fr] gap-4 items-start">
                <p className="text-sm font-medium text-neutral-900 dark:text-white">Row {profile.sourceRow}</p>
                <div className="grid sm:grid-cols-2 gap-5">
                  {profile.sunHoursDistribution?.ground && <DistributionChart data={profile.sunHoursDistribution.ground} title="Ground" color="amber" />}
                  {profile.sunHoursDistribution?.facades && <DistributionChart data={profile.sunHoursDistribution.facades} title="Facades" color="amber" />}
                  {profile.sunHoursDistribution?.roofs && <DistributionChart data={profile.sunHoursDistribution.roofs} title="Roofs" color="amber" />}
                  {profile.daylightPotentialDistribution && <DistributionChart data={profile.daylightPotentialDistribution} title="Daylight potential" color="green" />}
                </div>
                <AdminDataPanel title={`Unassigned profile · source row ${profile.sourceRow}`} data={profile} className="sm:col-span-2" sourcePath={tempSourcePath(profile.source?.tempPath)} sourceCell={`${profile.source?.sheet ?? 'Arkusz1'} row ${profile.sourceRow}`} />
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  )
}

export default function HomePage() {
  const { cities, benchmarks, unassignedProfiles, notices, sourceFolder, loading, error } = useCities()
  const [selectedCity, setSelectedCity] = useState<City | null>(null)
  const navigate = useNavigate()

  if (loading) return <Layout><LoadingSpinner /></Layout>
  if (error) return <Layout><ErrorMessage error={error} /></Layout>

  return (
    <Layout>
      <section className="border-b border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900">
        <div className="container mx-auto px-4 sm:px-6 py-6 sm:py-8">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-primary-700 dark:text-primary-300">Urban daylight atlas</p>
              <h1 className="mt-2 text-2xl sm:text-3xl font-bold text-neutral-900 dark:text-white">Explore the evidence</h1>
              <p className="mt-2 max-w-2xl text-sm text-neutral-600 dark:text-neutral-300">
                Compare urban form, seasonal sun exposure and environmental performance across three mapped case studies.
              </p>
            </div>
            <div className="flex items-center gap-4 text-xs text-neutral-500 dark:text-neutral-400">
              <span><strong className="text-neutral-900 dark:text-white">{cities.length}</strong> case studies</span>
              <span className="h-4 border-l border-neutral-300 dark:border-neutral-600" />
              <span><strong className="text-neutral-900 dark:text-white">{benchmarks.length}</strong> references</span>
            </div>
          </div>
        </div>
      </section>

      {notices[0] && (
        <div className="border-b border-amber-200 dark:border-amber-900 bg-amber-50 dark:bg-amber-950/30">
          <div className="container mx-auto px-4 sm:px-6 py-3 text-xs sm:text-sm text-amber-900 dark:text-amber-100" role="note">
            Data limitation: {notices[0]}
          </div>
        </div>
      )}

      <section className="py-6 sm:py-8">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between gap-4 mb-4">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-primary-600 dark:text-primary-400" />
              <h2 className="text-lg font-semibold text-neutral-900 dark:text-white">Case studies</h2>
            </div>
            <p className="text-xs text-neutral-500 dark:text-neutral-400">London · Gdańsk · New York</p>
          </div>

          <div className="grid lg:grid-cols-[300px_minmax(0,1fr)] gap-5 lg:gap-7 items-start">
            <aside className="space-y-3">
              {cities.map((city) => (
                <div key={city.id} className={selectedCity?.id === city.id ? 'ring-2 ring-primary-500 rounded-lg' : ''}>
                  <CityCard
                    name={city.name}
                    country={city.location.country}
                    isSelected={selectedCity?.id === city.id}
                    onClick={() => setSelectedCity(city)}
                  />
                </div>
              ))}

              {selectedCity && (
                <div className="border-t border-neutral-200 dark:border-neutral-700 pt-4 mt-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500 dark:text-neutral-400">Selected case study</p>
                  <div className="flex items-start justify-between gap-3 mt-2">
                    <div>
                      <h3 className="font-semibold text-neutral-900 dark:text-white">{selectedCity.name}</h3>
                      <p className="mt-1 text-xs text-neutral-600 dark:text-neutral-400">{selectedCity.timeline.years ?? 'Timeline not provided'}</p>
                    </div>
                    <Sun className="w-4 h-4 text-amber-500 shrink-0 mt-1" />
                  </div>
                  <button
                    type="button"
                    onClick={() => navigate(`/city/${selectedCity.id}`)}
                    className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-primary-700 dark:text-primary-300 hover:text-primary-900 dark:hover:text-primary-200"
                  >
                    Open case study <ArrowUpRight className="w-4 h-4" />
                  </button>
                </div>
              )}
            </aside>

            <div className="h-[390px] sm:h-[500px] lg:h-[620px] min-w-0 overflow-hidden rounded-md border border-neutral-200 dark:border-neutral-700 bg-neutral-100 dark:bg-neutral-800">
              <InteractiveMap
                cities={cities}
                selectedCity={selectedCity}
                onCitySelect={setSelectedCity}
              />
            </div>
          </div>
        </div>
      </section>

      <BenchmarkExplorer benchmarks={benchmarks} unassignedProfiles={unassignedProfiles} sourceFolder={sourceFolder} />
    </Layout>
  )
}

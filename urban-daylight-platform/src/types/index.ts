export interface Coordinates {
  lat: number;
  lng: number;
  zoom: number;
}

export interface Location {
  country: string | null;
  coordinates: Coordinates;
  imageUrl: string | null;
}

export interface Timeline {
  years: string | null;
  description: string | null;
}

export interface Overview {
  schwarzplanImage: string | null;
  model3dImage: string | null;
  far: number | null; // Floor Area Ratio
}

export interface UrbanIndicators {
  buildingIntensity: number | string | null;
  greenSpacePercentage: number | string | null;
  buildingTypes: string | null;
  transport: string | null;
  greenBlueInfrastructure?: string | null;
}

export interface ShadingAnalysis {
  marchSeptember: string | null;
  june: string | null;
  december: string | null;
}

export interface SiteAnalysis {
  sunHoursImage: string | null;
  urbanBlocksImage?: string | null;
  daylightPotentialImage: string | null;
  solarEnergyImage: string | null;
  sunHoursDistribution?: SunHoursDistribution;
  daylightPotentialDistribution?: DistributionData;
  solarEnergySpecs?: SolarEnergySpecs;
}

export interface DistributionBin {
  label: string;
  value: number | null;
}

export interface DistributionData {
  bins: DistributionBin[];
  unit: string;
}

export interface SunHoursDistribution {
  ground?: DistributionData;
  facades?: DistributionData;
  roofs?: DistributionData;
}

export interface SolarEnergySpecs {
  area: number | null;
  totalSolarEnergy: number | null;
  avgSolarEnergy: number | null;
  panelArea: number | null;
  annualElectricity: number | null;
}

export interface QuarterIndicators {
  buildingIntensity: number | string | null;
  greenSpaceRatio: number | string | null;
  buildingCoverage: number | string | null;
  avgFloors: number | string | null;
  treeCount: number | string | null;
  heightToWidthRatio: string | null;
  streetWidth: string | null;
}

export interface SimulationData {
  image: string | null;
  avgValue?: number | string | null;
  description?: string | null;
  autonomy?: number | string | null;
}

export interface DaylightFactor {
  simulation1: SimulationData;
  simulation2: SimulationData;
}

export interface SpatialDaylightAutonomy {
  simulation1: SimulationData;
  simulation2: SimulationData;
  interpretation: string | null;
}

export interface UsefulDaylightIlluminance {
  simulation1: SimulationData;
  simulation2: SimulationData;
  interpretation: string | null;
  conclusions?: string | null;
}

export interface UrbanBlock {
  id: number | string;
  name: string;
  analysisLevel?: 'urban-block' | 'selected-room';
  comparisonKey?: string;
  sourceRow?: number;
  plan: string | null;
  form3d: string | null;
  far?: number | null; // Floor Area Ratio for quarter
  indicators: QuarterIndicators;
  function: string | null;
  sunHours: string | null;
  daylightPotential: string | null;
  daylightPotential2?: string | null;
  solarEnergy?: string | null;
  sunHoursDistribution?: SunHoursDistribution;
  daylightPotentialDistribution?: DistributionData;
  solarEnergySpecs?: SolarEnergySpecs;
  daylightFactor?: DaylightFactor;
  spatialDaylightAutonomy?: SpatialDaylightAutonomy;
  usefulDaylightIlluminance?: UsefulDaylightIlluminance;
  shadingAnalysis?: ShadingAnalysis; // For Hudson Yards
  imageLinks?: ImageLink[];
}

export interface City {
  id: string;
  name: string;
  location: Location;
  timeline: Timeline;
  overview: Overview;
  urbanIndicators: UrbanIndicators;
  shadingAnalysis: ShadingAnalysis;
  siteAnalysis?: SiteAnalysis;
  analysisUnits: UrbanBlock[];
  source: DataSource;
  imageLinks?: ImageLink[];
}

export interface DataSource {
  file: string;
  sheet: string;
  row: number;
  status: 'source' | 'partial' | 'example';
  tempPath?: string;
}

export interface ImageLink {
  field: string;
  label: string;
  column: number;
  columnLetter: string;
  rawCell: string | null;
  referencedName: string | null;
  resolvedName: string | null;
  aliasNote: string | null;
  sourceFile: string;
  sourceTempPath?: string | null;
  sheet: string;
  row: number;
  tempPath: string | null;
  publicUrl: string | null;
  status: 'copied' | 'present' | 'linked' | 'public-only' | 'missing' | 'empty' | 'unresolved';
  cityId?: string;
}

export interface DaylightBenchmark {
  id: string;
  name: string;
  distribution: DistributionData;
  source: DataSource;
  context?: BenchmarkContext;
  unassignedProfiles?: UnassignedProfile[];
}

export interface BenchmarkContext {
  country?: string | null;
  floorAreaRatio?: number | null;
  greenSpaceRatio?: string | null;
  buildingTypes?: string | null;
  transport?: string | null;
  greenBlueInfrastructure?: string | null;
  sunHoursDistribution?: SunHoursDistribution;
  daylightPotentialDistribution?: DistributionData | null;
  solarEnergySpecs?: SolarEnergySpecs;
  source?: DataSource;
  sourceNote?: string;
}

export interface UnassignedProfile {
  name: string;
  sourceRow: number;
  source?: DataSource;
  sunHoursDistribution?: SunHoursDistribution;
  daylightPotentialDistribution?: DistributionData | null;
  attributionNote: string;
}

export interface CitiesData {
  version: number;
  generatedFrom: string[];
  sourceFolder?: string;
  cities: City[];
  benchmarks: DaylightBenchmark[];
  unassignedProfiles: UnassignedProfile[];
  imageCatalog?: ImageLink[];
  notices: string[];
}

export type ComparisonMode = 'single' | 'compare';

export interface ComparisonState {
  mode: ComparisonMode;
  cityA: City | null;
  cityB: City | null;
  showInsights: boolean;
}

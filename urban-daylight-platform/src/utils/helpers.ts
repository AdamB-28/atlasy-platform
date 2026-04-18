import { type ClassValue, clsx } from 'clsx'

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs)
}

export function getImagePath(imageName: string | null, cityFolder: string): string {
  if (!imageName) return ''
  // Files are already clean ASCII, no encoding needed
  return `${import.meta.env.BASE_URL}${cityFolder}/${imageName}.PNG`
}

export function formatMetricValue(value: number | string | null): string {
  if (value === null || value === undefined) return 'No data'
  if (typeof value === 'number') {
    return value.toFixed(2)
  }
  return String(value)
}

export function hasData(value: any): boolean {
  return value !== null && value !== undefined && value !== ''
}

export function getCityFolderName(cityName: string): string {
  const folderMap: Record<string, string> = {
    'Elephant and Castle': 'ELEPHANT_AND_CASTLE',
    'Garnizon': 'GARNIZON',
    'Hudson Yards': 'HUDSON_YARDS'
  }
  return folderMap[cityName] || cityName.toUpperCase().replace(/\s+/g, '_')
}

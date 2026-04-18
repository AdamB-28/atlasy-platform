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

/** Parse a European-format number string like "2,9", "32%", "12,65" into a number */
export function parseEuroNumber(val: string | number | null): number | null {
  if (val === null || val === undefined) return null
  if (typeof val === 'number') return val
  const cleaned = val.replace(/%\.?$/, '').replace(/\s/g, '').replace(',', '.')
  const num = parseFloat(cleaned)
  return isNaN(num) ? null : num
}

/** Check if a string value already contains the given unit suffix */
export function valueContainsUnit(value: string | number | null, unit: string): boolean {
  if (value === null || value === undefined) return false
  return String(value).trimEnd().endsWith(unit)
}

/** Extract a percentage number from a text string like "The average sDA value is 49,54%" */
export function extractPercentage(text: string | null): number | null {
  if (!text) return null
  const match = text.match(/([\d]+[,.]?\d*)\s*%/)
  if (!match) return null
  return parseFloat(match[1].replace(',', '.'))
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

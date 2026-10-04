export interface StreetWidthBand {
  min: number
  max: number
  label: string
}

interface HeightWidthRatio {
  h: number
  w: number
  label: string
}

export interface StreetSimulationInput {
  widthLabel: string
  widthM: number
  estimatedHeightM: number
}

export function parseRatios(raw: string): HeightWidthRatio[] {
  const results: HeightWidthRatio[] = []
  const segments = raw.split(';').map((segment) => segment.trim()).filter(Boolean)
  for (const segment of segments) {
    const rangeMatch = segment.match(/([\d,.]+)\s*-\s*([\d,.]+)\s*:\s*1/)
    if (rangeMatch) {
      const low = parseFloat(rangeMatch[1].replace(',', '.'))
      const high = parseFloat(rangeMatch[2].replace(',', '.'))
      results.push({ h: (low + high) / 2, w: 1, label: `${rangeMatch[1]}–${rangeMatch[2]}:1` })
      continue
    }
    const simpleMatch = segment.match(/([\d,.]+)\s*(?:\(?\s*1\s*:\s*([\d,.]+)\s*\)?)/)
    if (simpleMatch) {
      results.push({ h: parseFloat(simpleMatch[1].replace(',', '.')), w: 1, label: segment })
      continue
    }
    const plainMatch = segment.match(/([\d,.]+)\s*:\s*([\d,.]+)/)
    if (plainMatch) {
      results.push({
        h: parseFloat(plainMatch[1].replace(',', '.')),
        w: parseFloat(plainMatch[2].replace(',', '.')),
        label: segment,
      })
    }
  }
  return results
}

export function parseWidths(raw: string): StreetWidthBand[] {
  const results: StreetWidthBand[] = []
  const segments = raw.split(',').map((segment) => segment.trim()).filter(Boolean)
  for (const segment of segments) {
    const rangeMatch = segment.match(/([\d,.]+)\s*-\s*([\d,.]+)\s*m?/)
    if (rangeMatch) {
      results.push({
        min: parseFloat(rangeMatch[1].replace(',', '.')),
        max: parseFloat(rangeMatch[2].replace(',', '.')),
        label: `${rangeMatch[1]}–${rangeMatch[2]}m`,
      })
      continue
    }
    const singleMatch = segment.match(/([\d,.]+)\s*m?/)
    if (singleMatch) {
      const value = parseFloat(singleMatch[1].replace(',', '.'))
      results.push({ min: value, max: value, label: `${singleMatch[1]}m` })
    }
  }
  return results
}

export function getFirstStreetSimulationInput(heightToWidthRatio: string | null, streetWidth: string | null): StreetSimulationInput | null {
  if (!heightToWidthRatio || !streetWidth) return null
  const ratios = parseRatios(heightToWidthRatio).map((ratio) => ratio.h / (ratio.w || 1))
  const widths = parseWidths(streetWidth)
  if (!widths.length) return null
  const ratio = ratios.length === 1 ? ratios[0] : ratios.length === widths.length ? ratios[0] : null
  if (ratio === null) return null
  const firstWidth = widths[0]
  const widthM = (firstWidth.min + firstWidth.max) / 2
  return { widthLabel: firstWidth.label, widthM, estimatedHeightM: widthM * ratio }
}
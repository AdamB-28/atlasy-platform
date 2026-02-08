import { City, Quarter } from '../types'

interface Insight {
  title: string
  content: string
  category: 'better' | 'neutral' | 'worse'
}

export function generateUrbanFormInsights(cityA: City, cityB: City): Insight[] {
  const insights: Insight[] = []
  
  const intensityA = parseFloat(String(cityA.urbanIndicators.buildingIntensity || 0))
  const intensityB = parseFloat(String(cityB.urbanIndicators.buildingIntensity || 0))
  
  if (intensityA && intensityB) {
    if (intensityA > intensityB) {
      insights.push({
        title: 'Building Intensity',
        content: `${cityA.name} has ${((intensityA - intensityB) / intensityB * 100).toFixed(0)}% higher building intensity than ${cityB.name}. Higher intensity can maximize land use but may reduce access to daylight at ground level.`,
        category: 'neutral'
      })
    } else if (intensityB > intensityA) {
      insights.push({
        title: 'Building Intensity',
        content: `${cityB.name} has ${((intensityB - intensityA) / intensityA * 100).toFixed(0)}% higher building intensity than ${cityA.name}. This compact form may support walkability but requires careful daylight planning.`,
        category: 'neutral'
      })
    }
  }
  
  const greenA = parseFloat(String(cityA.urbanIndicators.greenSpacePercentage || 0))
  const greenB = parseFloat(String(cityB.urbanIndicators.greenSpacePercentage || 0))
  
  if (greenA && greenB) {
    if (greenA > greenB) {
      insights.push({
        title: 'Green Space Access',
        content: `${cityA.name} provides ${(greenA - greenB).toFixed(0)}% more green space than ${cityB.name}. Greater green space typically correlates with better environmental quality and increased opportunities for outdoor activities in daylit environments.`,
        category: 'better'
      })
    } else if (greenB > greenA) {
      insights.push({
        title: 'Green Space Access',
        content: `${cityB.name} provides ${(greenB - greenA).toFixed(0)}% more green space than ${cityA.name}. This supports biodiversity, stormwater management, and creates daylit outdoor spaces for residents.`,
        category: 'better'
      })
    }
  }
  
  return insights
}

export function generateDaylightInsights(
  cityA: City,
  cityB: City,
  quarterA?: Quarter,
  quarterB?: Quarter
): Insight[] {
  const insights: Insight[] = []
  
  const dfA = quarterA?.daylightFactor?.simulation1?.avgValue
  const dfB = quarterB?.daylightFactor?.simulation1?.avgValue
  
  if (dfA && dfB) {
    const valA = parseFloat(String(dfA))
    const valB = parseFloat(String(dfB))
    
    if (valA > valB) {
      insights.push({
        title: 'Daylight Factor Performance',
        content: `${cityA.name} achieves ${((valA - valB) / valB * 100).toFixed(0)}% higher Daylight Factor than ${cityB.name}. This indicates better access to natural daylight under overcast conditions, reducing artificial lighting needs and improving occupant wellbeing.`,
        category: 'better'
      })
    } else if (valB > valA) {
      insights.push({
        title: 'Daylight Factor Performance',
        content: `${cityB.name} achieves ${((valB - valA) / valA * 100).toFixed(0)}% higher Daylight Factor than ${cityA.name}. Superior DF values suggest more effective window design and/or favorable urban geometry for daylight penetration.`,
        category: 'better'
      })
    }
  }
  
  const sdaA = quarterA?.spatialDaylightAutonomy?.simulation1?.autonomy
  const sdaB = quarterB?.spatialDaylightAutonomy?.simulation1?.autonomy
  
  if (sdaA && sdaB) {
    const valA = parseFloat(String(sdaA))
    const valB = parseFloat(String(sdaB))
    
    if (valA > valB) {
      insights.push({
        title: 'Spatial Daylight Autonomy',
        content: `${cityA.name}'s spaces achieve daylight autonomy for ${valA}% of floor area, compared to ${valB}% in ${cityB.name}. Higher sDA means less reliance on electric lighting during occupied hours, with significant energy savings.`,
        category: 'better'
      })
    } else if (valB > valA) {
      insights.push({
        title: 'Spatial Daylight Autonomy',
        content: `${cityB.name}'s spaces achieve daylight autonomy for ${valB}% of floor area, compared to ${valA}% in ${cityA.name}. This superior performance reflects effective orientation and facade design strategies.`,
        category: 'better'
      })
    }
  }
  
  const udiA = quarterA?.usefulDaylightIlluminance?.simulation1?.avgValue
  const udiB = quarterB?.usefulDaylightIlluminance?.simulation1?.avgValue
  
  if (udiA && udiB) {
    const valA = parseFloat(String(udiA))
    const valB = parseFloat(String(udiB))
    
    if (valA > valB) {
      insights.push({
        title: 'Useful Daylight Range',
        content: `${cityA.name} maintains useful daylight levels ${valA}% of the time, versus ${valB}% in ${cityB.name}. Better UDI indicates balanced daylight—neither too dim nor causing glare or overheating risks.`,
        category: 'better'
      })
    } else if (valB > valA) {
      insights.push({
        title: 'Useful Daylight Range',
        content: `${cityB.name} maintains useful daylight levels ${valB}% of the time, versus ${valA}% in ${cityA.name}. This balance prevents both underlit conditions and excessive brightness, optimizing comfort and productivity.`,
        category: 'better'
      })
    }
  }
  
  return insights
}

export function generateUrbanMorphologyInsights(
  cityA: City,
  cityB: City,
  quarterA?: Quarter,
  quarterB?: Quarter
): Insight[] {
  const insights: Insight[] = []
  
  if (cityA.urbanIndicators.buildingTypes && cityB.urbanIndicators.buildingTypes) {
    const hasPerimetersA = cityA.urbanIndicators.buildingTypes.toLowerCase().includes('kwartal')
    const hasPerimetersB = cityB.urbanIndicators.buildingTypes.toLowerCase().includes('kwartal')
    
    if (hasPerimetersA && !hasPerimetersB) {
      insights.push({
        title: 'Urban Morphology',
        content: `${cityA.name} employs perimeter block typology, which typically provides sheltered courtyards and consistent street edges. This form creates semi-private daylit outdoor spaces while maintaining urban density.`,
        category: 'neutral'
      })
    } else if (hasPerimetersB && !hasPerimetersA) {
      insights.push({
        title: 'Urban Morphology',
        content: `${cityB.name} employs perimeter block typology, creating defined street walls and protected courtyards. This traditional form often balances daylight access with privacy and microclimate control.`,
        category: 'neutral'
      })
    }
  }
  
  const floorsA = quarterA?.indicators.avgFloors
  const floorsB = quarterB?.indicators.avgFloors
  
  if (floorsA && floorsB) {
    const valA = parseFloat(String(floorsA))
    const valB = parseFloat(String(floorsB))
    
    if (valA > valB * 1.5) {
      insights.push({
        title: 'Building Height & Daylight Access',
        content: `${cityA.name}'s taller buildings (avg ${valA} floors vs ${valB}) may cast longer shadows on adjacent streets and buildings. Adequate spacing and orientation become critical to maintain daylight access at ground level.`,
        category: 'worse'
      })
    } else if (valB > valA * 1.5) {
      insights.push({
        title: 'Building Height & Daylight Access',
        content: `${cityB.name}'s taller buildings (avg ${valB} floors vs ${valA}) require careful urban design to prevent overshadowing. Height-to-width ratios and setbacks are essential for preserving daylight in public spaces.`,
        category: 'worse'
      })
    }
  }
  
  return insights
}

export function generatePlaceholderInsights(): Insight[] {
  return [
    {
      title: 'Comparative Analysis Placeholder',
      content: 'Detailed comparative insights will be added here based on specific metrics, urban morphology, and daylight performance patterns. These insights help explain why one city performs better than another in certain categories.',
      category: 'neutral'
    },
    {
      title: 'Design Principles',
      content: 'Effective urban daylight design considers building orientation, street width-to-height ratios, facade design, and the balance between density and openness. Each city demonstrates different trade-offs in these parameters.',
      category: 'neutral'
    }
  ]
}

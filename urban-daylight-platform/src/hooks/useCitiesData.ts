import { useState, useEffect } from 'react'
import type { CitiesData } from '../types'

export function useCitiesData() {
  const [data, setData] = useState<CitiesData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    fetch(`${import.meta.env.BASE_URL}data/atlas.json`)
      .then((res) => {
        if (!res.ok) throw new Error(`Unable to load atlas data (${res.status})`)
        return res.json()
      })
      .then((json) => {
        setData(json)
        setLoading(false)
      })
      .catch((err) => {
        setError(err)
        setLoading(false)
      })
  }, [])

  return { data, loading, error }
}

export function useCity(cityId: string) {
  const { data, loading, error } = useCitiesData()
  
  const city = data?.cities.find((c) => c.id === cityId) || null
  
  return { city, loading, error }
}

export function useCities() {
  const { data, loading, error } = useCitiesData()
  
  return {
    cities: data?.cities || [],
    benchmarks: data?.benchmarks || [],
    unassignedProfiles: data?.unassignedProfiles || [],
    notices: data?.notices || [],
    sourceFolder: data?.sourceFolder,
    loading,
    error,
  }
}

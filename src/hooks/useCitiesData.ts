import { useState, useEffect } from 'react'
import type { CitiesData } from '../types'

export function useCitiesData() {
  const [data, setData] = useState<CitiesData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    fetch('/data/cities.json')
      .then((res) => res.json())
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
  
  return { cities: data?.cities || [], loading, error }
}

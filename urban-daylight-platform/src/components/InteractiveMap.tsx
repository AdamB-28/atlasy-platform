import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import { useNavigate } from 'react-router-dom'
import { useEffect } from 'react'
import L from 'leaflet'
import type { City } from '../types'
import 'leaflet/dist/leaflet.css'

// Fix for default marker icon
const DefaultIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
})

L.Marker.prototype.options.icon = DefaultIcon

interface InteractiveMapProps {
  cities: City[]
  selectedCity?: City | null
  onCitySelect?: (city: City) => void
}

function MapController({ cities, selectedCity }: { cities: City[]; selectedCity?: City | null }) {
  const map = useMap()
  useEffect(() => {
    const coordinates = selectedCity?.location.coordinates
    if (coordinates) {
      map.setView([coordinates.lat, coordinates.lng], coordinates.zoom)
      return
    }

    const locations = cities
      .map((city) => city.location.coordinates)
      .filter((location): location is NonNullable<typeof location> => location !== null)
    if (locations.length) {
      map.fitBounds(
        locations.map((location) => [location.lat, location.lng]),
        { padding: [30, 30], maxZoom: 6 },
      )
    }
  }, [cities, map, selectedCity])

  return null
}

export default function InteractiveMap({ cities, selectedCity, onCitySelect }: InteractiveMapProps) {
  const navigate = useNavigate()
  const locatedCities = cities.filter((city) => city.location.coordinates != null)
  const unlocatedCount = cities.length - locatedCities.length
  
  const defaultCenter: [number, number] = [20, 0]
  const defaultZoom = 2
  
  return (
    <div className="relative h-full w-full rounded-lg overflow-hidden shadow-lg">
      <MapContainer
        center={defaultCenter}
        zoom={defaultZoom}
        className="h-full w-full"
        scrollWheelZoom={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        {locatedCities.map((city) => {
          const coordinates = city.location.coordinates
          if (!coordinates) return null
          return (
            <Marker
              key={city.id}
              position={[coordinates.lat, coordinates.lng]}
              title={city.name}
              alt={`Map marker: ${city.name}`}
              eventHandlers={{
                click: () => {
                  if (onCitySelect) {
                    onCitySelect(city)
                  } else {
                    navigate(`/city/${city.id}`)
                  }
                },
              }}
            >
              <Popup>
                <div className="text-center py-2">
                  <h3 className="font-semibold text-neutral-900 dark:text-white transition-colors duration-500">{city.name}</h3>
                  {city.location.country && (
                    <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-1 transition-colors duration-500">{city.location.country}</p>
                  )}
                  {city.location.coordinateSource && (
                    <a
                      href={city.location.coordinateSource.featureUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-2 inline-block text-xs text-neutral-600 underline"
                    >
                      Coordinate source: OpenStreetMap
                    </a>
                  )}
                  <button
                    onClick={() => navigate(`/city/${city.id}`)}
                    className="mt-3 text-sm text-primary-600 hover:text-primary-700 font-medium"
                  >
                    View Details →
                  </button>
                </div>
              </Popup>
            </Marker>
          )
        })}
        
        <MapController cities={locatedCities} selectedCity={selectedCity?.location.coordinates ? selectedCity : null} />
      </MapContainer>
      {unlocatedCount > 0 && (
        <div
          className="absolute z-[1000] top-3 left-3 right-3 sm:left-auto sm:right-3 sm:max-w-sm rounded-md bg-white/95 dark:bg-neutral-900/95 px-3 py-2 text-xs text-neutral-700 dark:text-neutral-200 shadow"
          role="status"
        >
          {locatedCities.length === 0
            ? 'No verified map locations are available. Choose a case study from the list to view its details.'
            : `${unlocatedCount} ${unlocatedCount === 1 ? 'case study has' : 'case studies have'} no verified coordinates; ${unlocatedCount === 1 ? 'it is' : 'they are'} not shown on the map.`}
        </div>
      )}
    </div>
  )
}

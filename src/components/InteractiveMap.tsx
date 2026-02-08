import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import { useNavigate } from 'react-router-dom'
import L from 'leaflet'
import type { City } from '../types'
import 'leaflet/dist/leaflet.css'

// Fix for default marker icon
import icon from 'leaflet/dist/images/marker-icon.png'
import iconShadow from 'leaflet/dist/images/marker-shadow.png'

const DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
})

L.Marker.prototype.options.icon = DefaultIcon

interface InteractiveMapProps {
  cities: City[]
  selectedCity?: City | null
  onCitySelect?: (city: City) => void
}

function MapController({ selectedCity }: { selectedCity?: City | null }) {
  const map = useMap()
  
  if (selectedCity) {
    map.setView(
      [selectedCity.location.coordinates.lat, selectedCity.location.coordinates.lng],
      selectedCity.location.coordinates.zoom
    )
  }
  
  return null
}

export default function InteractiveMap({ cities, selectedCity, onCitySelect }: InteractiveMapProps) {
  const navigate = useNavigate()
  
  // Center map on Europe/Atlantic
  const defaultCenter: [number, number] = [50, -10]
  const defaultZoom = 4
  
  return (
    <div className="h-full w-full rounded-lg overflow-hidden shadow-lg">
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
        
        {cities.map((city) => (
          <Marker
            key={city.id}
            position={[city.location.coordinates.lat, city.location.coordinates.lng]}
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
                <button
                  onClick={() => navigate(`/city/${city.id}`)}
                  className="mt-3 text-sm text-primary-600 hover:text-primary-700 font-medium"
                >
                  View Details →
                </button>
              </div>
            </Popup>
          </Marker>
        ))}
        
        <MapController selectedCity={selectedCity} />
      </MapContainer>
    </div>
  )
}

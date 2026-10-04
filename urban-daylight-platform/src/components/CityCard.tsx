import { MapPin, ChevronRight } from 'lucide-react'

interface CityCardProps {
  name: string
  country: string | null
  isSelected?: boolean
  onClick: () => void
}

export default function CityCard({ name, country, isSelected = false, onClick }: CityCardProps) {
  return (
    <button
      onClick={onClick}
      aria-pressed={isSelected}
      className="w-full p-4 text-left card hover:border-primary-400 dark:hover:border-primary-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 transition-colors duration-200 cursor-pointer group relative"
    >
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-full bg-primary-50 dark:bg-primary-900/30 flex items-center justify-center flex-shrink-0 group-hover:bg-primary-100 dark:group-hover:bg-primary-900/50 transition-colors">
          <MapPin className="w-5 h-5 text-primary-600 dark:text-primary-400" />
        </div>
        
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-neutral-900 dark:text-white group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
            {name}
          </h3>
          {country && (
            <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1 transition-colors duration-500">{country}</p>
          )}
          <p className="text-xs text-primary-600 dark:text-primary-400 mt-2 font-medium group-hover:translate-x-1 transition-transform">
            {isSelected ? 'Selected on map' : 'Select location'}
          </p>
        </div>
        
        <ChevronRight className="w-5 h-5 text-neutral-400 dark:text-neutral-500 group-hover:text-primary-600 dark:group-hover:text-primary-400 group-hover:translate-x-1 transition-all flex-shrink-0" />
      </div>
    </button>
  )
}

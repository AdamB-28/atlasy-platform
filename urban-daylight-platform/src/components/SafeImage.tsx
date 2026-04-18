import { useState } from 'react'
import { ImageOff, ZoomIn } from 'lucide-react'
import ImageLightbox from './ImageLightbox'

interface SafeImageProps {
  src: string
  alt: string
  className?: string
}

export default function SafeImage({ src, alt, className = '' }: SafeImageProps) {
  const [error, setError] = useState(false)
  const [loading, setLoading] = useState(true)
  const [lightboxOpen, setLightboxOpen] = useState(false)

  if (!src || error) {
    return (
      <div className={`bg-neutral-100 dark:bg-neutral-800 flex flex-col items-center justify-center transition-colors duration-500 ${className}`}>
        <ImageOff className="w-12 h-12 text-neutral-400 dark:text-neutral-500 mb-2" />
        <p className="text-sm text-neutral-500 dark:text-neutral-400 text-center px-4">Image unavailable</p>
        {src && (
          <p className="text-xs text-neutral-400 dark:text-neutral-500 mt-1 px-4 text-center break-all">
            {decodeURIComponent(src.split('/').pop() || '')}
          </p>
        )}
      </div>
    )
  }

  return (
    <>
      <div className="relative group cursor-pointer" onClick={() => setLightboxOpen(true)}>
        {loading && (
          <div className={`absolute inset-0 bg-neutral-100 dark:bg-neutral-800 animate-pulse ${className}`} />
        )}
        <img
          src={src}
          alt={alt}
          className={className}
          onLoad={() => setLoading(false)}
          onError={() => {
            setError(true)
            setLoading(false)
          }}
        />
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-200 rounded-lg flex items-center justify-center">
          <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-white/90 dark:bg-neutral-800/90 rounded-full p-2 shadow-lg">
            <ZoomIn className="w-5 h-5 text-neutral-700 dark:text-neutral-300" />
          </div>
        </div>
      </div>
      {lightboxOpen && (
        <ImageLightbox src={src} alt={alt} onClose={() => setLightboxOpen(false)} />
      )}
    </>
  )
}

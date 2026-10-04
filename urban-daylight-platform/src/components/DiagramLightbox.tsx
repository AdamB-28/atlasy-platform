import { cloneElement, useEffect, type ReactElement, type SVGProps } from 'react'
import { X } from 'lucide-react'

interface DiagramLightboxProps {
  title: string
  diagram: ReactElement<SVGProps<SVGSVGElement>>
  onClose: () => void
}

export default function DiagramLightbox({ title, diagram, onClose }: DiagramLightboxProps) {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKeyDown)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = ''
    }
  }, [onClose])

  const enlargedDiagram = cloneElement(diagram, {
    className: 'block h-auto max-h-[78vh] w-full',
    style: { width: '100%', height: 'auto', maxWidth: '100%', maxHeight: '78vh' },
  })

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center bg-neutral-950/85 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="relative w-full max-w-5xl rounded-md border border-neutral-300 bg-white p-4 shadow-2xl dark:border-neutral-700 dark:bg-neutral-900 sm:p-6"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between gap-4">
          <h2 className="text-base font-semibold text-neutral-900 dark:text-white">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            autoFocus
            className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-md border border-neutral-300 text-neutral-700 hover:bg-neutral-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 dark:border-neutral-600 dark:text-neutral-200 dark:hover:bg-neutral-800"
            aria-label="Close enlarged diagram"
            title="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="flex max-h-[78vh] items-center justify-center overflow-auto rounded-md bg-neutral-50 p-2 dark:bg-neutral-950 sm:p-4">
          {enlargedDiagram}
        </div>
      </section>
    </div>
  )
}

import { AlertCircle } from 'lucide-react'

export function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="text-center">
        <div className="inline-block w-12 h-12 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin"></div>
        <p className="mt-4 text-neutral-600 dark:text-neutral-400 transition-colors duration-500">Loading data...</p>
      </div>
    </div>
  )
}

export function ErrorMessage({ error }: { error: Error }) {
  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="card max-w-md">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-6 h-6 text-red-500 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold text-neutral-900 dark:text-white mb-1 transition-colors duration-500">Error Loading Data</h3>
            <p className="text-sm text-neutral-600 dark:text-neutral-400 transition-colors duration-500">{error.message}</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export function NoData({ message }: { message: string }) {
  return (
    <div className="text-center py-8">
      <p className="text-neutral-500 text-sm">{message}</p>
    </div>
  )
}

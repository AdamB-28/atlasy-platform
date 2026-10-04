import { useState } from 'react'
import { ChevronDown, ChevronUp, Database } from 'lucide-react'
import { useAdminMode } from '../contexts/AdminModeContext'

interface AdminDataPanelProps {
  title: string
  data: unknown
  className?: string
  sourcePath?: string | null
  sourceCell?: string | null
}

export default function AdminDataPanel({ title, data, className = '', sourcePath, sourceCell }: AdminDataPanelProps) {
  const { isAdminMode } = useAdminMode()
  const [isOpen, setIsOpen] = useState(false)

  if (!isAdminMode) return null

  return (
    <details
      className={`mt-4 border border-amber-400/70 bg-amber-50/70 dark:bg-amber-950/30 rounded-md ${className}`}
      open={isOpen}
      onToggle={(event) => setIsOpen(event.currentTarget.open)}
    >
      <summary className="list-none cursor-pointer px-3 py-2.5 flex items-center justify-between gap-3 text-sm font-semibold text-amber-950 dark:text-amber-100">
        <span className="inline-flex items-center gap-2"><Database className="w-4 h-4" />Admin data · {title}</span>
        {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
      </summary>
      {isOpen && (
        <div className="border-t border-amber-300/70 dark:border-amber-800 p-3">
          {(sourcePath || sourceCell) && (
            <p className="mb-2 text-xs font-medium text-amber-950 dark:text-amber-100 break-all">
              TEMP source: {sourcePath || 'CSV path not recorded'}{sourceCell ? ` · ${sourceCell}` : ''}
            </p>
          )}
          <p className="mb-2 text-xs text-amber-900/80 dark:text-amber-200/80">
            Local inspection view. This static-site mode is not server-side security.
          </p>
          <pre className="max-h-[min(60vh,32rem)] overflow-auto rounded bg-white/80 dark:bg-neutral-950/80 p-3 text-[11px] leading-relaxed text-neutral-800 dark:text-neutral-200 whitespace-pre-wrap break-words">
            {JSON.stringify(data, null, 2)}
          </pre>
        </div>
      )}
    </details>
  )
}

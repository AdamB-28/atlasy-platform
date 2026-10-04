import type { ImageLink } from '../types'
import { useAdminMode } from '../contexts/AdminModeContext'

interface AdminImageCaptionProps {
  link?: ImageLink | null
}

export default function AdminImageCaption({ link }: AdminImageCaptionProps) {
  const { isAdminMode } = useAdminMode()
  if (!isAdminMode || !link) return null

  const statusLabel = link.tempPath
    ? `.venv/TEMP/${link.tempPath}`
    : link.status === 'public-only'
      ? 'Not in the current TEMP drop-zone; published file already exists'
      : 'Not found in TEMP'
  const csvPath = link.sourceTempPath ? `.venv/TEMP/${link.sourceTempPath}` : link.sourceFile

  return (
    <details className="mt-2 border border-amber-300/80 dark:border-amber-800 rounded-md bg-amber-50/80 dark:bg-amber-950/30 text-xs text-amber-950 dark:text-amber-100">
      <summary className="cursor-pointer px-2.5 py-1.5 font-semibold">
        Image link · {link.label} · {csvPath} row {link.row}
      </summary>
      <dl className="grid grid-cols-[7.5rem_1fr] gap-x-2 gap-y-1 px-2.5 pb-2.5">
        <dt>CSV in TEMP</dt><dd className="break-all">{csvPath}</dd>
        <dt>CSV field</dt><dd className="break-all">{link.field}</dd>
        <dt>Sheet / cell</dt><dd>{link.sheet} {link.columnLetter}{link.row}</dd>
        <dt>Raw cell</dt><dd className="break-all">{link.rawCell || 'Empty'}</dd>
        <dt>Referenced</dt><dd className="break-all">{link.referencedName || 'None'}</dd>
        <dt>Resolved</dt><dd className="break-all">{link.resolvedName || 'None'}</dd>
        <dt>Alias</dt><dd>{link.aliasNote || 'No alias'}</dd>
        <dt>TEMP file</dt><dd className="break-all">{statusLabel}</dd>
        <dt>Public URL</dt><dd className="break-all">{link.publicUrl || 'Not published'}</dd>
        <dt>Status</dt><dd>{link.status}</dd>
      </dl>
    </details>
  )
}

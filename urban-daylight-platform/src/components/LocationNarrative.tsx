import type { LocationNarrative as NarrativeData } from '../types'

/** Source text is rendered verbatim; references are a draft list, not inferred citations. */
export default function LocationNarrative({ narrative, isAdminMode = false }: { narrative: NarrativeData; isAdminMode?: boolean }) {
  return (
    <section aria-label="Location narrative" className="max-w-5xl space-y-8 text-neutral-700 dark:text-neutral-300">
      {narrative.descriptions.length > 0 && <div>
        <h2 className="text-xl font-semibold text-neutral-900 dark:text-white">Location narrative</h2>
        <div className="mt-4 max-w-3xl space-y-4 text-sm leading-7 sm:text-base">
          {narrative.descriptions.map((entry) => (
            <p className="whitespace-pre-wrap" key={entry.source.cell}>{entry.value}</p>
          ))}
        </div>
      </div>}
      <div>
        <h2 className="text-xl font-semibold text-neutral-900 dark:text-white">Main planning principles</h2>
        <ul className="mt-4 max-w-3xl list-disc space-y-3 pl-5 text-sm leading-7 marker:text-primary-500 sm:text-base">
          {narrative.planningPrinciples.map((entry) => (
            <li key={entry.source.cell}>
              <span className="whitespace-pre-wrap">{entry.value}</span>
            </li>
          ))}
        </ul>
      </div>
      <div>
        <h2 className="text-xl font-semibold text-neutral-900 dark:text-white">Key characteristics</h2>
        {narrative.notes.map((entry) => (
          <div className="my-4 max-w-3xl text-sm leading-7 sm:text-base" key={entry.source.cell}>
            <p className="whitespace-pre-wrap">{entry.value}</p>
          </div>
        ))}
        <dl className="mt-4 grid gap-3 sm:grid-cols-2">
          {narrative.characteristics.map(({ label, value }) => (
            <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-4 dark:border-neutral-700 dark:bg-neutral-800/50" key={label.source.cell}>
              <dt className="text-sm font-semibold text-neutral-900 dark:text-white">{label.value}</dt>
              <dd className="mt-1 whitespace-pre-wrap text-sm leading-relaxed">{value.value}</dd>
            </div>
          ))}
        </dl>
      </div>
      {narrative.references.length > 0 && <div>
        <h2 className="text-xl font-semibold text-neutral-900 dark:text-white">References supplied in the case study</h2>
        {isAdminMode && <p>{narrative.referenceNote}</p>}
        <ul className="mt-4 max-w-3xl list-disc space-y-2 pl-5 text-sm leading-relaxed marker:text-primary-500">
          {narrative.references.map((reference) => (
            <li key={reference.source.paragraph}>
              <span className="break-words">{reference.value}</span>
            </li>
          ))}
        </ul>
      </div>}
    </section>
  )
}

import type { LocationNarrative as NarrativeData } from '../types'

/** Source text is rendered verbatim; references are a draft list, not inferred citations. */
export default function LocationNarrative({ narrative }: { narrative: NarrativeData }) {
  return (
    <section aria-label="Location narrative" className="space-y-6">
      {narrative.withholdingNotice && <p className="font-medium text-amber-800">{narrative.withholdingNotice}</p>}
      <div>
        <h2 className="text-xl font-semibold">Location narrative</h2>
        {narrative.descriptions.map((entry) => (
          <div className="mt-3" key={entry.source.cell}>
            <p className="whitespace-pre-wrap">{entry.value}</p>
          </div>
        ))}
      </div>
      <div>
        <h2 className="text-xl font-semibold">Main planning principles</h2>
        <ul className="list-disc space-y-3 pl-5">
          {narrative.planningPrinciples.map((entry) => (
            <li key={entry.source.cell}>
              <span className="whitespace-pre-wrap">{entry.value}</span>
            </li>
          ))}
        </ul>
      </div>
      <div>
        <h2 className="text-xl font-semibold">Key characteristics</h2>
        {narrative.notes.map((entry) => (
          <div className="my-3" key={entry.source.cell}>
            <p className="whitespace-pre-wrap">{entry.value}</p>
          </div>
        ))}
        <dl className="space-y-2">
          {narrative.characteristics.map(({ label, value }) => (
            <div key={label.source.cell}>
              <dt className="font-medium">{label.value}</dt>
              <dd className="whitespace-pre-wrap">{value.value}</dd>
            </div>
          ))}
        </dl>
      </div>
      <div>
        <h2 className="text-xl font-semibold">References supplied in the case study</h2>
        <p>{narrative.referenceNote}</p>
        {narrative.references.length === 0 ? <p>Reference list unavailable.</p> : (
          <ul className="list-disc space-y-2 pl-5">
            {narrative.references.map((reference) => (
              <li key={reference.source.paragraph}>
                <span className="break-words">{reference.value}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  )
}

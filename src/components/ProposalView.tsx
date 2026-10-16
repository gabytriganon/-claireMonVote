import { ExternalLink } from 'lucide-react'
import { issues, originLabel, positionLabel, type Proposal } from '../lib/data'

const EMPTY = 'Aucune proposition vérifiée sur ce thème à ce jour. Nous préférons le signaler plutôt que de deviner.'

export function ProposalView({ proposal, compact = false }: { proposal?: Proposal; compact?: boolean }) {
  if (!proposal || proposal.keyPoints.length === 0) {
    return <p className="text-slate-600 italic dark:text-slate-400">{EMPTY}</p>
  }
  return (
    <div className="space-y-5">
      <ul className="space-y-3">
        {proposal.keyPoints.map((point) => (
          <li key={point.text} className="flex gap-3">
            <span aria-hidden="true" className="mt-2.5 size-1.5 shrink-0 rounded-full bg-slate-500" />
            <span className="leading-relaxed">
              {point.text}{' '}
              <a
                href={point.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm font-medium break-words text-sky-700 hover:underline dark:text-sky-400"
              >
                <span data-secondary>{originLabel(point.origin)} · </span>
                {point.sourceLabel}
                <ExternalLink aria-hidden="true" className="ml-1 inline size-3 align-baseline" />
                <span className="sr-only">(source, nouvel onglet)</span>
              </a>
            </span>
          </li>
        ))}
      </ul>

      {!compact && proposal.positions && proposal.positions.length > 0 && (
        <dl className="grid gap-2 sm:grid-cols-2">
          {proposal.positions.map((pos) => {
            const issue = issues.find((i) => i.id === pos.issueId)
            if (!issue) return null
            return (
              <div key={pos.issueId} className="rounded-lg bg-slate-100 px-3 py-2 dark:bg-slate-800">
                <dt className="text-xs font-medium tracking-wide text-slate-600 uppercase dark:text-slate-400">
                  {issue.question}
                </dt>
                <dd className="font-semibold">
                  {positionLabel(issue, pos.value)}{' '}
                  <a
                    href={pos.sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs font-medium text-sky-700 hover:underline dark:text-sky-400"
                  >
                    source<span className="sr-only"> (nouvel onglet)</span>
                  </a>
                </dd>
              </div>
            )
          })}
        </dl>
      )}
    </div>
  )
}

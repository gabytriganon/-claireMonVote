import { ExternalLink, Quote } from 'lucide-react'
import { issues, positionLabel, type Proposal } from '../lib/data'

export function ProposalView({ proposal, compact = false }: { proposal?: Proposal; compact?: boolean }) {
  if (!proposal) {
    return <p className="text-slate-600 italic dark:text-slate-400">Aucune proposition publiée sur ce thème.</p>
  }
  return (
    <div className="space-y-5">
      <ul className="space-y-3">
        {proposal.keyPoints.map((point) => (
          <li key={point} className="flex gap-3">
            <span aria-hidden="true" className="mt-2.5 size-1.5 shrink-0 rounded-full bg-slate-500" />
            <span className="leading-relaxed">{point}</span>
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
                <dd className="font-semibold">{positionLabel(issue, pos.value)}</dd>
              </div>
            )
          })}
        </dl>
      )}

      {proposal.quotes?.map((quote) => (
        <blockquote
          key={quote}
          data-secondary
          className="flex gap-3 border-l-4 border-slate-300 pl-4 text-slate-700 italic dark:border-slate-600 dark:text-slate-300"
        >
          <Quote aria-hidden="true" className="mt-1 size-4 shrink-0 opacity-60" />
          <p>{quote}</p>
        </blockquote>
      ))}

      {proposal.sourceUrl && (
        <a
          href={proposal.sourceUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-sky-700 hover:underline dark:text-sky-400"
        >
          Source officielle
          <ExternalLink aria-hidden="true" className="size-3.5" />
          <span className="sr-only">(nouvel onglet)</span>
        </a>
      )}
    </div>
  )
}

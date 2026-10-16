import { useEffect } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import { ArrowLeft, ExternalLink, Scale } from 'lucide-react'
import { Avatar } from '../components/Avatar'
import { ProposalView } from '../components/ProposalView'
import { ThemeTabs } from '../components/ThemeTabs'
import { getCandidate, getProposal, getTheme, themes } from '../lib/data'
import { NotFoundPage } from './NotFoundPage'

export function CandidatePage() {
  const { id } = useParams()
  const [params, setParams] = useSearchParams()
  const candidate = getCandidate(id)
  const themeId = getTheme(params.get('theme'))?.id ?? themes[0].id

  useEffect(() => {
    if (candidate) document.title = `${candidate.name} · ÉclaireMonVote`
  }, [candidate])

  if (!candidate) return <NotFoundPage />

  const theme = getTheme(themeId)!

  return (
    <article className="space-y-8">
      <Link to="/" className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-600 hover:underline dark:text-slate-400">
        <ArrowLeft aria-hidden="true" className="size-4" /> Tous les candidats
      </Link>

      <header
        className="overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900"
        style={{ borderTop: `6px solid ${candidate.color}` }}
      >
        <div className="flex flex-col gap-5 p-5 sm:flex-row sm:p-8">
          <Avatar candidate={candidate} size={96} />
          <div className="space-y-3">
            <div>
              <h1 className="text-2xl font-bold sm:text-3xl">{candidate.name}</h1>
              <p className="text-slate-600 dark:text-slate-400">{candidate.party}</p>
            </div>
            <p className="text-sm text-slate-700 dark:text-slate-300">
              {candidate.status}{' '}
              <a
                href={candidate.statusSourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-sky-700 hover:underline dark:text-sky-400"
              >
                (source<span className="sr-only">, nouvel onglet</span>)
              </a>
            </p>
            <p className="max-w-3xl leading-relaxed text-slate-700 dark:text-slate-300">{candidate.summary}</p>
            <div className="flex flex-wrap gap-2 pt-1">
              {[
                { url: candidate.programUrl, label: 'Programme 2027' },
                { url: candidate.officialSiteUrl, label: 'Site officiel' },
              ]
                .filter((l): l is { url: string; label: string } => Boolean(l.url))
                .map((l) => (
                  <a
                    key={l.label}
                    href={l.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-800"
                  >
                    {l.label} <ExternalLink aria-hidden="true" className="size-4" />
                    <span className="sr-only">(nouvel onglet)</span>
                  </a>
                ))}
              <Link
                to={`/comparer?a=${candidate.id}&theme=${themeId}`}
                className="inline-flex items-center gap-1.5 rounded-lg bg-slate-900 px-3 py-2 text-sm font-semibold text-white hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200"
              >
                <Scale aria-hidden="true" className="size-4" /> Comparer avec…
              </Link>
            </div>
          </div>
        </div>
        {!candidate.programUrl && (
          <p className="border-t border-slate-200 px-5 py-3 text-sm text-slate-600 sm:px-8 dark:border-slate-800 dark:text-slate-400">
            Programme complet pour 2027 non publié à ce jour : les propositions ci-dessous proviennent de déclarations
            publiques ou d'un programme antérieur, comme indiqué à côté de chacune.
          </p>
        )}
      </header>

      <section className="space-y-5">
        <h2 className="sr-only">Propositions par thème</h2>
        <ThemeTabs idPrefix="fiche" active={themeId} onChange={(t) => setParams({ theme: t }, { replace: true })} />
        <div
          id="fiche-panel"
          role="tabpanel"
          aria-labelledby={`fiche-tab-${themeId}`}
          className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-8 dark:border-slate-800 dark:bg-slate-900"
        >
          <h3 className="mb-4 text-xl font-bold">{theme.label}</h3>
          <ProposalView proposal={getProposal(candidate, themeId)} />
        </div>
      </section>
    </article>
  )
}

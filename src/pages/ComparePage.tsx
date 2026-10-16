import { useEffect, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { AlertTriangle, ArrowLeftRight, Check, CircleHelp, X } from 'lucide-react'
import { Avatar } from '../components/Avatar'
import { ProposalView } from '../components/ProposalView'
import { ThemeTabs } from '../components/ThemeTabs'
import {
  candidates,
  compareCandidates,
  getCandidate,
  getProposal,
  getTheme,
  positionLabel,
  themes,
  type Candidate,
  type IssueComparison,
} from '../lib/data'
import { useAppStore } from '../store/useAppStore'

type Filter = 'tous' | 'accords' | 'desaccords'

const filters: { id: Filter; label: string; short: string }[] = [
  { id: 'tous', label: 'Tous', short: 'Tous' },
  { id: 'accords', label: "Points d'accord", short: 'Accords' },
  { id: 'desaccords', label: 'Points de désaccord', short: 'Désaccords' },
]

function CandidateSelect({
  label,
  value,
  exclude,
  onChange,
}: {
  label: string
  value?: string
  exclude?: string
  onChange: (id: string) => void
}) {
  return (
    <label className="flex-1 space-y-1">
      <span className="text-sm font-medium text-slate-600 dark:text-slate-400">{label}</span>
      <select
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-xl border border-slate-300 bg-white px-3 py-3 text-base font-semibold focus:outline-2 focus:outline-sky-600 dark:border-slate-700 dark:bg-slate-900"
      >
        <option value="" disabled>
          Choisir un candidat
        </option>
        {candidates.map((c) => (
          <option key={c.id} value={c.id} disabled={c.id === exclude}>
            {c.name} ({c.party})
          </option>
        ))}
      </select>
    </label>
  )
}

function AgreementBadge({ comparable, agree }: { comparable: boolean; agree: boolean }) {
  if (!comparable) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-300">
        <CircleHelp aria-hidden="true" className="size-3.5" /> Non comparable
      </span>
    )
  }
  return agree ? (
    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-900 dark:bg-emerald-900/50 dark:text-emerald-200">
      <Check aria-hidden="true" className="size-3.5" /> Accord
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 rounded-full bg-rose-100 px-2 py-0.5 text-xs font-semibold text-rose-900 dark:bg-rose-900/50 dark:text-rose-200">
      <X aria-hidden="true" className="size-3.5" /> Désaccord
    </span>
  )
}

function PositionRow({ row, a, b }: { row: IssueComparison; a: Candidate; b: Candidate }) {
  return (
    <li className="space-y-2 py-3">
      <div className="flex flex-wrap items-center gap-2">
        <span className="font-semibold">{row.issue.question}</span>
        <AgreementBadge comparable={row.comparable} agree={row.agree} />
      </div>
      <dl className="grid grid-cols-2 gap-3 text-sm">
        {[
          { c: a, v: row.a },
          { c: b, v: row.b },
        ].map(({ c, v }) => (
          <div key={c.id} className="rounded-lg border-l-4 bg-slate-50 px-3 py-2 dark:bg-slate-800/60" style={{ borderColor: c.color }}>
            <dt className="text-xs text-slate-600 dark:text-slate-400">{c.name}</dt>
            <dd className="font-medium">{positionLabel(row.issue, v)}</dd>
          </div>
        ))}
      </dl>
    </li>
  )
}

export function ComparePage() {
  const [params, setParams] = useSearchParams()
  const stored = useAppStore((s) => s.compare)
  const a = getCandidate(params.get('a') ?? stored[0])
  const b = getCandidate(params.get('b') ?? (params.get('a') ? undefined : stored[1]))
  const themeId = getTheme(params.get('theme'))?.id ?? themes[0].id
  const filter = (filters.find((f) => f.id === params.get('filtre'))?.id ?? 'tous') as Filter

  useEffect(() => {
    document.title = a && b ? `${a.name} vs ${b.name} · ÉclaireMonVote` : 'Comparer · ÉclaireMonVote'
  }, [a, b])

  function update(changes: Record<string, string | undefined>) {
    const next = new URLSearchParams()
    const merged = { a: a?.id, b: b?.id, theme: themeId, filtre: filter, ...changes }
    for (const [k, v] of Object.entries(merged)) if (v && !(k === 'filtre' && v === 'tous')) next.set(k, v)
    setParams(next, { replace: true })
  }

  // Comparateur mobile : un candidat visible à la fois, on swipe de l'un à l'autre.
  const scroller = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(0)
  function onScroll() {
    const el = scroller.current
    if (el && el.clientWidth) setVisible(Math.round(el.scrollLeft / el.clientWidth))
  }
  function showPanel(index: number) {
    const el = scroller.current
    el?.scrollTo({ left: index * el.clientWidth, behavior: 'smooth' })
  }

  const all = a && b ? compareCandidates(a, b) : []
  const majorDivergences = all.filter((r) => r.issue.major && r.comparable && !r.agree)
  const agreeCount = all.filter((r) => r.agree).length
  const comparableCount = all.filter((r) => r.comparable).length
  const themeRows = all
    .filter((r) => r.issue.themeId === themeId)
    .filter((r) => (filter === 'tous' ? true : filter === 'accords' ? r.agree : r.comparable && !r.agree))
  const theme = getTheme(themeId)!

  return (
    <div className="space-y-8">
      <header className="space-y-4">
        <h1 className="text-3xl font-bold tracking-tight">Comparer deux candidats</h1>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <CandidateSelect label="Candidat A" value={a?.id} exclude={b?.id} onChange={(id) => update({ a: id })} />
          <button
            type="button"
            onClick={() => update({ a: b?.id, b: a?.id })}
            disabled={!a || !b}
            className="inline-flex size-12 shrink-0 items-center justify-center self-center rounded-full border border-slate-300 hover:bg-slate-100 disabled:opacity-40 dark:border-slate-700 dark:hover:bg-slate-800"
          >
            <ArrowLeftRight aria-hidden="true" className="size-5" />
            <span className="sr-only">Inverser les candidats</span>
          </button>
          <CandidateSelect label="Candidat B" value={b?.id} exclude={a?.id} onChange={(id) => update({ b: id })} />
        </div>
      </header>

      {!a || !b ? (
        <p className="rounded-2xl border border-dashed border-slate-300 p-8 text-center text-slate-600 dark:border-slate-700 dark:text-slate-400">
          Choisissez deux candidats pour afficher leurs programmes côte à côte, ou sélectionnez-les depuis{' '}
          <Link to="/" className="font-semibold text-sky-700 hover:underline dark:text-sky-400">
            la liste des candidats
          </Link>
          .
        </p>
      ) : (
        <>
          <section
            aria-labelledby="divergences"
            className="rounded-2xl border border-amber-300 bg-amber-50 p-5 sm:p-6 dark:border-amber-800 dark:bg-amber-950/40"
          >
            <h2 id="divergences" className="flex items-center gap-2 text-lg font-bold text-amber-950 dark:text-amber-100">
              <AlertTriangle aria-hidden="true" className="size-5" /> Divergences majeures
            </h2>
            <p className="mt-1 text-sm text-amber-900 dark:text-amber-200">
              {majorDivergences.length} divergence{majorDivergences.length > 1 ? 's' : ''} majeure
              {majorDivergences.length > 1 ? 's' : ''} · {agreeCount} point{agreeCount > 1 ? 's' : ''} d'accord sur{' '}
              {comparableCount} question{comparableCount > 1 ? 's' : ''} clé{comparableCount > 1 ? 's' : ''} où les deux positions
              sont connues
            </p>
            {majorDivergences.length === 0 ? (
              <p className="mt-3">Aucune opposition frontale sur les questions clés où les deux positions sont connues.</p>
            ) : (
              <ul className="mt-3 divide-y divide-amber-200 dark:divide-amber-900">
                {majorDivergences.map((row) => (
                  <li key={row.issue.id} className="grid gap-2 py-3 sm:grid-cols-[1fr_1fr_1fr] sm:items-center">
                    <button
                      type="button"
                      onClick={() => update({ theme: row.issue.themeId })}
                      className="text-left font-semibold text-amber-950 hover:underline dark:text-amber-100"
                    >
                      {row.issue.question}
                    </button>
                    {[
                      { c: a, v: row.a },
                      { c: b, v: row.b },
                    ].map(({ c, v }) => (
                      <p key={c.id} className="flex items-center gap-2 text-sm">
                        <span aria-hidden="true" className="size-2.5 shrink-0 rounded-full" style={{ backgroundColor: c.color }} />
                        <span>
                          <span className="sr-only">{c.name} : </span>
                          <span className="font-medium">{positionLabel(row.issue, v)}</span>
                          <span data-secondary className="text-slate-600 dark:text-slate-400" aria-hidden="true">
                            {' '}
                            ({c.name})
                          </span>
                        </span>
                      </p>
                    ))}
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="space-y-5">
            <h2 className="sr-only">Comparaison par thème</h2>
            <ThemeTabs idPrefix="versus" active={themeId} onChange={(t) => update({ theme: t })} />

            <div id="versus-panel" role="tabpanel" aria-labelledby={`versus-tab-${themeId}`} className="space-y-6">
              <div className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 dark:border-slate-800 dark:bg-slate-900">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <h3 className="text-lg font-bold">Positions clés · {theme.label}</h3>
                  <div role="radiogroup" aria-label="Filtrer par niveau d'accord" className="grid grid-cols-3 rounded-lg bg-slate-100 p-1 text-sm sm:inline-grid dark:bg-slate-800">
                    {filters.map((f) => (
                      <button
                        key={f.id}
                        type="button"
                        role="radio"
                        aria-checked={filter === f.id}
                        onClick={() => update({ filtre: f.id })}
                        className={`rounded-md px-3 py-1.5 font-medium ${
                          filter === f.id ? 'bg-white shadow-sm dark:bg-slate-950' : 'text-slate-600 dark:text-slate-400'
                        }`}
                      >
                        <span className="sm:hidden">{f.short}</span>
                        <span className="hidden sm:inline">{f.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
                {themeRows.length === 0 ? (
                  <p className="mt-4 text-slate-600 dark:text-slate-400">Aucune question clé correspondante sur ce thème.</p>
                ) : (
                  <ul className="mt-2 divide-y divide-slate-200 dark:divide-slate-800">
                    {themeRows.map((row) => (
                      <PositionRow key={row.issue.id} row={row} a={a} b={b} />
                    ))}
                  </ul>
                )}
              </div>

              <div className="flex rounded-lg bg-slate-100 p-1 md:hidden dark:bg-slate-800" aria-label="Candidat affiché" role="group">
                {[a, b].map((c, i) => (
                  <button
                    key={c.id}
                    type="button"
                    aria-pressed={visible === i}
                    onClick={() => showPanel(i)}
                    className={`flex flex-1 items-center justify-center gap-2 rounded-md px-3 py-2 text-sm font-semibold ${
                      visible === i ? 'bg-white shadow-sm dark:bg-slate-950' : 'text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    <span aria-hidden="true" className="size-2.5 rounded-full" style={{ backgroundColor: c.color }} />
                    {c.name}
                  </button>
                ))}
              </div>

              <div
                ref={scroller}
                onScroll={onScroll}
                className="no-scrollbar -mx-4 flex snap-x snap-mandatory overflow-x-auto scroll-smooth md:mx-0 md:grid md:grid-cols-2 md:gap-6 md:overflow-visible"
              >
                {[a, b].map((c) => (
                  <div key={c.id} className="w-full shrink-0 snap-center px-4 md:w-auto md:px-0">
                    <div
                      className="h-full rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 dark:border-slate-800 dark:bg-slate-900"
                      style={{ borderTop: `6px solid ${c.color}` }}
                    >
                      <div className="mb-4 flex items-center gap-3">
                        <Avatar candidate={c} size={48} />
                        <div>
                          <Link to={`/candidat/${c.id}?theme=${themeId}`} className="font-bold hover:underline">
                            {c.name}
                          </Link>
                          <p className="text-sm text-slate-600 dark:text-slate-400">{c.party}</p>
                        </div>
                      </div>
                      <ProposalView proposal={getProposal(c, themeId)} compact />
                    </div>
                  </div>
                ))}
              </div>
              <p className="text-center text-sm text-slate-600 md:hidden dark:text-slate-400" data-secondary>
                Faites glisser pour passer d'un candidat à l'autre.
              </p>
            </div>
          </section>
        </>
      )}
    </div>
  )
}

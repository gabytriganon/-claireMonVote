import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowRight, Check, Plus, Scale, Search, X } from 'lucide-react'
import { Avatar } from '../components/Avatar'
import { ProvisionalNotice } from '../components/ProvisionalNotice'
import { getCandidate, searchCandidates } from '../lib/data'
import { useAppStore } from '../store/useAppStore'

export function HomePage() {
  const [query, setQuery] = useState('')
  const results = useMemo(() => searchCandidates(query), [query])
  const { compare, toggleCompare, clearCompare } = useAppStore()
  const navigate = useNavigate()
  const selected = compare.map(getCandidate).filter((c) => c !== undefined)

  function goCompare() {
    const params = new URLSearchParams()
    if (selected[0]) params.set('a', selected[0].id)
    if (selected[1]) params.set('b', selected[1].id)
    navigate(`/comparer?${params}`)
  }

  return (
    <div className="space-y-8 pb-24">
      <section className="space-y-4">
        <h1 className="text-3xl font-bold tracking-tight text-balance sm:text-4xl">
          Les programmes des candidats, clairs et comparables
        </h1>
        <p className="max-w-2xl text-lg text-slate-700 dark:text-slate-300">
          Consultez la synthèse de chaque programme par thème, puis comparez deux candidats côte à côte pour voir où ils
          s'accordent et où ils s'opposent.
        </p>
        <div className="flex flex-col gap-3 sm:flex-row">
          <label className="relative flex-1">
            <span className="sr-only">Rechercher un candidat ou un mot-clé</span>
            <Search aria-hidden="true" className="pointer-events-none absolute top-1/2 left-3 size-5 -translate-y-1/2 text-slate-500" />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Candidat, parti ou mot-clé (ex. retraite, nucléaire)"
              className="w-full rounded-xl border border-slate-300 bg-white py-3 pr-3 pl-10 text-base shadow-sm placeholder:text-slate-500 focus:border-sky-600 focus:outline-2 focus:outline-sky-600 dark:border-slate-700 dark:bg-slate-900"
            />
          </label>
          <button
            type="button"
            onClick={goCompare}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-5 py-3 font-semibold text-white shadow-sm hover:bg-slate-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-600 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200"
          >
            <Scale aria-hidden="true" className="size-5" />
            Comparer 2 candidats
          </button>
        </div>
        <ProvisionalNotice />
      </section>

      <section aria-labelledby="annuaire">
        <h2 id="annuaire" className="sr-only">
          Annuaire des candidats
        </h2>
        <p aria-live="polite" className="mb-3 text-sm text-slate-600 dark:text-slate-400">
          {query ? `${results.length} candidat${results.length > 1 ? 's' : ''} pour « ${query} »` : `${results.length} candidats`}
        </p>
        {results.length === 0 ? (
          <p className="rounded-xl border border-dashed border-slate-300 p-8 text-center text-slate-600 dark:border-slate-700 dark:text-slate-400">
            Aucun résultat. Essayez un autre mot-clé.
          </p>
        ) : (
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {results.map(({ candidate, themes: matched }) => {
              const isSelected = compare.includes(candidate.id)
              return (
                <li
                  key={candidate.id}
                  className="flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900"
                >
                  <div className="h-1.5" style={{ backgroundColor: candidate.color }} />
                  <div className="flex flex-1 flex-col gap-4 p-5">
                    <div className="flex items-center gap-4">
                      <Avatar candidate={candidate} />
                      <div className="min-w-0">
                        <h3 className="text-lg font-bold">{candidate.name}</h3>
                        <p className="text-sm text-slate-600 dark:text-slate-400">{candidate.party}</p>
                      </div>
                    </div>
                    <p className="text-sm text-slate-700 dark:text-slate-300">{candidate.status}</p>
                    {matched.length > 0 && (
                      <p className="text-sm text-slate-700 dark:text-slate-300">
                        Mentionné dans :{' '}
                        {matched.map((t, i) => (
                          <span key={t.id}>
                            {i > 0 && ', '}
                            <Link className="font-medium text-sky-700 hover:underline dark:text-sky-400" to={`/candidat/${candidate.id}?theme=${t.id}`}>
                              {t.label}
                            </Link>
                          </span>
                        ))}
                      </p>
                    )}
                    <div className="mt-auto flex gap-2 pt-2">
                      <Link
                        to={`/candidat/${candidate.id}`}
                        className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold hover:bg-slate-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-600 dark:border-slate-700 dark:hover:bg-slate-800"
                      >
                        Voir le programme <span className="sr-only">de {candidate.name}</span>
                        <ArrowRight aria-hidden="true" className="size-4" />
                      </Link>
                      <button
                        type="button"
                        aria-pressed={isSelected}
                        onClick={() => toggleCompare(candidate.id)}
                        className={`inline-flex items-center justify-center gap-1.5 rounded-lg border px-3 py-2 text-sm font-semibold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-600 ${
                          isSelected
                            ? 'border-sky-700 bg-sky-700 text-white dark:border-sky-400 dark:bg-sky-400 dark:text-slate-950'
                            : 'border-slate-300 hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-800'
                        }`}
                      >
                        {isSelected ? <Check aria-hidden="true" className="size-4" /> : <Plus aria-hidden="true" className="size-4" />}
                        Comparer <span className="sr-only">{candidate.name}</span>
                      </button>
                    </div>
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </section>

      {selected.length > 0 && (
        <div className="fixed inset-x-0 bottom-0 z-20 border-t border-slate-200 bg-white/95 backdrop-blur dark:border-slate-800 dark:bg-slate-950/95">
          <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-3">
            <div className="flex -space-x-3">
              {selected.map((c) => (
                <Avatar key={c.id} candidate={c} size={40} />
              ))}
            </div>
            <p className="min-w-0 flex-1 truncate text-sm font-medium">
              {selected.length === 2
                ? `${selected[0].name} et ${selected[1].name}`
                : `${selected[0].name} : choisissez un second candidat`}
            </p>
            <button
              type="button"
              onClick={clearCompare}
              className="inline-flex size-10 items-center justify-center rounded-full hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <X aria-hidden="true" className="size-5" />
              <span className="sr-only">Vider la sélection</span>
            </button>
            <button
              type="button"
              onClick={goCompare}
              disabled={selected.length < 2}
              className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50 dark:bg-white dark:text-slate-900"
            >
              <Scale aria-hidden="true" className="size-4" />
              Comparer
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

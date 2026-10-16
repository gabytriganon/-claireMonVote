import { Info } from 'lucide-react'
import { formatDate, meta } from '../lib/data'

/** Rappelle que la liste n'est pas officielle et date la dernière vérification des données. */
export function ProvisionalNotice() {
  return (
    <aside
      aria-labelledby="liste-provisoire"
      className="rounded-2xl border border-sky-300 bg-sky-50 p-4 text-sm sm:p-5 dark:border-sky-800 dark:bg-sky-950/40"
    >
      <h2 id="liste-provisoire" className="flex items-center gap-2 font-bold text-sky-950 dark:text-sky-100">
        <Info aria-hidden="true" className="size-4" />
        {meta.election} · liste provisoire, mise à jour le {formatDate(meta.updatedAt)}
      </h2>
      <p className="mt-1 text-sky-950 dark:text-sky-100">
        {meta.selection} La liste officielle sera arrêtée par le Conseil constitutionnel avant le premier tour du{' '}
        {formatDate(meta.firstRound)} : l'app ne gardera alors que les candidats officiels.
      </p>
      <p className="mt-1 text-sky-900 dark:text-sky-200" data-secondary>
        Chaque proposition renvoie vers sa source publique. Quand une position n'a pas pu être vérifiée, l'app l'indique
        au lieu de la deviner. Sources de la sélection :{' '}
        {meta.selectionSources.map((s, i) => (
          <span key={s.url}>
            {i > 0 && ', '}
            <a href={s.url} target="_blank" rel="noopener noreferrer" className="font-medium underline">
              {s.label}
            </a>
          </span>
        ))}
        .
      </p>
    </aside>
  )
}

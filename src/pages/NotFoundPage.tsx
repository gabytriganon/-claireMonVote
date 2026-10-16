import { Link } from 'react-router-dom'

export function NotFoundPage() {
  return (
    <div className="space-y-4 py-16 text-center">
      <h1 className="text-2xl font-bold">Page introuvable</h1>
      <p className="text-slate-600 dark:text-slate-400">Ce candidat ou cette page n'existe pas.</p>
      <Link to="/" className="inline-block font-semibold text-sky-700 hover:underline dark:text-sky-400">
        Retour à la liste des candidats
      </Link>
    </div>
  )
}

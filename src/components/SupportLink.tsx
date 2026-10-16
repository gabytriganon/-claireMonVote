import { Heart } from 'lucide-react'

// Lien de don (HelloAsso, Tipeee, Ko-fi…) fourni au build par VITE_SOUTIEN_URL ; sans lien valide, rien n'est affiché.
function supportUrl(): string | undefined {
  const raw = import.meta.env.VITE_SOUTIEN_URL?.trim()
  if (!raw) return undefined
  try {
    const url = new URL(raw)
    return url.protocol === 'https:' ? url.href : undefined
  } catch {
    return undefined
  }
}

const url = supportUrl()

export function SupportLink() {
  if (!url) return null
  return (
    <div className="mx-auto mt-4 flex max-w-6xl flex-col gap-2 px-4 sm:flex-row sm:items-center sm:gap-3">
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex w-fit items-center gap-2 rounded-full border border-slate-300 px-3 py-1.5 font-medium text-slate-800 hover:bg-slate-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-600 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
      >
        <Heart aria-hidden="true" className="size-4" />
        Soutenir le projet
        <span className="sr-only">(nouvel onglet)</span>
      </a>
      <p>
        Projet indépendant financé par les dons de particuliers. Les dons de partis politiques et de candidats sont
        refusés.
      </p>
    </div>
  )
}

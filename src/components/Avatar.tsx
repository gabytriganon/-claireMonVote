import { useState } from 'react'
import { photos, type Candidate } from '../lib/data'
import { withBase } from '../lib/base'

/** Photo sous licence libre si elle a été récupérée, sinon avatar à initiales. */
export function Avatar({ candidate, size = 64 }: { candidate: Candidate; size?: number }) {
  const [failed, setFailed] = useState(false)
  const photo = photos[candidate.id]
  const src = photo && !failed ? withBase(`/photos/${photo.file}`) : withBase(candidate.avatarUrl)
  return (
    <img
      src={src}
      alt=""
      width={size}
      height={size}
      loading="lazy"
      decoding="async"
      onError={() => setFailed(true)}
      className="shrink-0 rounded-full object-cover object-top ring-2 ring-white dark:ring-slate-900"
      style={{ width: size, height: size, backgroundColor: candidate.color }}
    />
  )
}

/** Crédit obligatoire des licences Creative Commons : auteur, licence et lien vers la source. */
export function PhotoCreditLine({ candidate }: { candidate: Candidate }) {
  const photo = photos[candidate.id]
  if (!photo) return null
  return (
    <p data-secondary className="text-xs text-slate-600 dark:text-slate-400">
      Photo :{' '}
      <a href={photo.sourceUrl} target="_blank" rel="noopener noreferrer" className="underline">
        {photo.author}
      </a>
      ,{' '}
      {photo.licenseUrl ? (
        <a href={photo.licenseUrl} target="_blank" rel="noopener noreferrer" className="underline">
          {photo.license}
        </a>
      ) : (
        photo.license
      )}
      , via Wikimedia Commons
    </p>
  )
}

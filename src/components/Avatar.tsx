import type { Candidate } from '../lib/data'

export function Avatar({ candidate, size = 64 }: { candidate: Candidate; size?: number }) {
  return (
    <img
      src={candidate.avatarUrl}
      alt=""
      width={size}
      height={size}
      loading="lazy"
      decoding="async"
      className="shrink-0 rounded-full ring-2 ring-white dark:ring-slate-900"
      style={{ width: size, height: size, backgroundColor: candidate.color }}
    />
  )
}

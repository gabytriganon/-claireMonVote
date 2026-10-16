import candidatesJson from '../data/candidates.json'
import themesJson from '../data/themes.json'
import issuesJson from '../data/issues.json'
import metaJson from '../data/meta.json'

export interface Position {
  issueId: string
  value: string
  sourceUrl: string
}

/** Une proposition vérifiable : chaque point renvoie vers la page publique qui l'atteste. */
export interface KeyPoint {
  text: string
  sourceUrl: string
  sourceLabel: string
  /** Nature de la source, ex. « programme-2022 », « declaration-2026 ». */
  origin: string
}

export interface Proposal {
  themeId: string
  themeLabel: string
  keyPoints: KeyPoint[]
  positions?: Position[]
}

export interface Candidate {
  id: string
  name: string
  party: string
  avatarUrl: string
  color: string
  status: string
  statusSourceUrl: string
  summary: string
  officialSiteUrl?: string | null
  programUrl?: string | null
  /** Titre de l'article Wikipédia (fr) dont l'image principale sert de photo, si elle est sous licence libre. */
  wikipediaTitle?: string
  proposals: Proposal[]
}

/** Crédit d'une photo sous licence libre, généré par `scripts/fetch-photos.mjs`. */
export interface PhotoCredit {
  file: string
  author: string
  license: string
  licenseUrl?: string
  sourceUrl: string
}

export interface Meta {
  election: string
  firstRound: string
  updatedAt: string
  provisional: boolean
  selection: string
  selectionSources: { label: string; url: string }[]
}

export let meta = metaJson as Meta

/** Année de l'élection, ex. « 2027 ». */
export const electionYear = meta.election.match(/\d{4}/)?.[0] ?? ''

const originWords: Record<string, string> = {
  programme: 'Programme',
  'programme-europeennes': 'Programme européennes',
  'programme-synthese': 'Programme (synthèse)',
  declaration: 'Déclaration',
  livre: 'Livre',
  'contre-budget': 'Contre-budget',
  'proposition-de-loi': 'Proposition de loi',
}

/**
 * Libellé lisible de la nature d'une source : « declaration-2026 » → « Déclaration 2026 »,
 * « programme-2027-synthese » → « Programme (synthèse) 2027 », « declaration-2024-2026 » → « Déclaration 2024-2026 ».
 */
export function originLabel(origin: string): string {
  const parts = origin.split('-')
  const years = parts.filter((p) => /^\d{4}$/.test(p))
  const kind = parts.filter((p) => !/^\d{4}$/.test(p)).join('-')
  const label = originWords[kind] ?? kind.charAt(0).toUpperCase() + kind.slice(1).replace(/-/g, ' ')
  return [label, years.join('-')].filter(Boolean).join(' ')
}

export function formatDate(iso: string): string {
  return new Date(`${iso}T12:00:00`).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
}

export interface Theme {
  id: string
  label: string
  icon: string
}

export interface Issue {
  id: string
  themeId: string
  question: string
  major: boolean
  options: Record<string, string>
}

export let themes = themesJson as Theme[]
export let issues = issuesJson as unknown as Issue[]
/** Photos disponibles (id du candidat → crédit), vide tant que les crédits n'ont pas été chargés. */
export let photos: Record<string, PhotoCredit> = {}

/**
 * Ordre d'affichage aléatoire, tiré une fois par session de navigation, pour qu'aucun
 * candidat ne bénéficie durablement de la première place (biais de position).
 */
function sessionShuffle<T extends { id: string }>(items: T[]): T[] {
  let order: string[] | null = null
  try {
    order = JSON.parse(sessionStorage.getItem('eclairemonvote-order') ?? 'null')
  } catch {
    order = null
  }
  const ids = items.map((c) => c.id)
  if (!order || order.length !== ids.length || !ids.every((id) => order!.includes(id))) {
    order = [...ids]
    for (let i = order.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[order[i], order[j]] = [order[j], order[i]]
    }
    try {
      sessionStorage.setItem('eclairemonvote-order', JSON.stringify(order))
    } catch {
      /* stockage indisponible : l'ordre change à chaque chargement, ce qui reste neutre */
    }
  }
  return order.map((id) => items.find((c) => c.id === id)!)
}

export let candidates = sessionShuffle(candidatesJson as Candidate[])

export interface DataBundle {
  candidates: Candidate[]
  themes: Theme[]
  issues: Issue[]
  meta: Meta
}

/** Remplace les données embarquées par une version plus récente (appelé au démarrage, avant le premier rendu). */
export function applyData(bundle: Partial<DataBundle>, credits?: Record<string, PhotoCredit>) {
  if (bundle.meta && bundle.candidates && bundle.themes && bundle.issues && bundle.meta.updatedAt >= meta.updatedAt) {
    meta = bundle.meta
    themes = bundle.themes
    issues = bundle.issues
    candidates = sessionShuffle(bundle.candidates)
  }
  // Neutralité : des photos pour certains candidats seulement les mettraient en avant. Tout le monde ou personne.
  if (credits && candidates.every((c) => credits[c.id])) photos = credits
}

export function getCandidate(id: string | null | undefined): Candidate | undefined {
  return candidates.find((c) => c.id === id)
}

export function getProposal(candidate: Candidate, themeId: string): Proposal | undefined {
  return candidate.proposals.find((p) => p.themeId === themeId)
}

export function getTheme(themeId: string | null | undefined): Theme | undefined {
  return themes.find((t) => t.id === themeId)
}

export function positionOf(candidate: Candidate, issueId: string): string | undefined {
  for (const p of candidate.proposals) {
    const found = p.positions?.find((pos) => pos.issueId === issueId)
    if (found) return found.value
  }
  return undefined
}

export function positionLabel(issue: Issue, value: string | undefined): string {
  if (!value) return 'Position non connue à ce jour'
  return issue.options[value] ?? value
}

export interface IssueComparison {
  issue: Issue
  a?: string
  b?: string
  /** Les deux positions sont connues : on peut dire s'il y a accord ou désaccord. */
  comparable: boolean
  agree: boolean
}

/** Compare les positions de deux candidats sur les questions clés (éventuellement d'un seul thème). */
export function compareCandidates(a: Candidate, b: Candidate, themeId?: string): IssueComparison[] {
  return issues
    .filter((issue) => !themeId || issue.themeId === themeId)
    .map((issue) => {
      const va = positionOf(a, issue.id)
      const vb = positionOf(b, issue.id)
      const comparable = va !== undefined && vb !== undefined
      return { issue, a: va, b: vb, comparable, agree: comparable && va === vb }
    })
    .filter((c) => c.a !== undefined || c.b !== undefined)
}

export function normalize(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
}

export interface SearchMatch {
  candidate: Candidate
  themes: Theme[]
}

/** Recherche par nom, parti, mot-clé ou thème. Renvoie aussi les thèmes où le mot-clé apparaît. */
export function searchCandidates(query: string): SearchMatch[] {
  const q = normalize(query.trim())
  if (!q) return candidates.map((candidate) => ({ candidate, themes: [] }))
  const results: SearchMatch[] = []
  for (const candidate of candidates) {
    const identity = normalize(
      [candidate.name, candidate.party].join(' '),
    )
    const matchedThemes = candidate.proposals
      .filter((p) => normalize([p.themeLabel, ...p.keyPoints.map((k) => k.text)].join(' ')).includes(q))
      .map((p) => getTheme(p.themeId))
      .filter((t): t is Theme => Boolean(t))
    if (identity.includes(q) || matchedThemes.length > 0) {
      results.push({ candidate, themes: matchedThemes })
    }
  }
  return results
}

import candidatesJson from '../data/candidates.json'
import themesJson from '../data/themes.json'
import issuesJson from '../data/issues.json'

export interface Position {
  issueId: string
  value: string
}

export interface Proposal {
  themeId: string
  themeLabel: string
  keyPoints: string[]
  quotes?: string[]
  stance?: string
  sourceUrl?: string
  positions?: Position[]
}

export interface Candidate {
  id: string
  name: string
  party: string
  avatarUrl: string
  color: string
  slogan?: string
  tags?: string[]
  summary: string
  officialProgramUrl: string
  proposals: Proposal[]
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

export const themes = themesJson as Theme[]
export const issues = issuesJson as unknown as Issue[]
const allCandidates = candidatesJson as Candidate[]

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

export const candidates = sessionShuffle(allCandidates)

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
  if (!value) return 'Pas de position exprimée'
  return issue.options[value] ?? value
}

export interface IssueComparison {
  issue: Issue
  a?: string
  b?: string
  agree: boolean
}

/** Compare les positions de deux candidats sur les questions clés (éventuellement d'un seul thème). */
export function compareCandidates(a: Candidate, b: Candidate, themeId?: string): IssueComparison[] {
  return issues
    .filter((issue) => !themeId || issue.themeId === themeId)
    .map((issue) => {
      const va = positionOf(a, issue.id)
      const vb = positionOf(b, issue.id)
      return { issue, a: va, b: vb, agree: va !== undefined && va === vb }
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
      [candidate.name, candidate.party, candidate.slogan ?? '', ...(candidate.tags ?? [])].join(' '),
    )
    const matchedThemes = candidate.proposals
      .filter((p) => normalize([p.themeLabel, ...p.keyPoints, ...(p.quotes ?? [])].join(' ')).includes(q))
      .map((p) => getTheme(p.themeId))
      .filter((t): t is Theme => Boolean(t))
    if (identity.includes(q) || matchedThemes.length > 0) {
      results.push({ candidate, themes: matchedThemes })
    }
  }
  return results
}

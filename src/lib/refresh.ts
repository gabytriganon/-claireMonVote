import { applyData, type DataBundle, type PhotoCredit } from './data'

const TIMEOUT_MS = 3000

async function getJson<T>(path: string, signal: AbortSignal): Promise<T | undefined> {
  try {
    // no-store : on veut la version publiée la plus récente, pas une copie du cache HTTP.
    const res = await fetch(import.meta.env.BASE_URL + path, { cache: 'no-store', signal })
    return res.ok ? ((await res.json()) as T) : undefined
  } catch {
    return undefined
  }
}

/**
 * Au démarrage, récupère la dernière version publiée des données et des crédits photo.
 * Sans réseau (ou au-delà de 3 s), l'app démarre avec les données embarquées ou celles du cache hors ligne.
 */
export async function refreshData(): Promise<void> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS)
  const [candidates, themes, issues, meta, credits] = await Promise.all([
    getJson<DataBundle['candidates']>('data/candidates.json', controller.signal),
    getJson<DataBundle['themes']>('data/themes.json', controller.signal),
    getJson<DataBundle['issues']>('data/issues.json', controller.signal),
    getJson<DataBundle['meta']>('data/meta.json', controller.signal),
    getJson<Record<string, PhotoCredit>>('photos/credits.json', controller.signal),
  ])
  clearTimeout(timer)
  applyData({ candidates, themes, issues, meta }, credits)
}

// Vérifie que chaque lien source des données répond encore, et liste les liens cassés.
// N'échoue pas le build : un site média peut être temporairement indisponible ou bloquer les robots.
// Usage : node scripts/check-sources.mjs
import { readFile, writeFile } from 'node:fs/promises'

const UA = 'Mozilla/5.0 (compatible; EclaireMonVote-link-check/1.0; +https://github.com/gabytriganon/-claireMonVote)'
const candidates = JSON.parse(await readFile('src/data/candidates.json', 'utf8'))
const meta = JSON.parse(await readFile('src/data/meta.json', 'utf8'))

const links = new Map() // url → où il est utilisé
const add = (url, where) => url && links.set(url, [...(links.get(url) ?? []), where])
for (const s of meta.selectionSources) add(s.url, 'Sélection des candidats')
for (const c of candidates) {
  add(c.statusSourceUrl, `${c.name} · statut`)
  add(c.officialSiteUrl, `${c.name} · site officiel`)
  add(c.programUrl, `${c.name} · programme`)
  for (const p of c.proposals) {
    for (const k of p.keyPoints) add(k.sourceUrl, `${c.name} · ${p.themeLabel}`)
    for (const pos of p.positions ?? []) add(pos.sourceUrl, `${c.name} · position ${pos.issueId}`)
  }
}

async function check(url) {
  for (const method of ['HEAD', 'GET']) {
    try {
      const res = await fetch(url, { method, redirect: 'follow', headers: { 'User-Agent': UA }, signal: AbortSignal.timeout(15000) })
      if (res.ok) return 'ok'
      // 401/403/429 : le site refuse les robots, la page existe probablement. Seuls 404/410 signalent un lien mort.
      if ([404, 410].includes(res.status) && method === 'GET') return `HTTP ${res.status}`
      if (![404, 405, 410].includes(res.status)) return 'ok'
    } catch (err) {
      if (method === 'GET') return err.name === 'TimeoutError' ? 'délai dépassé' : 'injoignable'
    }
  }
  return 'ok'
}

const urls = [...links.keys()]
const broken = []
for (let i = 0; i < urls.length; i += 8) {
  const results = await Promise.all(urls.slice(i, i + 8).map(check))
  results.forEach((r, j) => r !== 'ok' && broken.push({ url: urls[i + j], status: r, where: links.get(urls[i + j]) }))
}

const summary =
  `### Vérification des sources\n\n${urls.length - broken.length}/${urls.length} liens répondent.\n\n` +
  broken.map((b) => `- ${b.status} : ${b.url}\n  (${[...new Set(b.where)].join(' ; ')})`).join('\n') +
  '\n'
console.log(summary)
if (process.env.GITHUB_STEP_SUMMARY) await writeFile(process.env.GITHUB_STEP_SUMMARY, summary, { flag: 'a' })

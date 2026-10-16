// Récupère la photo de chaque candidat sur Wikimedia Commons, uniquement sous licence libre,
// et écrit public/photos/<id>.<ext> + public/photos/credits.json (auteur, licence, source).
// Fichiers essayés dans l'ordre : image principale des articles Wikipédia fr puis en, image Wikidata,
// puis les photos de la catégorie Commons du candidat. Le premier fichier sous licence libre est retenu.
// Usage : node scripts/fetch-photos.mjs   (nécessite un accès réseau à Wikipédia et Wikimedia Commons)
import { mkdir, readFile, writeFile } from 'node:fs/promises'

const UA = 'EclaireMonVote/1.0 (https://github.com/gabytriganon/-claireMonVote)'
const OUT = 'public/photos'
// Licences acceptées : Creative Commons BY / BY-SA, CC0, domaine public. Tout le reste est refusé.
const FREE = /^(cc[ -]by(-sa)?[ -][\d.]+|cc0|public domain|pd\b)/i

async function api(host, params) {
  const url = `https://${host}/w/api.php?${new URLSearchParams({ format: 'json', formatversion: '2', origin: '*', ...params })}`
  const res = await fetch(url, { headers: { 'User-Agent': UA } })
  if (!res.ok) throw new Error(`${host} : HTTP ${res.status}`)
  return res.json()
}

/** Informations Commons d'un fichier, ou la raison pour laquelle il est refusé. */
async function commonsFile(name) {
  const file = (await api('commons.wikimedia.org', { action: 'query', prop: 'imageinfo', iiprop: 'url|extmetadata|mime', iiurlwidth: '320', titles: `File:${name}` })).query.pages[0]
  // Un fichier hébergé seulement sur Wikipédia (souvent non libre) est introuvable sur Commons.
  const info = file?.imageinfo?.[0]
  if (!info) return { reason: `${name} absent de Commons` }
  if (!/^image\/(jpeg|png)$/.test(info.mime)) return { reason: `${name} n'est pas une photo` }
  const meta = info.extmetadata ?? {}
  const license = meta.LicenseShortName?.value ?? ''
  if (!FREE.test(license) || meta.NonFree?.value === 'true') return { reason: `${name} : licence « ${license} » refusée` }
  return { info, license, meta }
}

async function leadImage(host, title) {
  const page = (await api(host, { action: 'query', prop: 'pageimages|pageprops', piprop: 'name', titles: title, redirects: '1' })).query.pages[0]
  return { image: page?.pageimage, qid: page?.pageprops?.wikibase_item }
}

async function findFreeFile(title) {
  const names = []
  const fr = await leadImage('fr.wikipedia.org', title)
  names.push(fr.image)
  names.push((await leadImage('en.wikipedia.org', title)).image)
  if (fr.qid) {
    const claims = (await api('www.wikidata.org', { action: 'wbgetclaims', entity: fr.qid, property: 'P18' })).claims?.P18 ?? []
    names.push(...claims.map((cl) => cl.mainsnak?.datavalue?.value))
  }
  const members = (await api('commons.wikimedia.org', { action: 'query', list: 'categorymembers', cmtitle: `Category:${title}`, cmtype: 'file', cmlimit: '30' })).query?.categorymembers ?? []
  names.push(...members.map((m) => m.title.replace(/^File:/, '')))
  const reasons = []
  for (const name of [...new Set(names.filter(Boolean))]) {
    const res = await commonsFile(name)
    if (res.info) return res
    reasons.push(res.reason)
  }
  return { reasons: reasons.slice(0, 3) }
}

const stripHtml = (html) => html.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim()

const candidates = JSON.parse(await readFile('src/data/candidates.json', 'utf8'))
await mkdir(OUT, { recursive: true })
const credits = {}
const report = []

for (const c of candidates) {
  if (!c.wikipediaTitle) {
    report.push(`- ${c.name} : pas d'article Wikipédia renseigné, avatar à initiales.`)
    continue
  }
  try {
    const found = await findFreeFile(c.wikipediaTitle)
    if (!found.info) throw new Error(found.reasons.join(' ; ') || 'aucune image trouvée')
    const { info, license, meta } = found
    const img = await fetch(info.thumburl, { headers: { 'User-Agent': UA } })
    if (!img.ok) throw new Error(`téléchargement : HTTP ${img.status}`)
    const ext = (img.headers.get('content-type') ?? info.mime).includes('png') ? 'png' : 'jpg'
    await writeFile(`${OUT}/${c.id}.${ext}`, Buffer.from(await img.arrayBuffer()))
    credits[c.id] = {
      file: `${c.id}.${ext}`,
      author: stripHtml(meta.Artist?.value ?? '') || 'Auteur inconnu',
      license,
      licenseUrl: meta.LicenseUrl?.value,
      sourceUrl: info.descriptionurl,
    }
    report.push(`- ${c.name} : ${license}, ${credits[c.id].author} (${info.descriptionurl})`)
  } catch (err) {
    report.push(`- ${c.name} : pas de photo (${err.message}), avatar à initiales.`)
  }
}

await writeFile(`${OUT}/credits.json`, JSON.stringify(credits, null, 2) + '\n')
const summary = `### Photos des candidats\n\n${Object.keys(credits).length}/${candidates.length} photos sous licence libre.\n\n${report.join('\n')}\n`
console.log(summary)
if (process.env.GITHUB_STEP_SUMMARY) await writeFile(process.env.GITHUB_STEP_SUMMARY, summary, { flag: 'a' })

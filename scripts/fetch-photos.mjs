// Récupère la photo de chaque candidat sur Wikimedia Commons, uniquement sous licence libre,
// et écrit public/photos/<id>.<ext> + public/photos/credits.json (auteur, licence, source).
// La photo retenue est l'image principale de l'article Wikipédia (fr) du candidat (`wikipediaTitle`).
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
    const page = (await api('fr.wikipedia.org', { action: 'query', prop: 'pageimages', piprop: 'name', titles: c.wikipediaTitle, redirects: '1' })).query.pages[0]
    if (!page?.pageimage) throw new Error("pas d'image principale sur l'article")
    // Interrogé sur Commons : un fichier hébergé seulement sur Wikipédia (souvent non libre) est introuvable ici.
    const file = (await api('commons.wikimedia.org', { action: 'query', prop: 'imageinfo', iiprop: 'url|extmetadata|mime', iiurlwidth: '320', titles: `File:${page.pageimage}` })).query.pages[0]
    const info = file?.imageinfo?.[0]
    if (!info) throw new Error(`fichier absent de Wikimedia Commons (${page.pageimage})`)
    const meta = info.extmetadata ?? {}
    const license = meta.LicenseShortName?.value ?? ''
    if (!FREE.test(license) || meta.NonFree?.value === 'true') throw new Error(`licence non libre ou inconnue (« ${license} »)`)
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
    report.push(`- ${c.name} : ${license}, ${credits[c.id].author}`)
  } catch (err) {
    report.push(`- ${c.name} : pas de photo (${err.message}), avatar à initiales.`)
  }
}

await writeFile(`${OUT}/credits.json`, JSON.stringify(credits, null, 2) + '\n')
const summary = `### Photos des candidats\n\n${Object.keys(credits).length}/${candidates.length} photos sous licence libre.\n\n${report.join('\n')}\n`
console.log(summary)
if (process.env.GITHUB_STEP_SUMMARY) await writeFile(process.env.GITHUB_STEP_SUMMARY, summary, { flag: 'a' })

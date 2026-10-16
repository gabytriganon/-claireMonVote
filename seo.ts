import type { Plugin, ResolvedConfig } from 'vite'
import candidatesJson from './src/data/candidates.json'
import themesJson from './src/data/themes.json'
import metaJson from './src/data/meta.json'

/**
 * Référencement : génère au build une page HTML par route (accueil, comparateur, chaque candidat) avec son titre,
 * sa description, son URL canonique, ses balises Open Graph, ses données structurées et le texte des programmes.
 * Les moteurs de recherche lisent ainsi le contenu sans exécuter l'app ; React remplace ce contenu au démarrage.
 * Génère aussi sitemap.xml, robots.txt, 404.html (non indexée) et, si configuré, .well-known/assetlinks.json (Play Store).
 *
 * Variables d'environnement (repo variables du workflow) :
 * - SITE_URL : adresse publique de l'app, ex. https://eclairemonvote.fr/ ; sans elle, ni canonique ni sitemap.
 * - GOOGLE_SITE_VERIFICATION : code de la balise de validation Google Search Console.
 * - ANDROID_PACKAGE_ID, ANDROID_CERT_SHA256 : identifiant de l'app Android et empreinte(s) SHA-256 de sa clé de signature
 *   (séparées par des virgules), pour le Digital Asset Links de l'app Play Store (TWA).
 */

interface KeyPoint {
  text: string
  sourceUrl: string
  sourceLabel: string
}
interface Candidate {
  id: string
  name: string
  party: string
  status: string
  summary: string
  officialSiteUrl?: string | null
  programUrl?: string | null
  wikipediaTitle?: string
  proposals: { themeId: string; themeLabel: string; keyPoints: KeyPoint[] }[]
}

const candidates = candidatesJson as Candidate[]
const themes = themesJson as { id: string; label: string }[]
const meta = metaJson as { election: string; updatedAt: string }
const year = meta.election.match(/\d{4}/)?.[0] ?? ''

interface Page {
  /** Chemin relatif à la base, sans slash initial ('' pour l'accueil). */
  path: string
  file: string
  title: string
  description: string
  body: string
  jsonLd?: object[]
  noindex?: boolean
}

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
const clip = (s: string, n = 155) => (s.length <= n ? s : s.slice(0, s.lastIndexOf(' ', n - 1)) + '…')

function buildPages(base: string, siteUrl: string | undefined): Page[] {
  const link = (path: string) => base + path
  // Les données structurées demandent des URL absolues.
  const abs = (path: string) => (siteUrl ? new URL(path, siteUrl).href : link(path))
  const nav = `<nav><a href="${link('')}">Candidats</a> · <a href="${link('comparer')}">Comparer</a></nav>`
  const names = candidates.map((c) => c.name)

  const home: Page = {
    path: '',
    file: 'index.html',
    title: `Programmes présidentiels ${year} : comparer les candidats · ÉclaireMonVote`,
    description: clip(
      `Les programmes de la présidentielle ${year}, candidat par candidat et thème par thème (économie, santé, écologie, éducation, sécurité, international), sourcés et comparables deux à deux.`,
    ),
    body: `${nav}
<h1>Programmes présidentiels ${year} : les candidats, clairs et comparables</h1>
<p>Consultez la synthèse du programme de chaque candidat à l'élection présidentielle ${year}, thème par thème, puis comparez deux candidats côte à côte. Chaque proposition renvoie vers sa source publique.</p>
<h2>Les candidats</h2>
<ul>${candidates
      .map((c) => `<li><a href="${link(`candidat/${c.id}`)}">Programme de ${esc(c.name)}</a> (${esc(c.party)}) : ${esc(c.status)}</li>`)
      .join('')}</ul>
<h2>Les thèmes</h2>
<ul>${themes.map((t) => `<li>${esc(t.label)}</li>`).join('')}</ul>`,
    jsonLd: [
      { '@type': 'WebSite', name: 'ÉclaireMonVote', inLanguage: 'fr' },
      {
        '@type': 'ItemList',
        name: `Programmes des candidats à la présidentielle ${year}`,
        itemListElement: candidates.map((c, i) => ({ '@type': 'ListItem', position: i + 1, name: c.name, url: abs(`candidat/${c.id}`) })),
      },
    ],
  }

  const compare: Page = {
    path: 'comparer',
    file: 'comparer.html',
    title: `Comparer les programmes présidentiels ${year} · ÉclaireMonVote`,
    description: clip(
      `Comparez deux candidats à la présidentielle ${year} côte à côte : points d'accord, divergences majeures et propositions sourcées, thème par thème.`,
    ),
    body: `${nav}
<h1>Comparer deux candidats à la présidentielle ${year}</h1>
<p>Choisissez deux candidats parmi ${esc(names.join(', '))} pour voir où ils s'accordent et où ils s'opposent, thème par thème.</p>`,
  }

  const candidatePages: Page[] = candidates.map((c) => ({
    path: `candidat/${c.id}`,
    file: `candidat/${c.id}.html`,
    title: `Programme de ${c.name} (présidentielle ${year}) · ÉclaireMonVote`,
    description: clip(
      `Le programme de ${c.name} (${c.party}) pour la présidentielle ${year} : ${c.proposals.map((p) => p.themeLabel.toLowerCase()).join(', ')}. Propositions sourcées et comparables.`,
    ),
    body: `${nav}
<article>
<h1>Programme de ${esc(c.name)} pour la présidentielle ${year}</h1>
<p>${esc(c.party)}. ${esc(c.status)}</p>
<p>${esc(c.summary)}</p>
${c.programUrl ? `<p><a href="${esc(c.programUrl)}" rel="noopener">Programme officiel</a></p>` : ''}
${c.proposals
  .map(
    (p) => `<section><h2>${esc(p.themeLabel)}</h2><ul>${p.keyPoints
      .map((k) => `<li>${esc(k.text)} <a href="${esc(k.sourceUrl)}" rel="noopener">${esc(k.sourceLabel)}</a></li>`)
      .join('')}</ul></section>`,
  )
  .join('\n')}
</article>`,
    jsonLd: [
      {
        '@type': 'ProfilePage',
        name: `Programme de ${c.name}`,
        inLanguage: 'fr',
        dateModified: meta.updatedAt,
        mainEntity: {
          '@type': 'Person',
          name: c.name,
          affiliation: { '@type': 'Organization', name: c.party },
          ...(c.officialSiteUrl ? { url: c.officialSiteUrl } : {}),
          ...(c.wikipediaTitle ? { sameAs: [`https://fr.wikipedia.org/wiki/${encodeURIComponent(c.wikipediaTitle.replace(/ /g, '_'))}`] } : {}),
        },
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Candidats', item: abs('') },
          { '@type': 'ListItem', position: 2, name: c.name, item: abs(`candidat/${c.id}`) },
        ],
      },
    ],
  }))

  const notFound: Page = {
    path: '404',
    file: '404.html',
    title: 'Page introuvable · ÉclaireMonVote',
    description: home.description,
    body: `${nav}<h1>Page introuvable</h1>`,
    noindex: true,
  }

  return [home, compare, ...candidatePages, notFound]
}

// Mise en forme minimale du contenu pré-rendu, visible un instant avant le démarrage de l'app (ou sans JavaScript).
const prerenderStyle =
  '<style>#prerender{max-width:72rem;margin:0 auto;padding:1.5rem 1rem;font-family:system-ui,sans-serif;line-height:1.5}#prerender a{color:#0369a1}#prerender li{margin:.25rem 0}</style>'

function renderPage(template: string, page: Page, siteUrl: string | undefined, verification: string | undefined): string {
  const url = siteUrl ? new URL(page.path, siteUrl).href : undefined
  const absolute = (path: string) => (siteUrl ? new URL(path.replace(/^\//, ''), siteUrl).href : path)
  const head = [
    url && !page.noindex ? `<link rel="canonical" href="${url}" />` : '',
    page.noindex ? '<meta name="robots" content="noindex" />' : '',
    verification ? `<meta name="google-site-verification" content="${esc(verification)}" />` : '',
    '<meta property="og:type" content="website" />',
    '<meta property="og:site_name" content="ÉclaireMonVote" />',
    '<meta property="og:locale" content="fr_FR" />',
    `<meta property="og:title" content="${esc(page.title)}" />`,
    `<meta property="og:description" content="${esc(page.description)}" />`,
    url ? `<meta property="og:url" content="${url}" />` : '',
    siteUrl ? `<meta property="og:image" content="${absolute('pwa-512x512.png')}" />` : '',
    '<meta name="twitter:card" content="summary" />',
    ...(page.jsonLd ?? []).map(
      (d) => `<script type="application/ld+json">${JSON.stringify({ '@context': 'https://schema.org', ...d }).replace(/</g, '\\u003c')}</script>`,
    ),
    prerenderStyle,
  ]
    .filter(Boolean)
    .join('\n    ')

  return template
    .replace(/<title>.*?<\/title>/s, `<title>${esc(page.title)}</title>`)
    .replace(/<meta name="description" content=".*?" \/>/, `<meta name="description" content="${esc(page.description)}" />`)
    .replace('</head>', `  ${head}\n  </head>`)
    .replace('<div id="root"></div>', `<div id="root"><div id="prerender">${page.body}</div></div>`)
}

export function seo(): Plugin {
  let config: ResolvedConfig
  return {
    name: 'seo-prerender',
    apply: 'build',
    enforce: 'post',
    configResolved(resolved) {
      config = resolved
    },
    generateBundle(_, bundle) {
      const index = bundle['index.html']
      if (!index || index.type !== 'asset') return
      const template = String(index.source)
      const siteUrl = process.env.SITE_URL ? process.env.SITE_URL.replace(/\/?$/, '/') : undefined
      const verification = process.env.GOOGLE_SITE_VERIFICATION || undefined
      // Liens internes absolus depuis la base, pour fonctionner quel que soit le niveau de la page.
      const pages = buildPages(config.base, siteUrl)

      for (const page of pages) {
        const html = renderPage(template, page, siteUrl, verification)
        if (page.file === 'index.html') index.source = html
        else this.emitFile({ type: 'asset', fileName: page.file, source: html })
      }

      if (siteUrl) {
        const urls = pages
          .filter((p) => !p.noindex)
          .map((p) => `  <url><loc>${new URL(p.path, siteUrl).href}</loc><lastmod>${meta.updatedAt}</lastmod></url>`)
        this.emitFile({
          type: 'asset',
          fileName: 'sitemap.xml',
          source: `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join('\n')}\n</urlset>\n`,
        })
      }
      this.emitFile({
        type: 'asset',
        fileName: 'robots.txt',
        source: `User-agent: *\nAllow: /\n${siteUrl ? `\nSitemap: ${siteUrl}sitemap.xml\n` : ''}`,
      })

      const packageId = process.env.ANDROID_PACKAGE_ID
      const fingerprints = process.env.ANDROID_CERT_SHA256?.split(',').map((f) => f.trim()).filter(Boolean)
      if (packageId && fingerprints?.length) {
        // N'est lu par Android que s'il est servi à la racine du domaine (base « / »).
        if (config.base !== '/') config.logger.warn(`assetlinks.json publié sous ${config.base} : Android ne le lira qu'à la racine du domaine.`)
        this.emitFile({
          type: 'asset',
          fileName: '.well-known/assetlinks.json',
          source: JSON.stringify(
            [
              {
                relation: ['delegate_permission/common.handle_all_urls'],
                target: { namespace: 'android_app', package_name: packageId, sha256_cert_fingerprints: fingerprints },
              },
            ],
            null,
            2,
          ),
        })
      }
    },
  }
}

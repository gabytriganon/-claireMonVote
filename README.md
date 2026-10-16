# ÉclaireMonVote

Progressive Web App pour consulter et comparer les programmes des candidats à l'élection présidentielle, thème par thème, en toute neutralité. Installable sur mobile et ordinateur, utilisable hors ligne.

> Données : **présidentielle 2027**, liste **provisoire** des candidats déclarés ou désignés par leur parti et testés dans les sondages (mise à jour dans `src/data/meta.json`). Chaque proposition renvoie vers la page publique qui l'atteste ; une position non vérifiée est affichée comme « non connue », jamais devinée.

## Fonctionnalités

- **Accueil** : annuaire des candidats (ordre aléatoire par session pour éviter le biais de position), recherche par nom, parti ou mot-clé thématique, sélection de 2 candidats pour la comparaison.
- **Fiche candidat** : résumé, lien vers le programme officiel, onglets par thème avec points clés, positions sur les questions clés, citations et source.
- **Comparateur (Versus)** : deux candidats côte à côte, encadré « Divergences majeures », filtre points d'accord / de désaccord. Sur mobile, on swipe d'un candidat à l'autre sans perdre le thème actif.
- **Accessibilité** : mode sombre / clair, mode lecture simplifiée (texte plus grand et aéré, éléments secondaires masqués), navigation clavier, contrastes AA.
- **PWA** : manifeste, service worker (précache de l'app et des données, cache first pour les images, network first pour de futures données distantes).

## Stack

Vite, React, TypeScript, Tailwind CSS v4, Lucide, Zustand, React Router, vite-plugin-pwa.

## Démarrer

```bash
npm install
npm run dev        # serveur de développement
npm run build      # build de production dans dist/
npm run preview    # sert le build (service worker actif)
```

L'app utilise des URL propres (`/candidat/:id`, `/comparer`) : l'hébergeur doit renvoyer `index.html` pour toute route. `vercel.json` (Vercel) et `public/_redirects` (Netlify) sont fournis.

## GitHub Pages

Chaque push sur `main` publie l'app sur https://gabytriganon.github.io/-claireMonVote/ via le workflow `.github/workflows/deploy-pages.yml` (build avec `--base=/<nom-du-dépôt>/`, et `404.html` pour les liens directs vers une page). Une seule fois : dans *Settings > Pages* du dépôt, choisir **GitHub Actions** comme *Source*.

## Modifier les données

Tout est dans `src/data/` :

| Fichier | Contenu |
| --- | --- |
| `candidates.json` | Candidats (statut de candidature et sa source, site officiel, programme 2027 s'il existe) et propositions par thème. Chaque point clé porte sa source : `{ text, sourceUrl, sourceLabel, origin }`, où `origin` vaut par exemple `programme-2027`, `declaration-2026` ou `programme-2022`. Chaque position sur une question clé porte aussi son `sourceUrl`. |
| `meta.json` | Élection, date du premier tour, date de mise à jour, critère de sélection des candidats et ses sources. |
| `themes.json` | Liste des thèmes affichés en onglets. |
| `issues.json` | Questions clés comparables (ex. âge de départ à la retraite) et leurs options. `major: true` les fait apparaître dans « Divergences majeures ». |

Deux candidats sont **d'accord** sur une question quand leurs `positions` ont la même valeur, en **désaccord** quand elles diffèrent. Si l'une des deux positions est inconnue, la question est marquée « non comparable » et n'est comptée ni comme accord ni comme désaccord.

Règles de neutralité pour la mise à jour : même structure pour chaque candidat (6 thèmes, mêmes questions clés), aucune proposition sans source publique vérifiable, pas de photo sous droits (avatars à initiales), ordre d'affichage aléatoire.

## Mise à jour des données et photos

- **Au démarrage**, l'app recharge la dernière version publiée de `data/*.json` et `photos/credits.json` (délai max. 3 s, sinon données embarquées ou cache hors ligne). Une app installée affiche donc toujours la dernière mise à jour publiée, sans attendre la mise à jour de son service worker.
- **Chaque lundi** (et à la demande via *Actions > Déployer sur GitHub Pages > Run workflow*), le workflow re-télécharge les photos, vérifie que chaque lien source répond encore (résultat dans le résumé du job) et republie le site.
- **Photos** : `scripts/fetch-photos.mjs` prend l'image principale de l'article Wikipédia (`wikipediaTitle`) seulement si elle est hébergée sur Wikimedia Commons sous licence libre (CC BY, CC BY-SA, CC0, domaine public), et enregistre auteur et licence, affichés sur chaque fiche. Si un seul candidat n'a pas de photo libre, l'app garde les avatars à initiales pour tout le monde.
- **Contenu des programmes** : il n'est pas réécrit automatiquement. Les nouvelles propositions doivent être recherchées, sourcées et relues avant publication dans `src/data/`.

Pour remplacer les icônes de l'app : modifier `public/logo.svg` puis lancer `npm run generate-pwa-assets`.

# ÉclaireMonVote

Progressive Web App pour consulter et comparer les programmes des candidats à l'élection présidentielle, thème par thème, en toute neutralité. Installable sur mobile et ordinateur, utilisable hors ligne.

> Les candidats actuellement présents sont **fictifs** (données de démonstration).

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

## Modifier les données

Tout est dans `src/data/` :

| Fichier | Contenu |
| --- | --- |
| `candidates.json` | Candidats et propositions par thème (schéma du DSE, enrichi de `slogan`, `tags`, `quotes`, `sourceUrl`, `positions`). |
| `themes.json` | Liste des thèmes affichés en onglets. |
| `issues.json` | Questions clés comparables (ex. âge de départ à la retraite) et leurs options. `major: true` les fait apparaître dans « Divergences majeures ». |

Deux candidats sont **d'accord** sur une question quand leurs `positions` ont la même valeur, en **désaccord** sinon.

Pour remplacer les icônes de l'app : modifier `public/logo.svg` puis lancer `npm run generate-pwa-assets`.

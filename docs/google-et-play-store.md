# Être trouvé sur Google et publié sur le Play Store

## Ce que fait le dépôt

- **Une page HTML par route** est générée au build (`seo.ts`) : accueil, comparateur et une page par candidat, chacune avec son titre (« Programmes présidentiels 2027 : comparer les candidats », « Programme de … (présidentielle 2027) »), sa description, son URL canonique, ses balises Open Graph, des données structurées schema.org et le texte complet des propositions. Google lit ainsi tout le contenu sans exécuter l'app, et chaque page répond en 200 (auparavant, les liens directs passaient par une page 404).
- `sitemap.xml` et `robots.txt` sont générés avec l'adresse publique (`SITE_URL`).
- `404.html` est marquée `noindex`.
- `confidentialite.html` : politique de confidentialité, obligatoire pour le Play Store.
- `.well-known/assetlinks.json` est généré si `ANDROID_PACKAGE_ID` et `ANDROID_CERT_SHA256` sont définis.

Toutes ces valeurs se règlent dans *Settings > Secrets and variables > Actions > Variables* du dépôt, puis en relançant *Actions > Déployer sur GitHub Pages > Run workflow*.

| Variable | Exemple | Rôle |
| --- | --- | --- |
| `SITE_URL` | `https://eclairemonvote.fr/` | Adresse publique. Par défaut : `https://gabytriganon.github.io/-claireMonVote/`. |
| `GOOGLE_SITE_VERIFICATION` | `AbCdEf…` | Code de la balise de validation Search Console (méthode « Balise HTML »). |
| `ANDROID_PACKAGE_ID` | `fr.eclairemonvote.app` | Identifiant de l'app Android. |
| `ANDROID_CERT_SHA256` | `12:AB:…` | Empreinte(s) SHA-256 de la clé de signature, séparées par des virgules. |

## Google : à faire une fois

1. Ouvrir [Google Search Console](https://search.google.com/search-console), ajouter une propriété « Préfixe d'URL » avec l'adresse du site, choisir la validation « Balise HTML » et copier le code dans `GOOGLE_SITE_VERIFICATION`. Relancer le déploiement, puis cliquer sur *Valider*.
2. Dans *Sitemaps*, envoyer `sitemap.xml`. Sur `gabytriganon.github.io/-claireMonVote/`, c'est indispensable : Google ne lit `robots.txt` qu'à la racine du domaine, donc il n'y trouvera pas le sitemap tout seul.
3. Dans *Inspection de l'URL*, demander l'indexation de l'accueil.

Le classement n'est pas garanti. « Programmes présidentiels » est une recherche où se positionnent des médias et des sites publics très établis. Ce qui aide vraiment ensuite, c'est d'être cité par d'autres sites (liens entrants : associations, blogs, réseaux sociaux, articles), un domaine propre, et un contenu à jour. Les recherches plus précises (« programme Marine Tondelier 2027 », « comparer Attal Retailleau ») sont plus accessibles et chaque fiche candidat est conçue pour elles.

## Play Store

Le Play Store accepte les PWA sous forme de **Trusted Web Activity** (TWA) : une app Android légère qui affiche le site en plein écran. La condition : prouver que le site et l'app ont le même propriétaire, avec le fichier `https://<domaine>/.well-known/assetlinks.json`. **Ce fichier doit être à la racine du domaine.** Sur `gabytriganon.github.io/-claireMonVote/`, il serait publié sous `/-claireMonVote/.well-known/`, où Android ne le lit pas. Deux solutions :

- **Recommandé : un nom de domaine** (par exemple `eclairemonvote.fr`, environ 10 € par an chez OVH, Gandi, etc.). Le brancher sur GitHub Pages (*Settings > Pages > Custom domain*, avec les enregistrements DNS indiqués par GitHub), puis définir `SITE_URL` sur `https://eclairemonvote.fr/`. L'app est alors servie à la racine et `assetlinks.json` est au bon endroit. C'est aussi meilleur pour la notoriété et le référencement.
- **Gratuit** : créer un dépôt nommé `gabytriganon.github.io` contenant seulement `.well-known/assetlinks.json` (et un fichier vide `.nojekyll`), publié par GitHub Pages. L'app Android pointe alors sur l'hôte `gabytriganon.github.io` avec l'URL de démarrage `/-claireMonVote/`.

### Construire l'app Android

Prérequis : Node.js et un JDK 17 (Bubblewrap propose d'installer le JDK et le SDK Android lui-même).

```bash
npm i -g @bubblewrap/cli
mkdir android && cd android
bubblewrap init --manifest https://eclairemonvote.fr/manifest.webmanifest
# identifiant suggéré : fr.eclairemonvote.app ; garder précieusement la clé (android.keystore) et son mot de passe
bubblewrap build
```

Cela produit `app-release-bundle.aab` (à envoyer au Play Store) et affiche l'empreinte SHA-256 de la clé (aussi visible avec `keytool -list -v -keystore android.keystore`).

### Publier

1. Créer un compte [Google Play Console](https://play.google.com/console) (25 $ une fois, pièce d'identité demandée). Un compte personnel récent doit faire tester l'app en test fermé par au moins 12 testeurs pendant 14 jours avant de pouvoir la publier en production.
2. Créer l'app, envoyer le `.aab`. Activer la signature par Google Play : dans *Configuration > Intégrité de l'app*, copier l'empreinte SHA-256 de la **clé de signature d'app** fournie par Google.
3. Mettre dans `ANDROID_PACKAGE_ID` l'identifiant choisi, et dans `ANDROID_CERT_SHA256` l'empreinte de Google, plus celle de votre clé d'upload séparée par une virgule. Relancer le déploiement et vérifier que `https://<domaine>/.well-known/assetlinks.json` s'affiche. Sans cela, l'app affiche une barre d'adresse au lieu d'être en plein écran.
4. Fiche : politique de confidentialité `https://<domaine>/confidentialite.html`, captures d'écran, icône 512 px (`public/pwa-512x512.png`). Pour une app qui traite d'élections, Google exige d'indiquer clairement qu'elle n'est affiliée à aucun gouvernement ni parti, et de citer les sources : le préciser dans la description (l'app l'indique déjà dans son pied de page et cite chaque source).

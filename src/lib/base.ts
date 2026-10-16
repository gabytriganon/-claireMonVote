// Préfixe un chemin absolu de `public/` avec le chemin de base de l'app (ex. GitHub Pages).
export function withBase(path: string): string {
  return path.startsWith('/') ? import.meta.env.BASE_URL + path.slice(1) : path
}

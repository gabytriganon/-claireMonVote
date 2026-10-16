import { useEffect, useState } from 'react'
import { Link, NavLink, Outlet } from 'react-router-dom'
import { BookOpenText, Download, Moon, Sun, WifiOff } from 'lucide-react'
import { useAppStore } from '../store/useAppStore'
import { withBase } from '../lib/base'
import { formatDate, meta } from '../lib/data'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
}

function useSystemDark() {
  const [dark, setDark] = useState(() => matchMedia('(prefers-color-scheme: dark)').matches)
  useEffect(() => {
    const mq = matchMedia('(prefers-color-scheme: dark)')
    const onChange = () => setDark(mq.matches)
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])
  return dark
}

function useOnline() {
  const [online, setOnline] = useState(navigator.onLine)
  useEffect(() => {
    const update = () => setOnline(navigator.onLine)
    window.addEventListener('online', update)
    window.addEventListener('offline', update)
    return () => {
      window.removeEventListener('online', update)
      window.removeEventListener('offline', update)
    }
  }, [])
  return online
}

function useInstallPrompt() {
  const [event, setEvent] = useState<BeforeInstallPromptEvent | null>(null)
  useEffect(() => {
    const onPrompt = (e: Event) => {
      e.preventDefault()
      setEvent(e as BeforeInstallPromptEvent)
    }
    const onInstalled = () => setEvent(null)
    window.addEventListener('beforeinstallprompt', onPrompt)
    window.addEventListener('appinstalled', onInstalled)
    return () => {
      window.removeEventListener('beforeinstallprompt', onPrompt)
      window.removeEventListener('appinstalled', onInstalled)
    }
  }, [])
  return event
}

const iconButton =
  'inline-flex size-10 items-center justify-center rounded-full border border-slate-300 bg-white text-slate-700 hover:bg-slate-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800'

export function Layout() {
  const { theme, setTheme, simpleReading, toggleSimpleReading } = useAppStore()
  const systemDark = useSystemDark()
  const dark = theme ? theme === 'dark' : systemDark
  const online = useOnline()
  const installEvent = useInstallPrompt()

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark)
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', dark ? '#020617' : '#0f172a')
  }, [dark])

  useEffect(() => {
    document.documentElement.classList.toggle('simple', simpleReading)
  }, [simpleReading])

  const navClass = ({ isActive }: { isActive: boolean }) =>
    `rounded-full px-3 py-1.5 text-sm font-medium ${
      isActive
        ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
        : 'text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'
    }`

  return (
    <div className="flex min-h-dvh flex-col">
      <a
        href="#contenu"
        className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:rounded focus:bg-white focus:px-3 focus:py-2 focus:text-slate-900"
      >
        Aller au contenu
      </a>
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/90 backdrop-blur dark:border-slate-800 dark:bg-slate-950/90">
        <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-3">
          <Link to="/" className="flex items-center gap-2 font-bold tracking-tight">
            <img src={withBase('/logo.svg')} alt="" width={32} height={32} className="size-8" />
            <span className="text-lg">ÉclaireMonVote</span>
          </Link>
          <nav aria-label="Navigation principale" className="ml-2 hidden gap-1 sm:flex">
            <NavLink to="/" end className={navClass}>
              Candidats
            </NavLink>
            <NavLink to="/comparer" className={navClass}>
              Comparer
            </NavLink>
          </nav>
          <div className="ml-auto flex items-center gap-2">
            {!online && (
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-1 text-xs font-medium text-amber-900 dark:bg-amber-900/40 dark:text-amber-200">
                <WifiOff aria-hidden="true" className="size-3.5" /> Hors ligne
              </span>
            )}
            {installEvent && (
              <button type="button" className={iconButton} onClick={() => installEvent.prompt()} title="Installer l'application">
                <Download aria-hidden="true" className="size-5" />
                <span className="sr-only">Installer l'application</span>
              </button>
            )}
            <button
              type="button"
              className={`${iconButton} ${simpleReading ? '!border-sky-600 !bg-sky-50 !text-sky-800 dark:!bg-sky-950 dark:!text-sky-200' : ''}`}
              aria-pressed={simpleReading}
              onClick={toggleSimpleReading}
              title="Lecture simplifiée"
            >
              <BookOpenText aria-hidden="true" className="size-5" />
              <span className="sr-only">Lecture simplifiée</span>
            </button>
            <button
              type="button"
              className={iconButton}
              aria-pressed={dark}
              onClick={() => setTheme(dark ? 'light' : 'dark')}
              title={dark ? 'Passer en mode clair' : 'Passer en mode sombre'}
            >
              {dark ? <Sun aria-hidden="true" className="size-5" /> : <Moon aria-hidden="true" className="size-5" />}
              <span className="sr-only">Mode sombre</span>
            </button>
          </div>
        </div>
        <nav aria-label="Navigation principale (mobile)" className="flex gap-1 px-4 pb-2 sm:hidden">
          <NavLink to="/" end className={navClass}>
            Candidats
          </NavLink>
          <NavLink to="/comparer" className={navClass}>
            Comparer
          </NavLink>
        </nav>
      </header>

      <main id="contenu" className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:py-8">
        <Outlet />
      </main>

      <footer className="border-t border-slate-200 py-6 text-sm text-slate-600 dark:border-slate-800 dark:text-slate-400">
        <div className="mx-auto max-w-6xl space-y-1 px-4">
          <p>
            {meta.election} : liste provisoire des candidats, données mises à jour le {formatDate(meta.updatedAt)}. Les
            candidats sont affichés dans un ordre aléatoire pour ne favoriser personne.
          </p>
          <p>Chaque proposition renvoie vers sa source publique. Une position non vérifiée est signalée, jamais devinée. Les photos, sous licence libre, sont créditées sur chaque fiche.</p>
        </div>
      </footer>
    </div>
  )
}

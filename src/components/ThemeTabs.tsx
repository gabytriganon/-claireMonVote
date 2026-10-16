import { useRef, type KeyboardEvent } from 'react'
import { themes } from '../lib/data'
import { ThemeIcon } from './ThemeIcon'

interface Props {
  active: string
  onChange: (themeId: string) => void
  /** Préfixe d'identifiant pour relier onglets et panneau (aria-controls). */
  idPrefix: string
}

/** Onglets thématiques accessibles (motif ARIA tabs, navigation au clavier par flèches). */
export function ThemeTabs({ active, onChange, idPrefix }: Props) {
  const refs = useRef<(HTMLButtonElement | null)[]>([])

  function onKeyDown(event: KeyboardEvent, index: number) {
    let next = -1
    if (event.key === 'ArrowRight') next = (index + 1) % themes.length
    else if (event.key === 'ArrowLeft') next = (index - 1 + themes.length) % themes.length
    else if (event.key === 'Home') next = 0
    else if (event.key === 'End') next = themes.length - 1
    if (next >= 0) {
      event.preventDefault()
      onChange(themes[next].id)
      refs.current[next]?.focus()
    }
  }

  return (
    <div
      role="tablist"
      aria-label="Thématiques"
      className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:px-0"
    >
      {themes.map((theme, index) => {
        const selected = theme.id === active
        return (
          <button
            key={theme.id}
            ref={(el) => {
              refs.current[index] = el
            }}
            role="tab"
            type="button"
            id={`${idPrefix}-tab-${theme.id}`}
            aria-selected={selected}
            aria-controls={`${idPrefix}-panel`}
            tabIndex={selected ? 0 : -1}
            onClick={() => onChange(theme.id)}
            onKeyDown={(e) => onKeyDown(e, index)}
            className={`inline-flex shrink-0 items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-600 ${
              selected
                ? 'border-slate-900 bg-slate-900 text-white dark:border-white dark:bg-white dark:text-slate-900'
                : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800'
            }`}
          >
            <ThemeIcon name={theme.icon} className="size-4" />
            {theme.label}
          </button>
        )
      })}
    </div>
  )
}

import { useLayoutEffect } from 'react'
import { useLocation } from 'react-router-dom'

/** Replace la page en haut à chaque changement de page (les changements de thème ou de filtre ne comptent pas). */
export function ScrollToTop() {
  const { pathname } = useLocation()
  useLayoutEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' })
  }, [pathname])
  return null
}

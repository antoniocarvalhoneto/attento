import { useEffect, useState } from 'react'
import { DashboardLayout } from '../components/DashboardLayout'
import { DashboardHome } from './DashboardHome'
import { AvailabilityPage } from './AvailabilityPage'
import { MySchedulePage } from './MySchedulePage'
import { CatalogPage } from './CatalogPage'
import { FinancialPage } from './FinancialPage'
import { ConveniencesPage } from './ConveniencesPage'
import { SettingsPage } from './SettingsPage'
import type { User } from '../services/auth'
import { panel as api } from '../services/panel'
import type { Theme } from '../services/panel'
import { saveTheme } from '../services/navigation'

type Props = { user: User; theme: Theme; onThemeChange(theme: Theme): void; onSignOut(): void; error: string }

export function DashboardPage({ user, theme, onThemeChange, onSignOut, error }: Props) {
  const [themeError, setThemeError] = useState('')
  const [requested, setRequested] = useState(() => window.location.hash.slice(1) || 'dashboard')
  useEffect(() => {
    const handleHash = () => setRequested(window.location.hash.slice(1) || 'dashboard')
    window.addEventListener('hashchange', handleHash)
    return () => window.removeEventListener('hashchange', handleHash)
  }, [])

  const route = requested === 'reports' ? 'financial' : requested === 'insurance' ? 'conveniences' : requested
  const view = api.allowed(route, user.role) ? route : 'dashboard'
  useEffect(() => {
    if (window.location.hash !== `#${view}`) window.history.replaceState(null, '', `#${view}`)
    document.title = `${api.titles[view]} | Attento`
  }, [view, requested])

  function navigate(next: string) {
    if (window.location.hash !== `#${next}`) window.location.hash = next
    setRequested(next)
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' })
  }

  function toggleTheme() {
    try {
      const next = theme === 'dark' ? 'light' : 'dark'
      saveTheme(next)
      onThemeChange(next)
      setThemeError('')
    } catch {
      setThemeError('Não foi possível salvar o tema. Tente novamente.')
    }
  }

  return <DashboardLayout user={user} theme={theme} view={view} title={api.titles[view]} items={api.navigation[user.role] || []} onNavigate={navigate} onToggleTheme={toggleTheme} onSignOut={onSignOut}>
    {(error || themeError) && <p className="content" role="alert">{error || themeError}</p>}
    {view === 'dashboard' ? <DashboardHome key={`${user.id}:${user.role}`} api={api} />
      : view === 'availability' ? <AvailabilityPage user={user} />
      : view === 'myschedule' ? <MySchedulePage user={user} />
      : view === 'rooms' || view === 'professionals' ? <CatalogPage key={view} kind={view} />
      : view === 'financial' ? <FinancialPage />
      : view === 'conveniences' ? <ConveniencesPage />
      : <SettingsPage user={user} theme={theme} onThemeChange={onThemeChange} />}
  </DashboardLayout>
}

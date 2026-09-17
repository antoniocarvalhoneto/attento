import { useEffect, useState } from 'react'
import { DashboardLayout } from '../components/DashboardLayout'
import { LegacyModule } from '../components/LegacyModule'
import type { User } from '../services/auth'
import { loadPanel } from '../services/panel'
import type { PanelApi, Theme } from '../services/panel'
import { saveTheme } from '../services/navigation'

type Props = { user: User; theme: Theme; onThemeChange(theme: Theme): void; onSignOut(): void; error: string }

export function DashboardPage({ user, theme, onThemeChange, onSignOut, error }: Props) {
  const [api, setApi] = useState<PanelApi | null>(null)
  const [loadError, setLoadError] = useState('')
  const [themeError, setThemeError] = useState('')
  const [attempt, setAttempt] = useState(0)
  const [requested, setRequested] = useState(() => window.location.hash.slice(1) || 'dashboard')
  useEffect(() => {
    let active = true
    loadPanel().then(value => { if (active) { setApi(value); setLoadError('') } })
      .catch(() => { if (active) setLoadError('Não foi possível carregar o painel. Tente novamente.') })
    return () => { active = false }
  }, [attempt])
  useEffect(() => {
    const handleHash = () => setRequested(window.location.hash.slice(1) || 'dashboard')
    window.addEventListener('hashchange', handleHash)
    return () => window.removeEventListener('hashchange', handleHash)
  }, [])

  const view = api?.allowed(requested, user.role) ? requested : 'dashboard'
  useEffect(() => {
    if (!api) return
    if (window.location.hash !== `#${view}`) window.history.replaceState(null, '', `#${view}`)
    document.title = `${api.titles[view]} | Attento`
  }, [api, view, requested])

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

  if (!api) return <main className="content">
    <p role={loadError ? 'alert' : 'status'}>{loadError || 'Carregando painel…'}</p>
    {loadError && <button className="btn btn-primary" onClick={() => setAttempt(value => value + 1)}>Tentar novamente</button>}
    <button className="btn btn-secondary" onClick={onSignOut}>Sair</button>
    {error && <p role="alert">{error}</p>}
  </main>

  return <DashboardLayout user={user} theme={theme} view={view} title={api.titles[view]} items={api.navigation[user.role] || []} onNavigate={navigate} onToggleTheme={toggleTheme} onSignOut={onSignOut}>
    {(error || themeError) && <p className="content" role="alert">{error || themeError}</p>}
    <LegacyModule api={api} user={user} view={view} theme={theme} onThemeChange={onThemeChange} />
  </DashboardLayout>
}

import { useEffect, useState } from 'react'
import { LoginPage } from './pages/LoginPage'
import { DashboardPage } from './pages/DashboardPage'
import { createAuth } from './services/auth'
import { applySavedTheme } from './services/navigation'
import type { Theme } from './services/panel'

const auth = createAuth()

export default function App() {
  const [user, setUser] = useState(() => auth.restoreSession())
  const [theme, setTheme] = useState<Theme>('light')
  const [error, setError] = useState('')
  useEffect(() => {
    function restoreAccess() {
      setTheme(applySavedTheme())
      setUser(auth.restoreSession())
      setError('')
    }
    function handlePageShow(event: PageTransitionEvent) {
      if (event.persisted) restoreAccess()
    }
    function handleStorage(event: StorageEvent) {
      if (!event.key || ['app_session', 'app_users', 'app_settings'].includes(event.key)) restoreAccess()
    }
    restoreAccess()
    window.addEventListener('pageshow', handlePageShow)
    window.addEventListener('storage', handleStorage)
    return () => {
      window.removeEventListener('pageshow', handlePageShow)
      window.removeEventListener('storage', handleStorage)
    }
  }, [])

  function signIn(email: string, password: string) {
    const accepted = auth.signIn(email, password)
    if (accepted) setUser(auth.restoreSession())
    return accepted
  }

  function signOut() {
    try {
      auth.signOut()
      setUser(null)
      setError('')
    } catch {
      setError('Não foi possível sair. Verifique a permissão de armazenamento e tente novamente.')
    }
  }

  if (user) return <DashboardPage user={user} theme={theme} onThemeChange={setTheme} onSignOut={signOut} error={error} />

  return <LoginPage onSignIn={signIn} />
}

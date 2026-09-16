import { useEffect } from 'react'
import { LoginPage } from './pages/LoginPage'
import { createAuth } from './services/auth'
import { applySavedTheme, openDashboard } from './services/navigation'

const auth = createAuth()

export default function App() {
  useEffect(() => {
    function restoreAccess() {
      applySavedTheme()
      if (auth.restoreSession()) openDashboard()
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
    if (accepted) openDashboard()
    return accepted
  }

  return <LoginPage onSignIn={signIn} />
}

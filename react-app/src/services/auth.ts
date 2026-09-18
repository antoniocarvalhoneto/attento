export type User = { id: string; name: string; email: string; role: 'admin' | 'user' }
type StoredUser = User & { password: string }
type AuthStorage = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>
const browserStorage: AuthStorage = {
  getItem: key => window.localStorage.getItem(key),
  setItem: (key, value) => window.localStorage.setItem(key, value),
  removeItem: key => window.localStorage.removeItem(key),
}
export function createAuth(storage: AuthStorage = browserStorage) {
  function users(): StoredUser[] {
    const raw = storage.getItem('app_users')
    if (raw !== null) {
      const saved: StoredUser[] = JSON.parse(raw)
      if (!Array.isArray(saved)) throw new Error('Não foi possível ler os usuários.')
      return saved
    }
    const demo: StoredUser[] = [
      { id: 'admin_demo', name: 'Administrador', email: 'admin@demo.com', password: '123456', role: 'admin' },
      { id: 'user_demo', name: 'Usuário Demonstração', email: 'usuario@demo.com', password: '123456', role: 'user' },
    ]
    storage.setItem('app_users', JSON.stringify(demo))
    return demo
  }
  function restoreSession(): User | null {
    try {
      const session = JSON.parse(storage.getItem('app_session') || 'null') as { userId: string } | null
      const found = session && users().find(item => item.id === session.userId)
      return found && ['admin', 'user'].includes(found.role) ? { id: found.id, name: found.name, email: found.email, role: found.role } : null
    } catch { return null }
  }
  return {
    restoreSession,
    signOut() {
      storage.removeItem('app_session')
      if (storage.getItem('app_session') !== null) throw new Error('Não foi possível encerrar a sessão.')
    },
    signIn(email: string, password: string) {
      const found = users().find(item => item.email.toLowerCase() === email.trim().toLowerCase() && item.password === password && ['admin', 'user'].includes(item.role))
      if (!found) return false
      storage.setItem('app_session', JSON.stringify({ userId: found.id }))
      if (restoreSession()?.id !== found.id) throw new Error('A sessão não foi persistida.')
      return true
    },
  }
}
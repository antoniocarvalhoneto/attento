import '../../../auth.js'

export type User = { id: string; name: string; email: string; role: 'admin' | 'user' }
type AuthStorage = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>
type LegacyAuth = {
  signIn(email: string, password: string): User | null
  restoreSession(): User | null
  signOut(): void
}

declare global {
  interface Window {
    AttentoAuth: { create(options: { storage: AuthStorage }): LegacyAuth }
  }
}

const browserStorage: AuthStorage = {
  getItem: key => window.localStorage.getItem(key),
  setItem: (key, value) => window.localStorage.setItem(key, value),
  removeItem: key => window.localStorage.removeItem(key),
}

export function createAuth(storage: AuthStorage = browserStorage) {
  const auth = window.AttentoAuth.create({ storage })
  return {
    restoreSession: () => auth.restoreSession(),
    signOut() {
      auth.signOut()
      if (auth.restoreSession()) throw new Error('Não foi possível encerrar a sessão.')
    },
    signIn(email: string, password: string) {
      const user = auth.signIn(email, password)
      if (!user) return false
      if (auth.restoreSession()?.id !== user.id) throw new Error('A sessão não foi persistida.')
      return true
    },
  }
}

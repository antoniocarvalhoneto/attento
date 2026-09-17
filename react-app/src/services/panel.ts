import './auth'
import '../../../data-utils.js'
import '../../../contact.js'
import type { User } from './auth'
import type { DashboardSnapshot } from './dashboard'

export type Theme = 'light' | 'dark'
export type NavItem = { key: string; label: string; icon: string }
export type PanelController = {
  show(view: string): void
  setTheme(theme: Theme): void
  destroy(): void
}
export type PanelApi = {
  readDashboard(): DashboardSnapshot
  mount(root: HTMLElement, onThemeChange: (theme: Theme) => void): PanelController
  navigation: Record<User['role'], NavItem[]>
  titles: Record<string, string>
  allowed(view: string, role: User['role']): boolean
}

declare global {
  interface Window {
    AttentoReactHost?: boolean
    AttentoPanel: PanelApi
  }
}

let loading: Promise<PanelApi> | undefined

export function loadPanel() {
  if (!loading) {
    window.AttentoReactHost = true
    loading = import('../../../script.js')
      .then(() => window.AttentoPanel)
      .catch((error: unknown) => { loading = undefined; throw error })
  }
  return loading
}

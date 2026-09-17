import { useEffect, useRef } from 'react'
import type { ReactNode } from 'react'
import type { User } from '../services/auth'
import type { NavItem, Theme } from '../services/panel'
import logo from '../../../logo.png'

type Props = {
  user: User; theme: Theme; view: string; title: string; items: NavItem[]
  onNavigate(view: string): void; onToggleTheme(): void; onSignOut(): void
  children: ReactNode
}

export function DashboardLayout({ user, theme, view, title, items, onNavigate, onToggleTheme, onSignOut, children }: Props) {
  const nav = useRef<HTMLElement>(null)
  useEffect(() => {
    const element = nav.current
    const active = element?.querySelector('[aria-current="page"]')
    if (!element || !active) return
    const bounds = element.getBoundingClientRect()
    const itemBounds = active.getBoundingClientRect()
    if (itemBounds.left < bounds.left) element.scrollLeft += itemBounds.left - bounds.left
    else if (itemBounds.right > bounds.right) element.scrollLeft += itemBounds.right - bounds.right
  }, [view])

  return (
    <div className="app-shell">
      <div className="main-col">
        <header className="app-header">
          <div className="topbar">
            <div className="app-brand">
              <div className="app-logo"><img src={logo} alt="" className="logo-mark" /></div>
              <span className="app-brand-title">Attento</span>
            </div>
            <h1 className="topbar-title">{title}</h1>
            <div className="topbar-actions">
              <button className="icon-btn" onClick={onToggleTheme} aria-label="Alternar tema" aria-pressed={theme === 'dark'}>
                <i className={`fa-solid ${theme === 'dark' ? 'fa-sun' : 'fa-moon'}`} aria-hidden="true" />
              </button>
              <div className="topbar-user">
                <div className="avatar" aria-hidden="true">{user.name.charAt(0).toUpperCase()}</div>
                <div className="topbar-user-info">
                  <span className="topbar-user-name">{user.name}</span>
                  <span className="topbar-user-role">{user.role === 'admin' ? 'Administrador' : 'Usuário'}</span>
                </div>
              </div>
              <button className="header-logout" onClick={onSignOut}><i className="fa-solid fa-right-from-bracket" aria-hidden="true" /> Sair</button>
            </div>
          </div>
          <nav className="main-nav" ref={nav} aria-label="Navegação principal">
            {items.map(item => <button key={item.key} className={`nav-item${view === item.key ? ' active' : ''}`} aria-current={view === item.key ? 'page' : undefined} onClick={() => onNavigate(item.key)}>
              <i className={`fa-solid ${item.icon}`} aria-hidden="true" /><span>{item.label}</span>
            </button>)}
          </nav>
        </header>
        {children}
      </div>
    </div>
  )
}

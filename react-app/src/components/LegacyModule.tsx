import { Component, useEffect, useRef } from 'react'
import type { ReactNode } from 'react'
import type { PanelApi, PanelController, Theme } from '../services/panel'
import type { User } from '../services/auth'

type Props = { api: PanelApi; user: User; view: string; theme: Theme; onThemeChange(theme: Theme): void }

class ModuleBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false }

  static getDerivedStateFromError() { return { failed: true } }

  render() {
    if (this.state.failed) return <div className="content" role="alert">
      <p>Não foi possível carregar esta página. Verifique o armazenamento e tente novamente.</p>
      <button className="btn btn-primary" onClick={() => this.setState({ failed: false })}>Tentar novamente</button>
    </div>
    return this.props.children
  }
}

function MountedModule({ api, user, view, theme, onThemeChange }: Props) {
  const root = useRef<HTMLDivElement>(null)
  const controller = useRef<PanelController | null>(null)

  useEffect(() => {
    controller.current = api.mount(root.current!, onThemeChange)
    return () => { controller.current?.destroy(); controller.current = null }
  }, [api, user.id, user.role, onThemeChange])

  useEffect(() => {
    controller.current?.setTheme(theme)
    controller.current?.show(view)
  }, [api, view, theme, user.id, user.role, onThemeChange])

  return <div ref={root} />
}

export function LegacyModule(props: Props) {
  return <ModuleBoundary key={`${props.user.id}:${props.user.role}`}><MountedModule {...props} /></ModuleBoundary>
}

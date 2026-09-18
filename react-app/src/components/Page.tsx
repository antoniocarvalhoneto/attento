import { useCallback, useEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { readData, readSettings } from '../services/repository'
import type { Collections, Settings } from '../services/models'

export type PageData = Collections & { settings: Settings }

export function Page({ children }: { children(data: PageData, refresh: () => void): ReactNode }) {
  const read = () => { try { return { data: { ...readData(), settings: readSettings() }, error: '' } } catch { return { data: null, error: 'Não foi possível carregar esta página. Verifique o armazenamento e tente novamente.' } } }
  const [state, setState] = useState(read)
  const main = useRef<HTMLElement>(null)
  const refresh = useCallback(() => {
    try {
      const data = { ...readData(), settings: readSettings() }
      setState({ data, error: '' })
    } catch {
      setState(previous => ({ ...previous, error: 'Não foi possível atualizar esta página. Os dados exibidos podem estar desatualizados. Tente novamente.' }))
    }
  }, [])
  useEffect(() => {
    main.current?.focus({ preventScroll: true })
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' })
    window.addEventListener('storage', refresh)
    window.addEventListener('focus', refresh)
    const timer = window.setInterval(refresh, 60000)
    return () => { window.removeEventListener('storage', refresh); window.removeEventListener('focus', refresh); window.clearInterval(timer) }
  }, [refresh])
  return <main className="content" tabIndex={-1} ref={main}>
    {state.error && <div role="alert"><p>{state.error}</p><button className="btn btn-primary" onClick={refresh}>Tentar novamente</button></div>}
    {state.data && children(state.data, refresh)}
  </main>
}

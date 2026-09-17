import { useEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { readData } from '../services/repository'
import type { Collections } from '../services/models'

export function Page({ children }: { children(data: Collections, refresh: () => void): ReactNode }) {
  const read = () => { try { return { data: readData(), error: '' } } catch { return { data: null, error: 'Não foi possível carregar esta página. Verifique o armazenamento e tente novamente.' } } }
  const [state, setState] = useState(read)
  const main = useRef<HTMLElement>(null)
  const refresh = () => setState(read())
  useEffect(() => {
    main.current?.focus({ preventScroll: true })
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' })
    const update = () => setState(read())
    window.addEventListener('storage', update)
    window.addEventListener('focus', update)
    const timer = window.setInterval(update, 60000)
    return () => { window.removeEventListener('storage', update); window.removeEventListener('focus', update); window.clearInterval(timer) }
  }, [])
  return <main className="content" tabIndex={-1} ref={main}>{state.data ? children(state.data, refresh) : <div role="alert"><p>{state.error}</p><button className="btn btn-primary" onClick={refresh}>Tentar novamente</button></div>}</main>
}

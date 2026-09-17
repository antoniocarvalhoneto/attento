import { useEffect, useId, useRef } from 'react'
import type { ReactNode } from 'react'
import { createPortal } from 'react-dom'

export function Modal({ title, children, onClose }: { title: string; children: ReactNode; onClose(): void }) {
  const id = useId()
  const box = useRef<HTMLDivElement>(null)
  const close = useRef(onClose)
  useEffect(() => { close.current = onClose }, [onClose])
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null
    const overflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const root = document.getElementById('root')
    const inert = root?.inert
    if (root) root.inert = true
    const controls = () => Array.from(box.current?.querySelectorAll<HTMLElement>('input:not(:disabled),select:not(:disabled),textarea:not(:disabled),button:not(:disabled),a[href]') || [])
    ;(box.current?.querySelector<HTMLElement>('input,select,textarea') || controls()[0])?.focus()
    function key(event: KeyboardEvent) {
      if (event.key === 'Escape') close.current()
      if (event.key !== 'Tab') return
      const items = controls(), first = items[0], last = items.at(-1)
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus() }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus() }
    }
    document.addEventListener('keydown', key)
    return () => { document.removeEventListener('keydown', key); document.body.style.overflow = overflow; if (root) root.inert = inert || false; if (previous?.isConnected) previous.focus({ preventScroll: true }) }
  }, [])
  return createPortal(<div className="modal-overlay show" onClick={event => { if (event.target === event.currentTarget) onClose() }}><div ref={box} className="modal-box" role="dialog" aria-modal="true" aria-labelledby={id}>
    <div className="modal-head"><h2 id={id}>{title}</h2><button type="button" className="modal-close" aria-label="Fechar" onClick={onClose}>×</button></div>{children}
  </div></div>, document.body)
}

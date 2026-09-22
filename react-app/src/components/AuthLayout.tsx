import type { ReactNode } from 'react'
import logo from '../assets/Attento Logomarca.png'

export function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <main className="login-screen">
      <section className="login-panel" aria-labelledby="login-title">
        <div className="login-brand">
          <div className="login-brand-mark"><img src={logo} alt="Attento Saúde Integral" className="logo-mark" /></div>
        </div>
        <div className="login-card">{children}</div>
      </section>
    </main>
  )
}

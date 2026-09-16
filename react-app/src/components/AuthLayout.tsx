import type { ReactNode } from 'react'
import logo from '../../../logo.png'

export function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <main className="login-screen">
      <section className="login-panel" aria-labelledby="login-title">
        <div className="login-brand">
          <div className="login-brand-mark"><img src={logo} alt="" className="logo-mark" /></div>
          <h1>Attento</h1>
        </div>
        <div className="login-card">{children}</div>
      </section>
    </main>
  )
}

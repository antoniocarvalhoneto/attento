import type { ReactNode } from 'react'
import { BrandLogo } from './BrandLogo'

export function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <main className="login-screen">
      <section className="login-panel" aria-labelledby="login-title">
        <div className="login-brand">
          <div className="login-brand-mark"><BrandLogo /></div>
        </div>
        <div className="login-card">{children}</div>
      </section>
    </main>
  )
}

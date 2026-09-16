import { useRef, useState } from 'react'
import type { FormEvent } from 'react'
import { AuthLayout } from '../components/AuthLayout'

type LoginPageProps = { onSignIn(email: string, password: string): boolean | Promise<boolean> }

export function LoginPage({ onSignIn }: LoginPageProps) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [busy, setBusy] = useState(false)
  const [errors, setErrors] = useState({ email: '', password: '', general: '' })
  const submitting = useRef(false)
  const emailInput = useRef<HTMLInputElement>(null)
  const passwordInput = useRef<HTMLInputElement>(null)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (submitting.current) return
    const nextErrors = {
      email: email.trim() ? '' : 'Informe o e-mail.',
      password: password ? '' : 'Informe a senha.',
      general: '',
    }
    setErrors(nextErrors)
    if (nextErrors.email || nextErrors.password) {
      const input = nextErrors.email ? emailInput : passwordInput
      input.current?.focus()
      return
    }
    submitting.current = true
    setBusy(true)
    try {
      if (!await onSignIn(email.trim(), password)) {
        setErrors({ email: '', password: '', general: 'E-mail ou senha inválidos.' })
      }
    } catch {
      setErrors({ email: '', password: '', general: 'Não foi possível concluir o acesso. Verifique se o navegador permite salvar dados deste site.' })
    } finally {
      submitting.current = false
      setBusy(false)
    }
  }

  function fillDemo(role: 'admin' | 'user') {
    setEmail(role === 'admin' ? 'admin@demo.com' : 'usuario@demo.com')
    setPassword('123456')
    setErrors({ email: '', password: '', general: '' })
    emailInput.current?.focus()
  }

  return (
    <AuthLayout>
      <h2 id="login-title">Entrar</h2>
      <p className="login-card-sub">Use seu e-mail e senha para acessar sua unidade.</p>
      <form onSubmit={handleSubmit} noValidate aria-busy={busy}>
        <div className="field">
          <label htmlFor="login-email">E-mail</label>
          <input ref={emailInput} type="email" id="login-email" name="email" autoComplete="username" placeholder="seu@email.com" value={email} onChange={event => setEmail(event.target.value)} aria-invalid={!!errors.email} aria-describedby="login-email-error" disabled={busy} />
          <span className="field-error" id="login-email-error" aria-live="polite">{errors.email}</span>
        </div>
        <div className="field">
          <label htmlFor="login-password">Senha</label>
          <div className="password-wrap">
            <input ref={passwordInput} type={showPassword ? 'text' : 'password'} id="login-password" name="password" autoComplete="current-password" placeholder="••••••" value={password} onChange={event => setPassword(event.target.value)} aria-invalid={!!errors.password} aria-describedby="login-password-error" disabled={busy} />
            <button type="button" className="password-toggle" onClick={() => setShowPassword(value => !value)} aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'} aria-pressed={showPassword} disabled={busy}>
              <i className={`fa-solid ${showPassword ? 'fa-eye-slash' : 'fa-eye'}`} aria-hidden="true" />
            </button>
          </div>
          <span className="field-error" id="login-password-error" aria-live="polite">{errors.password}</span>
        </div>
        <span className="field-error" role="alert">{errors.general}</span>
        <button type="submit" className="btn btn-primary btn-block" disabled={busy}>
          {busy ? 'Entrando…' : 'Entrar'}
        </button>
      </form>
      <p className="login-help">Não consegue entrar? Peça ajuda ao responsável pela sua unidade.</p>
      <details className="login-demo">
        <summary>Experimentar com uma conta de demonstração</summary>
        <div className="login-demo-row">
          <button type="button" className="demo-chip" onClick={() => fillDemo('admin')} disabled={busy}>
            <strong>Administrador</strong><span>admin@demo.com · 123456</span>
          </button>
          <button type="button" className="demo-chip" onClick={() => fillDemo('user')} disabled={busy}>
            <strong>Usuário</strong><span>usuario@demo.com · 123456</span>
          </button>
        </div>
      </details>
    </AuthLayout>
  )
}

import logo from '../../logo.png'

export default function App() {
  return (
    <main className="login-screen">
      <section className="login-panel" aria-labelledby="access-title">
        <div className="login-brand">
          <div className="login-brand-mark"><img src={logo} alt="" className="logo-mark" /></div>
          <h1>Attento</h1>
        </div>
        <div className="login-card">
          <h2 id="access-title">Acesse sua unidade</h2>
          <a className="btn btn-primary btn-block" href="/legacy/login.html">Entrar</a>
        </div>
      </section>
    </main>
  )
}

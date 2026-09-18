import { useState } from 'react'
import type { User } from '../services/auth'
import type { Theme } from '../services/panel'
import { Page } from '../components/Page'
import { Field, PageHead } from '../components/Fields'
import { readSettings, requireUser } from '../services/repository'
import { KEYS, saveData } from '../services/storage'
import { saveTheme } from '../services/navigation'
import { normalizeWhatsApp } from '../services/contact'

type Props = { user: User; theme: Theme; onThemeChange(theme: Theme): void }
export function SettingsPage(props: Props) { return <Page>{(data, refresh) => <Settings {...props} savedWhatsapp={data.settings.whatsapp || ''} onSaved={refresh} />}</Page> }
function Settings({ user, theme, onThemeChange, savedWhatsapp, onSaved }: Props & { savedWhatsapp: string; onSaved(): void }) {
  const [draft, setWhatsapp] = useState<string | null>(null), [error, setError] = useState(''), [message, setMessage] = useState('')
  const whatsapp = draft ?? savedWhatsapp
  function changeTheme(next: Theme) { try { saveTheme(next); onThemeChange(next); setError('') } catch { setError('Não foi possível salvar o tema. Tente novamente.') } }
  function saveContact() {
    setMessage('')
    try {
      requireUser()
      const normalized = normalizeWhatsApp(whatsapp)
      if (whatsapp.trim() && !normalized) throw new Error('Informe um WhatsApp válido com DDD.')
      saveData(KEYS.settings, { ...readSettings(), whatsapp: normalized })
      setWhatsapp(null); setError(''); setMessage(normalized ? 'Contato salvo.' : 'Contato removido.'); onSaved()
    } catch (failure) { setError((failure as Error).message) }
  }
  return <><PageHead title="Configurações" description="Ajuste o tema e o WhatsApp usado nas confirmações de reserva." />{error && <p role="alert">{error}</p>}{message && <p role="status">{message}</p>}<div className="section two-col"><div className="card"><h2>Aparência</h2><p className="mt-8">Escolha entre o tema claro ou escuro. Sua preferência é salva neste navegador.</p><div className="gap-8 mt-16">{(['light', 'dark'] as const).map(value => <button key={value} className={`btn ${theme === value ? 'btn-primary' : 'btn-secondary'}`} aria-pressed={theme === value} onClick={() => changeTheme(value)}>{value === 'light' ? 'Claro' : 'Escuro'}</button>)}</div></div><div className="card"><h2>Conta</h2><div className="info-row"><span>Nome</span><span>{user.name}</span></div><div className="info-row"><span>E-mail</span><span>{user.email}</span></div><div className="info-row"><span>Perfil</span><span>{user.role === 'admin' ? 'Administrador' : 'Usuário'}</span></div><p className="mt-16">Este é um ambiente de demonstração. A autenticação é simulada no navegador.</p></div><div className="card"><h2>Contato da unidade</h2><p className="mt-8">Informe o WhatsApp que receberá pedidos de ajuda e confirmação de horários.</p><form className="mt-16" onSubmit={event => { event.preventDefault(); saveContact() }}><Field label="WhatsApp com DDD" type="tel" autoComplete="tel" value={whatsapp} onChange={event => setWhatsapp(event.target.value)} placeholder="+55 11 99999-9999" /><button className="btn btn-primary">Salvar contato</button></form></div></div></>
}

import { useEffect, useRef, useState } from 'react'
import type { PanelApi } from '../services/panel'
import { buildDashboard } from '../services/dashboard'
import type { DashboardModel } from '../services/dashboard'
import { StatCard } from '../components/dashboard/StatCard'
import { ReservationTable } from '../components/dashboard/ReservationTable'
import { ReservationChart } from '../components/dashboard/ReservationChart'
import { FinanceSummary } from '../components/dashboard/FinanceSummary'

export function DashboardHome({ api }: { api: PanelApi }) {
  const [model, setModel] = useState<DashboardModel | null>(null)
  const [error, setError] = useState('')
  const [attempt, setAttempt] = useState(0)
  const main = useRef<HTMLElement>(null)
  const focused = useRef(false)
  useEffect(() => {
    let active = true
    function refresh() {
      Promise.resolve().then(() => {
        if (!active) return
        const next = buildDashboard(api.readDashboard())
        setModel(next)
        setError('')
      }).catch(() => {
        if (active) setError('Não foi possível carregar esta página. Verifique o armazenamento e tente novamente.')
      })
    }
    refresh()
    window.addEventListener('storage', refresh)
    window.addEventListener('focus', refresh)
    const timer = window.setInterval(refresh, 60000)
    return () => {
      active = false
      window.removeEventListener('storage', refresh)
      window.removeEventListener('focus', refresh)
      window.clearInterval(timer)
    }
  }, [api, attempt])
  useEffect(() => {
    if (!model || error || focused.current) return
    main.current?.focus({ preventScroll: true })
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' })
    focused.current = true
  }, [model, error])

  return <main className="content dashboard-home" ref={main} tabIndex={-1}>
    {error ? <div role="alert"><p>{error}</p><button className="btn btn-primary" onClick={() => setAttempt(value => value + 1)}>Tentar novamente</button></div>
      : model ? <DashboardContent model={model} /> : <p role="status">Carregando dashboard…</p>}
  </main>
}

function DashboardContent({ model }: { model: DashboardModel }) {
  if (model.role === 'user') {
    return <>
      <div className="page-head"><div className="page-head-text"><p className="page-context">{model.dateLabel}</p><h1>Minha agenda</h1>
        <p>{model.remainingToday ? `${model.remainingToday} ${model.remainingToday === 1 ? 'horário reservado' : 'horários reservados'} ainda hoje.` : 'Você não tem mais reservas para hoje.'}</p>
      </div><a className="btn btn-primary" href="#availability">Reservar horário</a></div>
      <section className="section reservation-priority"><div className="section-head"><h2>Meus próximos horários</h2><a href="#myschedule">Ver minha agenda</a></div><ReservationTable rows={model.reservations} /></section>
      <div className="section"><div className="stat-grid">
        <StatCard label="Reservas restantes nesta semana" value={model.weekReservations} />
        <StatCard label="Salas disponíveis" value={model.availableRooms} />
      </div></div>
      <aside className="contact-note"><h2>Precisa ajustar uma reserva?</h2>{model.helpUrl ? <a href={model.helpUrl} target="_blank" rel="noopener noreferrer">Fale com a unidade pelo WhatsApp</a> : <p>O WhatsApp da unidade ainda não foi informado.</p>}</aside>
    </>
  }
  const preview = model.reservations.slice(0, 6)
  const { pending } = model.finance
  return <>
    <div className="page-head"><div className="page-head-text"><p className="page-context">{model.dateLabel} · Todas as unidades</p><h1>Agenda da unidade</h1>
      <p>{model.remainingToday ? `${model.remainingToday} ${model.remainingToday === 1 ? 'reserva prevista' : 'reservas previstas'} para o restante do dia.` : 'Nenhuma reserva prevista para o restante do dia.'}</p>
    </div><a className="btn btn-primary" href="#availability">Alocar horário</a></div>
    <section className="section reservation-priority"><div className="section-head"><div><h2>Agenda de reservas</h2><p>Próximas reservas · Exibindo {preview.length} de {model.reservations.length} {model.reservations.length === 1 ? 'reserva' : 'reservas'}</p></div><a href="#availability">Abrir agenda completa</a></div><ReservationTable rows={preview} admin /></section>
    <div className="section"><div className="stat-grid">
      <StatCard label="Salas disponíveis" value={model.availableRooms} />
      <StatCard label="Profissionais ativos" value={model.activeProfessionals} />
      <StatCard label="Horários agendados" value={model.reservations.length} />
      <StatCard label="Contas pendentes" value={pending} warning={pending > 0} />
    </div></div>
    <div className="section two-col"><ReservationChart model={model} /><FinanceSummary finance={model.finance} /></div>
  </>
}

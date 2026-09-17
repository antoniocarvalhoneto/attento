import { useEffect, useRef, useState } from 'react'
import type { PanelApi } from '../services/panel'
import { buildDashboard, WEEK_DAYS } from '../services/dashboard'
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

  return <main className="content" ref={main} tabIndex={-1}>
    {error ? <div role="alert"><p>{error}</p><button className="btn btn-primary" onClick={() => setAttempt(value => value + 1)}>Tentar novamente</button></div>
      : model ? <DashboardContent model={model} /> : <p role="status">Carregando dashboard…</p>}
  </main>
}

function DashboardContent({ model }: { model: DashboardModel }) {
  if (model.role === 'user') {
    const next = model.reservations[0]
    return <>
      <div className="page-head"><div className="page-head-text"><h1>Olá, {model.name}</h1><p>{model.dateLabel}</p>
        <p>{model.weekReservations ? `Você tem ${model.weekReservations} ${model.weekReservations === 1 ? 'reserva' : 'reservas'} nesta semana.` : 'Você ainda não tem reservas nesta semana.'}</p>
      </div></div>
      <div className="section"><div className="stat-grid">
        <StatCard icon="fa-clock" label="Próximo horário" value={next ? `${next.date} ${next.time}` : 'Nenhum'} />
        <StatCard icon="fa-calendar-days" label="Reservas nesta semana" value={model.weekReservations} />
        <StatCard icon="fa-door-open" label="Salas disponíveis" value={model.availableRooms} />
        {model.helpUrl ? <a className="stat-card stat-card-link" href={model.helpUrl} target="_blank" rel="noopener"><div className="stat-icon neutral"><i className="fa-brands fa-whatsapp" aria-hidden="true" /></div><div className="stat-info"><span className="stat-value stat-value-action">Fale conosco</span><span className="stat-label">Atendimento pelo WhatsApp</span></div></a>
          : <StatCard icon="fa-comments" label="Contato da unidade" value="Não configurado" />}
      </div></div>
      <div className="section"><div className="section-head"><h2>Meus próximos horários</h2></div><ReservationTable rows={model.reservations} /></div>
    </>
  }
  const preview = model.reservations.slice(0, 6)
  const { pending, overdue } = model.finance
  return <>
    <div className="page-head"><div className="page-head-text"><h1>Olá, {model.name}</h1><p>{model.dateLabel} · Todas as unidades</p>
      <p>{!pending && !overdue ? 'Nenhuma conta pendente ou vencida.' : `${pending} ${pending === 1 ? 'conta pendente' : 'contas pendentes'} · ${overdue} ${overdue === 1 ? 'conta vencida' : 'contas vencidas'}`}</p>
    </div><a href="#financial">Ver financeiro</a></div>
    <div className="section"><div className="stat-grid">
      <StatCard icon="fa-door-open" label="Salas disponíveis" value={model.availableRooms} />
      <StatCard icon="fa-users" label="Profissionais ativos" value={model.activeProfessionals} />
      <StatCard icon="fa-calendar-check" label="Horários agendados" value={model.reservations.length} />
      <StatCard icon="fa-hourglass-half" label="Contas pendentes" value={pending} warning={pending > 0} />
    </div></div>
    <div className="section"><div className="section-head"><div><h2>Agenda de reservas</h2><p>Próximas reservas · Exibindo {preview.length} de {model.reservations.length} {model.reservations.length === 1 ? 'reserva' : 'reservas'}</p></div><a href="#availability">Abrir agenda completa</a></div><ReservationTable rows={preview} admin /></div>
    <div className="section"><div className="section-head"><h2>Reservas nesta semana</h2></div><div className="week-strip">{model.weekCounts.map((count, index) => <div className="week-day" key={WEEK_DAYS[index]}><div className="wd-label">{WEEK_DAYS[index]}</div><div className="wd-count">{count}</div><div className="wd-sub">{count === 1 ? 'reserva' : 'reservas'}</div></div>)}</div></div>
    <div className="section two-col"><ReservationChart model={model} /><FinanceSummary finance={model.finance} /></div>
  </>
}

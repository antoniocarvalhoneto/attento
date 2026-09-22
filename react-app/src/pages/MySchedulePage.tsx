import type { User } from '../services/auth'
import { Page } from '../components/Page'
import { DataTable, PageHead } from '../components/Fields'
import { endOfHour, upcomingSchedules } from '../services/dates'
import { displayDate } from '../services/dashboard'
import { money, nameOf } from '../services/models'
import { whatsappUrl } from '../services/contact'

export function MySchedulePage({ user }: { user: User }) {
  return <Page>{data => <><PageHead title="Meus Horários" description="Consulte suas próximas reservas e confirme os detalhes com a unidade."><a className="btn btn-primary" href="#availability">Reservar horário</a></PageHead><DataTable headers={['Dia', 'Horário', 'Sala', 'Unidade', 'Profissional', 'Valor', 'Contato']} empty={'Você não tem reservas futuras. Use “Reservar horário” para escolher uma sala e um horário.'} rows={upcomingSchedules(data.schedules.filter(item => item.userId === user.id)).map(item => {
    const interval = `${item.time}–${item.endTime || endOfHour(item.time)}`
    const link = whatsappUrl(data.settings.whatsapp || '', `Olá! Gostaria de confirmar o horário de ${displayDate(item.date)} das ${interval} na ${nameOf(data.rooms, item.roomId)}.`)
    return { id: item.id, cells: [displayDate(item.date), interval, nameOf(data.rooms, item.roomId), nameOf(data.units, item.unitId), nameOf(data.professionals, item.professionalId), item.value ? money(item.value) : 'A combinar', link ? <a key="contact" href={link} target="_blank" rel="noopener noreferrer">WhatsApp</a> : 'Não configurado'] }
  })} /></>}</Page>
}

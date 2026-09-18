import type { DashboardModel } from '../../services/dashboard'

export function ReservationTable({ rows, admin = false }: { rows: DashboardModel['reservations']; admin?: boolean }) {
  if (!rows.length) return <div className="table-wrap" role="region" aria-label="Próximas reservas" tabIndex={0}><div className="empty-state">
    <p>{admin ? 'Nenhuma reserva futura. Escolha uma sala e um horário para alocar um profissional.' : 'Você não tem reservas futuras. Escolha uma sala e um horário para começar.'}</p>
    <a href="#availability">Ver horários disponíveis</a>
  </div></div>
  return <div className="table-wrap" role="region" aria-label="Próximas reservas" tabIndex={0}><table>
    <thead><tr>{['Data', 'Horário', 'Sala', 'Unidade', 'Profissional', ...(admin ? ['Status'] : [])].map(title => <th key={title} scope="col">{title}</th>)}</tr></thead>
    <tbody>{rows.map(row => <tr key={row.id}>
      <td>{row.date}</td><td>{row.time}</td><td>{row.room}</td><td>{row.unit}</td><td>{row.professional}</td>
      {admin && <td><span className="badge badge-green">Reservado</span></td>}
    </tr>)}</tbody>
  </table></div>
}

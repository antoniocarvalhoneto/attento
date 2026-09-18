import type { DashboardModel } from '../../services/dashboard'

export function ReservationTable({ rows, admin = false }: { rows: DashboardModel['reservations']; admin?: boolean }) {
  if (!rows.length) return <div className="table-wrap" role="region" aria-label="Próximas reservas" tabIndex={0}><div className="empty-state">
    <i className="fa-solid fa-calendar-xmark" aria-hidden="true" />
    <p>{admin ? 'Nenhuma reserva cadastrada. Abra a agenda para reservar um horário.' : 'Você ainda não tem horários reservados.'}</p>
  </div></div>
  return <div className="table-wrap" role="region" aria-label="Próximas reservas" tabIndex={0}><table>
    <thead><tr>{['Data', 'Horário', 'Sala', 'Unidade', 'Profissional', ...(admin ? ['Status'] : [])].map(title => <th key={title} scope="col">{title}</th>)}</tr></thead>
    <tbody>{rows.map(row => <tr key={row.id}>
      <td>{row.date}</td><td>{row.time}</td><td>{row.room}</td><td>{row.unit}</td><td>{row.professional}</td>
      {admin && <td><span className="badge badge-green">Reservado</span></td>}
    </tr>)}</tbody>
  </table></div>
}

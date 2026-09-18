import { useId } from 'react'
import type { InputHTMLAttributes, ReactNode } from 'react'

export function Field({ label, ...props }: InputHTMLAttributes<HTMLInputElement> & { label: string }) {
  const id = useId()
  return <div className="field"><label htmlFor={id}>{label}</label><input id={id} {...props} /></div>
}
export function Select({ label, value, onChange, children, id: provided, required = false }: { label: string; value: string; onChange(value: string): void; children: ReactNode; id?: string; required?: boolean }) {
  const generated = useId(), id = provided || generated
  return <div className="field"><label htmlFor={id}>{label}</label><select id={id} value={value} onChange={event => onChange(event.target.value)} required={required}>{children}</select></div>
}
export function Options({ items }: { items: { id: string; name: string }[] }) { return items.map(item => <option key={item.id} value={item.id}>{item.name}</option>) }
export function FormActions({ onClose, label = 'Salvar' }: { onClose(): void; label?: string }) { return <div className="modal-foot"><button type="button" className="btn btn-secondary" onClick={onClose}>Cancelar</button><button className="btn btn-primary" type="submit">{label}</button></div> }
export function Status({ value }: { value: string }) {
  const labels: Record<string, string> = { disponivel: 'Disponível', manutencao: 'Manutenção', inativa: 'Inativa', ativo: 'Ativo', inativo: 'Inativo', pago: 'Pago', pendente: 'Pendente', vencido: 'Vencido', reservado: 'Reservado' }
  return <span className={`badge badge-${['pago', 'ativo', 'reservado'].includes(value) ? 'green' : ['pendente', 'manutencao'].includes(value) ? 'amber' : value === 'vencido' ? 'red' : value === 'disponivel' ? 'blue' : 'gray'}`}>{labels[value] || value}</span>
}
export function DataTable({ headers, rows, empty = 'Nenhum registro encontrado.' }: { headers: string[]; rows: { id: string; cells: ReactNode[] }[]; empty?: string }) {
  return <div className="table-wrap" role="region" aria-label="Tabela de registros" tabIndex={0}>{rows.length ? <table><thead><tr>{headers.map(label => <th scope="col" key={label}>{label}</th>)}</tr></thead><tbody>{rows.map(row => <tr key={row.id}>{row.cells.map((cell, index) => <td key={headers[index]}>{cell}</td>)}</tr>)}</tbody></table> : <div className="empty-state"><p>{empty}</p></div>}</div>
}
export function PageHead({ title, description, children }: { title: string; description: string; children?: ReactNode }) { return <div className="page-head"><div className="page-head-text"><h1>{title}</h1><p>{description}</p></div>{children}</div> }

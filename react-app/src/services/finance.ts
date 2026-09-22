import type { Account } from './models'
export type AccountFilters = { professional: string; status: string; month: string; kind?: string; unit?: string }
export const emptyFilters: AccountFilters = { professional: 'all', status: 'all', month: 'all', kind: 'all', unit: 'all' }
export function accountKind(account: Account) { return account.kind || 'receivable' }
export function accountTotals(accounts: Account[]) {
  const total = (kind: string, paid: boolean) => accounts.filter(item => accountKind(item) === kind && (item.status === 'pago') === paid).reduce((sum, item) => sum + item.value, 0)
  const received = total('receivable', true), paid = total('payable', true)
  return { received, paid, balance: received - paid, toReceive: total('receivable', false), toPay: total('payable', false) }
}
export function filterAccounts(accounts: Account[], filters: AccountFilters) {
  return accounts.filter(item => (!filters.kind || filters.kind === 'all' || accountKind(item) === filters.kind) && (!filters.unit || filters.unit === 'all' || item.unitId === filters.unit) && (filters.professional === 'all' || item.professionalId === filters.professional) && (filters.status === 'all' || item.status === filters.status) && (filters.month === 'all' || item.dueDate.slice(0, 7) === filters.month))
}
export function monthOptions(accounts: Account[]) {
  return [...new Set(accounts.map(item => item.dueDate.slice(0, 7)).filter(Boolean))].sort().reverse().map(value => ({ value, label: new Date(value + '-01T00:00:00').toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' }) }))
}
export function buildCSV(rows: (string | number)[][]) {
  return '\uFEFF' + rows.map(row => row.map(value => {
    let text = String(value)
    if (typeof value === 'string' && /^[=+@\-\t\r]/.test(text)) text = "'" + text
    return /[";\r\n]/.test(text) ? '"' + text.replace(/"/g, '""') + '"' : text
  }).join(';')).join('\r\n')
}
export function downloadCSV(rows: (string | number)[][]) {
  const url = URL.createObjectURL(new Blob([buildCSV(rows)], { type: 'text/csv;charset=utf-8;' }))
  const link = document.createElement('a')
  link.href = url; link.download = 'relatorio-financeiro.csv'
  document.body.appendChild(link)
  try { link.click() } finally { link.remove(); URL.revokeObjectURL(url) }
}

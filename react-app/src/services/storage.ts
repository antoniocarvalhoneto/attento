export const KEYS = { units: 'app_units', rooms: 'app_rooms', professionals: 'app_professionals', schedules: 'app_schedules', financial: 'app_financial_accounts', insurance: 'app_insurance', settings: 'app_settings' }
export function loadData<T>(key: string): T | null {
  const raw = localStorage.getItem(key)
  return raw === null ? null : JSON.parse(raw) as T
}
export function saveData(key: string, value: unknown) {
  try { localStorage.setItem(key, JSON.stringify(value)) }
  catch { throw new Error('Não foi possível salvar. Verifique o espaço e a permissão de armazenamento do navegador e tente novamente.') }
}
export const uid = (prefix = 'id') => `${prefix}_${crypto.randomUUID()}`

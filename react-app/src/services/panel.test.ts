import { expect, test } from 'vitest'
import { createAuth } from './auth'
import { panel } from './panel'

test('permissões cobrem as rotas sem montar HTML nem depender de globais', () => {
  expect(panel.allowed('rooms', 'user')).toBe(false)
  expect(panel.allowed('rooms', 'admin')).toBe(true)
  expect(panel.allowed('myschedule', 'user')).toBe(true)
  expect(panel.allowed('unknown', 'admin')).toBe(false)
  expect(window).not.toHaveProperty('AttentoPanel')
})
test('sem sessão não inicializa dados', () => {
  expect(() => panel.readDashboard()).toThrow('Acesso não permitido')
  expect(localStorage.getItem('app_rooms')).toBeNull()
})
test('snapshot do usuário não expõe contas, senha ou reservas de terceiros', () => {
  createAuth().signIn('usuario@demo.com', '123456')
  const snapshot = panel.readDashboard()
  expect(snapshot.user).not.toHaveProperty('password')
  expect(snapshot.accounts).toEqual([])
  expect(snapshot.schedules.every(item => item.userId === 'user_demo')).toBe(true)
  snapshot.rooms[0].name = 'Alterado fora do estado'
  expect(panel.readDashboard().rooms[0].name).not.toBe('Alterado fora do estado')
})
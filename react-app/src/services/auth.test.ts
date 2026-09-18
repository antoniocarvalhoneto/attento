import { expect, test, vi } from 'vitest'
import { createAuth } from './auth'

test('normaliza email e armazena somente identidade da sessão nos dois perfis', () => {
  const auth = createAuth()
  for (const email of ['admin@demo.com', 'usuario@demo.com']) {
    expect(auth.signIn(` ${email.toUpperCase()} `, '123456')).toBe(true)
    expect(Object.keys(JSON.parse(localStorage.getItem('app_session')!))).toEqual(['userId'])
    expect(auth.restoreSession()).not.toHaveProperty('password')
  }
})
test('credenciais inválidas e usuário removido não autenticam', () => {
  const auth = createAuth()
  expect(auth.signIn('admin@demo.com', 'errada')).toBe(false)
  expect(auth.signIn('unknown@example.com', '123456')).toBe(false)
  expect(auth.restoreSession()).toBeNull()
  auth.signIn('admin@demo.com', '123456')
  localStorage.setItem('app_users', '[]')
  expect(auth.restoreSession()).toBeNull()
})
test('nova instância restaura formato anterior e logout preserva cadastros', () => {
  createAuth().signIn('admin@demo.com', '123456')
  localStorage.setItem('app_rooms', '[]')
  const auth = createAuth()
  expect(auth.restoreSession()?.id).toBe('admin_demo')
  auth.signOut()
  expect(auth.restoreSession()).toBeNull()
  expect(localStorage.getItem('app_rooms')).toBe('[]')
})
test('falha de gravação e leitura não concede sessão, dados corrompidos não são sobrescritos', () => {
  const auth = createAuth()
  localStorage.setItem('app_users', '{')
  expect(() => auth.signIn('admin@demo.com', '123456')).toThrow()
  expect(localStorage.getItem('app_users')).toBe('{')
  localStorage.removeItem('app_users')
  const write = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('quota') })
  expect(() => auth.signIn('admin@demo.com', '123456')).toThrow()
  expect(auth.restoreSession()).toBeNull()
  write.mockRestore()
  auth.signIn('admin@demo.com', '123456')
  vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => { throw new Error('blocked') })
  expect(auth.restoreSession()).toBeNull()
})

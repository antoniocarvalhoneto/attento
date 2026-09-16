import { expect, test, vi } from 'vitest'
import { createAuth } from './auth'
import { loadPanel } from './panel'

test('monta módulos sem cabeçalho duplicado, aplica permissões e limpa eventos ao sair', async () => {
  createAuth().signIn('usuario@demo.com', '123456')
  const api = await loadPanel()
  const root = document.createElement('div')
  document.body.append(root)
  vi.spyOn(window, 'scrollTo').mockImplementation(() => {})
  const controller = api.mount(root, vi.fn())
  controller.show('rooms')
  expect(root.querySelector('.page-head h1')).toHaveTextContent('Olá')
  expect(root.querySelector('.app-header')).toBeNull()
  controller.show('settings')
  expect(root.querySelector('#contact-settings')).not.toBeNull()
  controller.destroy()
  expect(root).toBeEmptyDOMElement()
  expect(() => api.mount(root, vi.fn()).destroy()).not.toThrow()
  root.remove()
})

test('sem sessão, não monta módulos nem inicializa dados', async () => {
  const api = await loadPanel()
  expect(() => api.mount(document.createElement('div'), vi.fn())).toThrow('Sessão inválida')
  expect(localStorage.getItem('app_rooms')).toBeNull()
})

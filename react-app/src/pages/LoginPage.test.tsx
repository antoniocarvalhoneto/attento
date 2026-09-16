import { act, fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { expect, test, vi } from 'vitest'
import { LoginPage } from './LoginPage'

test('campos vazios exibem erros, recebem foco e não autenticam', async () => {
  const signIn = vi.fn()
  render(<LoginPage onSignIn={signIn} />)
  await userEvent.click(screen.getByRole('button', { name: 'Entrar' }))
  expect(screen.getByLabelText('E-mail')).toHaveFocus()
  expect(screen.getByLabelText('Senha')).toHaveAttribute('aria-invalid', 'true')
  expect(screen.getByText('Informe o e-mail.')).toBeVisible()
  expect(screen.getByText('Informe a senha.')).toBeVisible()
  expect(signIn).not.toHaveBeenCalled()
})

test('conta demo preenche os campos sem enviar; senha pode ser revelada', async () => {
  const signIn = vi.fn(() => false)
  render(<LoginPage onSignIn={signIn} />)
  await userEvent.click(screen.getByText('Experimentar com uma conta de demonstração'))
  await userEvent.click(screen.getByRole('button', { name: /Usuário/ }))
  expect(screen.getByLabelText('E-mail')).toHaveValue('usuario@demo.com')
  expect(screen.getByLabelText('Senha')).toHaveValue('123456')
  expect(signIn).not.toHaveBeenCalled()
  await userEvent.click(screen.getByRole('button', { name: 'Mostrar senha' }))
  expect(screen.getByLabelText('Senha')).toHaveAttribute('type', 'text')
  await userEvent.click(screen.getByRole('button', { name: 'Ocultar senha' }))
  expect(screen.getByLabelText('Senha')).toHaveAttribute('type', 'password')
  await userEvent.click(screen.getByRole('button', { name: 'Entrar' }))
  expect(signIn).toHaveBeenCalledWith('usuario@demo.com', '123456')
  expect(screen.getByRole('alert')).toHaveTextContent('E-mail ou senha inválidos.')
})

test('bloqueia envios duplicados e libera o formulário após falha assíncrona', async () => {
  let reject!: (error: Error) => void
  const signIn = vi.fn(() => new Promise<boolean>((_, rejectPromise) => { reject = rejectPromise }))
  render(<LoginPage onSignIn={signIn} />)
  await userEvent.type(screen.getByLabelText('E-mail'), 'admin@demo.com')
  await userEvent.type(screen.getByLabelText('Senha'), '123456')
  const button = screen.getByRole('button', { name: 'Entrar' })
  fireEvent.submit(button.closest('form')!)
  fireEvent.submit(button.closest('form')!)
  expect(signIn).toHaveBeenCalledTimes(1)
  expect(button).toBeDisabled()
  await act(async () => reject(new Error('Falha de armazenamento')))
  expect(button).toBeEnabled()
  expect(screen.getByLabelText('E-mail')).toHaveValue('admin@demo.com')
  expect(screen.getByRole('alert')).toHaveTextContent('Não foi possível concluir o acesso.')
})

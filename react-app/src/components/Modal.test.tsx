import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { expect, test, vi } from 'vitest'
import { Modal } from './Modal'

test('modal contém foco, atende Escape e restaura o botão e a rolagem ao desmontar', async () => {
  const trigger = document.createElement('button')
  document.body.appendChild(trigger); trigger.focus()
  const close = vi.fn()
  const view = render(<Modal title="Teste" onClose={close}><div className="modal-body"><input aria-label="Nome" /><button>Último</button></div></Modal>)
  expect(screen.getByLabelText('Nome')).toHaveFocus()
  screen.getByRole('button', { name: 'Último' }).focus()
  await userEvent.tab()
  expect(screen.getByRole('button', { name: 'Fechar' })).toHaveFocus()
  await userEvent.tab({ shift: true })
  expect(screen.getByRole('button', { name: 'Último' })).toHaveFocus()
  await userEvent.keyboard('{Escape}')
  expect(close).toHaveBeenCalledOnce()
  view.unmount()
  expect(trigger).toHaveFocus()
  expect(document.body.style.overflow).toBe('')
  trigger.remove()
})

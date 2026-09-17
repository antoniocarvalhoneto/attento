import { useState } from 'react'
import { Modal } from './Modal'
import { FormActions } from './Fields'

export function RecordActions({ onView, onEdit, onDelete, onPay }: { onView?(): void; onEdit(): void; onDelete(): void; onPay?(): void }) {
  return <div className="row-actions">{onView && <button className="icon-btn btn-sm" aria-label="Visualizar" onClick={onView}><i className="fa-solid fa-eye" aria-hidden="true" /></button>}{onPay && <button className="icon-btn btn-sm" aria-label="Marcar como pago" onClick={onPay}><i className="fa-solid fa-check" aria-hidden="true" /></button>}<button className="icon-btn btn-sm" aria-label="Editar" onClick={onEdit}><i className="fa-solid fa-pen" aria-hidden="true" /></button><button className="icon-btn btn-sm" aria-label="Excluir" onClick={onDelete}><i className="fa-solid fa-trash" aria-hidden="true" /></button></div>
}
export function DeleteDialog({ onClose, onConfirm }: { onClose(): void; onConfirm(): void }) {
  const [error, setError] = useState('')
  return <Modal title="Confirmar exclusão" onClose={onClose}><form onSubmit={event => { event.preventDefault(); try { onConfirm() } catch (failure) { setError((failure as Error).message) } }}><div className="modal-body"><p>Deseja excluir este registro? Esta ação não pode ser desfeita.</p>{error && <p role="alert">{error}</p>}</div><FormActions onClose={onClose} label="Excluir" /></form></Modal>
}

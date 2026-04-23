'use client';

interface LogoutModalProps {
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function LogoutModal({ isOpen, onConfirm, onCancel }: LogoutModalProps) {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-container">
        <div className="modal-header" style={{ textAlign: 'center' }}>
          <h3 className="courses-title" style={{ fontSize: '1.25rem', marginBottom: 0 }}>Подтверждение выхода</h3>
        </div>
        <div className="modal-body" style={{ textAlign: 'center' }}>
          <p className="modal-message">Вы действительно хотите выйти из аккаунта?</p>
        </div>
        <div className="modal-footer" style={{ justifyContent: 'space-between' }}>
          <button onClick={onConfirm} className="btn-delete">
            Выйти
          </button>
          <button onClick={onCancel} className="btn-cancel">
            Отмена
          </button>
        </div>
      </div>
    </div>
  );
}
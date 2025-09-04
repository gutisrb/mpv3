import React from 'react';

type Props = {
  open: boolean;
  title?: string;
  message?: string | React.ReactNode;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
};

const ConfirmDialog: React.FC<Props> = ({
  open,
  title = 'Potvrda',
  message = 'Da li ste sigurni?',
  confirmText = 'Obriši',
  cancelText = 'Otkaži',
  onConfirm,
  onCancel
}) => {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 bg-black/30 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow p-5">
        <h3 className="text-lg font-semibold mb-2">{title}</h3>
        <div className="text-sm text-slate-700 mb-4">{message}</div>
        <div className="flex justify-end gap-2">
          <button className="px-3 py-2 rounded-md border" onClick={onCancel}>
            {cancelText}
          </button>
          <button className="px-3 py-2 rounded-md bg-rose-600 text-white" onClick={onConfirm}>
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDialog;

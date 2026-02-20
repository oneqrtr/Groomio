'use client';

import { useEffect } from 'react';

type Props = {
  message: string;
  visible: boolean;
  onDismiss: () => void;
};

export function NewAppointmentToast({ message, visible, onDismiss }: Props) {
  useEffect(() => {
    if (!visible) return;
    const t = setTimeout(onDismiss, 5000);
    return () => clearTimeout(t);
  }, [visible, onDismiss]);

  if (!visible) return null;

  return (
    <div
      role="alert"
      className="new-appointment-toast"
      style={{
        position: 'fixed',
        bottom: 'max(16px, env(safe-area-inset-bottom))',
        left: '50%',
        transform: 'translateX(-50%)',
        padding: '14px 20px',
        borderRadius: 12,
        background: '#0f766e',
        color: '#fff',
        boxShadow: '0 4px 16px rgba(0,0,0,0.2)',
        zIndex: 9999,
        fontSize: 'clamp(14px, 4vw, 15px)',
        maxWidth: 'min(90vw, 360px)',
        margin: '0 16px',
      }}
    >
      {message}
    </div>
  );
}

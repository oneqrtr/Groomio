'use client';

import { useState, useCallback, useEffect } from 'react';
import { useNewAppointmentNotifier, type NewAppointmentPayload } from '@/hooks/useNewAppointmentNotifier';
import { NewAppointmentToast } from '@/components/NewAppointmentToast';

const STORAGE_KEY = 'groomio-new-appointment-sound';

function formatTime(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
  } catch {
    return '';
  }
}

export default function AdminBarberPage({
  params,
}: {
  params: { barberSlug: string };
}) {
  const [soundEnabled, setSoundEnabled] = useState(false);
  const [toast, setToast] = useState<{ visible: boolean; message: string }>({ visible: false, message: '' });

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      setSoundEnabled(stored === 'true');
    } catch {
      setSoundEnabled(false);
    }
  }, []);

  const handleToggle = useCallback((next: boolean) => {
    setSoundEnabled(next);
    try {
      localStorage.setItem(STORAGE_KEY, String(next));
    } catch {
      // ignore
    }
  }, []);

  const onNewAppointment = useCallback((payload: NewAppointmentPayload) => {
    const time = formatTime(payload.start_at);
    const name = payload.customer_name || 'Müşteri';
    setToast({ visible: true, message: `Yeni randevu: ${time} ${name}` });
  }, []);

  useNewAppointmentNotifier(params.barberSlug, {
    enabled: soundEnabled,
    onNewAppointment,
  });

  return (
    <div className="page-container">
      <h1 className="admin-title">Bugün</h1>
      <p className="admin-subtitle">Berber: {params.barberSlug}</p>

      <label className="sound-toggle-wrap" htmlFor="sound-toggle">
        <span className="sound-toggle-label">Yeni randevu sesi:</span>
        <button
          id="sound-toggle"
          type="button"
          role="switch"
          aria-checked={soundEnabled}
          aria-label="Yeni randevu sesi Aç/Kapat"
          onClick={() => handleToggle(!soundEnabled)}
          className="sound-toggle-btn"
        >
          <span className="sound-toggle-knob" />
        </button>
        <span className="sound-toggle-state">{soundEnabled ? 'Aç' : 'Kapat'}</span>
      </label>

      <section className="admin-list-section">
        <p className="admin-list-placeholder">Randevu listesi burada gösterilir (Bugün).</p>
      </section>

      <NewAppointmentToast
        message={toast.message}
        visible={toast.visible}
        onDismiss={() => setToast((t) => ({ ...t, visible: false }))}
      />
    </div>
  );
}

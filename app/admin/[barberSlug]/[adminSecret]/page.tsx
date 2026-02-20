'use client';

import { useState, useCallback, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useNewAppointmentNotifier, type NewAppointmentPayload } from '@/hooks/useNewAppointmentNotifier';
import { NewAppointmentToast } from '@/components/NewAppointmentToast';

const STORAGE_KEY = 'groomio-new-appointment-sound';

function formatTime(iso: string): string {
  try {
    return new Date(iso).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
  } catch {
    return '';
  }
}

type AppointmentRow = {
  id: string;
  start_at: string;
  end_at: string;
  customer_name: string;
  customer_phone: string;
  status: string;
  services: { name: string; duration_minutes: number } | null;
};

export default function AdminBarberPage() {
  const params = useParams();
  const barberSlug = params?.barberSlug as string;
  const adminSecret = params?.adminSecret as string;

  const [authorized, setAuthorized] = useState<boolean | null>(null);
  const [barberId, setBarberId] = useState<string | null>(null);
  const [appointments, setAppointments] = useState<AppointmentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(false);
  const [toast, setToast] = useState<{ visible: boolean; message: string }>({ visible: false, message: '' });

  const [closeDate, setCloseDate] = useState('');
  const [closeStart, setCloseStart] = useState('12:00');
  const [closeEnd, setCloseEnd] = useState('13:00');
  const [closeSubmitting, setCloseSubmitting] = useState(false);
  const [closeError, setCloseError] = useState<string | null>(null);

  const fetchAppointments = useCallback(() => {
    if (!barberSlug || !adminSecret) return;
    const key = encodeURIComponent(adminSecret);
    fetch(`/api/admin/appointments?barberSlug=${encodeURIComponent(barberSlug)}&key=${key}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.appointments) setAppointments(data.appointments);
      })
      .catch(() => {});
  }, [barberSlug, adminSecret]);

  useEffect(() => {
    if (!barberSlug || !adminSecret) {
      setAuthorized(false);
      setLoading(false);
      return;
    }
    fetch('/api/admin/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ barberSlug, adminSecret }),
    })
      .then((r) => r.json())
      .then((data) => {
        setAuthorized(data.valid === true);
        if (data.valid && data.barberId) setBarberId(data.barberId);
        if (data.valid) fetchAppointments();
      })
      .catch(() => setAuthorized(false))
      .finally(() => setLoading(false));
  }, [barberSlug, adminSecret]);

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
    fetchAppointments();
  }, [fetchAppointments]);

  useNewAppointmentNotifier(barberId, {
    enabled: soundEnabled && authorized === true && !!barberId,
    onNewAppointment,
  });

  const handleCancel = useCallback(
    (appointmentId: string) => {
      if (!confirm('Bu randevuyu iptal etmek istediğinize emin misiniz?')) return;
      fetch('/api/admin/appointments', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          barberSlug,
          key: adminSecret,
          appointmentId,
          status: 'cancelled',
        }),
      })
        .then((r) => r.json())
        .then((data) => {
          if (data.appointment) fetchAppointments();
        });
    },
    [barberSlug, adminSecret]
  );

  const handleCloseRange = useCallback(() => {
    if (!closeDate || !closeStart || !closeEnd) {
      setCloseError('Tarih ve saat girin');
      return;
    }
    const startAt = new Date(closeDate + 'T' + closeStart + ':00');
    const endAt = new Date(closeDate + 'T' + closeEnd + ':00');
    if (endAt <= startAt) {
      setCloseError('Bitiş saati başlangıçtan sonra olmalı');
      return;
    }
    setCloseError(null);
    setCloseSubmitting(true);
    fetch('/api/admin/overrides', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        barberSlug,
        key: adminSecret,
        startAt: startAt.toISOString(),
        endAt: endAt.toISOString(),
      }),
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.override) {
          setCloseDate('');
          setCloseStart('12:00');
          setCloseEnd('13:00');
        } else {
          setCloseError(data.error ?? 'Kaydedilemedi');
        }
      })
      .finally(() => setCloseSubmitting(false));
  }, [barberSlug, adminSecret, closeDate, closeStart, closeEnd]);

  if (loading) {
    return (
      <div className="page-container">
        <p>Yükleniyor…</p>
      </div>
    );
  }

  if (authorized === false) {
    return (
      <div className="page-container">
        <h1 className="admin-title">Yetkisiz</h1>
        <p>Bu panele erişim yetkiniz yok.</p>
        <Link href="/">Ana sayfa</Link>
      </div>
    );
  }

  const today = new Date().toISOString().slice(0, 10);

  return (
    <div className="page-container">
      <h1 className="admin-title">Bugün</h1>
      <p className="admin-subtitle">Berber: {barberSlug}</p>

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
        <h2 className="admin-list-heading">Randevular</h2>
        {appointments.length === 0 ? (
          <p className="admin-list-placeholder">Bugün randevu yok.</p>
        ) : (
          <ul className="admin-appointment-list">
            {appointments.map((a) => (
              <li key={a.id} className="admin-appointment-item">
                <span className="admin-appointment-time">{formatTime(a.start_at)}</span>
                <span className="admin-appointment-name">{a.customer_name}</span>
                <span className="admin-appointment-phone">{a.customer_phone}</span>
                {a.services && (
                  <span className="admin-appointment-service">{a.services.name}</span>
                )}
                {a.status === 'booked' && (
                  <button
                    type="button"
                    className="admin-cancel-btn"
                    onClick={() => handleCancel(a.id)}
                  >
                    İptal
                  </button>
                )}
                {a.status === 'cancelled' && (
                  <span className="admin-appointment-cancelled">İptal</span>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="admin-close-section">
        <h2 className="admin-list-heading">Saat aralığı kapat</h2>
        <div className="admin-close-form">
          <label>
            Tarih
            <input
              type="date"
              value={closeDate}
              onChange={(e) => setCloseDate(e.target.value)}
              min={today}
            />
          </label>
          <label>
            Başlangıç
            <input
              type="time"
              value={closeStart}
              onChange={(e) => setCloseStart(e.target.value)}
            />
          </label>
          <label>
            Bitiş
            <input
              type="time"
              value={closeEnd}
              onChange={(e) => setCloseEnd(e.target.value)}
            />
          </label>
          {closeError && <p className="admin-close-error">{closeError}</p>}
          <button
            type="button"
            className="booking-btn booking-btn-primary"
            onClick={handleCloseRange}
            disabled={closeSubmitting}
          >
            {closeSubmitting ? 'Kaydediliyor…' : 'Kapat'}
          </button>
        </div>
      </section>

      <NewAppointmentToast
        message={toast.message}
        visible={toast.visible}
        onDismiss={() => setToast((t) => ({ ...t, visible: false }))}
      />
    </div>
  );
}

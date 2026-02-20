'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';

type Service = { id: string; name: string; duration_minutes: number };
type Barber = { id: string; name: string; slug: string };

function formatSlotTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
}

function formatDateKey(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function generateIcs(appointment: { start_at: string; end_at: string; customer_name: string; customer_phone: string }) {
  const start = new Date(appointment.start_at);
  const end = new Date(appointment.end_at);
  const format = (d: Date) => d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  const body = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'BEGIN:VEVENT',
    'DTSTART:' + format(start),
    'DTEND:' + format(end),
    'SUMMARY:Randevu - ' + appointment.customer_name,
    'DESCRIPTION:Telefon: ' + appointment.customer_phone,
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n');
  return 'data:text/calendar;charset=utf-8,' + encodeURIComponent(body);
}

export default function BookingPage() {
  const params = useParams();
  const barberSlug = params?.barberSlug as string;

  const [barber, setBarber] = useState<Barber | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [step, setStep] = useState<'service' | 'day' | 'slot' | 'details' | 'done'>('service');
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [slots, setSlots] = useState<string[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [created, setCreated] = useState<{ start_at: string; end_at: string; customer_name: string; customer_phone: string } | null>(null);

  useEffect(() => {
    if (!barberSlug || barberSlug === 'admin') {
      setLoading(false);
      setError('Geçersiz sayfa');
      return;
    }
    fetch('/api/barber?slug=' + encodeURIComponent(barberSlug))
      .then((r) => r.json())
      .then((data) => {
        if (data.error) {
          setError(data.error);
          return;
        }
        setBarber(data.barber);
        setServices(data.services ?? []);
      })
      .catch(() => setError('Yüklenemedi'))
      .finally(() => setLoading(false));
  }, [barberSlug]);

  const today = formatDateKey(new Date());
  const tomorrow = formatDateKey(new Date(Date.now() + 86400000));
  const dayOptions = [
    { value: today, label: 'Bugün' },
    { value: tomorrow, label: 'Yarın' },
  ];

  const loadSlots = useCallback(() => {
    if (!selectedService || !selectedDate) return;
    setLoading(true);
    fetch(
      `/api/slots?barberSlug=${encodeURIComponent(barberSlug)}&date=${selectedDate}&serviceId=${selectedService.id}`
    )
      .then((r) => r.json())
      .then((data) => {
        if (data.error) setError(data.error);
        else setSlots(data.slots ?? []);
      })
      .finally(() => setLoading(false));
  }, [barberSlug, selectedService, selectedDate]);

  useEffect(() => {
    if (step === 'slot' && selectedService && selectedDate) loadSlots();
  }, [step, selectedService, selectedDate, loadSlots]);

  const handleSubmit = async () => {
    if (!selectedService || !selectedSlot || !name.trim() || !phone.trim()) {
      setSubmitError('İsim ve telefon gerekli');
      return;
    }
    setSubmitError(null);
    setLoading(true);
    try {
      const res = await fetch('/api/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          barberSlug,
          serviceId: selectedService.id,
          startAt: selectedSlot,
          customerName: name.trim(),
          customerPhone: phone.trim().replace(/\s/g, ''),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setSubmitError(data.error ?? 'Randevu alınamadı');
        return;
      }
      setCreated({
        start_at: data.appointment.start_at,
        end_at: data.appointment.end_at,
        customer_name: data.appointment.customer_name,
        customer_phone: data.appointment.customer_phone,
      });
      setStep('done');
    } finally {
      setLoading(false);
    }
  };

  if (barberSlug === 'admin') {
    return (
      <div className="booking-page">
        <p>Admin paneline giriş için doğru linki kullanın.</p>
        <Link href="/">Ana sayfa</Link>
      </div>
    );
  }

  if (loading && !barber) {
    return (
      <div className="booking-page">
        <p>Yükleniyor…</p>
      </div>
    );
  }

  if (error && !barber) {
    return (
      <div className="booking-page">
        <p>{error}</p>
        <Link href="/">Ana sayfa</Link>
      </div>
    );
  }

  if (!barber) return null;

  const whatsappText = created
    ? `Randevum: ${formatSlotTime(created.start_at)} - ${barber.name}`
    : '';

  return (
    <div className="booking-page">
      <header className="booking-header">
        <Link href="/" className="booking-logo">Groomio</Link>
        <h1 className="booking-barber-name">{barber.name}</h1>
        <p className="booking-tagline">Randevu al</p>
      </header>

      {step === 'done' && created ? (
        <section className="booking-done">
          <p className="booking-done-title">Randevun alındı</p>
          <p className="booking-done-time">
            {formatSlotTime(created.start_at)} — {barber.name}
          </p>
          <div className="booking-done-actions">
            <a
              href={generateIcs({ ...created, customer_name: name, customer_phone: phone })}
              download="randevu.ics"
              className="booking-btn booking-btn-secondary"
            >
              Takvime ekle
            </a>
            <a
              href={`https://wa.me/?text=${encodeURIComponent(whatsappText)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="booking-btn booking-btn-primary"
            >
              WhatsApp&apos;a ekle
            </a>
          </div>
          <button type="button" className="booking-btn booking-btn-ghost" onClick={() => setStep('service')}>
            Yeni randevu
          </button>
        </section>
      ) : (
        <>
          {step === 'service' && (
            <section className="booking-step">
              <h2>Hizmet seçin</h2>
              <div className="booking-options">
                {services.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    className="booking-option"
                    onClick={() => {
                      setSelectedService(s);
                      setStep('day');
                    }}
                  >
                    {s.name} <span className="booking-option-meta">{s.duration_minutes} dk</span>
                  </button>
                ))}
              </div>
            </section>
          )}

          {step === 'day' && (
            <section className="booking-step">
              <h2>Tarih seçin</h2>
              <div className="booking-options">
                {dayOptions.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    className="booking-option"
                    onClick={() => {
                      setSelectedDate(opt.value);
                      setStep('slot');
                    }}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
              <button type="button" className="booking-back" onClick={() => setStep('service')}>
                ← Geri
              </button>
            </section>
          )}

          {step === 'slot' && (
            <section className="booking-step">
              <h2>Saat seçin</h2>
              {loading ? (
                <p>Saatler yükleniyor…</p>
              ) : slots.length === 0 ? (
                <p>Bu tarihte uygun slot yok.</p>
              ) : (
                <div className="booking-slots">
                  {slots.map((slot) => (
                    <button
                      key={slot}
                      type="button"
                      className={'booking-slot' + (selectedSlot === slot ? ' selected' : '')}
                      onClick={() => setSelectedSlot(slot)}
                    >
                      {formatSlotTime(slot)}
                    </button>
                  ))}
                </div>
              )}
              <button type="button" className="booking-back" onClick={() => setStep('day')}>
                ← Geri
              </button>
              {selectedSlot && (
                <button
                  type="button"
                  className="booking-btn booking-btn-primary booking-next"
                  onClick={() => setStep('details')}
                >
                  Devam
                </button>
              )}
            </section>
          )}

          {step === 'details' && (
            <section className="booking-step">
              <h2>İletişim bilgileri</h2>
              <p className="booking-selected-summary">
                {selectedService?.name}, {selectedDate}, {selectedSlot && formatSlotTime(selectedSlot)}
              </p>
              <div className="booking-form">
                <label>
                  Ad Soyad
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Adınız"
                    autoComplete="name"
                  />
                </label>
                <label>
                  Telefon
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="05XX XXX XX XX"
                    autoComplete="tel"
                  />
                </label>
                {submitError && <p className="booking-error">{submitError}</p>}
                <button
                  type="button"
                  className="booking-btn booking-btn-primary"
                  onClick={handleSubmit}
                  disabled={loading}
                >
                  {loading ? 'Alınıyor…' : 'Randevu al'}
                </button>
              </div>
              <button type="button" className="booking-back" onClick={() => setStep('slot')}>
                ← Geri
              </button>
            </section>
          )}
        </>
      )}
    </div>
  );
}

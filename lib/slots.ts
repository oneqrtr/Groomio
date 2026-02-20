import type { Barber, Service, AvailabilityOverride } from '@/lib/supabase/database';

const TZ = 'Europe/Istanbul';

function toZonedDate(dateStr: string, timeStr: string): Date {
  const [y, m, d] = dateStr.split('-').map(Number);
  const [h, min] = timeStr.split(':').map(Number);
  return new Date(Date.UTC(y, m - 1, d, h - 3, min, 0, 0)); // Istanbul UTC+3
}

function formatSlot(d: Date): string {
  return d.toISOString();
}

export function generateSlotsForDay(
  barber: Barber,
  service: Service,
  dateStr: string
): string[] {
  const duration = service.duration_minutes;
  const open = barber.open_time;
  const close = barber.close_time;
  const slotMinutes = barber.slot_minutes;

  const start = toZonedDate(dateStr, open);
  const end = toZonedDate(dateStr, close);
  const slots: string[] = [];
  let t = new Date(start.getTime());

  while (t.getTime() + duration * 60 * 1000 <= end.getTime()) {
    slots.push(formatSlot(new Date(t)));
    t.setMinutes(t.getMinutes() + slotMinutes);
  }
  return slots;
}

export function filterSlotsByBooked(
  slots: string[],
  bookedRanges: { start_at: string; end_at: string }[],
  durationMinutes: number
): string[] {
  const slotEnd = (s: string) => {
    const d = new Date(s);
    d.setMinutes(d.getMinutes() + durationMinutes);
    return d.toISOString();
  };
  return slots.filter((slot) => {
    const se = slotEnd(slot);
    const overlap = bookedRanges.some((a) => slot < a.end_at && se > a.start_at);
    return !overlap;
  });
}

export function filterSlotsByClosed(
  slots: string[],
  overrides: AvailabilityOverride[],
  durationMinutes: number
): string[] {
  const slotEnd = (s: string) => {
    const d = new Date(s);
    d.setMinutes(d.getMinutes() + durationMinutes);
    return d.toISOString();
  };
  const closed = overrides.filter((o) => o.type === 'closed');
  return slots.filter((slot) => {
    const se = slotEnd(slot);
    const inClosed = closed.some((c) => slot < c.end_at && se > c.start_at);
    return !inClosed;
  });
}

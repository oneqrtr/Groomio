import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/supabase/server';
import {
  generateSlotsForDay,
  filterSlotsByBooked,
  filterSlotsByClosed,
} from '@/lib/slots';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const barberSlug = searchParams.get('barberSlug');
  const date = searchParams.get('date');
  const serviceId = searchParams.get('serviceId');

  if (!barberSlug || !date || !serviceId) {
    return NextResponse.json(
      { error: 'barberSlug, date (YYYY-MM-DD) ve serviceId gerekli' },
      { status: 400 }
    );
  }

  const dateMatch = /^\d{4}-\d{2}-\d{2}$/.exec(date);
  if (!dateMatch) {
    return NextResponse.json({ error: 'date YYYY-MM-DD formatında olmalı' }, { status: 400 });
  }

  const supabase = createServerSupabase();

  const { data: barber, error: barberError } = await supabase
    .from('barbers')
    .select('*')
    .eq('slug', barberSlug)
    .eq('is_active', true)
    .single();

  if (barberError || !barber) {
    return NextResponse.json({ error: 'Berber bulunamadı' }, { status: 404 });
  }

  const { data: service, error: serviceError } = await supabase
    .from('services')
    .select('*')
    .eq('id', serviceId)
    .eq('barber_id', barber.id)
    .single();

  if (serviceError || !service) {
    return NextResponse.json({ error: 'Hizmet bulunamadı' }, { status: 404 });
  }

  const dayStart = `${date}T00:00:00.000Z`;
  const dayEnd = `${date}T23:59:59.999Z`;

  const { data: appointments } = await supabase
    .from('appointments')
    .select('start_at, end_at')
    .eq('barber_id', barber.id)
    .eq('status', 'booked')
    .gte('start_at', dayStart)
    .lte('end_at', dayEnd);

  const { data: overrides } = await supabase
    .from('availability_overrides')
    .select('*')
    .eq('barber_id', barber.id)
    .eq('type', 'closed');

  let slots = generateSlotsForDay(barber, service, date);
  slots = filterSlotsByBooked(
    slots,
    (appointments ?? []).map((a) => ({ start_at: a.start_at, end_at: a.end_at })),
    service.duration_minutes
  );
  slots = filterSlotsByClosed(slots, overrides ?? [], service.duration_minutes);

  return NextResponse.json({ slots });
}

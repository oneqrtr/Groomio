import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/supabase/server';

const IP_LIMIT = 10;
const IP_WINDOW_MS = 10 * 60 * 1000;
const PHONE_BOOKINGS_PER_DAY = 3;

function getClientIp(request: NextRequest): string {
  return (
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') ||
    'unknown'
  );
}

export async function POST(request: NextRequest) {
  const ip = getClientIp(request);

  const supabase = createServerSupabase();

  const body = await request.json().catch(() => ({}));
  const {
    barberSlug,
    serviceId,
    startAt,
    customerName,
    customerPhone,
  } = body as Record<string, string>;

  if (!barberSlug || !serviceId || !startAt || !customerName || !customerPhone) {
    return NextResponse.json(
      { error: 'barberSlug, serviceId, startAt, customerName, customerPhone gerekli' },
      { status: 400 }
    );
  }

  const name = String(customerName).trim();
  const phone = String(customerPhone).trim().replace(/\s/g, '');
  if (name.length < 2) {
    return NextResponse.json({ error: 'İsim en az 2 karakter olmalı' }, { status: 400 });
  }
  if (phone.length < 10) {
    return NextResponse.json({ error: 'Geçerli bir telefon numarası girin' }, { status: 400 });
  }

  const startDate = new Date(startAt);
  if (Number.isNaN(startDate.getTime())) {
    return NextResponse.json({ error: 'Geçersiz startAt' }, { status: 400 });
  }

  const { data: barber, error: barberError } = await supabase
    .from('barbers')
    .select('id')
    .eq('slug', barberSlug)
    .eq('is_active', true)
    .single();

  if (barberError || !barber) {
    return NextResponse.json({ error: 'Berber bulunamadı' }, { status: 404 });
  }

  const { data: service, error: serviceError } = await supabase
    .from('services')
    .select('id, duration_minutes')
    .eq('id', serviceId)
    .eq('barber_id', barber.id)
    .single();

  if (serviceError || !service) {
    return NextResponse.json({ error: 'Hizmet bulunamadı' }, { status: 404 });
  }

  const endDate = new Date(startDate.getTime() + service.duration_minutes * 60 * 1000);
  const endAt = endDate.toISOString();

  const { count: ipCount } = await supabase
    .from('appointment_attempts')
    .select('*', { count: 'exact', head: true })
    .eq('ip', ip)
    .gte('created_at', new Date(Date.now() - IP_WINDOW_MS).toISOString());

  if ((ipCount ?? 0) >= IP_LIMIT) {
    return NextResponse.json(
      { error: 'Çok fazla deneme. Lütfen 10 dakika sonra tekrar deneyin.' },
      { status: 429 }
    );
  }

  const todayStart = new Date(startDate);
  todayStart.setUTCHours(0, 0, 0, 0);
  const todayEnd = new Date(todayStart);
  todayEnd.setUTCDate(todayEnd.getUTCDate() + 1);

  const { count: phoneCount } = await supabase
    .from('appointments')
    .select('*', { count: 'exact', head: true })
    .eq('barber_id', barber.id)
    .eq('customer_phone', phone)
    .eq('status', 'booked')
    .gte('created_at', todayStart.toISOString())
    .lt('created_at', todayEnd.toISOString());

  if ((phoneCount ?? 0) >= PHONE_BOOKINGS_PER_DAY) {
    return NextResponse.json(
      { error: 'Bu numara ile bugün en fazla 3 randevu alabilirsiniz.' },
      { status: 429 }
    );
  }

  const { data: overlapping } = await supabase
    .from('appointments')
    .select('id')
    .eq('barber_id', barber.id)
    .eq('status', 'booked')
    .lt('start_at', endAt)
    .gt('end_at', startAt);

  if (overlapping && overlapping.length > 0) {
    return NextResponse.json(
      { error: 'Bu saat dolu. Lütfen başka bir slot seçin.' },
      { status: 409 }
    );
  }

  const { data: inserted, error: insertError } = await supabase
    .from('appointments')
    .insert({
      barber_id: barber.id,
      service_id: service.id,
      start_at: startAt,
      end_at: endAt,
      customer_name: name,
      customer_phone: phone,
      status: 'booked',
    })
    .select('id, start_at, end_at, customer_name, customer_phone')
    .single();

  if (insertError) {
    if (insertError.code === '23505') {
      return NextResponse.json(
        { error: 'Bu saat dolu. Lütfen başka bir slot seçin.' },
        { status: 409 }
      );
    }
    return NextResponse.json({ error: 'Randevu oluşturulamadı' }, { status: 500 });
  }

  try {
    await supabase.from('appointment_attempts').insert({ ip });
  } catch {
    // Rate limit table may require service_role key; continue anyway
  }

  return NextResponse.json({
    appointment: inserted,
    message: 'Randevunuz alındı.',
  });
}

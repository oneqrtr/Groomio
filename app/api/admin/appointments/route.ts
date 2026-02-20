import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/supabase/server';

async function getBarberBySecret(
  supabase: ReturnType<typeof createServerSupabase>,
  slug: string,
  secret: string
): Promise<{ id: string } | null> {
  const { data } = await supabase
    .from('barbers')
    .select('id')
    .eq('slug', slug)
    .eq('admin_secret', secret)
    .single();
  return data as { id: string } | null;
}

export async function GET(request: NextRequest) {
  const barberSlug = request.nextUrl.searchParams.get('barberSlug');
  const secret = request.nextUrl.searchParams.get('key') ?? request.headers.get('x-admin-secret') ?? '';
  if (!barberSlug) {
    return NextResponse.json({ error: 'barberSlug gerekli' }, { status: 400 });
  }

  const supabase = createServerSupabase();
  const barber = await getBarberBySecret(supabase, barberSlug, secret);
  if (!barber) {
    return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 });
  }

  const date = request.nextUrl.searchParams.get('date');
  const day = date ? new Date(date) : new Date();
  const start = new Date(day);
  start.setUTCHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setUTCDate(end.getUTCDate() + 1);

  const { data, error } = await supabase
    .from('appointments')
    .select(`
      id, start_at, end_at, customer_name, customer_phone, status, created_at,
      services ( name, duration_minutes )
    `)
    .eq('barber_id', barber.id)
    .gte('start_at', start.toISOString())
    .lt('start_at', end.toISOString())
    .order('start_at', { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ appointments: data ?? [] });
}

export async function PATCH(request: NextRequest) {
  const body = await request.json().catch(() => ({}));
  const barberSlug = (body.barberSlug ?? request.nextUrl.searchParams.get('barberSlug')) as string | null;
  const secret = (body.key ?? request.nextUrl.searchParams.get('key') ?? request.headers.get('x-admin-secret')) ?? '';
  if (!barberSlug) {
    return NextResponse.json({ error: 'barberSlug gerekli' }, { status: 400 });
  }

  const supabase = createServerSupabase();
  const barber = await getBarberBySecret(supabase, barberSlug, secret);
  if (!barber) {
    return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 });
  }

  const { appointmentId, status } = body as { appointmentId?: string; status?: string };

  if (!appointmentId || status !== 'cancelled') {
    return NextResponse.json({ error: 'appointmentId ve status: cancelled gerekli' }, { status: 400 });
  }

  const { data, error } = await supabase
    .from('appointments')
    .update({ status: 'cancelled' })
    .eq('id', appointmentId)
    .eq('barber_id', barber.id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ appointment: data });
}

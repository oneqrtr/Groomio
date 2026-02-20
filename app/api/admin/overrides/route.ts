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

  const from = request.nextUrl.searchParams.get('from');
  const to = request.nextUrl.searchParams.get('to');
  let q = supabase
    .from('availability_overrides')
    .select('*')
    .eq('barber_id', barber.id)
    .order('start_at', { ascending: true });

  if (from) q = q.gte('start_at', from);
  if (to) q = q.lte('end_at', to);

  const { data, error } = await q;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ overrides: data ?? [] });
}

export async function POST(request: NextRequest) {
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

  const { startAt, endAt, note } = body as { startAt?: string; endAt?: string; note?: string };

  if (!startAt || !endAt) {
    return NextResponse.json({ error: 'startAt ve endAt gerekli' }, { status: 400 });
  }

  const start = new Date(startAt);
  const end = new Date(endAt);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end <= start) {
    return NextResponse.json({ error: 'Geçerli başlangıç ve bitiş zamanı girin' }, { status: 400 });
  }

  const { data, error } = await supabase
    .from('availability_overrides')
    .insert({
      barber_id: barber.id,
      start_at: start.toISOString(),
      end_at: end.toISOString(),
      type: 'closed',
      note: note ?? null,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ override: data });
}

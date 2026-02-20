import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  const slug = request.nextUrl.searchParams.get('slug');
  if (!slug) {
    return NextResponse.json({ error: 'slug gerekli' }, { status: 400 });
  }

  const supabase = createServerSupabase();
  const { data: barber, error: barberError } = await supabase
    .from('barbers')
    .select('id, slug, name')
    .eq('slug', slug)
    .eq('is_active', true)
    .single();

  if (barberError || !barber) {
    return NextResponse.json({ error: 'Berber bulunamadı' }, { status: 404 });
  }

  const { data: services } = await supabase
    .from('services')
    .select('id, name, duration_minutes')
    .eq('barber_id', barber.id)
    .order('name');

  return NextResponse.json({ barber, services: services ?? [] });
}

import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}));
  const { barberSlug, adminSecret } = body as { barberSlug?: string; adminSecret?: string };

  if (!barberSlug || !adminSecret) {
    return NextResponse.json({ valid: false, error: 'barberSlug ve adminSecret gerekli' }, { status: 400 });
  }

  const supabase = createServerSupabase();
  const { data: barber, error } = await supabase
    .from('barbers')
    .select('id, name')
    .eq('slug', barberSlug)
    .eq('admin_secret', adminSecret)
    .single();

  if (error || !barber) {
    return NextResponse.json({ valid: false }, { status: 401 });
  }

  return NextResponse.json({ valid: true, barberId: barber.id, barberName: barber.name });
}

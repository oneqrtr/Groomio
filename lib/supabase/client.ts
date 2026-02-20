import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '';

export const supabase: SupabaseClient = createClient(supabaseUrl, supabaseAnonKey);

export type Appointment = {
  id: string;
  barber_id: string;
  start_at: string;
  end_at: string;
  customer_name: string;
  customer_phone: string;
  status: string;
  created_at: string;
};

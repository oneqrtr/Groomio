export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Barber = {
  id: string;
  slug: string;
  name: string;
  open_time: string;
  close_time: string;
  slot_minutes: number;
  timezone: string;
  is_active: boolean;
  admin_secret: string;
  created_at: string;
  updated_at: string;
};

export type Service = {
  id: string;
  barber_id: string;
  name: string;
  duration_minutes: number;
  price_cents: number | null;
  created_at: string;
};

export type AvailabilityOverride = {
  id: string;
  barber_id: string;
  start_at: string;
  end_at: string;
  type: 'closed';
  note: string | null;
  created_at: string;
};

export type Appointment = {
  id: string;
  barber_id: string;
  service_id: string | null;
  start_at: string;
  end_at: string;
  customer_name: string;
  customer_phone: string;
  status: string;
  created_at: string;
};

export interface Database {
  public: {
    Tables: {
      barbers: { Row: Barber; Insert: Omit<Barber, 'created_at' | 'updated_at'>; Update: Partial<Barber> };
      services: { Row: Service; Insert: Omit<Service, 'created_at'>; Update: Partial<Service> };
      availability_overrides: {
        Row: AvailabilityOverride;
        Insert: Omit<AvailabilityOverride, 'id' | 'created_at'>;
        Update: Partial<AvailabilityOverride>;
      };
      appointments: {
        Row: Appointment;
        Insert: Omit<Appointment, 'id' | 'created_at'>;
        Update: Partial<Appointment>;
      };
    };
  };
}

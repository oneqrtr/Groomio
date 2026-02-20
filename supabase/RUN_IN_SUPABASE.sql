-- ============================================================
-- Groomio: Supabase'de tek seferde çalıştır
-- Supabase Dashboard → SQL Editor → Yeni sorgu → yapıştır → Run
-- ============================================================

-- 1) Şema
CREATE TABLE IF NOT EXISTS barbers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  open_time TIME NOT NULL DEFAULT '09:00',
  close_time TIME NOT NULL DEFAULT '18:00',
  slot_minutes INT NOT NULL DEFAULT 30,
  timezone TEXT NOT NULL DEFAULT 'Europe/Istanbul',
  is_active BOOLEAN NOT NULL DEFAULT true,
  admin_secret TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  barber_id UUID NOT NULL REFERENCES barbers(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  duration_minutes INT NOT NULL,
  price_cents INT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(barber_id, name)
);

DO $$ BEGIN CREATE TYPE override_type AS ENUM ('closed'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS availability_overrides (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  barber_id UUID NOT NULL REFERENCES barbers(id) ON DELETE CASCADE,
  start_at TIMESTAMPTZ NOT NULL,
  end_at TIMESTAMPTZ NOT NULL,
  type override_type NOT NULL DEFAULT 'closed',
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT valid_range CHECK (end_at > start_at)
);

CREATE TABLE IF NOT EXISTS appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  barber_id UUID NOT NULL REFERENCES barbers(id) ON DELETE CASCADE,
  service_id UUID REFERENCES services(id),
  start_at TIMESTAMPTZ NOT NULL,
  end_at TIMESTAMPTZ NOT NULL,
  customer_name TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'booked',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'appointments' AND column_name = 'service_id') THEN
    ALTER TABLE appointments ADD COLUMN service_id UUID REFERENCES services(id);
  END IF;
EXCEPTION WHEN undefined_table THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS idx_appointments_barber_start ON appointments(barber_id, start_at);

CREATE TABLE IF NOT EXISTS appointment_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ip TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_appointment_attempts_ip_created ON appointment_attempts(ip, created_at);

ALTER TABLE barbers ENABLE ROW LEVEL SECURITY;
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE availability_overrides ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "barbers_select" ON barbers;
CREATE POLICY "barbers_select" ON barbers FOR SELECT USING (true);
DROP POLICY IF EXISTS "services_select" ON services;
CREATE POLICY "services_select" ON services FOR SELECT USING (true);
DROP POLICY IF EXISTS "availability_overrides_select" ON availability_overrides;
CREATE POLICY "availability_overrides_select" ON availability_overrides FOR SELECT USING (true);
DROP POLICY IF EXISTS "appointments_select" ON appointments;
CREATE POLICY "appointments_select" ON appointments FOR SELECT USING (true);
DROP POLICY IF EXISTS "appointments_insert" ON appointments;
CREATE POLICY "appointments_insert" ON appointments FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "appointments_update" ON appointments;
CREATE POLICY "appointments_update" ON appointments FOR UPDATE USING (true);

ALTER TABLE appointment_attempts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "attempts_no_anon" ON appointment_attempts;
CREATE POLICY "attempts_no_anon" ON appointment_attempts FOR ALL USING (false);

-- 2) Örnek berber + hizmetler (mehmet-berber)
INSERT INTO barbers (id, slug, name, open_time, close_time, slot_minutes, timezone, is_active, admin_secret)
VALUES (
  'a1b2c3d4-e5f6-4789-a012-345678901234'::uuid,
  'mehmet-berber',
  'Mehmet Berber',
  '09:00',
  '18:00',
  30,
  'Europe/Istanbul',
  true,
  'groomio-admin-mehmet-2024'
)
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  open_time = EXCLUDED.open_time,
  close_time = EXCLUDED.close_time,
  slot_minutes = EXCLUDED.slot_minutes,
  admin_secret = EXCLUDED.admin_secret,
  updated_at = now();

INSERT INTO services (barber_id, name, duration_minutes)
SELECT b.id, 'Saç', 30 FROM barbers b WHERE b.slug = 'mehmet-berber'
ON CONFLICT (barber_id, name) DO NOTHING;

INSERT INTO services (barber_id, name, duration_minutes)
SELECT b.id, 'Sakal', 20 FROM barbers b WHERE b.slug = 'mehmet-berber'
ON CONFLICT (barber_id, name) DO NOTHING;

INSERT INTO services (barber_id, name, duration_minutes)
SELECT b.id, 'Saç+Sakal', 45 FROM barbers b WHERE b.slug = 'mehmet-berber'
ON CONFLICT (barber_id, name) DO NOTHING;

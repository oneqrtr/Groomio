-- Barbers
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

-- Services per barber
CREATE TABLE IF NOT EXISTS services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  barber_id UUID NOT NULL REFERENCES barbers(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  duration_minutes INT NOT NULL,
  price_cents INT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(barber_id, name)
);

-- Availability overrides (e.g. closed periods)
CREATE TYPE override_type AS ENUM ('closed');

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

-- Appointments (overlap prevented in API with transaction)
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

-- Add service_id if table already existed without it
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'appointments' AND column_name = 'service_id'
  ) THEN
    ALTER TABLE appointments ADD COLUMN service_id UUID REFERENCES services(id);
  END IF;
EXCEPTION WHEN undefined_table THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS idx_appointments_barber_start ON appointments(barber_id, start_at);
CREATE INDEX IF NOT EXISTS idx_appointments_status ON appointments(barber_id, status) WHERE status = 'booked';

-- IP rate limit log (for 10 req / 10 min per IP)
CREATE TABLE IF NOT EXISTS appointment_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ip TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_appointment_attempts_ip_created ON appointment_attempts(ip, created_at);

-- RLS: allow anon read for barbers (by slug), services, availability_overrides; anon insert appointments
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

-- appointment_attempts: only server (service role) should write/read; no policy for anon
ALTER TABLE appointment_attempts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "attempts_all" ON appointment_attempts;
-- Service role bypasses RLS; anon has no access
CREATE POLICY "attempts_no_anon" ON appointment_attempts FOR ALL USING (false);

COMMENT ON TABLE barbers IS 'Barber shops / barbers';
COMMENT ON TABLE services IS 'Services per barber (e.g. Saç, Sakal)';
COMMENT ON TABLE availability_overrides IS 'Closed or special availability slots';
COMMENT ON TABLE appointment_attempts IS 'Rate limit: appointment create attempts per IP';

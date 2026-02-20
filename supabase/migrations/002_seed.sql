-- Seed: one barber (mehmet-berber), services, admin_secret
-- Run after 001_schema.sql

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

-- Services for mehmet-berber
INSERT INTO services (barber_id, name, duration_minutes)
SELECT b.id, 'Saç', 30
FROM barbers b WHERE b.slug = 'mehmet-berber'
ON CONFLICT (barber_id, name) DO NOTHING;

INSERT INTO services (barber_id, name, duration_minutes)
SELECT b.id, 'Sakal', 20
FROM barbers b WHERE b.slug = 'mehmet-berber'
ON CONFLICT (barber_id, name) DO NOTHING;

INSERT INTO services (barber_id, name, duration_minutes)
SELECT b.id, 'Saç+Sakal', 45
FROM barbers b WHERE b.slug = 'mehmet-berber'
ON CONFLICT (barber_id, name) DO NOTHING;

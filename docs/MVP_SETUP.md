# Groomio MVP — Kurulum ve Kullanım

## Veritabanı (Supabase)

1. Supabase Dashboard → SQL Editor.
2. Sırayla çalıştır:
   - `supabase/migrations/001_schema.sql`
   - `supabase/migrations/002_seed.sql`

Seed ile gelen örnek berber:
- **Slug:** `mehmet-berber`
- **Admin secret:** `groomio-admin-mehmet-2024`
- **Admin panel URL:** `/admin/mehmet-berber/groomio-admin-mehmet-2024`
- **Müşteri randevu sayfası (QR/link):** `/{barberSlug}` → `/mehmet-berber`

## Ortam Değişkenleri

- `NEXT_PUBLIC_SUPABASE_URL` ve `NEXT_PUBLIC_SUPABASE_ANON_KEY` zorunlu.
- IP rate limit (10 istek / 10 dk) için `SUPABASE_SERVICE_ROLE_KEY` önerilir (yoksa anon ile devam eder, rate limit tablosu service role ister).

## Sayfalar ve API’ler

| Ne | URL / Endpoint |
|----|-----------------|
| Landing | `/` |
| Müşteri randevu (QR/link) | `/{barberSlug}` örn. `/mehmet-berber` |
| Admin panel (gizli anahtar gerekli) | `/admin/[barberSlug]/[adminSecret]` |
| Slot listesi | `GET /api/slots?barberSlug=&date=YYYY-MM-DD&serviceId=` |
| Randevu oluştur | `POST /api/appointments` (body: barberSlug, serviceId, startAt, customerName, customerPhone) |
| Admin: Bugün listesi | `GET /api/admin/appointments?barberSlug=&key=` |
| Admin: Randevu iptal | `PATCH /api/admin/appointments` (body: barberSlug, key, appointmentId, status: 'cancelled') |
| Admin: Saat kapat | `POST /api/admin/overrides` (body: barberSlug, key, startAt, endAt) |

## Anti-spam

- **IP:** 10 randevu oluşturma denemesi / 10 dakika (service role ile `appointment_attempts` tablosu kullanılır).
- **Telefon:** Aynı numara ile aynı berberde günde en fazla 3 randevu.

## Yeni randevu sesi

Admin panelde “Yeni randevu sesi: Aç/Kapat” ile panel açıkken gelen yeni randevularda ses + toast çalışır (mevcut davranış korundu).

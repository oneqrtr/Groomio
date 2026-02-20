# Groomio — Site Özeti

Bu belge, Groomio’nun ne olduğunu, ne işe yaradığını, hangi kullanıcıların olduğunu, arayüzleri ve giriş/çıkışı özetler.

---

## Nedir?

**Groomio**, berberler için **randevu yönetim** uygulamasıdır. Müşteriler (ileride) randevu alabilir; berber veya dükkan yöneticisi, randevuları tek bir panelden görür ve yönetir. Özellikle **mobil** kullanım için tasarlandı.

---

## Ne işe yarar?

- **Landing (ana sayfa):** Groomio’yu ve özelliklerini tanıtır; “Berber paneline git” ile admin’e yönlendirir.
- **Berber / admin paneli:** O günkü randevuları (“Bugün” listesi) gösterir. Yeni randevu geldiğinde (panel açıkken) **ses** çalar ve ekranda **toast** ile “Yeni randevu: saat müşteri adı” yazar. Ses aç/kapat düğmesi vardır.
- **Veri:** Randevular Supabase (PostgreSQL) üzerinde tutulur; alanlar: `id`, `barber_id`, `start_at`, `end_at`, `customer_name`, `customer_phone`, `status` (örn. `booked`), `created_at`.

Şu an **müşteri tarafı randevu alma sayfası** yok; sadece tanıtım sayfası ve berber paneli vardır.

---

## Hangi kullanıcılar var?

| Kullanıcı tipi | Açıklama | Şu anki arayüz |
|----------------|----------|-----------------|
| **Berber / dükkan** | Randevuları gören ve yöneten kişi. Günlük listeyi görür, yeni randevu sesi alır. | Admin panel: `/admin/[barberSlug]` (örn. `/admin/mehmet-berber`) |
| **Müşteri** | Randevu almak isteyen kişi. | Henüz yok; ileride “Randevu al” sayfası eklenebilir. |
| **Ziyaretçi** | Siteyi merak eden; özellikleri okur, panele gidebilir. | Landing: `/` (ana sayfa) |

---

## Kullanıcı arayüzleri nasıl?

### 1. Landing (ana sayfa) — `/`

- **Görünüm:** Logo (mavi–mor gradient “G”), “Groomio” başlığı, kısa tanıtım metni, “Berber paneline git” butonu. Altında “Özellikler” bölümü (randevu, panel, ses bildirimi, mobil, anlık güncelleme, altyapı).
- **Kullanım:** Bilgi okuma; butona tıklayınca berber paneline gidilir. Giriş yok; herkese açık.

### 2. Berber / admin paneli — `/admin/[barberSlug]`

- **Görünüm:** “Bugün” başlığı, berber slug’ı (örn. “mehmet-berber”), “Yeni randevu sesi: Aç/Kapat” düğmesi, randevu listesi alanı (şu an placeholder), yeni randevu gelince altta toast.
- **Kullanım:** Berber veya yetkili kişi bu sayfayı (genelde telefonda) açar; günün randevularını görür. “Yeni randevu sesi”ni açarsa, panel açıkken yeni randevu gelince ses çalar ve toast görünür. Liste ileride Supabase’den doldurulacak.

Tüm sayfalar **mobil öncelikli**: dokunma alanları büyük, metin okunaklı, safe area’lar dikkate alınır.

---

## Giriş ve çıkış nasıl?

**Şu an sitede giriş/çıkış (login/logout) yok.**

- **Admin erişimi:** Sadece **URL ile**. Örneğin `/admin/mehmet-berber` adresini bilen herkes bu panele girebilir. Şifre veya e-posta ile kimlik doğrulama yapılmıyor.
- **Landing:** Herkese açık; giriş gerektirmez.

**İleride yapılabilecekler:**

- Supabase Auth (e-posta/şifre veya OTP) ile **berber girişi** eklenebilir.
- Giriş yapan kullanıcıya göre ilgili berber paneline yönlendirme (örn. `barber_id` veya slug’a göre).
- Çıkış: “Çıkış” butonu ile oturum kapatma.

Özet: Şu anki model “**linki bilen kullanır**”; güvenlik için ileride giriş/çıkış eklenmesi önerilir.

---

## Kısa akış özeti

1. Ziyaretçi **ana sayfaya** girer → özellikleri okur.
2. “Berber paneline git”e tıklar → **admin sayfasına** gider (slug ile, örn. `/admin/mehmet-berber`).
3. Admin’de “Bugün” listesini görür; “Yeni randevu sesi”ni açar/kapatır.
4. Yeni randevu (Supabase’e eklenince) gelirse → ses + toast.
5. Giriş/çıkış olmadığı için oturum kapatma yok; sayfadan çıkmak “çıkış” sayılır.

---

## Logo

Logo, mavi–mor gradient “G” ikonudur. Ana sayfada hero bölümünde gösterilir. Dosya: `public/logo.png`. Bu dosyayı projeye eklemeniz yeterlidir.

import Link from 'next/link';

export default function LandingPage() {
  return (
    <div className="landing">
      <header className="landing-hero">
        <h1>Groomio</h1>
        <p>
          Berberiniz için akıllı randevu yönetimi. Müşteriler kolayca randevu alır,
          siz tek ekrandan günü yönetirsiniz — özellikle mobilde.
        </p>
        <Link href="/admin/mehmet-berber" className="landing-cta">
          Berber paneline git
        </Link>
      </header>

      <section className="landing-section" aria-labelledby="ozellikler-baslik">
        <h2 id="ozellikler-baslik" className="landing-section-title">
          Özellikler
        </h2>

        <div className="landing-feature">
          <div className="landing-feature-icon" aria-hidden>📅</div>
          <h3>Online randevu</h3>
          <p>
            Müşteriler istedikleri saati seçip randevu alabilir. Randevular tek merkezde
            toplanır; kağıt defter veya karışık mesajlara gerek kalmaz. İsterseniz ileride
            müşteri tarafı randevu sayfası da eklenebilir.
          </p>
        </div>

        <div className="landing-feature">
          <div className="landing-feature-icon" aria-hidden>🪒</div>
          <h3>Berber / admin paneli</h3>
          <p>
            Günlük randevularınızı &quot;Bugün&quot; listesinde görürsünüz. Her berber kendi
            paneline slug ile erişir (örn. /admin/mehmet-berber). Randevular barber_id,
            saat, müşteri adı ve telefon ile tutulur; durum (booked, iptal vb.) takip edilebilir.
          </p>
        </div>

        <div className="landing-feature">
          <div className="landing-feature-icon" aria-hidden>🔔</div>
          <h3>Yeni randevu sesi</h3>
          <p>
            Panel açıkken yeni randevu geldiğinde kısa bir ses çalar ve ekranda &quot;Yeni randevu:
            saat müşteri adı&quot; toast’u görünür. Aç/Kapat düğmesi var; varsayılan kapalı (tarayıcı
            ses kısıtları nedeniyle). Ses yalnızca panel açıkken ve siz açtıktan sonra gelen
            randevular için çalışır; ilk açılışta yanlış bildirim olmaz.
          </p>
        </div>

        <div className="landing-feature">
          <div className="landing-feature-icon" aria-hidden>📱</div>
          <h3>Mobil öncelikli</h3>
          <p>
            Site %98 mobil kullanım için tasarlandı. Tüm sayfalar küçük ekrana göre uyumlu:
            dokunma alanları en az 44px, metin okunaklı, notch ve güvenli alanlar dikkate
            alındı. Telefonda hem randevu takibi hem bildirim rahatça kullanılır.
          </p>
        </div>

        <div className="landing-feature">
          <div className="landing-feature-icon" aria-hidden>⚡</div>
          <h3>Anlık güncelleme</h3>
          <p>
            Yeni randevu tespiti Supabase Realtime ile anlık (INSERT dinlenir); Realtime
            kapalıysa otomatik olarak 25 saniyede bir polling ile kontrol edilir. Böylece
            kurulum ne olursa olsun yeni randevular kaçmaz.
          </p>
        </div>

        <div className="landing-feature">
          <div className="landing-feature-icon" aria-hidden>🔒</div>
          <h3>Güvenli ve hızlı altyapı</h3>
          <p>
            Veriler Supabase (PostgreSQL) üzerinde; RLS ile erişim kısıtlanabilir. Next.js
            App Router ve modern React ile hızlı, güvenilir bir deneyim sunulur. Push
            bildirimi şu an yok; sadece panel açıkken ses ve toast ile bildirim yapılır.
          </p>
        </div>
      </section>

      <section className="landing-cta-section">
        <p style={{ margin: 0, color: '#475569', fontSize: '0.9375rem' }}>
          Randevularınızı tek yerden yönetin.
        </p>
        <Link href="/admin/mehmet-berber" className="landing-cta">
          Berber paneline git
        </Link>
      </section>

      <footer className="landing-footer">
        <p style={{ margin: 0 }}>
          Groomio — Berber randevu yönetimi ·{' '}
          <Link href="/admin/mehmet-berber">Admin panel</Link>
        </p>
      </footer>
    </div>
  );
}

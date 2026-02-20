'use client';

import { useParams } from 'next/navigation';
import Link from 'next/link';

export default function AdminRedirectPage() {
  const params = useParams();
  const barberSlug = params?.barberSlug as string;

  return (
    <div className="page-container">
      <h1 className="admin-title">Admin panel</h1>
      <p className="admin-subtitle">
        Bu sayfaya erişmek için doğru admin linki (gizli anahtar ile) kullanmanız gerekir.
        Linki berber paneline girişte aldınız.
      </p>
      <p style={{ marginTop: 16 }}>
        <Link href="/">Ana sayfa</Link>
      </p>
    </div>
  );
}

# Card Zone TCG Registration

Aplikasi Next.js full-stack: form dan API berada dalam satu project, sedangkan data disimpan di Supabase PostgreSQL.

## Menjalankan lokal

```bash
npm install
cp .env.example .env.local
npm run dev
```

## Menyiapkan database

1. Buat project baru di [Supabase](https://supabase.com).
2. Buka **SQL Editor**, jalankan isi `supabase/schema.sql`.
3. Buka **Settings → API Keys** dan salin Project URL serta **Secret key** (`sb_secret_...`).
4. Isi `.env.local`:

```env
SUPABASE_URL=https://PROJECT.supabase.co
SUPABASE_SECRET_KEY=sb_secret_anda
```

`SUPABASE_SECRET_KEY` hanya digunakan Route Handler di server. Jangan memakai prefix `NEXT_PUBLIC_` dan jangan memasukkannya ke Git. Legacy `service_role` key juga masih didukung oleh kode ini bila project Anda masih menggunakannya.

## Deploy Vercel

1. Push repository ke GitHub.
2. Import repository di [Vercel](https://vercel.com/new).
3. Tambahkan environment variables `SUPABASE_URL` dan `SUPABASE_SECRET_KEY` pada **Project Settings → Environment Variables**.
4. Deploy.

Vercel menjalankan halaman frontend dan `app/api/registrations/route.ts` dalam deployment yang sama.

# Pasara'ta Frontend

Frontend aplikasi Pasara'ta dibangun dengan Next.js 16 App Router.

## Prasyarat

- Node.js 20+
- npm

## Instalasi

1. Install dependency:
```bash
npm install
```

2. Salin environment contoh:
```bash
copy .env.local.example .env.local
```

3. Pastikan API backend berjalan di `http://localhost:8080`.

## Menjalankan aplikasi

```bash
npm run dev
```

Aplikasi frontend akan tersedia di `http://localhost:3000`.

## Role demo

- Admin: `admin` / `admin123`
- Pendata: gunakan akun yang dibuat oleh admin melalui backend API

## Struktur proyek

- `app/` — halaman Next.js
- `components/` — komponen reusable
- `lib/` — API client dan type data

# Pasara'ta Frontend

Aplikasi antarmuka web modern untuk **Pasara'ta** — Sistem Digitalisasi Pendataan Harga Komoditas Pasar BPS Jeneponto.

Frontend ini dibangun menggunakan framework **Next.js 16 (App Router)**, **React 19**, **TypeScript**, dan **Tailwind CSS v4**. Menyajikan pengalaman pengguna (*User Experience*) yang cepat, interaktif, responsif, dan intuitif untuk petugas pendata di lapangan maupun administrator BPS dalam melakukan survei, pemantauan, analisis, dan rekapitulasi harga komoditas pasar.

---

## 📌 Deskripsi Singkat

Pasara'ta Frontend memfasilitasi dua peran utama (*roles*):
1. **Petugas Pendata (Collector)**: Memasukkan data survei harga di pasar-pasar yang ditugaskan dengan dukungan kalkulasi konversi satuan otomatis secara *real-time*, deteksi anomali/peringatan harga tanpa menghambat proses input, serta pengelolaan riwayat data pribadi.
2. **Administrator BPS**: Memantau statistik sebaran data secara *real-time*, mengelola akun pengguna dan penugasan pasar (*many-to-many*), mengelola data master, mereview dan memvalidasi seluruh entri data, menganalisis komparasi harga antar periode tahun, mengimpor dokumen Excel/CSV dengan *smart column detection*, serta mengunduh laporan rekapitulasi dalam format Excel (.xlsx) dan CSV.

---

## 🚀 Fitur Utama

### 1. 🔐 Autentikasi & Navigasi Terintegrasi
- **Halaman Login Tunggal**: Satu portal masuk terpadu untuk Admin dan Petugas Pendata.
- **Role-Based Routing & Protection**: Pengalihan halaman otomatis ke portal `/admin` atau `/collector` berdasarkan role akun, dengan penyimpanan sesi token JWT yang aman di `localStorage`.
- **Informasi Sesi & Logout**: Header dinamis yang menampilkan identitas pengguna aktif, role, dan tombol logout.

---

### 2. 📱 Portal Petugas Pendata (`/collector`)
- **Form Input Data Survei Interaktif**:
  - Pilihan pasar tugas yang dibatasi sesuai penugasan aktif dari Admin.
  - Pemilihan tahun/periode survei, kategori komoditas, dan komoditas.
  - Input jenis/merek komoditas secara bebas (fleksibel sesuai temuan lapangan).
  - Input kuantitas, bobot/isi, satuan lokal, dan pilihan satuan standar.
  - Input harga pasar saat ini, referensi harga min/max, harga periode sebelumnya, serta catatan kondisi lapangan.
- **Kalkulasi & Validasi Real-Time**:
  - Menghitung harga per satuan standar secara otomatis saat petugas mengetik.
  - Menampilkan badge indikator status harga secara visual:
    - 🟢 **Normal**: Harga berada dalam rentang wajar.
    - 🟡 **Di Bawah Minimum**: Harga di bawah rentang minimum wajar.
    - 🔴 **Di Atas Maksimum**: Harga di atas rentang maksimum wajar.
  - *Non-blocking warning*: Peringatan harga tidak memblokir simpan data agar survei tetap berjalan lancar.
- **Auto-Fill Referensi Harga**:
  - Otomatis mengambil dan mengisi data batas harga historis dari database saat komoditas dipilih.
- **Dashboard Ringkasan Pribadi**:
  - 4 Kartu Metrik: Jumlah Pasar Ditugaskan, Total Entri Aktif, Total Data Warning, dan Entri yang Dapat Diedit.
  - Filter tahun pendataan untuk analisis riwayat kerja.
  - Tag daftar pasar yang ditugaskan kepada petugas.
- **Modul "Data Saya"**:
  - Tabel riwayat entri yang diinput oleh petugas yang bersangkutan.
  - Fitur pencarian dan filter tahun entri.
  - Aksi **Edit Entri**: Mengisi kembali form input untuk pembaruan cepat.
  - Aksi **Batalkan / Nonaktifkan Entri**: Menandai entri yang keliru (*soft-deactivation*).
  - Modal **Riwayat Audit**: Memeriksa jejak histori perubahan data entri bersangkutan.

---

### 3. 🖥️ Portal Administrator (`/admin`)
- **Dashboard Monitoring & Sebaran Data**:
  - 5 Kartu KPI Eksekutif: Total Pendata, Total Pasar, Total Komoditas, Total Data Entri, dan Data Warning.
  - Tab Sebaran Data Interaktif:
    - 📅 **Per Tahun**: Agregasi total entri, jumlah warning, dan persentase kelayakan data.
    - 🏪 **Per Pasar**: Distribusi entri dan warning per lokasi pasar.
    - 👤 **Per Pendata**: Statistik produktivitas dan kualitas data masing-masing petugas.
    - ⚡ **10 Entri Terbaru**: Umpan data survei harga yang baru saja masuk secara langsung.
- **Modul Penugasan Pasar (Assignment)**:
  - Manajemen penugasan petugas ke pasar dengan model relasi *many-to-many*.
  - Pembuatan penugasan baru dan pencabutan/penghapusan penugasan yang sudah ada.
  - Filter pencarian petugas maupun pasar.
- **Modul Review & Verifikasi Data Entri**:
  - Tampilan tabel komprehensif seluruh data entri dari semua pasar dan petugas.
  - Filter multi-dimensi: filter tahun, pasar, petugas, status warning, dan kata kunci pencarian.
  - Aksi **Edit Entri oleh Admin**: Modal formulir lengkap untuk mengoreksi data di lapangan.
  - Aksi **Hapus Entri**: Penghapusan data entri yang tidak valid.
  - Modal **Audit Trail**: Peninjauan log histori modifikasi data sebelum dan sesudah perubahan (*before-after diff*).
- **Modul Perbandingan Harga (Comparison)**:
  - Tabel analisis fluktuasi harga komoditas tahun berjalan vs tahun sebelumnya.
  - Kalkulasi otomatis nominal selisih harga dan persentase kenaikan/penurunan harga pasar.
- **Modul Rekapitulasi Harga (Summary)**:
  - Ringkasan statistik harga minimum, harga maksimum, dan rata-rata harga pasar per komoditas.
  - Filter berdasarkan tahun dan pasar.
  - Fitur **Export Report**: Mengunduh rekapitulasi langsung dalam format Excel (**XLSX**) atau **CSV**.
- **Modul Smart Import Data**:
  - Upload file spreadsheet Excel (.xlsx) atau CSV.
  - *Column Auto-Inspector*: Menyesuaikan berbagai variasi nama header kolom secara otomatis.
  - Tab Pratinjau (*Preview*) yang menampilkan baris data valid dan baris bermasalah beserta alasannya sebelum dilakukan penyimpanan (*commit*).
  - Mendukung import data entri harga maupun import data master.
- **Modul Manajemen Data Master**:
  - **Pasar**: Tambah, ubah, dan aktifkan/nonaktifkan master pasar, wilayah, dan NKS.
  - **Kategori Komoditas**: Tambah, ubah, dan aktifkan/nonaktifkan kategori.
  - **Komoditas**: Tambah, ubah, dan aktifkan/nonaktifkan data komoditas serta relasi kategori.
  - **Satuan**: Tambah, ubah, dan atur faktor konversi satuan ke satuan standar BPS.
- **Modul Manajemen Pengguna**:
  - Pembuatan akun petugas pendata baru.
  - Pembaruan nama & profil petugas pendata.
  - Toggle status akun aktif / nonaktif.
  - Fitur reset password petugas pendata langsung oleh Admin.

---

## 🛠️ Teknologi & Dependensi

| Kategori | Teknologi | Deskripsi |
|---|---|---|
| **Framework Utama** | Next.js 16 (App Router) | React framework untuk performa, SSR, dan routing modern |
| **Library UI** | React 19 (`react`, `react-dom`) | Library declarative UI terkini |
| **Bahasa Pemrograman** | TypeScript 5 | Type safety dan skalabilitas kode frontend |
| **Styling & Desain** | Tailwind CSS v4 (`@tailwindcss/postcss`) | Utility-first CSS framework untuk antarmuka modern & responsif |
| **Linting & Standar** | ESLint 9 (`eslint-config-next`) | Penjagaan kualitas dan konsistensi kode |

---

## 📋 Prasyarat Sistem

Pastikan environment Anda telah terpasang:
- **Node.js**: versi 20.x atau lebih baru ([Unduh Node.js](https://nodejs.org/))
- **npm**: versi 10.x atau lebih baru (disertakan bersama Node.js)
- **Backend Pasara'ta API**: berjalan di `http://localhost:8080` (atau sesuai konfigurasi)

---

## ⚙️ Instalasi & Konfigurasi

1. **Buka direktori frontend:**
   ```bash
   cd frontend-pasarata
   ```

2. **Install seluruh dependensi proyek:**
   ```bash
   npm install
   ```

3. **Salin dan sesuaikan file environment:**
   ```bash
   copy .env.local.example .env.local
   ```

4. **Konfigurasi isi file `.env.local`:**
   ```env
   NEXT_PUBLIC_API_BASE_URL=http://localhost:8080/api
   ```

---

## 🏃 Menjalankan Aplikasi

### Mode Development (Pengembangan)
Jalankan dev server dengan hot reload:

```bash
npm run dev
```

Aplikasi frontend akan tersedia dan dapat diakses di peramban pada alamat: `http://localhost:3000`

### Mode Production (Build & Start)
Untuk menguji performa produksi:

```bash
npm run build
npm run start
```

---

## 👤 Akun & Peran Akses Demo

| Role | Username | Password | Akses URL |
|---|---|---|---|
| **Admin** | `admin` | `admin123` | `http://localhost:3000/admin` |
| **Pendata** | Dibuat oleh Admin | Ditentukan oleh Admin | `http://localhost:3000/collector` |

---

## 📂 Struktur Direktori

```text
frontend-pasarata/
├── app/
│   ├── admin/                   # Portal & komponen dashboard Administrator
│   │   └── page.tsx             # Halaman utama Admin dengan multi-panel navigasi
│   ├── collector/               # Portal & komponen dashboard Petugas Pendata
│   │   ├── page.tsx             # Halaman utama Collector (Ringkasan & navigasi)
│   │   ├── entry-form.tsx       # Formulir input survei harga & live calculation
│   │   └── entry-list.tsx       # Tabel daftar "Data Saya", edit, & audit trail
│   ├── favicon.ico              # Favicon aplikasi
│   ├── globals.css              # Setup CSS dasar & import Tailwind CSS v4
│   ├── layout.tsx               # Root layout & konfigurasi font
│   └── page.tsx                 # Halaman login terpadu (landing page auth)
├── components/
│   ├── admin-management.tsx     # Panel manajemen Master Data & Pengguna Pendata
│   ├── assignment-panel.tsx     # Panel penugasan pasar ke petugas pendata
│   ├── comparison-panel.tsx     # Panel komparasi harga tahun berjalan vs lalu
│   ├── dashboard-shell.tsx      # Shell layout wrapper (Sidebar, Header, Navigasi)
│   ├── entry-review-panel.tsx   # Panel review, filter, edit, hapus, & audit data entri
│   ├── icons.tsx                # Kumpulan komponen SVG ikon UI teroptimasi
│   ├── import-panel.tsx         # Panel smart import Excel/CSV & data preview
│   ├── login-form.tsx           # Komponen formulir login terautentikasi
│   └── summary-panel.tsx        # Panel rekapitulasi harga (min/max/avg) & export
├── lib/
│   ├── api.ts                   # HTTP client library pembungkus endpoint backend
│   └── types.ts                 # Definisi tipe data TypeScript & interface DTO
├── public/                      # Asset statis publik (logo, gambar, dsb.)
├── .env.local.example           # Template environment variable frontend
├── next.config.ts               # Konfigurasi Next.js
├── package.json                 # Daftar dependensi & script runner
├── postcss.config.mjs           # Konfigurasi PostCSS Tailwind
└── tsconfig.json                # Konfigurasi compiler TypeScript
```

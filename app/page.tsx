'use client';

import { useState } from 'react';
import { LoginForm } from '@/components/login-form';

export default function HomePage() {
  const [isLoginOpen, setIsLoginOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 selection:bg-emerald-500 selection:text-white">
      {/* ── 1. NAVBAR ────────────────────────────────────────────── */}
      <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3.5 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <img src="/logo-pasarata.png" alt="Logo Pasara'ta" className="h-10 w-auto object-contain" />
            <div>
              {/* <span className="text-lg font-black tracking-tight text-slate-900">
                Pasara<span className="text-emerald-600">&apos;ta&apos;</span>
              </span>
              <span className="ml-2 hidden rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700 sm:inline-block border border-emerald-200">
                BPS Jeneponto
              </span> */}
            </div>
          </div>

          <nav className="hidden items-center gap-7 text-sm font-medium text-slate-600 md:flex">
            <a href="#home" className="transition hover:text-emerald-600">
              Beranda
            </a>
            <a href="#about" className="transition hover:text-emerald-600">
              Latar Belakang
            </a>
            <a href="#conversion" className="transition hover:text-emerald-600">
              Konversi 3 Pilar
            </a>
            <a href="#features" className="transition hover:text-emerald-600">
              Fitur Unggulan
            </a>
            <a href="#workflow" className="transition hover:text-emerald-600">
              Alur Kerja
            </a>
          </nav>

          <div className="flex items-center gap-3">
            <button
              id="btn-nav-login"
              type="button"
              onClick={() => setIsLoginOpen(true)}
              className="inline-flex items-center justify-center rounded-xl bg-emerald-600 px-5 py-2 text-xs font-bold text-white shadow-sm transition hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2"
            >
              Login
            </button>
          </div>
        </div>
      </header>

      {/* ── 2. HERO SECTION ──────────────────────────────────────── */}
      <section id="home" className="relative overflow-hidden bg-gradient-to-b from-emerald-50/50 via-white to-slate-50 pt-12 pb-20 lg:pt-20 lg:pb-28">
        {/* Decorative subtle background blobs */}
        <div className="pointer-events-none absolute -top-40 right-0 h-96 w-96 rounded-full bg-emerald-200/30 blur-3xl" />
        <div className="pointer-events-none absolute top-1/2 left-0 h-96 w-96 rounded-full bg-teal-100/40 blur-3xl" />

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-12 lg:grid-cols-[1.15fr_0.85fr] lg:items-center">
            {/* Left Col: Hero Information */}
            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50/80 px-3.5 py-1 text-xs font-semibold text-emerald-800 backdrop-blur-sm">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                Sistem Pendataan Komoditas Pasar Berbasis Digital
              </div>

              <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl lg:text-6xl lg:leading-[1.15]">
                Pendataan Rentang Harga Komoditas Pasar <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-teal-600">Akurat & Terstandarisasi</span>
              </h1>

              <p className="max-w-xl text-base text-slate-600 sm:text-lg leading-relaxed">
                Mendigitalisasi seluruh rangkaian pendataan harga pasar Badan Pusat Statistik (BPS) Kabupaten Jeneponto. Mencegah kesalahan input, mengotomasi kalkulasi konversi satuan universal, dan mempercepat rekonsiliasi data dari berhari-hari menjadi hitungan menit.
              </p>

              <div className="flex flex-wrap gap-3 pt-2">
                <button
                  id="btn-hero-login"
                  type="button"
                  onClick={() => setIsLoginOpen(true)}
                  className="rounded-xl bg-emerald-600 px-6 py-3.5 text-sm font-bold text-white shadow-lg shadow-emerald-600/25 transition hover:bg-emerald-700 hover:scale-[1.02] active:scale-[0.98]"
                >
                  Mulai Pendataan Lapangan →
                </button>
                <a
                  href="#about"
                  className="rounded-xl border border-slate-200 bg-white px-6 py-3.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
                >
                  Pelajari Sistem
                </a>
              </div>

              {/* Quick Metrics */}
              <div className="grid grid-cols-2 gap-3 pt-6 sm:grid-cols-4">
                <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm">
                  <div className="text-2xl font-black text-slate-900">24+</div>
                  <div className="text-xs font-medium text-slate-500">Pasar Binaan</div>
                </div>
                <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm">
                  <div className="text-2xl font-black text-emerald-600">180+</div>
                  <div className="text-xs font-medium text-slate-500">Komoditas Pokok</div>
                </div>
                <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm">
                  <div className="text-2xl font-black text-teal-600">3 Pilar</div>
                  <div className="text-xs font-medium text-slate-500">Kalkulasi Universal</div>
                </div>
                <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm">
                  <div className="text-2xl font-black text-amber-600">Real-time</div>
                  <div className="text-xs font-medium text-slate-500">Deteksi Warning</div>
                </div>
              </div>
            </div>

            {/* Right Col: Interactive System Preview Showcase Card */}
            <div className="relative">
              <div className="absolute -inset-2 rounded-3xl bg-gradient-to-tr from-emerald-500/20 to-teal-500/20 blur-xl" />
              <div className="relative rounded-3xl border border-slate-200 bg-white p-6 shadow-xl sm:p-8 space-y-6">
                <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                  <div className="flex items-center gap-2.5">
                    <span className="flex h-3 w-3 rounded-full bg-emerald-500 animate-ping" />
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-800">
                      Live Simulation Dashboard
                    </span>
                  </div>
                  <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-800">
                    BPS Engine Active
                  </span>
                </div>

                {/* Simulation Entry Card */}
                <div className="rounded-2xl border border-slate-100 bg-slate-50/80 p-4 space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-800">Beras Medium (Pasar Karisa)</span>
                    <span className="rounded bg-emerald-100 px-2 py-0.5 font-bold text-emerald-800">✓ Rentang Wajar</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-center text-xs">
                    <div className="rounded-lg bg-white p-2 border border-slate-200/60">
                      <div className="text-[10px] text-slate-500">Harga Lapangan</div>
                      <div className="font-bold text-slate-900">Rp 12.000</div>
                    </div>
                    <div className="rounded-lg bg-white p-2 border border-slate-200/60">
                      <div className="text-[10px] text-slate-500">Isi Bersih</div>
                      <div className="font-bold text-slate-900">0.89 kg</div>
                    </div>
                    <div className="rounded-lg bg-white p-2 border border-slate-200/60">
                      <div className="text-[10px] text-slate-500">Harga Standar</div>
                      <div className="font-bold text-emerald-700">Rp 13.483/kg</div>
                    </div>
                  </div>
                </div>

                <div className="rounded-xl border border-amber-200 bg-amber-50/70 p-3.5 text-xs text-amber-900 flex items-start gap-2.5">
                  <span className="text-base">🛡️</span>
                  <div>
                    <span className="font-bold">Proteksi Data Terpadu:</span> Akses sistem diproteksi dengan otentikasi role Admin & Pendata BPS Jeneponto.
                  </div>
                </div>

                <button
                  id="btn-showcase-login"
                  type="button"
                  onClick={() => setIsLoginOpen(true)}
                  className="w-full rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 px-5 py-3.5 text-sm font-bold text-white shadow-md shadow-emerald-600/20 transition hover:from-emerald-700 hover:to-teal-700"
                >
                  Masuk ke Akun Anda (Login) →
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── 3. LATAR BELAKANG & MASALAH YANG DISELESAIKAN ──────────── */}
      <section id="about" className="border-t border-slate-200/80 bg-white py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <p className="text-xs font-bold uppercase tracking-widest text-emerald-600">Latar Belakang & Urgensi</p>
            <h2 className="mt-2 text-3xl font-extrabold text-slate-900 sm:text-4xl">
              Tantangan Pendataan Konvensional yang Diselesaikan Pasara&apos;ta&apos;
            </h2>
            <p className="mt-4 text-base text-slate-600">
              Sebelumnya, pendataan rentang harga komoditas pasar masih banyak menggunakan kertas, spreadsheet, dan verifikasi manual yang memakan waktu 2–3 hari. Pasara&apos;ta&apos; hadir menjawab setiap kendala lapangan.
            </p>
          </div>

          <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            <ProblemCard
              icon="✍️"
              title="Input Manual & Human Error"
              problem="Petugas menginput secara manual di kertas/spreadsheet dengan risiko tinggi salah ketik nominal."
              solution="Formulir digital terpandu dengan validasi otomatis dan deteksi batas harga wajar."
            />
            <ProblemCard
              icon="🧮"
              title="Variasi Kemampuan Matematika"
              problem="Petugas di lapangan tidak selalu memiliki kemampuan perhitungan matematis yang seragam."
              solution="Sistem mengotomasi seluruh hitungan standar harga tanpa perlu kalkulasi manual oleh petugas."
            />
            <ProblemCard
              icon="⏳"
              title="Pengecekan Ulang 2-3 Hari"
              problem="Pemeriksaan satu per satu setelah petugas mengumpulkan data sangat lambat dan melelahkan."
              solution="Validasi instan, rekapitulasi kolektif otomatis, dan visualisasi data seketika."
            />
            <ProblemCard
              icon="⚖️"
              title="Keragaman Satuan Lokal"
              problem="Komoditas dijual dalam satuan lokal berbeda-beda (Liter, Butir, Ikat, Bungkus ±80gr, Kotak kecil ±150gr, Porsi, dll)."
              solution="Rumus konversi 3 pilar menstandarisasi semua satuan ke ekuivalen per kilogram secara universal."
            />
            <ProblemCard
              icon="🏪"
              title="Rentang Harga Antar Pasar"
              problem="Harga komoditas bervariasi antar-pasar dan sulit membandingkan tren dengan periode sebelumnya."
              solution="Auto-Price Reference dari data tahun sebelumnya (T-1) untuk menentukan batas min/max."
            />
            <ProblemCard
              icon="🔐"
              title="Segregasi Hak Akses & Penugasan"
              problem="Satu pendata mengawasi beberapa pasar dan satu pasar memiliki beberapa pendata tanpa batas privasi data."
              solution="Manajemen akun RBAC (Role-Based Access Control) dan penugasan pasar dinamis."
            />
          </div>
        </div>
      </section>

      {/* ── 4. RUMUS KONVERSI 3 PILAR ────────────────────────────── */}
      <section id="conversion" className="border-t border-slate-200/80 bg-slate-50 py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-emerald-600">Standardisasi Universal</p>
              <h2 className="mt-2 text-3xl font-extrabold text-slate-900 sm:text-4xl">
                Variabel Perhitungan 3 Pilar Konversi Satuan
              </h2>
              <p className="mt-4 text-slate-600 leading-relaxed">
                Sistem dirancang dengan fleksibilitas kalkulasi dinamis untuk seluruh jenis komoditas. Pendata tidak perlu menghitung manual; cukup memasukkan 3 parameter utama:
              </p>

              <div className="mt-6 space-y-4">
                <div className="flex items-start gap-3 rounded-xl border border-slate-200 bg-white p-4">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-100 text-sm font-bold text-emerald-800">
                    1
                  </div>
                  <div>
                    <div className="font-bold text-slate-900">Nilai Harga Pasar (P)</div>
                    <div className="text-xs text-slate-500">Harga riil transaksi yang ditemukan petugas di pasar untuk satuan lokal tersebut.</div>
                  </div>
                </div>

                <div className="flex items-start gap-3 rounded-xl border border-slate-200 bg-white p-4">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-teal-100 text-sm font-bold text-teal-800">
                    2
                  </div>
                  <div>
                    <div className="font-bold text-slate-900">Bobot atau Isi Bersih Aktual (W)</div>
                    <div className="text-xs text-slate-500">Berat aktual dalam satuan kilogram (misal: 1 liter beras = 0.89 kg, atau bungkus mi = 0.08 kg).</div>
                  </div>
                </div>

                <div className="flex items-start gap-3 rounded-xl border border-slate-200 bg-white p-4">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-sky-100 text-sm font-bold text-sky-800">
                    3
                  </div>
                  <div>
                    <div className="font-bold text-slate-900">Kuantitas atau Pembagian Satuan (Q)</div>
                    <div className="text-xs text-slate-500">Banyaknya kemasan/ikat/satuan lokal yang dibeli (misal: 1 ikat, 5 potong, atau 1 liter).</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Formula Card Demonstration */}
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xl sm:p-8">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Rumus Universal BPS</span>
                <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-800">
                  Target Standar: 1 Kg
                </span>
              </div>

              <div className="my-6 rounded-2xl bg-slate-900 p-5 text-center text-white">
                <div className="text-xs font-medium text-slate-400">Formula Standar Konversi:</div>
                <div className="mt-2 font-mono text-lg font-bold text-emerald-400 sm:text-xl">
                  Harga Standar = (P / (Q × W)) × Standar
                </div>
              </div>

              <div className="space-y-3 text-xs text-slate-600">
                <div className="font-bold text-slate-800">Contoh Simulasi Nyata (Beras 1 Liter):</div>
                <div className="grid grid-cols-2 gap-2 rounded-xl bg-slate-50 p-3">
                  <div>Harga Pasar (P): <span className="font-semibold text-slate-900">Rp 10.000</span></div>
                  <div>Bobot Riil (W): <span className="font-semibold text-slate-900">0.89 kg</span> (890 gr)</div>
                  <div>Kuantitas (Q): <span className="font-semibold text-slate-900">1</span> Liter</div>
                  <div>Satuan Standar: <span className="font-semibold text-slate-900">1.0 kg</span> (1.000 gr)</div>
                </div>
                <div className="rounded-xl border border-emerald-200 bg-emerald-50/80 p-3.5 text-emerald-900">
                  <span className="font-bold">Hasil Perhitungan Sistem:</span> Rp 10.000 ÷ (1 × 0.89) × 1.0 ={' '}
                  <span className="font-bold text-emerald-800">Rp 11.235,96 / kg</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── 5. FITUR UNGGULAN SISTEM ─────────────────────────────── */}
      <section id="features" className="border-t border-slate-200/80 bg-white py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <p className="text-xs font-bold uppercase tracking-widest text-emerald-600">Kapabilitas Platform</p>
            <h2 className="mt-2 text-3xl font-extrabold text-slate-900 sm:text-4xl">
              Fitur Lengkap Sesuai Standar Operasional BPS
            </h2>
            <p className="mt-4 text-base text-slate-600">
              Setiap modul dirancang spesifik untuk kebutuhan administrasi data statistik pasar yang aman, transparan, dan terintegrasi.
            </p>
          </div>

          <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            <FeatureCard
              icon="⚠️"
              title="Warning Engine Non-Blocking"
              desc="Mendeteksi harga di bawah minimum atau di atas maksimum berdasarkan tren historis tanpa memblokir input di lapangan jika terjadi anomali harga riil."
            />
            <FeatureCard
              icon="🔄"
              title="Auto Price Reference (T-1)"
              desc="Otomatis menyajikan harga acuan tahun sebelumnya berdasarkan pasar & komoditas untuk memudahkan pengisian harga min/max/sebelumnya."
            />
            <FeatureCard
              icon="📑"
              title="Import & Export Fleksibel"
              desc="Import file Excel/CSV dengan deteksi kolom dan pemetaan kolom bebas. Export laporan dalam format Excel (.xlsx) dan CSV resmi BPS."
            />
            <FeatureCard
              icon="🏷️"
              title="Kebebasan Varian Merek"
              desc="Pendata bebas menginputkan jenis/merek apa pun yang ditemukan di pasar tanpa terikat daftar kaku atau penggabungan paksa (auto-merge)."
            />
            <FeatureCard
              icon="📊"
              title="Dashboard Monitoring 360°"
              desc="Pemantauan sebaran data berdasarkan tahun, pasar, pendata, status warning, dan ringkasan perbandingan disparitas harga."
            />
            <FeatureCard
              icon="🛡️"
              title="Audit Trail & Histori Lengkap"
              desc="Merekam setiap aktivitas tambah, ubah, nonaktifkan, dan hapus data lengkap dengan penanggung jawab, timestamp, serta snapshot nilai."
            />
          </div>
        </div>
      </section>

      {/* ── 6. ALUR KERJA SISTEM (WORKFLOW) ──────────────────────── */}
      <section id="workflow" className="border-t border-slate-200/80 bg-slate-50 py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <p className="text-xs font-bold uppercase tracking-widest text-emerald-600">Siklus Kerja</p>
            <h2 className="mt-2 text-3xl font-extrabold text-slate-900 sm:text-4xl">
              Alur Kerja Terpadu Pasara&apos;ta&apos;
            </h2>
            <p className="mt-4 text-base text-slate-600">
              Integrasi end-to-end dari persiapan master data oleh Admin hingga pelaporan akhir.
            </p>
          </div>

          <div className="mt-14 grid gap-6 md:grid-cols-4">
            <WorkflowStep
              step="01"
              role="Administrator"
              title="Setup Master & Penugasan"
              desc="Admin mengelola komoditas, kategori, satuan standar, dan menugaskan pasar ke akun pendata."
            />
            <WorkflowStep
              step="02"
              role="Petugas Pendata"
              title="Input Data di Lapangan"
              desc="Pendata login, memilih pasar binaan, dan menginput harga, satuan lokal, serta merek produk."
            />
            <WorkflowStep
              step="03"
              role="Mesin Sistem"
              title="Validasi & Konversi 3 Pilar"
              desc="Sistem menghitung harga standar per kg, mencocokkan referensi tahun lalu, dan menandai status warning."
            />
            <WorkflowStep
              step="04"
              role="Pelaporan (Output)"
              title="Rekapitulasi & Export Excel"
              desc="Admin meninjau hasil pendataan seluruh pasar, memantau audit log, dan mengunduh laporan formal."
            />
          </div>
        </div>
      </section>

      {/* ── 7. FOOTER ────────────────────────────────────────────── */}
      <footer className="border-t border-slate-200 bg-white py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center justify-between gap-8 md:flex-row">
            <div className="flex items-center gap-3">
              <img src="/logo-pasarata.png" alt="Logo Pasara'ta" className="h-10 w-auto object-contain" />
              <div>
                {/* <span className="text-base font-bold text-slate-900">
                  Pasara<span className="text-emerald-600">&apos;ta&apos;</span>
                </span> */}
                <p className="text-xs text-slate-500">
                  Sistem Pendataan Komoditas Pasar BPS Kabupaten Jeneponto
                </p>
              </div>
            </div>

            {/* Navigation links
            <div className="flex flex-wrap justify-center gap-6 text-xs font-medium text-slate-600">
              <a href="#home" className="hover:text-emerald-600">Beranda</a>
              <a href="#about" className="hover:text-emerald-600">Latar Belakang</a>
              <a href="#conversion" className="hover:text-emerald-600">Konversi 3 Pilar</a>
              <a href="#features" className="hover:text-emerald-600">Fitur</a>
              <a href="#workflow" className="hover:text-emerald-600">Alur Kerja</a>
            </div> */}

            {/* Credit Badge */}
            <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2 text-xs text-slate-700 shadow-sm">
              <svg className="h-4 w-4 fill-current text-slate-800" viewBox="0 0 24 24">
                <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
              </svg>
              <span>
                Dibuat oleh:{' '}
                <a
                  href="https://github.com/salsabilaputri95"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-bold text-emerald-700 hover:text-emerald-800 hover:underline"
                >
                  Thinkerstone
                </a>
              </span>
            </div>
          </div>

          <div className="mt-8 border-t border-slate-100 pt-6 text-center text-xs text-slate-400">
            © {new Date().getFullYear()} Pasara&apos;ta&apos; — Badan Pusat Statistik (BPS) Kabupaten Jeneponto. Seluruh hak cipta dilindungi.
          </div>
        </div>
      </footer>

      {/* ── 8. LOGIN MODAL OVERLAY ────────────────────────────────── */}
      {isLoginOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div
            className="fixed inset-0"
            onClick={() => setIsLoginOpen(false)}
            aria-hidden="true"
          />
          <div className="relative z-10 w-full max-w-md">
            <LoginForm onClose={() => setIsLoginOpen(false)} />
          </div>
        </div>
      )}
    </div>
  );
}

// ── SUBCOMPONENTS ───────────────────────────────────────────────

function ProblemCard({ icon, title, problem, solution }: { icon: string; title: string; problem: string; solution: string }) {
  return (
    <div className="flex flex-col justify-between rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm transition hover:border-emerald-200 hover:shadow-md">
      <div>
        <div className="text-2xl">{icon}</div>
        <h3 className="mt-3 text-base font-bold text-slate-900">{title}</h3>
        <div className="mt-3 space-y-2 text-xs">
          <div className="rounded-lg bg-rose-50 p-2.5 text-rose-800">
            <span className="font-bold text-rose-900">Kendala:</span> {problem}
          </div>
          <div className="rounded-lg bg-emerald-50 p-2.5 text-emerald-800">
            <span className="font-bold text-emerald-900">Solusi Pasara&apos;ta&apos;:</span> {solution}
          </div>
        </div>
      </div>
    </div>
  );
}

function FeatureCard({ icon, title, desc }: { icon: string; title: string; desc: string }) {
  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm transition hover:border-emerald-200 hover:shadow-md">
      <div className="text-2xl">{icon}</div>
      <h3 className="mt-3 text-base font-bold text-slate-900">{title}</h3>
      <p className="mt-2 text-xs text-slate-600 leading-relaxed">{desc}</p>
    </div>
  );
}

function WorkflowStep({ step, role, title, desc }: { step: string; role: string; title: string; desc: string }) {
  return (
    <div className="relative rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="text-3xl font-black text-emerald-600/30">{step}</div>
      <div className="mt-1 text-[11px] font-bold uppercase tracking-wider text-emerald-700">{role}</div>
      <h3 className="mt-1 text-sm font-bold text-slate-900">{title}</h3>
      <p className="mt-2 text-xs text-slate-600 leading-relaxed">{desc}</p>
    </div>
  );
}

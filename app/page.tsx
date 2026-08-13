import { LoginForm } from '@/components/login-form';

export default function HomePage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-emerald-50 via-white to-slate-100 px-4 py-10">
      <div className="w-full max-w-6xl rounded-3xl border border-emerald-100 bg-white/80 p-6 shadow-2xl backdrop-blur sm:p-10">
        <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.28em] text-emerald-600">Pasara'ta</p>
            <h1 className="mt-3 text-4xl font-black tracking-tight text-slate-900 sm:text-5xl">
              Sistem pendataan komoditas pasar berbasis digital
            </h1>
            <p className="mt-5 max-w-xl text-lg text-slate-600">
              Memudahkan Admin dan Pendata mengelola harga komoditas, validasi warning,
              konversi satuan, serta rekap data per pasar dan per tahun secara lebih akurat dan efisien.
            </p>

            <div className="mt-8 grid gap-4 sm:grid-cols-3">
              <Stat label="Pasar" value="24" />
              <Stat label="Komoditas" value="180+" />
              <Stat label="Warning" value="Real-time" />
            </div>
          </div>

          <LoginForm />
        </div>
      </div>
    </main>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <div className="text-2xl font-bold text-slate-900">{value}</div>
      <div className="text-sm text-slate-600">{label}</div>
    </div>
  );
}

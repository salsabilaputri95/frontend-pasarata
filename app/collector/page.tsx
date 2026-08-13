'use client';

import { useEffect, useState } from 'react';
import { DashboardShell } from '@/components/dashboard-shell';
import { api } from '@/lib/api';
import { CollectorEntryForm } from './entry-form';

export default function CollectorDashboardPage() {
  const [summary, setSummary] = useState<{ total_entries: number; warning_entries: number } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('pasarata_token');
    if (!token) return;

    api.dashboard(token)
      .then((data) => setSummary({ total_entries: data.total_entries, warning_entries: data.warning_entries }))
      .catch(() => setSummary({ total_entries: 0, warning_entries: 0 }))
      .finally(() => setLoading(false));
  }, []);

  return (
    <DashboardShell title="Dashboard Pendata">
      <div className="grid gap-6 md:grid-cols-3">
        <Card title="Pasar ditugaskan" value="5" />
        <Card title="Data yang diinput" value={loading ? '...' : String(summary?.total_entries ?? 0)} />
        <Card title="Data warning" value={loading ? '...' : String(summary?.warning_entries ?? 0)} />
      </div>

      <div className="mt-8">
        <div className="mb-4">
          <h2 className="text-xl font-bold text-slate-900">Form Input Data Harga</h2>
          <p className="mt-1 text-sm text-slate-600">Input hasil pendataan langsung di pasar, termasuk harga, satuan, dan catatan lapangan.</p>
        </div>
        <CollectorEntryForm />
      </div>

      <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-bold text-slate-900">Ringkasan aktivitas</h2>
        <ul className="mt-4 space-y-3 text-slate-600">
          <li>• Menginput data komoditas berdasarkan pasar, kategori, dan tahun pengumpulan.</li>
          <li>• Memeriksa harga minimum dan maksimum serta warning ketika berada di luar rentang.</li>
          <li>• Menyimpan catatan lapangan untuk menjelaskan kondisi anomali harga.</li>
        </ul>
      </div>
    </DashboardShell>
  );
}

function Card({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="text-sm font-medium text-slate-500">{title}</div>
      <div className="mt-3 text-3xl font-black text-slate-900">{value}</div>
    </div>
  );
}

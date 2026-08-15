'use client';

import { useEffect, useState } from 'react';
import { DashboardShell } from '@/components/dashboard-shell';
import { api } from '@/lib/api';
import type { CollectorDashboard, DataEntry } from '@/lib/types';
import { CollectorEntryForm } from './entry-form';
import { CollectorEntryList } from './entry-list';

export default function CollectorDashboardPage() {
  const [summary, setSummary] = useState<CollectorDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [editingEntry, setEditingEntry] = useState<DataEntry | null>(null);
  const [listRefreshKey, setListRefreshKey] = useState(0);
  const [yearFilter, setYearFilter] = useState<number | 'all'>(new Date().getFullYear());

  const loadSummary = (year: number | 'all' = yearFilter) => {
    const token = localStorage.getItem('pasarata_token');
    if (!token) return;

    setLoading(true);
    api.dashboard(token, year === 'all' ? undefined : year)
      .then((data) => setSummary(data))
      .catch(() => setSummary(null))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadSummary(yearFilter);
  }, [yearFilter]);

  const handleSaved = () => {
    setListRefreshKey((prev) => prev + 1);
    loadSummary(yearFilter);
  };

  const handleEdit = (entry: DataEntry) => {
    setEditingEntry(entry);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const yearLabel = yearFilter === 'all' ? 'semua tahun' : String(yearFilter);

  return (
    <DashboardShell title="Dashboard Pendata">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm text-slate-600">Ringkasan data Anda{yearFilter === 'all' ? '' : ` untuk tahun ${yearFilter}`}.</p>
        </div>
        <label className="block">
          <span className="mb-1 block text-sm font-medium text-slate-700">Filter tahun</span>
          <select
            value={yearFilter === 'all' ? 'all' : String(yearFilter)}
            onChange={(e) => setYearFilter(e.target.value === 'all' ? 'all' : Number(e.target.value))}
            className="input min-w-40"
          >
            <option value="all">Semua tahun</option>
            {yearOptions().map((year) => (
              <option key={year} value={year}>{year}</option>
            ))}
          </select>
        </label>
      </div>

      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
        <Card title="Pasar ditugaskan" value={loading ? '...' : String(summary?.assigned_markets ?? 0)} hint="Dari assignment Admin" />
        <Card title="Data aktif" value={loading ? '...' : String(summary?.total_entries ?? 0)} hint={yearLabel} />
        <Card title="Data warning" value={loading ? '...' : String(summary?.warning_entries ?? 0)} hint="Di luar rentang harga" />
        <Card title="Bisa diedit" value={loading ? '...' : String(summary?.editable_entries ?? 0)} hint="Entri aktif" />
      </div>

      {summary?.markets && summary.markets.length > 0 ? (
        <div className="mt-4 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600">
          <span className="font-medium text-slate-800">Pasar Anda: </span>
          {summary.markets.map((market) => market.name).join(', ')}
        </div>
      ) : null}

      <div className="mt-8">
        <div className="mb-4">
          <h2 className="text-xl font-bold text-slate-900">
            {editingEntry ? `Edit Data #${editingEntry.id}` : 'Form Input Data Harga'}
          </h2>
          <p className="mt-1 text-sm text-slate-600">
            {editingEntry
              ? 'Perbarui harga, satuan, atau catatan. Konversi dan warning akan dihitung ulang otomatis.'
              : 'Input hasil pendataan langsung di pasar, termasuk harga, satuan, dan catatan lapangan.'}
          </p>
        </div>
        <CollectorEntryForm
          editingEntry={editingEntry}
          onCancelEdit={() => setEditingEntry(null)}
          onSaved={handleSaved}
        />
      </div>

      <div className="mt-8">
        <CollectorEntryList
          refreshKey={listRefreshKey}
          yearFilter={yearFilter}
          onYearFilterChange={setYearFilter}
          onEdit={handleEdit}
          onChanged={handleSaved}
        />
      </div>
    </DashboardShell>
  );
}

function yearOptions() {
  const current = new Date().getFullYear();
  const years: number[] = [];
  for (let year = current + 1; year >= current - 5; year -= 1) {
    years.push(year);
  }
  return years;
}

function Card({ title, value, hint }: { title: string; value: string; hint?: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="text-sm font-medium text-slate-500">{title}</div>
      <div className="mt-3 text-3xl font-black text-slate-900">{value}</div>
      {hint ? <div className="mt-1 text-xs text-slate-400">{hint}</div> : null}
    </div>
  );
}

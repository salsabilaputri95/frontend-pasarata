'use client';

import { useEffect, useState } from 'react';
import { DashboardShell } from '@/components/dashboard-shell';
import { api } from '@/lib/api';
import type { CollectorDashboard, DataEntry } from '@/lib/types';
import { CollectorEntryForm } from './entry-form';
import { CollectorEntryList } from './entry-list';
import {
  StoreIcon,
  FileTextIcon,
  AlertTriangleIcon,
  ReviewIcon,
} from '@/components/icons';

type CollectorNavKey = 'input-data' | 'ringkasan' | 'data-saya';

export default function CollectorDashboardPage() {
  const [summary, setSummary] = useState<CollectorDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [editingEntry, setEditingEntry] = useState<DataEntry | null>(null);
  const [listRefreshKey, setListRefreshKey] = useState(0);
  const [yearFilter, setYearFilter] = useState<number | 'all'>(2026);
  const [activeNav, setActiveNav] = useState<CollectorNavKey>('input-data');

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
    setActiveNav('input-data');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const yearLabel = yearFilter === 'all' ? 'semua tahun' : `tahun ${yearFilter}`;

  return (
    <DashboardShell
      role="collector"
      activeNav={activeNav}
      onNavClick={(key) => setActiveNav(key as CollectorNavKey)}
    >
      {/* ── 1. FORM INPUT DATA HARGA (DEFAULT) ─────────────────────── */}
      {activeNav === 'input-data' && (
        <div className="w-full">
          <CollectorEntryForm
            editingEntry={editingEntry}
            onCancelEdit={() => setEditingEntry(null)}
            onSaved={handleSaved}
          />
        </div>
      )}

      {/* ── 2. RINGKASAN DATA ANDA ─────────────────────────────────── */}
      {activeNav === 'ringkasan' && (
        <div className="w-full space-y-6">
          {/* Header & Year Filter */}
          <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h2 className="text-base font-bold text-slate-900">Ringkasan Data Pendataan Anda</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Pantau progres dan jumlah entri harga komoditas yang telah Anda input untuk {yearLabel}.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <label htmlFor="collector-year-filter" className="text-xs font-semibold text-slate-600">
                Filter Tahun:
              </label>
              <select
                id="collector-year-filter"
                value={yearFilter === 'all' ? 'all' : String(yearFilter)}
                onChange={(e) => setYearFilter(e.target.value === 'all' ? 'all' : Number(e.target.value))}
                aria-label="Filter tahun data pendataan"
                className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-800 outline-none focus:border-blue-500"
              >
                <option value="all">Semua Tahun</option>
                {yearOptions().map((year) => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
            </div>
          </div>

          {/* 4 Stat Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Card 1: Pasar Ditugaskan */}
            <div className="flex items-center gap-4 rounded-2xl border border-[#E0F2FE] bg-[#F0F9FF] p-5 shadow-2xs">
              <div className="flex h-13 w-13 shrink-0 items-center justify-center rounded-2xl bg-[#E0F2FE] text-[#0284C7]">
                <StoreIcon className="h-6 w-6" />
              </div>
              <div>
                <div className="text-xs font-semibold text-sky-800">Pasar Ditugaskan</div>
                <div className="text-2xl sm:text-3xl font-black text-sky-950 leading-tight">
                  {loading ? '...' : (summary?.assigned_markets ?? 0)}
                </div>
                <div className="text-[11px] font-medium text-sky-700/80">Wilayah tugas aktif</div>
              </div>
            </div>

            {/* Card 2: Total Entri Aktif */}
            <div className="flex items-center gap-4 rounded-2xl border border-[#DCFCE7] bg-[#F0FDF4] p-5 shadow-2xs">
              <div className="flex h-13 w-13 shrink-0 items-center justify-center rounded-2xl bg-[#DCFCE7] text-[#16A34A]">
                <FileTextIcon className="h-6 w-6" />
              </div>
              <div>
                <div className="text-xs font-semibold text-emerald-800">Total Entri Aktif</div>
                <div className="text-2xl sm:text-3xl font-black text-emerald-950 leading-tight">
                  {loading ? '...' : (summary?.total_entries ?? 0)}
                </div>
                <div className="text-[11px] font-medium text-emerald-700/80">{yearLabel}</div>
              </div>
            </div>

            {/* Card 3: Data Warning */}
            <div className="flex items-center gap-4 rounded-2xl border border-[#FEE2E2] bg-[#FEF2F2] p-5 shadow-2xs">
              <div className="flex h-13 w-13 shrink-0 items-center justify-center rounded-2xl bg-[#FEE2E2] text-[#DC2626]">
                <AlertTriangleIcon className="h-6 w-6" />
              </div>
              <div>
                <div className="text-xs font-semibold text-rose-800">Data Warning</div>
                <div className="text-2xl sm:text-3xl font-black text-rose-950 leading-tight">
                  {loading ? '...' : (summary?.warning_entries ?? 0)}
                </div>
                <div className="text-[11px] font-medium text-rose-700/80">Perlu konfirmasi harga</div>
              </div>
            </div>

            {/* Card 4: Bisa Diedit */}
            <div className="flex items-center gap-4 rounded-2xl border border-[#F3E8FF] bg-[#FAF5FF] p-5 shadow-2xs">
              <div className="flex h-13 w-13 shrink-0 items-center justify-center rounded-2xl bg-[#F3E8FF] text-[#9333EA]">
                <ReviewIcon className="h-6 w-6" />
              </div>
              <div>
                <div className="text-xs font-semibold text-purple-800">Bisa Diedit</div>
                <div className="text-2xl sm:text-3xl font-black text-purple-950 leading-tight">
                  {loading ? '...' : (summary?.editable_entries ?? 0)}
                </div>
                <div className="text-[11px] font-medium text-purple-700/80">Entri dapat diperbarui</div>
              </div>
            </div>
          </div>

          {/* Assigned Markets Banner */}
          {summary?.markets && summary.markets.length > 0 && (
            <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xs">
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-2">
                PASAR PENUGASAN ANDA
              </div>
              <div className="flex flex-wrap gap-2">
                {summary.markets.map((market) => (
                  <span
                    key={market.id}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-blue-200 bg-blue-50/80 px-3.5 py-2 text-xs font-bold text-blue-800"
                  >
                    🏪 {market.name} {market.district ? `(${market.district})` : ''}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Quick Action Button */}
          <div className="flex justify-start">
            <button
              type="button"
              onClick={() => setActiveNav('input-data')}
              className="flex items-center gap-2 rounded-xl bg-[#0066FF] px-5 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-blue-600 transition"
            >
              <span>+ Input Data Harga Baru</span>
            </button>
          </div>
        </div>
      )}

      {/* ── 3. DATA SAYA ───────────────────────────────────────────── */}
      {activeNav === 'data-saya' && (
        <div className="w-full">
          <CollectorEntryList
            refreshKey={listRefreshKey}
            yearFilter={yearFilter}
            onYearFilterChange={setYearFilter}
            onEdit={handleEdit}
            onChanged={handleSaved}
          />
        </div>
      )}
    </DashboardShell>
  );
}

function yearOptions() {
  const current = 2026;
  const years: number[] = [];
  for (let year = current + 1; year >= current - 5; year -= 1) {
    years.push(year);
  }
  return years;
}

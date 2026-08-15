'use client';

import { useEffect, useMemo, useState } from 'react';
import { api } from '@/lib/api';
import type { DataEntry } from '@/lib/types';

type CollectorEntryListProps = {
  refreshKey?: number;
  yearFilter?: number | 'all';
  onYearFilterChange?: (year: number | 'all') => void;
  onEdit: (entry: DataEntry) => void;
  onChanged?: () => void;
};

const warningLabel: Record<DataEntry['warning_status'], string> = {
  normal: 'Dalam rentang',
  below_minimum: 'Di bawah minimum',
  above_maximum: 'Di atas maksimum',
};

export function CollectorEntryList({
  refreshKey = 0,
  yearFilter = 'all',
  onYearFilterChange,
  onEdit,
  onChanged,
}: CollectorEntryListProps) {
  const [entries, setEntries] = useState<DataEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [showInactive, setShowInactive] = useState(false);
  const [busyId, setBusyId] = useState<number | null>(null);

  const loadEntries = async () => {
    const token = localStorage.getItem('pasarata_token');
    if (!token) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const result = await api.entries(token);
      setEntries(result.data ?? []);
      setMessage('');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Gagal memuat data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEntries();
  }, [refreshKey]);

  const handleDeactivate = async (entry: DataEntry) => {
    if (!entry.is_active) return;
    const confirmed = window.confirm(`Nonaktifkan data #${entry.id}? Data tidak dihapus permanen.`);
    if (!confirmed) return;

    const token = localStorage.getItem('pasarata_token');
    if (!token) return;

    try {
      setBusyId(entry.id);
      await api.deactivateEntry(token, entry.id);
      setMessage(`Data #${entry.id} dinonaktifkan`);
      await loadEntries();
      onChanged?.();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Gagal menonaktifkan data');
    } finally {
      setBusyId(null);
    }
  };

  const availableYears = useMemo(() => {
    const years = new Set(entries.map((entry) => entry.year));
    return Array.from(years).sort((a, b) => b - a);
  }, [entries]);

  const visible = entries.filter((entry) => {
    if (!showInactive && !entry.is_active) return false;
    if (yearFilter !== 'all' && entry.year !== yearFilter) return false;
    return true;
  });

  return (
    <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Data Saya</h2>
          <p className="mt-1 text-sm text-slate-600">Edit atau nonaktifkan data yang Anda input. Data nonaktif tetap tersimpan.</p>
        </div>
        <div className="flex flex-wrap items-center gap-4">
          <label className="block text-sm text-slate-600">
            <span className="mb-1 block font-medium text-slate-700">Tahun</span>
            <select
              value={yearFilter === 'all' ? 'all' : String(yearFilter)}
              onChange={(e) => onYearFilterChange?.(e.target.value === 'all' ? 'all' : Number(e.target.value))}
              className="input min-w-36"
            >
              <option value="all">Semua tahun</option>
              {availableYears.map((year) => (
                <option key={year} value={year}>{year}</option>
              ))}
              {/* Pastikan tahun filter aktif tetap muncul meski belum ada data di list */}
              {yearFilter !== 'all' && !availableYears.includes(yearFilter) ? (
                <option value={yearFilter}>{yearFilter}</option>
              ) : null}
            </select>
          </label>
          <label className="mt-5 flex items-center gap-2 text-sm text-slate-600">
            <input type="checkbox" checked={showInactive} onChange={(e) => setShowInactive(e.target.checked)} />
            Tampilkan nonaktif
          </label>
        </div>
      </div>

      {message ? <div className="rounded-lg border border-sky-200 bg-sky-50 px-3 py-2 text-sm text-sky-700">{message}</div> : null}

      {loading ? (
        <p className="text-sm text-slate-500">Memuat data...</p>
      ) : visible.length === 0 ? (
        <p className="text-sm text-slate-500">
          Belum ada data{showInactive ? '' : ' aktif'}
          {yearFilter === 'all' ? '.' : ` untuk tahun ${yearFilter}.`}
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-3 py-2 font-semibold">ID</th>
                <th className="px-3 py-2 font-semibold">Tahun</th>
                <th className="px-3 py-2 font-semibold">Pasar</th>
                <th className="px-3 py-2 font-semibold">Komoditas</th>
                <th className="px-3 py-2 font-semibold">Harga</th>
                <th className="px-3 py-2 font-semibold">Konversi</th>
                <th className="px-3 py-2 font-semibold">Warning</th>
                <th className="px-3 py-2 font-semibold">Status</th>
                <th className="px-3 py-2 font-semibold">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {visible.map((entry) => (
                <tr key={entry.id} className={`border-b border-slate-100 ${entry.is_active ? '' : 'bg-slate-50 text-slate-400'}`}>
                  <td className="px-3 py-2.5">#{entry.id}</td>
                  <td className="px-3 py-2.5">{entry.year}</td>
                  <td className="px-3 py-2.5">{entry.market?.name ?? entry.market_id}</td>
                  <td className="px-3 py-2.5">
                    <div>{entry.commodity?.name ?? entry.commodity_id}</div>
                    {entry.brand_type ? <div className="text-xs text-slate-500">{entry.brand_type}</div> : null}
                  </td>
                  <td className="px-3 py-2.5">{formatPrice(entry.market_price)}</td>
                  <td className="px-3 py-2.5">{formatPrice(entry.converted_price)}</td>
                  <td className="px-3 py-2.5">
                    <span className={warningClass(entry.warning_status)} title={warningHint(entry)}>
                      {warningLabel[entry.warning_status]}
                    </span>
                  </td>
                  <td className="px-3 py-2.5">{entry.is_active ? 'Aktif' : 'Nonaktif'}</td>
                  <td className="px-3 py-2.5">
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        disabled={!entry.is_active || busyId === entry.id}
                        onClick={() => onEdit(entry)}
                        className="rounded-lg border border-slate-300 bg-white px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        disabled={!entry.is_active || busyId === entry.id}
                        onClick={() => handleDeactivate(entry)}
                        className="rounded-lg border border-rose-200 bg-rose-50 px-2.5 py-1 text-xs font-semibold text-rose-700 hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {busyId === entry.id ? '...' : 'Nonaktifkan'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function formatPrice(value: number) {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(value ?? 0);
}

function warningClass(status: DataEntry['warning_status']) {
  if (status === 'below_minimum' || status === 'above_maximum') {
    return 'rounded-md bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-800';
  }
  return 'rounded-md bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-800';
}

function warningHint(entry: DataEntry) {
  if (entry.warning_status === 'below_minimum') {
    return `Harga di bawah minimum (${formatPrice(entry.minimum_price)})`;
  }
  if (entry.warning_status === 'above_maximum') {
    return `Harga di atas maksimum (${formatPrice(entry.maximum_price)})`;
  }
  return `Harga dalam rentang ${formatPrice(entry.minimum_price)} – ${formatPrice(entry.maximum_price)}`;
}

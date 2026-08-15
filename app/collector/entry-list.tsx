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

type AuditItem = {
  id: number;
  entry_id: number;
  user_id: number;
  action: string;
  before?: string;
  after?: string;
  created_at: string;
};

const warningLabel: Record<DataEntry['warning_status'], string> = {
  normal: '✓ Normal (Dalam Rentang)',
  below_minimum: '⚠ Di Bawah Min',
  above_maximum: '⚠ Di Atas Maks',
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

  // Audit modal state
  const [auditEntry, setAuditEntry] = useState<DataEntry | null>(null);
  const [auditLogs, setAuditLogs] = useState<AuditItem[]>([]);
  const [auditLoading, setAuditLoading] = useState(false);
  const [auditError, setAuditError] = useState('');

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
      setMessage(`Data #${entry.id} berhasil dinonaktifkan`);
      await loadEntries();
      onChanged?.();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Gagal menonaktifkan data');
    } finally {
      setBusyId(null);
    }
  };

  const openAuditModal = async (entry: DataEntry) => {
    setAuditEntry(entry);
    setAuditLogs([]);
    setAuditError('');
    setAuditLoading(true);

    const token = localStorage.getItem('pasarata_token');
    if (!token) {
      setAuditLoading(false);
      return;
    }

    try {
      const res = await api.entryAudit(token, entry.id);
      setAuditLogs(res.data ?? []);
    } catch (err) {
      setAuditError(err instanceof Error ? err.message : 'Gagal memuat histori data');
    } finally {
      setAuditLoading(false);
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
          <p className="mt-1 text-sm text-slate-600">Lihat, edit, periksa histori audit, atau nonaktifkan data yang Anda input.</p>
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
                <th className="px-3 py-2 font-semibold">Harga Pasar</th>
                <th className="px-3 py-2 font-semibold">Konversi</th>
                <th className="px-3 py-2 font-semibold">Status Validasi</th>
                <th className="px-3 py-2 font-semibold">Status Entri</th>
                <th className="px-3 py-2 font-semibold">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {visible.map((entry) => (
                <tr key={entry.id} className={`border-b border-slate-100 ${entry.is_active ? '' : 'bg-slate-50 text-slate-400'}`}>
                  <td className="px-3 py-2.5">#{entry.id}</td>
                  <td className="px-3 py-2.5 font-medium">{entry.year}</td>
                  <td className="px-3 py-2.5">{entry.market?.name ?? entry.market_id}</td>
                  <td className="px-3 py-2.5">
                    <div className="font-semibold text-slate-900">{entry.commodity?.name ?? entry.commodity_id}</div>
                    {entry.brand_type ? <div className="text-xs text-slate-500">{entry.brand_type}</div> : null}
                  </td>
                  <td className="px-3 py-2.5 font-medium">{formatPrice(entry.market_price)}</td>
                  <td className="px-3 py-2.5 font-semibold text-emerald-800">{formatPrice(entry.converted_price)} / kg</td>
                  <td className="px-3 py-2.5">
                    <span className={warningClass(entry.warning_status)} title={warningHint(entry)}>
                      {warningLabel[entry.warning_status]}
                    </span>
                  </td>
                  <td className="px-3 py-2.5">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${entry.is_active ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                      {entry.is_active ? 'Aktif' : 'Nonaktif'}
                    </span>
                  </td>
                  <td className="px-3 py-2.5">
                    <div className="flex flex-wrap items-center gap-1.5">
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
                        onClick={() => openAuditModal(entry)}
                        className="rounded-lg border border-sky-200 bg-sky-50 px-2.5 py-1 text-xs font-semibold text-sky-800 hover:bg-sky-100 transition"
                      >
                        Histori
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

      {/* ── Audit History Modal ──────────────────────────────────────── */}
      {auditEntry && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
          <div className="max-h-[85vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Histori Perubahan Data #{auditEntry.id}
                </h3>
                <p className="text-xs text-slate-500">
                  {auditEntry.commodity?.name ?? `Komoditas #${auditEntry.commodity_id}`} • {auditEntry.market?.name ?? `Pasar #${auditEntry.market_id}`} (Tahun {auditEntry.year})
                </p>
              </div>
              <button
                type="button"
                onClick={() => setAuditEntry(null)}
                className="rounded-lg border border-slate-200 p-1.5 text-slate-400 hover:bg-slate-50 hover:text-slate-700"
              >
                ✕
              </button>
            </div>

            {auditLoading ? (
              <p className="py-8 text-center text-sm text-slate-500">Memuat riwayat perubahan...</p>
            ) : auditError ? (
              <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700">{auditError}</div>
            ) : auditLogs.length === 0 ? (
              <p className="py-8 text-center text-sm text-slate-400">Belum ada catatan histori untuk data ini.</p>
            ) : (
              <div className="space-y-3">
                {auditLogs.map((log) => (
                  <div key={log.id} className="rounded-xl border border-slate-100 bg-slate-50/70 p-3.5 text-xs space-y-2">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className={`rounded px-2 py-0.5 font-bold uppercase tracking-wider text-[10px] ${
                          log.action === 'create'
                            ? 'bg-emerald-100 text-emerald-800'
                            : log.action === 'update'
                            ? 'bg-sky-100 text-sky-800'
                            : log.action === 'deactivate'
                            ? 'bg-rose-100 text-rose-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}>
                          {log.action}
                        </span>
                        <span className="text-slate-500">Oleh User #{log.user_id}</span>
                      </div>
                      <span className="text-slate-400">
                        {new Date(log.created_at).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })}
                      </span>
                    </div>

                    {log.after && (
                      <div className="text-slate-700">
                        <span className="font-semibold text-slate-800">Detail:</span> {log.after}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            <div className="pt-2 text-right">
              <button
                type="button"
                onClick={() => setAuditEntry(null)}
                className="rounded-xl bg-slate-100 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-200 transition"
              >
                Tutup
              </button>
            </div>
          </div>
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


'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import type { DataEntry } from '@/lib/types';

type AuditLog = {
  id: number;
  entry_id: number;
  action: string;
  before?: string;
  after?: string;
  created_at?: string;
  user?: { full_name?: string; username?: string };
};

export function EntryReviewPanel() {
  const [entries, setEntries] = useState<DataEntry[]>([]);
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [year, setYear] = useState(new Date().getFullYear());
  const [marketIdFilter, setMarketIdFilter] = useState('');
  const [collectorIdFilter, setCollectorIdFilter] = useState('');
  const [warningFilter, setWarningFilter] = useState<'normal' | 'below_minimum' | 'above_maximum' | ''>('');

  const downloadCsv = (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = filename;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    URL.revokeObjectURL(url);
  };

  const loadData = async () => {
    const token = localStorage.getItem('pasarata_token');
    if (!token) return;

    try {
      const [entriesRes, logsRes] = await Promise.all([
        api.adminEntries(token),
        api.auditLogs(token),
      ]);

      setEntries(entriesRes.data ?? []);
      setLogs(logsRes.data ?? []);
      setMessage('Data review dan log audit berhasil dimuat');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Gagal memuat data review');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleExportEntries = async () => {
    const token = localStorage.getItem('pasarata_token');
    if (!token) return;

    try {
      const blob = await api.exportReport(token, {
        scope: 'entries',
        format: 'xlsx',
        year,
        market_id: marketIdFilter ? Number(marketIdFilter) : undefined,
        collector_id: collectorIdFilter ? Number(collectorIdFilter) : undefined,
        warning_status: warningFilter || undefined,
      });
      downloadCsv(blob, `pasarata-entries-${year}.xlsx`);
      setMessage(`Export data mentah tahun ${year} berhasil (XLSX)`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Gagal export data mentah');
    }
  };

  return (
    <div className="space-y-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div>
        <h3 className="text-lg font-bold text-slate-900">Review Data Pendataan</h3>
        <p className="text-sm text-slate-600">Tinjau seluruh entri pendataan, termasuk status warning dan histori perubahan.</p>
      </div>

      <div>
        <button type="button" onClick={handleExportEntries} className="btn-primary h-10 px-4 text-sm">Export Data Mentah (CSV)</button>
      </div>

      <div className="grid gap-3 md:grid-cols-4">
        <label className="block">
          <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">Tahun</span>
          <input type="number" min={2020} value={year} onChange={(e) => setYear(Number(e.target.value) || new Date().getFullYear())} className="input" />
        </label>
        <label className="block">
          <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">Market ID</span>
          <input type="number" min={1} value={marketIdFilter} onChange={(e) => setMarketIdFilter(e.target.value)} className="input" placeholder="opsional" />
        </label>
        <label className="block">
          <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">Collector ID</span>
          <input type="number" min={1} value={collectorIdFilter} onChange={(e) => setCollectorIdFilter(e.target.value)} className="input" placeholder="opsional" />
        </label>
        <label className="block">
          <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">Warning</span>
          <select className="input" value={warningFilter} onChange={(e) => setWarningFilter(e.target.value as 'normal' | 'below_minimum' | 'above_maximum' | '')}>
            <option value="">Semua</option>
            <option value="normal">normal</option>
            <option value="below_minimum">below_minimum</option>
            <option value="above_maximum">above_maximum</option>
          </select>
        </label>
      </div>

      {message ? <div className="rounded-lg border border-sky-200 bg-sky-50 px-3 py-2 text-sm text-sky-700">{message}</div> : null}

      {loading ? (
        <div className="text-sm text-slate-500">Memuat data review...</div>
      ) : (
        <div className="grid gap-6 xl:grid-cols-[1.7fr_1fr]">
          <div className="space-y-3">
            {entries.length === 0 ? (
              <div className="rounded-lg border border-slate-200 p-3 text-sm text-slate-500">Belum ada entri untuk ditinjau.</div>
            ) : (
              entries.map((entry) => (
                <div key={entry.id} className="rounded-xl border border-slate-200 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <div className="font-semibold text-slate-900">Entry #{entry.id}</div>
                      <div className="text-xs text-slate-500">Tahun {entry.year} • Collector {entry.collector_id}</div>
                    </div>
                    <span className={`rounded-full px-2 py-1 text-xs font-medium ${
                      entry.warning_status === 'normal'
                        ? 'bg-emerald-100 text-emerald-700'
                        : 'bg-amber-100 text-amber-700'
                    }`}>
                      {entry.warning_status}
                    </span>
                  </div>

                  <div className="mt-3 grid gap-2 text-sm text-slate-600 md:grid-cols-2">
                    <div>Harga pasar: Rp {Number(entry.market_price).toLocaleString('id-ID')}</div>
                    <div>Min/Max: Rp {Number(entry.minimum_price).toLocaleString('id-ID')} / Rp {Number(entry.maximum_price).toLocaleString('id-ID')}</div>
                    <div>Jumlah lokal: {Number(entry.local_quantity).toLocaleString('id-ID')}</div>
                    <div>Berat: {Number(entry.local_weight_kg).toLocaleString('id-ID')} kg</div>
                  </div>

                  {entry.notes ? <div className="mt-3 text-sm text-slate-600">Catatan: {entry.notes}</div> : null}
                </div>
              ))
            )}
          </div>

          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <h4 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Audit Log</h4>
            <div className="mt-3 space-y-3">
              {logs.length === 0 ? (
                <div className="text-sm text-slate-500">Belum ada log aktivitas.</div>
              ) : (
                logs.slice(0, 8).map((log) => (
                  <div key={log.id} className="rounded-lg border border-slate-200 bg-white p-3 text-sm text-slate-700">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-medium">{log.action}</span>
                      <span className="text-xs text-slate-500">Entry #{log.entry_id}</span>
                    </div>
                    <div className="mt-1 text-xs text-slate-500">{log.user?.full_name ?? 'System'} • {log.created_at ? new Date(log.created_at).toLocaleString('id-ID') : '-'}</div>
                    {log.before ? <div className="mt-2 text-xs text-slate-600">Sebelum: {log.before}</div> : null}
                    {log.after ? <div className="mt-1 text-xs text-slate-600">Setelah: {log.after}</div> : null}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

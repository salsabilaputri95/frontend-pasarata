'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';

type SummaryRow = {
  market_name: string;
  commodity_name: string;
  year: number;
  average_price: number;
  min_price: number;
  max_price: number;
  count: number;
};

export function SummaryPanel() {
  const [rows, setRows] = useState<SummaryRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [year, setYear] = useState(new Date().getFullYear());
  const [marketIdFilter, setMarketIdFilter] = useState('');

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
      setLoading(true);
      const data = await api.summary(token, year);

      setRows(data.data ?? []);
      setMessage(`Rekap tahun ${data.year}`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Gagal memuat rekap');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [year]);

  const handleExport = async () => {
    const token = localStorage.getItem('pasarata_token');
    if (!token) return;

    try {
      const blob = await api.exportReport(token, {
        scope: 'summary',
        format: 'xlsx',
        year,
        market_id: marketIdFilter ? Number(marketIdFilter) : undefined,
      });
      downloadCsv(blob, `pasarata-summary-${year}.xlsx`);
      setMessage(`Export rekap tahun ${year} berhasil (XLSX)`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Gagal export rekap');
    }
  };

  return (
    <div className="space-y-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h3 className="text-lg font-bold text-slate-900">Rekap Harga Per Pasar</h3>
          <p className="text-sm text-slate-600">Ringkasan rata-rata, minimum, maksimum, dan jumlah data harga per komoditas.</p>
        </div>
        <label className="block">
          <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">Tahun</span>
          <input
            type="number"
            min={2020}
            value={year}
            onChange={(e) => setYear(Number(e.target.value) || new Date().getFullYear())}
            className="input w-32"
          />
        </label>
        <label className="block">
          <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">Filter Market ID</span>
          <input type="number" min={1} value={marketIdFilter} onChange={(e) => setMarketIdFilter(e.target.value)} className="input w-36" placeholder="opsional" />
        </label>
        <button type="button" onClick={handleExport} className="btn-primary h-10 px-4 text-sm">Export Excel (CSV)</button>
      </div>

      {message ? <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{message}</div> : null}

      {loading ? (
        <div className="text-sm text-slate-500">Memuat rekap...</div>
      ) : rows.length === 0 ? (
        <div className="rounded-lg border border-slate-200 p-3 text-sm text-slate-500">Belum ada data rekap untuk tahun ini.</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
            <thead>
              <tr className="bg-slate-50 text-slate-600">
                <th className="px-3 py-2 font-semibold">Pasar</th>
                <th className="px-3 py-2 font-semibold">Komoditas</th>
                <th className="px-3 py-2 font-semibold">Rata-rata</th>
                <th className="px-3 py-2 font-semibold">Minimum</th>
                <th className="px-3 py-2 font-semibold">Maksimum</th>
                <th className="px-3 py-2 font-semibold">Jumlah</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {rows.map((row, index) => (
                <tr key={`${row.market_name}-${row.commodity_name}-${index}`} className="text-slate-700">
                  <td className="px-3 py-2">{row.market_name}</td>
                  <td className="px-3 py-2">{row.commodity_name}</td>
                  <td className="px-3 py-2">Rp {Number(row.average_price).toLocaleString('id-ID')}</td>
                  <td className="px-3 py-2">Rp {Number(row.min_price).toLocaleString('id-ID')}</td>
                  <td className="px-3 py-2">Rp {Number(row.max_price).toLocaleString('id-ID')}</td>
                  <td className="px-3 py-2">{row.count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

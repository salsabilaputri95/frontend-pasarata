'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { EmptyDocIcon } from './icons';

const DEFAULT_YEAR = 2026;

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
  const [year, setYear] = useState(DEFAULT_YEAR);
  const [marketIdFilter, setMarketIdFilter] = useState('');
  const [message, setMessage] = useState('');

  const downloadFile = (blob: Blob, filename: string) => {
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
      setMessage(`${data.data?.length ?? 0} data rekapitulasi ditemukan untuk tahun ${year}`);
    } catch {
      setRows([]);
      setMessage(`Belum ada data rekap untuk tahun ${year}`);
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
      downloadFile(blob, `pasarata-rekap-${year}.xlsx`);
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Gagal export rekap');
    }
  };

  return (
    <div id="section-rekap" className="w-full space-y-6 rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xs">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-100 pb-4">
        <div>
          <h3 className="text-base font-bold text-slate-900">Rekapitulasi Harga Per Pasar</h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Ringkasan rata-rata, harga terendah (minimum), harga tertinggi (maksimum), dan volume entri per komoditas.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="rounded-full bg-emerald-50 border border-emerald-100 px-3 py-1 text-xs font-bold text-emerald-700">
            Tahun: {year}
          </span>
        </div>
      </div>

      {/* Filter / Toolbar */}
      <div className="rounded-xl border border-slate-100 bg-[#F8FAFC] p-4">
        <div className="text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-3">
          FILTER & EKSPOR
        </div>

        <div className="flex flex-wrap items-end gap-3 justify-between">
          <div className="flex flex-wrap items-center gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Tahun Rekap</label>
              <input
                type="number"
                min={2020}
                value={year}
                onChange={(e) => setYear(Number(e.target.value) || DEFAULT_YEAR)}
                className="w-28 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800 outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Filter Market ID</label>
              <input
                type="number"
                min={1}
                value={marketIdFilter}
                onChange={(e) => setMarketIdFilter(e.target.value)}
                placeholder="opsional"
                className="w-32 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800 outline-none focus:border-blue-500"
              />
            </div>
          </div>

          <button
            type="button"
            onClick={handleExport}
            className="rounded-xl bg-[#059669] px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-emerald-700 transition"
          >
            Export Excel (XLSX)
          </button>
        </div>
      </div>

      {/* Alert status banner */}
      <div className="rounded-xl border border-emerald-200 bg-[#F0FDF4] px-4 py-2.5 text-xs font-semibold text-emerald-800">
        {loading ? 'Memuat data rekap...' : message}
      </div>

      {/* Table */}
      {rows.length === 0 ? (
        <div className="rounded-xl border border-slate-100 bg-[#F8FAFC] py-14 text-center">
          <div className="flex flex-col items-center justify-center">
            <EmptyDocIcon className="w-10 h-10 text-slate-300 mb-2" />
            <span className="text-xs text-slate-500 font-medium">
              Belum ada data rekapitulasi harga untuk tahun {year}.
            </span>
          </div>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-200/70">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200/80 bg-slate-50/80 text-[11px] font-bold uppercase tracking-wider text-slate-600">
                <th className="py-3 px-4">PASAR</th>
                <th className="py-3 px-4">KOMODITAS</th>
                <th className="py-3 px-4">TAHUN</th>
                <th className="py-3 px-4">RATA-RATA HARGA</th>
                <th className="py-3 px-4">HARGA MINIMUM</th>
                <th className="py-3 px-4">HARGA MAKSIMUM</th>
                <th className="py-3 px-4 text-right">TOTAL ENTRI</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rows.map((r, idx) => (
                <tr key={idx} className="hover:bg-slate-50 transition">
                  <td className="py-3 px-4 font-bold text-slate-900">{r.market_name}</td>
                  <td className="py-3 px-4 text-slate-700 font-medium">{r.commodity_name}</td>
                  <td className="py-3 px-4 text-slate-500">{r.year}</td>
                  <td className="py-3 px-4 font-bold text-emerald-700">
                    Rp {Number(r.average_price).toLocaleString('id-ID')}
                  </td>
                  <td className="py-3 px-4 text-slate-600">
                    Rp {Number(r.min_price).toLocaleString('id-ID')}
                  </td>
                  <td className="py-3 px-4 text-slate-600">
                    Rp {Number(r.max_price).toLocaleString('id-ID')}
                  </td>
                  <td className="py-3 px-4 text-right font-semibold text-slate-800">
                    {r.count} data
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

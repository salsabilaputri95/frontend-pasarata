'use client';

import { useEffect, useState } from 'react';

const DEFAULT_YEAR = new Date().getFullYear();

type ComparisonRow = {
  market_name: string;
  commodity_name: string;
  current_year: number;
  previous_year: number;
  current_average: number;
  previous_average: number;
  delta: number;
  delta_percent: number;
};

export function ComparisonPanel() {
  const [rows, setRows] = useState<ComparisonRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [year, setYear] = useState(DEFAULT_YEAR);

  const loadData = async () => {
    const token = localStorage.getItem('pasarata_token');
    if (!token) return;

    try {
      setLoading(true);
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8080/api'}/admin/comparison?year=${year}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error ?? 'Gagal memuat perbandingan');
      }

      setRows(data.data ?? []);
      setMessage(`Perbandingan tahun ${data.year}`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Gagal memuat perbandingan');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [year]);

  return (
    <div className="space-y-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h3 className="text-lg font-bold text-slate-900">Perbandingan Harga Dengan Tahun Sebelumnya</h3>
          <p className="text-sm text-slate-600">Membandingkan rata-rata harga komoditas pada tahun berjalan dengan tahun sebelumnya.</p>
        </div>
        <label className="block">
          <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">Tahun</span>
          <input
            type="number"
            min={2020}
            value={year}
            onChange={(e) => setYear(Number(e.target.value) || DEFAULT_YEAR)}
            className="input w-32"
          />
        </label>
      </div>

      {message ? <div className="rounded-lg border border-violet-200 bg-violet-50 px-3 py-2 text-sm text-violet-700">{message}</div> : null}

      {loading ? (
        <div className="text-sm text-slate-500">Memuat perbandingan...</div>
      ) : rows.length === 0 ? (
        <div className="rounded-lg border border-slate-200 p-3 text-sm text-slate-500">Belum ada data perbandingan untuk tahun ini.</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
            <thead>
              <tr className="bg-slate-50 text-slate-600">
                <th className="px-3 py-2 font-semibold">Pasar</th>
                <th className="px-3 py-2 font-semibold">Komoditas</th>
                <th className="px-3 py-2 font-semibold">{year}</th>
                <th className="px-3 py-2 font-semibold">{year - 1}</th>
                <th className="px-3 py-2 font-semibold">Delta</th>
                <th className="px-3 py-2 font-semibold">%</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {rows.map((row, index) => (
                <tr key={`${row.market_name}-${row.commodity_name}-${index}`} className="text-slate-700">
                  <td className="px-3 py-2">{row.market_name}</td>
                  <td className="px-3 py-2">{row.commodity_name}</td>
                  <td className="px-3 py-2">Rp {Number(row.current_average).toLocaleString('id-ID')}</td>
                  <td className="px-3 py-2">Rp {Number(row.previous_average).toLocaleString('id-ID')}</td>
                  <td className={`px-3 py-2 font-medium ${row.delta >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                    Rp {Number(row.delta).toLocaleString('id-ID')}
                  </td>
                  <td className={`px-3 py-2 font-medium ${row.delta_percent >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                    {Number(row.delta_percent).toFixed(2)}%
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

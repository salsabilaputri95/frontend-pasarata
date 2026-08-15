'use client';

import { useMemo, useState } from 'react';
import { api } from '@/lib/api';

export function ImportPanel() {
  const [file, setFile] = useState<File | null>(null);
  const [collectorIdDefault, setCollectorIdDefault] = useState('');
  const [message, setMessage] = useState('');
  const [preview, setPreview] = useState<{ total_rows: number; valid_rows: number; errors: Record<string, string[]> } | null>(null);
  const [loading, setLoading] = useState(false);

  const invalidRows = useMemo(() => {
    if (!preview) return [];
    return Object.entries(preview.errors).filter(([, errors]) => errors.length > 0);
  }, [preview]);

  const runPreview = async () => {
    const token = localStorage.getItem('pasarata_token');
    if (!token || !file) return;

    try {
      setLoading(true);
      const result = await api.previewImportEntries(token, file, collectorIdDefault ? Number(collectorIdDefault) : undefined);
      setPreview(result);
      setMessage(`Preview selesai: ${result.valid_rows}/${result.total_rows} baris valid`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Gagal preview import');
    } finally {
      setLoading(false);
    }
  };

  const runImport = async () => {
    const token = localStorage.getItem('pasarata_token');
    if (!token || !file) return;

    try {
      setLoading(true);
      const result = await api.importEntries(token, file, collectorIdDefault ? Number(collectorIdDefault) : undefined);
      setMessage(`Import selesai: ${result.imported_rows} baris masuk, ${result.skipped_rows} baris dilewati`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Gagal import data');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-5 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div>
        <h3 className="text-lg font-bold text-slate-900">Import Data Historis</h3>
        <p className="text-sm text-slate-600">Upload file CSV/XLSX dengan header: year, market_id, collector_id atau collector_id_default, category_id, commodity_id, local_unit_id, local_quantity, local_weight_kg, standard_unit_id, market_price, minimum_price, maximum_price.</p>
      </div>

      {message ? <div className="rounded-lg border border-sky-200 bg-sky-50 px-3 py-2 text-sm text-sky-700">{message}</div> : null}

      <div className="grid gap-4 md:grid-cols-3">
        <label className="block md:col-span-2">
          <span className="mb-1 block text-sm font-medium text-slate-700">File Import</span>
          <input type="file" accept=".csv,.xlsx" onChange={(e) => setFile(e.target.files?.[0] ?? null)} className="input" />
        </label>

        <label className="block">
          <span className="mb-1 block text-sm font-medium text-slate-700">Collector Default (Opsional)</span>
          <input type="number" min={1} value={collectorIdDefault} onChange={(e) => setCollectorIdDefault(e.target.value)} className="input" placeholder="contoh: 2" />
        </label>
      </div>

      <div className="flex flex-wrap gap-3">
        <button type="button" onClick={runPreview} disabled={!file || loading} className="btn-primary h-10 px-4 text-sm disabled:opacity-60">Preview Import</button>
        <button type="button" onClick={runImport} disabled={!file || loading} className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60">Commit Import</button>
      </div>

      {preview ? (
        <div className="rounded-xl border border-slate-200 p-4">
          <div className="text-sm text-slate-700">Total baris: <span className="font-semibold">{preview.total_rows}</span> • Valid: <span className="font-semibold text-emerald-700">{preview.valid_rows}</span></div>
          {invalidRows.length > 0 ? (
            <div className="mt-3 space-y-2 text-sm">
              {invalidRows.slice(0, 10).map(([rowNo, errors]) => (
                <div key={rowNo} className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-rose-700">
                  Row {rowNo}: {errors.join('; ')}
                </div>
              ))}
            </div>
          ) : (
            <div className="mt-3 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">Tidak ada error validasi.</div>
          )}
        </div>
      ) : null}
    </div>
  );
}

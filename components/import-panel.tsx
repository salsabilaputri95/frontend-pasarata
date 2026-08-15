'use client';

import { useEffect, useMemo, useState } from 'react';
import { api } from '@/lib/api';

type SystemFieldConfig = {
  key: string;
  label: string;
  required: boolean;
  type: 'number' | 'text';
  placeholder?: string;
  defaultVal?: string;
};

const ENTRY_FIELDS: SystemFieldConfig[] = [
  { key: 'year', label: 'Tahun (Year)', required: true, type: 'number', placeholder: 'mis. 2026', defaultVal: String(new Date().getFullYear()) },
  { key: 'market_id', label: 'ID Pasar (Market ID)', required: true, type: 'number', placeholder: 'mis. 1' },
  { key: 'collector_id', label: 'ID Pendata (Collector ID)', required: true, type: 'number', placeholder: 'mis. 2' },
  { key: 'category_id', label: 'ID Kategori (Category ID)', required: true, type: 'number', placeholder: 'mis. 1' },
  { key: 'commodity_id', label: 'ID Komoditas (Commodity ID)', required: true, type: 'number', placeholder: 'mis. 1' },
  { key: 'brand_type', label: 'Merek / Jenis (Brand Type)', required: false, type: 'text', placeholder: 'opsional' },
  { key: 'local_unit_id', label: 'ID Satuan Lokal (Local Unit ID)', required: true, type: 'number', placeholder: 'mis. 1' },
  { key: 'local_quantity', label: 'Kuantitas Lokal (Pilar 3)', required: true, type: 'number', placeholder: '1', defaultVal: '1' },
  { key: 'local_weight_kg', label: 'Berat Isi Bersih kg (Pilar 2)', required: true, type: 'number', placeholder: '1.0', defaultVal: '1.0' },
  { key: 'standard_unit_id', label: 'ID Satuan Standar (Standard Unit ID)', required: true, type: 'number', placeholder: 'mis. 1' },
  { key: 'market_price', label: 'Harga Pasar Rp (Pilar 1)', required: true, type: 'number', placeholder: 'mis. 15000' },
  { key: 'minimum_price', label: 'Harga Minimum Rp', required: true, type: 'number', placeholder: 'mis. 12000' },
  { key: 'maximum_price', label: 'Harga Maksimum Rp', required: true, type: 'number', placeholder: 'mis. 18000' },
  { key: 'previous_price', label: 'Harga Sebelumnya Rp', required: false, type: 'number', placeholder: 'opsional' },
  { key: 'notes', label: 'Catatan Lapangan', required: false, type: 'text', placeholder: 'opsional' },
];

const MASTER_FIELDS: Record<'commodities' | 'categories' | 'units' | 'markets', SystemFieldConfig[]> = {
  commodities: [
    { key: 'code', label: 'Kode Komoditas (Unique Code)', required: true, type: 'text', placeholder: 'mis. BERAS-PREM' },
    { key: 'name', label: 'Nama Komoditas', required: true, type: 'text', placeholder: 'mis. Beras Premium' },
    { key: 'category_name', label: 'Nama Kategori (Auto-create jika baru)', required: false, type: 'text', placeholder: 'mis. Makanan' },
    { key: 'category_id', label: 'Atau ID Kategori', required: false, type: 'number', placeholder: 'mis. 1' },
    { key: 'brand_type', label: 'Jenis / Merek', required: false, type: 'text', placeholder: 'mis. Medium / Raja' },
  ],
  categories: [
    { key: 'name', label: 'Nama Kategori (Unique)', required: true, type: 'text', placeholder: 'mis. Bahan Pokok' },
    { key: 'type', label: 'Tipe Kategori', required: false, type: 'text', placeholder: 'Makanan / Non Makanan', defaultVal: 'Makanan' },
  ],
  units: [
    { key: 'name', label: 'Nama Satuan (Unique)', required: true, type: 'text', placeholder: 'mis. Liter / Ikat / Bungkus' },
    { key: 'is_standard', label: 'Satuan Standar?', required: false, type: 'text', placeholder: 'true / false', defaultVal: 'false' },
    { key: 'conversion_factor', label: 'Faktor Konversi', required: false, type: 'number', placeholder: '1.0', defaultVal: '1.0' },
  ],
  markets: [
    { key: 'name', label: 'Nama Pasar', required: true, type: 'text', placeholder: 'mis. Pasar Terong' },
    { key: 'nks', label: 'Kode NKS (Unique)', required: true, type: 'text', placeholder: 'mis. 737101' },
    { key: 'province', label: 'Provinsi', required: false, type: 'text', placeholder: 'mis. Sulawesi Selatan' },
    { key: 'district', label: 'Kabupaten / Kota', required: false, type: 'text', placeholder: 'mis. Kota Makassar' },
  ],
};

export function ImportPanel() {
  const [importMode, setImportMode] = useState<'entries' | 'master'>('entries');
  const [masterTarget, setMasterTarget] = useState<'commodities' | 'categories' | 'units' | 'markets'>('commodities');

  const [file, setFile] = useState<File | null>(null);
  const [headers, setHeaders] = useState<string[]>([]);
  const [totalRows, setTotalRows] = useState<number>(0);

  // Mapping & Defaults state
  const [mapping, setMapping] = useState<Record<string, string>>({});
  const [defaults, setDefaults] = useState<Record<string, string>>({
    year: String(new Date().getFullYear()),
    local_quantity: '1',
    local_weight_kg: '1',
  });

  const [inspecting, setInspecting] = useState(false);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [commitLoading, setCommitLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [isError, setIsError] = useState(false);

  const [previewEntries, setPreviewEntries] = useState<{
    total_rows: number;
    valid_rows: number;
    errors: Record<string, string[]>;
    sample_parsed?: Array<Record<string, unknown>>;
  } | null>(null);

  const [previewMaster, setPreviewMaster] = useState<{
    target: string;
    total_rows: number;
    valid_rows: number;
    new_rows: number;
    update_rows: number;
    errors: Record<string, string[]>;
    sample_parsed?: Array<Record<string, unknown>>;
  } | null>(null);

  const showMsg = (msg: string, error = false) => {
    setMessage(msg);
    setIsError(error);
  };

  const currentFields = useMemo(() => {
    return importMode === 'entries' ? ENTRY_FIELDS : MASTER_FIELDS[masterTarget];
  }, [importMode, masterTarget]);

  // Reset state when switching modes or targets
  const handleModeChange = (mode: 'entries' | 'master') => {
    setImportMode(mode);
    setPreviewEntries(null);
    setPreviewMaster(null);
    setMapping({});
    setDefaults(mode === 'entries' ? { year: String(new Date().getFullYear()), local_quantity: '1', local_weight_kg: '1' } : {});
  };

  const handleMasterTargetChange = (target: 'commodities' | 'categories' | 'units' | 'markets') => {
    setMasterTarget(target);
    setPreviewMaster(null);
    setMapping({});
    setDefaults({});
  };

  // Inspect headers when file changes
  const handleFileChange = async (selectedFile: File | null) => {
    setFile(selectedFile);
    setHeaders([]);
    setPreviewEntries(null);
    setPreviewMaster(null);
    if (!selectedFile) return;

    const token = localStorage.getItem('pasarata_token');
    if (!token) return;

    setInspecting(true);
    try {
      const res = await api.inspectImportHeaders(token, selectedFile);
      setHeaders(res.headers ?? []);
      setTotalRows(res.total_rows ?? 0);

      // Auto-detect matching headers
      const autoMapping: Record<string, string> = {};
      const lowerHeaders = (res.headers ?? []).map((h) => ({ original: h, lower: h.toLowerCase().trim() }));

      for (const field of currentFields) {
        const directMatch = lowerHeaders.find(
          (h) => h.lower === field.key || h.lower.includes(field.key.replace(/_/g, ' ')),
        );
        if (directMatch) {
          autoMapping[field.key] = directMatch.original;
        }
      }
      setMapping(autoMapping);
      showMsg(`File terdeteksi: ${res.headers.length} kolom, ${res.total_rows} baris data.`);
    } catch (err) {
      showMsg(err instanceof Error ? err.message : 'Gagal membaca file', true);
    } finally {
      setInspecting(false);
    }
  };

  const invalidRows = useMemo(() => {
    const errMap = importMode === 'entries' ? previewEntries?.errors : previewMaster?.errors;
    if (!errMap) return [];
    return Object.entries(errMap).filter(([, errs]) => errs.length > 0);
  }, [importMode, previewEntries, previewMaster]);

  const handleMappingChange = (fieldKey: string, excelCol: string) => {
    setMapping((prev) => ({ ...prev, [fieldKey]: excelCol }));
    setPreviewEntries(null);
    setPreviewMaster(null);
  };

  const handleDefaultChange = (fieldKey: string, val: string) => {
    setDefaults((prev) => ({ ...prev, [fieldKey]: val }));
    setPreviewEntries(null);
    setPreviewMaster(null);
  };

  const runPreview = async () => {
    const token = localStorage.getItem('pasarata_token');
    if (!token || !file) return;

    setPreviewLoading(true);
    try {
      if (importMode === 'entries') {
        const result = await api.previewImportEntries(token, file, { mapping, defaults });
        setPreviewEntries(result);
        showMsg(`Preview entri selesai: ${result.valid_rows}/${result.total_rows} baris valid.`);
      } else {
        const result = await api.previewImportMaster(token, file, masterTarget, { mapping, defaults });
        setPreviewMaster(result);
        showMsg(`Preview master (${masterTarget}) selesai: ${result.valid_rows}/${result.total_rows} baris valid (${result.new_rows} baru, ${result.update_rows} update).`);
      }
    } catch (error) {
      showMsg(error instanceof Error ? error.message : 'Gagal melakukan preview import', true);
    } finally {
      setPreviewLoading(false);
    }
  };

  const runImport = async () => {
    const token = localStorage.getItem('pasarata_token');
    if (!token || !file) return;

    setCommitLoading(true);
    try {
      if (importMode === 'entries') {
        const result = await api.importEntries(token, file, { mapping, defaults });
        showMsg(`Import sukses! ${result.imported_rows} entri berhasil disimpan (${result.skipped_rows} dilewati).`);
      } else {
        const result = await api.importMaster(token, file, masterTarget, { mapping, defaults });
        showMsg(`Import master ${masterTarget} sukses! ${result.created_count} data baru dibuat, ${result.updated_count} diperbarui (${result.skipped_count} dilewati).`);
      }
      setFile(null);
      setHeaders([]);
      setPreviewEntries(null);
      setPreviewMaster(null);
    } catch (error) {
      showMsg(error instanceof Error ? error.message : 'Gagal mengeksekusi import data', true);
    } finally {
      setCommitLoading(false);
    }
  };

  return (
    <div className="space-y-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-4">
        <div>
          <h3 className="text-lg font-bold text-slate-900">Import Data Excel / CSV</h3>
          <p className="text-xs text-slate-500">
            Import data entri historis atau master komoditas, kategori, satuan, dan pasar secara batch dengan mapping kolom fleksibel.
          </p>
        </div>

        {/* Mode Selector Tab */}
        <div className="flex gap-1 rounded-xl bg-slate-100 p-1">
          <button
            id="tab-import-entries"
            type="button"
            onClick={() => handleModeChange('entries')}
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
              importMode === 'entries' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            📊 Data Entri Historis
          </button>
          <button
            id="tab-import-master"
            type="button"
            onClick={() => handleModeChange('master')}
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
              importMode === 'master' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            ⚙️ Master Data (Batch Seed)
          </button>
        </div>
      </div>

      {message ? (
        <div className={`rounded-xl border px-4 py-3 text-sm ${isError ? 'border-red-200 bg-red-50 text-red-700' : 'border-sky-200 bg-sky-50 text-sky-700'}`}>
          {message}
        </div>
      ) : null}

      {/* Target Master Selector (Jika mode Master) */}
      {importMode === 'master' && (
        <div className="rounded-xl border border-amber-200 bg-amber-50/70 p-4">
          <label className="block">
            <span className="mb-1 block text-xs font-bold uppercase tracking-wider text-amber-800">
              Pilih Target Master yang Ingin Diimpor:
            </span>
            <div className="flex flex-wrap gap-2 mt-2">
              {(['commodities', 'categories', 'units', 'markets'] as const).map((t) => (
                <button
                  key={t}
                  id={`target-master-${t}`}
                  type="button"
                  onClick={() => handleMasterTargetChange(t)}
                  className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                    masterTarget === t
                      ? 'bg-amber-600 text-white shadow-sm'
                      : 'bg-white border border-amber-200 text-amber-900 hover:bg-amber-100'
                  }`}
                >
                  {t === 'commodities' ? '🌾 Komoditas (Upsert Code)' : t === 'categories' ? '📁 Kategori' : t === 'units' ? '⚖️ Satuan' : '🏪 Pasar'}
                </button>
              ))}
            </div>
          </label>
        </div>
      )}

      {/* ── STEP 1: Upload File ─────────────────────────────────────── */}
      <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4">
        <label className="block">
          <span className="mb-1 block text-sm font-semibold text-slate-800">1. Pilih File Excel / CSV</span>
          <input
            id="file-import-input"
            type="file"
            accept=".csv,.xlsx"
            onChange={(e) => handleFileChange(e.target.files?.[0] ?? null)}
            className="input bg-white"
          />
        </label>

        {inspecting && <p className="mt-2 text-xs text-slate-500">Membaca struktur kolom file...</p>}

        {headers.length > 0 && (
          <div className="mt-3">
            <div className="text-xs font-semibold text-slate-700">Kolom Terdeteksi di File ({headers.length}):</div>
            <div className="mt-1 flex flex-wrap gap-1.5">
              {headers.map((h, i) => (
                <span key={i} className="rounded bg-white px-2 py-0.5 text-xs font-mono text-slate-700 border border-slate-200">
                  {h}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ── STEP 2: Mapping Kolom & Nilai Default ─────────────────────── */}
      {headers.length > 0 && (
        <div className="rounded-xl border border-slate-200 p-4 space-y-4">
          <div>
            <h4 className="text-sm font-bold text-slate-900">2. Mapping Kolom & Nilai Default ({importMode === 'entries' ? 'Entri' : `Master ${masterTarget}`})</h4>
            <p className="text-xs text-slate-500">
              Cocokkan field target sistem dengan kolom di file Excel. Kolom yang tidak ada di file dapat diisi dengan nilai default.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {currentFields.map((field) => {
              const mappedCol = mapping[field.key] ?? '';
              const defaultVal = defaults[field.key] ?? '';

              return (
                <div key={field.key} className="rounded-lg border border-slate-100 bg-slate-50/50 p-2.5 text-xs space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-800">
                      {field.label} {field.required && <span className="text-rose-500">*</span>}
                    </span>
                  </div>

                  {/* Dropdown pilih kolom file */}
                  <select
                    id={`mapping-${field.key}`}
                    value={mappedCol}
                    onChange={(e) => handleMappingChange(field.key, e.target.value)}
                    className="w-full rounded border border-slate-200 bg-white px-2 py-1 text-xs text-slate-800 focus:border-sky-400 focus:outline-none"
                  >
                    <option value="">-- Tidak Dipetakan (Pakai Default) --</option>
                    {headers.map((h, idx) => (
                      <option key={idx} value={h}>
                        Kolom: {h}
                      </option>
                    ))}
                  </select>

                  {/* Input default value jika tidak dimapping */}
                  <input
                    id={`default-${field.key}`}
                    type={field.type}
                    value={defaultVal}
                    onChange={(e) => handleDefaultChange(field.key, e.target.value)}
                    placeholder={`Default: ${field.placeholder ?? '-'}`}
                    className="w-full rounded border border-slate-200 bg-white px-2 py-1 text-xs text-slate-800 focus:border-sky-400 focus:outline-none"
                  />
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── STEP 3: Preview & Commit Buttons ─────────────────────────── */}
      {headers.length > 0 && (
        <div className="flex flex-wrap items-center gap-3">
          <button
            id="btn-run-preview-import"
            type="button"
            onClick={runPreview}
            disabled={previewLoading || commitLoading}
            className="btn-primary h-10 px-5 text-sm disabled:opacity-60"
          >
            {previewLoading ? 'Menganalisis Data...' : '3. Preview & Validasi Data'}
          </button>

          {((importMode === 'entries' && previewEntries && previewEntries.valid_rows > 0) ||
            (importMode === 'master' && previewMaster && previewMaster.valid_rows > 0)) && (
            <button
              id="btn-commit-import"
              type="button"
              onClick={runImport}
              disabled={commitLoading}
              className="rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 transition disabled:opacity-60"
            >
              {commitLoading
                ? 'Mengimpor Data...'
                : `Commit Import (${(importMode === 'entries' ? previewEntries?.valid_rows : previewMaster?.valid_rows) ?? 0} Baris Valid)`}
            </button>
          )}
        </div>
      )}

      {/* ── STEP 4: Hasil Preview & Error List ───────────────────────── */}
      {(previewEntries || previewMaster) && (
        <div className="rounded-xl border border-slate-200 p-5 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="text-base font-bold text-slate-900">
                Hasil Analisis Preview ({importMode === 'entries' ? 'Entri' : `Master ${masterTarget}`})
              </div>
              <div className="text-xs text-slate-500">
                Total Baris: <span className="font-semibold text-slate-800">{importMode === 'entries' ? previewEntries?.total_rows : previewMaster?.total_rows}</span> • Baris Valid:{' '}
                <span className="font-semibold text-emerald-700">{importMode === 'entries' ? previewEntries?.valid_rows : previewMaster?.valid_rows}</span>
                {importMode === 'master' && (
                  <span className="ml-1 text-slate-600">
                    ({previewMaster?.new_rows ?? 0} baru, {previewMaster?.update_rows ?? 0} update)
                  </span>
                )}{' '}
                • Baris Bermasalah:{' '}
                <span className="font-semibold text-rose-700">{invalidRows.length}</span>
              </div>
            </div>

            <span className={`rounded-full px-3 py-1 text-xs font-semibold ${
              (importMode === 'entries' ? previewEntries?.valid_rows === previewEntries?.total_rows : previewMaster?.valid_rows === previewMaster?.total_rows)
                ? 'bg-emerald-100 text-emerald-800'
                : ((importMode === 'entries' ? previewEntries?.valid_rows : previewMaster?.valid_rows) ?? 0) > 0
                ? 'bg-amber-100 text-amber-800'
                : 'bg-rose-100 text-rose-800'
            }`}>
              {(importMode === 'entries' ? previewEntries?.valid_rows === previewEntries?.total_rows : previewMaster?.valid_rows === previewMaster?.total_rows)
                ? '✓ Semua Baris Siap Diimpor'
                : 'Sebagian Baris Memiliki Masalah'}
            </span>
          </div>

          {/* Sample parsed entries preview */}
          {((importMode === 'entries' ? previewEntries?.sample_parsed : previewMaster?.sample_parsed) ?? []).length > 0 && (
            <div>
              <div className="text-xs font-semibold uppercase text-slate-500 mb-2">Contoh Baris Hasil Mapping:</div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border border-slate-100 divide-y divide-slate-100">
                  <thead className="bg-slate-50 text-slate-600">
                    {importMode === 'entries' ? (
                      <tr>
                        <th className="p-2">Tahun</th>
                        <th className="p-2">Pasar</th>
                        <th className="p-2">Komoditas</th>
                        <th className="p-2">Kuantitas</th>
                        <th className="p-2">Berat kg</th>
                        <th className="p-2">Harga Pasar</th>
                        <th className="p-2">Min / Maks</th>
                      </tr>
                    ) : (
                      <tr>
                        <th className="p-2">Data 1</th>
                        <th className="p-2">Data 2</th>
                        <th className="p-2">Data 3</th>
                        <th className="p-2">Data 4</th>
                        <th className="p-2">Aksi</th>
                      </tr>
                    )}
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {(importMode === 'entries' ? previewEntries?.sample_parsed : previewMaster?.sample_parsed)?.slice(0, 5).map((row, idx) => (
                      <tr key={idx} className="hover:bg-slate-50">
                        {importMode === 'entries' ? (
                          <>
                            <td className="p-2 font-medium">{String(row.Year ?? '-')}</td>
                            <td className="p-2">#{String(row.MarketID ?? '-')}</td>
                            <td className="p-2">#{String(row.CommodityID ?? '-')}</td>
                            <td className="p-2">{String(row.LocalQuantity ?? '1')}</td>
                            <td className="p-2">{String(row.LocalWeightKg ?? '1')} kg</td>
                            <td className="p-2 font-semibold">Rp {Number(row.MarketPrice ?? 0).toLocaleString('id-ID')}</td>
                            <td className="p-2">
                              Rp {Number(row.MinimumPrice ?? 0).toLocaleString('id-ID')} - Rp {Number(row.MaximumPrice ?? 0).toLocaleString('id-ID')}
                            </td>
                          </>
                        ) : (
                          <>
                            <td className="p-2 font-medium">{String(row.code ?? row.name ?? '-')}</td>
                            <td className="p-2">{String(row.name ?? row.type ?? row.nks ?? '-')}</td>
                            <td className="p-2">{String(row.category_name ?? row.brand_type ?? row.province ?? row.is_standard ?? '-')}</td>
                            <td className="p-2">{String(row.district ?? row.conversion_factor ?? '-')}</td>
                            <td className="p-2">
                              <span className={`rounded px-1.5 py-0.5 text-[10px] font-semibold ${row.is_update ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'}`}>
                                {row.is_update ? 'Update' : 'Baru'}
                              </span>
                            </td>
                          </>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Error detail list */}
          {invalidRows.length > 0 ? (
            <div>
              <div className="text-xs font-semibold uppercase text-rose-700 mb-2">
                Rincian Error per Baris ({invalidRows.length} baris):
              </div>
              <div className="max-h-48 overflow-y-auto space-y-1.5 text-xs">
                {invalidRows.map(([rowNo, errors]) => (
                  <div key={rowNo} className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-1.5 text-rose-800">
                    <span className="font-semibold">Baris {rowNo}:</span> {errors.join('; ')}
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-medium text-emerald-800">
              ✓ Tidak ada error validasi pada seluruh baris data.
            </div>
          )}
        </div>
      )}
    </div>
  );
}



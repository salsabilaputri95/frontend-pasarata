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
  { key: 'year', label: 'Tahun (Year)', required: true, type: 'number', placeholder: 'mis. 2026', defaultVal: '2026' },
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
    { key: 'category_name', label: 'Nama Kategori', required: false, type: 'text', placeholder: 'mis. Makanan' },
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
    { key: 'district', label: 'Kabupaten / Kota', required: false, type: 'text', placeholder: 'mis. Jeneponto' },
  ],
};

export function ImportPanel() {
  const [importMode, setImportMode] = useState<'entries' | 'master'>('entries');
  const [masterTarget, setMasterTarget] = useState<'commodities' | 'categories' | 'units' | 'markets'>('commodities');

  const [file, setFile] = useState<File | null>(null);
  const [headers, setHeaders] = useState<string[]>([]);
  const [totalRows, setTotalRows] = useState<number>(0);

  const [mapping, setMapping] = useState<Record<string, string>>({});
  const [defaults, setDefaults] = useState<Record<string, string>>({
    year: '2026',
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

  // Auto match headers to fields
  useEffect(() => {
    if (headers.length === 0) return;
    const newMapping: Record<string, string> = {};
    for (const field of currentFields) {
      const match = headers.find((h) => {
        const cleanH = h.toLowerCase().replace(/[\s_\-()]/g, '');
        const cleanK = field.key.toLowerCase().replace(/[\s_\-()]/g, '');
        const cleanL = field.label.toLowerCase().replace(/[\s_\-()]/g, '');
        return cleanH === cleanK || cleanH.includes(cleanK) || cleanL.includes(cleanH);
      });
      if (match) {
        newMapping[field.key] = match;
      }
    }
    setMapping(newMapping);
  }, [headers, currentFields]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (!selected) return;

    setFile(selected);
    setPreviewEntries(null);
    setPreviewMaster(null);
    setHeaders([]);
    setTotalRows(0);
    setMessage('');

    const token = localStorage.getItem('pasarata_token');
    if (!token) return;

    setInspecting(true);
    try {
      const res = await api.inspectImportHeaders(token, selected);
      setHeaders(res.headers ?? []);
      setTotalRows(res.total_rows ?? 0);
      showMsg(`File berhasil dibaca: ${res.total_rows} baris data ditemukan.`);
    } catch (error) {
      showMsg(error instanceof Error ? error.message : 'Gagal membaca struktur file', true);
    } finally {
      setInspecting(false);
    }
  };

  const handlePreview = async () => {
    if (!file) return;
    const token = localStorage.getItem('pasarata_token');
    if (!token) return;

    setPreviewLoading(true);
    setMessage('');

    try {
      if (importMode === 'entries') {
        const res = await api.previewImportEntries(token, file, { mapping, defaults });
        setPreviewEntries(res);
        showMsg(`Validasi selesai: ${res.valid_rows} dari ${res.total_rows} baris valid.`);
      } else {
        const res = await api.previewImportMaster(token, file, masterTarget, { mapping, defaults });
        setPreviewMaster(res);
        showMsg(`Validasi selesai: ${res.valid_rows} dari ${res.total_rows} baris valid.`);
      }
    } catch (error) {
      showMsg(error instanceof Error ? error.message : 'Gagal validasi preview', true);
    } finally {
      setPreviewLoading(false);
    }
  };

  const handleCommit = async () => {
    if (!file) return;
    const token = localStorage.getItem('pasarata_token');
    if (!token) return;

    setCommitLoading(true);
    try {
      if (importMode === 'entries') {
        const res = await api.importEntries(token, file, { mapping, defaults });
        showMsg(`Berhasil! ${res.imported_rows} entri tersimpan ke database.`);
        setPreviewEntries(null);
      } else {
        const res = await api.importMaster(token, file, masterTarget, { mapping, defaults });
        showMsg(`Berhasil! ${res.created_count} dibuat baru, ${res.updated_count} diperbarui.`);
        setPreviewMaster(null);
      }
    } catch (error) {
      showMsg(error instanceof Error ? error.message : 'Gagal commit import', true);
    } finally {
      setCommitLoading(false);
    }
  };

  return (
    <div id="section-import" className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xs">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h3 className="text-base font-bold text-slate-900">Import Data Excel / CSV</h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Import data entri historis atau master komoditas, kategori, satuan, dan pasar secara batch dengan mapping kolom fleksibel.
          </p>
        </div>

        {/* Top Right Toggle Tabs */}
        <div className="flex items-center gap-1 rounded-xl bg-slate-100 p-1 shrink-0 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => {
              setImportMode('entries');
              setPreviewEntries(null);
              setPreviewMaster(null);
            }}
            className={`flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
              importMode === 'entries' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            📊 Data Entri Historis
          </button>
          <button
            type="button"
            onClick={() => {
              setImportMode('master');
              setPreviewEntries(null);
              setPreviewMaster(null);
            }}
            className={`flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
              importMode === 'master' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            ⚙ Master Data (Batch Seed)
          </button>
        </div>
      </div>

      {message && (
        <div className={`mt-4 rounded-xl border px-4 py-2.5 text-xs font-semibold ${
          isError ? 'border-red-200 bg-red-50 text-red-700' : 'border-emerald-200 bg-emerald-50 text-emerald-700'
        }`}>
          {message}
        </div>
      )}

      {/* Step 1: File Input */}
      <div className="mt-5 rounded-xl border border-slate-100 bg-[#F8FAFC] p-4">
        <div className="text-xs font-bold text-slate-700 mb-2">
          1. Pilih File Excel / CSV
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <input
            type="file"
            accept=".xlsx,.xls,.csv"
            onChange={handleFileChange}
            className="text-xs text-slate-600 file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-white file:text-slate-700 file:shadow-xs hover:file:bg-slate-50 cursor-pointer"
          />
          {inspecting && <span className="text-xs text-blue-600 font-medium">Menganalisis file...</span>}
        </div>

        {importMode === 'master' && (
          <div className="mt-4 flex items-center gap-3">
            <span className="text-xs font-semibold text-slate-700">Target Tabel:</span>
            <div className="flex flex-wrap gap-2">
              {(['commodities', 'categories', 'units', 'markets'] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setMasterTarget(t)}
                  className={`rounded-lg px-2.5 py-1 text-xs font-medium capitalize transition ${
                    masterTarget === t ? 'bg-[#0066FF] text-white' : 'bg-white border border-slate-200 text-slate-700'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Step 2: Mapping & Actions if headers are found */}
      {headers.length > 0 && (
        <div className="mt-5 space-y-4">
          <div className="rounded-xl border border-slate-100 bg-[#F8FAFC] p-4">
            <div className="text-xs font-bold text-slate-700 mb-3">
              2. Kolom Mapping ({totalRows} baris ditemukan)
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {currentFields.map((field) => (
                <div key={field.key} className="rounded-lg bg-white p-2.5 border border-slate-200/70">
                  <div className="flex items-center justify-between text-[11px] mb-1 font-semibold text-slate-700">
                    <span>{field.label}</span>
                    {field.required && <span className="text-rose-500">*</span>}
                  </div>
                  <select
                    className="w-full rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs text-slate-800 outline-none"
                    value={mapping[field.key] ?? ''}
                    onChange={(e) => setMapping({ ...mapping, [field.key]: e.target.value })}
                  >
                    <option value="">(Gunakan default / Kosong)</option>
                    {headers.map((h) => (
                      <option key={h} value={h}>{h}</option>
                    ))}
                  </select>
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handlePreview}
              disabled={previewLoading}
              className="rounded-xl bg-[#0066FF] px-4 py-2 text-xs font-bold text-white hover:bg-blue-600 transition"
            >
              {previewLoading ? 'Memeriksa...' : 'Validasi Preview Data'}
            </button>

            {(previewEntries || previewMaster) && (
              <button
                type="button"
                onClick={handleCommit}
                disabled={commitLoading}
                className="rounded-xl bg-[#059669] px-4 py-2 text-xs font-bold text-white hover:bg-emerald-700 transition"
              >
                {commitLoading ? 'Mengimpor...' : 'Mulai Import ke Database'}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

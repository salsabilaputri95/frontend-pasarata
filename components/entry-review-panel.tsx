'use client';

import { useCallback, useEffect, useState } from 'react';
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

type FilterState = {
  year: string;
  market_id: string;
  collector_id: string;
  warning_status: 'normal' | 'below_minimum' | 'above_maximum' | '';
  is_active: 'true' | 'false' | '';
};

const DEFAULT_FILTERS: FilterState = {
  year: String(new Date().getFullYear()),
  market_id: '',
  collector_id: '',
  warning_status: '',
  is_active: '',
};

type EditForm = {
  year: string;
  market_id: string;
  category_id: string;
  commodity_id: string;
  brand_type: string;
  local_unit_id: string;
  local_quantity: string;
  local_weight_kg: string;
  standard_unit_id: string;
  market_price: string;
  minimum_price: string;
  maximum_price: string;
  previous_price: string;
  notes: string;
};

function entryToForm(e: DataEntry): EditForm {
  return {
    year: String(e.year),
    market_id: String(e.market_id),
    category_id: String(e.category_id),
    commodity_id: String(e.commodity_id),
    brand_type: e.brand_type ?? '',
    local_unit_id: String(e.local_unit_id),
    local_quantity: String(e.local_quantity),
    local_weight_kg: String(e.local_weight_kg),
    standard_unit_id: String(e.standard_unit_id),
    market_price: String(e.market_price),
    minimum_price: String(e.minimum_price),
    maximum_price: String(e.maximum_price),
    previous_price: String(e.previous_price ?? 0),
    notes: e.notes ?? '',
  };
}

export function EntryReviewPanel() {
  const [entries, setEntries] = useState<DataEntry[]>([]);
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [isError, setIsError] = useState(false);

  const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTERS);
  const [appliedFilters, setAppliedFilters] = useState<FilterState>(DEFAULT_FILTERS);

  // Edit modal
  const [editingEntry, setEditingEntry] = useState<DataEntry | null>(null);
  const [editForm, setEditForm] = useState<EditForm | null>(null);
  const [editLoading, setEditLoading] = useState(false);

  // Delete confirm
  const [deletingEntryId, setDeletingEntryId] = useState<number | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const showMessage = (msg: string, error = false) => {
    setMessage(msg);
    setIsError(error);
  };

  const downloadFile = (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const loadData = useCallback(async (f: FilterState) => {
    const token = localStorage.getItem('pasarata_token');
    if (!token) return;
    setLoading(true);

    try {
      const [entriesRes, logsRes] = await Promise.all([
        api.adminEntriesFiltered(token, {
          year: f.year ? Number(f.year) : undefined,
          market_id: f.market_id ? Number(f.market_id) : undefined,
          collector_id: f.collector_id ? Number(f.collector_id) : undefined,
          warning_status: f.warning_status || undefined,
          is_active: f.is_active || undefined,
        }),
        api.auditLogs(token),
      ]);

      setEntries(entriesRes.data ?? []);
      setLogs(logsRes.data ?? []);
      showMessage(`${entriesRes.data?.length ?? 0} entri ditemukan`);
    } catch (error) {
      showMessage(error instanceof Error ? error.message : 'Gagal memuat data', true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData(appliedFilters);
  }, [loadData, appliedFilters]);

  const handleApplyFilter = () => {
    setAppliedFilters({ ...filters });
  };

  const handleResetFilter = () => {
    setFilters(DEFAULT_FILTERS);
    setAppliedFilters(DEFAULT_FILTERS);
  };

  const handleExportEntries = async () => {
    const token = localStorage.getItem('pasarata_token');
    if (!token) return;
    try {
      const year = appliedFilters.year ? Number(appliedFilters.year) : new Date().getFullYear();
      const blob = await api.exportReport(token, {
        scope: 'entries',
        format: 'xlsx',
        year,
        market_id: appliedFilters.market_id ? Number(appliedFilters.market_id) : undefined,
        collector_id: appliedFilters.collector_id ? Number(appliedFilters.collector_id) : undefined,
        warning_status: appliedFilters.warning_status || undefined,
      });
      downloadFile(blob, `pasarata-entries-${year}.xlsx`);
      showMessage(`Export tahun ${year} berhasil (XLSX)`);
    } catch (error) {
      showMessage(error instanceof Error ? error.message : 'Gagal export', true);
    }
  };

  // â”€â”€ Edit â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const openEdit = (entry: DataEntry) => {
    setEditingEntry(entry);
    setEditForm(entryToForm(entry));
  };

  const closeEdit = () => {
    setEditingEntry(null);
    setEditForm(null);
  };

  const handleEditSave = async () => {
    if (!editingEntry || !editForm) return;
    const token = localStorage.getItem('pasarata_token');
    if (!token) return;
    setEditLoading(true);
    try {
      await api.adminUpdateEntry(token, editingEntry.id, {
        year: Number(editForm.year),
        market_id: Number(editForm.market_id),
        category_id: Number(editForm.category_id),
        commodity_id: Number(editForm.commodity_id),
        brand_type: editForm.brand_type,
        local_unit_id: Number(editForm.local_unit_id),
        local_quantity: Number(editForm.local_quantity),
        local_weight_kg: Number(editForm.local_weight_kg),
        standard_unit_id: Number(editForm.standard_unit_id),
        market_price: Number(editForm.market_price),
        minimum_price: Number(editForm.minimum_price),
        maximum_price: Number(editForm.maximum_price),
        previous_price: Number(editForm.previous_price),
        notes: editForm.notes,
      });
      showMessage(`Entry #${editingEntry.id} berhasil diperbarui`);
      closeEdit();
      loadData(appliedFilters);
    } catch (error) {
      showMessage(error instanceof Error ? error.message : 'Gagal memperbarui entri', true);
    } finally {
      setEditLoading(false);
    }
  };

  // â”€â”€ Delete â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const confirmDelete = (entryId: number) => setDeletingEntryId(entryId);
  const cancelDelete = () => setDeletingEntryId(null);

  const handleDelete = async () => {
    if (!deletingEntryId) return;
    const token = localStorage.getItem('pasarata_token');
    if (!token) return;
    setDeleteLoading(true);
    try {
      await api.adminDeleteEntry(token, deletingEntryId);
      showMessage(`Entry #${deletingEntryId} berhasil dihapus`);
      setDeletingEntryId(null);
      loadData(appliedFilters);
    } catch (error) {
      showMessage(error instanceof Error ? error.message : 'Gagal menghapus entri', true);
    } finally {
      setDeleteLoading(false);
    }
  };

  const fieldClass = 'w-full rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-800 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-100';

  return (
    <div className="space-y-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div>
        <h3 className="text-lg font-bold text-slate-900">Review Data Pendataan</h3>
        <p className="text-sm text-slate-600">Tinjau, edit, dan hapus entri pendataan. Filter dikirim langsung ke server.</p>
      </div>

      {/* â”€â”€ Filter bar â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
        <div className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Filter</div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <label className="block">
            <span className="mb-1 block text-xs text-slate-500">Tahun</span>
            <input
              id="filter-year"
              type="number"
              min={2020}
              value={filters.year}
              onChange={(e) => setFilters((f) => ({ ...f, year: e.target.value }))}
              className={fieldClass}
            />
          </label>

          <label className="block">
            <span className="mb-1 block text-xs text-slate-500">Market ID</span>
            <input
              id="filter-market-id"
              type="number"
              min={1}
              value={filters.market_id}
              onChange={(e) => setFilters((f) => ({ ...f, market_id: e.target.value }))}
              className={fieldClass}
              placeholder="opsional"
            />
          </label>

          <label className="block">
            <span className="mb-1 block text-xs text-slate-500">Collector ID</span>
            <input
              id="filter-collector-id"
              type="number"
              min={1}
              value={filters.collector_id}
              onChange={(e) => setFilters((f) => ({ ...f, collector_id: e.target.value }))}
              className={fieldClass}
              placeholder="opsional"
            />
          </label>

          <label className="block">
            <span className="mb-1 block text-xs text-slate-500">Warning</span>
            <select
              id="filter-warning"
              className={fieldClass}
              value={filters.warning_status}
              onChange={(e) => setFilters((f) => ({ ...f, warning_status: e.target.value as FilterState['warning_status'] }))}
            >
              <option value="">Semua</option>
              <option value="normal">Normal</option>
              <option value="below_minimum">Di bawah minimum</option>
              <option value="above_maximum">Di atas maksimum</option>
            </select>
          </label>

          <label className="block">
            <span className="mb-1 block text-xs text-slate-500">Status aktif</span>
            <select
              id="filter-is-active"
              className={fieldClass}
              value={filters.is_active}
              onChange={(e) => setFilters((f) => ({ ...f, is_active: e.target.value as FilterState['is_active'] }))}
            >
              <option value="">Semua</option>
              <option value="true">Aktif</option>
              <option value="false">Nonaktif</option>
            </select>
          </label>
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          <button
            id="btn-apply-filter"
            type="button"
            onClick={handleApplyFilter}
            className="rounded-lg bg-sky-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-sky-700 transition-colors"
          >
            Terapkan Filter
          </button>
          <button
            id="btn-reset-filter"
            type="button"
            onClick={handleResetFilter}
            className="rounded-lg border border-slate-200 px-4 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-100 transition-colors"
          >
            Reset
          </button>
          <button
            id="btn-export-entries"
            type="button"
            onClick={handleExportEntries}
            className="ml-auto rounded-lg bg-emerald-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-emerald-700 transition-colors"
          >
            Export XLSX
          </button>
        </div>
      </div>

      {/* â”€â”€ Status message â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      {message ? (
        <div className={`rounded-lg border px-3 py-2 text-sm ${isError ? 'border-red-200 bg-red-50 text-red-700' : 'border-sky-200 bg-sky-50 text-sky-700'}`}>
          {message}
        </div>
      ) : null}

      {loading ? (
        <div className="text-sm text-slate-500">Memuat data...</div>
      ) : (
        <div className="grid gap-6 xl:grid-cols-[1.7fr_1fr]">
          {/* â”€â”€ Entry list â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
          <div className="space-y-3">
            {entries.length === 0 ? (
              <div className="rounded-lg border border-slate-200 p-4 text-sm text-slate-500 text-center">
                Tidak ada entri yang cocok dengan filter ini.
              </div>
            ) : (
              entries.map((entry) => (
                <div
                  key={entry.id}
                  className={`rounded-xl border p-4 transition-all ${entry.is_active ? 'border-slate-200 bg-white' : 'border-slate-100 bg-slate-50 opacity-70'}`}
                >
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <div className="font-semibold text-slate-900">
                        Entry #{entry.id}
                        {!entry.is_active && (
                          <span className="ml-2 text-xs font-normal text-slate-400">(nonaktif)</span>
                        )}
                      </div>
                      <div className="text-xs text-slate-500">
                        Tahun {entry.year} â€¢{' '}
                        {entry.market?.name ?? `Pasar #${entry.market_id}`} â€¢{' '}
                        {entry.commodity?.name ?? `Komoditas #${entry.commodity_id}`}
                        {entry.brand_type ? ` â€” ${entry.brand_type}` : ''}
                      </div>
                      <div className="mt-0.5 text-xs text-slate-400">
                        Collector #{entry.collector_id}
                        {entry.created_at ? ` â€¢ ${new Date(entry.created_at).toLocaleDateString('id-ID')}` : ''}
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                        entry.warning_status === 'normal'
                          ? 'bg-emerald-100 text-emerald-700'
                          : 'bg-amber-100 text-amber-700'
                      }`}>
                        {entry.warning_status === 'normal' ? 'normal' : entry.warning_status === 'below_minimum' ? 'âš  di bawah min' : 'âš  di atas maks'}
                      </span>

                      <button
                        id={`btn-edit-entry-${entry.id}`}
                        type="button"
                        onClick={() => openEdit(entry)}
                        className="rounded-lg border border-sky-200 bg-sky-50 px-3 py-1 text-xs font-medium text-sky-700 hover:bg-sky-100 transition-colors"
                      >
                        Edit
                      </button>
                      <button
                        id={`btn-delete-entry-${entry.id}`}
                        type="button"
                        onClick={() => confirmDelete(entry.id)}
                        className="rounded-lg border border-red-200 bg-red-50 px-3 py-1 text-xs font-medium text-red-700 hover:bg-red-100 transition-colors"
                      >
                        Hapus
                      </button>
                    </div>
                  </div>

                  <div className="mt-3 grid gap-1 text-xs text-slate-600 sm:grid-cols-3">
                    <div>Harga pasar: <span className="font-medium">Rp {Number(entry.market_price).toLocaleString('id-ID')}</span></div>
                    <div>Min: <span className="font-medium">Rp {Number(entry.minimum_price).toLocaleString('id-ID')}</span></div>
                    <div>Maks: <span className="font-medium">Rp {Number(entry.maximum_price).toLocaleString('id-ID')}</span></div>
                    <div>Konversi: <span className="font-medium">Rp {Number(entry.converted_price).toLocaleString('id-ID')}</span></div>
                    <div>Berat: <span className="font-medium">{entry.local_weight_kg} kg</span></div>
                    <div>Satuan lokal: <span className="font-medium">{entry.local_unit?.name ?? `#${entry.local_unit_id}`}</span></div>
                  </div>
                  {entry.notes ? <div className="mt-2 text-xs text-slate-500">Catatan: {entry.notes}</div> : null}
                </div>
              ))
            )}
          </div>

          {/* â”€â”€ Audit log â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <h4 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Audit Log (terbaru)</h4>
            <div className="mt-3 space-y-3">
              {logs.length === 0 ? (
                <div className="text-sm text-slate-500">Belum ada log aktivitas.</div>
              ) : (
                logs.slice(0, 10).map((log) => (
                  <div key={log.id} className="rounded-lg border border-slate-200 bg-white p-3 text-xs text-slate-700">
                    <div className="flex items-center justify-between gap-2">
                      <span className={`rounded px-1.5 py-0.5 font-semibold ${
                        log.action === 'delete' ? 'bg-red-100 text-red-700' :
                        log.action === 'update' ? 'bg-amber-100 text-amber-700' :
                        'bg-sky-100 text-sky-700'
                      }`}>
                        {log.action}
                      </span>
                      <span className="text-slate-400">Entry #{log.entry_id}</span>
                    </div>
                    <div className="mt-1 text-slate-500">
                      {log.user?.full_name ?? 'System'} â€¢{' '}
                      {log.created_at ? new Date(log.created_at).toLocaleString('id-ID') : '-'}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* â”€â”€ Modal Edit â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      {editingEntry && editForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" role="dialog" aria-modal="true">
          <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl">
            <div className="mb-4 flex items-center justify-between">
              <h4 className="text-base font-bold text-slate-900">Edit Entry #{editingEntry.id}</h4>
              <button
                id="btn-close-edit-modal"
                type="button"
                onClick={closeEdit}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                âœ•
              </button>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              {(
                [
                  ['year', 'Tahun', 'number'],
                  ['market_id', 'Market ID', 'number'],
                  ['category_id', 'Kategori ID', 'number'],
                  ['commodity_id', 'Komoditas ID', 'number'],
                  ['brand_type', 'Jenis/Merek', 'text'],
                  ['local_unit_id', 'Satuan Lokal ID', 'number'],
                  ['local_quantity', 'Kuantitas Lokal', 'number'],
                  ['local_weight_kg', 'Berat (kg)', 'number'],
                  ['standard_unit_id', 'Satuan Standar ID', 'number'],
                  ['market_price', 'Harga Pasar', 'number'],
                  ['minimum_price', 'Harga Minimum', 'number'],
                  ['maximum_price', 'Harga Maksimum', 'number'],
                  ['previous_price', 'Harga Sebelumnya', 'number'],
                ] as [keyof EditForm, string, string][]
              ).map(([key, label, type]) => (
                <label key={key} className="block">
                  <span className="mb-1 block text-xs text-slate-500">{label}</span>
                  <input
                    id={`edit-${key}`}
                    type={type}
                    value={editForm[key]}
                    onChange={(e) => setEditForm((f) => f ? { ...f, [key]: e.target.value } : f)}
                    className={fieldClass}
                  />
                </label>
              ))}

              <label className="block sm:col-span-2">
                <span className="mb-1 block text-xs text-slate-500">Catatan</span>
                <textarea
                  id="edit-notes"
                  value={editForm.notes}
                  onChange={(e) => setEditForm((f) => f ? { ...f, notes: e.target.value } : f)}
                  rows={3}
                  className={`${fieldClass} resize-none`}
                />
              </label>
            </div>

            <div className="mt-5 flex gap-3 justify-end">
              <button
                id="btn-cancel-edit"
                type="button"
                onClick={closeEdit}
                className="rounded-lg border border-slate-200 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50"
              >
                Batal
              </button>
              <button
                id="btn-save-edit"
                type="button"
                onClick={handleEditSave}
                disabled={editLoading}
                className="rounded-lg bg-sky-600 px-4 py-2 text-sm font-medium text-white hover:bg-sky-700 disabled:opacity-60"
              >
                {editLoading ? 'Menyimpan...' : 'Simpan Perubahan'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* â”€â”€ Konfirmasi Hapus â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      {deletingEntryId !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" role="dialog" aria-modal="true">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl">
            <h4 className="text-base font-bold text-slate-900">Hapus Entri #{deletingEntryId}?</h4>
            <p className="mt-2 text-sm text-slate-600">
              Tindakan ini <strong>tidak dapat dibatalkan</strong>. Data akan dihapus permanen dari sistem.
            </p>
            <div className="mt-5 flex gap-3 justify-end">
              <button
                id="btn-cancel-delete"
                type="button"
                onClick={cancelDelete}
                className="rounded-lg border border-slate-200 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50"
              >
                Batal
              </button>
              <button
                id="btn-confirm-delete"
                type="button"
                onClick={handleDelete}
                disabled={deleteLoading}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-60"
              >
                {deleteLoading ? 'Menghapus...' : 'Ya, Hapus'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

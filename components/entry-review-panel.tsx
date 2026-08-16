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
  year: '2026',
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
      const year = appliedFilters.year ? Number(appliedFilters.year) : 2026;
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

  // Edit actions
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

  const fieldClass =
    'w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500';

  return (
    <div id="section-review" className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xs">
      <div>
        <h3 className="text-base font-bold text-slate-900">Review Data Pendataan</h3>
        <p className="text-xs text-slate-500 mt-0.5">
          Tinjau, edit, dan hapus entri pendataan. Filter dikirim langsung ke server.
        </p>
      </div>

      {/* FILTER BAR */}
      <div className="mt-5">
        <div className="text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-2">
          FILTER
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3">
          <div>
            <label className="block text-xs text-slate-500 mb-1">Tahun</label>
            <input
              id="filter-year"
              type="number"
              min={2020}
              value={filters.year}
              onChange={(e) => setFilters((f) => ({ ...f, year: e.target.value }))}
              className={fieldClass}
            />
          </div>

          <div>
            <label className="block text-xs text-slate-500 mb-1">Market ID</label>
            <input
              id="filter-market-id"
              type="number"
              min={1}
              value={filters.market_id}
              onChange={(e) => setFilters((f) => ({ ...f, market_id: e.target.value }))}
              className={fieldClass}
              placeholder="opsional"
            />
          </div>

          <div>
            <label className="block text-xs text-slate-500 mb-1">Collector ID</label>
            <input
              id="filter-collector-id"
              type="number"
              min={1}
              value={filters.collector_id}
              onChange={(e) => setFilters((f) => ({ ...f, collector_id: e.target.value }))}
              className={fieldClass}
              placeholder="opsional"
            />
          </div>

          <div>
            <label className="block text-xs text-slate-500 mb-1">Warning</label>
            <select
              id="filter-warning"
              className={fieldClass}
              value={filters.warning_status}
              onChange={(e) =>
                setFilters((f) => ({ ...f, warning_status: e.target.value as FilterState['warning_status'] }))
              }
            >
              <option value="">Semua</option>
              <option value="normal">Normal</option>
              <option value="below_minimum">Di bawah minimum</option>
              <option value="above_maximum">Di atas maksimum</option>
            </select>
          </div>

          <div>
            <label className="block text-xs text-slate-500 mb-1">Status aktif</label>
            <select
              id="filter-is-active"
              className={fieldClass}
              value={filters.is_active}
              onChange={(e) =>
                setFilters((f) => ({ ...f, is_active: e.target.value as FilterState['is_active'] }))
              }
            >
              <option value="">Semua</option>
              <option value="true">Aktif</option>
              <option value="false">Nonaktif</option>
            </select>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <button
            id="btn-apply-filter"
            type="button"
            onClick={handleApplyFilter}
            className="rounded-xl bg-[#0066FF] px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-blue-600 transition"
          >
            Terapkan Filter
          </button>
          <button
            id="btn-reset-filter"
            type="button"
            onClick={handleResetFilter}
            className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
          >
            Reset
          </button>
          <button
            id="btn-export-entries"
            type="button"
            onClick={handleExportEntries}
            className="ml-auto rounded-xl bg-[#059669] px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-emerald-700 transition"
          >
            Export XLSX
          </button>
        </div>
      </div>

      {/* Alert strip: "x entri ditemukan" */}
      <div className="mt-4 rounded-xl border border-sky-200 bg-[#EFF6FF] px-4 py-2.5 text-xs font-semibold text-[#0066FF]">
        {loading ? 'Memuat data...' : `${entries.length} entri ditemukan`}
      </div>

      {/* Two columns content */}
      <div className="mt-4 grid grid-cols-1 lg:grid-cols-[1.6fr_1fr] gap-4">
        {/* Left: Entries list / empty state */}
        <div className="rounded-xl border border-slate-100 bg-[#F8FAFC] p-4">
          {entries.length === 0 ? (
            <div className="py-6 text-center text-xs text-slate-400">
              Tidak ada entri yang cocok dengan filter ini.
            </div>
          ) : (
            <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1">
              {entries.map((entry) => (
                <div
                  key={entry.id}
                  className="rounded-xl border border-slate-200/70 bg-white p-3 shadow-2xs hover:border-slate-300 transition"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="text-xs font-bold text-slate-900">
                        #{entry.id} • {entry.commodity?.name ?? `Komoditas #${entry.commodity_id}`}
                      </div>
                      <div className="text-[11px] text-slate-500">
                        {entry.market?.name ?? `Pasar #${entry.market_id}`} • Petugas #{entry.collector_id}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs font-bold text-slate-900">
                        Rp {Number(entry.market_price).toLocaleString('id-ID')}
                      </div>
                      <span
                        className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold mt-0.5 ${
                          entry.warning_status === 'normal'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {entry.warning_status === 'normal' ? 'Normal' : 'Warning'}
                      </span>
                    </div>
                  </div>

                  <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-end gap-2">
                    <button
                      onClick={() => openEdit(entry)}
                      className="rounded-lg px-2.5 py-1 text-[11px] font-semibold text-blue-600 hover:bg-blue-50 transition"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => setDeletingEntryId(entry.id)}
                      className="rounded-lg px-2.5 py-1 text-[11px] font-semibold text-rose-600 hover:bg-rose-50 transition"
                    >
                      Hapus
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right: AUDIT LOG (TERBARU) */}
        <div className="rounded-xl border border-slate-100 bg-[#F8FAFC] p-4">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-2">
            AUDIT LOG (TERBARU)
          </div>

          {logs.length === 0 ? (
            <div className="py-6 text-center text-xs text-slate-400">
              Belum ada log aktivitas.
            </div>
          ) : (
            <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
              {logs.slice(0, 10).map((log) => (
                <div
                  key={log.id}
                  className="rounded-lg border border-slate-200/60 bg-white p-2.5 text-xs text-slate-700"
                >
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-bold text-slate-900">{log.action}</span>
                    <span className="text-slate-400">#{log.entry_id}</span>
                  </div>
                  <div className="text-[10px] text-slate-500 mt-0.5">
                    Oleh: {log.user?.full_name ?? 'Sistem'}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Edit Modal */}
      {editingEntry && editForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" role="dialog" aria-modal="true">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h4 className="text-sm font-bold text-slate-900">Edit Entri #{editingEntry.id}</h4>
              <button onClick={closeEdit} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            <div className="mt-4 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <label className="block">
                  <span className="text-xs text-slate-500">Harga Pasar (Rp)</span>
                  <input
                    type="number"
                    value={editForm.market_price}
                    onChange={(e) => setEditForm({ ...editForm, market_price: e.target.value })}
                    className={fieldClass}
                  />
                </label>
                <label className="block">
                  <span className="text-xs text-slate-500">Berat Bersih (kg)</span>
                  <input
                    type="number"
                    step="0.01"
                    value={editForm.local_weight_kg}
                    onChange={(e) => setEditForm({ ...editForm, local_weight_kg: e.target.value })}
                    className={fieldClass}
                  />
                </label>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <label className="block">
                  <span className="text-xs text-slate-500">Harga Min (Rp)</span>
                  <input
                    type="number"
                    value={editForm.minimum_price}
                    onChange={(e) => setEditForm({ ...editForm, minimum_price: e.target.value })}
                    className={fieldClass}
                  />
                </label>
                <label className="block">
                  <span className="text-xs text-slate-500">Harga Maks (Rp)</span>
                  <input
                    type="number"
                    value={editForm.maximum_price}
                    onChange={(e) => setEditForm({ ...editForm, maximum_price: e.target.value })}
                    className={fieldClass}
                  />
                </label>
              </div>

              <label className="block">
                <span className="text-xs text-slate-500">Catatan</span>
                <input
                  type="text"
                  value={editForm.notes}
                  onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                  className={fieldClass}
                />
              </label>
            </div>

            <div className="mt-5 flex justify-end gap-2 border-t border-slate-100 pt-3">
              <button onClick={closeEdit} className="rounded-xl border border-slate-200 px-3.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50">
                Batal
              </button>
              <button
                onClick={handleEditSave}
                disabled={editLoading}
                className="rounded-xl bg-[#0066FF] px-4 py-1.5 text-xs font-bold text-white hover:bg-blue-600 transition"
              >
                {editLoading ? 'Menyimpan...' : 'Simpan Perubahan'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingEntryId !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" role="dialog" aria-modal="true">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl">
            <h4 className="text-sm font-bold text-slate-900">Konfirmasi Hapus Entri</h4>
            <p className="mt-2 text-xs text-slate-600">
              Apakah Anda yakin ingin menghapus entri #{deletingEntryId}?
            </p>
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setDeletingEntryId(null)}
                className="rounded-xl border border-slate-200 px-3.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={deleteLoading}
                onClick={handleDelete}
                className="rounded-xl bg-red-600 px-3.5 py-1.5 text-xs font-bold text-white hover:bg-red-700"
              >
                {deleteLoading ? 'Menghapus...' : 'Hapus'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { EmptyDocIcon } from './icons';

type AssignmentRecord = {
  id: number;
  user_id: number;
  market_id: number;
  user?: { full_name?: string; username?: string };
  market?: { name?: string; district?: string };
};

export function AssignmentPanel() {
  const [assignments, setAssignments] = useState<AssignmentRecord[]>([]);
  const [collectors, setCollectors] = useState<Array<{ id: number; full_name: string; username: string }>>([]);
  const [markets, setMarkets] = useState<Array<{ id: number; name: string; district: string }>>([]);
  const [form, setForm] = useState({ user_id: '', market_id: '' });
  const [message, setMessage] = useState('');
  const [isError, setIsError] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [search, setSearch] = useState('');

  const showMsg = (msg: string, error = false) => {
    setMessage(msg);
    setIsError(error);
  };

  const loadData = async () => {
    const token = localStorage.getItem('pasarata_token');
    if (!token) return;

    try {
      const [assignmentData, collectorsData, marketData] = await Promise.all([
        api.assignments(token),
        api.collectors(token),
        api.markets(token),
      ]);

      setAssignments(assignmentData.data ?? []);
      setCollectors(collectorsData.data ?? []);
      setMarkets(marketData.data ?? []);
    } catch (error) {
      showMsg(error instanceof Error ? error.message : 'Gagal memuat tugas pasar', true);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSubmit = async () => {
    if (!form.user_id || !form.market_id) {
      showMsg('Pilih pendata dan pasar terlebih dahulu', true);
      return;
    }

    const token = localStorage.getItem('pasarata_token');
    if (!token) return;

    try {
      await api.createAssignment(token, { user_id: Number(form.user_id), market_id: Number(form.market_id) });
      showMsg('Penugasan berhasil dibuat');
      setForm({ user_id: '', market_id: '' });
      await loadData();
    } catch (error) {
      showMsg(error instanceof Error ? error.message : 'Gagal menambahkan tugas', true);
    }
  };

  const handleDelete = async (id: number) => {
    const token = localStorage.getItem('pasarata_token');
    if (!token) return;
    setDeleteLoading(true);
    try {
      await api.deleteAssignment(token, id);
      showMsg('Penugasan berhasil dihapus.');
      setDeletingId(null);
      await loadData();
    } catch (error) {
      showMsg(error instanceof Error ? error.message : 'Gagal menghapus penugasan', true);
    } finally {
      setDeleteLoading(false);
    }
  };

  const filteredAssignments = assignments.filter((a) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      (a.user?.full_name && a.user.full_name.toLowerCase().includes(q)) ||
      (a.user?.username && a.user.username.toLowerCase().includes(q)) ||
      (a.market?.name && a.market.name.toLowerCase().includes(q)) ||
      (a.market?.district && a.market.district.toLowerCase().includes(q))
    );
  });

  return (
    <div id="section-penugasan" className="w-full space-y-6 rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xs">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-100 pb-4">
        <div>
          <h3 className="text-base font-bold text-slate-900">Penugasan Pasar</h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Tetapkan pendata ke pasar tertentu agar akses dan tugas terbatas sesuai wilayah kerja yang ditentukan.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="rounded-full bg-blue-50 border border-blue-100 px-3 py-1 text-xs font-semibold text-blue-700">
            {assignments.length} Total Penugasan
          </span>
        </div>
      </div>

      {message && (
        <div className={`rounded-xl border px-4 py-2.5 text-xs font-semibold ${
          isError ? 'border-red-200 bg-red-50 text-red-700' : 'border-emerald-200 bg-emerald-50 text-emerald-700'
        }`}>
          {message}
        </div>
      )}

      {/* Form Tambah Penugasan */}
      <div className="rounded-xl border border-slate-100 bg-[#F8FAFC] p-4">
        <div className="text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-3">
          BUAT PENUGASAN BARU
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
          <div className="sm:col-span-5">
            <label className="block text-xs font-medium text-slate-600 mb-1">Pilih Petugas Pendata</label>
            <select
              id="assign-collector"
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
              value={form.user_id}
              onChange={(e) => setForm({ ...form, user_id: e.target.value })}
            >
              <option value="">-- Pilih Pendata --</option>
              {collectors.map((c) => (
                <option key={c.id} value={c.id}>{c.full_name} (@{c.username})</option>
              ))}
            </select>
          </div>

          <div className="sm:col-span-5">
            <label className="block text-xs font-medium text-slate-600 mb-1">Pilih Pasar Wilayah</label>
            <select
              id="assign-market"
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
              value={form.market_id}
              onChange={(e) => setForm({ ...form, market_id: e.target.value })}
            >
              <option value="">-- Pilih Pasar --</option>
              {markets.map((m) => (
                <option key={m.id} value={m.id}>{m.name} - {m.district}</option>
              ))}
            </select>
          </div>

          <div className="sm:col-span-2">
            <button
              id="btn-create-assignment"
              type="button"
              onClick={handleSubmit}
              className="w-full rounded-xl bg-[#0066FF] px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-blue-600 active:scale-98 transition text-center"
            >
              Simpan
            </button>
          </div>
        </div>
      </div>

      {/* Tabel Daftar Penugasan */}
      <div>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-3">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-700">
              DAFTAR PENUGASAN AKTIF
            </span>
            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-600">
              {filteredAssignments.length}
            </span>
          </div>

          <input
            type="text"
            placeholder="Cari pendata atau pasar..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full sm:w-64 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-800 outline-none focus:border-blue-500"
          />
        </div>

        {filteredAssignments.length === 0 ? (
          <div className="rounded-xl border border-slate-100 bg-[#F8FAFC] py-12 text-center">
            <div className="flex flex-col items-center justify-center">
              <EmptyDocIcon className="w-10 h-10 text-slate-300 mb-2" />
              <span className="text-xs text-slate-500 font-medium">
                {search ? 'Tidak ada penugasan yang sesuai dengan pencarian.' : 'Belum ada penugasan pasar.'}
              </span>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-slate-200/70">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200/80 bg-slate-50/80 text-[11px] font-bold uppercase tracking-wider text-slate-600">
                  <th className="py-3 px-4">PETUGAS PENDATA</th>
                  <th className="py-3 px-4">USERNAME</th>
                  <th className="py-3 px-4">PASAR DITUGASKAN</th>
                  <th className="py-3 px-4">WILAYAH / KECAMATAN</th>
                  <th className="py-3 px-4 text-right">AKSI</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredAssignments.map((a) => (
                  <tr key={a.id} className="hover:bg-slate-50 transition">
                    <td className="py-3 px-4 font-bold text-slate-900">
                      {a.user?.full_name ?? `Pendata #${a.user_id}`}
                    </td>
                    <td className="py-3 px-4 text-slate-500">
                      @{a.user?.username ?? '-'}
                    </td>
                    <td className="py-3 px-4 font-semibold text-blue-600">
                      {a.market?.name ?? `Pasar #${a.market_id}`}
                    </td>
                    <td className="py-3 px-4 text-slate-600">
                      {a.market?.district ?? '-'}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        type="button"
                        onClick={() => setDeletingId(a.id)}
                        className="rounded-lg px-2.5 py-1 text-xs font-semibold text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-200 transition"
                      >
                        Hapus Tugas
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {deletingId !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" role="dialog" aria-modal="true">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl">
            <h4 className="text-sm font-bold text-slate-900">Konfirmasi Hapus Penugasan</h4>
            <p className="mt-2 text-xs text-slate-600">
              Apakah Anda yakin ingin menghapus penugasan ini? Pendata tidak akan dapat menginput data untuk pasar ini lagi.
            </p>
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setDeletingId(null)}
                className="rounded-xl border border-slate-200 px-3.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={deleteLoading}
                onClick={() => handleDelete(deletingId)}
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

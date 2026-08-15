'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';

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

  const showMsg = (msg: string, error = false) => { setMessage(msg); setIsError(error); };

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
      showMsg('Penugasan berhasil dihapus. Pendata tidak dapat lagi input ke pasar tersebut.');
      setDeletingId(null);
      await loadData();
    } catch (error) {
      showMsg(error instanceof Error ? error.message : 'Gagal menghapus penugasan', true);
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <div className="space-y-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div>
        <h3 className="text-lg font-bold text-slate-900">Penugasan Pasar</h3>
        <p className="text-sm text-slate-600">Tetapkan pendata ke pasar tertentu agar akses dan tugas terbatas sesuai wilayah.</p>
      </div>

      {message ? (
        <div className={`rounded-lg border px-3 py-2 text-sm ${isError ? 'border-red-200 bg-red-50 text-red-700' : 'border-emerald-200 bg-emerald-50 text-emerald-700'}`}>
          {message}
        </div>
      ) : null}

      <div className="grid gap-4 md:grid-cols-3">
        <label className="block">
          <span className="mb-1 block text-sm font-medium text-slate-700">Pendata</span>
          <select id="assign-collector" className="input" value={form.user_id} onChange={(e) => setForm({ ...form, user_id: e.target.value })}>
            <option value="">Pilih pendata</option>
            {collectors.map((collector) => (
              <option key={collector.id} value={collector.id}>{collector.full_name}</option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="mb-1 block text-sm font-medium text-slate-700">Pasar</span>
          <select id="assign-market" className="input" value={form.market_id} onChange={(e) => setForm({ ...form, market_id: e.target.value })}>
            <option value="">Pilih pasar</option>
            {markets.map((market) => (
              <option key={market.id} value={market.id}>{market.name} - {market.district}</option>
            ))}
          </select>
        </label>

        <div className="flex items-end">
          <button id="btn-create-assignment" onClick={handleSubmit} className="btn-primary w-full">Simpan penugasan</button>
        </div>
      </div>

      <div>
        <h4 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">
          Daftar penugasan <span className="ml-1 rounded-full bg-slate-100 px-2 text-xs text-slate-500">{assignments.length}</span>
        </h4>
        <div className="space-y-2">
          {assignments.length === 0 ? (
            <div className="rounded-lg border border-slate-200 p-3 text-sm text-slate-500">Belum ada penugasan.</div>
          ) : (
            assignments.map((assignment) => (
              <div key={assignment.id} className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700">
                <div>
                  <span className="font-semibold">{assignment.user?.full_name ?? 'Pendata'}</span>
                  <span className="mx-2 text-slate-400">â†’</span>
                  <span>{assignment.market?.name ?? 'Pasar'} ({assignment.market?.district ?? '-'})</span>
                </div>
                <button
                  id={`btn-delete-assignment-${assignment.id}`}
                  type="button"
                  onClick={() => setDeletingId(assignment.id)}
                  className="shrink-0 rounded border border-red-200 bg-red-50 px-2 py-1 text-xs text-red-700 hover:bg-red-100 transition-colors"
                >
                  Hapus
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Konfirmasi hapus assignment */}
      {deletingId !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" role="dialog" aria-modal="true">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl">
            {(() => {
              const a = assignments.find((x) => x.id === deletingId);
              return (
                <>
                  <h4 className="text-base font-bold text-slate-900">Hapus Penugasan?</h4>
                  <p className="mt-2 text-sm text-slate-600">
                    <strong>{a?.user?.full_name ?? 'Pendata'}</strong> tidak akan bisa input data ke{' '}
                    <strong>{a?.market?.name ?? 'pasar ini'}</strong> setelah penugasan dihapus.
                  </p>
                </>
              );
            })()}
            <div className="mt-5 flex gap-3 justify-end">
              <button
                id="btn-cancel-delete-assignment"
                type="button"
                onClick={() => setDeletingId(null)}
                className="rounded-lg border border-slate-200 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50"
              >
                Batal
              </button>
              <button
                id="btn-confirm-delete-assignment"
                type="button"
                onClick={() => handleDelete(deletingId)}
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


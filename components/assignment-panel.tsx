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
      setMessage(error instanceof Error ? error.message : 'Gagal memuat tugas pasar');
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
      setMessage('Penugasan berhasil dibuat');
      setForm({ user_id: '', market_id: '' });
      await loadData();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Gagal menambahkan tugas');
    }
  };

  return (
    <div className="space-y-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div>
        <h3 className="text-lg font-bold text-slate-900">Penugasan Pasar</h3>
        <p className="text-sm text-slate-600">Tetapkan pendata ke pasar tertentu agar akses dan tugas terbatas sesuai wilayah.</p>
      </div>

      {message ? <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{message}</div> : null}

      <div className="grid gap-4 md:grid-cols-3">
        <label className="block">
          <span className="mb-1 block text-sm font-medium text-slate-700">Pendata</span>
          <select className="input" value={form.user_id} onChange={(e) => setForm({ ...form, user_id: e.target.value })}>
            <option value="">Pilih pendata</option>
            {collectors.map((collector) => (
              <option key={collector.id} value={collector.id}>{collector.full_name}</option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="mb-1 block text-sm font-medium text-slate-700">Pasar</span>
          <select className="input" value={form.market_id} onChange={(e) => setForm({ ...form, market_id: e.target.value })}>
            <option value="">Pilih pasar</option>
            {markets.map((market) => (
              <option key={market.id} value={market.id}>{market.name} - {market.district}</option>
            ))}
          </select>
        </label>

        <div className="flex items-end">
          <button onClick={handleSubmit} className="btn-primary w-full">Simpan penugasan</button>
        </div>
      </div>

      <div>
        <h4 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">Daftar penugasan</h4>
        <div className="space-y-2">
          {assignments.length === 0 ? (
            <div className="rounded-lg border border-slate-200 p-3 text-sm text-slate-500">Belum ada penugasan.</div>
          ) : (
            assignments.map((assignment) => (
              <div key={assignment.id} className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700">
                <span className="font-semibold">{assignment.user?.full_name ?? 'Pendata'}</span>
                <span className="mx-2 text-slate-400">→</span>
                <span>{assignment.market?.name ?? 'Pasar'} ({assignment.market?.district ?? '-'})</span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

'use client';

import { useEffect, useState } from 'react';
import { DashboardShell } from '@/components/dashboard-shell';
import { AdminManagementPanel } from '@/components/admin-management';
import { AssignmentPanel } from '@/components/assignment-panel';
import { ComparisonPanel } from '@/components/comparison-panel';
import { EntryReviewPanel } from '@/components/entry-review-panel';
import { ImportPanel } from '@/components/import-panel';
import { SummaryPanel } from '@/components/summary-panel';
import { api } from '@/lib/api';

type Summary = {
  collectors: number;
  markets: number;
  commodities: number;
  total_entries: number;
  warning_entries: number;
};

export default function AdminDashboardPage() {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('pasarata_token');
    if (!token) return;

    api.adminDashboard(token)
      .then((data) => {
        setSummary({
          collectors: data.collectors ?? 0,
          markets: data.markets ?? 0,
          commodities: data.commodities ?? 0,
          total_entries: data.total_entries ?? 0,
          warning_entries: data.warning_entries ?? 0,
        });
        setMessage(data.message ?? 'Admin dashboard aktif');
      })
      .catch((error) => setMessage(error.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <DashboardShell title="Dashboard Admin">
      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-5">
        <Card title="Total Pendata" value={loading ? '...' : String(summary?.collectors ?? 0)} tone="emerald" />
        <Card title="Total Pasar" value={loading ? '...' : String(summary?.markets ?? 0)} tone="sky" />
        <Card title="Total Komoditas" value={loading ? '...' : String(summary?.commodities ?? 0)} tone="amber" />
        <Card title="Total Data" value={loading ? '...' : String(summary?.total_entries ?? 0)} tone="violet" />
        <Card title="Data Warning" value={loading ? '...' : String(summary?.warning_entries ?? 0)} tone="rose" />
      </div>

      <div className="mt-8">
        <AssignmentPanel />
      </div>

      <div className="mt-8">
        <EntryReviewPanel />
      </div>

      <div className="mt-8">
        <ComparisonPanel />
      </div>

      <div className="mt-8">
        <SummaryPanel />
      </div>

      <div className="mt-8">
        <ImportPanel />
      </div>

      <div className="mt-8">
        <AdminManagementPanel />
      </div>

      <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-bold text-slate-900">Status sistem</h2>
        <p className="mt-3 text-slate-600">{message}</p>
      </div>
    </DashboardShell>
  );
}

function Card({ title, value, tone }: { title: string; value: string; tone: 'emerald' | 'sky' | 'amber' | 'violet' | 'rose' }) {
  const toneMap = {
    emerald: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    sky: 'bg-sky-50 text-sky-700 border-sky-200',
    amber: 'bg-amber-50 text-amber-700 border-amber-200',
    violet: 'bg-violet-50 text-violet-700 border-violet-200',
    rose: 'bg-rose-50 text-rose-700 border-rose-200',
  };

  return (
    <div className={`rounded-2xl border p-5 shadow-sm ${toneMap[tone]}`}>
      <div className="text-sm font-medium">{title}</div>
      <div className="mt-3 text-3xl font-black">{value}</div>
    </div>
  );
}

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
import type { AdminSummary } from '@/lib/types';

export default function AdminDashboardPage() {
  const [data, setData] = useState<AdminSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [activeBreakdownTab, setActiveBreakdownTab] = useState<'year' | 'market' | 'collector' | 'recent'>('year');

  useEffect(() => {
    const token = localStorage.getItem('pasarata_token');
    if (!token) return;

    api.adminDashboard(token)
      .then((res) => {
        setData(res);
        setMessage(res.message ?? 'Admin dashboard aktif');
      })
      .catch((error) => setMessage(error.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <DashboardShell title="Dashboard Admin">
      {/* ── 5 Summary Cards ────────────────────────────────────────── */}
      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-5">
        <Card title="Total Pendata" value={loading ? '...' : String(data?.collectors ?? 0)} tone="emerald" subtitle="User aktif" />
        <Card title="Total Pasar" value={loading ? '...' : String(data?.markets ?? 0)} tone="sky" subtitle="Wilayah pantau" />
        <Card title="Total Komoditas" value={loading ? '...' : String(data?.commodities ?? 0)} tone="amber" subtitle="Item komoditas" />
        <Card title="Total Data Entri" value={loading ? '...' : String(data?.total_entries ?? 0)} tone="violet" subtitle="Keseluruhan entri" />
        <Card title="Data Warning" value={loading ? '...' : String(data?.warning_entries ?? 0)} tone="rose" subtitle="Perlu peninjauan" />
      </div>

      {/* ── Monitoring Breakdown Section (STEP-07) ──────────────────── */}
      <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Monitoring & Sebaran Data</h2>
            <p className="text-xs text-slate-500">Pantau distribusi entri pendataan berdasarkan tahun, pasar, petugas, dan feed data terbaru.</p>
          </div>

          <div className="flex flex-wrap gap-1 rounded-xl bg-slate-100 p-1">
            <button
              id="tab-breakdown-year"
              type="button"
              onClick={() => setActiveBreakdownTab('year')}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                activeBreakdownTab === 'year' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              📅 Per Tahun ({data?.by_year?.length ?? 0})
            </button>
            <button
              id="tab-breakdown-market"
              type="button"
              onClick={() => setActiveBreakdownTab('market')}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                activeBreakdownTab === 'market' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              🏪 Per Pasar ({data?.by_market?.length ?? 0})
            </button>
            <button
              id="tab-breakdown-collector"
              type="button"
              onClick={() => setActiveBreakdownTab('collector')}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                activeBreakdownTab === 'collector' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              👤 Per Pendata ({data?.by_collector?.length ?? 0})
            </button>
            <button
              id="tab-breakdown-recent"
              type="button"
              onClick={() => setActiveBreakdownTab('recent')}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                activeBreakdownTab === 'recent' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              ⚡ 10 Entri Terbaru
            </button>
          </div>
        </div>

        <div className="mt-5">
          {loading ? (
            <p className="py-6 text-center text-sm text-slate-500">Memuat rincian monitoring...</p>
          ) : (
            <>
              {/* TAB 1: By Year */}
              {activeBreakdownTab === 'year' && (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr className="border-b border-slate-100 text-xs font-semibold uppercase text-slate-500">
                        <th className="pb-3">Tahun</th>
                        <th className="pb-3">Total Data</th>
                        <th className="pb-3">Data Warning</th>
                        <th className="pb-3">Status Kelayakan</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {data?.by_year?.length === 0 ? (
                        <tr><td colSpan={4} className="py-4 text-center text-slate-400">Belum ada data tahunan.</td></tr>
                      ) : (
                        data?.by_year?.map((row) => {
                          const normalCount = row.total_entries - row.warning_entries;
                          const percent = row.total_entries > 0 ? Math.round((normalCount / row.total_entries) * 100) : 100;
                          return (
                            <tr key={row.year} className="hover:bg-slate-50">
                              <td className="py-3 font-bold text-slate-900">{row.year}</td>
                              <td className="py-3 font-semibold text-slate-700">{row.total_entries.toLocaleString('id-ID')} entri</td>
                              <td className="py-3">
                                <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                                  row.warning_entries > 0 ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
                                }`}>
                                  {row.warning_entries.toLocaleString('id-ID')} warning
                                </span>
                              </td>
                              <td className="py-3">
                                <div className="flex items-center gap-2">
                                  <div className="h-2 w-24 overflow-hidden rounded-full bg-slate-100">
                                    <div className="h-full bg-emerald-500" style={{ width: `${percent}%` }} />
                                  </div>
                                  <span className="text-xs text-slate-500">{percent}% normal</span>
                                </div>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              )}

              {/* TAB 2: By Market */}
              {activeBreakdownTab === 'market' && (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr className="border-b border-slate-100 text-xs font-semibold uppercase text-slate-500">
                        <th className="pb-3">Pasar</th>
                        <th className="pb-3">Kabupaten/Kota</th>
                        <th className="pb-3">Total Data</th>
                        <th className="pb-3">Data Warning</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {data?.by_market?.length === 0 ? (
                        <tr><td colSpan={4} className="py-4 text-center text-slate-400">Belum ada data pasar.</td></tr>
                      ) : (
                        data?.by_market?.map((row) => (
                          <tr key={row.market_id} className="hover:bg-slate-50">
                            <td className="py-3 font-semibold text-slate-900">{row.market_name || `Pasar #${row.market_id}`}</td>
                            <td className="py-3 text-slate-600">{row.district || '-'}</td>
                            <td className="py-3 font-semibold text-slate-700">{row.total_entries.toLocaleString('id-ID')} entri</td>
                            <td className="py-3">
                              <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                                row.warning_entries > 0 ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
                              }`}>
                                {row.warning_entries.toLocaleString('id-ID')} warning
                              </span>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              )}

              {/* TAB 3: By Collector */}
              {activeBreakdownTab === 'collector' && (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr className="border-b border-slate-100 text-xs font-semibold uppercase text-slate-500">
                        <th className="pb-3">Nama Pendata</th>
                        <th className="pb-3">Username</th>
                        <th className="pb-3">Data Terinput</th>
                        <th className="pb-3">Data Warning</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {data?.by_collector?.length === 0 ? (
                        <tr><td colSpan={4} className="py-4 text-center text-slate-400">Belum ada data kontribusi pendata.</td></tr>
                      ) : (
                        data?.by_collector?.map((row) => (
                          <tr key={row.collector_id} className="hover:bg-slate-50">
                            <td className="py-3 font-semibold text-slate-900">{row.collector_name || `Pendata #${row.collector_id}`}</td>
                            <td className="py-3 text-slate-500">@{row.username || '-'}</td>
                            <td className="py-3 font-semibold text-slate-700">{row.total_entries.toLocaleString('id-ID')} entri</td>
                            <td className="py-3">
                              <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                                row.warning_entries > 0 ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
                              }`}>
                                {row.warning_entries.toLocaleString('id-ID')} warning
                              </span>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              )}

              {/* TAB 4: 10 Recent Entries */}
              {activeBreakdownTab === 'recent' && (
                <div className="space-y-2.5">
                  {data?.recent_entries?.length === 0 ? (
                    <p className="py-4 text-center text-slate-400">Belum ada entri terbaru.</p>
                  ) : (
                    data?.recent_entries?.map((entry) => (
                      <div
                        key={entry.id}
                        className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-100 bg-slate-50/70 p-3 text-xs transition hover:bg-slate-100/70"
                      >
                        <div>
                          <div className="font-semibold text-slate-900">
                            #{entry.id} • {entry.commodity?.name ?? `Komoditas #${entry.commodity_id}`}
                            {entry.brand_type ? <span className="ml-1 font-normal text-slate-600">({entry.brand_type})</span> : ''}
                          </div>
                          <div className="mt-0.5 text-slate-500">
                            {entry.market?.name ?? `Pasar #${entry.market_id}`} • Tahun {entry.year} • Petugas: {entry.collector_id}
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-3 text-right">
                          <div>
                            <div className="font-bold text-slate-900">Rp {Number(entry.market_price).toLocaleString('id-ID')}</div>
                            <div className="text-[11px] text-slate-500">Konversi: Rp {Number(entry.converted_price).toLocaleString('id-ID')} / kg</div>
                          </div>

                          <span className={`rounded-full px-2.5 py-1 font-semibold ${
                            entry.warning_status === 'normal'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}>
                            {entry.warning_status === 'normal' ? 'Normal' : entry.warning_status === 'below_minimum' ? 'Di Bawah Min' : 'Di Atas Maks'}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </>
          )}
        </div>
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

function Card({ title, value, subtitle, tone }: { title: string; value: string; subtitle?: string; tone: 'emerald' | 'sky' | 'amber' | 'violet' | 'rose' }) {
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
      <div className="mt-2 text-3xl font-black">{value}</div>
      {subtitle ? <div className="mt-1 text-xs opacity-75">{subtitle}</div> : null}
    </div>
  );
}


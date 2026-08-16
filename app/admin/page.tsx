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
import {
  UsersIcon,
  StoreIcon,
  PackageIcon,
  FileTextIcon,
  AlertTriangleIcon,
  EmptyDocIcon,
} from '@/components/icons';

type NavItemKey =
  | 'monitoring'
  | 'penugasan'
  | 'review'
  | 'perbandingan'
  | 'rekap'
  | 'import'
  | 'tambah-data'
  | 'daftar-data'
  | 'akun';

export default function AdminDashboardPage() {
  const [data, setData] = useState<AdminSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeBreakdownTab, setActiveBreakdownTab] = useState<'year' | 'market' | 'collector' | 'recent'>('year');
  const [activeNav, setActiveNav] = useState<NavItemKey>('monitoring');

  useEffect(() => {
    const token = localStorage.getItem('pasarata_token');
    if (!token) return;

    api.adminDashboard(token)
      .then((res) => {
        setData(res);
      })
      .catch((error) => console.error('Dashboard load error:', error))
      .finally(() => setLoading(false));
  }, []);

  return (
    <DashboardShell role="admin" activeNav={activeNav} onNavClick={(key) => setActiveNav(key as NavItemKey)}>
      {/* ── 1. MENU: MONITORING (DEFAULT ON LOAD) ───────────────────── */}
      {activeNav === 'monitoring' && (
        <div className="space-y-6">
          {/* 5 KPI Stat Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4.5">
            {/* Card 1: Total Pendata */}
            <div className="flex items-center gap-4 rounded-2xl border border-[#DCFCE7] bg-[#F0FDF4] p-4.5 shadow-2xs">
              <div className="flex h-13 w-13 shrink-0 items-center justify-center rounded-2xl bg-[#DCFCE7] text-[#16A34A]">
                <UsersIcon className="h-6 w-6" />
              </div>
              <div>
                <div className="text-xs font-semibold text-emerald-800">Total Pendata</div>
                <div className="text-2xl sm:text-3xl font-black text-emerald-950 leading-tight">
                  {loading ? '...' : (data?.collectors ?? 1)}
                </div>
                <div className="text-[11px] font-medium text-emerald-700/80">User aktif</div>
              </div>
            </div>

            {/* Card 2: Total Pasar */}
            <div className="flex items-center gap-4 rounded-2xl border border-[#E0F2FE] bg-[#F0F9FF] p-4.5 shadow-2xs">
              <div className="flex h-13 w-13 shrink-0 items-center justify-center rounded-2xl bg-[#E0F2FE] text-[#0284C7]">
                <StoreIcon className="h-6 w-6" />
              </div>
              <div>
                <div className="text-xs font-semibold text-sky-800">Total Pasar</div>
                <div className="text-2xl sm:text-3xl font-black text-sky-950 leading-tight">
                  {loading ? '...' : (data?.markets ?? 1)}
                </div>
                <div className="text-[11px] font-medium text-sky-700/80">Wilayah pantau</div>
              </div>
            </div>

            {/* Card 3: Total Komoditas */}
            <div className="flex items-center gap-4 rounded-2xl border border-[#FEF3C7] bg-[#FFFBEB] p-4.5 shadow-2xs">
              <div className="flex h-13 w-13 shrink-0 items-center justify-center rounded-2xl bg-[#FEF3C7] text-[#D97706]">
                <PackageIcon className="h-6 w-6" />
              </div>
              <div>
                <div className="text-xs font-semibold text-amber-800">Total Komoditas</div>
                <div className="text-2xl sm:text-3xl font-black text-amber-950 leading-tight">
                  {loading ? '...' : (data?.commodities ?? 1)}
                </div>
                <div className="text-[11px] font-medium text-amber-700/80">Item komoditas</div>
              </div>
            </div>

            {/* Card 4: Total Data Entri */}
            <div className="flex items-center gap-4 rounded-2xl border border-[#F3E8FF] bg-[#FAF5FF] p-4.5 shadow-2xs">
              <div className="flex h-13 w-13 shrink-0 items-center justify-center rounded-2xl bg-[#F3E8FF] text-[#9333EA]">
                <FileTextIcon className="h-6 w-6" />
              </div>
              <div>
                <div className="text-xs font-semibold text-purple-800">Total Data Entri</div>
                <div className="text-2xl sm:text-3xl font-black text-purple-950 leading-tight">
                  {loading ? '...' : (data?.total_entries ?? 0)}
                </div>
                <div className="text-[11px] font-medium text-purple-700/80">Keseluruhan entri</div>
              </div>
            </div>

            {/* Card 5: Data Warning */}
            <div className="flex items-center gap-4 rounded-2xl border border-[#FEE2E2] bg-[#FEF2F2] p-4.5 shadow-2xs">
              <div className="flex h-13 w-13 shrink-0 items-center justify-center rounded-2xl bg-[#FEE2E2] text-[#DC2626]">
                <AlertTriangleIcon className="h-6 w-6" />
              </div>
              <div>
                <div className="text-xs font-semibold text-rose-800">Data Warning</div>
                <div className="text-2xl sm:text-3xl font-black text-rose-950 leading-tight">
                  {loading ? '...' : (data?.warning_entries ?? 0)}
                </div>
                <div className="text-[11px] font-medium text-rose-700/80">Perlu peninjauan</div>
              </div>
            </div>
          </div>

          {/* Monitoring Breakdown Card */}
          <div id="section-monitoring" className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-100 pb-4">
              <div>
                <h2 className="text-base font-bold text-slate-900">Monitoring & Sebaran Data</h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Pantau distribusi entri pendataan berdasarkan tahun, pasar, petugas, dan feed data terbaru.
                </p>
              </div>

              {/* Tab Pill Buttons */}
              <div className="flex flex-wrap items-center gap-1 rounded-xl bg-slate-100 p-1 shrink-0">
                <button
                  id="tab-breakdown-year"
                  type="button"
                  onClick={() => setActiveBreakdownTab('year')}
                  className={`rounded-lg px-2.5 py-1.5 text-xs font-semibold transition ${
                    activeBreakdownTab === 'year'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  📅 Per Tahun ({data?.by_year?.length ?? 0})
                </button>
                <button
                  id="tab-breakdown-market"
                  type="button"
                  onClick={() => setActiveBreakdownTab('market')}
                  className={`rounded-lg px-2.5 py-1.5 text-xs font-semibold transition ${
                    activeBreakdownTab === 'market'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  🏪 Per Pasar ({data?.by_market?.length ?? 0})
                </button>
                <button
                  id="tab-breakdown-collector"
                  type="button"
                  onClick={() => setActiveBreakdownTab('collector')}
                  className={`rounded-lg px-2.5 py-1.5 text-xs font-semibold transition ${
                    activeBreakdownTab === 'collector'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  👤 Per Pendata ({data?.by_collector?.length ?? 0})
                </button>
                <button
                  id="tab-breakdown-recent"
                  type="button"
                  onClick={() => setActiveBreakdownTab('recent')}
                  className={`rounded-lg px-2.5 py-1.5 text-xs font-semibold transition ${
                    activeBreakdownTab === 'recent'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  ⚡ 10 Entri Terbaru
                </button>
              </div>
            </div>

            {/* Table / Tab Content */}
            <div className="mt-4">
              {activeBreakdownTab === 'year' && (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-100 text-[11px] font-bold uppercase tracking-wider text-slate-600">
                        <th className="pb-3">TAHUN</th>
                        <th className="pb-3">TOTAL DATA</th>
                        <th className="pb-3">DATA WARNING</th>
                        <th className="pb-3">STATUS KELAYAKAN</th>
                      </tr>
                    </thead>
                    <tbody>
                      {!data?.by_year || data.by_year.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="py-12 text-center">
                            <div className="flex flex-col items-center justify-center">
                              <EmptyDocIcon className="w-9 h-9 text-slate-300 mb-2" />
                              <span className="text-xs text-slate-500 font-medium">
                                Belum ada data untuk ditampilkan.
                              </span>
                            </div>
                          </td>
                        </tr>
                      ) : (
                        data.by_year.map((row) => {
                          const normalCount = row.total_entries - row.warning_entries;
                          const percent = row.total_entries > 0 ? Math.round((normalCount / row.total_entries) * 100) : 100;
                          return (
                            <tr key={row.year} className="hover:bg-slate-50 border-b border-slate-50">
                              <td className="py-3 font-bold text-slate-900">{row.year}</td>
                              <td className="py-3 font-semibold text-slate-700">{row.total_entries.toLocaleString('id-ID')} entri</td>
                              <td className="py-3">
                                <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                                  row.warning_entries > 0 ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
                                }`}>
                                  {row.warning_entries.toLocaleString('id-ID')} warning
                                </span>
                              </td>
                              <td className="py-3">
                                <div className="flex items-center gap-2">
                                  <div className="h-2 w-20 overflow-hidden rounded-full bg-slate-100">
                                    <div className="h-full bg-emerald-500" style={{ width: `${percent}%` }} />
                                  </div>
                                  <span className="text-[11px] text-slate-500">{percent}% normal</span>
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

              {activeBreakdownTab === 'market' && (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-100 text-[11px] font-bold uppercase tracking-wider text-slate-600">
                        <th className="pb-3">PASAR</th>
                        <th className="pb-3">WILAYAH</th>
                        <th className="pb-3">TOTAL DATA</th>
                        <th className="pb-3">DATA WARNING</th>
                      </tr>
                    </thead>
                    <tbody>
                      {!data?.by_market || data.by_market.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="py-12 text-center">
                            <div className="flex flex-col items-center justify-center">
                              <EmptyDocIcon className="w-9 h-9 text-slate-300 mb-2" />
                              <span className="text-xs text-slate-500 font-medium">
                                Belum ada data untuk ditampilkan.
                              </span>
                            </div>
                          </td>
                        </tr>
                      ) : (
                        data.by_market.map((row) => (
                          <tr key={row.market_id} className="hover:bg-slate-50 border-b border-slate-50">
                            <td className="py-3 font-semibold text-slate-900">{row.market_name || `Pasar #${row.market_id}`}</td>
                            <td className="py-3 text-slate-500">{row.district || '-'}</td>
                            <td className="py-3 font-semibold text-slate-700">{row.total_entries.toLocaleString('id-ID')} entri</td>
                            <td className="py-3">
                              <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${
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

              {activeBreakdownTab === 'collector' && (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-100 text-[11px] font-bold uppercase tracking-wider text-slate-600">
                        <th className="pb-3">PETUGAS PENDATA</th>
                        <th className="pb-3">USERNAME</th>
                        <th className="pb-3">TOTAL INPUT</th>
                        <th className="pb-3">DATA WARNING</th>
                      </tr>
                    </thead>
                    <tbody>
                      {!data?.by_collector || data.by_collector.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="py-12 text-center">
                            <div className="flex flex-col items-center justify-center">
                              <EmptyDocIcon className="w-9 h-9 text-slate-300 mb-2" />
                              <span className="text-xs text-slate-500 font-medium">
                                Belum ada data untuk ditampilkan.
                              </span>
                            </div>
                          </td>
                        </tr>
                      ) : (
                        data.by_collector.map((row) => (
                          <tr key={row.collector_id} className="hover:bg-slate-50 border-b border-slate-50">
                            <td className="py-3 font-semibold text-slate-900">{row.collector_name || `Petugas #${row.collector_id}`}</td>
                            <td className="py-3 text-slate-500">@{row.username || '-'}</td>
                            <td className="py-3 font-semibold text-slate-700">{row.total_entries.toLocaleString('id-ID')} entri</td>
                            <td className="py-3">
                              <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${
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

              {activeBreakdownTab === 'recent' && (
                <div className="space-y-2">
                  {!data?.recent_entries || data.recent_entries.length === 0 ? (
                    <div className="py-12 text-center">
                      <div className="flex flex-col items-center justify-center">
                        <EmptyDocIcon className="w-9 h-9 text-slate-300 mb-2" />
                        <span className="text-xs text-slate-500 font-medium">
                          Belum ada data entri terbaru.
                        </span>
                      </div>
                    </div>
                  ) : (
                    data.recent_entries.map((entry) => (
                      <div
                        key={entry.id}
                        className="flex items-center justify-between gap-3 rounded-xl border border-slate-100 bg-[#F8FAFC] p-3 text-xs"
                      >
                        <div>
                          <div className="font-bold text-slate-900">
                            #{entry.id} • {entry.commodity?.name ?? `Komoditas #${entry.commodity_id}`}
                          </div>
                          <div className="text-[11px] text-slate-500">
                            {entry.market?.name ?? `Pasar #${entry.market_id}`} • Tahun {entry.year}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold text-slate-900">Rp {Number(entry.market_price).toLocaleString('id-ID')}</div>
                          <span className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                            entry.warning_status === 'normal' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                          }`}>
                            {entry.warning_status === 'normal' ? 'Normal' : 'Warning'}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── 2. MENU: PENUGASAN PASAR ──────────────────────────────── */}
      {activeNav === 'penugasan' && (
        <div className="w-full">
          <AssignmentPanel />
        </div>
      )}

      {/* ── 3. MENU: REVIEW DATA ──────────────────────────────────── */}
      {activeNav === 'review' && (
        <div className="w-full">
          <EntryReviewPanel />
        </div>
      )}

      {/* ── 4. MENU: PERBANDINGAN HARGA ───────────────────────────── */}
      {activeNav === 'perbandingan' && (
        <div className="w-full">
          <ComparisonPanel />
        </div>
      )}

      {/* ── 5. MENU: REKAP PER PASAR ──────────────────────────────── */}
      {activeNav === 'rekap' && (
        <div className="w-full">
          <SummaryPanel />
        </div>
      )}

      {/* ── 6. MENU: IMPORT DATA ──────────────────────────────────── */}
      {activeNav === 'import' && (
        <div className="w-full">
          <ImportPanel />
        </div>
      )}

      {/* ── 7. MENU: DATA MASTER (TAMBAH DATA) ────────────────────── */}
      {activeNav === 'tambah-data' && (
        <div className="w-full">
          <AdminManagementPanel mode="add" />
        </div>
      )}

      {/* ── 8. MENU: DATA MASTER (DAFTAR DATA) ────────────────────── */}
      {activeNav === 'daftar-data' && (
        <div className="w-full">
          <AdminManagementPanel mode="list" />
        </div>
      )}

      {/* ── 9. MENU: INFORMASI AKUN ───────────────────────────────── */}
      {activeNav === 'akun' && (
        <div className="w-full">
          <AdminManagementPanel mode="account" />
        </div>
      )}
    </DashboardShell>
  );
}

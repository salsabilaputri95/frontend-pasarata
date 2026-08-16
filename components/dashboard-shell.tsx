'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { User } from '@/lib/types';
import {
  MonitoringIcon,
  AssignmentIcon,
  ReviewIcon,
  ComparisonIcon,
  SummaryIcon,
  ImportIcon,
  PlusCircleIcon,
  ListIcon,
  UserIcon,
} from './icons';

export type NavItemKey = string;

interface DashboardShellProps {
  title?: string;
  role?: 'admin' | 'collector';
  children: React.ReactNode;
  activeNav?: NavItemKey;
  onNavClick?: (key: NavItemKey) => void;
}

export function DashboardShell({
  children,
  role,
  activeNav = 'monitoring',
  onNavClick,
}: DashboardShellProps) {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem('pasarata_user');
    if (!stored) {
      router.push('/');
      return;
    }

    try {
      setUser(JSON.parse(stored));
    } catch {
      setUser(null);
    }
  }, [router]);

  const effectiveRole = role ?? user?.role ?? 'admin';

  const handleLogout = () => {
    localStorage.removeItem('pasarata_token');
    localStorage.removeItem('pasarata_user');
    router.push('/');
  };

  const handleSelectNav = (key: NavItemKey) => {
    if (onNavClick) {
      onNavClick(key);
    }
    setMobileMenuOpen(false);
  };

  const adminNavItems = [
    { key: 'monitoring', label: 'Monitoring', icon: MonitoringIcon },
    { key: 'penugasan', label: 'Penugasan Pasar', icon: AssignmentIcon },
    { key: 'review', label: 'Review Data', icon: ReviewIcon },
    { key: 'perbandingan', label: 'Perbandingan Harga', icon: ComparisonIcon },
    { key: 'rekap', label: 'Rekap Per Pasar', icon: SummaryIcon },
    { key: 'import', label: 'Import Data', icon: ImportIcon },
  ];

  const adminMasterNavItems = [
    { key: 'tambah-data', label: 'Tambah Data', icon: PlusCircleIcon },
    { key: 'daftar-data', label: 'Daftar Data', icon: ListIcon },
  ];

  const collectorNavItems = [
    { key: 'input-data', label: 'Form Input Data Harga', icon: ReviewIcon },
    { key: 'ringkasan', label: 'Ringkasan data Anda', icon: MonitoringIcon },
    { key: 'data-saya', label: 'Data Saya', icon: ListIcon },
  ];

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-800 antialiased flex">
      {/* ── LEFT SIDEBAR ────────────────────────────────────────────── */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-slate-200/80 flex flex-col justify-between transition-transform duration-200 lg:translate-x-0 ${
        mobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
      }`}>
        <div className="flex flex-col h-full overflow-y-auto">
          {/* Logo & Brand Header */}
          <div className="px-5 py-4.5 flex items-center border-b border-slate-100/80">
            <img
              src="/logo-pasarata.png"
              alt="Logo Pasara'ta'"
              className="h-9 w-auto max-w-[180px] object-contain"
            />
          </div>

          {/* Navigation Links */}
          <div className="px-3.5 space-y-1 mt-2">
            {effectiveRole === 'collector' ? (
              /* COLLECTOR NAV ITEMS */
              collectorNavItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeNav === item.key;
                return (
                  <button
                    key={item.key}
                    onClick={() => handleSelectNav(item.key)}
                    className={`w-full flex items-center gap-3.5 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                      isActive
                        ? 'bg-[#EBF3FF] text-[#2563EB] shadow-xs'
                        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${isActive ? 'text-[#2563EB]' : 'text-slate-500'}`} />
                    <span>{item.label}</span>
                  </button>
                );
              })
            ) : (
              /* ADMIN NAV ITEMS */
              <>
                {adminNavItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeNav === item.key;
                  return (
                    <button
                      key={item.key}
                      onClick={() => handleSelectNav(item.key)}
                      className={`w-full flex items-center gap-3.5 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                        isActive
                          ? 'bg-[#EBF3FF] text-[#2563EB] shadow-xs'
                          : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                      }`}
                    >
                      <Icon className={`w-4 h-4 ${isActive ? 'text-[#2563EB]' : 'text-slate-500'}`} />
                      <span>{item.label}</span>
                    </button>
                  );
                })}

                {/* DATA MASTER GROUP */}
                <div className="pt-5 pb-1.5 px-3.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    DATA MASTER
                  </span>
                </div>

                {adminMasterNavItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeNav === item.key;
                  return (
                    <button
                      key={item.key}
                      onClick={() => handleSelectNav(item.key)}
                      className={`w-full flex items-center gap-3.5 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                        isActive
                          ? 'bg-[#EBF3FF] text-[#2563EB] shadow-xs'
                          : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                      }`}
                    >
                      <Icon className={`w-4 h-4 ${isActive ? 'text-[#2563EB]' : 'text-slate-500'}`} />
                      <span>{item.label}</span>
                    </button>
                  );
                })}

                {/* Informasi Akun */}
                <div className="pt-4">
                  <button
                    onClick={() => handleSelectNav('akun')}
                    className={`w-full flex items-center gap-3.5 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                      activeNav === 'akun'
                        ? 'bg-[#EBF3FF] text-[#2563EB]'
                        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                    }`}
                  >
                    <UserIcon className={`w-4 h-4 ${activeNav === 'akun' ? 'text-[#2563EB]' : 'text-slate-500'}`} />
                    <span>Informasi Akun</span>
                  </button>
                </div>
              </>
            )}
          </div>

          {/* Bottom Status Card */}
          <div className="p-4 mt-auto">
            <div className="rounded-xl border border-slate-200/80 bg-slate-50/60 p-3.5">
              <div className="text-[11px] font-bold text-slate-700">Status Sistem</div>
              <div className="mt-1 flex items-center gap-1.5 text-xs font-medium text-emerald-600">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                Sistem Normal
              </div>
              <div className="mt-2 text-[10px] text-slate-400">
                {effectiveRole === 'collector' ? 'pendata dashboard' : 'admin dashboard'}
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* Backdrop for mobile */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/30 backdrop-blur-xs lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* ── RIGHT MAIN AREA ────────────────────────────────────────── */}
      <div className="flex-1 lg:pl-64 flex flex-col min-w-0">
        {/* Top Header Bar */}
        <header className="sticky top-0 z-30 flex items-center justify-between px-6 py-3.5 bg-white/95 backdrop-blur-sm border-b border-slate-200/80">
          <div className="flex items-center gap-3">
            {/* Mobile menu trigger */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-1.5 -ml-1.5 text-slate-600 rounded-lg lg:hidden hover:bg-slate-100"
              aria-label="Toggle menu"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>

          {/* User Profile Pill in Header */}
          <div className="relative">
            <button
              onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
              className="flex items-center gap-3 py-1 px-2.5 rounded-full hover:bg-slate-50 transition border border-transparent hover:border-slate-200"
            >
              <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white shadow-xs">
                <UserIcon className="w-4 h-4 text-white" />
              </div>
              <div className="text-left hidden sm:block">
                <div className="text-xs font-bold text-slate-900 leading-tight">
                  {user?.full_name ?? (effectiveRole === 'collector' ? 'Pendata Lapangan' : 'Admin')}
                </div>
                <div className="text-[11px] text-slate-500 leading-tight">
                  {user?.username ? `${user.username}@bps.go.id` : `${effectiveRole}@example.com`}
                </div>
              </div>
            </button>

            {/* Profile Dropdown */}
            {profileDropdownOpen && (
              <div className="absolute right-0 mt-2 w-48 rounded-xl bg-white p-2 shadow-lg border border-slate-100 z-50 text-xs">
                <div className="px-3 py-2 border-b border-slate-100">
                  <p className="font-bold text-slate-900">{user?.full_name ?? 'User'}</p>
                  <p className="text-slate-500 text-[10px] capitalize">Role: {user?.role ?? effectiveRole}</p>
                </div>
                <button
                  onClick={handleLogout}
                  className="w-full mt-1 flex items-center gap-2 px-3 py-2 text-left text-red-600 hover:bg-red-50 rounded-lg font-semibold transition"
                >
                  <span>Logout Keluar</span>
                </button>
              </div>
            )}
          </div>
        </header>

        {/* Content Container */}
        <main className="flex-1 px-4 sm:px-6 lg:px-8 py-6 max-w-[1600px] w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}

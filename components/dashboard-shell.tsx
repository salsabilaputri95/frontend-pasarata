'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { User } from '@/lib/types';

export function DashboardShell({ title, children }: { title: string; children: React.ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem('pasarata_user');
    if (!stored) {
      router.push('/');
      return;
    }

    setUser(JSON.parse(stored));
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem('pasarata_token');
    localStorage.removeItem('pasarata_user');
    router.push('/');
  };

  return (
    <div className="min-h-screen bg-slate-100 text-slate-800">
      <header className="border-b border-slate-200 bg-white shadow-sm">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <img src="/logo-pasarata.png" alt="Logo Pasara'ta" className="h-9 w-auto object-contain" />
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-600">Pasara&apos;ta&apos; BPS Jeneponto</p>
              <h1 className="text-lg font-extrabold text-slate-900">{title}</h1>
            </div>
          </div>


          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-sm font-semibold text-slate-900">{user?.full_name ?? 'Pengguna'}</p>
              <p className="text-xs text-slate-500">{user?.role ?? 'user'}</p>
            </div>
            <button
              onClick={handleLogout}
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">{children}</main>
    </div>
  );
}

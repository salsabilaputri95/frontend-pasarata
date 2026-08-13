'use client';

import { useRouter } from 'next/navigation';
import { FormEvent, useState } from 'react';
import { api } from '@/lib/api';

export function LoginForm() {
  const router = useRouter();
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('admin123');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await api.login(username, password);
      localStorage.setItem('pasarata_token', response.token);
      localStorage.setItem('pasarata_user', JSON.stringify(response.user));

      if (response.user.role === 'admin') {
        router.push('/admin');
      } else {
        router.push('/collector');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login gagal');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-xl">
      <div className="mb-6">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-600">Pasara'ta</p>
        <h1 className="mt-2 text-3xl font-bold text-slate-900">Masuk ke sistem</h1>
      </div>

      <div className="space-y-5">
        <label className="block">
          <span className="mb-1 block text-sm font-medium text-slate-700">Username</span>
          <input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2.5 outline-none transition focus:border-emerald-500 focus:bg-white"
            placeholder="admin"
          />
        </label>

        <label className="block">
          <span className="mb-1 block text-sm font-medium text-slate-700">Password</span>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2.5 outline-none transition focus:border-emerald-500 focus:bg-white"
            placeholder="••••••••"
          />
        </label>
      </div>

      {error ? (
        <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>
      ) : null}

      <button
        type="submit"
        disabled={loading}
        className="mt-6 inline-flex w-full items-center justify-center rounded-xl bg-emerald-600 px-4 py-3 font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-emerald-400"
      >
        {loading ? 'Memproses...' : 'Login'}
      </button>

      <div className="mt-5 rounded-xl bg-slate-100 p-3 text-sm text-slate-600">
        Demo default: <span className="font-semibold">admin / admin123</span>
      </div>
    </form>
  );
}

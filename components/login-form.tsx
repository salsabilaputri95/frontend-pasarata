'use client';

import { useRouter } from 'next/navigation';
import { FormEvent, useState } from 'react';
import { api } from '@/lib/api';

type LoginFormProps = {
  onClose?: () => void;
};

export function LoginForm({ onClose }: LoginFormProps) {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!username.trim() || !password) {
      setError('Username dan password wajib diisi');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await api.login(username.trim(), password);
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
    <div className="relative w-full max-w-md rounded-3xl border border-slate-200 bg-white p-8 shadow-2xl">
      {onClose && (
        <button
          type="button"
          onClick={onClose}
          className="absolute right-5 top-5 rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition"
          aria-label="Tutup"
        >
          ✕
        </button>
      )}

      <form onSubmit={handleSubmit}>
        <div className="mb-6">
          <img src="/logo-pasarata.png" alt="Logo Pasara'ta" className="h-10 w-auto object-contain mb-3" />
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-600">Pasara&apos;ta&apos; BPS Jeneponto</p>
          <h1 className="mt-1 text-2xl font-black text-slate-900">Login Pengguna</h1>
          <p className="mt-1 text-xs text-slate-500">Masukkan kredensial akun Anda untuk mengakses sistem.</p>
        </div>


        <div className="space-y-4">
          <label className="block">
            <span className="mb-1 block text-xs font-semibold text-slate-700">Username</span>
            <input
              id="login-username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm outline-none transition focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-500/20"
              placeholder="Masukkan username"
              required
              autoComplete="username"
            />
          </label>

          <label className="block">
            <span className="mb-1 block text-xs font-semibold text-slate-700">Password</span>
            <input
              id="login-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm outline-none transition focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-500/20"
              placeholder="Masukkan password"
              required
              autoComplete="current-password"
            />
          </label>
        </div>

        {error ? (
          <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-3.5 py-2.5 text-xs font-medium text-red-700">
            {error}
          </div>
        ) : null}

        <button
          id="btn-login-submit"
          type="submit"
          disabled={loading}
          className="mt-6 inline-flex w-full items-center justify-center rounded-xl bg-emerald-600 px-4 py-3 text-sm font-bold text-white shadow-lg shadow-emerald-600/20 transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-emerald-400"
        >
          {loading ? 'Memproses...' : 'Login'}
        </button>
      </form>
    </div>
  );
}



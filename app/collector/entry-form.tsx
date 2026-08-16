'use client';

import { FormEvent, useEffect, useRef, useState } from 'react';
import { api } from '@/lib/api';
import type { DataEntry } from '@/lib/types';
import {
  CalendarIcon,
  StoreIcon,
  PackageIcon,
  TagIcon,
  ScaleIcon,
  ShoppingBagIcon,
  ClockIcon,
  ArrowDownCircleIcon,
  ArrowUpCircleIcon,
  FloppyIcon,
  ClipboardIllustration,
} from '@/components/icons';

export type MarketOption = {
  id: number;
  name: string;
  province: string;
  district: string;
  nks: string;
};

export type CategoryOption = {
  id: number;
  name: string;
  type: string;
};

export type CommodityOption = {
  id: number;
  code: string;
  name: string;
  category_id: number;
  brand_type?: string;
};

export type UnitOption = {
  id: number;
  name: string;
  is_standard: boolean;
  conversion_factor: number;
};

export type EntryFormValues = {
  year: number;
  market_id: string;
  category_id: string;
  commodity_id: string;
  brand_type: string;
  local_unit_id: string;
  local_quantity: string;
  local_weight_kg: string;
  standard_unit_id: string;
  market_price: string;
  minimum_price: string;
  maximum_price: string;
  previous_price: string;
  notes: string;
};

const emptyForm = (): EntryFormValues => ({
  year: 2026,
  market_id: '',
  category_id: '',
  commodity_id: '',
  brand_type: '',
  local_unit_id: '',
  local_quantity: '1',
  local_weight_kg: '1',
  standard_unit_id: '',
  market_price: '0',
  minimum_price: '0',
  maximum_price: '0',
  previous_price: '0',
  notes: '',
});

export function entryToFormValues(entry: DataEntry): EntryFormValues {
  return {
    year: entry.year,
    market_id: String(entry.market_id),
    category_id: String(entry.category_id),
    commodity_id: String(entry.commodity_id),
    brand_type: entry.brand_type ?? '',
    local_unit_id: String(entry.local_unit_id),
    local_quantity: String(entry.local_quantity),
    local_weight_kg: String(entry.local_weight_kg),
    standard_unit_id: String(entry.standard_unit_id),
    market_price: String(entry.market_price),
    minimum_price: String(entry.minimum_price),
    maximum_price: String(entry.maximum_price),
    previous_price: String(entry.previous_price),
    notes: entry.notes ?? '',
  };
}

type CollectorEntryFormProps = {
  editingEntry?: DataEntry | null;
  onCancelEdit?: () => void;
  onSaved?: () => void;
};

export function CollectorEntryForm({ editingEntry = null, onCancelEdit, onSaved }: CollectorEntryFormProps) {
  const [markets, setMarkets] = useState<MarketOption[]>([]);
  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [commodities, setCommodities] = useState<CommodityOption[]>([]);
  const [units, setUnits] = useState<UnitOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [form, setForm] = useState<EntryFormValues>(emptyForm());

  type PriceRef = {
    found: boolean;
    ref_year?: number;
    scope?: string;
    minimum_price?: number;
    maximum_price?: number;
    previous_price?: number;
    sample_count?: number;
    message?: string;
  };
  const [priceRef, setPriceRef] = useState<PriceRef | null>(null);
  const [refLoading, setRefLoading] = useState(false);
  const refTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const isEditing = Boolean(editingEntry);

  useEffect(() => {
    const token = localStorage.getItem('pasarata_token');
    if (!token) {
      setLoading(false);
      return;
    }

    Promise.all([
      api.markets(token),
      api.categories(token),
      api.commodities(token),
      api.units(token),
    ])
      .then(([marketData, categoryData, commodityData, unitData]) => {
        setMarkets(marketData.data ?? []);
        setCategories(categoryData.data ?? []);
        setCommodities(commodityData.data ?? []);
        setUnits(unitData.data ?? []);
      })
      .catch(() => setError('Gagal memuat data master'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (editingEntry) {
      setForm(entryToFormValues(editingEntry));
      setMessage('');
      setError('');
    } else {
      setForm(emptyForm());
    }
  }, [editingEntry]);

  const handleChange = (field: keyof EntryFormValues, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const fetchPriceReference = (commodityId: number, marketId: number, year: number) => {
    if (refTimeout.current) clearTimeout(refTimeout.current);
    if (!commodityId) {
      setPriceRef(null);
      return;
    }
    setRefLoading(true);
    refTimeout.current = setTimeout(async () => {
      const token = localStorage.getItem('pasarata_token');
      if (!token) {
        setRefLoading(false);
        return;
      }
      try {
        const ref = await api.priceReference(token, commodityId, marketId || undefined, year);
        setPriceRef(ref);
      } catch {
        setPriceRef(null);
      } finally {
        setRefLoading(false);
      }
    }, 400);
  };

  useEffect(() => {
    fetchPriceReference(Number(form.commodity_id), Number(form.market_id), Number(form.year));
  }, [form.commodity_id, form.market_id, form.year]);

  const applyPriceReference = () => {
    if (!priceRef?.found) return;
    setForm((prev) => ({
      ...prev,
      minimum_price: String(Math.round(priceRef.minimum_price ?? 0)),
      maximum_price: String(Math.round(priceRef.maximum_price ?? 0)),
      previous_price: String(Math.round(priceRef.previous_price ?? 0)),
    }));
  };

  const buildPayload = () => ({
    year: Number(form.year),
    market_id: Number(form.market_id),
    category_id: Number(form.category_id),
    commodity_id: Number(form.commodity_id),
    brand_type: form.brand_type,
    local_unit_id: Number(form.local_unit_id),
    local_quantity: Number(form.local_quantity),
    local_weight_kg: Number(form.local_weight_kg),
    standard_unit_id: Number(form.standard_unit_id),
    market_price: Number(form.market_price),
    minimum_price: Number(form.minimum_price),
    maximum_price: Number(form.maximum_price),
    previous_price: Number(form.previous_price),
    notes: form.notes,
  });

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    const token = localStorage.getItem('pasarata_token');
    if (!token) {
      setError('Sesi login belum tersedia');
      return;
    }

    if (!form.market_id || !form.commodity_id || !form.local_unit_id || !form.standard_unit_id) {
      setError('Harap lengkapi pilihan pasar, komoditas, dan satuan.');
      return;
    }

    setSubmitting(true);
    setError('');
    setMessage('');

    try {
      const payload = buildPayload();
      const result = isEditing && editingEntry
        ? await api.updateEntry(token, editingEntry.id, payload)
        : await api.createEntry(token, payload);

      setMessage(
        isEditing
          ? `Data #${result.data.id} berhasil diperbarui (status: ${result.data.warning_status ?? 'normal'})`
          : `Data berhasil disimpan dengan status: ${result.data.warning_status ?? 'normal'}`,
      );

      if (isEditing) {
        onCancelEdit?.();
      } else {
        setForm((prev) => ({
          ...prev,
          brand_type: '',
          local_quantity: '1',
          local_weight_kg: '1',
          market_price: '0',
          minimum_price: '0',
          maximum_price: '0',
          previous_price: '0',
          notes: '',
        }));
      }
      onSaved?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal menyimpan data');
    } finally {
      setSubmitting(false);
    }
  };

  // 3 Pilar Calculation
  const price = Number(form.market_price) || 0;
  const qty = Number(form.local_quantity) || 1;
  const weight = Number(form.local_weight_kg) || 0;
  const totalWeight = qty * weight;
  const converted = totalWeight > 0 && price > 0 ? Math.round((price / totalWeight) * 100) / 100 : 0;

  const minP = Number(form.minimum_price) || 0;
  const maxP = Number(form.maximum_price) || 0;
  const isBelow = minP > 0 && price > 0 && price < minP;
  const isAbove = maxP > 0 && price > maxP;
  const stdUnit = units.find((u) => u.id === Number(form.standard_unit_id))?.name || 'kg';

  return (
    <form onSubmit={handleSubmit} className="w-full space-y-6 rounded-2xl border border-slate-200/80 bg-white p-6 sm:p-8 shadow-xs">
      {/* ── BREADCRUMB & HEADER ────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-100 pb-5">
        <div>
          <div className="flex items-center gap-1.5 text-xs text-blue-600 font-medium mb-1.5">
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
              <polyline points="9 22 9 12 15 12 15 22" />
            </svg>
            <span>Dashboard</span>
            <span className="text-slate-400">›</span>
            <span className="text-slate-600">Input Data Harga</span>
          </div>

          <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
            {isEditing ? `Edit Data #${editingEntry?.id}` : 'Form Input Data Harga'}
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Input hasil pendataan langsung di pasar, termasuk harga, satuan, dan catatan lapangan.
          </p>
        </div>

        <ClipboardIllustration />
      </div>

      {isEditing && (
        <div className="flex items-center justify-between gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-2.5 text-xs font-semibold text-amber-800">
          <span>Mode Edit: Sedang memperbarui entri #{editingEntry?.id}</span>
          <button
            type="button"
            onClick={() => onCancelEdit?.()}
            className="rounded-lg border border-amber-300 bg-white px-3 py-1 text-xs font-bold text-amber-800 hover:bg-amber-100"
          >
            Batal Edit
          </button>
        </div>
      )}

      {error && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-2.5 text-xs font-semibold text-rose-700">
          {error}
        </div>
      )}

      {message && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-xs font-semibold text-emerald-700">
          {message}
        </div>
      )}

      {/* ── 3-COLUMN INPUT GRID ───────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Row 1: Tahun, Pasar, Kategori */}
        <div>
          <label className="block text-xs font-medium text-slate-700 mb-1.5">Tahun</label>
          <div className="relative flex items-center">
            <span className="absolute left-3.5 text-slate-400">
              <CalendarIcon className="w-4 h-4" />
            </span>
            <input
              type="number"
              value={form.year}
              onChange={(e) => handleChange('year', e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-3 text-xs text-slate-800 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 font-medium"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-700 mb-1.5">Pasar</label>
          <div className="relative flex items-center">
            <span className="absolute left-3.5 text-slate-400">
              <StoreIcon className="w-4 h-4" />
            </span>
            <select
              value={form.market_id}
              onChange={(e) => handleChange('market_id', e.target.value)}
              className="w-full appearance-none rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-8 text-xs text-slate-800 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 font-medium"
              disabled={loading}
            >
              <option value="">Pilih pasar</option>
              {markets.map((m) => (
                <option key={m.id} value={m.id}>{m.name} ({m.district})</option>
              ))}
            </select>
            <span className="pointer-events-none absolute right-3 text-slate-400 text-xs">▼</span>
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-700 mb-1.5">Kategori</label>
          <div className="relative flex items-center">
            <span className="absolute left-3.5 text-slate-400">
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect width="7" height="7" x="3" y="3" rx="1" />
                <rect width="7" height="7" x="14" y="3" rx="1" />
                <rect width="7" height="7" x="14" y="14" rx="1" />
                <rect width="7" height="7" x="3" y="14" rx="1" />
              </svg>
            </span>
            <select
              value={form.category_id}
              onChange={(e) => handleChange('category_id', e.target.value)}
              className="w-full appearance-none rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-8 text-xs text-slate-800 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 font-medium"
              disabled={loading}
            >
              <option value="">Pilih kategori</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
            <span className="pointer-events-none absolute right-3 text-slate-400 text-xs">▼</span>
          </div>
        </div>

        {/* Row 2: Komoditas, Jenis / Merek, Satuan Lokal */}
        <div>
          <label className="block text-xs font-medium text-slate-700 mb-1.5">Komoditas</label>
          <div className="relative flex items-center">
            <span className="absolute left-3.5 text-slate-400">
              <PackageIcon className="w-4 h-4" />
            </span>
            <select
              value={form.commodity_id}
              onChange={(e) => handleChange('commodity_id', e.target.value)}
              className="w-full appearance-none rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-8 text-xs text-slate-800 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 font-medium"
              disabled={loading}
            >
              <option value="">Pilih komoditas</option>
              {commodities
                .filter((c) => !form.category_id || c.category_id === Number(form.category_id))
                .map((c) => (
                  <option key={c.id} value={c.id}>{c.name} {c.code ? `(${c.code})` : ''}</option>
                ))}
            </select>
            <span className="pointer-events-none absolute right-3 text-slate-400 text-xs">▼</span>
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-700 mb-1.5">Jenis / Merek (opsional)</label>
          <div className="relative flex items-center">
            <span className="absolute left-3.5 text-slate-400">
              <TagIcon className="w-4 h-4" />
            </span>
            <input
              type="text"
              value={form.brand_type}
              onChange={(e) => handleChange('brand_type', e.target.value)}
              placeholder="Contoh: Ultra"
              className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-3 text-xs text-slate-800 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-700 mb-1.5">Satuan Lokal</label>
          <div className="relative flex items-center">
            <span className="absolute left-3.5 text-slate-400">
              <ScaleIcon className="w-4 h-4" />
            </span>
            <select
              value={form.local_unit_id}
              onChange={(e) => handleChange('local_unit_id', e.target.value)}
              className="w-full appearance-none rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-8 text-xs text-slate-800 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 font-medium"
              disabled={loading}
            >
              <option value="">Pilih satuan</option>
              {units.map((u) => (
                <option key={u.id} value={u.id}>{u.name}</option>
              ))}
            </select>
            <span className="pointer-events-none absolute right-3 text-slate-400 text-xs">▼</span>
          </div>
        </div>

        {/* Row 3: Kuantitas Lokal, Bobot/Isi Aktual, Satuan Standar */}
        <div>
          <label className="block text-xs font-medium text-slate-700 mb-1.5">Kuantitas Satuan Lokal (Pilar 3)</label>
          <div className="relative flex items-center">
            <span className="absolute left-3.5 text-slate-400">
              <ShoppingBagIcon className="w-4 h-4" />
            </span>
            <input
              type="number"
              step="0.01"
              min="0.01"
              value={form.local_quantity}
              onChange={(e) => handleChange('local_quantity', e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-3 text-xs text-slate-800 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 font-medium"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-700 mb-1.5">Bobot / Isi Aktual (kg) (Pilar 2)</label>
          <div className="relative flex items-center">
            <span className="absolute left-3.5 text-slate-400">
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M10 2v2M14 2v2M6 8h12M7 8l-1.5 12h13L17 8" />
              </svg>
            </span>
            <input
              type="number"
              step="0.01"
              min="0.001"
              value={form.local_weight_kg}
              onChange={(e) => handleChange('local_weight_kg', e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-3 text-xs text-slate-800 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 font-medium"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-700 mb-1.5">Satuan Standar</label>
          <div className="relative flex items-center">
            <span className="absolute left-3.5 text-slate-400">
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="m14 7 3 3-9 9H5v-3l9-9Z" />
              </svg>
            </span>
            <select
              value={form.standard_unit_id}
              onChange={(e) => handleChange('standard_unit_id', e.target.value)}
              className="w-full appearance-none rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-8 text-xs text-slate-800 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 font-medium"
              disabled={loading}
            >
              <option value="">Pilih standar</option>
              {units.map((u) => (
                <option key={u.id} value={u.id}>{u.name} {u.is_standard ? '(Standar)' : ''}</option>
              ))}
            </select>
            <span className="pointer-events-none absolute right-3 text-slate-400 text-xs">▼</span>
          </div>
        </div>

        {/* Row 4: Harga di Pasar (Rp) — Pilar 1 */}
        <div>
          <label className="block text-xs font-medium text-slate-700 mb-1.5">Harga di Pasar (Rp) — Pilar 1</label>
          <div className="relative flex items-center">
            <span className="absolute left-3.5 text-xs font-bold text-slate-500">
              Rp
            </span>
            <input
              type="number"
              step="0.01"
              value={form.market_price}
              onChange={(e) => handleChange('market_price', e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-3 text-xs text-slate-900 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 font-bold"
            />
          </div>
        </div>
      </div>

      {/* ── LIVE CONVERSION BANNER (3 PILAR) ───────────────────────── */}
      <div className="rounded-2xl border border-emerald-200 bg-[#ECFDF5] p-5 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-wider text-emerald-800">
              <span>⚡</span>
              <span>HASIL KONVERSI OTOMATIS (RUMUS 3 PILAR)</span>
            </div>
            <div className="mt-1 text-2xl font-black text-emerald-950">
              {converted > 0 ? `Rp ${converted.toLocaleString('id-ID')}` : 'Rp 0'}
            </div>
            <div className="mt-0.5 text-xs text-emerald-700 font-medium">
              Rumus: Rp {price.toLocaleString('id-ID')} ÷ ({qty} × {weight} kg) = Rp {converted.toLocaleString('id-ID')}/{stdUnit}
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <span className="text-xs text-slate-600 font-medium">Status Validasi:</span>
            <span className={`rounded-xl px-3 py-1 text-xs font-bold ${
              isBelow
                ? 'bg-amber-100 text-amber-900 border border-amber-200'
                : isAbove
                ? 'bg-rose-100 text-rose-900 border border-rose-200'
                : price > 0
                ? 'bg-emerald-100 text-emerald-900 border border-emerald-200'
                : 'bg-white/80 text-slate-700 border border-slate-200'
            }`}>
              {isBelow ? '⚠ Di Bawah Min' : isAbove ? '⚠ Di Atas Maks' : price > 0 ? '✓ Rentang Wajar' : 'Belum Ada Harga'}
            </span>
          </div>
        </div>
      </div>

      {/* ── 3 STAT CARDS: MINIMUM, MAKSIMUM, SEBELUMNYA ─────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="flex items-center gap-3.5 rounded-2xl border border-slate-100 bg-[#F8FAFC] p-4 shadow-2xs">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
            <ArrowDownCircleIcon className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <div className="text-xs font-medium text-slate-500">Harga Minimum</div>
            <div className="text-xl font-bold text-slate-900 leading-tight">
              {Number(form.minimum_price) || 0}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3.5 rounded-2xl border border-slate-100 bg-[#F8FAFC] p-4 shadow-2xs">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
            <ArrowUpCircleIcon className="w-5 h-5 text-emerald-600" />
          </div>
          <div>
            <div className="text-xs font-medium text-slate-500">Harga Maksimum</div>
            <div className="text-xl font-bold text-slate-900 leading-tight">
              {Number(form.maximum_price) || 0}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3.5 rounded-2xl border border-slate-100 bg-[#F8FAFC] p-4 shadow-2xs">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-sky-50 text-sky-600">
            <ClockIcon className="w-5 h-5 text-sky-600" />
          </div>
          <div>
            <div className="text-xs font-medium text-slate-500">Harga Sebelumnya</div>
            <div className="text-xl font-bold text-slate-900 leading-tight">
              {Number(form.previous_price) || 0}
            </div>
          </div>
        </div>
      </div>

      {/* Optional reference autofill hint */}
      {priceRef?.found && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-sky-200 bg-sky-50/80 px-4 py-2.5 text-xs text-sky-800">
          <div>
            <strong>Referensi Ditemukan ({priceRef.ref_year}):</strong> Min Rp {Number(priceRef.minimum_price ?? 0).toLocaleString('id-ID')} • Maks Rp {Number(priceRef.maximum_price ?? 0).toLocaleString('id-ID')}
          </div>
          <button
            type="button"
            onClick={applyPriceReference}
            className="rounded-lg bg-sky-600 px-3 py-1 text-xs font-bold text-white hover:bg-sky-700 transition"
          >
            Terapkan ke Form →
          </button>
        </div>
      )}

      {/* ── CATATAN LAPANGAN ───────────────────────────────────────── */}
      <div>
        <label className="block text-xs font-semibold text-slate-700 mb-1.5">Catatan lapangan</label>
        <div className="relative">
          <span className="absolute top-3 left-3 text-slate-400">
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
            </svg>
          </span>
          <textarea
            value={form.notes}
            onChange={(e) => handleChange('notes', e.target.value)}
            rows={3}
            className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-3 text-xs text-slate-800 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            placeholder="Jelaskan kondisi harga atau anomali di lapangan"
          />
        </div>
      </div>

      {/* ── SUBMIT BUTTON ──────────────────────────────────────────── */}
      <div className="flex items-center gap-3 pt-2">
        <button
          type="submit"
          disabled={submitting || loading}
          className="flex items-center gap-2 rounded-xl bg-[#059669] px-6 py-3 text-xs font-bold text-white shadow-xs hover:bg-emerald-700 active:scale-98 transition disabled:opacity-50"
        >
          <FloppyIcon className="w-4 h-4 text-white" />
          <span>{submitting ? 'Menyimpan...' : isEditing ? 'Simpan Perubahan' : 'Simpan Data'}</span>
        </button>

        {isEditing && (
          <button
            type="button"
            onClick={() => onCancelEdit?.()}
            className="rounded-xl border border-slate-200 bg-white px-5 py-3 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
          >
            Batal
          </button>
        )}
      </div>
    </form>
  );
}

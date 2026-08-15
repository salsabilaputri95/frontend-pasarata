'use client';

import { FormEvent, useEffect, useRef, useState } from 'react';
import { api } from '@/lib/api';
import type { DataEntry } from '@/lib/types';

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
  year: new Date().getFullYear(),
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

  // ── Price reference state ─────────────────────────────────────────────
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
  // Debounce ref
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

  // ── Price reference fetching ──────────────────────────────────────────
  const fetchPriceReference = (commodityId: number, marketId: number, year: number) => {
    if (refTimeout.current) clearTimeout(refTimeout.current);
    if (!commodityId) { setPriceRef(null); return; }
    setRefLoading(true);
    refTimeout.current = setTimeout(async () => {
      const token = localStorage.getItem('pasarata_token');
      if (!token) { setRefLoading(false); return; }
      const ref = await api.priceReference(token, commodityId, marketId || undefined, year);
      setPriceRef(ref);
      setRefLoading(false);
    }, 400);
  };

  // Auto-fetch when key fields change
  useEffect(() => {
    fetchPriceReference(Number(form.commodity_id), Number(form.market_id), Number(form.year));
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

  return (
    <form onSubmit={handleSubmit} className="space-y-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      {isEditing ? (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          <span>Mode edit: data #{editingEntry?.id}</span>
          <button
            type="button"
            onClick={() => onCancelEdit?.()}
            className="rounded-lg border border-amber-300 bg-white px-3 py-1.5 text-xs font-semibold text-amber-800 hover:bg-amber-100"
          >
            Batal edit
          </button>
        </div>
      ) : null}

      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        <Field label="Tahun">
          <input type="number" value={form.year} onChange={(e) => handleChange('year', e.target.value)} className="input" />
        </Field>

        <Field label="Pasar">
          <select value={form.market_id} onChange={(e) => handleChange('market_id', e.target.value)} className="input" disabled={loading}>
            <option value="">Pilih pasar</option>
            {markets.map((market) => (
              <option key={market.id} value={market.id}>{market.name} ({market.district})</option>
            ))}
          </select>
        </Field>

        <Field label="Kategori">
          <select value={form.category_id} onChange={(e) => handleChange('category_id', e.target.value)} className="input" disabled={loading}>
            <option value="">Pilih kategori</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>{category.name}</option>
            ))}
          </select>
        </Field>

        <Field label="Komoditas">
          <select value={form.commodity_id} onChange={(e) => handleChange('commodity_id', e.target.value)} className="input" disabled={loading}>
            <option value="">Pilih komoditas</option>
            {commodities
              .filter((commodity) => !form.category_id || commodity.category_id === Number(form.category_id))
              .map((commodity) => (
                <option key={commodity.id} value={commodity.id}>{commodity.name} {commodity.code ? `(${commodity.code})` : ''}</option>
              ))}
          </select>
        </Field>

        <Field label="Jenis / Merek">
          <input value={form.brand_type} onChange={(e) => handleChange('brand_type', e.target.value)} className="input" placeholder="Contoh: Ultra" />
        </Field>

        <Field label="Satuan Lokal">
          <select value={form.local_unit_id} onChange={(e) => handleChange('local_unit_id', e.target.value)} className="input" disabled={loading}>
            <option value="">Pilih satuan</option>
            {units.map((unit) => (
              <option key={unit.id} value={unit.id}>{unit.name}</option>
            ))}
          </select>
        </Field>

        <Field label="Kuantitas Satuan Lokal (Pilar 3)">
          <input type="number" step="0.01" min="0.01" value={form.local_quantity} onChange={(e) => handleChange('local_quantity', e.target.value)} className="input" placeholder="1" />
        </Field>

        <Field label="Bobot / Isi Aktual (kg) (Pilar 2)">
          <input type="number" step="0.01" min="0.001" value={form.local_weight_kg} onChange={(e) => handleChange('local_weight_kg', e.target.value)} className="input" placeholder="1" />
        </Field>


        <Field label="Satuan Standar">
          <select value={form.standard_unit_id} onChange={(e) => handleChange('standard_unit_id', e.target.value)} className="input" disabled={loading}>
            <option value="">Pilih standar</option>
            {units.map((unit) => (
              <option key={unit.id} value={unit.id}>{unit.name} {unit.is_standard ? '(Standar)' : ''}</option>
            ))}
          </select>
        </Field>

        <Field label="Harga di Pasar (Rp) — Pilar 1">
          <input type="number" step="0.01" value={form.market_price} onChange={(e) => handleChange('market_price', e.target.value)} className="input font-semibold text-slate-900" placeholder="0" />
        </Field>

        {/* ── Live Conversion Preview (3 Pilar) ────────────────────────── */}
        <div className="md:col-span-2 xl:col-span-3">
          {(() => {
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
              <div className="rounded-xl border border-emerald-200 bg-gradient-to-r from-emerald-50 via-teal-50 to-sky-50 p-4 shadow-sm">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <div className="text-xs font-semibold uppercase tracking-wider text-emerald-800">
                      ⚡ Hasil Konversi Otomatis (Rumus 3 Pilar)
                    </div>
                    <div className="mt-1 text-xl font-extrabold text-emerald-950">
                      {converted > 0 ? `Rp ${converted.toLocaleString('id-ID')} / ${stdUnit}` : 'Rp 0'}
                    </div>
                    <div className="mt-0.5 text-xs text-emerald-700">
                      Rumus: Rp {price.toLocaleString('id-ID')} ÷ ({qty} × {weight} kg) = Rp {converted.toLocaleString('id-ID')}/{stdUnit}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-500">Status Validasi:</span>
                    <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                      isBelow
                        ? 'bg-amber-100 text-amber-800'
                        : isAbove
                        ? 'bg-rose-100 text-rose-800'
                        : price > 0
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-slate-100 text-slate-600'
                    }`}>
                      {isBelow ? '⚠ Di Bawah Min' : isAbove ? '⚠ Di Atas Maks' : price > 0 ? '✓ Normal' : 'Belum Ada Harga'}
                    </span>
                  </div>
                </div>
              </div>
            );
          })()}
        </div>

        {/* ── Price Reference Box ─────────────────────────────────────── */}
        <div className="md:col-span-2 xl:col-span-3">
          {form.commodity_id && (
            <div className={`rounded-xl border p-3 text-sm transition-all ${
              priceRef?.found
                ? 'border-sky-200 bg-sky-50'
                : priceRef && !priceRef.found
                ? 'border-slate-200 bg-slate-50'
                : 'border-slate-100 bg-slate-50'
            }`}>
              {refLoading ? (
                <div className="flex items-center gap-2 text-slate-500">
                  <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Mencari referensi tahun lalu...
                </div>
              ) : priceRef?.found ? (
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="font-semibold text-sky-800">
                      Referensi Tahun {priceRef.ref_year}
                      {priceRef.scope === 'commodity-only' && (
                        <span className="ml-2 rounded bg-amber-100 px-1.5 py-0.5 text-xs text-amber-700">lintas pasar</span>
                      )}
                      {priceRef.sample_count && (
                        <span className="ml-2 text-xs font-normal text-slate-500">({priceRef.sample_count} data)</span>
                      )}
                    </div>
                    <div className="mt-1 flex flex-wrap gap-4 text-xs text-sky-700">
                      <span>Min: <strong>Rp {Number(priceRef.minimum_price ?? 0).toLocaleString('id-ID')}</strong></span>
                      <span>Maks: <strong>Rp {Number(priceRef.maximum_price ?? 0).toLocaleString('id-ID')}</strong></span>
                      <span>Rata-rata: <strong>Rp {Number(priceRef.previous_price ?? 0).toLocaleString('id-ID')}</strong></span>
                    </div>
                  </div>
                  <button
                    id="btn-apply-price-reference"
                    type="button"
                    onClick={applyPriceReference}
                    className="shrink-0 rounded-lg bg-sky-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-sky-700 transition-colors"
                  >
                    Terapkan Referensi →
                  </button>
                </div>
              ) : priceRef && !priceRef.found ? (
                <div className="text-slate-500">
                  Tidak ada data referensi untuk tahun {priceRef.ref_year} — isi harga secara manual.
                </div>
              ) : null}
            </div>
          )}
        </div>


        <Field label="Harga Minimum">
          <input type="number" step="0.01" value={form.minimum_price} onChange={(e) => handleChange('minimum_price', e.target.value)} className="input" />
        </Field>


        <Field label="Harga Maksimum">
          <input type="number" step="0.01" value={form.maximum_price} onChange={(e) => handleChange('maximum_price', e.target.value)} className="input" />
        </Field>

        <Field label="Harga Sebelumnya">
          <input type="number" step="0.01" value={form.previous_price} onChange={(e) => handleChange('previous_price', e.target.value)} className="input" />
        </Field>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700">Catatan lapangan</label>
        <textarea value={form.notes} onChange={(e) => handleChange('notes', e.target.value)} className="mt-1 min-h-28 w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2.5 outline-none transition focus:border-emerald-500 focus:bg-white" placeholder="Jelaskan kondisi harga atau anomali di lapangan" />
      </div>

      {error ? <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div> : null}
      {message ? <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{message}</div> : null}

      <div className="flex flex-wrap gap-3">
        <button type="submit" disabled={submitting || loading} className="rounded-xl bg-emerald-600 px-5 py-3 font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-emerald-400">
          {submitting ? 'Menyimpan...' : isEditing ? 'Simpan Perubahan' : 'Simpan Data'}
        </button>
        {isEditing ? (
          <button type="button" onClick={() => onCancelEdit?.()} className="rounded-xl border border-slate-300 bg-white px-5 py-3 font-semibold text-slate-700 hover:bg-slate-50">
            Batal
          </button>
        ) : null}
      </div>
    </form>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium text-slate-700">{label}</span>
      {children}
    </label>
  );
}

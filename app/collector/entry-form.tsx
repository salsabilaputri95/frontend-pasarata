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
  province?: string;
  district?: string;
  nks?: string;
};

export type CategoryOption = {
  id: number;
  name: string;
  type?: string;
};

export type UnitOption = {
  id: number;
  name: string;
  is_standard: boolean;
  standard_value?: number;
  standard_unit_name?: string;
  conversion_factor?: number;
};

export type CommodityOption = {
  id: number;
  code: string;
  name: string;
  category_id: number;
  standard_unit_id?: number;
  standard_unit?: UnitOption;
  brand_type?: string;
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
  const [assignedMarket, setAssignedMarket] = useState<MarketOption | null>(null);
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
      api.dashboard(token).catch(() => null),
      api.markets(token),
      api.categories(token),
      api.commodities(token),
      api.units(token),
    ])
      .then(([dashData, marketData, categoryData, commodityData, unitData]) => {
        const marketList = (marketData.data ?? []) as MarketOption[];
        const catList = (categoryData.data ?? []) as CategoryOption[];
        const commList = (commodityData.data ?? []) as CommodityOption[];
        const unitList = (unitData.data ?? []) as UnitOption[];

        setMarkets(marketList);
        setCategories(catList);
        setCommodities(commList);
        setUnits(unitList);

        const assigned =
          (dashData?.assigned_market as MarketOption | undefined) ||
          (dashData?.markets && dashData.markets[0] ? (dashData.markets[0] as unknown as MarketOption) : undefined) ||
          marketList[0];

        if (assigned) {
          setAssignedMarket(assigned);
          if (!editingEntry) {
            setForm((prev) => ({ ...prev, market_id: String(assigned.id) }));
          }
        }
      })
      .catch(() => setError('Gagal memuat data master'))
      .finally(() => setLoading(false));
  }, [editingEntry]);

  useEffect(() => {
    if (editingEntry) {
      setForm(entryToFormValues(editingEntry));
      setMessage('');
      setError('');
    } else {
      setForm((prev) => ({
        ...emptyForm(),
        market_id: assignedMarket ? String(assignedMarket.id) : prev.market_id,
      }));
    }
  }, [editingEntry, assignedMarket]);

  const handleChange = (field: keyof EntryFormValues, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  // 1. Pilih Komoditas -> Otomatis set Kategori & Satuan Standar Acuan
  const handleCommodityChange = (commodityId: string) => {
    const selectedComm = commodities.find((c) => c.id === Number(commodityId));
    const newCatId = selectedComm?.category_id ? String(selectedComm.category_id) : form.category_id;

    let targetStdId = form.standard_unit_id;
    if (selectedComm?.standard_unit_id) {
      targetStdId = String(selectedComm.standard_unit_id);
    } else {
      // Cari default unit standar (e.g. Kg atau Gram)
      const defaultStd = units.find((u) => u.is_standard) || units[0];
      if (defaultStd) targetStdId = String(defaultStd.id);
    }

    setForm((prev) => ({
      ...prev,
      commodity_id: commodityId,
      category_id: newCatId,
      standard_unit_id: targetStdId,
    }));
  };

  // 2. Pilih Satuan Lokal -> Otomatis mengisi bobot standar per satuan
  const handleLocalUnitChange = (unitId: string) => {
    const selectedUnit = units.find((u) => u.id === Number(unitId));
    let initialWeight = '1';

    if (selectedUnit) {
      const val = selectedUnit.standard_value ?? selectedUnit.conversion_factor ?? 1.0;
      initialWeight = String(val);
    }

    setForm((prev) => ({
      ...prev,
      local_unit_id: unitId,
      local_weight_kg: initialWeight,
    }));
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

  const parseNum = (val: string | number) => {
    if (typeof val === 'number') return isNaN(val) ? 0 : val;
    const str = String(val ?? '').replace(/,/g, '.').trim();
    const n = parseFloat(str);
    return isNaN(n) ? 0 : n;
  };

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
    year: parseInt(String(form.year), 10) || 2026,
    market_id: parseInt(String(form.market_id), 10) || (assignedMarket?.id ?? 0),
    category_id: parseInt(String(form.category_id), 10) || 0,
    commodity_id: parseInt(String(form.commodity_id), 10) || 0,
    brand_type: form.brand_type,
    local_unit_id: parseInt(String(form.local_unit_id), 10) || 0,
    local_quantity: parseNum(form.local_quantity) || 1,
    local_weight_kg: parseNum(form.local_weight_kg) || 1,
    standard_unit_id: parseInt(String(form.standard_unit_id), 10) || 0,
    market_price: parseNum(form.market_price),
    minimum_price: parseNum(form.minimum_price),
    maximum_price: parseNum(form.maximum_price),
    previous_price: parseNum(form.previous_price),
    notes: form.notes,
  });

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    const token = localStorage.getItem('pasarata_token');
    if (!token) {
      setError('Sesi login belum tersedia');
      return;
    }

    if (!form.commodity_id || !form.local_unit_id || !form.standard_unit_id) {
      setError('Harap lengkapi pilihan komoditas, satuan lokal, dan satuan standar.');
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
  const price = parseNum(form.market_price);
  const qty = parseNum(form.local_quantity) || 1;
  const unitWeight = parseNum(form.local_weight_kg);
  const totalActualWeight = qty * unitWeight;
  const converted = totalActualWeight > 0 && price > 0 ? Math.round((price / totalActualWeight) * 100) / 100 : 0;

  const minP = parseNum(form.minimum_price);
  const maxP = parseNum(form.maximum_price);
  const isBelow = minP > 0 && price > 0 && price < minP;
  const isAbove = maxP > 0 && price > maxP;

  const selectedLocalUnit = units.find((u) => u.id === Number(form.local_unit_id));
  const selectedStdUnit = units.find((u) => u.id === Number(form.standard_unit_id));
  const stdUnitName = selectedStdUnit?.name || selectedLocalUnit?.standard_unit_name || 'Satuan Standar';
  const selectedComm = commodities.find((c) => c.id === Number(form.commodity_id));

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
            Input hasil pendataan lapangan berdasarkan 3 Pilar Pasara&apos;ta: Satuan Lokal, Bobot Aktual Standar, dan Harga Transaksi Pasar.
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

      {/* ── BAGIAN 1: IDENTITAS & KOMODITAS (URUTAN 1) ─────────────── */}
      <div className="rounded-2xl border border-slate-200/80 bg-slate-50/40 p-5 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-200/60 pb-3">
          <div className="flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-800 text-white text-xs font-bold">1</span>
            <h3 className="text-xs font-semibold text-slate-800">
              Identitas Komoditas & Wilayah Pasar
            </h3>
          </div>
          <span className="text-[11px] font-medium text-slate-500">Langkah 1: Penentuan Komoditas</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Tahun */}
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1.5">Tahun Pendataan</label>
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

          {/* Pasar Ditugaskan (Locked) */}
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1.5">Pasar Wilayah Kerja</label>
            <div className="relative flex items-center">
              <span className="absolute left-3.5 text-blue-600">
                <StoreIcon className="w-4 h-4" />
              </span>
              <div className="w-full rounded-xl border border-blue-200 bg-blue-50/80 py-2.5 pl-10 pr-3 text-xs text-blue-950 font-bold flex items-center justify-between shadow-2xs">
                <span className="truncate">
                  {assignedMarket ? `${assignedMarket.name} (${assignedMarket.district || 'Jeneponto'})` : 'Memuat pasar...'}
                </span>
                <span className="shrink-0 rounded-md bg-blue-600 px-2 py-0.5 text-[10px] font-bold text-white uppercase tracking-wider">
                  Terkunci
                </span>
              </div>
            </div>
          </div>

          {/* Kategori */}
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1.5">Kategori Komoditas</label>
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
                <option value="">Semua Kategori</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
              <span className="pointer-events-none absolute right-3 text-slate-400 text-xs">▼</span>
            </div>
          </div>

          {/* Komoditas */}
          <div className="md:col-span-2">
            <label className="block text-xs font-medium text-slate-700 mb-1.5">
              Pilih Komoditas <span className="text-rose-500">*</span>
            </label>
            <div className="relative flex items-center">
              <span className="absolute left-3.5 text-blue-600">
                <PackageIcon className="w-4 h-4" />
              </span>
              <select
                value={form.commodity_id}
                onChange={(e) => handleCommodityChange(e.target.value)}
                className="w-full appearance-none rounded-xl border border-blue-300 bg-white py-2.5 pl-10 pr-8 text-xs text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 font-semibold"
                disabled={loading}
              >
                <option value="">-- Pilih Komoditas --</option>
                {commodities
                  .filter((c) => !form.category_id || c.category_id === Number(form.category_id))
                  .map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} {c.code ? `(ID: ${c.code})` : ''} {c.standard_unit ? `— [Acuan: ${c.standard_unit.name}]` : ''}
                    </option>
                  ))}
              </select>
              <span className="pointer-events-none absolute right-3 text-slate-400 text-xs">▼</span>
            </div>
          </div>

          {/* Jenis / Merek (opsional) */}
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
                placeholder="Contoh: Ultra, Curah, Super"
                className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-3 text-xs text-slate-800 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Satuan Standar Acuan Info */}
        <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-slate-500 font-medium">Satuan Standar Acuan Komoditas:</span>
            <span className="rounded-md bg-indigo-50 border border-indigo-200 px-2.5 py-0.5 font-bold text-indigo-700">
              {stdUnitName}
            </span>
          </div>
          <span className="text-[11px] text-slate-400">Otomatis mengikuti konfigurasi komoditas</span>
        </div>
      </div>

      {/* ── BAGIAN 2: COLOR-CODED 3-PILAR INPUT (POIN REVISI 3 & 4) ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* ── KELOMPOK 1: SATUAN LOKAL & KUANTITAS (BIRU MUDA) ──────── */}
        <div className="rounded-2xl border-2 border-sky-200 bg-[#F0F9FF] p-5 shadow-2xs space-y-4 flex flex-col justify-between">
          <div className="space-y-3.5">
            <div className="flex items-center justify-between border-b border-sky-200/80 pb-2.5">
              <div className="flex items-center gap-2">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-sky-600 text-white text-[11px] font-semibold">
                  2
                </span>
                <h4 className="text-xs font-semibold text-sky-950">
                  Satuan Lokal & Kuantitas
                </h4>
              </div>
              <span className="rounded-md bg-sky-100 border border-sky-300 px-2 py-0.5 text-[10px] font-semibold text-sky-800">
                Pilar 3 (Biru Muda)
              </span>
            </div>

            {/* Pilihan Satuan Lokal */}
            <div>
              <label className="block text-xs font-medium text-sky-900 mb-1.5">
                Satuan Lokal Pasar <span className="text-rose-500">*</span>
              </label>
              <div className="relative flex items-center">
                <span className="absolute left-3 text-sky-600">
                  <ScaleIcon className="w-4 h-4" />
                </span>
                <select
                  value={form.local_unit_id}
                  onChange={(e) => handleLocalUnitChange(e.target.value)}
                  className="w-full appearance-none rounded-xl border border-sky-300 bg-white py-2.5 pl-9 pr-8 text-xs font-semibold text-sky-950 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-200 shadow-2xs"
                  disabled={loading}
                >
                  <option value="">-- Pilih Satuan Lokal --</option>
                  {units.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name} {u.standard_value ? `(${u.standard_value} ${u.standard_unit_name || stdUnitName})` : ''} {u.is_standard ? '[Standar]' : ''}
                    </option>
                  ))}
                </select>
                <span className="pointer-events-none absolute right-3 text-sky-500 text-xs">▼</span>
              </div>
            </div>

            {/* Kuantitas Satuan Lokal */}
            <div>
              <label className="block text-xs font-medium text-sky-900 mb-1.5">
                Kuantitas Satuan Lokal <span className="text-rose-500">*</span>
              </label>
              <div className="relative flex items-center">
                <span className="absolute left-3 text-sky-600">
                  <ShoppingBagIcon className="w-4 h-4" />
                </span>
                <input
                  type="number"
                  step="any"
                  min="0.01"
                  value={form.local_quantity}
                  onChange={(e) => handleChange('local_quantity', e.target.value)}
                  placeholder="Contoh: 1, 2, 5"
                  className="w-full rounded-xl border border-sky-300 bg-white py-2.5 pl-9 pr-3 text-xs font-semibold text-sky-950 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-200 shadow-2xs"
                />
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-sky-200 bg-white/80 p-2.5 text-[11px] text-sky-800">
            Satuan kebiasaan lokal pedagang: <span className="font-semibold">{qty} {selectedLocalUnit?.name || 'satuan'}</span>
          </div>
        </div>

        {/* ── KELOMPOK 2: BOBOT / ISI AKTUAL STANDAR (KUNING MUDA) ──── */}
        <div className="rounded-2xl border-2 border-amber-200 bg-[#FEFCE8] p-5 shadow-2xs space-y-4 flex flex-col justify-between">
          <div className="space-y-3.5">
            <div className="flex items-center justify-between border-b border-amber-200/80 pb-2.5">
              <div className="flex items-center gap-2">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-amber-600 text-white text-[11px] font-semibold">
                  3
                </span>
                <h4 className="text-xs font-semibold text-amber-950">
                  Bobot / Isi Aktual Standar
                </h4>
              </div>
              <span className="rounded-md bg-amber-100 border border-amber-300 px-2 py-0.5 text-[10px] font-semibold text-amber-900">
                Pilar 2 (Kuning Muda)
              </span>
            </div>

            {/* Bobot per satuan lokal */}
            <div>
              <label className="block text-xs font-medium text-amber-950 mb-1.5 flex items-center justify-between">
                <span>Bobot / Isi per Satuan <span className="text-rose-500">*</span></span>
                <span className="text-[11px] font-semibold text-amber-700">Satuan: {stdUnitName}</span>
              </label>
              <div className="relative flex items-center">
                <span className="absolute left-3 text-amber-600 font-semibold text-xs">
                  ⚖
                </span>
                <input
                  type="number"
                  step="any"
                  min="0.001"
                  value={form.local_weight_kg}
                  onChange={(e) => handleChange('local_weight_kg', e.target.value)}
                  placeholder="Nilai bobot standar"
                  className="w-full rounded-xl border border-amber-300 bg-white py-2.5 pl-9 pr-14 text-xs font-semibold text-amber-950 outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-200 shadow-2xs"
                />
                <span className="absolute right-3 text-xs font-semibold text-amber-800">
                  {stdUnitName}
                </span>
              </div>
            </div>

            {/* Informasi Konfigurasi Bobot Standar */}
            <div className="rounded-xl border border-amber-200 bg-amber-100/50 p-2.5 text-xs text-amber-900 space-y-1">
              <div className="text-[11px] font-normal text-amber-800">
                Nilai konfigurasi standar: 1 {selectedLocalUnit?.name || 'satuan'} = {selectedLocalUnit?.standard_value ?? unitWeight} {stdUnitName}
              </div>
              <div className="text-xs font-semibold text-amber-950">
                Total Bobot Aktual = {qty} × {unitWeight} = <span className="text-amber-900 underline font-semibold">{totalActualWeight.toLocaleString('id-ID')} {stdUnitName}</span>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-amber-200 bg-white/80 p-2.5 text-[11px] text-amber-800">
            Dapat disesuaikan jika bobot timbangan riil lapangan berbeda.
          </div>
        </div>

        {/* ── KELOMPOK 3: HARGA TRANSAKSI PASAR (UNGU) ──────────────── */}
        <div className="rounded-2xl border-2 border-purple-200 bg-[#FAF5FF] p-5 shadow-2xs space-y-4 flex flex-col justify-between">
          <div className="space-y-3.5">
            <div className="flex items-center justify-between border-b border-purple-200/80 pb-2.5">
              <div className="flex items-center gap-2">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-purple-600 text-white text-[11px] font-semibold">
                  4
                </span>
                <h4 className="text-xs font-semibold text-purple-950">
                  Harga Transaksi di Pasar
                </h4>
              </div>
              <span className="rounded-md bg-purple-100 border border-purple-300 px-2 py-0.5 text-[10px] font-semibold text-purple-900">
                Pilar 1 (Ungu)
              </span>
            </div>

            {/* Input Harga Pasar */}
            <div>
              <label className="block text-xs font-medium text-purple-950 mb-1.5">
                Harga Transaksi Pasar (Rp) <span className="text-rose-500">*</span>
              </label>
              <div className="relative flex items-center">
                <span className="absolute left-3 text-xs font-semibold text-purple-600">
                  Rp
                </span>
                <input
                  type="number"
                  step="any"
                  value={form.market_price}
                  onChange={(e) => handleChange('market_price', e.target.value)}
                  placeholder="0"
                  className="w-full rounded-xl border border-purple-300 bg-white py-2.5 pl-10 pr-3 text-sm font-semibold text-purple-950 outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-200 shadow-2xs"
                />
              </div>
            </div>

            {/* Price Reference Helper */}
            {priceRef?.found ? (
              <div className="rounded-xl border border-purple-200 bg-purple-100/50 p-2.5 text-xs text-purple-900 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-medium text-purple-800">
                    Referensi ({priceRef.ref_year}):
                  </span>
                  <button
                    type="button"
                    onClick={applyPriceReference}
                    className="text-[10px] font-semibold text-purple-700 hover:underline bg-white px-1.5 py-0.5 rounded border border-purple-300"
                  >
                    Gunakan Range
                  </button>
                </div>
                <div className="text-[11px] font-normal">
                  Min: Rp {Number(priceRef.minimum_price ?? 0).toLocaleString('id-ID')} • Maks: Rp {Number(priceRef.maximum_price ?? 0).toLocaleString('id-ID')}
                </div>
              </div>
            ) : (
              <div className="rounded-xl border border-purple-100 bg-white/70 p-2.5 text-[11px] text-purple-700">
                {refLoading ? 'Mencari referensi harga...' : 'Nilai riil hasil pembelian/transaksi di pasar.'}
              </div>
            )}
          </div>

          <div className="rounded-xl border border-purple-200 bg-white/80 p-2.5 text-[11px] text-purple-800">
            Nominal yang dibayarkan untuk <span className="font-semibold">{qty} {selectedLocalUnit?.name || 'satuan'}</span>
          </div>
        </div>
      </div>

      {/* ── BAGIAN 3: LIVE CONVERSION PREVIEW & VALIDATION BANNER ───── */}
      <div className="rounded-2xl border-2 border-emerald-300 bg-[#ECFDF5] p-5 sm:p-6 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-emerald-900">
              <span className="text-base">⚡</span>
              <span>Hasil Konversi Otomatis (Rumus 3 Pilar Pasara&apos;ta)</span>
            </div>
            <div className="mt-1 text-2xl sm:text-3xl font-bold text-emerald-950">
              {converted > 0 ? `Rp ${converted.toLocaleString('id-ID')}` : 'Rp 0'}{' '}
              <span className="text-base sm:text-lg font-semibold text-emerald-800">/ {stdUnitName}</span>
            </div>
            <div className="mt-1 text-xs text-emerald-800 font-semibold flex flex-wrap items-center gap-1">
              <span>Rumus:</span>
              <span className="bg-emerald-100/80 px-2 py-0.5 rounded border border-emerald-300 text-emerald-950 font-mono">
                Rp {price.toLocaleString('id-ID')} ÷ ({qty} × {unitWeight} {stdUnitName}) = Rp {converted.toLocaleString('id-ID')}/{stdUnitName}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
            <span className="text-xs text-slate-700 font-bold">Status Validasi:</span>
            <span className={`rounded-xl px-3.5 py-1.5 text-xs font-extrabold shadow-2xs ${
              isBelow
                ? 'bg-amber-100 text-amber-950 border border-amber-300'
                : isAbove
                ? 'bg-rose-100 text-rose-950 border border-rose-300'
                : price > 0
                ? 'bg-emerald-200 text-emerald-950 border border-emerald-300'
                : 'bg-white text-slate-600 border border-slate-200'
            }`}>
              {isBelow ? '⚠ Di Bawah Min' : isAbove ? '⚠ Di Atas Maks' : price > 0 ? '✓ Rentang Wajar' : 'Belum Ada Harga'}
            </span>
          </div>
        </div>
      </div>

      {/* ── BAGIAN 4: RANGE HARGA MIN, MAKS & HARGA SEBELUMNYA ──────── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Harga Minimum */}
        <div className="flex items-center gap-3.5 rounded-2xl border border-slate-100 bg-[#F8FAFC] p-4 shadow-2xs">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
            <ArrowDownCircleIcon className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Harga Minimum</div>
            <div className="text-sm font-bold text-slate-800">
              {minP > 0 ? `Rp ${minP.toLocaleString('id-ID')}` : '—'}
            </div>
            <input
              type="number"
              step="any"
              value={form.minimum_price}
              onChange={(e) => handleChange('minimum_price', e.target.value)}
              placeholder="Batas min (opsional)"
              className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs text-slate-700 outline-none focus:border-blue-500"
            />
          </div>
        </div>

        {/* Harga Maksimum */}
        <div className="flex items-center gap-3.5 rounded-2xl border border-slate-100 bg-[#F8FAFC] p-4 shadow-2xs">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-rose-100 text-rose-700">
            <ArrowUpCircleIcon className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Harga Maksimum</div>
            <div className="text-sm font-bold text-slate-800">
              {maxP > 0 ? `Rp ${maxP.toLocaleString('id-ID')}` : '—'}
            </div>
            <input
              type="number"
              step="any"
              value={form.maximum_price}
              onChange={(e) => handleChange('maximum_price', e.target.value)}
              placeholder="Batas maks (opsional)"
              className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs text-slate-700 outline-none focus:border-blue-500"
            />
          </div>
        </div>

        {/* Harga Sebelumnya */}
        <div className="flex items-center gap-3.5 rounded-2xl border border-slate-100 bg-[#F8FAFC] p-4 shadow-2xs">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-100 text-blue-700">
            <ClockIcon className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Harga Sebelumnya</div>
            <div className="text-sm font-bold text-slate-800">
              {parseNum(form.previous_price) > 0 ? `Rp ${parseNum(form.previous_price).toLocaleString('id-ID')}` : '—'}
            </div>
            <input
              type="number"
              step="any"
              value={form.previous_price}
              onChange={(e) => handleChange('previous_price', e.target.value)}
              placeholder="Harga periode lalu"
              className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs text-slate-700 outline-none focus:border-blue-500"
            />
          </div>
        </div>
      </div>

      {/* ── CATATAN LAPANGAN ────────────────────────────────────────── */}
      <div>
        <label className="block text-xs font-medium text-slate-700 mb-1.5">Catatan Lapangan (opsional)</label>
        <textarea
          rows={3}
          value={form.notes}
          onChange={(e) => handleChange('notes', e.target.value)}
          placeholder="Catatan kondisi komoditas, pasokan pasar, atau alasan anomali harga..."
          className="w-full rounded-xl border border-slate-200 bg-white p-3 text-xs text-slate-800 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
        />
      </div>

      {/* ── ACTION BUTTONS ──────────────────────────────────────────── */}
      <div className="flex items-center justify-end gap-3 border-t border-slate-100 pt-5">
        {isEditing && (
          <button
            type="button"
            onClick={() => onCancelEdit?.()}
            className="rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
          >
            Batal
          </button>
        )}
        <button
          type="button"
          onClick={() => {
            setForm((prev) => ({
              ...emptyForm(),
              market_id: assignedMarket ? String(assignedMarket.id) : prev.market_id,
            }));
            setError('');
            setMessage('');
          }}
          className="rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
        >
          Reset Form
        </button>
        <button
          type="submit"
          disabled={submitting || loading}
          className="flex items-center gap-2 rounded-xl bg-[#0066FF] px-6 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-blue-600 active:scale-98 transition disabled:opacity-50"
        >
          <FloppyIcon className="w-4 h-4" />
          <span>{submitting ? 'Menyimpan...' : isEditing ? 'Perbarui Data' : 'Simpan Data Harga'}</span>
        </button>
      </div>
    </form>
  );
}

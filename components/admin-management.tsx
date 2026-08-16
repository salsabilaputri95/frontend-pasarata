'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';

type CollectorRecord = {
  id: number;
  username: string;
  full_name: string;
  role: string;
  status: string;
};

type MarketRecord = {
  id: number;
  province?: string;
  district?: string;
  nks?: string;
  name: string;
  active?: boolean;
};

type CategoryRecord = {
  id: number;
  name: string;
  type: string;
  active?: boolean;
};

type CommodityRecord = {
  id: number;
  code: string;
  name: string;
  category_id: number;
  brand_type?: string;
  active?: boolean;
  category?: { name?: string };
};

type UnitRecord = {
  id: number;
  name: string;
  is_standard: boolean;
  conversion_factor: number;
  active?: boolean;
};

type ModalField = { key: string; label: string; type?: string; options?: string[] };

function EditModal({
  title,
  fields,
  values,
  onClose,
  onSave,
  saving,
}: {
  title: string;
  fields: ModalField[];
  values: Record<string, string | boolean>;
  onClose: () => void;
  onSave: (vals: Record<string, string | boolean>) => void;
  saving: boolean;
}) {
  const [form, setForm] = useState<Record<string, string | boolean>>(values);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" role="dialog" aria-modal="true">
      <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl">
        <div className="mb-4 flex items-center justify-between">
          <h4 className="text-base font-bold text-slate-900">{title}</h4>
          <button id="btn-close-edit-modal" type="button" onClick={onClose} className="rounded p-1 text-slate-400 hover:bg-slate-100">✕</button>
        </div>
        <div className="space-y-3">
          {fields.map((field) =>
            field.options ? (
              <label key={field.key} className="block">
                <span className="mb-1 block text-xs text-slate-500">{field.label}</span>
                <select
                  id={`edit-field-${field.key}`}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:border-blue-500 focus:outline-none"
                  value={String(form[field.key] ?? '')}
                  onChange={(e) => setForm((f) => ({ ...f, [field.key]: e.target.value }))}
                >
                  {field.options.map((o) => <option key={o}>{o}</option>)}
                </select>
              </label>
            ) : field.type === 'checkbox' ? (
              <label key={field.key} className="flex items-center gap-2 text-xs text-slate-700">
                <input
                  id={`edit-field-${field.key}`}
                  type="checkbox"
                  checked={Boolean(form[field.key])}
                  onChange={(e) => setForm((f) => ({ ...f, [field.key]: e.target.checked }))}
                />
                {field.label}
              </label>
            ) : (
              <label key={field.key} className="block">
                <span className="mb-1 block text-xs text-slate-500">{field.label}</span>
                <input
                  id={`edit-field-${field.key}`}
                  type={field.type ?? 'text'}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:border-blue-500 focus:outline-none"
                  value={String(form[field.key] ?? '')}
                  onChange={(e) => setForm((f) => ({ ...f, [field.key]: e.target.value }))}
                />
              </label>
            )
          )}
        </div>
        <div className="mt-5 flex justify-end gap-2 border-t border-slate-100 pt-3">
          <button id="btn-cancel-edit" type="button" onClick={onClose} className="rounded-xl border border-slate-200 px-4 py-1.5 text-xs text-slate-600 hover:bg-slate-50">
            Batal
          </button>
          <button id="btn-save-edit" type="button" onClick={() => onSave(form)} disabled={saving} className="rounded-xl bg-[#0066FF] px-4 py-1.5 text-xs font-bold text-white hover:bg-blue-600 disabled:opacity-60">
            {saving ? 'Menyimpan...' : 'Simpan'}
          </button>
        </div>
      </div>
    </div>
  );
}

export function AdminManagementPanel({ mode = 'all' }: { mode?: 'add' | 'list' | 'account' | 'all' }) {
  const [collectors, setCollectors] = useState<CollectorRecord[]>([]);
  const [markets, setMarkets] = useState<MarketRecord[]>([]);
  const [categories, setCategories] = useState<CategoryRecord[]>([]);
  const [commodities, setCommodities] = useState<CommodityRecord[]>([]);
  const [units, setUnits] = useState<UnitRecord[]>([]);
  const [message, setMessage] = useState('');
  const [isError, setIsError] = useState(false);

  // Active sub-tab for Tambah Data & Daftar Data
  const [activeAddTab, setActiveAddTab] = useState<'collector' | 'market' | 'category' | 'commodity' | 'unit'>('collector');
  const [activeListTab, setActiveListTab] = useState<'commodity' | 'market' | 'category' | 'unit' | 'collector'>('commodity');

  // Forms
  const [collectorForm, setCollectorForm] = useState({ username: '', password: '', full_name: '' });
  const [marketForm, setMarketForm] = useState({ province: '', district: '', nks: '', name: '' });
  const [categoryForm, setCategoryForm] = useState({ name: '', type: 'Makanan' });
  const [commodityForm, setCommodityForm] = useState({ code: '', name: '', category_id: '', brand_type: '' });
  const [unitForm, setUnitForm] = useState({ name: '', is_standard: false, conversion_factor: '1' });

  // Edit modal
  const [editModal, setEditModal] = useState<{
    type: 'market' | 'category' | 'commodity' | 'unit';
    id: number;
    fields: ModalField[];
    values: Record<string, string | boolean>;
  } | null>(null);
  const [editSaving, setEditSaving] = useState(false);

  const showMsg = (msg: string, error = false) => { setMessage(msg); setIsError(error); };

  const loadData = async () => {
    const token = localStorage.getItem('pasarata_token');
    if (!token) return;
    try {
      const [collectorData, marketData, categoryData, commodityData, unitData] = await Promise.all([
        api.collectors(token),
        api.markets(token),
        api.categories(token),
        api.commodities(token),
        api.units(token),
      ]);
      setCollectors(collectorData.data ?? []);
      setMarkets(marketData.data ?? []);
      setCategories(categoryData.data ?? []);
      setCommodities(commodityData.data ?? []);
      setUnits(unitData.data ?? []);
    } catch (error) {
      showMsg(error instanceof Error ? error.message : 'Gagal memuat data master', true);
    }
  };

  useEffect(() => { loadData(); }, []);

  const submitCollector = async () => {
    const token = localStorage.getItem('pasarata_token');
    if (!token) return;
    try {
      await api.createCollector(token, collectorForm);
      setCollectorForm({ username: '', password: '', full_name: '' });
      showMsg('Pendata baru berhasil dibuat');
      await loadData();
    } catch (error) { showMsg(error instanceof Error ? error.message : 'Gagal membuat pendata', true); }
  };

  const submitMarket = async () => {
    const token = localStorage.getItem('pasarata_token');
    if (!token) return;
    try {
      await api.createMarket(token, {
        province: marketForm.province,
        district: marketForm.district,
        nks: marketForm.nks,
        name: marketForm.name,
      });
      setMarketForm({ province: '', district: '', nks: '', name: '' });
      showMsg('Pasar berhasil dibuat');
      await loadData();
    } catch (error) { showMsg(error instanceof Error ? error.message : 'Gagal membuat pasar', true); }
  };

  const submitCategory = async () => {
    const token = localStorage.getItem('pasarata_token');
    if (!token) return;
    try {
      await api.createCategory(token, categoryForm);
      setCategoryForm({ name: '', type: 'Makanan' });
      showMsg('Kategori berhasil dibuat');
      await loadData();
    } catch (error) { showMsg(error instanceof Error ? error.message : 'Gagal membuat kategori', true); }
  };

  const submitCommodity = async () => {
    const token = localStorage.getItem('pasarata_token');
    if (!token) return;
    try {
      await api.createCommodity(token, {
        code: commodityForm.code,
        name: commodityForm.name,
        category_id: Number(commodityForm.category_id),
        brand_type: commodityForm.brand_type,
      });
      setCommodityForm({ code: '', name: '', category_id: '', brand_type: '' });
      showMsg('Komoditas berhasil dibuat');
      await loadData();
    } catch (error) { showMsg(error instanceof Error ? error.message : 'Gagal membuat komoditas', true); }
  };

  const submitUnit = async () => {
    const token = localStorage.getItem('pasarata_token');
    if (!token) return;
    try {
      await api.createUnit(token, {
        name: unitForm.name,
        is_standard: unitForm.is_standard,
        conversion_factor: Number(unitForm.conversion_factor),
      });
      setUnitForm({ name: '', is_standard: false, conversion_factor: '1' });
      showMsg('Satuan berhasil dibuat');
      await loadData();
    } catch (error) { showMsg(error instanceof Error ? error.message : 'Gagal membuat satuan', true); }
  };

  const toggleCollector = async (id: number, currentStatus: string) => {
    const token = localStorage.getItem('pasarata_token');
    if (!token) return;
    const nextStatus = currentStatus === 'active' ? 'inactive' : 'active';
    try {
      await api.setCollectorStatus(token, id, nextStatus);
      showMsg(`Status pendata #${id} diubah menjadi ${nextStatus}`);
      await loadData();
    } catch (error) { showMsg(error instanceof Error ? error.message : 'Gagal ubah status pendata', true); }
  };

  const toggleMasterStatus = async (type: 'market' | 'category' | 'commodity' | 'unit', id: number, currentActive: boolean, name: string) => {
    const token = localStorage.getItem('pasarata_token');
    if (!token) return;
    const nextActive = !currentActive;
    try {
      if (type === 'market') await api.setMarketStatus(token, id, nextActive);
      else if (type === 'category') await api.setCategoryStatus(token, id, nextActive);
      else if (type === 'commodity') await api.setCommodityStatus(token, id, nextActive);
      else if (type === 'unit') await api.setUnitStatus(token, id, nextActive);
      showMsg(`Status ${name} berhasil diubah`);
      await loadData();
    } catch (error) { showMsg(error instanceof Error ? error.message : 'Gagal ubah status', true); }
  };

  const openEditMarket = (m: MarketRecord) => {
    setEditModal({
      type: 'market',
      id: m.id,
      fields: [
        { key: 'name', label: 'Nama Pasar' },
        { key: 'nks', label: 'Kode NKS' },
        { key: 'district', label: 'Kecamatan / Kabupaten' },
        { key: 'province', label: 'Provinsi' },
      ],
      values: { name: m.name, nks: m.nks ?? '', district: m.district ?? '', province: m.province ?? '' },
    });
  };

  const openEditCategory = (c: CategoryRecord) => {
    setEditModal({
      type: 'category',
      id: c.id,
      fields: [
        { key: 'name', label: 'Nama Kategori' },
        { key: 'type', label: 'Tipe', options: ['Makanan', 'Non Makanan'] },
      ],
      values: { name: c.name, type: c.type },
    });
  };

  const openEditCommodity = (cm: CommodityRecord) => {
    setEditModal({
      type: 'commodity',
      id: cm.id,
      fields: [
        { key: 'name', label: 'Nama Komoditas' },
        { key: 'code', label: 'Kode' },
        { key: 'brand_type', label: 'Merek / Jenis' },
      ],
      values: { name: cm.name, code: cm.code, brand_type: cm.brand_type ?? '' },
    });
  };

  const openEditUnit = (u: UnitRecord) => {
    setEditModal({
      type: 'unit',
      id: u.id,
      fields: [
        { key: 'name', label: 'Nama Satuan' },
        { key: 'conversion_factor', label: 'Faktor Konversi (kg)', type: 'number' },
        { key: 'is_standard', label: 'Satuan Standar', type: 'checkbox' },
      ],
      values: { name: u.name, conversion_factor: String(u.conversion_factor), is_standard: u.is_standard },
    });
  };

  const handleEditSave = async (vals: Record<string, string | boolean>) => {
    if (!editModal) return;
    const token = localStorage.getItem('pasarata_token');
    if (!token) return;
    setEditSaving(true);
    try {
      if (editModal.type === 'market') {
        await api.updateMarket(token, editModal.id, {
          name: String(vals.name),
          nks: String(vals.nks),
          district: String(vals.district),
          province: String(vals.province),
        });
      } else if (editModal.type === 'category') {
        await api.updateCategory(token, editModal.id, {
          name: String(vals.name),
          type: String(vals.type),
        });
      } else if (editModal.type === 'commodity') {
        await api.updateCommodity(token, editModal.id, {
          name: String(vals.name),
          code: String(vals.code),
          brand_type: String(vals.brand_type),
          category_id: 1,
        });
      } else if (editModal.type === 'unit') {
        await api.updateUnit(token, editModal.id, {
          name: String(vals.name),
          conversion_factor: Number(vals.conversion_factor),
          is_standard: Boolean(vals.is_standard),
        });
      }
      showMsg('Data berhasil diperbarui');
      setEditModal(null);
      await loadData();
    } catch (error) {
      showMsg(error instanceof Error ? error.message : 'Gagal memperbarui', true);
    } finally {
      setEditSaving(false);
    }
  };

  const inputClass = "w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800 focus:border-blue-500 focus:outline-none";

  return (
    <div className="space-y-6">
      {message && (
        <div className={`rounded-xl border px-4 py-2.5 text-xs font-semibold ${
          isError ? 'border-red-200 bg-red-50 text-red-700' : 'border-emerald-200 bg-emerald-50 text-emerald-700'
        }`}>
          {message}
        </div>
      )}

      {/* ── 1. TAMBAH DATA MASTER ─────────────────────────────────── */}
      {(mode === 'add' || mode === 'all') && (
        <div id="section-master-add" className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-100 pb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900">Tambah Data Master</h3>
              <p className="text-xs text-slate-500 mt-0.5">Form pembuatan entitas baru sistem Pasara&apos;ta&apos;.</p>
            </div>

            <div className="flex flex-wrap gap-1 rounded-xl bg-slate-100 p-1">
              {[
                { key: 'collector', label: 'Pendata' },
                { key: 'market', label: 'Pasar' },
                { key: 'category', label: 'Kategori' },
                { key: 'commodity', label: 'Komoditas' },
                { key: 'unit', label: 'Satuan' },
              ].map((t) => (
                <button
                  key={t.key}
                  onClick={() => setActiveAddTab(t.key as typeof activeAddTab)}
                  className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                    activeAddTab === t.key ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-4">
            {activeAddTab === 'collector' && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <input placeholder="Username" className={inputClass} value={collectorForm.username} onChange={(e) => setCollectorForm({ ...collectorForm, username: e.target.value })} />
                <input placeholder="Password" type="password" className={inputClass} value={collectorForm.password} onChange={(e) => setCollectorForm({ ...collectorForm, password: e.target.value })} />
                <input placeholder="Nama Lengkap" className={inputClass} value={collectorForm.full_name} onChange={(e) => setCollectorForm({ ...collectorForm, full_name: e.target.value })} />
                <div className="sm:col-span-3 flex justify-end">
                  <button onClick={submitCollector} className="rounded-xl bg-[#0066FF] px-4 py-2 text-xs font-bold text-white hover:bg-blue-600 transition">
                    Simpan Pendata
                  </button>
                </div>
              </div>
            )}

            {activeAddTab === 'market' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <input placeholder="Nama Pasar" className={inputClass} value={marketForm.name} onChange={(e) => setMarketForm({ ...marketForm, name: e.target.value })} />
                <input placeholder="Kode NKS" className={inputClass} value={marketForm.nks} onChange={(e) => setMarketForm({ ...marketForm, nks: e.target.value })} />
                <input placeholder="Kecamatan" className={inputClass} value={marketForm.district} onChange={(e) => setMarketForm({ ...marketForm, district: e.target.value })} />
                <input placeholder="Provinsi" className={inputClass} value={marketForm.province} onChange={(e) => setMarketForm({ ...marketForm, province: e.target.value })} />
                <div className="sm:col-span-2 lg:col-span-4 flex justify-end">
                  <button onClick={submitMarket} className="rounded-xl bg-[#0066FF] px-4 py-2 text-xs font-bold text-white hover:bg-blue-600 transition">
                    Simpan Pasar
                  </button>
                </div>
              </div>
            )}

            {activeAddTab === 'category' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input placeholder="Nama Kategori" className={inputClass} value={categoryForm.name} onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })} />
                <select className={inputClass} value={categoryForm.type} onChange={(e) => setCategoryForm({ ...categoryForm, type: e.target.value })}>
                  <option value="Makanan">Makanan</option>
                  <option value="Non Makanan">Non Makanan</option>
                </select>
                <div className="sm:col-span-2 flex justify-end">
                  <button onClick={submitCategory} className="rounded-xl bg-[#0066FF] px-4 py-2 text-xs font-bold text-white hover:bg-blue-600 transition">
                    Simpan Kategori
                  </button>
                </div>
              </div>
            )}

            {activeAddTab === 'commodity' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <input placeholder="Kode (mis. BERAS-01)" className={inputClass} value={commodityForm.code} onChange={(e) => setCommodityForm({ ...commodityForm, code: e.target.value })} />
                <input placeholder="Nama Komoditas" className={inputClass} value={commodityForm.name} onChange={(e) => setCommodityForm({ ...commodityForm, name: e.target.value })} />
                <select className={inputClass} value={commodityForm.category_id} onChange={(e) => setCommodityForm({ ...commodityForm, category_id: e.target.value })}>
                  <option value="">Pilih Kategori</option>
                  {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
                <input placeholder="Merek / Jenis (Opsional)" className={inputClass} value={commodityForm.brand_type} onChange={(e) => setCommodityForm({ ...commodityForm, brand_type: e.target.value })} />
                <div className="sm:col-span-2 lg:col-span-4 flex justify-end">
                  <button onClick={submitCommodity} className="rounded-xl bg-[#0066FF] px-4 py-2 text-xs font-bold text-white hover:bg-blue-600 transition">
                    Simpan Komoditas
                  </button>
                </div>
              </div>
            )}

            {activeAddTab === 'unit' && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <input placeholder="Nama Satuan (mis. Liter / Ikat)" className={inputClass} value={unitForm.name} onChange={(e) => setUnitForm({ ...unitForm, name: e.target.value })} />
                <input placeholder="Faktor Konversi (kg)" type="number" step="0.01" className={inputClass} value={unitForm.conversion_factor} onChange={(e) => setUnitForm({ ...unitForm, conversion_factor: e.target.value })} />
                <label className="flex items-center gap-2 text-xs text-slate-700 px-1">
                  <input type="checkbox" checked={unitForm.is_standard} onChange={(e) => setUnitForm({ ...unitForm, is_standard: e.target.checked })} />
                  Satuan Standar Universal
                </label>
                <div className="sm:col-span-3 flex justify-end">
                  <button onClick={submitUnit} className="rounded-xl bg-[#0066FF] px-4 py-2 text-xs font-bold text-white hover:bg-blue-600 transition">
                    Simpan Satuan
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── 2. DAFTAR DATA MASTER ─────────────────────────────────── */}
      {(mode === 'list' || mode === 'all') && (
        <div id="section-master-list" className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-100 pb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900">Daftar Data Master</h3>
              <p className="text-xs text-slate-500 mt-0.5">Tinjau, aktifkan, atau edit entitas master sistem.</p>
            </div>

            <div className="flex flex-wrap gap-1 rounded-xl bg-slate-100 p-1">
              {[
                { key: 'commodity', label: `Komoditas (${commodities.length})` },
                { key: 'market', label: `Pasar (${markets.length})` },
                { key: 'category', label: `Kategori (${categories.length})` },
                { key: 'unit', label: `Satuan (${units.length})` },
                { key: 'collector', label: `Pendata (${collectors.length})` },
              ].map((t) => (
                <button
                  key={t.key}
                  onClick={() => setActiveListTab(t.key as typeof activeListTab)}
                  className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                    activeListTab === t.key ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-4">
            {activeListTab === 'commodity' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {commodities.map((c) => (
                  <div key={c.id} className="rounded-xl border border-slate-200/70 bg-[#F8FAFC] p-3.5 flex items-start justify-between gap-2">
                    <div>
                      <div className="text-xs font-bold text-slate-900">{c.name}</div>
                      <div className="text-[11px] text-slate-500 mt-0.5">{c.code} • {c.category?.name ?? 'Umum'}</div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button onClick={() => openEditCommodity(c)} className="text-[11px] font-semibold text-blue-600 hover:bg-blue-50 px-2 py-1 rounded">Edit</button>
                      <button onClick={() => toggleMasterStatus('commodity', c.id, c.active !== false, c.name)} className="text-[11px] font-semibold text-slate-500 hover:bg-slate-100 px-2 py-1 rounded">
                        {c.active !== false ? 'Aktif' : 'Nonaktif'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {activeListTab === 'market' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {markets.map((m) => (
                  <div key={m.id} className="rounded-xl border border-slate-200/70 bg-[#F8FAFC] p-3.5 flex items-start justify-between gap-2">
                    <div>
                      <div className="text-xs font-bold text-slate-900">{m.name}</div>
                      <div className="text-[11px] text-slate-500 mt-0.5">{m.district ?? '-'} (NKS: {m.nks ?? '-'})</div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button onClick={() => openEditMarket(m)} className="text-[11px] font-semibold text-blue-600 hover:bg-blue-50 px-2 py-1 rounded">Edit</button>
                      <button onClick={() => toggleMasterStatus('market', m.id, m.active !== false, m.name)} className="text-[11px] font-semibold text-slate-500 hover:bg-slate-100 px-2 py-1 rounded">
                        {m.active !== false ? 'Aktif' : 'Nonaktif'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {activeListTab === 'category' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {categories.map((c) => (
                  <div key={c.id} className="rounded-xl border border-slate-200/70 bg-[#F8FAFC] p-3.5 flex items-start justify-between gap-2">
                    <div>
                      <div className="text-xs font-bold text-slate-900">{c.name}</div>
                      <div className="text-[11px] text-slate-500 mt-0.5">{c.type}</div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button onClick={() => openEditCategory(c)} className="text-[11px] font-semibold text-blue-600 hover:bg-blue-50 px-2 py-1 rounded">Edit</button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {activeListTab === 'unit' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {units.map((u) => (
                  <div key={u.id} className="rounded-xl border border-slate-200/70 bg-[#F8FAFC] p-3.5 flex items-start justify-between gap-2">
                    <div>
                      <div className="text-xs font-bold text-slate-900">{u.name} {u.is_standard && <span className="text-[10px] text-blue-600">(Standar)</span>}</div>
                      <div className="text-[11px] text-slate-500 mt-0.5">Konversi: {u.conversion_factor} kg</div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button onClick={() => openEditUnit(u)} className="text-[11px] font-semibold text-blue-600 hover:bg-blue-50 px-2 py-1 rounded">Edit</button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {activeListTab === 'collector' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {collectors.map((c) => (
                  <div key={c.id} className="rounded-xl border border-slate-200/70 bg-[#F8FAFC] p-3.5 flex items-start justify-between gap-2">
                    <div>
                      <div className="text-xs font-bold text-slate-900">{c.full_name}</div>
                      <div className="text-[11px] text-slate-500 mt-0.5">@{c.username} • {c.role}</div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button onClick={() => toggleCollector(c.id, c.status)} className="text-[11px] font-semibold text-slate-600 hover:bg-slate-100 px-2 py-1 rounded">
                        {c.status === 'active' ? 'Nonaktifkan' : 'Aktifkan'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── 3. INFORMASI AKUN ─────────────────────────────────────── */}
      {(mode === 'account' || mode === 'all') && (
        <div id="section-account" className="w-full space-y-6 rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-100 pb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900">Informasi Akun Administrator</h3>
              <p className="text-xs text-slate-500 mt-0.5">Rincian profil, hak akses sistem, dan parameter sesi aktif.</p>
            </div>
            <span className="rounded-full bg-emerald-50 border border-emerald-200 px-3 py-1 text-xs font-semibold text-emerald-700">
              ● Sesi Aktif
            </span>
          </div>

          {/* Profile Banner */}
          <div className="rounded-xl border border-blue-100 bg-[#EFF6FF] p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-blue-600 text-white flex items-center justify-center font-black text-xl shadow-xs">
                A
              </div>
              <div>
                <div className="text-base font-bold text-slate-900">Administrator Pasara&apos;ta&apos;</div>
                <div className="text-xs text-slate-600 mt-0.5">admin@example.com • Badan Pusat Statistik Kabupaten Jeneponto</div>
                <div className="mt-1.5 flex flex-wrap items-center gap-2">
                  <span className="rounded-md bg-blue-600 px-2 py-0.5 text-[10px] font-bold text-white uppercase tracking-wider">
                    Super Admin
                  </span>
                  <span className="rounded-md bg-emerald-100 text-emerald-800 px-2 py-0.5 text-[10px] font-semibold">
                    Hak Akses Penuh
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="rounded-xl border border-slate-100 bg-[#F8FAFC] p-4">
              <div className="text-[11px] font-semibold text-slate-400 uppercase">Username Akun</div>
              <div className="mt-1 text-sm font-bold text-slate-900">@admin</div>
              <div className="mt-0.5 text-[11px] text-slate-500">ID Pengguna: #1</div>
            </div>

            <div className="rounded-xl border border-slate-100 bg-[#F8FAFC] p-4">
              <div className="text-[11px] font-semibold text-slate-400 uppercase">Peran (Role)</div>
              <div className="mt-1 text-sm font-bold text-slate-900">Administrator</div>
              <div className="mt-0.5 text-[11px] text-slate-500">Akses seluruh modul & data</div>
            </div>

            <div className="rounded-xl border border-slate-100 bg-[#F8FAFC] p-4">
              <div className="text-[11px] font-semibold text-slate-400 uppercase">Wilayah Pantauan</div>
              <div className="mt-1 text-sm font-bold text-slate-900">Kabupaten Jeneponto</div>
              <div className="mt-0.5 text-[11px] text-slate-500">Seluruh Pasar Binaan</div>
            </div>

            <div className="rounded-xl border border-slate-100 bg-[#F8FAFC] p-4">
              <div className="text-[11px] font-semibold text-slate-400 uppercase">Versi Platform</div>
              <div className="mt-1 text-sm font-bold text-slate-900">Pasara&apos;ta&apos; v2.0</div>
              <div className="mt-0.5 text-[11px] text-slate-500">BPS Standard Compliant</div>
            </div>
          </div>

          {/* System Security & Logs Note */}
          <div className="rounded-xl border border-slate-100 bg-[#F8FAFC] p-4 text-xs text-slate-600 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <span className="font-bold text-slate-800">Keamanan Sesi:</span> Otentikasi berbasis JWT Token tersinkronisasi langsung dengan server backend.
            </div>
            <div className="text-[11px] text-slate-400">
              Waktu Server: 2026 • Status Normal
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editModal && (
        <EditModal
          title={`Edit Data #${editModal.id}`}
          fields={editModal.fields}
          values={editModal.values}
          onClose={() => setEditModal(null)}
          onSave={handleEditSave}
          saving={editSaving}
        />
      )}
    </div>
  );
}

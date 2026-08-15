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

// â”€â”€ Generic inline-edit modal â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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
          <button id="btn-close-edit-modal" type="button" onClick={onClose} className="rounded p-1 text-slate-400 hover:bg-slate-100">âœ•</button>
        </div>
        <div className="space-y-3">
          {fields.map((field) =>
            field.options ? (
              <label key={field.key} className="block">
                <span className="mb-1 block text-xs text-slate-500">{field.label}</span>
                <select
                  id={`edit-field-${field.key}`}
                  className="w-full rounded-lg border border-slate-200 px-3 py-1.5 text-sm focus:border-sky-400 focus:outline-none"
                  value={String(form[field.key] ?? '')}
                  onChange={(e) => setForm((f) => ({ ...f, [field.key]: e.target.value }))}
                >
                  {field.options.map((o) => <option key={o}>{o}</option>)}
                </select>
              </label>
            ) : field.type === 'checkbox' ? (
              <label key={field.key} className="flex items-center gap-2 text-sm text-slate-700">
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
                  className="w-full rounded-lg border border-slate-200 px-3 py-1.5 text-sm focus:border-sky-400 focus:outline-none"
                  value={String(form[field.key] ?? '')}
                  onChange={(e) => setForm((f) => ({ ...f, [field.key]: e.target.value }))}
                />
              </label>
            )
          )}
        </div>
        <div className="mt-5 flex justify-end gap-3">
          <button id="btn-cancel-edit" type="button" onClick={onClose} className="rounded-lg border border-slate-200 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50">Batal</button>
          <button id="btn-save-edit" type="button" onClick={() => onSave(form)} disabled={saving} className="rounded-lg bg-sky-600 px-4 py-2 text-sm font-medium text-white hover:bg-sky-700 disabled:opacity-60">
            {saving ? 'Menyimpan...' : 'Simpan'}
          </button>
        </div>
      </div>
    </div>
  );
}

export function AdminManagementPanel() {
  const [collectors, setCollectors] = useState<CollectorRecord[]>([]);
  const [markets, setMarkets] = useState<MarketRecord[]>([]);
  const [categories, setCategories] = useState<CategoryRecord[]>([]);
  const [commodities, setCommodities] = useState<CommodityRecord[]>([]);
  const [units, setUnits] = useState<UnitRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [isError, setIsError] = useState(false);

  // Create forms
  const [collectorForm, setCollectorForm] = useState({ username: '', password: '', full_name: '' });
  const [marketForm, setMarketForm] = useState({ province: '', district: '', nks: '', name: '' });
  const [categoryForm, setCategoryForm] = useState({ name: '', type: 'Makanan' });
  const [commodityForm, setCommodityForm] = useState({ code: '', name: '', category_id: '', brand_type: '' });
  const [unitForm, setUnitForm] = useState({ name: '', is_standard: false, conversion_factor: '1' });

  // Edit modal state
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
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  // â”€â”€ Create handlers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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
      await api.createMarket(token, marketForm);
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

  // â”€â”€ Collector actions â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const toggleCollectorStatus = async (collector: CollectorRecord) => {
    const token = localStorage.getItem('pasarata_token');
    if (!token) return;
    const next = collector.status === 'active' ? 'inactive' : 'active';
    try {
      await api.setCollectorStatus(token, collector.id, next);
      showMsg(`Status ${collector.full_name} diubah ke ${next}`);
      await loadData();
    } catch (error) { showMsg(error instanceof Error ? error.message : 'Gagal mengubah status', true); }
  };

  const resetCollectorPassword = async (collector: CollectorRecord) => {
    const token = localStorage.getItem('pasarata_token');
    if (!token) return;
    const newPassword = window.prompt(`Password baru untuk ${collector.full_name} (min 6 karakter):`);
    if (!newPassword) return;
    try {
      await api.resetCollectorPassword(token, collector.id, newPassword);
      showMsg(`Password ${collector.full_name} berhasil di-reset`);
    } catch (error) { showMsg(error instanceof Error ? error.message : 'Gagal reset password', true); }
  };

  const editCollector = async (collector: CollectorRecord) => {
    const token = localStorage.getItem('pasarata_token');
    if (!token) return;
    const fullName = window.prompt('Nama lengkap baru:', collector.full_name);
    const username = window.prompt('Username baru:', collector.username);
    if (!fullName || !username) return;
    try {
      await api.updateCollector(token, collector.id, { full_name: fullName, username });
      showMsg(`Data ${collector.full_name} berhasil diperbarui`);
      await loadData();
    } catch (error) { showMsg(error instanceof Error ? error.message : 'Gagal update pendata', true); }
  };

  // â”€â”€ Master status toggle â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const toggleMasterStatus = async (
    type: 'market' | 'category' | 'commodity' | 'unit',
    id: number,
    currentActive: boolean,
    name: string,
  ) => {
    const token = localStorage.getItem('pasarata_token');
    if (!token) return;
    const next = !currentActive;
    try {
      if (type === 'market') await api.setMarketStatus(token, id, next);
      else if (type === 'category') await api.setCategoryStatus(token, id, next);
      else if (type === 'commodity') await api.setCommodityStatus(token, id, next);
      else await api.setUnitStatus(token, id, next);
      showMsg(`${name} berhasil ${next ? 'diaktifkan' : 'dinonaktifkan'}`);
      await loadData();
    } catch (error) { showMsg(error instanceof Error ? error.message : 'Gagal mengubah status', true); }
  };

  // â”€â”€ Edit modal â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const openEditMarket = (m: MarketRecord) =>
    setEditModal({
      type: 'market', id: m.id,
      fields: [
        { key: 'province', label: 'Provinsi' },
        { key: 'district', label: 'Kabupaten/Kota' },
        { key: 'nks', label: 'NKS' },
        { key: 'name', label: 'Nama Pasar' },
      ],
      values: { province: m.province ?? '', district: m.district ?? '', nks: m.nks ?? '', name: m.name },
    });

  const openEditCategory = (c: CategoryRecord) =>
    setEditModal({
      type: 'category', id: c.id,
      fields: [
        { key: 'name', label: 'Nama Kategori' },
        { key: 'type', label: 'Tipe', options: ['Makanan', 'Non Makanan'] },
      ],
      values: { name: c.name, type: c.type },
    });

  const openEditCommodity = (c: CommodityRecord) =>
    setEditModal({
      type: 'commodity', id: c.id,
      fields: [
        { key: 'code', label: 'Kode' },
        { key: 'name', label: 'Nama Komoditas' },
        { key: 'category_id', label: 'Kategori ID', type: 'number' },
        { key: 'brand_type', label: 'Jenis/Merek (opsional)' },
      ],
      values: { code: c.code, name: c.name, category_id: String(c.category_id), brand_type: c.brand_type ?? '' },
    });

  const openEditUnit = (u: UnitRecord) =>
    setEditModal({
      type: 'unit', id: u.id,
      fields: [
        { key: 'name', label: 'Nama Satuan' },
        { key: 'is_standard', label: 'Gunakan sebagai satuan standar', type: 'checkbox' },
        { key: 'conversion_factor', label: 'Faktor konversi', type: 'number' },
      ],
      values: { name: u.name, is_standard: u.is_standard, conversion_factor: String(u.conversion_factor) },
    });

  const handleEditSave = async (vals: Record<string, string | boolean>) => {
    const token = localStorage.getItem('pasarata_token');
    if (!token || !editModal) return;
    setEditSaving(true);
    try {
      if (editModal.type === 'market') {
        await api.updateMarket(token, editModal.id, {
          province: String(vals.province), district: String(vals.district),
          nks: String(vals.nks), name: String(vals.name),
        });
      } else if (editModal.type === 'category') {
        await api.updateCategory(token, editModal.id, { name: String(vals.name), type: String(vals.type) });
      } else if (editModal.type === 'commodity') {
        await api.updateCommodity(token, editModal.id, {
          code: String(vals.code), name: String(vals.name),
          category_id: Number(vals.category_id), brand_type: String(vals.brand_type),
        });
      } else if (editModal.type === 'unit') {
        await api.updateUnit(token, editModal.id, {
          name: String(vals.name), is_standard: Boolean(vals.is_standard),
          conversion_factor: Number(vals.conversion_factor),
        });
      }
      showMsg('Data master berhasil diperbarui');
      setEditModal(null);
      await loadData();
    } catch (error) {
      showMsg(error instanceof Error ? error.message : 'Gagal memperbarui data master', true);
    } finally {
      setEditSaving(false);
    }
  };

  const fc = 'input';

  return (
    <div className="space-y-8">
      {message ? (
        <div className={`rounded-xl border px-4 py-3 text-sm ${isError ? 'border-red-200 bg-red-50 text-red-700' : 'border-emerald-200 bg-emerald-50 text-emerald-700'}`}>
          {message}
        </div>
      ) : null}

      {/* â”€â”€ Create forms â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Panel title="Tambah Pendata">
          <div className="space-y-3">
            <input className={fc} value={collectorForm.full_name} onChange={(e) => setCollectorForm({ ...collectorForm, full_name: e.target.value })} placeholder="Nama lengkap" />
            <input className={fc} value={collectorForm.username} onChange={(e) => setCollectorForm({ ...collectorForm, username: e.target.value })} placeholder="Username" />
            <input type="password" className={fc} value={collectorForm.password} onChange={(e) => setCollectorForm({ ...collectorForm, password: e.target.value })} placeholder="Password" />
            <button id="btn-create-collector" onClick={submitCollector} className="btn-primary">Simpan pendata</button>
          </div>
        </Panel>

        <Panel title="Tambah Pasar">
          <div className="space-y-3">
            <input className={fc} value={marketForm.province} onChange={(e) => setMarketForm({ ...marketForm, province: e.target.value })} placeholder="Provinsi" />
            <input className={fc} value={marketForm.district} onChange={(e) => setMarketForm({ ...marketForm, district: e.target.value })} placeholder="Kabupaten/Kota" />
            <input className={fc} value={marketForm.nks} onChange={(e) => setMarketForm({ ...marketForm, nks: e.target.value })} placeholder="NKS" />
            <input className={fc} value={marketForm.name} onChange={(e) => setMarketForm({ ...marketForm, name: e.target.value })} placeholder="Nama pasar" />
            <button id="btn-create-market" onClick={submitMarket} className="btn-primary">Simpan pasar</button>
          </div>
        </Panel>

        <Panel title="Tambah Kategori">
          <div className="space-y-3">
            <input className={fc} value={categoryForm.name} onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })} placeholder="Nama kategori" />
            <select className={fc} value={categoryForm.type} onChange={(e) => setCategoryForm({ ...categoryForm, type: e.target.value })}>
              <option>Makanan</option>
              <option>Non Makanan</option>
            </select>
            <button id="btn-create-category" onClick={submitCategory} className="btn-primary">Simpan kategori</button>
          </div>
        </Panel>

        <Panel title="Tambah Komoditas">
          <div className="space-y-3">
            <input className={fc} value={commodityForm.code} onChange={(e) => setCommodityForm({ ...commodityForm, code: e.target.value })} placeholder="Kode komoditas" />
            <input className={fc} value={commodityForm.name} onChange={(e) => setCommodityForm({ ...commodityForm, name: e.target.value })} placeholder="Nama komoditas" />
            <select className={fc} value={commodityForm.category_id} onChange={(e) => setCommodityForm({ ...commodityForm, category_id: e.target.value })}>
              <option value="">Pilih kategori</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>{category.name}</option>
              ))}
            </select>
            <input className={fc} value={commodityForm.brand_type} onChange={(e) => setCommodityForm({ ...commodityForm, brand_type: e.target.value })} placeholder="Jenis / merek (opsional)" />
            <button id="btn-create-commodity" onClick={submitCommodity} className="btn-primary">Simpan komoditas</button>
          </div>
        </Panel>

        <Panel title="Tambah Satuan">
          <div className="space-y-3">
            <input className={fc} value={unitForm.name} onChange={(e) => setUnitForm({ ...unitForm, name: e.target.value })} placeholder="Nama satuan" />
            <label className="flex items-center gap-2 text-sm text-slate-700">
              <input type="checkbox" checked={unitForm.is_standard} onChange={(e) => setUnitForm({ ...unitForm, is_standard: e.target.checked })} />
              Gunakan sebagai satuan standar
            </label>
            <input type="number" step="0.01" className={fc} value={unitForm.conversion_factor} onChange={(e) => setUnitForm({ ...unitForm, conversion_factor: e.target.value })} placeholder="Faktor konversi" />
            <button id="btn-create-unit" onClick={submitUnit} className="btn-primary">Simpan satuan</button>
          </div>
        </Panel>
      </div>

      {/* â”€â”€ Lists â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <div className="grid gap-6 xl:grid-cols-2">
        <Panel title="Daftar Pendata">
          {loading ? <p className="text-slate-500">Memuat...</p> : (
            <ul className="space-y-2 text-sm text-slate-700">
              {collectors.length === 0 ? <li>Belum ada data.</li> : collectors.map((collector) => (
                <li key={collector.id} className="rounded-lg border border-slate-200 px-3 py-2">
                  <div className="font-semibold">{collector.full_name}</div>
                  <div>@{collector.username} â€¢{' '}
                    <span className={collector.status === 'active' ? 'text-emerald-600' : 'text-slate-400'}>{collector.status}</span>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <button id={`btn-edit-collector-${collector.id}`} type="button" onClick={() => editCollector(collector)} className="rounded border border-slate-300 px-2 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50">Edit</button>
                    <button id={`btn-toggle-collector-${collector.id}`} type="button" onClick={() => toggleCollectorStatus(collector)} className="rounded border border-amber-300 px-2 py-1 text-xs font-semibold text-amber-700 hover:bg-amber-50">{collector.status === 'active' ? 'Nonaktifkan' : 'Aktifkan'}</button>
                    <button id={`btn-reset-pw-${collector.id}`} type="button" onClick={() => resetCollectorPassword(collector)} className="rounded border border-rose-300 px-2 py-1 text-xs font-semibold text-rose-700 hover:bg-rose-50">Reset Password</button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <Panel title="Daftar Pasar">
          {loading ? <p className="text-slate-500">Memuat...</p> : (
            <ul className="space-y-2 text-sm text-slate-700">
              {markets.length === 0 ? <li>Belum ada data.</li> : markets.map((market) => (
                <li key={market.id} className={`rounded-lg border px-3 py-2 ${market.active === false ? 'border-slate-100 bg-slate-50 opacity-60' : 'border-slate-200'}`}>
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <div className="font-semibold">{market.name}{market.active === false && <span className="ml-2 text-xs text-slate-400">(nonaktif)</span>}</div>
                      <div className="text-xs text-slate-500">{market.district} â€¢ {market.nks}</div>
                    </div>
                    <div className="flex gap-1">
                      <button id={`btn-edit-market-${market.id}`} type="button" onClick={() => openEditMarket(market)} className="rounded border border-sky-200 bg-sky-50 px-2 py-1 text-xs text-sky-700 hover:bg-sky-100">Edit</button>
                      <button id={`btn-toggle-market-${market.id}`} type="button" onClick={() => toggleMasterStatus('market', market.id, market.active !== false, market.name)} className="rounded border border-amber-200 bg-amber-50 px-2 py-1 text-xs text-amber-700 hover:bg-amber-100">
                        {market.active === false ? 'Aktifkan' : 'Nonaktifkan'}
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <Panel title="Daftar Kategori">
          {categories.length === 0 ? <p className="text-slate-500">Belum ada data.</p> : (
            <ul className="space-y-2 text-sm text-slate-700">
              {categories.map((category) => (
                <li key={category.id} className={`rounded-lg border px-3 py-2 ${category.active === false ? 'border-slate-100 bg-slate-50 opacity-60' : 'border-slate-200'}`}>
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      {category.name}{category.active === false && <span className="ml-2 text-xs text-slate-400">(nonaktif)</span>}
                      <span className="ml-1 text-slate-500">({category.type})</span>
                    </div>
                    <div className="flex gap-1">
                      <button id={`btn-edit-category-${category.id}`} type="button" onClick={() => openEditCategory(category)} className="rounded border border-sky-200 bg-sky-50 px-2 py-1 text-xs text-sky-700 hover:bg-sky-100">Edit</button>
                      <button id={`btn-toggle-category-${category.id}`} type="button" onClick={() => toggleMasterStatus('category', category.id, category.active !== false, category.name)} className="rounded border border-amber-200 bg-amber-50 px-2 py-1 text-xs text-amber-700 hover:bg-amber-100">
                        {category.active === false ? 'Aktifkan' : 'Nonaktifkan'}
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <Panel title="Daftar Satuan">
          {units.length === 0 ? <p className="text-slate-500">Belum ada data.</p> : (
            <ul className="space-y-2 text-sm text-slate-700">
              {units.map((unit) => (
                <li key={unit.id} className={`rounded-lg border px-3 py-2 ${unit.active === false ? 'border-slate-100 bg-slate-50 opacity-60' : 'border-slate-200'}`}>
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      {unit.name} {unit.is_standard ? <span className="rounded bg-sky-100 px-1 text-xs text-sky-700">Standar</span> : ''}
                      {unit.active === false && <span className="ml-2 text-xs text-slate-400">(nonaktif)</span>}
                      <div className="text-xs text-slate-400">Faktor: {unit.conversion_factor}</div>
                    </div>
                    <div className="flex gap-1">
                      <button id={`btn-edit-unit-${unit.id}`} type="button" onClick={() => openEditUnit(unit)} className="rounded border border-sky-200 bg-sky-50 px-2 py-1 text-xs text-sky-700 hover:bg-sky-100">Edit</button>
                      <button id={`btn-toggle-unit-${unit.id}`} type="button" onClick={() => toggleMasterStatus('unit', unit.id, unit.active !== false, unit.name)} className="rounded border border-amber-200 bg-amber-50 px-2 py-1 text-xs text-amber-700 hover:bg-amber-100">
                        {unit.active === false ? 'Aktifkan' : 'Nonaktifkan'}
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>

      {/* Komoditas full-width karena lebih banyak field */}
      <Panel title="Daftar Komoditas">
        {commodities.length === 0 ? <p className="text-slate-500">Belum ada data.</p> : (
          <ul className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3 text-sm text-slate-700">
            {commodities.map((commodity) => (
              <li key={commodity.id} className={`rounded-lg border px-3 py-2 ${commodity.active === false ? 'border-slate-100 bg-slate-50 opacity-60' : 'border-slate-200'}`}>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="font-semibold">{commodity.name}{commodity.active === false && <span className="ml-1 text-xs text-slate-400">(nonaktif)</span>}</div>
                    <div className="text-xs text-slate-500">{commodity.code} â€¢ {commodity.category?.name ?? `Kat #${commodity.category_id}`}</div>
                  </div>
                  <div className="flex shrink-0 flex-col gap-1">
                    <button id={`btn-edit-commodity-${commodity.id}`} type="button" onClick={() => openEditCommodity(commodity)} className="rounded border border-sky-200 bg-sky-50 px-2 py-0.5 text-xs text-sky-700 hover:bg-sky-100">Edit</button>
                    <button id={`btn-toggle-commodity-${commodity.id}`} type="button" onClick={() => toggleMasterStatus('commodity', commodity.id, commodity.active !== false, commodity.name)} className="rounded border border-amber-200 bg-amber-50 px-2 py-0.5 text-xs text-amber-700 hover:bg-amber-100">
                      {commodity.active === false ? 'Aktifkan' : 'Nonaktif'}
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Panel>

      {/* â”€â”€ Edit Modal â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      {editModal && (
        <EditModal
          title={`Edit ${editModal.type === 'market' ? 'Pasar' : editModal.type === 'category' ? 'Kategori' : editModal.type === 'commodity' ? 'Komoditas' : 'Satuan'} #${editModal.id}`}
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

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <h3 className="mb-4 text-lg font-bold text-slate-900">{title}</h3>
      {children}
    </div>
  );
}


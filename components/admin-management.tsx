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
  category?: { name?: string };
};

type UnitRecord = {
  id: number;
  name: string;
  is_standard: boolean;
  conversion_factor: number;
  active?: boolean;
};

export function AdminManagementPanel() {
  const [collectors, setCollectors] = useState<CollectorRecord[]>([]);
  const [markets, setMarkets] = useState<MarketRecord[]>([]);
  const [categories, setCategories] = useState<CategoryRecord[]>([]);
  const [commodities, setCommodities] = useState<CommodityRecord[]>([]);
  const [units, setUnits] = useState<UnitRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

  const [collectorForm, setCollectorForm] = useState({ username: '', password: '', full_name: '' });
  const [marketForm, setMarketForm] = useState({ province: '', district: '', nks: '', name: '' });
  const [categoryForm, setCategoryForm] = useState({ name: '', type: 'Makanan' });
  const [commodityForm, setCommodityForm] = useState({ code: '', name: '', category_id: '', brand_type: '' });
  const [unitForm, setUnitForm] = useState({ name: '', is_standard: false, conversion_factor: '1' });

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
      setMessage(error instanceof Error ? error.message : 'Gagal memuat data master');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const submitCollector = async () => {
    const token = localStorage.getItem('pasarata_token');
    if (!token) return;

    try {
      await api.createCollector(token, collectorForm);
      setCollectorForm({ username: '', password: '', full_name: '' });
      setMessage('Pendata baru berhasil dibuat');
      await loadData();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Gagal membuat pendata');
    }
  };

  const submitMarket = async () => {
    const token = localStorage.getItem('pasarata_token');
    if (!token) return;

    try {
      await api.createMarket(token, marketForm);
      setMarketForm({ province: '', district: '', nks: '', name: '' });
      setMessage('Pasar berhasil dibuat');
      await loadData();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Gagal membuat pasar');
    }
  };

  const submitCategory = async () => {
    const token = localStorage.getItem('pasarata_token');
    if (!token) return;

    try {
      await api.createCategory(token, categoryForm);
      setCategoryForm({ name: '', type: 'Makanan' });
      setMessage('Kategori berhasil dibuat');
      await loadData();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Gagal membuat kategori');
    }
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
      setMessage('Komoditas berhasil dibuat');
      await loadData();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Gagal membuat komoditas');
    }
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
      setMessage('Satuan berhasil dibuat');
      await loadData();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Gagal membuat satuan');
    }
  };

  const toggleCollectorStatus = async (collector: CollectorRecord) => {
    const token = localStorage.getItem('pasarata_token');
    if (!token) return;
    const next = collector.status === 'active' ? 'inactive' : 'active';

    try {
      await api.setCollectorStatus(token, collector.id, next);
      setMessage(`Status ${collector.full_name} diubah ke ${next}`);
      await loadData();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Gagal mengubah status pendata');
    }
  };

  const resetCollectorPassword = async (collector: CollectorRecord) => {
    const token = localStorage.getItem('pasarata_token');
    if (!token) return;
    const newPassword = window.prompt(`Password baru untuk ${collector.full_name} (min 6 karakter):`);
    if (!newPassword) return;

    try {
      await api.resetCollectorPassword(token, collector.id, newPassword);
      setMessage(`Password ${collector.full_name} berhasil di-reset`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Gagal reset password');
    }
  };

  const editCollector = async (collector: CollectorRecord) => {
    const token = localStorage.getItem('pasarata_token');
    if (!token) return;
    const fullName = window.prompt('Nama lengkap baru:', collector.full_name);
    const username = window.prompt('Username baru:', collector.username);
    if (!fullName || !username) return;

    try {
      await api.updateCollector(token, collector.id, { full_name: fullName, username });
      setMessage(`Data ${collector.full_name} berhasil diperbarui`);
      await loadData();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Gagal update pendata');
    }
  };

  return (
    <div className="space-y-8">
      {message ? <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{message}</div> : null}

      <div className="grid gap-6 lg:grid-cols-2">
        <Panel title="Tambah Pendata">
          <div className="space-y-3">
            <input className="input" value={collectorForm.full_name} onChange={(e) => setCollectorForm({ ...collectorForm, full_name: e.target.value })} placeholder="Nama lengkap" />
            <input className="input" value={collectorForm.username} onChange={(e) => setCollectorForm({ ...collectorForm, username: e.target.value })} placeholder="Username" />
            <input type="password" className="input" value={collectorForm.password} onChange={(e) => setCollectorForm({ ...collectorForm, password: e.target.value })} placeholder="Password" />
            <button onClick={submitCollector} className="btn-primary">Simpan pendata</button>
          </div>
        </Panel>

        <Panel title="Tambah Pasar">
          <div className="space-y-3">
            <input className="input" value={marketForm.province} onChange={(e) => setMarketForm({ ...marketForm, province: e.target.value })} placeholder="Provinsi" />
            <input className="input" value={marketForm.district} onChange={(e) => setMarketForm({ ...marketForm, district: e.target.value })} placeholder="Kabupaten/Kota" />
            <input className="input" value={marketForm.nks} onChange={(e) => setMarketForm({ ...marketForm, nks: e.target.value })} placeholder="NKS" />
            <input className="input" value={marketForm.name} onChange={(e) => setMarketForm({ ...marketForm, name: e.target.value })} placeholder="Nama pasar" />
            <button onClick={submitMarket} className="btn-primary">Simpan pasar</button>
          </div>
        </Panel>

        <Panel title="Tambah Kategori">
          <div className="space-y-3">
            <input className="input" value={categoryForm.name} onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })} placeholder="Nama kategori" />
            <select className="input" value={categoryForm.type} onChange={(e) => setCategoryForm({ ...categoryForm, type: e.target.value })}>
              <option>Makanan</option>
              <option>Non Makanan</option>
            </select>
            <button onClick={submitCategory} className="btn-primary">Simpan kategori</button>
          </div>
        </Panel>

        <Panel title="Tambah Komoditas">
          <div className="space-y-3">
            <input className="input" value={commodityForm.code} onChange={(e) => setCommodityForm({ ...commodityForm, code: e.target.value })} placeholder="Kode komoditas" />
            <input className="input" value={commodityForm.name} onChange={(e) => setCommodityForm({ ...commodityForm, name: e.target.value })} placeholder="Nama komoditas" />
            <select className="input" value={commodityForm.category_id} onChange={(e) => setCommodityForm({ ...commodityForm, category_id: e.target.value })}>
              <option value="">Pilih kategori</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>{category.name}</option>
              ))}
            </select>
            <input className="input" value={commodityForm.brand_type} onChange={(e) => setCommodityForm({ ...commodityForm, brand_type: e.target.value })} placeholder="Jenis / merek (opsional)" />
            <button onClick={submitCommodity} className="btn-primary">Simpan komoditas</button>
          </div>
        </Panel>

        <Panel title="Tambah Satuan">
          <div className="space-y-3">
            <input className="input" value={unitForm.name} onChange={(e) => setUnitForm({ ...unitForm, name: e.target.value })} placeholder="Nama satuan" />
            <label className="flex items-center gap-2 text-sm text-slate-700">
              <input type="checkbox" checked={unitForm.is_standard} onChange={(e) => setUnitForm({ ...unitForm, is_standard: e.target.checked })} />
              Gunakan sebagai satuan standar
            </label>
            <input type="number" step="0.01" className="input" value={unitForm.conversion_factor} onChange={(e) => setUnitForm({ ...unitForm, conversion_factor: e.target.value })} placeholder="Faktor konversi" />
            <button onClick={submitUnit} className="btn-primary">Simpan satuan</button>
          </div>
        </Panel>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <Panel title="Daftar Pendata">
          {loading ? <p className="text-slate-500">Memuat...</p> : (
            <ul className="space-y-2 text-sm text-slate-700">
              {collectors.length === 0 ? <li>Belum ada data.</li> : collectors.map((collector) => (
                <li key={collector.id} className="rounded-lg border border-slate-200 px-3 py-2">
                  <div className="font-semibold">{collector.full_name}</div>
                  <div>@{collector.username} • {collector.status}</div>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <button type="button" onClick={() => editCollector(collector)} className="rounded border border-slate-300 px-2 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50">Edit</button>
                    <button type="button" onClick={() => toggleCollectorStatus(collector)} className="rounded border border-amber-300 px-2 py-1 text-xs font-semibold text-amber-700 hover:bg-amber-50">{collector.status === 'active' ? 'Nonaktifkan' : 'Aktifkan'}</button>
                    <button type="button" onClick={() => resetCollectorPassword(collector)} className="rounded border border-rose-300 px-2 py-1 text-xs font-semibold text-rose-700 hover:bg-rose-50">Reset Password</button>
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
                <li key={market.id} className="rounded-lg border border-slate-200 px-3 py-2">
                  <div className="font-semibold">{market.name}</div>
                  <div>{market.district} • {market.nks}</div>
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
                <li key={category.id} className="rounded-lg border border-slate-200 px-3 py-2">
                  {category.name} <span className="text-slate-500">({category.type})</span>
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <Panel title="Daftar Satuan">
          {units.length === 0 ? <p className="text-slate-500">Belum ada data.</p> : (
            <ul className="space-y-2 text-sm text-slate-700">
              {units.map((unit) => (
                <li key={unit.id} className="rounded-lg border border-slate-200 px-3 py-2">
                  {unit.name} {unit.is_standard ? '(Standar)' : ''}
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>
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

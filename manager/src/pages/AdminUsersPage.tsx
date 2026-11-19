import React from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Eye, Pencil, Plus, Save, Shield, Trash2, Users } from 'lucide-react';
import { ManagerLayout } from '../components/layout/ManagerLayout';
import { apiRequest } from '../services/apiClient';
import { useToast } from '../context/ToastContext';

type UserRole = 'AGENT' | 'FACTORY_MANAGER';
type AdminUser = { id: string; name: string; email: string; employeeCode: string; role: UserRole; phone?: string; avatarUrl?: string; status: string };
const roleLabel = (role: UserRole) => role === 'AGENT' ? 'Sales User' : 'Factory User';

const UserForm = ({ role, user, onSaved }: { role: UserRole; user?: AdminUser; onSaved: (item: AdminUser) => void }) => {
  const { showToast } = useToast();
  const [form, setForm] = React.useState({ name: user?.name ?? '', email: user?.email ?? '', employeeCode: user?.employeeCode ?? '', phone: user?.phone ?? '', avatarUrl: user?.avatarUrl ?? '', password: '' });
  const [saving, setSaving] = React.useState(false);
  const set = (key: keyof typeof form, value: string) => setForm((current) => ({ ...current, [key]: value }));
  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!/^\d{7,10}$/.test(form.employeeCode)) return showToast('Invalid Employee ID', 'Use 7 to 10 digits.', 'error');
    if (!user && form.password.length < 8) return showToast('Password required', 'Use at least 8 characters.', 'error');
    setSaving(true);
    try {
      const payload = { ...form, role, ...(user && !form.password ? { password: undefined } : {}) };
      const result = user
        ? await apiRequest<{ user: AdminUser }>(`/api/v1/admin/users/${user.id}`, { method: 'PATCH', body: JSON.stringify(payload) })
        : await apiRequest<{ user: AdminUser }>('/api/v1/admin/users', { method: 'POST', body: JSON.stringify(payload) });
      onSaved(result.user);
      showToast('Saved', `${roleLabel(role)} details saved.`, 'success');
    } catch (error) { showToast('Save failed', error instanceof Error ? error.message : 'Unable to save user.', 'error'); }
    finally { setSaving(false); }
  };
  return <form onSubmit={submit} className="grid gap-4 rounded-2xl border border-slate-800 bg-slate-900/70 p-5 text-white md:grid-cols-2">
    <label className="grid gap-1 text-sm font-bold">Full name<input required value={form.name} onChange={(e) => set('name', e.target.value)} className="rounded-xl border border-slate-700 bg-slate-950 p-3" /></label>
    <label className="grid gap-1 text-sm font-bold">Email<input required type="email" value={form.email} onChange={(e) => set('email', e.target.value)} className="rounded-xl border border-slate-700 bg-slate-950 p-3" /></label>
    <label className="grid gap-1 text-sm font-bold">Employee ID (7–10 digits)<input required inputMode="numeric" pattern="[0-9]{7,10}" value={form.employeeCode} onChange={(e) => set('employeeCode', e.target.value.replace(/\D/g, '').slice(0, 10))} className="rounded-xl border border-slate-700 bg-slate-950 p-3" /></label>
    <label className="grid gap-1 text-sm font-bold">Phone<input value={form.phone} onChange={(e) => set('phone', e.target.value)} className="rounded-xl border border-slate-700 bg-slate-950 p-3" /></label>
    <label className="grid gap-1 text-sm font-bold md:col-span-2">Avatar image URL<input type="url" value={form.avatarUrl} onChange={(e) => set('avatarUrl', e.target.value)} placeholder="https://..." className="rounded-xl border border-slate-700 bg-slate-950 p-3" /></label>
    <label className="grid gap-1 text-sm font-bold md:col-span-2">{user ? 'New password (optional)' : 'Password'}<input required={!user} type="password" minLength={8} value={form.password} onChange={(e) => set('password', e.target.value)} className="rounded-xl border border-slate-700 bg-slate-950 p-3" /></label>
    {form.avatarUrl && <img src={form.avatarUrl} alt="Avatar preview" className="h-20 w-20 rounded-2xl object-cover" />}
    <button disabled={saving} className="inline-flex items-center justify-center gap-2 rounded-xl bg-cyan-500 px-4 py-3 font-extrabold text-slate-950 disabled:opacity-50 md:col-span-2"><Save className="h-4 w-4" />{saving ? 'Saving…' : 'Save user'}</button>
  </form>;
};

export const AdminUsersPage = ({ role }: { role: UserRole }) => {
  const { id, mode } = useParams();
  const navigate = useNavigate();
  const [users, setUsers] = React.useState<AdminUser[]>([]);
  const [selected, setSelected] = React.useState<AdminUser>();
  const [loading, setLoading] = React.useState(true);
  const refresh = React.useCallback(() => apiRequest<{ users: AdminUser[] }>(`/api/v1/admin/users?role=${role}`).then((data) => setUsers(data.users)).finally(() => setLoading(false)), [role]);
  React.useEffect(() => { void refresh(); }, [refresh]);
  React.useEffect(() => { if (id) void apiRequest<{ user: AdminUser }>(`/api/v1/admin/users/${id}`).then((data) => setSelected(data.user)); }, [id]);
  const title = roleLabel(role);
  const editing = mode === 'edit' || mode === 'new';
  return <ManagerLayout><div className="space-y-5"><div className="flex flex-wrap items-center justify-between gap-3"><div><h1 className="flex items-center gap-2 text-2xl font-extrabold text-white"><Users className="text-cyan-400" />{title}s</h1><p className="mt-1 text-sm text-slate-400">Manage login access, profile and password.</p></div><Link to={`${role === 'AGENT' ? '/admin/sales-users' : '/admin/factory-users'}/new`} className="inline-flex items-center gap-2 rounded-xl bg-cyan-500 px-4 py-3 font-extrabold text-slate-950"><Plus className="h-4 w-4" />Add {title}</Link></div>
    {editing ? <><button onClick={() => navigate(-1)} className="inline-flex items-center gap-2 text-sm font-bold text-cyan-300"><ArrowLeft className="h-4 w-4" />Back</button><UserForm role={role} user={mode === 'edit' ? selected : undefined} onSaved={() => { void refresh(); navigate(role === 'AGENT' ? '/admin/sales-users' : '/admin/factory-users'); }} /></> : id && selected ? <section className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6 text-white"><div className="flex items-center gap-4">{selected.avatarUrl ? <img src={selected.avatarUrl} alt="" className="h-20 w-20 rounded-2xl object-cover" /> : <div className="grid h-20 w-20 place-items-center rounded-2xl bg-cyan-500 text-2xl font-black text-slate-950">{selected.name[0]}</div>}<div><h2 className="text-xl font-extrabold">{selected.name}</h2><p className="text-cyan-300">{selected.email}</p><p className="text-sm text-slate-400">{selected.employeeCode} · {title} · {selected.status}</p></div></div><Link to={`${role === 'AGENT' ? '/admin/sales-users' : '/admin/factory-users'}/edit/${selected.id}`} className="mt-5 inline-flex items-center gap-2 rounded-xl bg-cyan-500 px-4 py-3 font-bold text-slate-950"><Pencil className="h-4 w-4" />Edit</Link></section> : <section className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/70"><div className="divide-y divide-slate-800">{loading ? <p className="p-6 text-slate-400">Loading…</p> : users.map((item) => <div key={item.id} className="flex items-center justify-between gap-3 p-4 text-white"><div className="flex items-center gap-3">{item.avatarUrl ? <img src={item.avatarUrl} alt="" className="h-11 w-11 rounded-xl object-cover" /> : <div className="grid h-11 w-11 place-items-center rounded-xl bg-cyan-500 font-black text-slate-950">{item.name[0]}</div>}<div><p className="font-extrabold">{item.name}</p><p className="text-xs text-slate-400">{item.email} · ID {item.employeeCode}</p></div></div><div className="flex gap-2"><Link title="View" to={`${role === 'AGENT' ? '/admin/sales-users' : '/admin/factory-users'}/view/${item.id}`} className="rounded-lg border border-slate-700 p-2 text-cyan-300"><Eye className="h-4 w-4" /></Link><Link title="Edit" to={`${role === 'AGENT' ? '/admin/sales-users' : '/admin/factory-users'}/edit/${item.id}`} className="rounded-lg border border-slate-700 p-2 text-cyan-300"><Pencil className="h-4 w-4" /></Link></div></div>)}{!loading && !users.length && <p className="p-6 text-slate-400">No {title.toLowerCase()} accounts found.</p>}</div></section>}</div></ManagerLayout>;
};

import { Camera, LogOut, Save, Wifi, WifiOff } from 'lucide-react';
import { useState } from 'react';
import Avatar from '../components/Avatar.jsx';
import TextField from '../components/TextField.jsx';
import Toast from '../components/Toast.jsx';
import { api } from '../services/api.js';
import { useAuthStore } from '../store/authStore.js';
import { useChatStore } from '../store/chatStore.js';

export default function Profile() {
  const { user, updateUser, logout } = useAuthStore();
  const presenceMode = useChatStore((state) => state.presenceMode);
  const setPresenceMode = useChatStore((state) => state.setPresenceMode);
  const requestNotifications = useChatStore((state) => state.requestNotifications);
  const testSound = useChatStore((state) => state.testSound);
  const audioUnlocked = useChatStore((state) => state.audioUnlocked);
  const [toast, setToast] = useState('');
  const [form, setForm] = useState({
    name: user?.name || '',
    bio: user?.bio || '',
    status: user?.status || 'Disponível',
    avatarUrl: user?.avatarUrl || '',
    password: ''
  });

  async function save(event) {
    event.preventDefault();
    try {
      const { data } = await api.put('/users/update', form);
      updateUser(data.user);
      setToast('Perfil atualizado.');
    } catch {
      setToast('Não foi possível atualizar o perfil.');
    }
  }

  return (
    <section className="no-scrollbar h-[calc(100vh-5.5rem)] overflow-y-auto px-5 py-6">
      <Toast message={toast} />
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-slate-400">Conta</p>
          <h1 className="text-3xl font-extrabold text-white">Perfil</h1>
        </div>
        <button onClick={logout} aria-label="Sair" className="grid h-11 w-11 place-items-center rounded-2xl bg-white/5 text-slate-300">
          <LogOut size={20} />
        </button>
      </div>
      <form onSubmit={save} className="mt-8 space-y-5">
        <div className="flex items-center gap-5">
          <Avatar user={{ ...user, ...form }} size="lg" online={presenceMode === 'online'} />
          <button type="button" className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-bold text-white">
            <Camera size={18} /> Alterar foto
          </button>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => setPresenceMode('online')}
            className={`inline-flex items-center justify-center gap-2 rounded-2xl border px-4 py-3 text-sm font-extrabold ${presenceMode === 'online' ? 'border-emerald/50 bg-emerald/15 text-emerald' : 'border-white/10 bg-white/5 text-slate-300'}`}
          >
            <Wifi size={18} /> Online
          </button>
          <button
            type="button"
            onClick={() => setPresenceMode('offline')}
            className={`inline-flex items-center justify-center gap-2 rounded-2xl border px-4 py-3 text-sm font-extrabold ${presenceMode === 'offline' ? 'border-slate-400/40 bg-white/10 text-white' : 'border-white/10 bg-white/5 text-slate-300'}`}
          >
            <WifiOff size={18} /> Offline
          </button>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={requestNotifications}
            className="rounded-2xl border border-neon/30 bg-neon/10 px-4 py-3 text-sm font-extrabold text-neon"
          >
            Ativar alertas
          </button>
          <button
            type="button"
            onClick={testSound}
            className={`rounded-2xl border px-4 py-3 text-sm font-extrabold ${audioUnlocked ? 'border-emerald/40 bg-emerald/10 text-emerald' : 'border-white/10 bg-white/5 text-slate-300'}`}
          >
            Testar som
          </button>
        </div>
        <TextField label="Nome" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        <TextField label="Foto URL" value={form.avatarUrl} onChange={(e) => setForm({ ...form, avatarUrl: e.target.value })} />
        <label className="block">
          <span className="mb-2 block text-sm font-semibold text-slate-300">Bio</span>
          <textarea className="min-h-28 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none focus:border-neon" value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} />
        </label>
        <TextField label="Status" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} />
        <TextField label="Nova senha" type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
        <button className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-neon px-4 py-3.5 font-extrabold text-ink shadow-glow">
          <Save size={18} /> Salvar alterações
        </button>
      </form>
    </section>
  );
}

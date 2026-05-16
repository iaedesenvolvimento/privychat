import { LockKeyhole, Mail } from 'lucide-react';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import TextField from '../components/TextField.jsx';
import Toast from '../components/Toast.jsx';
import { useAuthStore } from '../store/authStore.js';

export default function Login() {
  const navigate = useNavigate();
  const login = useAuthStore((state) => state.login);
  const googleLogin = useAuthStore((state) => state.googleLogin);
  const [form, setForm] = useState({ email: '', password: '', remember: true });
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState('');

  async function submit(event) {
    event.preventDefault();
    setLoading(true);
    try {
      await login(form);
      navigate('/app');
    } catch (error) {
      setToast(error.response?.data?.message || 'Não foi possível entrar.');
    } finally {
      setLoading(false);
    }
  }

  async function googleSubmit() {
    setToast('Configure o Google Identity Services e envie o credential JWT para ativar este botão.');
    await googleLogin('demo-disabled').catch(() => {});
  }

  return (
    <motion.section initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="glass my-8 rounded-[2rem] p-5">
      <Toast message={toast} type="error" />
      <div className="mb-7">
        <p className="text-sm font-semibold text-neon">Bem-vindo de volta</p>
        <h1 className="mt-2 text-3xl font-extrabold text-white">Entre no seu chat privado</h1>
      </div>
      <form onSubmit={submit} className="space-y-4">
        <TextField label="Email" icon={Mail} type="email" placeholder="voce@email.com" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
        <TextField label="Senha" icon={LockKeyhole} type="password" placeholder="Sua senha" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required />
        <div className="flex items-center justify-between text-sm">
          <label className="flex items-center gap-2 text-slate-300">
            <input type="checkbox" checked={form.remember} onChange={(e) => setForm({ ...form, remember: e.target.checked })} className="h-4 w-4 accent-neon" />
            Lembrar login
          </label>
          <button type="button" className="font-semibold text-neon">Recuperar senha</button>
        </div>
        <button disabled={loading} className="w-full rounded-2xl bg-neon px-4 py-3.5 font-extrabold text-ink shadow-glow disabled:opacity-60">
          {loading ? 'Entrando...' : 'Entrar'}
        </button>
      </form>
      <button onClick={googleSubmit} className="mt-4 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3.5 font-bold text-white">
        Entrar com Google
      </button>
      <p className="mt-6 text-center text-sm text-slate-400">
        Novo por aqui? <Link className="font-bold text-neon" to="/register">Criar conta</Link>
      </p>
    </motion.section>
  );
}

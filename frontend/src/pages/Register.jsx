import { Camera, LockKeyhole, Mail, UserRound } from 'lucide-react';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { useMemo, useState } from 'react';
import TextField from '../components/TextField.jsx';
import Toast from '../components/Toast.jsx';
import { useAuthStore } from '../store/authStore.js';

export default function Register() {
  const navigate = useNavigate();
  const register = useAuthStore((state) => state.register);
  const [toast, setToast] = useState('');
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', password: '', confirmPassword: '', avatarUrl: '' });

  const strength = useMemo(() => {
    return [/[A-Z]/, /[a-z]/, /\d/, /[^A-Za-z0-9]/, /.{8,}/].filter((rule) => rule.test(form.password)).length;
  }, [form.password]);

  async function submit(event) {
    event.preventDefault();
    if (form.password !== form.confirmPassword) return setToast('As senhas precisam ser iguais.');
    if (strength < 4) return setToast('Use uma senha mais forte.');
    setLoading(true);
    try {
      await register(form);
      navigate('/app');
    } catch (error) {
      setToast(error.response?.data?.message || 'Não foi possível criar a conta.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <motion.section initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="glass my-8 rounded-[2rem] p-5">
      <Toast message={toast} type="error" />
      <h1 className="text-3xl font-extrabold text-white">Criar conta</h1>
      <p className="mt-2 text-sm text-slate-400">Seu espaço privado, rápido e protegido.</p>
      <form onSubmit={submit} className="mt-6 space-y-4">
        <TextField label="Nome" icon={UserRound} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
        <TextField label="Email" icon={Mail} type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
        <TextField label="Foto de perfil opcional" icon={Camera} placeholder="https://..." value={form.avatarUrl} onChange={(e) => setForm({ ...form, avatarUrl: e.target.value })} />
        <TextField label="Senha" icon={LockKeyhole} type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required />
        <div className="grid grid-cols-5 gap-1">
          {Array.from({ length: 5 }).map((_, index) => (
            <span key={index} className={`h-1.5 rounded-full ${index < strength ? 'bg-emerald' : 'bg-white/10'}`} />
          ))}
        </div>
        <TextField label="Confirmar senha" icon={LockKeyhole} type="password" value={form.confirmPassword} onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })} required />
        <button disabled={loading} className="w-full rounded-2xl bg-neon px-4 py-3.5 font-extrabold text-ink shadow-glow disabled:opacity-60">
          {loading ? 'Criando...' : 'Criar conta'}
        </button>
      </form>
      <p className="mt-6 text-center text-sm text-slate-400">
        Já tem conta? <Link className="font-bold text-neon" to="/login">Entrar</Link>
      </p>
    </motion.section>
  );
}

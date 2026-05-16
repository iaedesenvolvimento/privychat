import { Outlet } from 'react-router-dom';
import Logo from '../components/Logo.jsx';

export default function AuthLayout() {
  return (
    <main className="min-h-screen px-5 py-8 text-mist">
      <div className="mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-md flex-col justify-between">
        <Logo />
        <Outlet />
        <p className="text-center text-xs text-slate-500">Criptografia, presença e mensagens em tempo real.</p>
      </div>
    </main>
  );
}

import { Bell, MessageCircle, UserRound } from 'lucide-react';
import { useEffect } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useChatStore } from '../store/chatStore.js';

export default function AppLayout() {
  const navigate = useNavigate();
  const bindSocket = useChatStore((state) => state.bindSocket);
  const socketConnected = useChatStore((state) => state.socketConnected);
  const lastAlert = useChatStore((state) => state.lastAlert);
  const clearAlert = useChatStore((state) => state.clearAlert);
  const requestNotifications = useChatStore((state) => state.requestNotifications);
  const presenceMode = useChatStore((state) => state.presenceMode);

  useEffect(() => {
    bindSocket();
  }, [bindSocket]);

  const nav = [
    { to: '/app', icon: MessageCircle, label: 'Chats', end: true },
    { to: '/app/profile', icon: UserRound, label: 'Perfil' }
  ];

  return (
    <main className="mx-auto flex min-h-screen max-w-5xl flex-col bg-ink text-mist md:border-x md:border-white/10">
      <div className={`px-4 py-1 text-center text-[0.7rem] font-bold ${socketConnected && presenceMode === 'online' ? 'bg-emerald/12 text-emerald' : 'bg-rose-500/12 text-rose-200'}`}>
        {!socketConnected ? 'Reconectando tempo real...' : presenceMode === 'online' ? 'Online para seus contatos' : 'Offline para seus contatos'}
      </div>
      {lastAlert && (
        <button
          onClick={() => {
            navigate(`/app/chat/${lastAlert.conversationId}`);
            clearAlert();
          }}
          className="mx-3 mt-3 rounded-2xl border border-neon/30 bg-neon/10 px-4 py-3 text-left text-sm text-mist shadow-glow"
        >
          <span className="block font-extrabold text-neon">{lastAlert.title}</span>
          <span className="mt-1 block truncate text-slate-200">{lastAlert.body}</span>
        </button>
      )}
      <div className="flex-1 overflow-hidden">
        <Outlet />
      </div>
      <nav className="safe-bottom sticky bottom-0 z-30 border-t border-white/10 bg-ink/88 px-5 pt-3 backdrop-blur">
        <div className="mx-auto flex max-w-md items-center justify-around">
          {nav.map(({ to, icon: Icon, label, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `flex min-w-20 flex-col items-center gap-1 rounded-2xl px-4 py-2 text-xs font-semibold transition ${isActive ? 'bg-neon/12 text-neon' : 'text-slate-500'}`
              }
            >
              <Icon size={22} />
              {label}
            </NavLink>
          ))}
          <button onClick={requestNotifications} className="flex min-w-20 flex-col items-center gap-1 rounded-2xl px-4 py-2 text-xs font-semibold text-slate-500">
            <Bell size={22} />
            Alertas
          </button>
        </div>
      </nav>
    </main>
  );
}

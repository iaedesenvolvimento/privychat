import { motion } from 'framer-motion';
import { Bell, Plus, Search, Wifi } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useEffect, useMemo, useState } from 'react';
import Avatar from '../components/Avatar.jsx';
import ConversationSkeleton from '../components/ConversationSkeleton.jsx';
import { useDebounce } from '../hooks/useDebounce.js';
import { api } from '../services/api.js';
import { useAuthStore } from '../store/authStore.js';
import { useChatStore } from '../store/chatStore.js';

export default function ChatHome() {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const { conversations, loading, search, setSearch, onlineUsers, loadConversations, requestNotifications } = useChatStore();
  const [users, setUsers] = useState([]);
  const [showUsers, setShowUsers] = useState(false);
  const debounced = useDebounce(search);

  useEffect(() => {
    loadConversations().catch(() => {});
  }, [loadConversations]);

  useEffect(() => {
    const syncConversations = () => {
      if (document.visibilityState === 'visible') loadConversations().catch(() => {});
    };
    window.addEventListener('focus', syncConversations);
    document.addEventListener('visibilitychange', syncConversations);
    return () => {
      window.removeEventListener('focus', syncConversations);
      document.removeEventListener('visibilitychange', syncConversations);
    };
  }, [loadConversations]);

  const filtered = useMemo(() => {
    return conversations.filter((conversation) => conversation.peer?.name?.toLowerCase().includes(debounced.toLowerCase()));
  }, [conversations, debounced]);

  async function openNewChat() {
    const { data } = await api.get('/users');
    setUsers(data.users);
    setShowUsers(true);
  }

  async function startConversation(peerId) {
    const { data } = await api.post('/conversations/create', { userId: peerId });
    setShowUsers(false);
    navigate(`/app/chat/${data.conversationId}`);
  }

  return (
    <section className="flex h-[calc(100vh-5.5rem)] flex-col">
      <header className="px-5 pb-4 pt-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-slate-400">Olá, {user?.name?.split(' ')[0]}</p>
            <h1 className="text-3xl font-extrabold text-white">Mensagens</h1>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={requestNotifications} className="grid h-11 w-11 place-items-center rounded-2xl bg-white/5 text-slate-300" aria-label="Ativar notificacoes">
              <Bell size={20} />
            </button>
            <button onClick={openNewChat} className="grid h-11 w-11 place-items-center rounded-2xl bg-neon text-ink shadow-glow" aria-label="Nova conversa">
              <Plus size={22} />
            </button>
          </div>
        </div>
        <div className="mt-5 flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
          <Search size={18} className="text-slate-500" />
          <input value={search} onChange={(event) => setSearch(event.target.value)} className="w-full bg-transparent text-sm text-white outline-none placeholder:text-slate-500" placeholder="Buscar conversas" />
        </div>
      </header>
      <div className="no-scrollbar flex-1 overflow-y-auto">
        {loading ? (
          <ConversationSkeleton />
        ) : filtered.length === 0 ? (
          <div className="mx-5 mt-10 rounded-3xl border border-dashed border-white/15 p-8 text-center">
            <Wifi className="mx-auto text-neon" size={34} />
            <h2 className="mt-4 text-lg font-bold text-white">Sem conversas ainda</h2>
            <p className="mt-2 text-sm text-slate-400">Inicie uma conversa quando houver usuários disponíveis.</p>
          </div>
        ) : (
          <div className="space-y-1 px-3 pb-8">
            {filtered.map((conversation, index) => (
              <motion.div key={conversation.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.03 }}>
                <Link to={`/app/chat/${conversation.id}`} className="flex items-center gap-3 rounded-3xl px-3 py-3 transition hover:bg-white/5">
                  <Avatar user={conversation.peer} online={onlineUsers.has(conversation.peer?.id) || conversation.peer?.isOnline} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-3">
                      <h2 className="truncate font-bold text-white">{conversation.peer?.name}</h2>
                      <span className="shrink-0 text-xs text-slate-500">{conversation.lastMessageAtLabel}</span>
                    </div>
                    <div className="mt-1 flex items-center gap-2">
                      <span className={`h-1.5 w-1.5 rounded-full ${onlineUsers.has(conversation.peer?.id) || conversation.peer?.isOnline ? 'bg-emerald' : 'bg-slate-600'}`} />
                      <p className="min-w-0 flex-1 truncate text-sm text-slate-400">{conversation.lastMessage || 'Conversa privada iniciada'}</p>
                      <span className={`shrink-0 text-[0.68rem] font-bold ${onlineUsers.has(conversation.peer?.id) || conversation.peer?.isOnline ? 'text-emerald' : 'text-slate-600'}`}>
                        {onlineUsers.has(conversation.peer?.id) || conversation.peer?.isOnline ? 'online' : 'offline'}
                      </span>
                    </div>
                  </div>
                  {conversation.unreadCount > 0 && (
                    <span className="grid h-6 min-w-6 place-items-center rounded-full bg-neon px-2 text-xs font-extrabold text-ink">
                      {conversation.unreadCount}
                    </span>
                  )}
                </Link>
              </motion.div>
            ))}
          </div>
        )}
      </div>
      {showUsers && (
        <div className="fixed inset-0 z-50 flex items-end bg-black/50 p-3 backdrop-blur-sm md:items-center md:justify-center">
          <div className="w-full rounded-[1.8rem] border border-white/10 bg-graphite p-4 shadow-glow md:max-w-md">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-lg font-extrabold text-white">Nova conversa</h2>
              <button onClick={() => setShowUsers(false)} className="rounded-xl px-3 py-2 text-sm font-bold text-slate-400">Fechar</button>
            </div>
            <div className="max-h-80 space-y-1 overflow-y-auto">
              {users.map((peer) => (
                <button key={peer.id} onClick={() => startConversation(peer.id)} className="flex w-full items-center gap-3 rounded-2xl p-3 text-left hover:bg-white/5">
                  <Avatar user={peer} online={peer.isOnline} />
                  <div>
                    <p className="font-bold text-white">{peer.name}</p>
                    <p className="text-sm text-slate-400">{peer.status || peer.email}</p>
                  </div>
                </button>
              ))}
              {users.length === 0 && <p className="py-8 text-center text-sm text-slate-400">Nenhum outro usuário encontrado.</p>}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

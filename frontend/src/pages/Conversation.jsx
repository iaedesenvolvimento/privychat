import { ImagePlus, Mic, MoreVertical, Send, Smile, StopCircle, X } from 'lucide-react';
import { motion } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import Avatar from '../components/Avatar.jsx';
import Toast from '../components/Toast.jsx';
import { api } from '../services/api.js';
import { useAuthStore } from '../store/authStore.js';
import { useChatStore } from '../store/chatStore.js';

const EMOJIS = ['😀', '😂', '😍', '🔥', '👏', '🙏', '💙', '✅', '🚀', '👀', '😎', '🥳', '😅', '😭', '🤝', '✨'];

function readAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function mediaSrc(url = '') {
  if (!url) return '';
  if (url.startsWith('http') || url.startsWith('data:')) return url;
  return `${import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000'}${url}`;
}

export default function Conversation() {
  const { conversationId } = useParams();
  const user = useAuthStore((state) => state.user);
  const { messages, activeConversation, typing, onlineUsers, loadMessages, sendMessage, emitTyping, markConversationRead } = useChatStore();
  const [body, setBody] = useState('');
  const [showEmoji, setShowEmoji] = useState(false);
  const [sendingMedia, setSendingMedia] = useState(false);
  const [recording, setRecording] = useState(false);
  const [toast, setToast] = useState('');
  const bottomRef = useRef(null);
  const fileRef = useRef(null);
  const recorderRef = useRef(null);
  const chunksRef = useRef([]);

  useEffect(() => {
    loadMessages(conversationId).catch(() => {});
  }, [conversationId, loadMessages]);

  useEffect(() => {
    const markVisibleMessages = () => {
      if (document.visibilityState === 'visible') markConversationRead(conversationId).catch(() => {});
    };
    document.addEventListener('visibilitychange', markVisibleMessages);
    return () => document.removeEventListener('visibilitychange', markVisibleMessages);
  }, [conversationId, markConversationRead]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  async function submit(event) {
    event.preventDefault();
    const trimmed = body.trim();
    if (!trimmed) return;
    setBody('');
    setShowEmoji(false);
    emitTyping(conversationId, false);
    await sendMessage({ conversationId, body: trimmed });
  }

  async function sendFile(file) {
    if (!file) return;
    if (file.size > 8 * 1024 * 1024) {
      setToast('Arquivo muito grande. Envie ate 8MB.');
      return;
    }
    setSendingMedia(true);
    try {
      const dataUrl = await readAsDataUrl(file);
      const upload = await api.post('/messages/upload', { dataUrl });
      const isAudio = file.type.startsWith('audio/');
      const isImage = file.type.startsWith('image/');
      await sendMessage({
        conversationId,
        body: isImage ? '' : file.name,
        mediaUrl: upload.data.mediaUrl,
        type: upload.data.type || (isAudio ? 'audio' : 'image')
      });
    } catch (error) {
      setToast(error.response?.data?.message || 'Nao foi possivel enviar o arquivo.');
    } finally {
      setSendingMedia(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  }

  async function toggleRecording() {
    if (recording) {
      recorderRef.current?.stop();
      setRecording(false);
      return;
    }
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const recorder = new MediaRecorder(stream);
    chunksRef.current = [];
    recorderRef.current = recorder;
    recorder.ondataavailable = (event) => {
      if (event.data.size > 0) chunksRef.current.push(event.data);
    };
    recorder.onstop = async () => {
      stream.getTracks().forEach((track) => track.stop());
      const blob = new Blob(chunksRef.current, { type: recorder.mimeType || 'audio/webm' });
      const file = new File([blob], `audio-${Date.now()}.webm`, { type: blob.type });
      await sendFile(file);
    };
    recorder.start();
    setRecording(true);
  }

  const peer = activeConversation?.peer;
  const isPeerOnline = onlineUsers.has(peer?.id) || peer?.isOnline;
  const presenceLabel = peer ? (isPeerOnline ? 'online agora' : 'offline') : 'carregando...';

  return (
    <section className="flex h-[calc(100vh-5.5rem)] flex-col">
      <Toast message={toast} type="error" />
      <header className="sticky top-0 z-20 flex items-center gap-3 border-b border-white/10 bg-ink/88 px-4 py-4 backdrop-blur">
        <Link to="/app" className="text-2xl text-slate-300">‹</Link>
        <Avatar user={peer} online={isPeerOnline} />
        <div className="min-w-0 flex-1">
          <h1 className="truncate font-extrabold text-white">{peer?.name || 'Conversa'}</h1>
          <p className={`text-xs ${isPeerOnline ? 'text-emerald' : 'text-slate-500'}`}>
            {typing[conversationId] ? 'digitando...' : presenceLabel}
          </p>
        </div>
        <button className="grid h-10 w-10 place-items-center rounded-2xl text-slate-400 hover:bg-white/10" aria-label="Mais opcoes">
          <MoreVertical size={20} />
        </button>
      </header>

      <div className="no-scrollbar flex-1 space-y-3 overflow-y-auto px-4 py-5">
        {messages.filter((message) => message.conversationId === conversationId).map((message) => {
          const mine = message.senderId === user?.id;
          return (
            <motion.div key={message.id} initial={{ opacity: 0, y: 8, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[78%] rounded-[1.4rem] px-4 py-3 ${mine ? 'rounded-br-md bg-neon text-ink' : 'rounded-bl-md bg-white/8 text-mist ring-1 ring-white/10'}`}>
                {message.type === 'image' && message.mediaUrl && <img src={mediaSrc(message.mediaUrl)} alt="" className="mb-2 max-h-64 rounded-2xl object-cover" />}
                {message.type === 'audio' && message.mediaUrl && <audio src={mediaSrc(message.mediaUrl)} controls className="mb-2 w-64 max-w-full" />}
                {message.body && <p className="whitespace-pre-wrap text-sm leading-relaxed">{message.body}</p>}
                <p className={`mt-1 text-right text-[0.68rem] ${mine ? 'text-ink/60' : 'text-slate-500'}`}>
                  {message.createdAtLabel}{mine ? ` · ${message.readAt ? 'Lida' : 'Enviada'}` : ''}
                </p>
              </div>
            </motion.div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      <form onSubmit={submit} className="safe-bottom relative border-t border-white/10 bg-ink/95 px-3 pt-3">
        {showEmoji && (
          <div className="absolute bottom-24 left-3 right-3 grid grid-cols-8 gap-2 rounded-3xl border border-white/10 bg-graphite p-3 shadow-glow">
            <button type="button" onClick={() => setShowEmoji(false)} className="col-span-8 mb-1 ml-auto grid h-8 w-8 place-items-center rounded-xl text-slate-400 hover:bg-white/10" aria-label="Fechar emojis">
              <X size={16} />
            </button>
            {EMOJIS.map((emoji) => (
              <button key={emoji} type="button" onClick={() => setBody((value) => `${value}${emoji}`)} className="grid h-10 place-items-center rounded-2xl bg-white/5 text-xl hover:bg-white/10">
                {emoji}
              </button>
            ))}
          </div>
        )}
        <div className="flex items-end gap-2 rounded-3xl border border-white/10 bg-white/5 p-2">
          <button type="button" onClick={() => setShowEmoji((value) => !value)} aria-label="Emojis" className="grid h-10 w-10 place-items-center rounded-2xl text-slate-400 hover:bg-white/10">
            <Smile size={20} />
          </button>
          <textarea
            value={body}
            onChange={(event) => {
              setBody(event.target.value);
              emitTyping(conversationId, event.target.value.length > 0);
            }}
            rows={1}
            className="max-h-28 min-h-10 flex-1 resize-none bg-transparent px-1 py-2 text-sm text-white outline-none placeholder:text-slate-500"
            placeholder="Mensagem"
          />
          <input ref={fileRef} type="file" accept="image/*,audio/*" className="hidden" onChange={(event) => sendFile(event.target.files?.[0])} />
          <button type="button" disabled={sendingMedia} onClick={() => fileRef.current?.click()} aria-label="Enviar arquivo" className="grid h-10 w-10 place-items-center rounded-2xl text-slate-400 hover:bg-white/10 disabled:opacity-50">
            <ImagePlus size={20} />
          </button>
          <button type="button" onClick={toggleRecording} aria-label={recording ? 'Parar audio' : 'Gravar audio'} className={`grid h-10 w-10 place-items-center rounded-2xl ${recording ? 'bg-rose-400 text-white' : 'text-slate-400 hover:bg-white/10'}`}>
            {recording ? <StopCircle size={20} /> : <Mic size={20} />}
          </button>
          <button className="grid h-10 w-10 place-items-center rounded-2xl bg-neon text-ink" aria-label="Enviar"><Send size={18} /></button>
        </div>
      </form>
    </section>
  );
}

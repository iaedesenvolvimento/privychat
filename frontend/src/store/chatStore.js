import { create } from 'zustand';
import { api } from '../services/api.js';
import { getSocket } from '../services/socket.js';

let audioContext;
let audioUnlocked = false;

async function unlockAlertSound() {
  audioContext = audioContext || new (window.AudioContext || window.webkitAudioContext)();
  if (audioContext.state === 'suspended') await audioContext.resume();
  audioUnlocked = audioContext.state === 'running';
  playAlertSound(true, true);
}

function playAlertSound(enabled, force = false) {
  if (!enabled) return;
  try {
    audioContext = audioContext || new (window.AudioContext || window.webkitAudioContext)();
    if (audioContext.state !== 'running' && !force) return;
    const oscillator = audioContext.createOscillator();
    const oscillatorTwo = audioContext.createOscillator();
    const gain = audioContext.createGain();
    oscillator.type = 'triangle';
    oscillatorTwo.type = 'sine';
    oscillator.frequency.setValueAtTime(1046, audioContext.currentTime);
    oscillator.frequency.setValueAtTime(784, audioContext.currentTime + 0.16);
    oscillatorTwo.frequency.setValueAtTime(1568, audioContext.currentTime + 0.08);
    gain.gain.setValueAtTime(0.0001, audioContext.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.18, audioContext.currentTime + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, audioContext.currentTime + 0.42);
    oscillator.connect(gain);
    oscillatorTwo.connect(gain);
    gain.connect(audioContext.destination);
    oscillator.start();
    oscillatorTwo.start(audioContext.currentTime + 0.08);
    oscillator.stop(audioContext.currentTime + 0.44);
    oscillatorTwo.stop(audioContext.currentTime + 0.36);
  } catch {
    audioUnlocked = false;
  }
}

function notifyMessage(message) {
  if (!('Notification' in window) || Notification.permission !== 'granted') return;
  const title = message.type === 'audio' ? 'Novo audio no PrivyChat' : message.type === 'image' ? 'Nova imagem no PrivyChat' : 'Nova mensagem no PrivyChat';
  new Notification(title, {
    body: message.body || 'Abra a conversa para visualizar.',
    icon: '/pwa-192.png',
    tag: message.conversationId
  });
}

function messagePreview(message) {
  if (message.body) return message.body;
  if (message.type === 'image') return 'Imagem';
  if (message.type === 'audio') return 'Audio';
  return 'Nova mensagem';
}

export const useChatStore = create((set, get) => ({
  conversations: [],
  activeConversation: null,
  messages: [],
  onlineUsers: new Set(),
  typing: {},
  loading: false,
  search: '',
  socketConnected: false,
  soundEnabled: sessionStorage.getItem('privychat.soundEnabled') === 'true',
  audioUnlocked: false,
  presenceMode: localStorage.getItem('privychat.presenceMode') || 'online',
  lastAlert: null,
  setSearch: (search) => set({ search }),
  clearAlert: () => set({ lastAlert: null }),
  requestNotifications: async () => {
    await unlockAlertSound().catch(() => {});
    let permission = 'unsupported';
    if ('Notification' in window) {
      permission = Notification.permission === 'default' ? await Notification.requestPermission() : Notification.permission;
    }
    sessionStorage.setItem('privychat.soundEnabled', 'true');
    set({ soundEnabled: true, audioUnlocked });
    return permission;
  },
  testSound: async () => {
    await unlockAlertSound().catch(() => {});
    sessionStorage.setItem('privychat.soundEnabled', 'true');
    set({ soundEnabled: true, audioUnlocked });
  },
  setPresenceMode: (presenceMode) => {
    localStorage.setItem('privychat.presenceMode', presenceMode);
    set({ presenceMode });
    const socket = getSocket();
    if (socket.connected) socket.emit('presence:set', { online: presenceMode === 'online' });
  },
  loadConversations: async () => {
    set({ loading: true });
    try {
      const { data } = await api.get('/conversations');
      set({ conversations: data.conversations });
    } finally {
      set({ loading: false });
    }
  },
  loadMessages: async (conversationId, page = 1) => {
    const socket = getSocket();
    if (socket.connected) socket.emit('conversation:join', conversationId);
    if (page === 1) {
      const existing = get().conversations.find((conversation) => conversation.id === conversationId);
      set({
        messages: [],
        activeConversation: existing ? { id: conversationId, peer: existing.peer } : { id: conversationId, peer: null }
      });
    }
    const { data } = await api.get(`/messages/${conversationId}?page=${page}`);
    if (get().activeConversation?.id !== conversationId) return;
    set({
      messages: page === 1 ? data.messages : [...data.messages, ...get().messages],
      activeConversation: data.conversation
    });
    if (page === 1) get().markConversationRead(conversationId).catch(() => {});
  },
  markConversationRead: async (conversationId) => {
    await api.post('/messages/read', { conversationId });
    getSocket().emit('messages:read', { conversationId });
    set({
      conversations: get().conversations.map((conversation) =>
        conversation.id === conversationId ? { ...conversation, unreadCount: 0 } : conversation
      )
    });
  },
  sendMessage: async ({ conversationId, body = '', mediaUrl = '', type = 'text' }) => {
    const { data } = await api.post('/messages/send', { conversationId, body, mediaUrl, type });
    if (get().activeConversation?.id === conversationId) {
      set({ messages: [...get().messages, data.message] });
    }
    set({
      conversations: get().conversations.map((conversation) =>
        conversation.id === conversationId
          ? {
              ...conversation,
              lastMessage: messagePreview(data.message),
              lastMessageAt: data.message.createdAt,
              lastMessageAtLabel: data.message.createdAtLabel
            }
          : conversation
      )
    });
    await get().loadConversations().catch(() => {});
  },
  bindSocket: () => {
    const socket = getSocket();
    socket.off('connect').on('connect', () => {
      set({ socketConnected: true });
      socket.emit('presence:set', { online: get().presenceMode === 'online' });
      socket.emit('presence:request');
      get().loadConversations().catch(() => {});
    });
    socket.off('disconnect').on('disconnect', () => {
      set({ socketConnected: false, onlineUsers: new Set() });
    });
    socket.off('connect_error').on('connect_error', () => set({ socketConnected: false }));

    if (!socket.connected) socket.connect();
    if (socket.connected) socket.emit('presence:request');

    socket.off('message:new').on('message:new', (message) => {
      const isActiveConversation = get().activeConversation?.id === message.conversationId;
      const exists = get().messages.some((item) => item.id === message.id);
      if (isActiveConversation && !exists) set({ messages: [...get().messages, message] });
      set({
        conversations: get().conversations.map((conversation) =>
          conversation.id === message.conversationId
            ? {
                ...conversation,
                lastMessage: messagePreview(message),
                lastMessageAt: message.createdAt,
                lastMessageAtLabel: message.createdAtLabel,
                unreadCount: isActiveConversation ? 0 : (conversation.unreadCount || 0) + 1
              }
            : conversation
        ),
        lastAlert: { id: message.id, title: 'Nova mensagem', body: messagePreview(message), conversationId: message.conversationId }
      });
      playAlertSound(get().soundEnabled);
      notifyMessage(message);
      if (isActiveConversation) {
        get().markConversationRead(message.conversationId).catch(() => {});
      }
      get().loadConversations().catch(() => {});
    });
    socket.off('presence:update').on('presence:update', (ids) => {
      const onlineUsers = new Set(ids);
      set({
        onlineUsers,
        conversations: get().conversations.map((conversation) => ({
          ...conversation,
          peer: conversation.peer ? { ...conversation.peer, isOnline: onlineUsers.has(conversation.peer.id) } : conversation.peer
        })),
        activeConversation: get().activeConversation?.peer
          ? {
              ...get().activeConversation,
              peer: { ...get().activeConversation.peer, isOnline: onlineUsers.has(get().activeConversation.peer.id) }
            }
          : get().activeConversation
      });
    });
    socket.off('messages:read').on('messages:read', ({ conversationId }) => {
      if (get().activeConversation?.id !== conversationId) return;
      set({
        messages: get().messages.map((message) =>
          message.conversationId === conversationId ? { ...message, readAt: message.readAt || new Date().toISOString() } : message
        )
      });
    });
    socket.off('typing:update').on('typing:update', ({ conversationId, userId, isTyping }) => {
      set({ typing: { ...get().typing, [conversationId]: isTyping ? userId : null } });
    });
  },
  emitTyping: (conversationId, isTyping) => getSocket().emit('typing:update', { conversationId, isTyping })
}));

import dayjs from 'dayjs';
import { query } from '../config/db.js';
import { decryptMessage } from '../utils/crypto.js';
import { publicUser } from '../utils/formatters.js';

function safeDecryptMessage(payload) {
  try {
    return payload ? decryptMessage(payload) : '';
  } catch {
    return '';
  }
}

async function mapConversation(row) {
  let lastMessage = '';
  if (row.body_encrypted) lastMessage = safeDecryptMessage(row.body_encrypted);
  if (!lastMessage && row.message_type === 'image') lastMessage = 'Imagem';
  if (!lastMessage && row.message_type === 'audio') lastMessage = 'Audio';

  return {
    id: row.id,
    peer: publicUser({
      id: row.peer_id,
      name: row.peer_name,
      email: row.peer_email,
      avatar_url: row.peer_avatar_url,
      bio: row.peer_bio,
      status: row.peer_status,
      is_online: row.peer_is_online,
      last_seen: row.peer_last_seen
    }),
    lastMessage,
    lastMessageAt: row.last_message_at,
    lastMessageAtLabel: row.last_message_at ? dayjs(row.last_message_at).format('HH:mm') : '',
    unreadCount: row.unread_count || 0
  };
}

export async function getConversations(req, res) {
  const rows = await query(
    `SELECT c.id, cp.unread_count, u.id peer_id, u.name peer_name, u.email peer_email, u.avatar_url peer_avatar_url,
      u.bio peer_bio, u.status peer_status, u.is_online peer_is_online, u.last_seen peer_last_seen,
      m.body_encrypted, m.type message_type, m.created_at last_message_at
     FROM conversations c
     JOIN conversation_participants me ON me.conversation_id = c.id AND me.user_id = :userId
     JOIN conversation_participants peerp ON peerp.conversation_id = c.id AND peerp.user_id <> :userId
     JOIN users u ON u.id = peerp.user_id
     LEFT JOIN conversation_participants cp ON cp.conversation_id = c.id AND cp.user_id = :userId
     LEFT JOIN messages m ON m.id = (
       SELECT id FROM messages WHERE conversation_id = c.id ORDER BY created_at DESC, id DESC LIMIT 1
     )
     ORDER BY COALESCE(m.created_at, c.updated_at) DESC`,
    { userId: req.user.id }
  );
  const conversations = await Promise.all(rows.map((row) => mapConversation(row)));
  res.json({ conversations });
}

export async function createConversation(req, res) {
  const peerId = req.body.userId;
  if (peerId === req.user.id) return res.status(422).json({ message: 'Escolha outro usuário.' });
  const existing = await query(
    `SELECT c.id FROM conversations c
     JOIN conversation_participants a ON a.conversation_id = c.id AND a.user_id = :me
     JOIN conversation_participants b ON b.conversation_id = c.id AND b.user_id = :peer
     LIMIT 1`,
    { me: req.user.id, peer: peerId }
  );
  if (existing.length) return res.status(200).json({ conversationId: existing[0].id });
  await query('INSERT INTO conversations (created_by) VALUES (:id)', { id: req.user.id });
  const created = await query('SELECT id FROM conversations WHERE created_by = :id ORDER BY created_at DESC LIMIT 1', { id: req.user.id });
  await query('INSERT INTO conversation_participants (conversation_id, user_id) VALUES (:conversationId, :me), (:conversationId, :peer)', {
    conversationId: created[0].id,
    me: req.user.id,
    peer: peerId
  });
  res.status(201).json({ conversationId: created[0].id });
}

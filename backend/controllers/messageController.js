import { query } from '../config/db.js';
import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import { decryptMessage, encryptMessage } from '../utils/crypto.js';
import { messageDto, publicUser, sanitize, sanitizeMediaUrl } from '../utils/formatters.js';

const uploadDir = path.isAbsolute(process.env.UPLOAD_DIR || '') ? process.env.UPLOAD_DIR : path.join(process.cwd(), process.env.UPLOAD_DIR || 'uploads');
const maxUploadBytes = 8 * 1024 * 1024;

function parseDataUrl(dataUrl = '') {
  const match = String(dataUrl).match(/^data:(image\/(?:png|jpeg|jpg|webp|gif)|audio\/(?:webm|mpeg|mp3|wav|ogg));base64,(.+)$/);
  if (!match) return null;
  const [, mimeType, base64] = match;
  const buffer = Buffer.from(base64, 'base64');
  if (buffer.length > maxUploadBytes) return { tooLarge: true };
  const extensionMap = {
    'image/png': 'png',
    'image/jpeg': 'jpg',
    'image/jpg': 'jpg',
    'image/webp': 'webp',
    'image/gif': 'gif',
    'audio/webm': 'webm',
    'audio/mpeg': 'mp3',
    'audio/mp3': 'mp3',
    'audio/wav': 'wav',
    'audio/ogg': 'ogg'
  };
  return { mimeType, buffer, extension: extensionMap[mimeType] };
}

export async function getMessages(req, res) {
  const page = Math.max(Number(req.query.page || 1), 1);
  const limit = 30;
  const offset = (page - 1) * limit;
  const access = await query('SELECT conversation_id FROM conversation_participants WHERE conversation_id = :conversationId AND user_id = :userId', {
    conversationId: req.params.conversationId,
    userId: req.user.id
  });
  if (!access.length) return res.status(403).json({ message: 'Sem acesso a conversa.' });
  const rows = await query('SELECT * FROM messages WHERE conversation_id = :conversationId ORDER BY created_at DESC LIMIT :limit OFFSET :offset', {
    conversationId: req.params.conversationId,
    limit,
    offset
  });
  const peerRows = await query(
    `SELECT u.* FROM conversation_participants cp JOIN users u ON u.id = cp.user_id
     WHERE cp.conversation_id = :conversationId AND cp.user_id <> :userId LIMIT 1`,
    { conversationId: req.params.conversationId, userId: req.user.id }
  );
  await query('UPDATE conversation_participants SET unread_count = 0 WHERE conversation_id = :conversationId AND user_id = :userId', {
    conversationId: req.params.conversationId,
    userId: req.user.id
  });
  await query('UPDATE messages SET read_at = COALESCE(read_at, NOW()) WHERE conversation_id = :conversationId AND sender_id <> :userId', {
    conversationId: req.params.conversationId,
    userId: req.user.id
  });
  res.json({
    conversation: { id: req.params.conversationId, peer: publicUser(peerRows[0]) },
    messages: rows.reverse().map((row) => messageDto(row, decryptMessage(row.body_encrypted)))
  });
}

export async function sendMessage(req, res) {
  try {
    const { conversationId, mediaUrl, type = 'text' } = req.body;
    const body = sanitize(req.body.body || '');
    const safeType = ['text', 'image', 'audio'].includes(type) ? type : 'text';
    const safeMediaUrl = sanitizeMediaUrl(mediaUrl);
    const access = await query('SELECT user_id FROM conversation_participants WHERE conversation_id = :conversationId', { conversationId });
    if (!access.some((row) => row.user_id === req.user.id)) return res.status(403).json({ message: 'Sem acesso a conversa.' });
    if (!body && !safeMediaUrl) return res.status(422).json({ message: 'Mensagem vazia.' });
    const bodyEncrypted = encryptMessage(body);
    await query(
      'INSERT INTO messages (conversation_id, sender_id, body_encrypted, media_url, type, delivered_at) VALUES (:conversationId, :senderId, :body, :mediaUrl, :type, NOW())',
      { conversationId, senderId: req.user.id, body: bodyEncrypted, mediaUrl: safeMediaUrl, type: safeType }
    );
    await query('UPDATE conversations SET updated_at = NOW() WHERE id = :conversationId', { conversationId });
    await query('UPDATE conversation_participants SET unread_count = unread_count + 1 WHERE conversation_id = :conversationId AND user_id <> :senderId', {
      conversationId,
      senderId: req.user.id
    });
    const rows = await query('SELECT * FROM messages WHERE conversation_id = :conversationId AND sender_id = :senderId ORDER BY created_at DESC LIMIT 1', {
      conversationId,
      senderId: req.user.id
    });
    const message = messageDto(rows[0], body);
    const io = req.app.get('io');
    access
      .filter((participant) => participant.user_id !== req.user.id)
      .forEach((participant) => io.to(`user:${participant.user_id}`).emit('message:new', message));
    res.status(201).json({ message });
  } catch (error) {
    console.error('sendMessage failed', error);
    res.status(400).json({ message: 'Nao foi possivel enviar a mensagem.' });
  }
}

export async function uploadMedia(req, res) {
  const parsed = parseDataUrl(req.body?.dataUrl);
  if (!parsed) return res.status(422).json({ message: 'Arquivo invalido. Envie imagem ou audio.' });
  if (parsed.tooLarge) return res.status(413).json({ message: 'Arquivo muito grande. Use ate 8MB.' });
  await fs.mkdir(uploadDir, { recursive: true });
  const filename = `${Date.now()}-${crypto.randomUUID()}.${parsed.extension}`;
  await fs.writeFile(path.join(uploadDir, filename), parsed.buffer);
  res.status(201).json({
    mediaUrl: `/uploads/${filename}`,
    mimeType: parsed.mimeType,
    type: parsed.mimeType.startsWith('audio/') ? 'audio' : 'image'
  });
}

export async function markMessagesRead(req, res) {
  const { conversationId } = req.body;
  const access = await query('SELECT conversation_id FROM conversation_participants WHERE conversation_id = :conversationId AND user_id = :userId', {
    conversationId,
    userId: req.user.id
  });
  if (!access.length) return res.status(403).json({ message: 'Sem acesso a conversa.' });
  await query('UPDATE conversation_participants SET unread_count = 0 WHERE conversation_id = :conversationId AND user_id = :userId', {
    conversationId,
    userId: req.user.id
  });
  await query('UPDATE messages SET read_at = COALESCE(read_at, NOW()) WHERE conversation_id = :conversationId AND sender_id <> :userId', {
    conversationId,
    userId: req.user.id
  });
  res.json({ ok: true, conversationId });
}

import dayjs from 'dayjs';
import xss from 'xss';

export function sanitize(value = '') {
  return xss(String(value).trim());
}

export function sanitizeMediaUrl(value = '') {
  const media = String(value || '').trim();
  if (!media) return '';
  if (media.startsWith('/uploads/') || media.startsWith('data:image/') || media.startsWith('data:audio/') || media.startsWith('https://') || media.startsWith('http://')) {
    return media;
  }
  return '';
}

export function publicUser(row) {
  if (!row) return null;
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    avatarUrl: row.avatar_url,
    bio: row.bio,
    status: row.status,
    isOnline: Boolean(row.is_online),
    lastSeen: row.last_seen
  };
}

export function messageDto(row, body) {
  return {
    id: row.id,
    conversationId: row.conversation_id,
    senderId: row.sender_id,
    body,
    mediaUrl: row.media_url,
    type: row.type,
    deliveredAt: row.delivered_at,
    readAt: row.read_at,
    createdAt: row.created_at,
    createdAtLabel: dayjs(row.created_at).format('HH:mm')
  };
}

import bcrypt from 'bcryptjs';
import { query } from '../config/db.js';
import { publicUser, sanitize } from '../utils/formatters.js';

export async function listUsers(req, res) {
  const rows = await query('SELECT * FROM users WHERE id <> :id ORDER BY is_online DESC, name ASC LIMIT 100', { id: req.user.id });
  res.json({ users: rows.map(publicUser) });
}

export async function getUser(req, res) {
  const rows = await query('SELECT * FROM users WHERE id = :id', { id: req.params.id });
  if (!rows.length) return res.status(404).json({ message: 'Usuário não encontrado.' });
  res.json({ user: publicUser(rows[0]) });
}

export async function updateUser(req, res) {
  const updates = {
    name: sanitize(req.body.name || req.user.name),
    avatarUrl: sanitize(req.body.avatarUrl || ''),
    bio: sanitize(req.body.bio || ''),
    status: sanitize(req.body.status || 'Disponível')
  };
  await query('UPDATE users SET name = :name, avatar_url = :avatarUrl, bio = :bio, status = :status WHERE id = :id', { ...updates, id: req.user.id });
  if (req.body.password) {
    const passwordHash = await bcrypt.hash(req.body.password, 12);
    await query('UPDATE users SET password_hash = :passwordHash WHERE id = :id', { passwordHash, id: req.user.id });
  }
  const rows = await query('SELECT * FROM users WHERE id = :id', { id: req.user.id });
  res.json({ user: publicUser(rows[0]) });
}

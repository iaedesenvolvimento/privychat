import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { query } from '../config/db.js';
import { publicUser } from '../utils/formatters.js';

export async function authRequired(req, res, next) {
  try {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : null;
    if (!token) return res.status(401).json({ message: 'Token ausente.' });
    const payload = jwt.verify(token, env.jwtSecret);
    const rows = await query('SELECT * FROM users WHERE id = :id', { id: payload.sub });
    if (!rows.length) return res.status(401).json({ message: 'Usuário inválido.' });
    req.user = publicUser(rows[0]);
    next();
  } catch {
    res.status(401).json({ message: 'Sessão expirada.' });
  }
}

import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import axios from 'axios';
import { env } from '../config/env.js';
import { query } from '../config/db.js';
import { hashToken, signAccessToken, signRefreshToken } from '../utils/tokens.js';
import { publicUser, sanitize } from '../utils/formatters.js';

async function persistSession(req, user, refreshToken) {
  const expires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  await query(
    'INSERT INTO sessions (user_id, refresh_token_hash, user_agent, ip_address, expires_at) VALUES (:userId, :hash, :agent, :ip, :expires)',
    { userId: user.id, hash: hashToken(refreshToken), agent: req.headers['user-agent'] || '', ip: req.ip, expires }
  );
}

function setRefreshCookie(res, token) {
  res.cookie('refreshToken', token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: env.nodeEnv === 'production',
    maxAge: 7 * 24 * 60 * 60 * 1000
  });
}

async function issueSession(req, res, userRow) {
  const user = publicUser(userRow);
  const accessToken = signAccessToken(user);
  const refreshToken = signRefreshToken(user);
  await persistSession(req, user, refreshToken);
  setRefreshCookie(res, refreshToken);
  res.json({ user, accessToken });
}

export async function register(req, res) {
  const { name, email, password, avatarUrl } = req.body;
  const exists = await query('SELECT id FROM users WHERE email = :email', { email: sanitize(email).toLowerCase() });
  if (exists.length) return res.status(409).json({ message: 'Email já cadastrado.' });
  const passwordHash = await bcrypt.hash(password, 12);
  await query(
    'INSERT INTO users (name, email, password_hash, avatar_url) VALUES (:name, :email, :passwordHash, :avatarUrl)',
    { name: sanitize(name), email: sanitize(email).toLowerCase(), passwordHash, avatarUrl: sanitize(avatarUrl || '') }
  );
  const rows = await query('SELECT * FROM users WHERE email = :email', { email: sanitize(email).toLowerCase() });
  await issueSession(req, res, rows[0]);
}

export async function login(req, res) {
  const { email, password } = req.body;
  const rows = await query('SELECT * FROM users WHERE email = :email', { email: sanitize(email).toLowerCase() });
  if (!rows.length || !rows[0].password_hash) return res.status(401).json({ message: 'Credenciais inválidas.' });
  const valid = await bcrypt.compare(password, rows[0].password_hash);
  if (!valid) return res.status(401).json({ message: 'Credenciais inválidas.' });
  await issueSession(req, res, rows[0]);
}

export async function googleLogin(req, res) {
  const { credential } = req.body;
  const google = await axios.get('https://oauth2.googleapis.com/tokeninfo', { params: { id_token: credential } });
  if (env.googleClientId && google.data.aud !== env.googleClientId) return res.status(401).json({ message: 'Google token inválido.' });
  const email = sanitize(google.data.email).toLowerCase();
  let rows = await query('SELECT * FROM users WHERE email = :email', { email });
  if (!rows.length) {
    await query(
      'INSERT INTO users (name, email, google_id, avatar_url) VALUES (:name, :email, :googleId, :avatarUrl)',
      { name: sanitize(google.data.name), email, googleId: google.data.sub, avatarUrl: sanitize(google.data.picture || '') }
    );
    rows = await query('SELECT * FROM users WHERE email = :email', { email });
  }
  await issueSession(req, res, rows[0]);
}

export async function refresh(req, res) {
  const token = req.cookies?.refreshToken;
  if (!token) return res.status(401).json({ message: 'Refresh token ausente.' });
  const payload = jwt.verify(token, env.jwtRefreshSecret);
  const sessions = await query('SELECT * FROM sessions WHERE refresh_token_hash = :hash AND revoked_at IS NULL AND expires_at > NOW()', { hash: hashToken(token) });
  if (!sessions.length) return res.status(401).json({ message: 'Sessão inválida.' });
  const rows = await query('SELECT * FROM users WHERE id = :id', { id: payload.sub });
  const accessToken = signAccessToken(publicUser(rows[0]));
  res.json({ accessToken });
}

export async function logout(req, res) {
  const token = req.cookies?.refreshToken;
  if (token) await query('UPDATE sessions SET revoked_at = NOW() WHERE refresh_token_hash = :hash', { hash: hashToken(token) });
  res.clearCookie('refreshToken');
  res.json({ ok: true });
}

export async function me(req, res) {
  res.json({ user: req.user });
}

import { Router } from 'express';
import { body } from 'express-validator';
import { googleLogin, login, logout, me, refresh, register } from '../controllers/authController.js';
import { authRequired } from '../middlewares/auth.js';
import { authLimiter } from '../middlewares/security.js';
import { validate } from '../middlewares/validate.js';

const router = Router();

router.post('/register', authLimiter, [
  body('name').isLength({ min: 2 }),
  body('email').isEmail(),
  body('password').isStrongPassword({ minLength: 8 })
], validate, register);

router.post('/login', authLimiter, [body('email').isEmail(), body('password').isLength({ min: 6 })], validate, login);
router.post('/google-login', authLimiter, [body('credential').isString().notEmpty()], validate, googleLogin);
router.post('/refresh', refresh);
router.post('/logout', logout);
router.get('/me', authRequired, me);

export default router;

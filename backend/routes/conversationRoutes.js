import { Router } from 'express';
import { body } from 'express-validator';
import { createConversation, getConversations } from '../controllers/conversationController.js';
import { authRequired } from '../middlewares/auth.js';
import { validate } from '../middlewares/validate.js';

const router = Router();

router.use(authRequired);
router.get('/', getConversations);
router.post('/create', [body('userId').isString().notEmpty()], validate, createConversation);

export default router;

import { Router } from 'express';
import { body } from 'express-validator';
import { getMessages, markMessagesRead, sendMessage, uploadMedia } from '../controllers/messageController.js';
import { authRequired } from '../middlewares/auth.js';
import { validate } from '../middlewares/validate.js';

const router = Router();

router.use(authRequired);
router.post('/read', [body('conversationId').isString().notEmpty()], validate, markMessagesRead);
router.post('/upload', [body('dataUrl').isString().notEmpty()], validate, uploadMedia);
router.post('/send', [
  body('conversationId').isString().notEmpty(),
  body('body').optional({ values: 'falsy' }).isString(),
  body('mediaUrl').optional({ values: 'falsy' }).isString(),
  body('type').optional().isIn(['text', 'image', 'audio'])
], validate, sendMessage);
router.get('/:conversationId', getMessages);

export default router;

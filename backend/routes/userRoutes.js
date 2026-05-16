import { Router } from 'express';
import { body } from 'express-validator';
import { getUser, listUsers, updateUser } from '../controllers/userController.js';
import { authRequired } from '../middlewares/auth.js';
import { validate } from '../middlewares/validate.js';

const router = Router();

router.use(authRequired);
router.get('/', listUsers);
router.put('/update', [
  body('name').optional().isLength({ min: 2 }),
  body('password').optional({ values: 'falsy' }).isStrongPassword({ minLength: 8 })
], validate, updateUser);
router.get('/:id', getUser);

export default router;

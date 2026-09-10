import { Router } from 'express';
import { getMessages, createMessage } from '../controllers/messages.controller.js';
import { validateBody } from '../middlewares/validate.middleware.js';
import { createMessageSchema } from '../validations/booking.validation.js';

const router = Router();

router.get('/', getMessages);
router.post('/', validateBody(createMessageSchema), createMessage);

export default router;

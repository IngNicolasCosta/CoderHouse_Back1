import { messagesService } from '../services/messages.service.js';

export const getMessages = async (req, res, next) => {
  try {
    const messages = await messagesService.getMessages();
    res.status(200).json({ status: 'success', payload: messages });
  } catch (error) {
    next(error);
  }
};

export const createMessage = async (req, res, next) => {
  try {
    const created = await messagesService.createMessage(req.body);
    res.status(201).json({ status: 'success', payload: created });
  } catch (error) {
    next(error);
  }
};

export default { getMessages, createMessage };

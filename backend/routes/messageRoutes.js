import express from 'express';
import authenticateToken from '../middleware/auth.js';
import {
    getMessages,
    markAsRead,
    markAllAsRead,
    deleteMessage
} from '../controllers/messageController.js';

const router = express.Router();

router.get('/', authenticateToken, getMessages);
router.put('/:id/read', authenticateToken, markAsRead);
router.put('/read-all', authenticateToken, markAllAsRead);
router.delete('/:id', authenticateToken, deleteMessage);

export default router;

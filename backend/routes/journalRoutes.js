import express from 'express';
import authenticateToken from '../middleware/authMiddleware.js';
import {
    createEntry,
    getEntries,
    getEntryById,
    updateEntry,
    deleteEntry
} from '../controllers/journalController.js';

const router = express.Router();

router.post('/', authenticateToken, createEntry);
router.get('/', authenticateToken, getEntries);
router.get('/:id', authenticateToken, getEntryById);
router.put('/:id', authenticateToken, updateEntry);
router.delete('/:id', authenticateToken, deleteEntry);

export default router;

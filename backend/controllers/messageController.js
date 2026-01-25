import Message from '../models/Message.js';

// Get all messages for user
export const getMessages = async (req, res) => {
    try {
        const messages = await Message.find({ userId: req.user.id, archived: false })
            .sort({ createdAt: -1 })
            .limit(100); // Limit to last 100 messages for performance
        res.json(messages);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Mark message as read
export const markAsRead = async (req, res) => {
    try {
        const { id } = req.params;
        const message = await Message.findOneAndUpdate(
            { _id: id, userId: req.user.id },
            { read: true },
            { new: true }
        );
        if (!message) return res.status(404).json({ message: "Message not found" });
        res.json(message);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Mark all as read
export const markAllAsRead = async (req, res) => {
    try {
        await Message.updateMany(
            { userId: req.user.id, read: false },
            { read: true }
        );
        res.json({ success: true, message: "All messages marked as read" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Delete/Archive message
export const deleteMessage = async (req, res) => {
    try {
        const { id } = req.params;
        await Message.findOneAndUpdate(
            { _id: id, userId: req.user.id },
            { archived: true }
        );
        res.json({ success: true, message: "Message archived" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

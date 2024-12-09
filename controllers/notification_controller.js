// import model
const Notification = require('../models/notification_model');

// Lấy toàn bộ thông báo
const getAllNotifications = async (owner_id) => {
    try {
        const notifications = await Notification.find({ owner_id });
        return notifications;
    } catch (error) {
        throw new Error('Failed to fetch notifications: ' + error.message);
    }
};

module.exports = {
    showNotification: async (req, res) => {
        try {
            const owner_id = req.body.owner_id;
            const notifications = await getAllNotifications(owner_id);
            res.status(200).json(notifications);
        } catch (error) {
            res.status(500).json("Error: " + error.message);
        }
    },
};
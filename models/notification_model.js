const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
    owner_id: {
        type: Number,
        required: true
    },
    sender_id: {
        type: Number,
        required: true
    },
    message: {
        type: String,
        required: true
    },
    isRead: {
        type: Boolean,
        required: true,
    },
    timestamp: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Notification', notificationSchema);
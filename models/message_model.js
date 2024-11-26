const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
    room: {
        type: Number,
        required: true
    },
    sender: {
        type: String,
        required: true
    },
    message: { // có thể là text hoặc image
        type: String,
        required: false
    },
    imageURL: {
        type: String,
        required: false
    },
    timestamp: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Message', messageSchema);
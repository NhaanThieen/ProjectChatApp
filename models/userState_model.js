const mongoose = require('mongoose');

const userStateSchema = new mongoose.Schema({
    id: {
        type: Number,
        required: true
    },
    state: {
        type: Number,
        required: true
    }
}, {
    versionKey: false
});

module.exports = mongoose.model('userState', userStateSchema);
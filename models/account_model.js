// Quy định cấu trúc của account
const e = require('express');
const mongoose = require('mongoose');
const { type } = require('os');
const { stringify } = require('querystring');
const { setTheUsername } = require('whatwg-url');

// Định nghĩa cấu trúc cấu trúc của document (bản ghi) trong collection (bảng)

const accountSchema = new mongoose.Schema({
    id: {
        type: Number,
        unique: true // Đảm bảo id là duy nhất
    },
    username: {
        type: String,
        required: true,
        unique: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true
    }
}, {
    versionKey: false
});

// Tạo collection phụ để lưu giá trị id hiện tại
const counterSchema = new mongoose.Schema({
    name: { type: String, required: true },
    value: { type: Number, required: true }
});

const Counter = mongoose.model('Counter', counterSchema);

// Hàm pre-save hook để tự động tăng giá trị id
accountSchema.pre('save', async function (next) {
    const doc = this;

    if (doc.isNew) {
        const counter = await Counter.findOneAndUpdate(
            { name: 'accountId' },
            { $inc: { value: 1 } },
            { new: true, upsert: true } // Tạo mới nếu chưa có
        );
        doc.id = counter.value;
    }

    next();
});


// Tạo ra model để qản lý 1 bảng (collection) trong mongoDB
module.exports = mongoose.model('account', accountSchema);
// xuất ra để sử dụng ở các file khác

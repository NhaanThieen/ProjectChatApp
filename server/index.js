const express = require('express');
const http = require("http");
const { Server } = require('socket.io');
const cors = require('cors');
const crypto = require('crypto'); // Import để tạo tên file ngẫu nhiên
const fs = require('fs');
const path = require('path');
const connectDB = require('../configs/dataBase');
const port = 5000;
const app = express();
app.use(cors());
const accountModel = require('../models/account_model'); // Import model
const Message = require('../models/message_model'); // Import model
const Notification = require('../models/notification_model');
app.use(express.json()); // Thêm middleware này để phân tích cú pháp JSON
app.use('/uploads', express.static(path.join(__dirname, '..', 'imgStorage')));

// controllers
const { showNotification, deleteNotification } = require('../controllers/notification_controller');
const { displayAccount, login, logout, register } = require('../controllers/account_controller');
const { log } = require('console');
const { join } = require('path');

connectDB(); // Kết nối DB



// Lắng nghe request đăng ký và đăng nhập
app.post('/users/signup', register);
app.post('/users/signin', login);
// Lắng nghe request lấy thông tin tài khoản
app.get('/users/display', displayAccount);
app.post('/users/logout', logout);
// Lắng nghe request lấy thông báo
app.post('/users/notification', showNotification);
// Xóa thông báo khi người dùng đã xem
app.post('/users/notification/delete', deleteNotification);

const server = http.createServer(app);

const io = new Server(server, {
    cors: {
        // Địa chỉ của frontend
        origin: "http://localhost:3000",
        methods: ["GET", "POST"],
    },
});

io.on('connection', (socket) => {
    console.log("A user connected");
    socket.on('disconnect', () => {
        console.log("A user disconnected");
    });

    // Kết nối vào room và load tin nhắn cũ
    socket.on('join-room', async (data) => {
        console.log(data);
        var id_user_send = data.id_user_send;
        var id_user_current = data.id_user_current;
        var room = Number(id_user_send) + Number(id_user_current);
        socket.join(room);

        // Tìm kiếm dữ liệu trong room và sắp xếp theo thời gian, sau đó gửi dữ liệu về cho client
        const messages = await Message.find({ room }).sort({ timestamp: 1 });
        socket.emit('load-messages', messages);
    });


    // Nhận tin nhắn (message) từ user và gửi lại cho user khác
    socket.on('send-message', async (data) => {
        // Data bao gồm {
        //     id_user_send
        //     id_user_current
        //     message
        // }
        console.log(data);
        var room = Number(data.id_user_send) + Number(data.id_user_current);
        socket.to(room).emit('receive-message', data);
        io.emit('notification', "Bạn có tin nhắn mới");
        console.log(room);
        // Lưu tin nhắn vào MongoDB
        const newMessage = new Message({
            room,
            sender: data.id_user_current,
            message: data.message
        });
        await newMessage.save();

        // Xóa thông báo cũ có cùng owner_id và sender_id
        await Notification.deleteMany({
            owner_id: data.id_user_send,
            sender_id: data.id_user_current
        });

        // Lưu thông báo mới vào MongoDB
        const newNotification = new Notification({
            owner_id: data.id_user_send,
            sender_id: data.id_user_current,
            message: data.message,
            isRead: false
        });
        await newNotification.save();
    });

    // Nhận tin nhắn (img) từ user và gửi lại cho user khác
    socket.on('send-image', async (data) => {
        const { id_user_send, id_user_current, image } = data;
        var room = Number(data.id_user_send) + Number(data.id_user_current);

        // Tạo tên file ngẫu nhiên và đường dẫn lưu ảnh
        const fileName = `${crypto.randomUUID()}.png`; // Đặt tên file có định dạng PNG
        const filePath = path.join(__dirname, '..', 'imgStorage', fileName);

        // Lưu ảnh vào hệ thống file
        try {
            const base64Data = image.replace(/^data:image\/\w+;base64,/, ""); // Loại bỏ tiền tố base64
            fs.writeFileSync(filePath, base64Data, 'base64'); // Lưu file
            console.log('Image saved at:', filePath);

            // Tạo URL truy cập ảnh
            const imageURL = `http://localhost:${port}/uploads/${fileName}`;

            // Lưu URL vào MongoDB
            const newMessage = new Message({
                room,
                sender: id_user_current,
                message: 'image',
                imageURL, // Thêm URL ảnh vào database
            });
            await newMessage.save();

            // Lưu thông báo mới vào MongoDB
            const newNotification = new Notification({
                owner_id: data.id_user_send,
                sender_id: data.id_user_current,
                message: "Bạn có hình ảnh mới",
                isRead: false
            });
            await newNotification.save();

            // Gửi URL ảnh về cho client
            socket.to(room).emit('receive-image', { sender: id_user_current, imageURL });
            console.log('Image URL sent to room:', room);
            console.log('Image URL:', imageURL);
        } catch (err) {
            console.error('Error saving image:', err);
        }
    });

});

server.listen(port, () => {
    console.log(`Running server at port ${port}`);
});
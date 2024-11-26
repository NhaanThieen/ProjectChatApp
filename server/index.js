const express = require('express');
const http = require("http");
const { Server } = require('socket.io');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const connectDB = require('../configs/dataBase');
const port = 5000;
const app = express();
app.use(cors());
const accountModel = require('../models/account_model'); // Import model
const Message = require('../models/message_model'); // Import model

app.use(express.json()); // Thêm middleware này để phân tích cú pháp JSON
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));


const { displayAccount, login, register } = require('../controllers/account_controller');
const { log } = require('console');
const { join } = require('path');

connectDB(); // Kết nối DB



// Lắng nghe request đăng ký và đăng nhập
app.post('/users/signup', register);
app.post('/users/signin', login);
// Lắng nghe request lấy thông tin tài khoản
app.get('/users/display', displayAccount);


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
        console.log(data);
        var room = Number(data.id_user_send) + Number(data.id_user_current);
        socket.to(room).emit('receive-message', data);
        console.log(room);

        // Lưu tin nhắn vào MongoDB
        const newMessage = new Message({
            room,
            sender: data.id_user_current,
            message: data.message
        });
        await newMessage.save();
    });

    // Nhận tin nhắn (img) từ user và gửi lại cho user khác
    socket.on('send-image', async (data) => {
        const { id_user_send, id_user_current, image } = data;
        var room = Number(data.id_user_send) + Number(data.id_user_current);
        console.log('receive-image');

        // Giải mã base64 và lưu file vào folder "uploads"
        const buffer = Buffer.from(image, 'base64');
        const filename = `${Date.now()}_${id_user_current}.png`; // Tên file duy nhất
        const filepath = path.join(__dirname, 'uploads', filename);

        fs.writeFileSync(filepath, buffer); // Lưu file vào folder

        // Tạo URL để lưu vào MongoDB
        const imageUrl = `/uploads/${filename}`;

        // Gửi URL cho user trong room
        socket.to(room).emit('receive-image', {image: imageUrl });

        // Lưu URL vào MongoDB
        const newMessage = new Message({
            room,
            sender: id_user_current,
            message: imageUrl // Lưu URL thay vì dữ liệu base64
        });
        await newMessage.save();
    });

});

server.listen(port, () => {
    console.log(`Running server at port ${port}`);
});
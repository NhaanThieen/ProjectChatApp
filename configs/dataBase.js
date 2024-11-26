const mongoose = require('mongoose');

// Dùng hàm bất đồng bộ vì connect DB có thể bị delay
const connectDB = async () => {
    try {
        await mongoose.connect('mongodb://localhost:27017/chat', {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        console.log("Connect to database successfully");
    } catch (error) {
        console.log("Database connection failed:", error.message);
    }
};

module.exports = connectDB;
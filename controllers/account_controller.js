// Xử lý đăng ký, đăng nhập

// Import model
const accountModel = require('../models/account_model');

// Hàm để tự động tăng id
async function getNextId() {
    const lastAccount = await accountModel.findOne().sort({ id: -1 });
    return lastAccount ? lastAccount.id + 1 : 1;
}


// Xuất ra phương thức xử lý đăng ký và đăng nhập để sử dụng ở file routes/account_route.js
module.exports = {

    // tên: phương thức
    register: async (req, res) => {
        // Tự động gán giá trị cùng tên từ body vào biến
        const { username, password, email } = req.body;

        const id = await getNextId();
        
        const newAccount = new accountModel({
            id,
            username,
            password,
            email
        });

        newAccount.save()
            .then(() => {
                res.status(200).json("Account created!");
            })
            .catch((error) => {
                res.status(400).json("Error: " + error);
            });

        // Thêm vào danh sách userState
    },

    login: async (req, res) => {
        // Tự động gán giá trị cùng tên từ body vào biến
        const { email, password } = req.body;

        try {
            // Tìm tài khoản trong DB, trả về tài khoản trùng khớp hoặc null
            const account = await accountModel.findOne({ email, password });

            if (account) {
                res.status(200).json("login success!");
            } else {
                res.status(400).json("Login failed!");
            }
        } catch (error) {
            res.status(500).json("Error: " + error.message);
        }
    },

    displayAccount: async (req, res) => {
        try {
            const accounts = await accountModel.find();
            res.status(200).json(accounts);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }

};
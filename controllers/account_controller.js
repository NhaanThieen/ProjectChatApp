// Xử lý đăng ký, đăng nhập

const accountModel = require('../models/account_model'); // Import model
const bcrypt = require('bcryptjs'); // Import thư viện bcryptjs để mã hóa mật khẩu


// Xuất ra phương thức xử lý đăng ký và đăng nhập để sử dụng ở file routes/account_route.js
module.exports = {

    // tên: phương thức
    register: (req, res) => {
        // Tự động gán giá trị cùng tên từ body vào biến
        const { username, password, email } = req.body;

        const hashPassword = bcrypt.hashSync(password, 10); // Mã hóa mật khẩu trước khi lưu vào DB

        const newAccount = new accountModel({
            username,
            password: hashPassword, // Lưu mật khẩu đã mã hóa
            email,
            userstate: 0
        });

        newAccount.save()
            .then(() => {
                res.status(200).json("Account created!");
            })
            .catch((error) => {
                res.status(400).json("Error: " + error);
            });
    },

    login: async (req, res) => {
        // Tự động gán giá trị cùng tên từ body vào biến
        const { email, password } = req.body;

        try {
            // Tìm tài khoản trong DB
            const account = await accountModel.findOne({ email });

            if (account) {
                // So sánh mật khẩu nhập vào với mật khẩu trong DB
                // Phải dùng bcrypt.compare vì mật khẩu mã khóa luôn khác nhau dù nhập giống
                const isMatch = await bcrypt.compare(password, account.password);

                if (isMatch) {
                    account.userstate = 1;
                    account.save();
                    res.status(200).json(account);
                } else {
                    res.status(400).json("Login failed!");
                }
            } else {
                res.status(400).json("Login failed!");
            }
        } catch (error) {
            res.status(500).json("Error: " + error.message);
        }
    },

    logout: async (req, res) => {
        const {id_user_current} = req.body;
        const account = await accountModel.findOne({ id: id_user_current });
        if(account){
            account.userstate = 0;
            account.save();
            res.status(200).json("Logout success!");
        }
        else{
            res.status(400).json("Logout failed!");
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
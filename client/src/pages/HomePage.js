import io from "socket.io-client";
import { Container } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import Axios from "axios";
import './Home.css';
import { CiImageOn } from "react-icons/ci";
import { set } from "mongoose";

const connectDB = require('../dataBase');
connectDB();
const socket = io("http://localhost:5000");

function HomePage() {

  const navigate = useNavigate();
  // UseState để tự động render lại component khi giá trị thay đổi
  const [accounts, setAccounts] = useState([]);
  const [id_user_send, setIdUserSend] = useState('');
  const [id_user_current, setIdUserCurrent] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [infor_user_send, setInforUserSend] = useState('');
  // Lưu base64 của ảnh
  const [image, setImage] = useState();
  const [notificationStatus, setNotificationStatus] = useState(""); // 0 là chưa xem, 1 là đã xem

  /*/-------------------------------------------------------------------------------------------------------------------/*/

  // các hàm xử lý

  // Xử lý đăng xuất
  const handleLogout = () => {
    try {
      Axios.post('http://localhost:5000/users/logout', { id_user_current });
      localStorage.removeItem('username');
      localStorage.removeItem('email');
      localStorage.removeItem('id');
      setTimeout(() => { navigate("/") }, 500);
    } catch (error) {
      console.error("Failed to logout!", error);
    }
  };

  // Hiển thị danh sách user
  const showAccount = () => {
    Axios.get('http://localhost:5000/users/display')
      // Axios đã tự động parse chuỗi json thành mảng
      // Response chứa mảng danh sách các tài khoản
      .then((response) => {
        // Lọc các tài khoản không phải của người dùng hiện tại
        const filteredAccounts = response.data.filter(account => (account.username !== username && account.email !== email));
        setAccounts(filteredAccounts);
      })
      .catch((error) => {
        console.error("There was an error fetching the accounts!", error);
      });
  };

  const notificate = (data) => {
    if (data.id_user_send == id_user_current) {
      setNotificationStatus(0);
      const message = data.message.toString();
      const liElement = document.querySelector(`[data-id="${data.id_user_current}"]`);
      liElement.querySelector('.previewMessage').textContent = data.message;
    }
  };

  // Kết nối 2 user vào chung 1 room
  const handleAccountClick = async (id, infor_user_send) => {
    setIdUserSend(id);
    setInforUserSend(infor_user_send);
    socket.emit('join-room', { id_user_send: id, id_user_current: id_user_current });
  };

  /*/-------------------------------------------------------------------------------------------------------------------/*/

  // Các hàm chạy khi component được render

  // Chỉ chạy 1 lần khi component được render
  // Lưu thông tin user hiện tại
  useEffect(() => {
    setUsername(localStorage.getItem('username'));
    setEmail(localStorage.getItem('email'));
    setIdUserCurrent(localStorage.getItem('id'));
    // Xử lý khi người dùng nhận được tin nhắn
  }, []);

  // Chạy liên tục
  useEffect(() => {

    // Hiển thị danh sách user
    showAccount();

    // Lắng nghe sự kiện từ server để nhận tin nhắn (message)
    socket.on('receive-message', handleReceiveMessage);

    // Lắng nghe sự kiện từ server để nhận tin nhắn (img)
    socket.on('receive-image', handleReceiveImage);

    socket.on('notification', notificate);

    return () => {
      // Xóa event listener khi component bị unmount (Bị gỡ khỏi cây DOM)
      socket.off('receive-message', handleReceiveMessage);
      socket.off('receive-image', handleReceiveImage);
      socket.off('notification', notificate);
    };
  });

  useEffect(() => {
    if (id_user_send) {
      // Lắng nghe sự kiện load-messages từ server
      const handleLoadMessages = (messages) => {
        const messageContainer = document.querySelector('.messages');
        messageContainer.innerHTML = ""; // Xóa các tin nhắn cũ trước khi hiển thị mới
        messages.forEach((msg) => {
          // Nếu tin nhắn phải là ảnh (không có imageURL) thì hiển thị text
          if (!msg.imageURL) {
            const newMessage = document.createElement('li');
            const finalMessage = document.createElement('p');
            newMessage.classList.add(msg.sender === id_user_current ? 'Send-message' : 'Receive-message');
            finalMessage.textContent = msg.message;
            newMessage.appendChild(finalMessage);
            messageContainer.appendChild(newMessage);
          }
          // Ngược lại, hiển thị ảnh
          else {
            const newMessage = document.createElement('li');
            const newImg = document.createElement('div');
            const finalImg = document.createElement('img');
            newMessage.classList.add(msg.sender === id_user_current ? 'Send-message' : 'Receive-message');
            newImg.classList.add('Send-image');
            finalImg.src = msg.imageURL;
            newMessage.appendChild(newImg);
            newImg.appendChild(finalImg);
            messageContainer.appendChild(newMessage);
          }
          messageContainer.scrollTop = messageContainer.scrollHeight;
        });

      };

      socket.on('load-messages', handleLoadMessages);

      return () => {
        // Xóa listener cũ khi id_user_send thay đổi
        socket.off('load-messages', handleLoadMessages);
      };
    }
  }, [id_user_send]); // Chạy lại khi id_user_send hoặc id_user_current thay đổi



  /*/-------------------------------------------------------------------------------------------------------------------/*/


  // Hiển thị tin nhắn đã gửi và gửi tin nhắn lên server
  const handleSendMessage = (event) => {
    if (event.key === 'Enter') {
      const text = event.target.value;
      if (text === '') return;
      if (id_user_send === '') return;
      setMessage(text);
      const messageContainer = document.querySelector('.messages');
      const newMessage = document.createElement('li');
      const finalMessage = document.createElement('p');
      newMessage.classList.add('Send-message');
      finalMessage.textContent = text;
      messageContainer.appendChild(newMessage);
      newMessage.appendChild(finalMessage);
      messageContainer.scrollTop = messageContainer.scrollHeight;
      socket.emit('send-message', {
        id_user_send: id_user_send,
        id_user_current: id_user_current,
        message: text
      });
      event.target.value = '';
    }
  };

  // Nhận tin nhắn (message) từ server và hiển thị
  const handleReceiveMessage = (data) => {
    const messageContainer = document.querySelector('.messages');
    const newMessage = document.createElement('li');
    const finalMessage = document.createElement('p');
    newMessage.classList.add('Receive-message');
    finalMessage.textContent = data.message;

    messageContainer.appendChild(newMessage);
    newMessage.appendChild(finalMessage);

    messageContainer.scrollTop = messageContainer.scrollHeight;
  };

  /*/-------------------------------------------------------------------------------------------------------------------/*/


  // Xóa ảnh
  const handleRemoveImage = () => {
    setImage(null);
  };

  // Giảm chất lượng ảnh để giảm dung lượng để gửi lên server
  const resizeImage = (file, maxWidth, maxHeight, quality = 0.7) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      // Đọc file ảnh
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          // Tạo canvas để chỉnh kích thước ảnh
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');

          // Tính toán tỉ lệ để giữ nguyên khung hình
          let width = img.width;
          let height = img.height;

          if (width > maxWidth || height > maxHeight) {
            const ratio = Math.min(maxWidth / width, maxHeight / height);
            width = Math.round(width * ratio);
            height = Math.round(height * ratio);
          }

          // Cập nhật kích thước canvas
          canvas.width = width;
          canvas.height = height;

          // Vẽ ảnh lên canvas
          ctx.drawImage(img, 0, 0, width, height);

          // Chuyển canvas thành base64 với chất lượng nén
          const resizedImage = canvas.toDataURL('image/jpeg', quality);
          resolve(resizedImage);
        };

        img.onerror = () => {
          reject(new Error('Failed to process image.'));
        };

        img.src = event.target.result;
      };

      reader.onerror = () => {
        reject(new Error('Failed to read file.'));
      };

      reader.readAsDataURL(file);
    });
  };

  // Hiện hộp thoại chọn ảnh
  const handleImportImg = async () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    // Hiển thị hộp thoại chọn ảnh
    input.click();
    // Khi ảnh được chọn, sử dụng file để hứng ảnh
    input.onchange = async (event) => {
      // File lúc này là object chứa thông tin của file ảnh
      const file = event.target.files[0];
      if (file) {
        try {
          // Giảm kích thước ảnh (500x500 là kích thước tối đa, chất lượng 70%)
          const compressedImage = await resizeImage(file, 500, 500, 0.7);
          setImage(compressedImage);
          // Tạo một FileReader để đọc file ảnh
          const reader = new FileReader();
          reader.readAsDataURL(compressedImage);
        } catch (error) {
          console.error('Failed to process image.', error);
        }
      };
    }
  }

  // Hiển thị ảnh được import và gửi ảnh lên server
  const handleSendImage = (event) => {
    if (event.key === 'Enter') {
      if (!image) return;
      if (id_user_send === '') return;


      const messageContainer = document.querySelector('.messages');
      const newMessage = document.createElement('li');
      const newImg = document.createElement('div');
      const finalImg = document.createElement('img');
      newMessage.classList.add('Send-message');
      newImg.classList.add('Send-image');
      finalImg.src = image;

      messageContainer.appendChild(newMessage);
      newMessage.appendChild(newImg);
      newImg.appendChild(finalImg);
      messageContainer.scrollTop = messageContainer.scrollHeight;

      socket.emit('send-image', {
        id_user_send: id_user_send,
        id_user_current: id_user_current,
        image: image
      });
      if (event.target.value !== '') {
        handleSendMessage(event);
      }
      handleRemoveImage();
    }
  };

  // Nhận tin nhắn (img) từ server và hiển thị
  const handleReceiveImage = (data) => {
    const messageContainer = document.querySelector('.messages');
    const newMessage = document.createElement('li');
    const newImg = document.createElement('div');
    const finalImg = document.createElement('img');
    finalImg.src = data.imageURL;
    newMessage.classList.add('Receive-message');
    newImg.classList.add('Send-image');


    messageContainer.appendChild(newMessage);
    newMessage.appendChild(newImg);
    newImg.appendChild(finalImg);

    messageContainer.scrollTop = messageContainer.scrollHeight;
  };

  return (
    <Container id='main-container' className='d-grid h-100'>
      <div className='left-rectangle'>
        <div className="infor_user_current">
          <button className="logout" onClick={handleLogout}>Logout</button>
          <h2>User: {username}</h2>
          <p>Email: {email}</p>
        </div>
        <h2>Accounts</h2>
        <div className="accounts-display">
          <ul className='account-display'>
            {/* Với mỗi account được duyệt qua, hàm callBack sẽ được gọi để tạo li tương ứng */}
            {accounts.map((account) => (
              <li className="accountShow" key={account.id} data-id={account.id} onClick={() => handleAccountClick(account.id, account.username)}>
                <p>{account.username}</p>
                {notificationStatus === 0 && <p className="previewMessage"></p>}
                {account.userstate === 1 && <div className="isOnline"></div>}
              </li>
            ))}
          </ul>
        </div>
      </div>
      <div className='right-rectangle'>
        <div className="infor_user_send">
          <h2>{infor_user_send}</h2>
        </div>
        <div className='messageContainer'>
          <ul className='messages'>
            {

            }
          </ul>
        </div>

        <div className="text-box">
          <div className="img_import"><CiImageOn size={40} onClick={handleImportImg} /></div>
          <div className="input-container">
            <div className="img-preview">
              {/* Sẽ hiển thị nếu như img có giá trị */}
              {image && <img src={image} alt="Uploaded" />}
              {image && <button className="remove-img-btn" onClick={handleRemoveImage}>X</button>}
            </div>
            <input
              type="text"
              placeholder="Text a message"
              onKeyDown={image ? handleSendImage : handleSendMessage}
            />
          </div>
        </div>

      </div>
    </Container>
  );
}

export default HomePage;
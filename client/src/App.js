import { Container, Form, Button } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { ToastContainer, toast } from 'react-toastify';
import "react-toastify/dist/ReactToastify.css";
import Axios from "axios";
import './App.css';


function App() {
  const [password, setPass] = useState('');
  const [username, setUsername] = useState('');
  const [email, setMail] = useState('');
  const navigate = useNavigate();

  const passwordSet = event => {
    const newPassword = event.target.value;
    setPass(newPassword);
  }

  const usernameSet = event => {
    const newUsername = event.target.value;
    setUsername(newUsername);
  }

  const emailSet = event => {
    const newEmail = event.target.value;
    setMail(newEmail);
  }

  const RegisterSubmit = (event) => {
    event.preventDefault();
    Axios.post("http://localhost:5000/users/signup", {
      password,
      username,
      email
    }).then((response) => {
      toast.success("You have successfully registered!", {
        position: "top-right",
        autoClose: 800,
        hideProgressBar: true,
        closeOnClick: true,
        pauseOnHover: false,
        draggable: true,
        progress: undefined,
        theme: "light",
      });
      console.log("success!");
      setTimeout(() => { navigate("/login") }, 1200);
    }).catch((error) => {
      console.log("error!");
      toast.error("Registration failed!", {
        position: "top-right",
        autoClose: 800,
        hideProgressBar: true,
        closeOnClick: true,
        pauseOnHover: false,
        draggable: true,
        progress: undefined,
        theme: "light",
      });
    });
  }

  return (
    <Container id='main-container' className='d-grid h-100'>
      <div id='c-fix-div'>
        <Form id='register-form' className='text-center w-100 form-bg' onSubmit={RegisterSubmit}>
          <img className='mb-4 app-logo'
            src='https://ou.edu.vn/wp-content/uploads/2016/08/Logo.png'
            alt='App Logo' />
          <h1 className='mb-4 fs-3 fw-normal biggerText'>Please sign up</h1>
          <Form.Group controlId='sign-in-email-address'>
            <Form.Control onChange={emailSet} value={email} required type='email' size='lg' placeholder='Email' autoComplete='username' className='mb-1 position-relative formInput'></Form.Control>
          </Form.Group>
          <Form.Group controlId='sign-in-username'>
            <Form.Control onChange={usernameSet} value={username} required type='username' size='lg' placeholder='Username' autoComplete='username' className='mb-1 position-relative formInput'></Form.Control>
          </Form.Group>
          <Form.Group controlId='sign-in-password' className='mb-3'>
            <Form.Control onChange={passwordSet} value={password} required type='password' size='lg' placeholder='Password' autoComplete='current-password' className='mb-2 position-relative formInput'></Form.Control>
          </Form.Group>
          <div className='d-grid'>
            <Button variant='primary' size='lg' type='submit'>Sign Up</Button>
          </div>
          <Link className='mb-2 position-relative linkText' to="/login">Do you have an account?</Link>
          <p className='mt-4 littleText'>&copy; 2024-2025 ChatAppReact</p>
        </Form>
        <ToastContainer toastStyle={{ backgroundColor: "#ffffff1a", color: "#424242" }} limit={3} className="toast-C" />
      </div>
    </Container>
  )
}

export default App;
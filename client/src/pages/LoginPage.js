import { Container, Form, Button } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import { ToastContainer, toast } from 'react-toastify';
import "react-toastify/dist/ReactToastify.css";
import { useState } from 'react';
import Axios from "axios";
import './Login.css';

function LoginPage() {
  const navigate = useNavigate();
  const [password, setPass] = useState('');
  const [email, setMail] = useState('');

  const passwordSet = event => {
    const newPassword = event.target.value;
    setPass(newPassword);
  }

  const emailSet = event => {
    const newEmail = event.target.value;
    setMail(newEmail);
  }

  const LoginSubmit = (event) => {
    event.preventDefault();
    Axios.post("http://localhost:5000/users/signin", {
      password,
      email
    }).then((response) => {

      localStorage.setItem('username', response.data.username);
      localStorage.setItem('email', email);
      localStorage.setItem('id', response.data.id);

      toast.success("You have successfully logged in!", {
        position: "top-right",
        autoClose: 800,
        hideProgressBar: true,
        closeOnClick: true,
        pauseOnHover: false,
        draggable: true,
        progress: undefined,
        theme: "light",
      });
      setTimeout(() => { navigate("/home") }, 1200);
    }).catch((error) => {
      console.log("error!");
      toast.error("Login failed!", {
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
      <div>
        <ToastContainer toastStyle={{ backgroundColor: "#ffffff1a", color: "#424242" }} limit={3} className="toast-C" />
        <Form id='register-form' className='text-center w-100 form-bg' onSubmit={LoginSubmit}>
          <img className='mb-4 app-logo'
            src='https://ou.edu.vn/wp-content/uploads/2016/08/Logo.png'
            alt='App Logo' />
          <h1 className='mb-4 fs-3 fw-normal biggerText'>Please sign in</h1>
          <Form.Group controlId='sign-in-email-address'>
            <Form.Control onChange={emailSet} value={email} required type='email' size='lg' placeholder='Email' autoComplete='username' className='mb-1 position-relative formInput'></Form.Control>
          </Form.Group>
          <Form.Group controlId='sign-in-password' className='mb-3'>
            <Form.Control onChange={passwordSet} value={password} required type='password' size='lg' placeholder='Password' autoComplete='current-password' className='mb-2 position-relative formInput'></Form.Control>
          </Form.Group>
          <div className='d-grid'>
            <Button variant='primary' size='lg' type='submit'>Sign In</Button>
          </div>
          <Link className='mb-2 position-relative linkText' to="/">Don't have an account?</Link>
          <p className='mt-4 littleText'>&copy; 2024-2025 ChatAppReact</p>
        </Form>
      </div>
    </Container>
  )
}

export default LoginPage;
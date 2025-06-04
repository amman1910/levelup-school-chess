
import React, { useState } from 'react';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import { db } from '../firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import './Login.css';
import chessLogo from './chessLogo.png';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }

    const auth = getAuth();

    try {
      setLoading(true);
      
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      console.log("User logged in:", user);

      try {
        const usersRef = collection(db, "users");
        const q = query(usersRef, where("email", "==", email));
        const querySnapshot = await getDocs(q);
        
        if (!querySnapshot.empty) {
          const userDoc = querySnapshot.docs[0];
          const userData = userDoc.data();
          
          localStorage.setItem('user', JSON.stringify({
            uid: userDoc.id,
            email: user.email,
            role: userData.role,
            firstLogin: userData.firstLogin
          }));
          
          console.log("User data saved:", {
            uid: userDoc.id,
            email: user.email,
            role: userData.role,
            firstLogin: userData.firstLogin
          });
          
          if (userData.role === "admin") {
            navigate('/admin-area');
          } else if (userData.role === "trainer") {
            if (userData.firstLogin === true) {
              navigate('/change-initial-password');
            } else {
              navigate('/trainer-area');
            }
          } else {
            setError('Unrecognized user role');
            setLoading(false);
          }
        } else {
          setError('User does not exist in the system');
          setLoading(false);
        }
      } catch (dbError) {
        console.error("Database error:", dbError);
        setError('Error accessing database');
        setLoading(false);
      }
      
    } catch (err) {
      console.error("Login error:", err.message);
      setError('Invalid login credentials');
      setLoading(false);
    }
  };

  // Function to navigate to ForgotPassword route
  const handleForgotPassword = () => {
    navigate('/forgot-password');
  };

  return (
    <div className="login-container">
      <div className="login-form-wrapper">
        <div className="chess-decoration decoration-1"></div>
        <div className="chess-decoration decoration-2"></div>
        
        <div className="logo-area">
          <img src={chessLogo} alt="Chess Logo" />
          <h1>Chess Club Management System</h1>
        </div>
        
        <div className="login-form">
          <h2>Login to your account</h2>
          {error && <div className="error-message">{error}</div>}
          <form onSubmit={handleLogin}>
            <div className="form-group">
              <label htmlFor="email">Email:</label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                required
                disabled={loading}
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="password">Password:</label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                required
                disabled={loading}
              />
            </div>

            <button type="submit" className="login-button" disabled={loading}>
              {loading ? 'Connecting...' : 'Login'}
            </button>
          </form>

          {/* Forgot Password Button */}
          <button 
            type="button" 
            className="forgot-password-button" 
            onClick={handleForgotPassword}
            disabled={loading}
          >
            Forgot Password?
          </button>
        </div>
      </div>
    </div>
  );
};

export default Login;
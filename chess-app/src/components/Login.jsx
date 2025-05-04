import React, { useState } from 'react';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import { db } from '../firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import './Login.css';
// Import the logo - add the correct path to your logo file
// For example: import chessLogo from '../assets/chess-logo.png';
import chessLogo from './chessLogo.png'; // Update this path as necessary

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

      // Check user role from database
      try {
        // Search by email in users collection
        const usersRef = collection(db, "users");
        const q = query(usersRef, where("email", "==", email));
        const querySnapshot = await getDocs(q);
        
        if (!querySnapshot.empty) {
          // If a user with this email is found
          const userDoc = querySnapshot.docs[0];
          const userData = userDoc.data();
          
          // Save user details in local storage
          localStorage.setItem('user', JSON.stringify({
            uid: user.uid,
            email: user.email,
            role: userData.role
          }));
          
          // Navigate based on role
          if (userData.role === "admin") {
            navigate('/admin-area');
          } else if (userData.role === "trainer") {
            navigate('/trainer-area');
          } else {
            // If role is not recognized
            setError('Unrecognized user role');
            setLoading(false);
          }
        } else {
          // If no user with this email is found
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

  return (
    <div className="login-container">
      <div className="login-form-wrapper">
        {/* Decorative elements */}
        <div className="chess-decoration decoration-1"></div>
        <div className="chess-decoration decoration-2"></div>
        
        {/* Logo area */}
        <div className="logo-area">
          {/* Add the logo here */}
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
        </div>
      </div>
    </div>
  );
};

export default Login;
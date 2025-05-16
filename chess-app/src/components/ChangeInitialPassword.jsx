import React, { useState, useEffect } from 'react';
import { getAuth, updatePassword, reauthenticateWithCredential, EmailAuthProvider } from 'firebase/auth';
import { db } from '../firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import './ChangeInitialPassword.css';
import chessLogo from './chessLogo.png'; // Make sure this path matches your actual logo path

const ChangeInitialPassword = () => {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  // Add protection similar to TrainerArea
  useEffect(() => {
    const loggedInUser = localStorage.getItem('user');
    if (!loggedInUser) {
      // User is not logged in, redirect to login page
      navigate('/login');
      return;
    }
    
    const userData = JSON.parse(loggedInUser);
    
    // Verify if it's the user's first login
    if (!userData.firstLogin) {
      // User has already changed their initial password, redirect to their area
      if (userData.role === 'trainer') {
        navigate('/trainer-area');
      } else if (userData.role === 'admin') {
        navigate('/admin-area');
      } else {
        navigate('/login');
      }
      return;
    }
    
    setUser(userData);
  }, [navigate]);

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setError('');
    
    // Validate passwords
    if (!currentPassword || !newPassword || !confirmPassword) {
      setError('Please fill in all fields');
      return;
    }

    if (newPassword.length < 6) {
      setError('Password must contain at least 6 characters');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    try {
      setLoading(true);
      
      // Get current authenticated user
      const auth = getAuth();
      const user = auth.currentUser;
      
      if (!user) {
        setError('No logged-in user found. Please log in again');
        setLoading(false);
        return;
      }

      // Re-authenticate user before changing password
      try {
        const credential = EmailAuthProvider.credential(
          user.email,
          currentPassword
        );
        
        await reauthenticateWithCredential(user, credential);
        
        // Now update the password
        await updatePassword(user, newPassword);
        
        console.log("Password updated successfully in Firebase Auth");
        
        // Get user data from localStorage
        const userData = JSON.parse(localStorage.getItem('user'));
        
        // Update firstLogin field in Firestore to false
        if (userData && userData.uid) {
          const userRef = doc(db, "users", userData.uid);
          await updateDoc(userRef, {
            firstLogin: false
          });
          console.log("FirstLogin updated successfully in Firestore");
            
          // Update localStorage to reflect the change
          localStorage.setItem('user', JSON.stringify({
            ...userData,
            firstLogin: false
          }));
            
          setSuccess(true);
            
          // Redirect to appropriate area after 2 seconds based on user role
          setTimeout(() => {
            if (userData.role === 'trainer') {
              navigate('/trainer-area');
            } else if (userData.role === 'admin') {
              navigate('/admin-area');
            } else {
              navigate('/login');
            }
          }, 2000);
        } else {
          setError('User data not found. Please log in again.');
          setLoading(false);
        }
        
      } catch (reauthError) {
        console.error("Re-authentication error:", reauthError);
        setError('Current password is incorrect');
        setLoading(false);
      }
      
    } catch (err) {
      console.error("Password update error:", err);
      setError('An error occurred while updating password. Please try again');
      setLoading(false);
    }
  };

  // If user is not set (will be null during the redirect), show loading
  if (!user) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <div className="change-password-container">
      <div className="change-password-form-wrapper">
        {/* Decorative elements */}
        <div className="chess-decoration decoration-1"></div>
        <div className="chess-decoration decoration-2"></div>
        
        {/* Logo area */}
        <div className="logo-area">
          <img src={chessLogo} alt="Chess Logo" />
          <h1>Chess Club Management System</h1>
        </div>
        
        <div className="change-password-form">
          <h2>Update Initial Password</h2>
          {error && <div className="error-message">{error}</div>}
          {success && <div className="success-message">Password updated successfully! Redirecting to personal area...</div>}
          
          <form onSubmit={handleChangePassword}>
            <div className="form-group">
              <label htmlFor="currentPassword">Current Password:</label>
              <input
                type="password"
                id="currentPassword"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Enter your current password"
                required
                disabled={loading || success}
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="newPassword">New Password:</label>
              <input
                type="password"
                id="newPassword"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter new password"
                required
                disabled={loading || success}
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="confirmPassword">Confirm Password:</label>
              <input
                type="password"
                id="confirmPassword"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Enter new password again"
                required
                disabled={loading || success}
              />
            </div>

            <button type="submit" className="change-password-button" disabled={loading || success}>
              {loading ? 'Updating...' : 'Update Password'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ChangeInitialPassword;
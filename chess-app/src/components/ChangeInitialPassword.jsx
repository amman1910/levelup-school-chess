import React, { useState, useEffect } from 'react';
import { getAuth, updatePassword, reauthenticateWithCredential, EmailAuthProvider } from 'firebase/auth';
import { db } from '../firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import './ChangeInitialPassword.css';
import chessLogo from './chessLogo.png';

const ChangeInitialPassword = () => {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  // Redirect user if already logged in and password is not the initial one
  useEffect(() => {
    const loggedInUser = localStorage.getItem('user');
    if (!loggedInUser) {
      navigate('/login');
      return;
    }

    const userData = JSON.parse(loggedInUser);

    if (!userData.firstLogin) {
      // User already changed password, redirect according to their role
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

    // Basic validation
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
      const auth = getAuth();
      const user = auth.currentUser;

      if (!user) {
        setError('No logged-in user found. Please log in again');
        setLoading(false);
        return;
      }

      try {
        // Re-authenticate user with current password
        const credential = EmailAuthProvider.credential(user.email, currentPassword);
        await reauthenticateWithCredential(user, credential);

        // Update password in Firebase Authentication
        await updatePassword(user, newPassword);

        // Retrieve user data from localStorage
        const userData = JSON.parse(localStorage.getItem('user'));

        // Update firstLogin flag in Firestore
        if (userData && userData.uid) {
          const userRef = doc(db, "users", userData.uid);
          await updateDoc(userRef, {
            firstLogin: false
          });

          // Update user data in localStorage
          localStorage.setItem('user', JSON.stringify({
            ...userData,
            firstLogin: false
          }));

          setSuccess(true);

          // Redirect user to personal area based on role
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
        setError('Current password is incorrect');
        setLoading(false);
      }

    } catch (err) {
      setError('An error occurred while updating password. Please try again');
      setLoading(false);
    }
  };

  if (!user) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <div className="change-password-container">
      <div className="change-password-form-wrapper">
        {/* Decorative circles */}
        <div className="chess-decoration decoration-1"></div>
        <div className="chess-decoration decoration-2"></div>

        {/* Header and logo */}
        <div className="logo-area">
          <img src={chessLogo} alt="Chess Logo" />
          <h1>Chess Club Management System</h1>
        </div>

        {/* Form */}
        <div className="change-password-form">
          <h2>Update Initial Password</h2>
          {error && <div className="error-message">{error}</div>}
          {success && (
            <div className="success-message">
              Password updated successfully! Redirecting to personal area...
            </div>
          )}

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

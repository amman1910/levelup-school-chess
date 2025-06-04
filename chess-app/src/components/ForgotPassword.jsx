import React, { useState } from 'react';
import { 
  getAuth, 
  sendPasswordResetEmail, 
  confirmPasswordReset,
  verifyPasswordResetCode
} from 'firebase/auth';
import { useNavigate, useSearchParams } from 'react-router-dom';
import './ForgotPassword.css';
import chessLogo from './chessLogo.png';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [step, setStep] = useState('email'); // 'email' or 'reset'
  const [verificationSent, setVerificationSent] = useState(false);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Check if we have a reset code from email link
  React.useEffect(() => {
    const mode = searchParams.get('mode');
    const oobCode = searchParams.get('oobCode');
    
    if (mode === 'resetPassword' && oobCode) {
      // User clicked the email link, verify the code and switch to password reset step
      handleVerifyResetCode(oobCode);
    }
  }, [searchParams]);

  const handleVerifyResetCode = async (code) => {
    try {
      const auth = getAuth();
      // Verify the password reset code is valid
      const email = await verifyPasswordResetCode(auth, code);
      setEmail(email);
      setStep('reset');
      setSuccess(true);
    } catch (error) {
      console.error('Invalid or expired reset code:', error);
      setError('Invalid or expired reset link. Please request a new one.');
    }
  };

  const handleSendVerification = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess(false);
    
    console.log('Starting email verification process...');
    
    // Validation
    if (!email) {
      setError('Please enter your email address');
      return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Please enter a valid email address');
      return;
    }

    try {
      setLoading(true);
      
      // Send password reset email directly - Firebase Auth will handle user existence check
      console.log('Sending password reset email...');
      const auth = getAuth();
      await sendPasswordResetEmail(auth, email);
      
      console.log('Password reset email sent successfully');
      setVerificationSent(true);
      setSuccess(true);
      
    } catch (error) {
      console.error('Error sending verification email:', error);
      console.error('Error code:', error.code);
      console.error('Error message:', error.message);
      
      if (error.code === 'auth/user-not-found') {
        setError('No account found with this email address');
      } else if (error.code === 'auth/invalid-email') {
        setError('Invalid email address');
      } else if (error.code === 'auth/too-many-requests') {
        setError('Too many requests. Please try again later');
      } else {
        setError(`Failed to send verification email: ${error.message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordReset = async (e) => {
    e.preventDefault();
    setError('');
    
    console.log('Starting password reset process...');
    
    // Validation
    if (!newPassword || !confirmPassword) {
      setError('Please fill in all fields');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }

    try {
      setLoading(true);
      const auth = getAuth();
      const oobCode = searchParams.get('oobCode');
      
      if (!oobCode) {
        setError('Invalid reset link. Please request a new password reset.');
        return;
      }

      // Reset the password using the code from the email
      await confirmPasswordReset(auth, oobCode, newPassword);
      
      console.log('Password reset successfully');
      setSuccess(true);
      
      // Redirect to login after 3 seconds
      setTimeout(() => {
        navigate('/login');
      }, 3000);
      
    } catch (error) {
      console.error('Error resetting password:', error);
      console.error('Error code:', error.code);
      console.error('Error message:', error.message);
      
      if (error.code === 'auth/invalid-action-code') {
        setError('Invalid or expired reset link. Please request a new one.');
      } else if (error.code === 'auth/expired-action-code') {
        setError('Reset link has expired. Please request a new one.');
      } else if (error.code === 'auth/weak-password') {
        setError('Password is too weak. Please choose a stronger password.');
      } else {
        setError(`Failed to reset password: ${error.message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleBackToLogin = () => {
    navigate('/login');
  };

  const handleRequestNewLink = () => {
    setStep('email');
    setVerificationSent(false);
    setSuccess(false);
    setError('');
  };

  return (
    <div className="change-password-container">
      <div className="change-password-form-wrapper">
        <div className="chess-decoration decoration-1"></div>
        <div className="chess-decoration decoration-2"></div>
        
        <div className="logo-area">
          <img src={chessLogo} alt="Chess Logo" />
          <h1>Chess Club Management System</h1>
        </div>
        
        <div className="change-password-form">
          {step === 'email' ? (
            <>
              <h2>Reset Your Password</h2>
              
              {error && <div className="error-message">{error}</div>}
              {verificationSent && (
                <div className="success-message">
                  Password reset email sent successfully! Please check your email and click the reset link.
                </div>
              )}
              
              <form onSubmit={handleSendVerification}>
                <div className="form-group">
                  <label htmlFor="email">Email Address:</label>
                  <input
                    type="email"
                    id="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email address"
                    required
                    disabled={loading || verificationSent}
                  />
                </div>

                <button 
                  type="submit" 
                  className="change-password-button" 
                  disabled={loading || verificationSent}
                >
                  {loading ? 'Sending...' : 'Send Verification Email'}
                </button>
              </form>

              {verificationSent && (
                <button 
                  type="button" 
                  className="back-button" 
                  onClick={handleRequestNewLink}
                  style={{ marginTop: '10px' }}
                >
                  Send Another Email
                </button>
              )}

              <button 
                type="button" 
                className="back-button" 
                onClick={handleBackToLogin}
                disabled={loading}
              >
                Back to Login
              </button>
            </>
          ) : (
            <>
              <h2>Set New Password</h2>
              <p style={{ textAlign: 'center', marginBottom: '20px', color: '#666' }}>
                Enter your new password for: <strong>{email}</strong>
              </p>
              
              {error && <div className="error-message">{error}</div>}
              {success && step === 'reset' && !error && (
                <div className="success-message">
                  Password reset successfully! Redirecting to login...
                </div>
              )}
              
              <form onSubmit={handlePasswordReset}>
                <div className="form-group">
                  <label htmlFor="newPassword">New Password:</label>
                  <input
                    type="password"
                    id="newPassword"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter new password (min 6 characters)"
                    required
                    disabled={loading || success}
                    minLength="6"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="confirmPassword">Confirm New Password:</label>
                  <input
                    type="password"
                    id="confirmPassword"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm new password"
                    required
                    disabled={loading || success}
                    minLength="6"
                  />
                </div>

                <button 
                  type="submit" 
                  className="change-password-button" 
                  disabled={loading || success}
                >
                  {loading ? 'Updating Password...' : 'Update Password'}
                </button>
              </form>

              <button 
                type="button" 
                className="back-button" 
                onClick={handleBackToLogin}
                disabled={loading}
              >
                Back to Login
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
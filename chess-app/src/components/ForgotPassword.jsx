import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next'; // הוספת useTranslation
import { 
  getAuth, 
  sendPasswordResetEmail, 
  confirmPasswordReset,
  verifyPasswordResetCode
} from 'firebase/auth';
import { useNavigate, useSearchParams } from 'react-router-dom';
import LanguageSwitcher from './LanguageSwitcher'; // הוספת מתג השפות
import './ForgotPassword.css';
import chessLogo from './chessLogo.png';

const ForgotPassword = () => {
  const { t, i18n } = useTranslation(); // הוספת hook לתרגום
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

  // הגדרת שפה בהתחלה לפי פרמטר מה-URL
  useEffect(() => {
    const langFromUrl = searchParams.get('lang');
    const savedLanguage = localStorage.getItem('i18nextLng');
    
    if (langFromUrl) {
      // אם יש פרמטר שפה ב-URL, השתמש בו
      i18n.changeLanguage(langFromUrl);
    } else if (savedLanguage && savedLanguage !== i18n.language) {
      // אחרת, השתמש בשפה השמורה
      i18n.changeLanguage(savedLanguage);
    } else {
      // ברירת מחדל - ערבית (כמו ב-Login)
      i18n.changeLanguage('ar');
    }
  }, [i18n, searchParams]);

  // Check if we have a reset code from email link
  useEffect(() => {
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
      setError(t('forgotPassword.invalidResetLink'));
    }
  };

  const handleSendVerification = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess(false);
    
    console.log('Starting email verification process...');
    
    // Validation
    if (!email) {
      setError(t('forgotPassword.enterEmail'));
      return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError(t('forgotPassword.validEmail'));
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
        setError(t('forgotPassword.userNotFound'));
      } else if (error.code === 'auth/invalid-email') {
        setError(t('forgotPassword.invalidEmail'));
      } else if (error.code === 'auth/too-many-requests') {
        setError(t('forgotPassword.tooManyRequests'));
      } else {
        setError(`${t('forgotPassword.failedToSend')}: ${error.message}`);
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
      setError(t('forgotPassword.fillAllFields'));
      return;
    }

    if (newPassword !== confirmPassword) {
      setError(t('forgotPassword.passwordsNotMatch'));
      return;
    }

    if (newPassword.length < 6) {
      setError(t('forgotPassword.passwordMinLength'));
      return;
    }

    try {
      setLoading(true);
      const auth = getAuth();
      const oobCode = searchParams.get('oobCode');
      
      if (!oobCode) {
        setError(t('forgotPassword.invalidResetLink'));
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
        setError(t('forgotPassword.invalidResetCode'));
      } else if (error.code === 'auth/expired-action-code') {
        setError(t('forgotPassword.expiredResetCode'));
      } else if (error.code === 'auth/weak-password') {
        setError(t('forgotPassword.weakPassword'));
      } else {
        setError(`${t('forgotPassword.failedToReset')}: ${error.message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleBackToLogin = () => {
    const currentLanguage = i18n.language;
    navigate(`/login?lang=${currentLanguage}`);
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
        
        {/* הוספת מתג השפות */}
        <div className="forgot-password-language-switcher">
          <LanguageSwitcher />
        </div>
        
        <div className="logo-area">
          <img src={chessLogo} alt="Chess Logo" />
          <h1>{t('login.systemTitle')}</h1>
        </div>
        
        <div className="change-password-form">
          {step === 'email' ? (
            <>
              <h2>{t('forgotPassword.resetPassword')}</h2>
              
              {error && <div className="error-message">{error}</div>}
              {verificationSent && (
                <div className="success-message">
                  {t('forgotPassword.emailSentSuccess')}
                </div>
              )}
              
              <form onSubmit={handleSendVerification}>
                <div className="form-group">
                  <label htmlFor="email">{t('forgotPassword.emailAddress')}:</label>
                  <input
                    type="email"
                    id="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={t('forgotPassword.enterEmailPlaceholder')}
                    required
                    disabled={loading || verificationSent}
                  />
                </div>

                <button 
                  type="submit" 
                  className="change-password-button" 
                  disabled={loading || verificationSent}
                >
                  {loading ? t('forgotPassword.sending') : t('forgotPassword.sendVerificationEmail')}
                </button>
              </form>

              {verificationSent && (
                <button 
                  type="button" 
                  className="back-button" 
                  onClick={handleRequestNewLink}
                  style={{ marginTop: '10px' }}
                >
                  {t('forgotPassword.sendAnotherEmail')}
                </button>
              )}

              <button 
                type="button" 
                className="back-button" 
                onClick={handleBackToLogin}
                disabled={loading}
              >
                {t('forgotPassword.backToLogin')}
              </button>
            </>
          ) : (
            <>
              <h2>{t('forgotPassword.setNewPassword')}</h2>
              <p style={{ textAlign: 'center', marginBottom: '20px', color: '#666' }}>
                {t('forgotPassword.enterNewPasswordFor')}: <strong>{email}</strong>
              </p>
              
              {error && <div className="error-message">{error}</div>}
              {success && step === 'reset' && !error && (
                <div className="success-message">
                  {t('forgotPassword.passwordResetSuccess')}
                </div>
              )}
              
              <form onSubmit={handlePasswordReset}>
                <div className="form-group">
                  <label htmlFor="newPassword">{t('forgotPassword.newPassword')}:</label>
                  <input
                    type="password"
                    id="newPassword"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder={t('forgotPassword.enterNewPassword')}
                    required
                    disabled={loading || success}
                    minLength="6"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="confirmPassword">{t('forgotPassword.confirmNewPassword')}:</label>
                  <input
                    type="password"
                    id="confirmPassword"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder={t('forgotPassword.confirmPasswordPlaceholder')}
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
                  {loading ? t('forgotPassword.updatingPassword') : t('forgotPassword.updatePassword')}
                </button>
              </form>

              <button 
                type="button" 
                className="back-button" 
                onClick={handleBackToLogin}
                disabled={loading}
              >
                {t('forgotPassword.backToLogin')}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
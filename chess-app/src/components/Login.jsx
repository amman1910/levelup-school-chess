import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import { db } from '../firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { useNavigate, useSearchParams } from 'react-router-dom';
import LanguageSwitcher from './LanguageSwitcher';
import './Login.css';
import chessLogo from './chessLogo.png';

/**
 * Login Component
 * Handles user authentication with role-based routing
 * Features internationalization support and RTL/LTR layout switching
 */
const Login = () => {
  const { t, i18n } = useTranslation();
  const [searchParams] = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  
  // Check if current language is Arabic for RTL layout
  const isRTL = i18n.language === 'ar';

  /**
   * Set language based on URL parameter or localStorage
   */
  useEffect(() => {
    const langFromUrl = searchParams.get('lang');
    const savedLanguage = localStorage.getItem('i18nextLng');
    
    if (langFromUrl) {
      // Use language parameter from URL and save it
      i18n.changeLanguage(langFromUrl);
      localStorage.setItem('i18nextLng', langFromUrl);
    } else if (savedLanguage && savedLanguage !== i18n.language) {
      // Use saved language
      i18n.changeLanguage(savedLanguage);
    } else {
      // Default to Arabic
      i18n.changeLanguage('ar');
    }
  }, [i18n, searchParams]);

  /**
   * Handle login form submission with authentication and role checking
   * @param {Event} e - Form submit event
   */
  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!email || !password) {
      setError(t('login.fillAllFields'));
      return;
    }

    const auth = getAuth();

    try {
      setLoading(true);
      
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

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
            firstLogin: userData.firstLogin,
            firstName: userData.firstName,   
            lastName: userData.lastName 
          }));
          
          // Route based on user role
          if (userData.role === "admin") {
            navigate('/admin-area');
          } else if (userData.role === "trainer") {
            if (userData.firstLogin === true) {
              navigate('/change-initial-password');
            } else {
              navigate('/trainer-area');
            }
          } else {
            setError(t('login.unrecognizedRole'));
            setLoading(false);
          }
        } else {
          setError(t('login.userNotExist'));
          setLoading(false);
        }
      } catch (dbError) {
        setError(t('login.databaseError'));
        setLoading(false);
      }
      
    } catch (err) {
      setError(t('login.invalidCredentials'));
      setLoading(false);
    }
  };

  /**
   * Navigate to forgot password page with language parameter
   */
  const handleForgotPassword = () => {
    const currentLanguage = i18n.language;
    navigate(`/forgot-password?lang=${currentLanguage}`);
  };

  return (
    <div className={`login-container ${isRTL ? 'rtl' : 'ltr'}`}>
      <div className="login-form-wrapper">
        <div className="chess-decoration decoration-1"></div>
        <div className="chess-decoration decoration-2"></div>
        
        {/* Language switcher */}
        <div className="login-language-switcher">
          <LanguageSwitcher />
        </div>
        
        {/* Logo area */}
        <div className="logo-area">
          <img src={chessLogo} alt="Chess Logo" />
          <h1>{t('login.systemTitle')}</h1>
        </div>
        
        {/* Login form */}
        <div className="login-form">
          <h2>{t('login.loginToAccount')}</h2>
          {error && <div className="error-message">{error}</div>}
          <form onSubmit={handleLogin}>
            <div className="form-group">
              <label htmlFor="email">{t('login.email')}:</label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t('login.enterEmail')}
                required
                disabled={loading}
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="password">{t('login.password')}:</label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={t('login.enterPassword')}
                required
                disabled={loading}
              />
            </div>

            <button type="submit" className="login-button" disabled={loading}>
              {loading ? t('login.connecting') : t('login.login')}
            </button>
          </form>

          {/* Forgot password button */}
          <button 
            type="button" 
            className="forgot-password-button" 
            onClick={handleForgotPassword}
            disabled={loading}
          >
            {t('login.forgotPassword')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Login;
import React from 'react';
import './i18n/i18n'; // Important - must be at the beginning before other imports
import './styles/rtl-support.css'; // RTL support for Arabic
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './components/Login';
import AdminArea from './components/AdminArea';
import TrainerArea from './components/TrainerArea';
import ChangeInitialPassword from './components/ChangeInitialPassword';
import ForgotPassword from './components/ForgotPassword';
import GuestPage from './components/Guest/GuestPage/GuestPage';
import InquiryForm from './components/Guest/InquiryForm/InquiryForm';

/**
 * Main App Component
 * Handles routing, internationalization, and text direction management
 * Features RTL/LTR support with automatic direction switching based on language
 */
function App() {
  const { i18n } = useTranslation();

  /**
   * Update text direction based on language
   * @param {string} language - Current language code
   */
  const updateDirection = (language) => {
    const isRTL = language === 'ar';
    document.documentElement.dir = isRTL ? 'rtl' : 'ltr';
    document.documentElement.lang = language;
    
    // Add direction classes to body
    document.body.classList.toggle('rtl', isRTL);
    document.body.classList.toggle('ltr', !isRTL);
  };

  // Update text direction when language changes
  useEffect(() => {
    updateDirection(i18n.language);
  }, [i18n.language]);

  // Set initial direction
  useEffect(() => {
    updateDirection(i18n.language || 'ar');
  }, []);

  return (
    <div className={`app ${i18n.language === 'ar' ? 'rtl' : 'ltr'}`}>
      <Router>
        <Routes>
          {/* Guest pages */}
          <Route path="/" element={<GuestPage />} />
          <Route path="/join" element={<InquiryForm />} />
          
          {/* Authentication pages */}
          <Route path="/login" element={<Login />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          
          {/* Admin area */}
          <Route path="/admin-area/*" element={<AdminArea />} />
          
          {/* Trainer area - includes all sections */}
          <Route path="/trainer-area/*" element={<TrainerArea />} />
          
          {/* Initial password change page */}
          <Route path="/change-initial-password" element={<ChangeInitialPassword />} />
          
          {/* Redirect unknown routes to login */}
          <Route path="*" element={<Navigate to="/login" />} />
        </Routes>
      </Router>
    </div>
  );
}

export default App;
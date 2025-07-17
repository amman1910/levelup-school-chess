import React from 'react';
import './i18n/i18n'; // חשוב - חייב להיות בתחילת הקובץ לפני שאר הImports
import './styles/rtl-support.css'; // תמיכה ב-RTL לערבית
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './components/Login';
import AdminArea from './components/AdminArea';
import TrainerArea from './components/TrainerArea';
import ChangeInitialPassword from './components/ChangeInitialPassword';
import ForgotPassword from './components/ForgotPassword'; // Added ForgotPassword import
import GuestPage from './components/Guest/GuestPage/GuestPage';
import InquiryForm from './components/Guest/InquiryForm/InquiryForm'; // مسار الكومبوننت حسب مكانه

function App() {
  const { i18n } = useTranslation();

  // פונקציה לעדכון כיוון הטקסט
  const updateDirection = (language) => {
    const isRTL = language === 'ar';
    document.documentElement.dir = isRTL ? 'rtl' : 'ltr';
    document.documentElement.lang = language;
    
    // הוספת קלאס לגוף המסמך
    document.body.classList.toggle('rtl', isRTL);
    document.body.classList.toggle('ltr', !isRTL);
  };

  // עדכון כיוון הטקסט כשהשפה משתנה
  useEffect(() => {
    updateDirection(i18n.language);
  }, [i18n.language]);

  // הגדרת כיוון ראשוני
  useEffect(() => {
    updateDirection(i18n.language || 'ar');
  }, []);

  return (
    <div className={`app ${i18n.language === 'ar' ? 'rtl' : 'ltr'}`}>
      <Router>
        <Routes>
          <Route path="/" element={<GuestPage />} />
          <Route path="/join" element={<InquiryForm />} />
          
          {/* صفحة تسجيل الدخول */}
          <Route path="/login" element={<Login />} />
          
          {/* صفحة نسيان كلمة السر */}
          <Route path="/forgot-password" element={<ForgotPassword />} />
          
          {/* صفحة المدير */}
          <Route path="/admin-area/*" element={<AdminArea />} />
          
          {/* صفحة المدرب - تشمل كل الأقسام */}
          <Route path="/trainer-area/*" element={<TrainerArea />} />
          
          {/* صفحة تغيير كلمة السر الأولية */}
          <Route path="/change-initial-password" element={<ChangeInitialPassword />} />
          
          {/* أي رابط غير معروف يذهب لتسجيل الدخول */}
          <Route path="*" element={<Navigate to="/login" />} />
        </Routes>
      </Router>
    </div>
  );
}

export default App;
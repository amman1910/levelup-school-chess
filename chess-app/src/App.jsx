import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './components/Login';
import AdminArea from './components/AdminArea';
import TrainerArea from './components/TrainerArea';
import ChangeInitialPassword from './components/ChangeInitialPassword';
import ForgotPassword from './components/ForgotPassword'; // Added ForgotPassword import

function App() {
  return (
    <Router>
      <Routes>
        {/* إذا تم فتح الصفحة الرئيسية، نوجه المستخدم إلى صفحة تسجيل الدخول */}
        <Route path="/" element={<Navigate to="/login" />} />
        
        {/* صفحة تسجيل الدخول */}
        <Route path="/login" element={<Login />} />
        
        {/* صفحة نسيان كلمة السر */}
        <Route path="/forgot-password" element={<ForgotPassword />} />
        
        {/* صفحة المدير */}
        <Route path="/admin-area" element={<AdminArea />} />
        
        {/* صفحة المدرب - تشمل كل الأقسام */}
        <Route path="/trainer-area/*" element={<TrainerArea />} />
        
        {/* صفحة تغيير كلمة السر الأولية */}
        <Route path="/change-initial-password" element={<ChangeInitialPassword />} />
        
        {/* أي رابط غير معروف يذهب لتسجيل الدخول */}
        <Route path="*" element={<Navigate to="/login" />} />
      </Routes>
    </Router>
  );
}

export default App;
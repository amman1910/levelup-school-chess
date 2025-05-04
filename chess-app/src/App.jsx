import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './components/Login';
import AdminArea from './components/AdminArea';
import TrainerArea from './components/TrainerArea';

function App() {
  return (
    <Router>
      <Routes>
        {/* אם הדף הראשי נפתח קודם, נוביל את המשתמש לדף הלוגין */}
        <Route path="/" element={<Navigate to="/login" />} />
        
        {/* דף התחברות */}
        <Route path="/login" element={<Login />} />
        
        {/* דף האזור האישי למנהל */}
        <Route path="/admin-area" element={<AdminArea />} />
        
        {/* דף האזור האישי למאמן */}
        <Route path="/trainer-area" element={<TrainerArea />} />
        
        {/* כל נתיב לא מוכר מוביל לדף הלוגין */}
        <Route path="*" element={<Navigate to="/login" />} />
      </Routes>
    </Router>
  );
}

export default App;
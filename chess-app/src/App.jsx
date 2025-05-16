import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './components/Login';
import AdminArea from './components/AdminArea';
import TrainerArea from './components/TrainerArea';
import ChangeInitialPassword from './components/ChangeInitialPassword';

function App() {
  return (
    <Router>
      <Layout/>
        <Routes>
          {/* אם הדף הראשי נפתח קודם, נוביל את המשתמש לדף הלוגין */}
          <Route path="/" element={<Navigate to="/login" />} />
          
          {/* דף התחברות */}
          <Route path="/login" element={<Login />} />
          
          {/* דף האזור האישי למנהל */}
          <Route path="/admin-area" element={<AdminArea />} />
          
          {/* דף האזור האישי למאמן */}
          <Route path="/trainer-area" element={<TrainerArea />} />
          
          {/* דף שינוי סיסמה ראשונית */}
  {/* דף שינוי סיסמה ראשונית */}
          <Route path="/change-initial-password" element={<ChangeInitialPassword />} />
          
          {/* כל נתיב לא מוכר מוביל לדף הלוגין */}
          <Route path="*" element={<Navigate to="/login" />} />
        </Routes>
    </Router>
  );

function Layout({ children }) {
  return (
    <div>
      <header>
        <nav>
          <ul>
            <li><a href="/login">Login</a></li>
            <li><a href="/admin-area">Admin Area</a></li>
            <li><a href="/trainer-area">Trainer Area</a></li>
          </ul>
        </nav>
      </header>
      <main>{children}</main>
    </div>
  );
}
}

export default App;
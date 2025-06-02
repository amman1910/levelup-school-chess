import React, { useEffect, useState } from 'react';
import { NavLink, Routes, Route, useNavigate, Navigate, useLocation } from 'react-router-dom';
import TrainerSessions from './TrainerSessions';
import TrainerMeetingForm from './TrainerMeetingForm';
import TrainerSchools from './TrainerSchools';
import NotificationsMessages from './TrainerNotificationsMessages'; // השתמש בקובץ שלנו
import TrainerDashboard from './TrainerDashboard';
import TrainerMaterialsLibary from './TrainerMaterialsLibary';
import TrainerProfile from './TrainerProfile'; // הוספת הקומפננטה החדשה

import './TrainerArea.css';
import chessLogo from './chessLogo3.png'; // ייבוא התמונה

const TrainerArea = () => {
  const [user, setUser] = useState(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const loggedInUser = localStorage.getItem('user');
    if (!loggedInUser) {
      navigate('/login');
      return;
    }

    const userData = JSON.parse(loggedInUser);
    if (userData.role !== 'trainer') {
      navigate('/login');
      return;
    }

    // Extract the document ID from uid for notifications
    if (userData.uid && !userData.id) {
      userData.id = userData.uid;
    }

    setUser(userData);
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('user');
    navigate('/login');
  };

  const getPageTitle = () => {
    if (location.pathname.includes('dashboard')) return 'Dashboard';
    if (location.pathname.includes('sessions') && !location.pathname.includes('record')) return 'Training Sessions';
    if (location.pathname.includes('record-session')) return 'Record Session';
    if (location.pathname.includes('schools')) return 'My Schools';
    if (location.pathname.includes('lessons')) return 'Lessons Library';
    if (location.pathname.includes('notifications')) return 'Notifications & Messages';
    if (location.pathname.includes('profile')) return 'My Profile'; // הוספת כותרת לפרופיל
    return 'Trainer Area';
  };

  // בדוק אם אנחנו בעמוד ההתראות
  const isNotificationsPage = location.pathname.includes('notifications');

  if (!user) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <div className="trainer-area">
      <div className="trainer-sidebar">
        <div className="logo-wrapper">
          <h2>LEVEL UP</h2>
          <div className="subtitle">Chess Club Management</div>
        </div>

        <nav className="trainer-nav">
          <NavLink to="/trainer-area/dashboard" className={({ isActive }) => `trainer-link ${isActive ? 'active' : ''}`}>Dashboard</NavLink>
          <NavLink to="/trainer-area/sessions" className={({ isActive }) => `trainer-link ${isActive ? 'active' : ''}`}>Sessions</NavLink>
          <NavLink to="/trainer-area/record-session" className={({ isActive }) => `trainer-link ${isActive ? 'active' : ''}`}>Record Session</NavLink>
          <NavLink to="/trainer-area/schools" className={({ isActive }) => `trainer-link ${isActive ? 'active' : ''}`}>Schools and classes</NavLink>
          <NavLink to="/trainer-area/lessons" className={({ isActive }) => `trainer-link ${isActive ? 'active' : ''}`}>Materials Libary</NavLink>
          <NavLink to="/trainer-area/notifications" className={({ isActive }) => `trainer-link ${isActive ? 'active' : ''}`}>
            Notifications
            {unreadCount > 0 && (
              <span className="notification-badge">{unreadCount}</span>
            )}
          </NavLink>
          <NavLink to="/trainer-area/profile" className={({ isActive }) => `trainer-link ${isActive ? 'active' : ''}`}>Profile</NavLink>
          
          {/* הוספת הלוגו מתחת לProfile */}
          <div className="nav-logo-container">
            <img src={chessLogo} alt="Chess Logo" className="nav-chess-logo" />
          </div>
        </nav>

        <div className="trainer-footer">
          <div className="user-info">
            <div className="user-email">{user.email}</div>
            <div className="user-role">Trainer</div>
          </div>
          <button onClick={handleLogout} className="logout-button">Logout</button>
        </div>
      </div>

      <div className="trainer-content">
        {!isNotificationsPage && (
          <div className="trainer-header">
            <h1 className="page-title">{getPageTitle()}</h1>
          </div>
        )}

        <div className={`trainer-main ${isNotificationsPage ? 'notifications-full' : ''}`}>
          <Routes>
            <Route index element={<Navigate to="dashboard" />} />
            <Route path="dashboard" element={<TrainerDashboard />} />
            <Route path="sessions" element={<TrainerSessions />} />
            <Route path="record-session" element={<TrainerMeetingForm />} />
            <Route path="schools" element={<TrainerSchools />} />
            <Route path="lessons" element={<TrainerMaterialsLibary />} />
            <Route path="profile" element={<TrainerProfile currentUser={user} />} />
            <Route path="notifications" element={<NotificationsMessages currentUser={user} onUnreadCountChange={setUnreadCount} />} />
            <Route path="*" element={<Navigate to="dashboard" />} />
          </Routes>
        </div>
      </div>
    </div>
  );
};

export default TrainerArea;
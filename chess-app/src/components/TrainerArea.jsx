import React, { useEffect, useState } from 'react';
import { NavLink, Routes, Route, useNavigate, Navigate, useLocation } from 'react-router-dom';
import TrainerSessions from './TrainerSessions';
import TrainerMeetingForm from './TrainerMeetingForm';
import TrainerSchools from './TrainerSchools';
import TrainerLessons from './TrainerLessons';
import TrainerNotifications from './TrainerNotifications.jsx';
import TrainerDashboard from './TrainerDashboard';
import TrainerClassSessions from './TrainerClassSessions';

import './TrainerArea.css';

const TrainerArea = () => {
  const [user, setUser] = useState(null);
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
    if (location.pathname.includes('notifications')) return 'Notifications';
    return 'Trainer Area';
  };

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
          <NavLink to="/trainer-area/schools" className={({ isActive }) => `trainer-link ${isActive ? 'active' : ''}`}>Schools</NavLink>
          <NavLink to="/trainer-area/lessons" className={({ isActive }) => `trainer-link ${isActive ? 'active' : ''}`}>Lessons Library</NavLink>
          <NavLink to="/trainer-area/notifications" className={({ isActive }) => `trainer-link ${isActive ? 'active' : ''}`}>Notifications</NavLink>
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
        <div className="trainer-header">
          <h1 className="page-title">{getPageTitle()}</h1>
        </div>

        <div className="trainer-main">
          <Routes>
            <Route index element={<Navigate to="dashboard" />} />
            <Route path="dashboard" element={<TrainerDashboard />} />
            <Route path="sessions" element={<TrainerSessions />} />
            <Route path="record-session" element={<TrainerMeetingForm />} />
            <Route path="schools" element={<TrainerSchools />} />
            <Route path="lessons" element={<TrainerLessons />} />
            <Route path="notifications" element={<TrainerNotifications />} />
            <Route path="*" element={<Navigate to="dashboard" />} />
            <Route path="class-sessions/:classId" element={<TrainerClassSessions />} />
          </Routes>
        </div>
      </div>
    </div>
  );
};

export default TrainerArea;





import React, { useEffect, useState } from 'react';
import { NavLink, Routes, Route, useNavigate, Navigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next'; // הוספת useTranslation
import { db } from '../firebase';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import TrainerSessions from './TrainerSessions';
import TrainerMeetingForm from './TrainerMeetingForm';
import TrainerSchools from './TrainerSchools';
import NotificationsMessages from './TrainerNotifications'; // השתמש בקובץ שלנו
import TrainerDashboard from './TrainerDashboard';
import TrainerMaterialsLibary from './TrainerMaterialsLibary';
import TrainerProfile from './TrainerProfile'; // הוספת הקומפננטה החדשה
import LanguageSwitcher from './LanguageSwitcher'; // הוספת מתג השפות

import './TrainerArea.css';
import chessLogo from './chessLogo.png'; // ייבוא התמונה החדשה
import chessLogo3 from './chessLogo3.png'; // ייבוא התמונה הקיימת

const TrainerArea = () => {
  const { t, i18n } = useTranslation(); // הוספת i18n לשליטה בשפה
  const [user, setUser] = useState(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const navigate = useNavigate();
  const location = useLocation();

  // הגדרת ערבית כשפת ברירת מחדל
  useEffect(() => {
    // בדוק אם לא נשמרה העדפת שפה בlocal storage
    const savedLanguage = localStorage.getItem('i18nextLng');
    if (!savedLanguage || savedLanguage === 'en-US' || savedLanguage === 'en') {
      i18n.changeLanguage('ar');
    }
  }, [i18n]);

  useEffect(() => {
    const loggedInUser = localStorage.getItem('user');
    console.log('Raw user from localStorage in TrainerArea:', loggedInUser);
    
    if (!loggedInUser) {
      console.log('No user in localStorage, redirecting to login');
      navigate('/login');
      return;
    }

    const userData = JSON.parse(loggedInUser);
    console.log('Parsed user data in TrainerArea:', userData);
    
    if (userData.role !== 'trainer') {
      console.log('User is not trainer, redirecting to login');
      navigate('/login');
      return;
    }

    // Extract the document ID from uid for notifications
    if (userData.uid && !userData.id) {
      userData.id = userData.uid;
    }

    console.log('Setting user in TrainerArea:', userData);
    setUser(userData);
  }, [navigate]);

  // Fetch unread notifications count in real-time
  useEffect(() => {
    if (!user?.uid) {
      console.log('No user uid found for notifications in TrainerArea:', user);
      return;
    }

    // Use uid for the query since that's what's stored in notifications
    const userId = user.uid;
    console.log('Setting up unread notifications listener for trainer ID:', userId);

    // Query for unread messages where trainer is RECEIVER
    const q = query(
      collection(db, 'notifications'),
      where('receiverId', '==', userId),
      where('read', '==', false)
    );

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const unreadCount = querySnapshot.size;
      console.log('Trainer unread notifications count:', unreadCount);
      setUnreadCount(unreadCount);
    }, (error) => {
      console.error('Error in trainer unread notifications listener:', error);
    });

    return () => {
      console.log('Cleaning up trainer unread notifications listener');
      unsubscribe();
    };
  }, [user]);

  const handleLogout = () => {
    localStorage.removeItem('user');
    navigate('/login');
  };

  const getPageTitle = () => {
    if (location.pathname.includes('dashboard')) return t('trainer.dashboard');
    if (location.pathname.includes('sessions') && !location.pathname.includes('record')) return t('trainer.sessions');
    if (location.pathname.includes('record-session')) return t('trainer.recordSession');
    if (location.pathname.includes('schools')) return t('trainer.schoolsAndClasses');
    if (location.pathname.includes('lessons')) return t('trainer.materialsLibrary');
    if (location.pathname.includes('notifications')) return t('trainer.notifications');
    if (location.pathname.includes('profile')) return t('trainer.profile');
    return t('trainer.area');
  };

  // בדוק אם אנחנו בעמוד ההתראות
  const isNotificationsPage = location.pathname.includes('notifications');

  if (!user) {
    return <div className="loading">{t('common.loading')}</div>;
  }

  return (
    <div className="trainer-area">
      <div className="trainer-sidebar">
        <div className="logo-wrapper">
          <h2>LEVEL UP</h2>
          <div className="subtitle">Chess Club Management</div>
          <div className="logo-container">
            <img src={chessLogo} alt="Chess Logo" className="header-chess-logo" />
          </div>
        </div>

        <nav className="trainer-nav">
          <NavLink to="/trainer-area/dashboard" className={({ isActive }) => `trainer-link ${isActive ? 'active' : ''}`}>
            {t('trainer.dashboard')}
          </NavLink>
          <NavLink to="/trainer-area/sessions" className={({ isActive }) => `trainer-link ${isActive ? 'active' : ''}`}>
            {t('trainer.sessions')}
          </NavLink>
          <NavLink to="/trainer-area/record-session" className={({ isActive }) => `trainer-link ${isActive ? 'active' : ''}`}>
            {t('trainer.recordSession')}
          </NavLink>
          <NavLink to="/trainer-area/schools" className={({ isActive }) => `trainer-link ${isActive ? 'active' : ''}`}>
            {t('trainer.schoolsAndClasses')}
          </NavLink>
          <NavLink to="/trainer-area/lessons" className={({ isActive }) => `trainer-link ${isActive ? 'active' : ''}`}>
            {t('trainer.materialsLibrary')}
          </NavLink>
          <NavLink to="/trainer-area/notifications" className={({ isActive }) => `trainer-link ${isActive ? 'active' : ''}`}>
            {t('trainer.notifications')}
            {unreadCount > 0 && (
              <span className="notification-badge">{unreadCount}</span>
            )}
          </NavLink>
          <NavLink to="/trainer-area/profile" className={({ isActive }) => `trainer-link ${isActive ? 'active' : ''}`}>
            {t('trainer.profile')}
          </NavLink>
          
          {/* הוספת מתג השפות */}
          <LanguageSwitcher />
          
          {/* הוספת הלוגו מתחת לProfile */}
          <div className="nav-logo-container">
            <img src={chessLogo3} alt="Chess Logo" className="nav-chess-logo" />
          </div>
        </nav>

        <div className="trainer-footer">
          <div className="user-info">
            <div className="user-email">{user.email}</div>
            <div className="user-role">{t('trainer.trainer')}</div>
          </div>
          <button onClick={handleLogout} className="logout-button">
            {t('common.logout')}
          </button>
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
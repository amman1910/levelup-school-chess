import React, { useEffect, useState } from 'react';
import { NavLink, Routes, Route, useNavigate, Navigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next'; 
import { db } from '../firebase';
import { collection, getDocs, query, where, onSnapshot } from 'firebase/firestore';
import Dashboard from './AdminDashboard';
import ManageUsers from './ManageUsers';
import AdminAnalyticsOverview from './AdminAnalyticsOverview';
import ManageClasses from './ManageClasses';
import ManageStudents from './ManageStudents';
import ManageSchools from './ManageSchools';
import ManageLessons from './ManageSessions';
import AdminHomepageEditor from './AdminHomepageEditor';
import AdminNotifications from './AdminNotifications';
import AdminRegistrationForms from './AdminRegistrationForms';
import ManageMaterialsAdmin from './ManageMaterialsAdmin';
import AdminTrainerAnalytics from './AdminTrainerAnalytics';
import AdminTrainerSessions from './AdminTrainerSessions';
import AdminGroupAnalytics from './AdminGroupAnalytics';
import AdminAttendanceTrends from './AdminAttendanceTrends';
import AdminActivityLog from './AdminActivityLog';
import AdminProfile from './AdminProfile';
import LanguageSwitcher from './LanguageSwitcher'; 
import chessLogo from './chessLogo.png';
import chessLogo3 from './chessLogo3.png'; 

import './AdminArea.css';

const AdminArea = () => {
  const { t, i18n } = useTranslation(); 
  const [user, setUser] = useState(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [pendingRegistrationsCount, setPendingRegistrationsCount] = useState(0);
  const [users, setUsers] = useState([]);
  const [classes, setClasses] = useState([]);
  const [students, setStudents] = useState([]);
  const [schools, setSchools] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  
  useEffect(() => {
    const savedLanguage = localStorage.getItem('i18nextLng');
    if (!savedLanguage || savedLanguage === 'en-US' || savedLanguage === 'en') {
      i18n.changeLanguage('ar');
    }
  }, [i18n]);

  useEffect(() => {
  document.documentElement.setAttribute('dir', i18n.language === 'ar' ? 'rtl' : 'ltr');
}, [i18n.language]);


  
  useEffect(() => {
    setError('');
    setSuccess('');
  }, [location.pathname]);

  useEffect(() => {
    const loggedInUser = localStorage.getItem('user');
    
    
    if (!loggedInUser) {
      
      navigate('/login');
      return;
    }

    const userData = JSON.parse(loggedInUser);
    
    
    if (userData.role !== 'admin') {
      
      navigate('/login');
      return;
    }

    
    setUser(userData);
  }, [navigate]);
  
  const fetchUsers = async () => {
    try {
      const usersSnapshot = await getDocs(collection(db, "users"));
      setUsers(usersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    } catch (err) {
      console.error('Error fetching users:', err);
      setError(t('admin.failedToLoad')); // שימוש בתרגום
    }
  };

  const fetchClasses = async () => {
    try {
      const classesSnapshot = await getDocs(collection(db, "classes"));
      setClasses(classesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    } catch (err) {
      console.error('Error fetching classes:', err);
      setError(t('admin.failedToLoad'));
    }
  };

  const fetchStudents = async () => {
    try {
      const studentsSnapshot = await getDocs(collection(db, "students"));
      setStudents(studentsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    } catch (err) {
      console.error('Error fetching students:', err);
      setError(t('admin.failedToLoad'));
    }
  };

  const fetchSchools = async () => {
    try {
      const schoolsSnapshot = await getDocs(collection(db, "schools"));
      setSchools(schoolsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    } catch (err) {
      console.error('Error fetching schools:', err);
      setError(t('admin.failedToLoad'));
    }
  };

  const fetchSessions = async () => {
    try {
      const snapshot = await getDocs(collection(db, "sessions"));
      setSessions(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    } catch (err) {
      console.error('Error fetching sessions:', err);
      setError(t('admin.failedToLoad'));
    }
  };

  const fetchAllData = async () => {
    setLoading(true);
    try {
      await Promise.all([fetchUsers(), fetchClasses(), fetchStudents(), fetchSchools(), fetchSessions()]);
    } catch (err) {
      setError(t('admin.failedToLoad'));
    } finally {
      setLoading(false);
    }
  };

  // Initial data fetch
  useEffect(() => {
    if (user) {
      fetchAllData();
    }
  }, [user]);

  
  useEffect(() => {
    if (!user?.uid) {
      
      return;
    }

    const userId = user.uid;
    

    const q = query(
      collection(db, 'notifications'),
      where('receiverId', '==', userId),
      where('read', '==', false)
    );

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const unreadCount = querySnapshot.size;
      
      setUnreadCount(unreadCount);
    }, (error) => {
      console.error('Error in unread notifications listener:', error);
    });

    return () => {
      
      unsubscribe();
    };
  }, [user]);

  
  useEffect(() => {
    if (!user?.uid) {
      
      return;
    }

    

    const q = query(collection(db, 'registrationForm'));

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      let pendingCount = 0;
      
      querySnapshot.forEach((doc) => {
        const formData = doc.data();
        const status = formData.status?.toLowerCase() || 'pending';
        const isPending = status === 'pending' || !formData.status;
        
        if (isPending) {
          pendingCount++;
        }
      });
      
      
      setPendingRegistrationsCount(pendingCount);
    }, (error) => {
      console.error('Error in pending registration forms listener:', error);
    });

    return () => {
      
      unsubscribe();
    };
  }, [user]);

  const handleLogout = () => {
    localStorage.removeItem('user');
    navigate('/login');
  };

  const getPageTitle = () => {
    if (location.pathname.includes('dashboard')) return t('admin.dashboard');
    if (location.pathname.includes('manage-users')) return t('admin.manageUsers');
    if (location.pathname.includes('trainer-monitoring')) return t('admin.analytics');
    if (location.pathname.includes('manage-classes')) return t('admin.manageClasses');
    if (location.pathname.includes('manage-students')) return t('admin.manageStudents');
    if (location.pathname.includes('manage-schools')) return t('admin.manageSchools');
    if (location.pathname.includes('manage-lessons')) return t('admin.manageSessions');
    if (location.pathname.includes('manage-materials')) return t('admin.manageMaterials');
    if (location.pathname.includes('edit-homepage')) return t('admin.editHomepage');
    if (location.pathname.includes('notifications')) return t('admin.notifications');
    if (location.pathname.includes('registration-requests')) return t('admin.registrationRequests');
    if (location.pathname.includes('my-profile')) return t('admin.myProfile');
    return t('admin.area');
  };

  const handleRefresh = async () => {
    setError('');
    setSuccess('');
    await fetchAllData();
    setSuccess(t('admin.dataRefreshed')); 
    setTimeout(() => setSuccess(''), 3000);
  };

  if (!user) {
    return <div className="loading">{t('common.loading')}</div>;
  }

    const direction = i18n.language === 'ar' ? 'rtl' : 'ltr';

  return (
    <div className={`admin-area ${direction}`}>
      <div className={`admin-sidebar ${isSidebarOpen ? 'open' : 'closed'}`}>
        <div className="logo-wrapper">
          <h2>LEVEL UP</h2>
          <div className="subtitle">Chess Club Management</div>
          <div className="logo-container">
            <img src={chessLogo} alt="Chess Logo" className="header-chess-logo" />
          </div>
        </div>
        
        <nav className="admin-nav">
          <NavLink to="/admin-area/dashboard" className={({ isActive }) => `admin-link ${isActive ? 'active' : ''}`}>
            {t('admin.dashboard')}
          </NavLink>
          <NavLink to="/admin-area/manage-users" className={({ isActive }) => `admin-link ${isActive ? 'active' : ''}`}>
            {t('admin.manageUsers')}
          </NavLink>
          <NavLink to="/admin-area/manage-schools" className={({ isActive }) => `admin-link ${isActive ? 'active' : ''}`}>
            {t('admin.manageSchools')}
          </NavLink>
          <NavLink to="/admin-area/manage-classes" className={({ isActive }) => `admin-link ${isActive ? 'active' : ''}`}>
            {t('admin.manageClasses')}
          </NavLink>
          <NavLink to="/admin-area/manage-students" className={({ isActive }) => `admin-link ${isActive ? 'active' : ''}`}>
            {t('admin.manageStudents')}
          </NavLink>
          <NavLink to="/admin-area/manage-lessons" className={({ isActive }) => `admin-link ${isActive ? 'active' : ''}`}>
            {t('admin.manageSessions')}
          </NavLink>
          <NavLink to="/admin-area/manage-materials" className={({ isActive }) => `admin-link ${isActive ? 'active' : ''}`}>
            {t('admin.manageMaterials')}
          </NavLink>
          <NavLink to="/admin-area/trainer-monitoring" className={({ isActive }) => `admin-link ${isActive ? 'active' : ''}`}>
            {t('admin.analytics')}
          </NavLink>
          <NavLink to="/admin-area/edit-homepage" className={({ isActive }) => `admin-link ${isActive ? 'active' : ''}`}>
            {t('admin.editHomepage')}
          </NavLink>
          <NavLink 
            to="/admin-area/notifications" 
            className={({ isActive }) => `admin-link ${isActive ? 'active' : ''} notifications-link`}
          >
            {t('admin.notifications')}
            {unreadCount > 0 && (
              <span className="notification-badge">{unreadCount}</span>
            )}
          </NavLink>
          <NavLink 
            to="/admin-area/registration-requests" 
            className={({ isActive }) => `admin-link ${isActive ? 'active' : ''} registration-link`}
          >
            {t('admin.registrationRequests')}
            {pendingRegistrationsCount > 0 && (
              <span className="notification-badge">{pendingRegistrationsCount}</span>
            )}
          </NavLink>
          <NavLink to="/admin-area/my-profile" className={({ isActive }) => `admin-link ${isActive ? 'active' : ''}`}>
            {t('admin.myProfile')}
          </NavLink>
          
          
          <LanguageSwitcher />
          
          
          <div className="nav-logo-container">
            <img src={chessLogo3} alt="Chess Logo" className="nav-chess-logo" />
          </div>
        </nav>
        
        <div className="admin-footer">
          <div className="user-info">
            <div className="user-email">{user.email}</div>
            <div className="user-role">{t('admin.administrator')}</div>
          </div>
          <button 
            onClick={handleLogout} 
            className="logout-button"
            disabled={loading}
          >
            {t('common.logout')}
          </button>
        </div>
      </div>
      
      <div className="admin-content">
        <div className="admin-header">
<div className="header-content-wrapper">
<button className="mobile-sidebar-toggle" onClick={() => setIsSidebarOpen(!isSidebarOpen)}>
  ☰
</button>
          <h1 className="page-title">{getPageTitle()}</h1>
          <button 
            onClick={handleRefresh} 
            className="refresh-button"
            disabled={loading}
          >
            {loading ? t('admin.refreshing') : `↻ ${t('common.refresh')}`}
          </button>
        </div>
</div>

        
        <div className="admin-main">
          {error && <div className="error-message">{error}</div>}
          {success && <div className="success-message">{success}</div>}
          
          <Routes>
            <Route index element={<Navigate to="dashboard" />} />
            <Route 
              path="dashboard" 
              element={
                <Dashboard 
                  users={users} 
                  classes={classes} 
                  students={students}
                />
              } 
            />
            <Route 
              path="manage-users" 
              element={
                <ManageUsers 
                  users={users}
                  setUsers={setUsers}
                  loading={loading}
                  setLoading={setLoading}
                  error={setError}
                  success={setSuccess}
                  fetchUsers={fetchUsers}
                />
              } 
            />
            <Route 
              path="manage-schools" 
              element={
                <ManageSchools 
                  schools={schools}
                  setSchools={setSchools}
                  loading={loading}
                  setLoading={setLoading}
                  error={setError}
                  success={setSuccess}
                  fetchSchools={fetchSchools}
                />
              } 
            />
            <Route 
              path="trainer-monitoring" 
              element={
                <AdminAnalyticsOverview
                  users={users}
                  classes={classes}
                  students={students}
                  sessions={sessions}
                  loading={loading}
                  setLoading={setLoading}
                  error={setError}
                  success={setSuccess}
                  fetchUsers={fetchUsers}
                  fetchClasses={fetchClasses}
                  fetchStudents={fetchStudents}
                />
              } 
            />
            <Route 
              path="manage-classes" 
              element={
                <ManageClasses 
                  classes={classes}
                  users={users}
                  setClasses={setClasses}
                  loading={loading}
                  setLoading={setLoading}
                  error={setError}
                  success={setSuccess}
                  fetchClasses={fetchClasses}
                />
              } 
            />
            <Route 
              path="manage-students" 
              element={
                <ManageStudents 
                  students={students}
                  classes={classes}
                  setStudents={setStudents}
                  loading={loading}
                  setLoading={setLoading}
                  error={setError}
                  success={setSuccess}
                />
              } 
            />
            <Route 
              path="manage-lessons" 
              element={
                <ManageLessons 
                  classes={classes}
                  loading={loading}
                  setLoading={setLoading}
                  error={setError}
                  success={setSuccess}
                />
              } 
            />
            <Route 
              path="manage-materials" 
              element={
                <ManageMaterialsAdmin 
                  loading={loading}
                  setLoading={setLoading}
                  error={setError}
                  success={setSuccess}
                />
              } 
            />
            <Route 
            path="edit-homepage" 
            element={
            <AdminHomepageEditor 
              loading={loading}
              setLoading={setLoading}
              error={setError}
              success={setSuccess}
            />
              } 
            />
            <Route 
              path="notifications" 
              element={
                <AdminNotifications 
                  loading={loading}
                  setLoading={setLoading}
                  error={setError}
                  success={setSuccess}
                  onUnreadCountChange={setUnreadCount}
                />
              } 
            />
            <Route 
              path="registration-requests" 
              element={
                <AdminRegistrationForms 
                  loading={loading}
                  setLoading={setLoading}
                  error={setError}
                  success={setSuccess}
                />
              } 
            />
            <Route 
              path="my-profile" 
              element={
                <AdminProfile 
                  currentUser={user}
                />
              } 
            />
            <Route
              path="analytics/trainers/:trainerId/sessions"
              element={
                <AdminTrainerSessions
                  sessions={sessions}
                  classes={classes}
                />
              }
            />
            <Route 
              path="analytics/groups" 
              element={<AdminGroupAnalytics />} 
            />
            <Route
              path="analytics/trainers"
              element={
                <AdminTrainerAnalytics
                  users={users}
                  sessions={sessions}
                />
              }
            />
            <Route 
              path="analytics/attendance" 
              element={
                <AdminAttendanceTrends 
                  sessions={sessions}
                  classes={classes}
                />
              } 
            />
            <Route
              path="analytics/activity-log"
              element={<AdminActivityLog />}
            />
            <Route path="*" element={<Navigate to="dashboard" />} />
          </Routes>
        </div>
      </div>
    </div>
  );
};

export default AdminArea;
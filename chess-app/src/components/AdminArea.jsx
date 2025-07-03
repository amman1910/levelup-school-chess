import React, { useEffect, useState } from 'react';
import { NavLink, Routes, Route, useNavigate, Navigate, useLocation } from 'react-router-dom';
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
import chessLogo from './chessLogo.png';
import chessLogo3 from './chessLogo3.png'; 

import './AdminArea.css';

const AdminArea = () => {
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
  const navigate = useNavigate();
  const location = useLocation();

  // ניקוי הודעות כשמשנים route - הפתרון העיקרי!
  useEffect(() => {
    setError('');
    setSuccess('');
  }, [location.pathname]);

  useEffect(() => {
    const loggedInUser = localStorage.getItem('user');
    console.log('Raw user from localStorage:', loggedInUser);
    
    if (!loggedInUser) {
      console.log('No user in localStorage, redirecting to login');
      navigate('/login');
      return;
    }

    const userData = JSON.parse(loggedInUser);
    console.log('Parsed user data:', userData);
    
    if (userData.role !== 'admin') {
      console.log('User is not admin, redirecting to login');
      navigate('/login');
      return;
    }

    console.log('Setting user in AdminArea:', userData);
    setUser(userData);
  }, [navigate]);
  

  const fetchUsers = async () => {
    try {
      const usersSnapshot = await getDocs(collection(db, "users"));
      setUsers(usersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    } catch (err) {
      console.error('Error fetching users:', err);
      setError('Failed to load users data');
    }
  };

  const fetchClasses = async () => {
    try {
      const classesSnapshot = await getDocs(collection(db, "classes"));
      setClasses(classesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    } catch (err) {
      console.error('Error fetching classes:', err);
      setError('Failed to load classes data');
    }
  };

  const fetchStudents = async () => {
    try {
      const studentsSnapshot = await getDocs(collection(db, "students"));
      setStudents(studentsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    } catch (err) {
      console.error('Error fetching students:', err);
      setError('Failed to load students data');
    }
  };

  const fetchSchools = async () => {
    try {
      const schoolsSnapshot = await getDocs(collection(db, "schools"));
      setSchools(schoolsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    } catch (err) {
      console.error('Error fetching schools:', err);
      setError('Failed to load schools data');
    }
  };

  const fetchSessions = async () => {
    try {
      const snapshot = await getDocs(collection(db, "sessions"));
      setSessions(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    } catch (err) {
      console.error('Error fetching sessions:', err);
      setError('Failed to load sessions data');
    }
  };

  const fetchAllData = async () => {
    setLoading(true);
    try {
      await Promise.all([fetchUsers(), fetchClasses(), fetchStudents(), fetchSchools(), fetchSessions()]);
    } catch (err) {
      setError('Failed to load data');
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

  // Fetch unread notifications count in real-time
  useEffect(() => {
    if (!user?.uid) {
      console.log('No user uid found for notifications:', user);
      return;
    }

    // Use uid for the query since that's what's stored in notifications
    const userId = user.uid;
    console.log('Setting up unread notifications listener for admin ID:', userId);

    // Query for unread messages where admin is RECEIVER
    const q = query(
      collection(db, 'notifications'),
      where('receiverId', '==', userId),
      where('read', '==', false)
    );

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const unreadCount = querySnapshot.size;
      console.log('Unread notifications count:', unreadCount);
      setUnreadCount(unreadCount);
    }, (error) => {
      console.error('Error in unread notifications listener:', error);
    });

    return () => {
      console.log('Cleaning up unread notifications listener');
      unsubscribe();
    };
  }, [user]);

  // Fetch pending registration forms count in real-time
  useEffect(() => {
    if (!user?.uid) {
      console.log('No user uid found for registration forms:', user);
      return;
    }

    console.log('Setting up pending registration forms listener');

    // Query for all registration forms and filter pending ones
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
      
      console.log('Pending registration forms count:', pendingCount);
      setPendingRegistrationsCount(pendingCount);
    }, (error) => {
      console.error('Error in pending registration forms listener:', error);
    });

    return () => {
      console.log('Cleaning up pending registration forms listener');
      unsubscribe();
    };
  }, [user]);

  const handleLogout = () => {
    localStorage.removeItem('user');
    navigate('/login');
  };

  const getPageTitle = () => {
    if (location.pathname.includes('dashboard')) return 'Admin Dashboard';
    if (location.pathname.includes('manage-users')) return 'User Management';
    if (location.pathname.includes('trainer-monitoring')) return 'Performance & Analytics';
    if (location.pathname.includes('manage-classes')) return 'Class Management';
    if (location.pathname.includes('manage-students')) return 'Student Management';
    if (location.pathname.includes('manage-schools')) return 'School Management';
    if (location.pathname.includes('manage-lessons')) return 'Lesson Management';
    if (location.pathname.includes('manage-materials')) return 'Materials Management';
    if (location.pathname.includes('edit-homepage')) return 'Homepage Editor';
    if (location.pathname.includes('notifications')) return 'Notifications';
    if (location.pathname.includes('registration-requests')) return 'Registration Requests';
    if (location.pathname.includes('my-profile')) return 'My Profile';
    return 'Admin Area';
  };

  const handleRefresh = async () => {
    setError('');
    setSuccess('');
    await fetchAllData();
    setSuccess('Data refreshed successfully');
    setTimeout(() => setSuccess(''), 3000);
  };

  if (!user) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <div className="admin-area">
      <div className="admin-sidebar">
        <div className="logo-wrapper">
          <h2>LEVEL UP</h2>
          <div className="subtitle">Chess Club Management</div>
          <div className="logo-container">
            <img src={chessLogo} alt="Chess Logo" className="header-chess-logo" />
          </div>
        </div>
        
        <nav className="admin-nav">
          <NavLink to="/admin-area/dashboard" className={({ isActive }) => `admin-link ${isActive ? 'active' : ''}`}>
            Dashboard
          </NavLink>
          <NavLink to="/admin-area/manage-users" className={({ isActive }) => `admin-link ${isActive ? 'active' : ''}`}>
            Manage Users
          </NavLink>
          <NavLink to="/admin-area/manage-schools" className={({ isActive }) => `admin-link ${isActive ? 'active' : ''}`}>
            Manage Schools
          </NavLink>
          <NavLink to="/admin-area/manage-classes" className={({ isActive }) => `admin-link ${isActive ? 'active' : ''}`}>
            Manage Classes
          </NavLink>
          <NavLink to="/admin-area/manage-students" className={({ isActive }) => `admin-link ${isActive ? 'active' : ''}`}>
            Manage Students
          </NavLink>
          <NavLink to="/admin-area/manage-lessons" className={({ isActive }) => `admin-link ${isActive ? 'active' : ''}`}>
            Manage Sessions
          </NavLink>
          <NavLink to="/admin-area/manage-materials" className={({ isActive }) => `admin-link ${isActive ? 'active' : ''}`}>
            Manage Materials
          </NavLink>
          <NavLink to="/admin-area/trainer-monitoring" className={({ isActive }) => `admin-link ${isActive ? 'active' : ''}`}>
            Performance & Analytics
          </NavLink>
          <NavLink to="/admin-area/edit-homepage" className={({ isActive }) => `admin-link ${isActive ? 'active' : ''}`}>
            Edit Homepage
          </NavLink>
          <NavLink 
            to="/admin-area/notifications" 
            className={({ isActive }) => `admin-link ${isActive ? 'active' : ''} notifications-link`}
          >
            Notifications
            {unreadCount > 0 && (
              <span className="notification-badge">{unreadCount}</span>
            )}
          </NavLink>
          <NavLink 
            to="/admin-area/registration-requests" 
            className={({ isActive }) => `admin-link ${isActive ? 'active' : ''} registration-link`}
          >
            Registration Requests
            {pendingRegistrationsCount > 0 && (
              <span className="notification-badge">{pendingRegistrationsCount}</span>
            )}
          </NavLink>
          <NavLink to="/admin-area/my-profile" className={({ isActive }) => `admin-link ${isActive ? 'active' : ''}`}>
            My Profile
          </NavLink>
          
          {/* הוספת הלוגו מתחת לProfile */}
          <div className="nav-logo-container">
            <img src={chessLogo3} alt="Chess Logo" className="nav-chess-logo" />
          </div>
        </nav>
        
        <div className="admin-footer">
          <div className="user-info">
            <div className="user-email">{user.email}</div>
            <div className="user-role">Administrator</div>
          </div>
          <button 
            onClick={handleLogout} 
            className="logout-button"
            disabled={loading}
          >
            Logout
          </button>
        </div>
      </div>
      
      <div className="admin-content">
        <div className="admin-header">
          <h1 className="page-title">{getPageTitle()}</h1>
          <button 
            onClick={handleRefresh} 
            className="refresh-button"
            disabled={loading}
          >
            {loading ? 'Refreshing...' : '↻ Refresh Data'}
          </button>
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
                  onUnreadCountChange={setUnreadCount} // Note: unread count is now managed by AdminArea real-time listener
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
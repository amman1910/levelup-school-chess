import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../firebase';
import { collection, getDocs } from 'firebase/firestore';
import Dashboard from './Dashboard';
import ManageUsers from './ManageUsers';
import ManageClasses from './ManageClasses';
import ManageStudents from './ManageStudents';
import ManageLessons from './ManageLessons';
import './AdminArea.css';

const AdminArea = () => {
  const [user, setUser] = useState(null);
  const [section, setSection] = useState('dashboard');
  const [users, setUsers] = useState([]);
  const [classes, setClasses] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();

  // Fetch all data based on current section
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

    // Fetch data based on current section
    const fetchData = async () => {
      setLoading(true);
      try {
        switch(section) {
          case 'manageUsers':
            const usersSnapshot = await getDocs(collection(db, "users"));
            setUsers(usersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
            break;
          case 'manageClasses':
            const classesSnapshot = await getDocs(collection(db, "classes"));
            setClasses(classesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
            break;
          case 'manageStudents':
            const studentsSnapshot = await getDocs(collection(db, "students"));
            setStudents(studentsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
            break;
          default:
            // For dashboard, fetch all data
            const [usersRes, classesRes, studentsRes] = await Promise.all([
              getDocs(collection(db, "users")),
              getDocs(collection(db, "classes")),
              getDocs(collection(db, "students"))
            ]);
            setUsers(usersRes.docs.map(doc => ({ id: doc.id, ...doc.data() })));
            setClasses(classesRes.docs.map(doc => ({ id: doc.id, ...doc.data() })));
            setStudents(studentsRes.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        }
      } catch (err) {
        console.error(`Error fetching ${section} data:`, err);
        setError(`Failed to load ${section} data`);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [navigate, section]);

  const handleLogout = () => {
    localStorage.removeItem('user');
    navigate('/login');
  };

  const handleRefresh = async () => {
    setError('');
    setSuccess('');
    setLoading(true);
    try {
      const [usersRes, classesRes, studentsRes] = await Promise.all([
        getDocs(collection(db, "users")),
        getDocs(collection(db, "classes")),
        getDocs(collection(db, "students"))
      ]);
      setUsers(usersRes.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setClasses(classesRes.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setStudents(studentsRes.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setSuccess('Data refreshed successfully');
    } catch (err) {
      setError('Failed to refresh data');
    } finally {
      setLoading(false);
    }
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
        </div>
        
        <nav className="admin-nav">
          <button 
            className={section === 'dashboard' ? 'active' : ''} 
            onClick={() => setSection('dashboard')}
          >
            Dashboard
          </button>
          <button 
            className={section === 'manageUsers' ? 'active' : ''} 
            onClick={() => setSection('manageUsers')}
          >
            Manage Users
          </button>
          <button 
            className={section === 'manageClasses' ? 'active' : ''} 
            onClick={() => setSection('manageClasses')}
          >
            Manage Classes
          </button>
          <button 
            className={section === 'manageStudents' ? 'active' : ''} 
            onClick={() => setSection('manageStudents')}
          >
            Manage Students
          </button>
          <button 
            className={section === 'manageLessons' ? 'active' : ''} 
            onClick={() => setSection('manageLessons')}
          >
            Manage Lessons
          </button>
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
          <h1>
            {section === 'dashboard' && 'Admin Dashboard'}
            {section === 'manageUsers' && 'User Management'}
            {section === 'manageClasses' && 'Class Management'}
            {section === 'manageStudents' && 'Student Management'}
            {section === 'manageLessons' && 'Lesson Management'}
          </h1>
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
          
          {section === 'dashboard' && (
            <Dashboard 
              users={users} 
              classes={classes} 
              students={students}
              setSection={setSection}
            />
          )}
          
          {section === 'manageUsers' && (
            <ManageUsers 
              users={users}
              setUsers={setUsers}
              loading={loading}
              setLoading={setLoading}
              error={error}
              setError={setError}
              success={success}
              setSuccess={setSuccess}
            />
          )}
          
          {section === 'manageClasses' && (
            <ManageClasses 
              classes={classes}
              users={users}
              setClasses={setClasses}
              loading={loading}
              setLoading={setLoading}
              error={error}
              setError={setError}
              success={success}
              setSuccess={setSuccess}
            />
          )}
          
          {section === 'manageStudents' && (
            <ManageStudents 
              students={students}
              classes={classes}
              setStudents={setStudents}
              loading={loading}
              setLoading={setLoading}
              error={error}
              setSuccess={setSuccess}
            />
          )}
          
          {section === 'manageLessons' && (
            <ManageLessons 
              classes={classes}
              loading={loading}
              setLoading={setLoading}
              error={error}
              setError={setError}
              success={success}
              setSuccess={setSuccess}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminArea;
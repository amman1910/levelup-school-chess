import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../firebase';
import { collection, getDocs } from 'firebase/firestore';
import Dashboard from './Dashboard';
import ManageUsers from './ManageUsers';
import ManageClasses from './ManageClasses';
import ManageStudents from './ManageStudents';
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

    if (section === 'manageUsers') fetchUsers();
    if (section === 'manageClasses') fetchClasses();
    if (section === 'manageStudents') fetchStudents();
  }, [navigate, section]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const usersSnapshot = await getDocs(collection(db, "users"));
      const usersList = usersSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setUsers(usersList);
      setLoading(false);
    } catch (err) {
      console.error("Error fetching users:", err);
      setError("Failed to load users");
      setLoading(false);
    }
  };

  const fetchClasses = async () => {
    setLoading(true);
    try {
      const classesSnapshot = await getDocs(collection(db, "classes"));
      const classesList = classesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setClasses(classesList);
      setLoading(false);
    } catch (err) {
      console.error("Error fetching classes:", err);
      setError("Failed to load classes");
      setLoading(false);
    }
  };

  const fetchStudents = async () => {
    setLoading(true);
    try {
      const studentsSnapshot = await getDocs(collection(db, "students"));
      const studentsList = studentsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setStudents(studentsList);
      setLoading(false);
    } catch (err) {
      console.error("Error fetching students:", err);
      setError("Failed to load students");
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('user');
    navigate('/login');
  };

  if (!user) return <div className="loading">Loading...</div>;

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
        </nav>
        
        <div className="admin-footer">
          <div className="user-info">
            <div className="user-email">{user.email}</div>
            <div className="user-role">Administrator</div>
          </div>
          <button onClick={handleLogout} className="logout-button">Logout</button>
        </div>
      </div>
      
      <div className="admin-content">
        <div className="admin-header">
          <h1>
            {section === 'dashboard' && 'Admin Dashboard'}
            {section === 'manageUsers' && 'User Management'}
            {section === 'manageClasses' && 'Class Management'}
            {section === 'manageStudents' && 'Student Management'}
          </h1>
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
              error={setError}
              success={setSuccess}
              fetchUsers={fetchUsers}
            />
          )}
          {section === 'manageClasses' && (
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
          )}
          {section === 'manageStudents' && (
            <ManageStudents 
              students={students}
              classes={classes}
              setStudents={setStudents}
              loading={loading}
              setLoading={setLoading}
              error={setError}
              success={setSuccess}
              fetchStudents={fetchStudents}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminArea;
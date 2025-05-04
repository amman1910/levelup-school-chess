import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './TrainerArea.css';

const TrainerArea = () => {
  const [user, setUser] = useState(null);
  const [section, setSection] = useState('dashboard');
  const navigate = useNavigate();
  
  useEffect(() => {
    const loggedInUser = localStorage.getItem('user');
    if (!loggedInUser) {
      navigate('/login');
      return;
    }
    
    const userData = JSON.parse(loggedInUser);
    // Verify user is trainer
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
          <button 
            className={section === 'dashboard' ? 'active' : ''} 
            onClick={() => setSection('dashboard')}
          >
            Dashboard
          </button>
          <button 
            className={section === 'students' ? 'active' : ''} 
            onClick={() => setSection('students')}
          >
            My Students
          </button>
          <button 
            className={section === 'schedule' ? 'active' : ''} 
            onClick={() => setSection('schedule')}
          >
            Schedule
          </button>
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
          <h1>
            {section === 'dashboard' && 'Trainer Dashboard'}
            {section === 'students' && 'My Students'}
            {section === 'schedule' && 'Training Schedule'}
          </h1>
        </div>
        
        <div className="trainer-main">
          {section === 'dashboard' && (
            <div className="dashboard-content">
              <div className="welcome-card">
                <h2>Welcome, {user.firstName || 'Trainer'}!</h2>
                <p>This is your control panel for managing chess training sessions and student progress.</p>
                <p>Use the sidebar navigation to access different trainer functions.</p>
              </div>
              
              <div className="stats-overview">
                <div className="stat-card">
                  <h3>Students</h3>
                  <div className="stat-value">12</div>
                  <p className="stat-desc">Active students in your groups</p>
                </div>
                
                <div className="stat-card">
                  <h3>Sessions</h3>
                  <div className="stat-value">4</div>
                  <p className="stat-desc">Upcoming training sessions</p>
                </div>
                
                <div className="stat-card">
                  <h3>Tournaments</h3>
                  <div className="stat-value">1</div>
                  <p className="stat-desc">Upcoming tournaments</p>
                </div>
              </div>
              
              <div className="quick-actions">
                <h3>Quick Actions</h3>
                <div className="action-buttons">
                  <button onClick={() => setSection('students')} className="action-button">
                    View Students
                  </button>
                  <button onClick={() => setSection('schedule')} className="action-button">
                    Check Schedule
                  </button>
                </div>
              </div>
            </div>
          )}
          
          {section === 'students' && (
            <div className="students-placeholder">
              <div className="info-card">
                <h2>Students Management</h2>
                <p>This section will contain the student management interface.</p>
                <p>You'll be able to view student progress, add notes, and track performance.</p>
              </div>
            </div>
          )}
          
          {section === 'schedule' && (
            <div className="schedule-placeholder">
              <div className="info-card">
                <h2>Training Schedule</h2>
                <p>This section will contain your training sessions calendar.</p>
                <p>You'll be able to view upcoming sessions and manage your schedule.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TrainerArea;
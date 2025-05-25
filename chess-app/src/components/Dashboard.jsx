import React from 'react';

const Dashboard = ({ users, classes, students, setSection }) => {
  return (
    <div className="dashboard-content">
      <div className="welcome-card">
        <h2>Welcome !</h2>
        <p>This is your control panel for managing the LEVEL UP Chess Club system.</p>
        <p>_______________________________________________________________________</p>
        <p>Total Users: {users.length}</p>
        <p>Total Classes: {classes.length}</p>
        <p>Total Students: {students.length}</p>
      </div>
      
      <div className="quick-actions">
        <h3>Quick Actions</h3>
        <div className="action-buttons">
          <button onClick={() => setSection('manageUsers')} className="action-button">
            Manage Users
          </button>
          <button onClick={() => setSection('manageClasses')} className="action-button">
            Manage Classes
          </button>
          <button onClick={() => setSection('manageStudents')} className="action-button">
            Manage Students
          </button>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
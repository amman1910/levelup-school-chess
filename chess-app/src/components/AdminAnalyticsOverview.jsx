import React from 'react';
import { useNavigate } from 'react-router-dom';
import './AdminAnalyticsOverview.css';

const AdminAnalyticsOverview = ({
  users,
  classes,
  students,
  sessions,
  loading,
  setLoading,
  error,
  success,
  fetchUsers,
  fetchClasses,
  fetchStudents
}) => {
  const navigate = useNavigate();

  return (
    <div className="analytics-overview-page">
      <h2>Admin Analytics Overview</h2>
      <p className="subtitle-overview">Monitor and analyze platform activity</p>

      <div className="analytics-cards-grid">
        <div
          className="analytics-card"
          onClick={() => navigate('/admin-area/analytics/trainers')}
        >
          <div className="icon-wrapper">
            <i className="fas fa-chart-line"></i>
          </div>
          <h3>Trainer Analytics</h3>
          <p>View trainer activity, performance, and report generation</p>
        </div>

        <div
          className="analytics-card"
          onClick={() => navigate('/admin-area/analytics/groups')}
        >
          <div className="icon-wrapper">
            <i className="fas fa-users"></i>
          </div>
          <h3>Group Analytics</h3>
          <p>Analyze group progress, attendance trends, and participation</p>
        </div>

        <div
          className="analytics-card"
          onClick={() => navigate('/admin-area/analytics/attendance')}
        >
          <div className="icon-wrapper">
            <i className="fas fa-calendar-check"></i>
          </div>
          <h3>Attendance Trends</h3>
          <p>Track attendance patterns across all schools and classes</p>
        </div>
       





        <div
          className="analytics-card"
          onClick={() => navigate('/admin-area/analytics/activity-log')}
        >
          <div className="icon-wrapper">
            <i className="fas fa-clipboard-list"></i>
          </div>
          <h3>Users Activity Log</h3>
          <p>View logs of all users actions and changes</p>
        </div>
      </div>
    </div>
  );
};

export default AdminAnalyticsOverview;




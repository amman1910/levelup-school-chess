import React from 'react';
import { useTranslation } from 'react-i18next'; 
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
  const { t } = useTranslation(); 
  const navigate = useNavigate();

  return (
    <div className="analytics-overview-page">
      <h2>{t('adminAnalytics.adminAnalyticsOverview')}</h2>
      <p className="subtitle-overview">{t('adminAnalytics.monitorAndAnalyze')}</p>

      <div className="analytics-cards-grid">
        <div
          className="analytics-card"
          onClick={() => navigate('/admin-area/analytics/trainers')}
        >
          <div className="icon-wrapper">
            <i className="fas fa-chart-line"></i>
          </div>
          <h3>{t('adminAnalytics.trainerAnalytics')}</h3>
          <p>{t('adminAnalytics.trainerAnalyticsDesc')}</p>
        </div>

        <div
          className="analytics-card"
          onClick={() => navigate('/admin-area/analytics/groups')}
        >
          <div className="icon-wrapper">
            <i className="fas fa-users"></i>
          </div>
          <h3>{t('adminAnalytics.groupAnalytics')}</h3>
          <p>{t('adminAnalytics.groupAnalyticsDesc')}</p>
        </div>

        <div
          className="analytics-card"
          onClick={() => navigate('/admin-area/analytics/attendance')}
        >
          <div className="icon-wrapper">
            <i className="fas fa-calendar-check"></i>
          </div>
          <h3>{t('adminAnalytics.attendanceTrends')}</h3>
          <p>{t('adminAnalytics.attendanceTrendsDesc')}</p>
        </div>

        <div
          className="analytics-card"
          onClick={() => navigate('/admin-area/analytics/activity-log')}
        >
          <div className="icon-wrapper">
            <i className="fas fa-clipboard-list"></i>
          </div>
          <h3>{t('adminAnalytics.usersActivityLog')}</h3>
          <p>{t('adminAnalytics.usersActivityLogDesc')}</p>
        </div>
      </div>
    </div>
  );
};

export default AdminAnalyticsOverview;
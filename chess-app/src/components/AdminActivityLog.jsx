import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next'; // הוספת useTranslation
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '../firebase';
import './AdminAnalyticsOverview.css';

const AdminActivityLog = () => {
  const { t } = useTranslation(); // הוספת hook לתרגום
  
  const [logs, setLogs] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [filteredLogs, setFilteredLogs] = useState([]);

  // פונקציה לקבלת התפקיד של המשתמש לפי השם
  const getUserRole = (adminName) => {
    if (!adminName || adminName === 'Unknown Admin') return 'Unknown';
    
    // נחפש משתמש לפי השם המלא
    const user = users.find(user => {
      const fullName = `${user.firstName || ''} ${user.lastName || ''}`.trim();
      return fullName === adminName || user.email === adminName;
    });
    
    return user?.role || 'Unknown';
  };

  // פונקציה לעיצוב התפקיד
  const formatRole = (role) => {
    switch(role) {
      case 'admin':
        return t('adminActivityLog.administrator');
      case 'trainer':
        return t('adminActivityLog.trainer');
      default:
        return role || t('adminActivityLog.unknown');
    }
  };

  // פונקציה לקבלת צבע לפי תפקיד
  const getRoleColor = (role) => {
    switch(role) {
      case 'admin':
        return '#5e3c8f'; // סגול כהה
      case 'trainer':
        return '#e9c44c'; // צהוב זהב
      default:
        return '#666666'; // אפור
    }
  };

  // פונקציה לסינון הלוגים
  const filterLogs = () => {
    let filtered = [...logs];

    // סינון לפי שם משתמש
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(log => {
        const adminName = (log.adminName || '').toLowerCase();
        const description = (log.description || '').toLowerCase();
        const actionType = (log.actionType || '').toLowerCase();
        const targetType = (log.targetType || '').toLowerCase();
        
        return adminName.includes(query) || 
               description.includes(query) || 
               actionType.includes(query) || 
               targetType.includes(query);
      });
    }

    // סינון לפי תאריך
    if (dateFilter) {
      const selectedDate = new Date(dateFilter);
      selectedDate.setHours(0, 0, 0, 0);
      const nextDay = new Date(selectedDate);
      nextDay.setDate(nextDay.getDate() + 1);

      filtered = filtered.filter(log => {
        if (!log.timestamp) return false;
        
        let logDate;
        if (log.timestamp.seconds) {
          logDate = new Date(log.timestamp.seconds * 1000);
        } else if (log.timestamp instanceof Date) {
          logDate = log.timestamp;
        } else {
          logDate = new Date(log.timestamp);
        }
        
        return logDate >= selectedDate && logDate < nextDay;
      });
    }

    setFilteredLogs(filtered);
  };

  // עדכון הסינון כאשר משתנים החיפוש או התאריך
  useEffect(() => {
    filterLogs();
  }, [logs, searchQuery, dateFilter]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // שליפת כל המשתמשים
        const usersSnapshot = await getDocs(collection(db, 'users'));
        const usersData = usersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setUsers(usersData);
        
        // שליפת הלוגים
        const logsQuery = query(collection(db, 'adminLogs'), orderBy('timestamp', 'desc'));
        const logsSnapshot = await getDocs(logsQuery);
        const logsData = logsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setLogs(logsData);
        
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const formatDate = (timestamp) => {
    if (!timestamp) return '-';
    
    let date;
    if (timestamp.seconds) {
      // Firestore Timestamp
      date = new Date(timestamp.seconds * 1000);
    } else if (timestamp instanceof Date) {
      // JavaScript Date
      date = timestamp;
    } else {
      // Try to parse as string
      date = new Date(timestamp);
    }
    
    if (isNaN(date.getTime())) return '-';
    
    return `${date.toLocaleDateString()} ${date.toLocaleTimeString()}`;
  };

  const clearFilters = () => {
    setSearchQuery('');
    setDateFilter('');
  };

  if (loading) {
    return (
      <div className="trainer-analytics-page">
        <h2>{t('adminActivityLog.activityLog')}</h2>
        <p className="subtitle">{t('adminActivityLog.loadingActivityLogs')}</p>
      </div>
    );
  }

  return (
    <div className="trainer-analytics-page">
      <h2>{t('adminActivityLog.activityLog')}</h2>
      <p className="subtitle">{t('adminActivityLog.viewAllUserActions', { count: logs.length })}</p>

      {/* Search and Filter Section */}
      <div className="filters">
        <label>
          {t('adminActivityLog.searchUsersActions')}
          <input
            type="text"
            placeholder={t('adminActivityLog.searchPlaceholder')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ minWidth: '300px' }}
          />
        </label>

        <label>
          {t('adminActivityLog.filterByDate')}
          <input
            type="date"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
          />
        </label>

        {(searchQuery || dateFilter) && (
          <button onClick={clearFilters} style={{ backgroundColor: '#dc3545' }}>
            {t('adminActivityLog.clearFilters')}
          </button>
        )}
      </div>

      {/* Results Info */}
      {(searchQuery || dateFilter) && (
        <div style={{ 
          marginBottom: '1rem', 
          padding: '0.5rem', 
          backgroundColor: '#f8f9fa', 
          borderRadius: '6px',
          fontSize: '0.9rem',
          color: '#666'
        }}>
          {t('adminActivityLog.showingResults', { filtered: filteredLogs.length, total: logs.length })}
          {searchQuery && ` ${t('adminActivityLog.matchingSearch', { query: searchQuery })}`}
          {dateFilter && ` ${t('adminActivityLog.onDate', { date: new Date(dateFilter).toLocaleDateString() })}`}
        </div>
      )}

      <div className="trainer-table-wrapper">
        <table className="trainer-table">
          <thead>
            <tr>
              <th>{t('adminActivityLog.timestamp')}</th>
              <th>{t('adminActivityLog.userName')}</th>
              <th>{t('adminActivityLog.role')}</th>
              <th>{t('adminActivityLog.action')}</th>
              <th>{t('adminActivityLog.targetType')}</th>
              <th>{t('adminActivityLog.description')}</th>
            </tr>
          </thead>
          <tbody>
            {filteredLogs.length > 0 ? (
              filteredLogs.map((log, i) => {
                const userRole = getUserRole(log.adminName);
                return (
                  <tr key={i}>
                    <td>{formatDate(log.timestamp)}</td>
                    <td>{log.adminName || t('adminActivityLog.unknownUser')}</td>
                    <td>
                      <span 
                        style={{ 
                          color: getRoleColor(userRole),
                          fontWeight: '600',
                          textTransform: 'capitalize'
                        }}
                      >
                        {formatRole(userRole)}
                      </span>
                    </td>
                    <td>
                      <span 
                        style={{ 
                          fontFamily: 'monospace',
                          backgroundColor: '#f0f0f0',
                          padding: '2px 6px',
                          borderRadius: '4px',
                          fontSize: '12px'
                        }}
                      >
                        {log.actionType}
                      </span>
                    </td>
                    <td>
                      <span 
                        style={{ 
                          textTransform: 'capitalize',
                          color: '#666'
                        }}
                      >
                        {log.targetType}
                      </span>
                    </td>
                    <td style={{ maxWidth: '300px' }}>
                      {log.description || '-'}
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan="6" style={{ textAlign: 'center', padding: '40px' }}>
                  {(searchQuery || dateFilter) 
                    ? t('adminActivityLog.noActivityLogsMatch')
                    : t('adminActivityLog.noActivityLogsAvailable')
                  }
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      
      {/* סטטיסטיקות מהירות */}
      <div className="log-stats" style={{ marginTop: '20px', display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
        <div style={{ 
          backgroundColor: '#f8f9fa', 
          padding: '15px', 
          borderRadius: '8px',
          border: '1px solid #e9ecef',
          minWidth: '140px'
        }}>
          <strong>{t('adminActivityLog.totalActions')}:</strong> {logs.length}
        </div>
        
        <div style={{ 
          backgroundColor: '#f8f9fa', 
          padding: '15px', 
          borderRadius: '8px',
          border: '1px solid #e9ecef',
          minWidth: '140px'
        }}>
          <strong>{t('adminActivityLog.filteredResults')}:</strong> {filteredLogs.length}
        </div>
        
        <div style={{ 
          backgroundColor: '#f8f9fa', 
          padding: '15px', 
          borderRadius: '8px',
          border: '1px solid #e9ecef',
          minWidth: '140px'
        }}>
          <strong>{t('adminActivityLog.adminActions')}:</strong> {filteredLogs.filter(log => getUserRole(log.adminName) === 'admin').length}
        </div>
        
        <div style={{ 
          backgroundColor: '#f8f9fa', 
          padding: '15px', 
          borderRadius: '8px',
          border: '1px solid #e9ecef',
          minWidth: '140px'
        }}>
          <strong>{t('adminActivityLog.trainerActions')}:</strong> {filteredLogs.filter(log => getUserRole(log.adminName) === 'trainer').length}
        </div>
        
        <div style={{ 
          backgroundColor: '#f8f9fa', 
          padding: '15px', 
          borderRadius: '8px',
          border: '1px solid #e9ecef',
          minWidth: '140px'
        }}>
          <strong>{t('adminActivityLog.activeUsers')}:</strong> {new Set(filteredLogs.map(log => log.adminName)).size}
        </div>
      </div>
    </div>
  );
};

export default AdminActivityLog;
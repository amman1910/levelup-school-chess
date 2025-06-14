import React, { useEffect, useState } from 'react';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '../firebase';
import './AdminAnalyticsOverview.css';

const AdminActivityLog = () => {
  const [logs, setLogs] = useState([]);

  useEffect(() => {
    const fetchLogs = async () => {
      const q = query(collection(db, 'adminLogs'), orderBy('timestamp', 'desc'));
      const snapshot = await getDocs(q);
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setLogs(data);
    };

    fetchLogs();
  }, []);

  const formatDate = (timestamp) => {
    if (!timestamp?.seconds) return '-';
    const date = new Date(timestamp.seconds * 1000);
    return `${date.toLocaleDateString()} ${date.toLocaleTimeString()}`;
  };

  return (
    <div className="trainer-analytics-page">
      <h2>Admin Activity Log</h2>
      <p className="subtitle">View all admin actions and changes</p>

      <div className="trainer-table-wrapper">
        <table className="trainer-table">
          <thead>
            <tr>
              <th>Timestamp</th>
              <th>Admin Name</th>
              <th>Action</th>
              <th>Target Type</th>
              <th>Target ID</th>
              <th>Description</th>
            </tr>
          </thead>
          <tbody>
            {logs.length > 0 ? (
              logs.map((log, i) => (
                <tr key={i}>
                  <td>{formatDate(log.timestamp)}</td>
                  <td>{log.adminName || '-'}</td>
                  <td>{log.actionType}</td>
                  <td>{log.targetType}</td>
                  <td>{log.targetId}</td>
                  <td>{log.description || '-'}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="6" style={{ textAlign: 'center' }}>No logs available.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminActivityLog;

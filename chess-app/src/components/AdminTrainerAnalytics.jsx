import React, { useEffect, useState } from 'react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { useNavigate } from 'react-router-dom';

import './AdminAnalyticsOverview.css'; // نفس ملف الستايل

const AdminTrainerAnalytics = ({ users, sessions }) => {
  const [filteredStats, setFilteredStats] = useState([]);
  const [selectedTrainer, setSelectedTrainer] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');


  const navigate = useNavigate();

  const formatDate = (dateObj) => {
    const d = typeof dateObj === 'string' ? new Date(dateObj) : new Date(dateObj?.seconds * 1000);
    return `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getFullYear()}`;
  };

  const filterSessionsByDate = (sessionsList) => {
    return sessionsList.filter((s) => {
      const sessionDate = new Date(s.date?.seconds * 1000);
      const from = fromDate ? new Date(fromDate) : null;
      const to = toDate ? new Date(toDate) : null;
      return (!from || sessionDate >= from) && (!to || sessionDate <= to);
    });
  };

  useEffect(() => {
    if (!users || !sessions) return;

    const trainers = users.filter(u => u.role === 'trainer');
    const filtered = [];

    trainers.forEach(trainer => {
      if (selectedTrainer && trainer.id !== selectedTrainer) return;

      const trainerSessions = filterSessionsByDate(
        sessions.filter(s => s.trainerId === trainer.id)
      );

      const total = trainerSessions.length;
      const completed = trainerSessions.filter(s => s.status === true).length;
      const percent = total > 0 ? Math.round((completed / total) * 100) : 0;
      const last = trainerSessions.sort((a, b) => new Date(b.date?.seconds * 1000) - new Date(a.date?.seconds * 1000))[0];

      filtered.push({
        id: trainer.id,
        name: `${trainer.firstName} ${trainer.lastName}`,
        email: trainer.email,
        total,
        completed,
        percent,
        lastDate: last ? formatDate(last.date) : '-',
      });
    });

    setFilteredStats(filtered);
  }, [users, sessions, selectedTrainer, fromDate, toDate]);

  

  const handleExportPDF = () => {
    const doc = new jsPDF();
    doc.text("Trainer Analytics Report", 14, 10);

    const body = filteredStats.map(t => [
      t.name,
      t.email,
      t.total,
      t.completed,
      `${t.percent}%`,
      t.lastDate
    ]);

    autoTable(doc, {
      head: [['Trainer Name', 'Email', 'Total Sessions', 'Completed', '% Completion', 'Last Session']],
      body,
      startY: 20,
      styles: { fontSize: 9 },
      headStyles: { fillColor: [94, 60, 143] },
    });

    doc.save("Trainer_Analytics_Report.pdf");
  };

  const resetFilters = () => {
    setSelectedTrainer('');
    setFromDate('');
    setToDate('');
  };

  const totalTrainers = filteredStats.length;
  const totalSessions = filteredStats.reduce((acc, curr) => acc + curr.total, 0);
  const avgCompletion = totalTrainers > 0 ? Math.round(filteredStats.reduce((acc, curr) => acc + curr.percent, 0) / totalTrainers) : 0;

  return (
    <div className="trainer-analytics-page">
      <h2>Trainer Analytics</h2>
      <p className="subtitle">Track performance and activity of trainers</p>

      {/* KPIs */}
      <div className="analytics-kpi-grid">
        <div className="kpi-card">
          <div className="kpi-title">🧑‍🏫 Total Trainers</div>
          <div className="kpi-value">{totalTrainers}</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-title">📆 Total Sessions</div>
          <div className="kpi-value">{totalSessions}</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-title">✅ Avg Completion</div>
          <div className="kpi-value">{avgCompletion}%</div>
        </div>
      </div>

      {/* Filters */}
      <div className="filters">
        <label>
          Trainer:
          <select value={selectedTrainer} onChange={(e) => setSelectedTrainer(e.target.value)}>
            <option value="">All</option>
            {users.filter(u => u.role === 'trainer').map((t) => (
              <option key={t.id} value={t.id}>{t.firstName} {t.lastName}</option>
            ))}
          </select>
        </label>

        <label>
          From:
          <input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} />
        </label>
        <label>
          To:
          <input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} />
        </label>

        <button onClick={resetFilters}>Clear Filters</button>
        <button onClick={handleExportPDF}>📥 Export PDF</button>
      </div>

      {/* Table */}
      <div className="trainer-table-wrapper">
        <table className="trainer-table">
          <thead>
            <tr>
              <th>Trainer Name</th>
              <th>Email</th>
              <th>Total Sessions</th>
              <th>Completed</th>
              <th>% Completion</th>
              <th>Last Session</th>
              <th>Details</th>
            </tr>
          </thead>
          <tbody>
            {filteredStats.length > 0 ? (
              filteredStats.map((t, i) => (
                <tr key={i}>
                  <td>{t.name}</td>
                  <td>{t.email}</td>
                  <td>{t.total}</td>
                  <td>{t.completed}</td>
                  <td>{t.percent}%</td>
                  <td>{t.lastDate}</td>
                  <td>
                    <button onClick={() => navigate(`/admin-area/analytics/trainers/${t.id}/sessions`)}>
                      View Sessions
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="7" style={{ textAlign: 'center' }}>No data found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminTrainerAnalytics;


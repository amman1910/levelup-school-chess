import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next'; 
import pdfMake from "pdfmake/build/pdfmake";
import "../fonts/cairo-font";
import { useNavigate } from 'react-router-dom';
import logo from '../assets/logos/shahtranj_logo_gold.png';

import './AdminAnalyticsOverview.css'; 

const AdminTrainerAnalytics = ({ users, sessions }) => {
  const { t } = useTranslation(); 
  
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
  const body = [
    [
    { text: t('adminTrainerAnalytics.lastSession'), style: 'tableHeader', alignment: 'right', direction: 'rtl' },
    { text: t('adminTrainerAnalytics.completionPercent'), style: 'tableHeader', alignment: 'right', direction: 'rtl' },
    { text: t('adminTrainerAnalytics.completed'), style: 'tableHeader', alignment: 'right', direction: 'rtl' },
    { text: t('adminTrainerAnalytics.totalSessions'), style: 'tableHeader', alignment: 'right', direction: 'rtl' },
    { text: t('adminTrainerAnalytics.email'), style: 'tableHeader', alignment: 'right', direction: 'rtl' },
    { text: t('adminTrainerAnalytics.trainerName'), style: 'tableHeader', alignment: 'right', direction: 'rtl' }
  ],

    ...filteredStats.map(trainer => [
  trainer.lastDate,
  `${trainer.percent}%`,
  trainer.completed.toString(),
  trainer.total.toString(),
  trainer.email,
  trainer.name
])

  ];

  const docDefinition = {
    pageOrientation: 'landscape',

    content: [
      {
        text: t('adminTrainerAnalytics.trainerAnalyticsReport'),
        style: 'header',
        alignment: 'right',
      },
      {
        text: `${t('adminTrainerAnalytics.generatedOn')} ${new Date().toLocaleDateString()}`,
        style: 'subheader',
        alignment: 'right',
        margin: [0, 0, 0, 20]
      },
      {
       table: {
  headerRows: 1,
  widths: ['auto', 'auto', 'auto', 'auto', 'auto', 'auto'],
  body: body
},
layout: {
  fillColor: (rowIndex) => (rowIndex === 0 ? '#5e3c8f' : null),
  paddingLeft: () => 6,
  paddingRight: () => 6,
  paddingTop: () => 4,
  paddingBottom: () => 4,
  hLineWidth: () => 0.5,
  vLineWidth: () => 0.5,
  hLineColor: () => '#ccc',
  vLineColor: () => '#ccc',
},

      }
    ],
    defaultStyle: {
      font: 'Cairo', 
      alignment: 'right',
      direction: 'rtl'
    },
    styles: {
      header: {
        fontSize: 18,
        bold: true,
        margin: [0, 0, 0, 10]
      },
      subheader: {
        fontSize: 11,
        color: 'gray'
      },
      tableHeader: {
        bold: true,
        fontSize: 12,
        color: 'white',
        fillColor: '#5e3c8f',
      }
    }
  };

  pdfMake.createPdf(docDefinition).download("Trainer_Analytics_Report.pdf");
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
      <h2>{t('adminTrainerAnalytics.trainerAnalytics')}</h2>
      <p className="subtitle">{t('adminTrainerAnalytics.trackPerformance')}</p>

      <div className="analytics-kpi-grid">
        <div className="kpi-card">
          <div className="kpi-title">🧑‍🏫 {t('adminTrainerAnalytics.totalTrainers')}</div>
          <div className="kpi-value">{totalTrainers}</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-title">📆 {t('adminTrainerAnalytics.totalSessions')}</div>
          <div className="kpi-value">{totalSessions}</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-title">✅ {t('adminTrainerAnalytics.avgCompletion')}</div>
          <div className="kpi-value">{avgCompletion}%</div>
        </div>
      </div>

      <div className="filters">
        <label>
          {t('adminTrainerAnalytics.trainer')}
          <select value={selectedTrainer} onChange={(e) => setSelectedTrainer(e.target.value)}>
            <option value="">{t('adminTrainerAnalytics.all')}</option>
            {users.filter(u => u.role === 'trainer').map((trainer) => (
              <option key={trainer.id} value={trainer.id}>{trainer.firstName} {trainer.lastName}</option>
            ))}
          </select>
        </label>

        <label>
          {t('adminTrainerAnalytics.from')}
          <input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} />
        </label>
        <label>
          {t('adminTrainerAnalytics.to')}
          <input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} />
        </label>

        <button onClick={resetFilters}>{t('adminTrainerAnalytics.clearFilters')}</button>
        <button onClick={handleExportPDF}>📥 {t('adminTrainerAnalytics.exportPdf')}</button>
      </div>

      <div className="trainer-table-wrapper">
        <table className="trainer-table">
          <thead>
            <tr>
              <th>{t('adminTrainerAnalytics.trainerName')}</th>
              <th>{t('adminTrainerAnalytics.email')}</th>
              <th>{t('adminTrainerAnalytics.totalSessions')}</th>
              <th>{t('adminTrainerAnalytics.completed')}</th>
              <th>{t('adminTrainerAnalytics.completionPercent')}</th>
              <th>{t('adminTrainerAnalytics.lastSession')}</th>
              <th>{t('adminTrainerAnalytics.details')}</th>
            </tr>
          </thead>
          <tbody>
            {filteredStats.length > 0 ? (
              filteredStats.map((trainer, i) => (
                <tr key={i}>
                  <td>{trainer.name}</td>
                  <td>{trainer.email}</td>
                  <td>{trainer.total}</td>
                  <td>{trainer.completed}</td>
                  <td>{trainer.percent}%</td>
                  <td>{trainer.lastDate}</td>
                  <td>
                    <button onClick={() => navigate(`/admin-area/analytics/trainers/${trainer.id}/sessions`)}>
                      {t('adminTrainerAnalytics.viewSessions')}
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="7" style={{ textAlign: 'center' }}>{t('adminTrainerAnalytics.noDataFound')}</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminTrainerAnalytics;
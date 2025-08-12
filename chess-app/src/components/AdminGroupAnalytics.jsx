import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next'; 
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import './AdminAnalyticsOverview.css';
import logo from '../assets/logos/shahtranj_logo_gold.png';

const AdminGroupAnalytics = () => {
  const { t } = useTranslation(); 
  
  const [groups, setGroups] = useState([]);
  const [selectedSchool, setSelectedSchool] = useState('');
  const [allSchools, setAllSchools] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      const classesSnap = await getDocs(collection(db, 'classes'));
      const sessionsSnap = await getDocs(collection(db, 'sessions'));

      const sessions = sessionsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      const schoolSet = new Set();

      const classesList = await Promise.all(classesSnap.docs.map(async classDoc => {
        const classData = classDoc.data();
        const classId = classDoc.id;
        const school = classData.school || 'Unknown';
        schoolSet.add(school);

        const classSessions = sessions.filter(s => s.classId === classId);
        const studentIds = classData.studentsId || [];
        const studentCount = studentIds.length;
        const sessionCount = classSessions.length;

        let totalAttendance = 0;
        classSessions.forEach(s => {
          if (s.attendance) {
            totalAttendance += Object.values(s.attendance).filter(p => p).length;
          }
        });

        const totalPossible = studentCount * sessionCount || 1;
        const attendancePercentage = ((totalAttendance / totalPossible) * 100).toFixed(1);

        const lastSession = classSessions.reduce((latest, curr) => {
          const currDate = curr.date?.seconds ? new Date(curr.date.seconds * 1000) : null;
          if (!currDate) return latest;
          return (!latest || currDate > latest) ? currDate : latest;
        }, null);

        return {
          id: classId,
          className: classData.className,
          school,
          studentCount,
          sessionCount,
          attendancePercentage,
          lastSession: lastSession ? lastSession.toLocaleDateString() : '-'
        };
      }));

      setGroups(classesList);
      setAllSchools([...schoolSet]);
    };

    fetchData();
  }, []);

  const filteredGroups = selectedSchool
    ? groups.filter(g => g.school === selectedSchool)
    : groups;

  const totalGroups = filteredGroups.length;
  const totalSessions = filteredGroups.reduce((sum, g) => sum + g.sessionCount, 0);
  const avgAttendance = totalGroups > 0
    ? (filteredGroups.reduce((sum, g) => sum + parseFloat(g.attendancePercentage), 0) / totalGroups).toFixed(1)
    : 0;

  const handleExportPDF = () => {
    const doc = new jsPDF();
    const img = new Image();
    img.src = logo;

    img.onload = () => {
      doc.addImage(img, 'PNG', 150, 10, 40, 25);

      doc.setFontSize(18);
      doc.setTextColor(40);
      doc.text(`📊 ${t('adminGroupAnalytics.groupAnalyticsReport')}`, 14, 20);

      doc.setFontSize(10);
      doc.setTextColor(100);
      doc.text(`${t('adminGroupAnalytics.generatedOn')} ${new Date().toLocaleDateString()}`, 14, 28);

      const body = filteredGroups.map(g => [
        g.className,
        g.school,
        g.studentCount,
        g.sessionCount,
        `${g.attendancePercentage}%`,
        g.lastSession
      ]);

      autoTable(doc, {
        startY: 35,
        head: [[
          t('adminGroupAnalytics.class'), 
          t('adminGroupAnalytics.schoolColumn'), 
          t('adminGroupAnalytics.students'), 
          t('adminGroupAnalytics.sessions'), 
          t('adminGroupAnalytics.attendancePercent'), 
          t('adminGroupAnalytics.lastSession')
        ]],
        body,
        styles: { fontSize: 9 },
        headStyles: { fillColor: [94, 60, 143], textColor: 255 },
      });

      const pageCount = doc.internal.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(9);
        doc.text(t('adminGroupAnalytics.pageOf', { current: i, total: pageCount }), 200, 290, { align: 'right' });
      }

      doc.save("Group_Analytics_Report.pdf");
    };
  };

  return (
    <div className="trainer-analytics-page">
      <h2>{t('adminGroupAnalytics.groupAnalytics')}</h2>
      <p className="subtitle">{t('adminGroupAnalytics.monitorPerformance')}</p>

      {/* KPIs */}
      <div className="analytics-kpi-grid">
        <div className="kpi-card">
          <div className="kpi-title">🏫 {t('adminGroupAnalytics.totalGroups')}</div>
          <div className="kpi-value">{totalGroups}</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-title">📆 {t('adminGroupAnalytics.totalSessions')}</div>
          <div className="kpi-value">{totalSessions}</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-title">✅ {t('adminGroupAnalytics.avgAttendance')}</div>
          <div className="kpi-value">{avgAttendance}%</div>
        </div>
      </div>

      {/* Filter */}
      <div className="filters">
        <label>
          {t('adminGroupAnalytics.school')}
          <select value={selectedSchool} onChange={(e) => setSelectedSchool(e.target.value)}>
            <option value="">{t('adminGroupAnalytics.all')}</option>
            {allSchools.map((school, idx) => (
              <option key={idx} value={school}>{school}</option>
            ))}
          </select>
        </label>
        <button onClick={() => setSelectedSchool('')}>
          {t('adminGroupAnalytics.clearFilter')}
        </button>
        <button onClick={handleExportPDF}>
          📥 {t('adminGroupAnalytics.exportPdf')}
        </button>
      </div>

      {/* Table */}
      <div className="trainer-table-wrapper">
        <table className="trainer-table">
          <thead>
            <tr>
              <th>{t('adminGroupAnalytics.class')}</th>
              <th>{t('adminGroupAnalytics.schoolColumn')}</th>
              <th>{t('adminGroupAnalytics.students')}</th>
              <th>{t('adminGroupAnalytics.sessions')}</th>
              <th>{t('adminGroupAnalytics.attendancePercent')}</th>
              <th>{t('adminGroupAnalytics.lastSession')}</th>
            </tr>
          </thead>
          <tbody>
            {filteredGroups.length > 0 ? (
              filteredGroups.map((g, i) => (
                <tr key={i}>
                  <td>{g.className}</td>
                  <td>{g.school}</td>
                  <td>{g.studentCount}</td>
                  <td>{g.sessionCount}</td>
                  <td>{g.attendancePercentage}%</td>
                  <td>{g.lastSession}</td>
                </tr>
              ))
            ) : (
              <tr><td colSpan="6" style={{ textAlign: 'center' }}>{t('adminGroupAnalytics.noGroupsFound')}</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminGroupAnalytics;
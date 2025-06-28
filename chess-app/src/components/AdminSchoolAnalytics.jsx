// AdminSchoolAnalytics.jsx
import React, { useEffect, useState } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

import './AdminAnalyticsOverview.css';

const AdminSchoolAnalytics = () => {
  const [schools, setSchools] = useState([]);
  const [classes, setClasses] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [selectedSchool, setSelectedSchool] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      const schoolsSnap = await getDocs(collection(db, 'schools'));
      const classesSnap = await getDocs(collection(db, 'classes'));
      const sessionsSnap = await getDocs(collection(db, 'sessions'));

      setSchools(schoolsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setClasses(classesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setSessions(sessionsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    };
    fetchData();
  }, []);

  const getStatsForSchool = (schoolId) => {
    const schoolClasses = classes.filter(c => c.schoolId === schoolId);
    const classIds = schoolClasses.map(c => c.id);
    const studentsCount = schoolClasses.reduce((sum, c) => sum + (c.studentsId?.length || 0), 0);
    const trainersSet = new Set(schoolClasses.map(c => c.assignedTrainer).filter(Boolean));
    const relatedSessions = sessions.filter(s => classIds.includes(s.classId));

    let totalAttendance = 0;
    let totalPossible = 0;
    relatedSessions.forEach(session => {
      const attendance = session.attendance || {};
      totalAttendance += Object.values(attendance).filter(p => p).length;
      totalPossible += Object.keys(attendance).length;
    });

    const avgAttendance = totalPossible ? ((totalAttendance / totalPossible) * 100).toFixed(1) : '0';

    return {
      totalClasses: schoolClasses.length,
      studentsCount,
      sessionsCount: relatedSessions.length,
      trainersCount: trainersSet.size,
      avgAttendance
    };
  };

  const filteredSchools = selectedSchool
    ? schools.filter(s => s.id === selectedSchool)
    : schools;

  const handleExportPDF = () => {
    const doc = new jsPDF();
    doc.text("School Analytics Report", 14, 10);

    const body = filteredSchools.map(school => {
      const stats = getStatsForSchool(school.id);
      return [
        school.name,
        stats.totalClasses,
        stats.studentsCount,
        stats.sessionsCount,
        stats.trainersCount,
        `${stats.avgAttendance}%`
      ];
    });

    autoTable(doc, {
      head: [['School', 'Classes', 'Students', 'Sessions', 'Trainers', 'Attendance %']],
      body,
      startY: 20,
      styles: { fontSize: 9 },
      headStyles: { fillColor: [94, 60, 143] },
    });

    doc.save("School_Analytics_Report.pdf");
  };

  return (
    <div className="trainer-analytics-page">
      <h2>School Analytics</h2>
      <p className="subtitle">Track school coverage and performance</p>

      {/* KPIs */}
      <div className="analytics-kpi-grid">
        <div className="kpi-card">
          <div className="kpi-title">🏫 Total Schools</div>
          <div className="kpi-value">{filteredSchools.length}</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-title">👥 Total Students</div>
          <div className="kpi-value">{
            filteredSchools.reduce((sum, s) => sum + getStatsForSchool(s.id).studentsCount, 0)
          }</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-title">📚 Total Classes</div>
          <div className="kpi-value">{
            filteredSchools.reduce((sum, s) => sum + getStatsForSchool(s.id).totalClasses, 0)
          }</div>
        </div>
      </div>

      {/* Filters */}
      <div className="filters">
        <label>
          School:
          <select value={selectedSchool} onChange={(e) => setSelectedSchool(e.target.value)}>
            <option value="">All</option>
            {schools.map((school) => (
              <option key={school.id} value={school.id}>{school.name}</option>
            ))}
          </select>
        </label>
        <button onClick={() => setSelectedSchool('')}>Clear Filter</button>
        <button onClick={handleExportPDF}>📥 Export PDF</button>
      </div>

      {/* Table */}
      <div className="trainer-table-wrapper">
        <table className="trainer-table">
          <thead>
            <tr>
              <th>School</th>
              <th>Classes</th>
              <th>Students</th>
              <th>Sessions</th>
              <th>Trainers</th>
              <th>Attendance %</th>
            </tr>
          </thead>
          <tbody>
            {filteredSchools.map((school, i) => {
              const stats = getStatsForSchool(school.id);
              return (
                <tr key={i}>
                  <td>{school.name}</td>
                  <td>{stats.totalClasses}</td>
                  <td>{stats.studentsCount}</td>
                  <td>{stats.sessionsCount}</td>
                  <td>{stats.trainersCount}</td>
                  <td>{stats.avgAttendance}%</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminSchoolAnalytics;


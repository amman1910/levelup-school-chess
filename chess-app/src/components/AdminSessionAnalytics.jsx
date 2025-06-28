// AdminSessionAnalytics.jsx
import React, { useEffect, useState } from 'react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { getDoc, doc } from 'firebase/firestore';
import { db } from '../firebase';
import './AdminAnalyticsOverview.css';

const AdminSessionAnalytics = ({ sessions, classes, users }) => {
  const [selectedSchool, setSelectedSchool] = useState('');
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedSession, setSelectedSession] = useState(null);
  const [studentAttendance, setStudentAttendance] = useState([]);

  const getClassById = (id) => classes.find(c => c.id === id) || {};
  const getTrainerById = (id) => users.find(u => u.id === id) || {};

  const allSchools = [...new Set(classes.map(cls => cls.school))];
  const classOptions = selectedSchool
    ? classes.filter(c => c.school === selectedSchool)
    : classes;

  const filteredSessions = sessions.filter(s => {
    const cls = getClassById(s.classId);
    if (selectedSchool && cls.school !== selectedSchool) return false;
    if (selectedClass && cls.id !== selectedClass) return false;
    return true;
  });

  const handleExportPDF = () => {
    const doc = new jsPDF();
    doc.text("Sessions Report", 14, 10);

    const body = filteredSessions.map(s => {
      const cls = getClassById(s.classId);
      const trainer = getTrainerById(s.trainerId);
      const present = Object.values(s.attendance || {}).filter(p => p).length;
      const total = Object.keys(s.attendance || {}).length;

      return [
        new Date(s.date?.seconds * 1000).toLocaleDateString(),
        cls.className || '-',
        cls.school || '-',
        `${trainer.firstName || ''} ${trainer.lastName || ''}`.trim(),
        s.status ? '✅ Completed' : '⏳ Pending',
        `${present}/${total}`
      ];
    });

    autoTable(doc, {
      head: [['Date', 'Class', 'School', 'Trainer', 'Status', 'Attendance']],
      body,
      startY: 20,
      styles: { fontSize: 9 },
      headStyles: { fillColor: [94, 60, 143] },
    });

    doc.save("Session_Analytics_Report.pdf");
  };

  const formatDate = (dateObj) => {
    if (!dateObj) return '-';
    const d = new Date(dateObj.seconds * 1000);
    return `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getFullYear()}`;
  };

  const handleViewDetails = (session) => {
    setSelectedSession(session);
  };

  const handleCloseModal = () => {
    setSelectedSession(null);
  };

  useEffect(() => {
    const fetchStudentAttendance = async () => {
      if (!selectedSession?.attendance) {
        setStudentAttendance([]);
        return;
      }

      const entries = Object.entries(selectedSession.attendance);
      const studentsData = await Promise.all(
        entries.map(async ([id, present]) => {
          try {
            const docSnap = await getDoc(doc(db, 'students', id));
            const name = docSnap.exists() ? docSnap.data().fullName || id : id;
            return { name, present };
          } catch (error) {
            console.error('Error fetching student', id, error);
            return { name: id, present };
          }
        })
      );
      setStudentAttendance(studentsData);
    };

    fetchStudentAttendance();
  }, [selectedSession]);

  const getRatingStars = (rating) => '⭐'.repeat(rating || 0);

  return (
    <div className="trainer-analytics-page">
      <h2>Sessions Overview</h2>
      <p className="subtitle">Track all sessions across schools and classes</p>

      {/* KPIs */}
      <div className="analytics-kpi-grid">
        <div className="kpi-card">
          <div className="kpi-title">🗓️ Total Sessions</div>
          <div className="kpi-value">{filteredSessions.length}</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-title">✅ Completed</div>
          <div className="kpi-value">{filteredSessions.filter(s => s.status).length}</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-title">⏳ Pending</div>
          <div className="kpi-value">{filteredSessions.filter(s => !s.status).length}</div>
        </div>
      </div>

      {/* Filters */}
      <div className="filters">
        <label>
          School:
          <select value={selectedSchool} onChange={(e) => {
            setSelectedSchool(e.target.value);
            setSelectedClass('');
          }}>
            <option value="">All</option>
            {allSchools.map((school, i) => (
              <option key={i} value={school}>{school}</option>
            ))}
          </select>
        </label>

        <label>
          Class:
          <select value={selectedClass} onChange={(e) => setSelectedClass(e.target.value)}>
            <option value="">All</option>
            {classOptions.map((cls, i) => (
              <option key={i} value={cls.id}>{cls.className}</option>
            ))}
          </select>
        </label>

        <button onClick={() => {
          setSelectedSchool('');
          setSelectedClass('');
        }}>Clear Filter</button>

        <button onClick={handleExportPDF}>📥 Export PDF</button>
      </div>

      {/* Table */}
      <div className="trainer-table-wrapper">
        <table className="trainer-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Class</th>
              <th>School</th>
              <th>Trainer</th>
              <th>Status</th>
              <th>Attendance</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {filteredSessions.map((s, i) => {
              const cls = getClassById(s.classId);
              const trainer = getTrainerById(s.trainerId);
              const present = Object.values(s.attendance || {}).filter(p => p).length;
              const total = Object.keys(s.attendance || {}).length;

              return (
                <tr key={i}>
                  <td>{new Date(s.date?.seconds * 1000).toLocaleDateString()}</td>
                  <td>{cls.className || '-'}</td>
                  <td>{cls.school || '-'}</td>
                  <td>{`${trainer.firstName || ''} ${trainer.lastName || ''}`.trim() || '-'}</td>
                  <td>{s.status ? '✅ Completed' : '⏳ Pending'}</td>
                  <td>{`${present}/${total}`}</td>
                  <td><button onClick={() => handleViewDetails(s)}>View</button></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {selectedSession && (
        <div className="modal-overlay" onClick={handleCloseModal}>
          <div className="session-modal-card" onClick={(e) => e.stopPropagation()}>
            <h3>Session Details</h3>
            <div className="session-details-grid">
              <div>📅 Date:</div><div>{formatDate(selectedSession.date)}</div>
              <div>⏰ Start Time:</div><div>{selectedSession.startTime || '-'}</div>
              <div>🕒 Duration:</div><div>{selectedSession.duration || '-'} minutes</div>
              <div>🏫 School:</div><div>{getClassById(selectedSession.classId)?.school || '-'}</div>
              <div>🏷️ Class:</div><div>{getClassById(selectedSession.classId)?.className || '-'}</div>
              <div>📚 Topic:</div><div>{selectedSession.topic || '-'}</div>
              <div>🧑‍🏫 Method:</div><div>{selectedSession.method || '-'}</div>
              <div>⭐ Student Rating:</div><div>{getRatingStars(selectedSession.studentRating)}</div>
              <div>📘 Material Rating:</div><div>{getRatingStars(selectedSession.materialRating)}</div>
              <div>📝 Notes:</div><div>{selectedSession.notes || '-'}</div>
              <div>✅ Status:</div><div>{selectedSession.status ? 'Completed' : 'Pending'}</div>
              <div>👥 Attendance:</div>
              <div>
                <ul style={{ paddingLeft: '1rem', lineHeight: '1.6' }}>
                  {studentAttendance.length === 0 ? (
                    <li>No attendance data.</li>
                  ) : (
                    studentAttendance.map(({ name, present }, idx) => (
                      <li key={idx}>{name} {present ? '✅' : '❌'}</li>
                    ))
                  )}
                </ul>
              </div>
            </div>
            <button className="close-btn" onClick={handleCloseModal}>Close</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminSessionAnalytics;


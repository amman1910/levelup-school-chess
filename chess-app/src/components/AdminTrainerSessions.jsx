import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { getDoc, doc } from 'firebase/firestore';

const AdminTrainerSessions = ({ trainer, sessions, classes }) => {
  const [selectedSession, setSelectedSession] = useState(null);
  const [studentAttendance, setStudentAttendance] = useState([]);

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

  const getClassInfo = (classId) => {
    return classes.find(c => c.id === classId) || {};
  };

  const getRatingStars = (rating) => {
    return '⭐'.repeat(rating || 0);
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

  return (
    <div className="trainer-analytics-page">
      <h2>{trainer?.firstName} {trainer?.lastName} - Sessions</h2>

      <div className="trainer-table-wrapper">
        <table className="trainer-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Class</th>
              <th>Status</th>
              <th>Attendance</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {sessions.map((s, i) => {
              const cls = getClassInfo(s.classId);
              const total = s.attendance ? Object.keys(s.attendance).length : 0;
              const present = s.attendance
                ? Object.values(s.attendance).filter(val => val === true).length
                : 0;

              return (
                <tr key={i}>
                  <td>{formatDate(s.date)}</td>
                  <td>{cls.className || '-'}</td>
                  <td>{s.status ? 'Completed' : 'Pending'}</td>
                  <td>{present}/{total}</td>
                  <td>
                    <button onClick={() => handleViewDetails(s)}>View Details</button>
                  </td>
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
              <div>🏫 School:</div><div>{getClassInfo(selectedSession.classId)?.school || '-'}</div>
              <div>🏷️ Class:</div><div>{getClassInfo(selectedSession.classId)?.className || '-'}</div>
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
                      <li key={idx}>
                        {name} {present ? '✅' : '❌'}
                      </li>
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

export default AdminTrainerSessions;



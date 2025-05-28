import React, { useEffect, useState } from 'react';
import { collection, getDocs, doc, getDoc, query, where } from 'firebase/firestore';
import { db } from '../firebase';
import { useNavigate } from 'react-router-dom';
import './TrainerSessions.css';

const TrainerSessions = () => {
  const [upcoming, setUpcoming] = useState([]);
  const [past, setPast] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchSessions = async () => {
      const user = JSON.parse(localStorage.getItem('user'));
      const trainerId = user?.uid;
      if (!trainerId) return;

      try {
        const q = query(collection(db, 'sessions'), where('trainerId', '==', trainerId));
        const snapshot = await getDocs(q);
        const now = new Date();

        const sessionsList = [];

        for (const docSnap of snapshot.docs) {
          const data = docSnap.data();
          let date = null;

          if (data.date?.seconds) {
            date = new Date(data.date.seconds * 1000);
          } else if (typeof data.date === 'string') {
            date = new Date(data.date);
          }

          const classId = data.classesId;
          let className = '[No Class]';
          let studentsCount = 0;
          let school = '[No School]';

          if (classId) {
            const classRef = doc(db, 'classes', classId);
            const classDoc = await getDoc(classRef);
            if (classDoc.exists()) {
              const classData = classDoc.data();
              className = classData.className || className;
              school = classData.school || school;
              studentsCount = Array.isArray(classData.studentsId) ? classData.studentsId.length : 0;
            }
          }

          const sessionObj = {
            id: docSnap.id,
            date,
            duration: data.duration || '',
            status: date && date >= now ? 'upcoming' : 'completed',
            studentsCount,
            className,
            school,
            fullData: data
          };

          sessionsList.push(sessionObj);
        }

        setUpcoming(sessionsList.filter(s => s.status === 'upcoming'));
        setPast(sessionsList.filter(s => s.status === 'completed'));
      } catch (error) {
        console.error('Error fetching sessions:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchSessions();
  }, []);

  const handleRowClick = (session) => {
    navigate('/trainer-area/record-session', {
  state: {
    ...session,
    classesId: session.fullData.classesId,
    className: session.className
  }
});

  };

  const renderTable = (sessions) => (
    <table className="sessions-table">
      <thead>
        <tr>
          <th>Class</th>
          <th>School</th>
          <th>Date</th>
          <th>Duration</th>
          <th>Status</th>
          <th># Students</th>
        </tr>
      </thead>
      <tbody>
        {sessions.map((s) => (
          <tr key={s.id} title="Click to record session" onClick={() => handleRowClick(s)} style={{ cursor: 'pointer' }}>
            <td>{s.className}</td>
            <td>{s.school}</td>
            <td>{s.date?.toLocaleString()}</td>
            <td>{s.duration || '-'} min</td>
            <td className={`status ${s.status}`}>{s.status.charAt(0).toUpperCase() + s.status.slice(1)}</td>
            <td>{s.studentsCount}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );

  if (loading) return <p className="loading">Loading sessions...</p>;

  return (
    <div className="sessions-page">
      <section className="session-section">
        <h2 className="section-title">Upcoming Sessions</h2>
        {upcoming.length === 0 ? <p className="empty">No upcoming sessions.</p> : renderTable(upcoming)}
      </section>

      <section className="session-section">
        <h2 className="section-title">Past Sessions</h2>
        {past.length === 0 ? <p className="empty">No past sessions.</p> : renderTable(past)}
      </section>
    </div>
  );
};

export default TrainerSessions;












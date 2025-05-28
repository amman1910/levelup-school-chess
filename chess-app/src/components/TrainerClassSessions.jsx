import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import './TrainerClassSessions.css';

const TrainerClassSessions = () => {
  const { classId } = useParams();
  const [sessions, setSessions] = useState([]);
  const [className, setClassName] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchClassAndSessions = async () => {
      try {
        const classRef = doc(db, 'classes', classId);
        const classSnap = await getDoc(classRef);
        if (classSnap.exists()) {
          const classData = classSnap.data();
          setClassName(classData.className || 'Unnamed Class');

          const q = query(
            collection(db, 'sessions'),
            where('classesId', '==', classId)
          );
          const snapshot = await getDocs(q);

          const sessionList = snapshot.docs.map(doc => {
            const data = doc.data();
            return {
              id: doc.id,
              date: data.date?.seconds ? new Date(data.date.seconds * 1000) : new Date(data.date),
              topic: data.topic || '-',
              duration: data.duration || '-',
              method: data.method || '-',
            };
          });

          setSessions(sessionList.sort((a, b) => b.date - a.date));
        }
      } catch (error) {
        console.error('Error fetching class sessions:', error);
      }
    };

    fetchClassAndSessions();
  }, [classId]);

  return (
    <div className="class-sessions-page">
      <button className="back-button" onClick={() => navigate(-1)}>&larr; Back</button>
      <h2>Sessions for {className}</h2>
      {sessions.length === 0 ? (
        <p>No sessions recorded for this class.</p>
      ) : (
        <table className="sessions-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Topic</th>
              <th>Duration</th>
              <th>Method</th>
            </tr>
          </thead>
          <tbody>
            {sessions.map(session => (
              <tr key={session.id}>
                <td>{session.date.toLocaleDateString()}</td>
                <td>{session.topic}</td>
                <td>{session.duration} min</td>
                <td>{session.method}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default TrainerClassSessions;
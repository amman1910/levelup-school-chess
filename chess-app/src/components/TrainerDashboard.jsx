import React, { useEffect, useState } from 'react';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../firebase';
import './TrainerDashboard.css';
import {
  Users, BookOpen, CalendarCheck2, ClipboardCheck
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer
} from 'recharts';

const TrainerDashboard = () => {
  const [stats, setStats] = useState({
    classes: 0,
    students: 0,
    upcomingSessions: 0,
    recordedSessions: 0
  });

  const [upcoming, setUpcoming] = useState([]);
  const [classProgress, setClassProgress] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      const user = JSON.parse(localStorage.getItem('user'));
      if (!user?.uid) return;

      const q = query(collection(db, 'classes'), where('assignedTrainer', '==', user.uid));
      const snapshot = await getDocs(q);
      const classList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      const totalStudents = classList.reduce((acc, cls) => acc + (cls.studentsId?.length || 0), 0);

      const sessionQuery = query(collection(db, 'sessions'), where('trainerId', '==', user.uid));
      const sessionSnapshot = await getDocs(sessionQuery);
      const now = new Date();
      const sessions = sessionSnapshot.docs.map(doc => {
        const data = doc.data();
        const date = data.date?.seconds ? new Date(data.date.seconds * 1000) : new Date(data.date);
        return { ...data, date };
      });

      const upcoming = sessions.filter(s => s.date >= now).sort((a, b) => a.date - b.date);
      const recorded = sessions.filter(s => s.date < now);

      const progressData = classList.map(cls => {
        const count = sessions.filter(s => s.classesId === cls.id).length;
        return {
          name: cls.className || 'Unnamed',
          sessions: count
        };
      });

      setStats({
        classes: classList.length,
        students: totalStudents,
        upcomingSessions: upcoming.length,
        recordedSessions: recorded.length
      });

      setUpcoming(upcoming.slice(0, 5));
      setClassProgress(progressData);
    };

    fetchData();
  }, []);

  return (
    <div className="dashboard-page">
      <h2>Welcome Back, Trainer</h2>

      <div className="stats-grid">
        <div className="stat-card">
          <BookOpen size={32} />
          <div>
            <h3>{stats.classes}</h3>
            <p>Classes</p>
          </div>
        </div>

        <div className="stat-card">
          <Users size={32} />
          <div>
            <h3>{stats.students}</h3>
            <p>Students</p>
          </div>
        </div>

        <div className="stat-card">
          <CalendarCheck2 size={32} />
          <div>
            <h3>{stats.upcomingSessions}</h3>
            <p>Upcoming Sessions</p>
          </div>
        </div>

        <div className="stat-card">
          <ClipboardCheck size={32} />
          <div>
            <h3>{stats.recordedSessions}</h3>
            <p>Recorded Sessions</p>
          </div>
        </div>
      </div>

      <div className="upcoming-section">
        <h3>Next Sessions</h3>
        {upcoming.length === 0 ? <p>No upcoming sessions.</p> : (
          <ul className="session-list">
            {upcoming.map((s, idx) => (
              <li key={idx}>
                <span>{s.date.toLocaleString()}</span>
                <span>{s.topic || 'No topic'}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="chart-section">
        <h3>Sessions per Class</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={classProgress}>
            <XAxis dataKey="name" stroke="#5e3c8f" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="sessions" fill="#e9c44c" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default TrainerDashboard;

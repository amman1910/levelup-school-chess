import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next'; // add useTranslation
import { collection, getDocs, query, where, doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import './TrainerDashboard.css';
import {
  Users, BookOpen, CalendarCheck2, ClipboardCheck
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer
} from 'recharts';

const TrainerDashboard = () => {
  const { t } = useTranslation(); // adding hook for traslating
  const [stats, setStats] = useState({
    classes: 0,
    students: 0,
    upcomingSessions: 0,
    recordedSessions: 0
  });

  const [upcoming, setUpcoming] = useState([]);
  const [classProgress, setClassProgress] = useState([]);
  const [trainerName, setTrainerName] = useState('Trainer');

  useEffect(() => {
    const fetchData = async () => {
      const user = JSON.parse(localStorage.getItem('user'));
      if (!user?.uid) return;

      // Fetch trainer name
      try {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          const fullName = `${userData.firstName || ''} ${userData.lastName || ''}`.trim();
          setTrainerName(fullName || 'Trainer');
        }
      } catch (error) {
        console.error('Error fetching trainer name:', error);
      }

      // Fetch classes
      const classQuery = query(collection(db, 'classes'), where('assignedTrainer', '==', user.uid));
      const classSnapshot = await getDocs(classQuery);
      const classList = classSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      // Calculate total students
      const totalStudents = classList.reduce((acc, cls) => acc + (cls.studentsId?.length || 0), 0);

      // Fetch sessions
      const sessionQuery = query(collection(db, 'sessions'), where('trainerId', '==', user.uid));
      const sessionSnapshot = await getDocs(sessionQuery);
      const sessions = sessionSnapshot.docs.map(doc => {
        const data = doc.data();
        const date = data.date?.seconds ? new Date(data.date.seconds * 1000) : new Date(data.date);
        return { ...data, date };
      });

      // Print all class IDs
      console.log('All Class IDs:');
      classList.forEach(cls => {
        console.log(`Class: ${cls.className} - ID: ${cls.id}`);
      });

      // Filter sessions by status field instead of date
      const upcomingSessions = sessions.filter(s => s.status === false || s.status === undefined);
      const recordedSessions = sessions.filter(s => s.status === true);

      // Sort upcoming sessions by date (earliest first)
      const sortedUpcoming = upcomingSessions.sort((a, b) => a.date - b.date);

      // Calculate RECORDED sessions per class for chart (only status=true)
      const progressData = classList.map(cls => {
        // Filter sessions for this specific class AND only recorded ones (status=true)
        const classRecordedSessions = sessions.filter(s => {
          const classMatch = String(s.classId) === String(cls.id);
          const isRecorded = s.status === true;
          const shouldCount = classMatch && isRecorded;
          
          return shouldCount;
        });
        
        return {
          name: cls.className || 'Unnamed',
          sessions: classRecordedSessions.length
        };
      });

      // Update stats
      setStats({
        classes: classList.length,
        students: totalStudents,
        upcomingSessions: upcomingSessions.length,
        recordedSessions: recordedSessions.length
      });

      // Set upcoming sessions (limit to 5 for display)
      setUpcoming(sortedUpcoming.slice(0, 5));
      setClassProgress(progressData);
    };

    fetchData();
  }, []);

  return (
    <div className="dashboard-page">
      <h2>{t('trainerDashboard.welcomeBack')}, {trainerName}</h2>

      <div className="stats-grid">
        <div className="stat-card">
          <BookOpen size={32} />
          <div>
            <h3>{stats.classes}</h3>
            <p>{t('trainerDashboard.classes')}</p>
          </div>
        </div>

        <div className="stat-card">
          <Users size={32} />
          <div>
            <h3>{stats.students}</h3>
            <p>{t('trainerDashboard.students')}</p>
          </div>
        </div>

        <div className="stat-card">
          <CalendarCheck2 size={32} />
          <div>
            <h3>{stats.upcomingSessions}</h3>
            <p>{t('trainerDashboard.upcomingSessions')}</p>
          </div>
        </div>

        <div className="stat-card">
          <ClipboardCheck size={32} />
          <div>
            <h3>{stats.recordedSessions}</h3>
            <p>{t('trainerDashboard.recordedSessions')}</p>
          </div>
        </div>
      </div>

      <div className="upcoming-section">
        <h3>{t('trainerDashboard.nextSessions')}</h3>
        {upcoming.length === 0 ? (
          <p>{t('trainerDashboard.noUpcomingSessions')}</p>
        ) : (
          <ul className="session-list">
            {upcoming.map((session, idx) => (
              <li key={idx}>
                <span>{session.date.toLocaleString()}</span>
                <span>{session.topic || t('trainerSessions.notSpecified')}</span>
                <span className="status-indicator upcoming">{t('trainerDashboard.upcoming')}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="chart-section">
        <h3>{t('trainerDashboard.recordedSessionsPerClass')}</h3>
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
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next'; // הוספת useTranslation
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../firebase';
import './AdminDashboard.css';
import {
  Users, BookOpen, GraduationCap, Building2, 
  UserCheck, Calendar, TrendingUp, Activity
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';

const Dashboard = ({ users, classes, students }) => {
  const { t } = useTranslation(); // הוספת hook לתרגום
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalClasses: 0,
    totalStudents: 0,
    totalSchools: 0,
    trainers: 0,
    admins: 0,
    activeSessions: 0,
    completedSessions: 0
  });

  const [trainerData, setTrainerData] = useState([]);
  const [roleDistribution, setRoleDistribution] = useState([]);
  const [recentActivity, setRecentActivity] = useState([]);
  const [adminName, setAdminName] = useState('Administrator');

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Get admin name from localStorage
        const user = JSON.parse(localStorage.getItem('user'));
        if (user?.firstName || user?.lastName) {
          const fullName = `${user.firstName || ''} ${user.lastName || ''}`.trim();
          setAdminName(fullName || 'Administrator');
        }

        // Fetch schools
        const schoolsSnapshot = await getDocs(collection(db, 'schools'));
        const schools = schoolsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        // Fetch sessions for activity data
        const sessionsSnapshot = await getDocs(collection(db, 'sessions'));
        const sessions = sessionsSnapshot.docs.map(doc => {
          const data = doc.data();
          const date = data.date?.seconds ? new Date(data.date.seconds * 1000) : new Date(data.date);
          return { ...data, date, id: doc.id };
        });

        console.log('All sessions from database:');
        sessions.forEach(session => {
          console.log(`Session ID: ${session.id}, trainerId: ${session.trainerId}, status: ${session.status}, topic: ${session.topic}`);
        });

        console.log('All users (trainers):');
        users.filter(user => user.role === 'trainer').forEach(trainer => {
          console.log(`Trainer: ${trainer.firstName} ${trainer.lastName}, uid: ${trainer.uid}, id: ${trainer.id}`);
        });

        // Calculate role distribution
        const trainers = users.filter(user => user.role === 'trainer').length;
        const admins = users.filter(user => user.role === 'admin').length;
        const others = users.length - trainers - admins;

        // Calculate session stats
        const activeSessions = sessions.filter(s => s.status === false || s.status === undefined).length;
        const completedSessions = sessions.filter(s => s.status === true).length;

        // Prepare trainer performance data
        const trainerPerformance = users
          .filter(user => user.role === 'trainer')
          .map(trainer => {
            const trainerClasses = classes.filter(cls => cls.assignedTrainer === trainer.uid);
            
            // Debug: print trainer info
            console.log(`Trainer: ${trainer.firstName} ${trainer.lastName} (ID: ${trainer.uid})`);
            
            // Filter sessions by trainerId and status
            const trainerSessions = sessions.filter(s => {
              const sessionTrainerId = String(s.trainerId || '').trim();
              const trainerUid = String(trainer.uid || '').trim();
              const trainerId = String(trainer.id || '').trim();
              
              const matchesUid = sessionTrainerId === trainerUid;
              const matchesId = sessionTrainerId === trainerId;
              const matchesTrainer = matchesUid || matchesId;
              
              if (matchesTrainer) {
                console.log(`✓ Match found: Session ${s.id} (trainerId: ${sessionTrainerId}) matches trainer ${trainer.firstName} (uid: ${trainerUid})`);
              }
              
              return matchesTrainer;
            });
            
            const completedSessionsCount = trainerSessions.filter(s => s.status === true).length;
            
            console.log(`${trainer.firstName} - Total sessions: ${trainerSessions.length}, Completed: ${completedSessionsCount}`);
            
            return {
              name: `${trainer.firstName || ''} ${trainer.lastName || ''}`.trim() || 'Unknown',
              classes: trainerClasses.length,
              sessions: completedSessionsCount,
              students: trainerClasses.reduce((acc, cls) => acc + (cls.studentsId?.length || 0), 0)
            };
          })
          // .filter(trainer => trainer.sessions > 0 || trainer.classes > 0) // Temporarily commented out for debugging
          .sort((a, b) => b.sessions - a.sessions)
          .slice(0, 5); // Top 5 trainers

        console.log('Final trainer performance data:');
        trainerPerformance.forEach(trainer => {
          console.log(`${trainer.name}: ${trainer.sessions} sessions, ${trainer.classes} classes`);
        });

        // Prepare role distribution for pie chart
        const roleData = [
          { name: t('adminDashboard.trainersRole'), value: trainers, color: '#5e3c8f' },
          { name: t('adminDashboard.adminsRole'), value: admins, color: '#e9c44c' },
          { name: t('adminDashboard.othersRole'), value: others, color: '#8260b3' }
        ].filter(item => item.value > 0);

        // Generate recent activity (mock data based on real data)
        const recentActivities = [
          { type: 'session', desc: `${completedSessions} ${t('adminDashboard.sessionsCompletedThisMonth')}`, time: t('adminDashboard.today') },
          { type: 'user', desc: `${users.length} ${t('adminDashboard.totalUsersInSystem')}`, time: t('adminDashboard.current') },
          { type: 'class', desc: `${classes.length} ${t('adminDashboard.activeClassesInSystem')}`, time: t('adminDashboard.current') },
          { type: 'student', desc: `${students.length} ${t('adminDashboard.studentsEnrolled')}`, time: t('adminDashboard.current') }
        ];

        // Update all state
        setStats({
          totalUsers: users.length,
          totalClasses: classes.length,
          totalStudents: students.length,
          totalSchools: schools.length,
          trainers,
          admins,
          activeSessions,
          completedSessions
        });

        setTrainerData(trainerPerformance);
        setRoleDistribution(roleData);
        setRecentActivity(recentActivities);

      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      }
    };

    if (users.length > 0 || classes.length > 0 || students.length > 0) {
      fetchData();
    }
  }, [users, classes, students, t]);

  const COLORS = ['#5e3c8f', '#e9c44c', '#8260b3', '#d4b43c'];

  return (
    <div className="admin-dashboard-page">
      <h2>{t('adminDashboard.welcomeBack')}, {adminName}</h2>
      <p className="dashboard-subtitle">{t('adminDashboard.systemOverviewAnalytics')}</p>

      {/* Main Stats Grid */}
      <div className="admin-stats-grid">
        <div className="admin-stat-card">
          <Users size={32} />
          <div>
            <h3>{stats.totalUsers}</h3>
            <p>{t('adminDashboard.totalUsers')}</p>
          </div>
        </div>

        <div className="admin-stat-card">
          <BookOpen size={32} />
          <div>
            <h3>{stats.totalClasses}</h3>
            <p>{t('adminDashboard.activeClasses')}</p>
          </div>
        </div>

        <div className="admin-stat-card">
          <GraduationCap size={32} />
          <div>
            <h3>{stats.totalStudents}</h3>
            <p>{t('adminDashboard.totalStudents')}</p>
          </div>
        </div>

        <div className="admin-stat-card">
          <Building2 size={32} />
          <div>
            <h3>{stats.totalSchools}</h3>
            <p>{t('adminDashboard.schools')}</p>
          </div>
        </div>
      </div>

      {/* Secondary Stats Grid */}
      <div className="admin-secondary-stats">
        <div className="admin-stat-card secondary">
          <UserCheck size={28} />
          <div>
            <h3>{stats.trainers}</h3>
            <p>{t('adminDashboard.trainers')}</p>
          </div>
        </div>

        <div className="admin-stat-card secondary">
          <Calendar size={28} />
          <div>
            <h3>{stats.activeSessions}</h3>
            <p>{t('adminDashboard.upcomingSessions')}</p>
          </div>
        </div>

        <div className="admin-stat-card secondary">
          <TrendingUp size={28} />
          <div>
            <h3>{stats.completedSessions}</h3>
            <p>{t('adminDashboard.completedSessions')}</p>
          </div>
        </div>

        <div className="admin-stat-card secondary">
          <Activity size={28} />
          <div>
            <h3>{stats.admins}</h3>
            <p>{t('adminDashboard.administrators')}</p>
          </div>
        </div>
      </div>

      <div className="admin-dashboard-content">
        {/* Trainer Performance Chart */}
        <div className="admin-chart-section">
          <h3>{t('adminDashboard.topTrainersPerformance')}</h3>
          <p className="chart-description">{t('adminDashboard.completedSessionsByTrainer')}</p>
          {trainerData.length > 0 ? (

            <ResponsiveContainer width="100%" height={300}>
              <BarChart 
  data={trainerData}
  layout="horizontal"
  barCategoryGap={12}
  barGap={4}
  margin={{
    top: 80,
  right: isArabic ? 0 : 30,
  left: isArabic ? 30 : 0,
  bottom: 0
  }}
>

                <XAxis 
                  dataKey="name" 
                  stroke="#5e3c8f" 
                  fontSize={12}
                  angle={-35}
                  textAnchor="middle"
                  height={120}

  dy={20}
  reversed={isArabic}
/>


<YAxis
  stroke="#5e3c8f"
  orientation={isArabic ? "right" : "left"}
  mirror={false}
  tickMargin={8}

  type="number"
  allowDecimals={false}
  domain={[0, 'dataMax + 1']}
  tickCount={Math.min(trainerData.length + 1, 10)} 
/>




                <Tooltip 
                  contentStyle={{
                    backgroundColor: '#fff',
                    border: '1px solid #e9c44c',
                    borderRadius: '8px'
                  }}
                />
                <Bar 
                  dataKey="sessions" 
                  fill="#e9c44c" 
                  radius={[6, 6, 0, 0]}
                  name={t('adminDashboard.completedSessions')}
                />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="no-data">
              <p>{t('adminDashboard.noTrainerData')}</p>
            </div>
          )}
        </div>

        {/* Role Distribution */}
        <div className="admin-chart-section">
          <h3>{t('adminDashboard.userRoleDistribution')}</h3>
          <p className="chart-description">{t('adminDashboard.systemUsersByRole')}</p>
          {roleDistribution.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={roleDistribution}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {roleDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="no-data">
              <p>{t('adminDashboard.noRoleData')}</p>
            </div>
          )}
        </div>

        {/* Recent Activity */}
        <div className="admin-activity-section">
          <h3>{t('adminDashboard.systemOverview')}</h3>
          <div className="activity-list">
            {recentActivity.map((activity, index) => (
              <div key={index} className="activity-item">
                <div className="activity-icon">
                  {activity.type === 'session' && <Calendar size={16} />}
                  {activity.type === 'user' && <Users size={16} />}
                  {activity.type === 'class' && <BookOpen size={16} />}
                  {activity.type === 'student' && <GraduationCap size={16} />}
                </div>
                <div className="activity-content">
                  <span className="activity-desc">{activity.desc}</span>
                  <span className="activity-time">{activity.time}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Stats Summary */}
        <div className="admin-summary-section">
          <h3>{t('adminDashboard.quickSummary')}</h3>
          <div className="summary-grid">
            <div className="summary-item">
              <span className="summary-label">{t('adminDashboard.avgStudentsPerClass')}</span>
              <span className="summary-value">
                {stats.totalClasses > 0 ? Math.round(stats.totalStudents / stats.totalClasses) : 0}
              </span>
            </div>
            <div className="summary-item">
              <span className="summary-label">{t('adminDashboard.classesPerTrainer')}</span>
              <span className="summary-value">
                {stats.trainers > 0 ? Math.round(stats.totalClasses / stats.trainers) : 0}
              </span>
            </div>
            <div className="summary-item">
              <span className="summary-label">{t('adminDashboard.sessionCompletionRate')}</span>
              <span className="summary-value">
                {(stats.activeSessions + stats.completedSessions) > 0 
                  ? Math.round((stats.completedSessions / (stats.activeSessions + stats.completedSessions)) * 100)
                  : 0}%
              </span>
            </div>
            <div className="summary-item">
              <span className="summary-label">{t('adminDashboard.studentsPerSchool')}</span>
              <span className="summary-value">
                {stats.totalSchools > 0 ? Math.round(stats.totalStudents / stats.totalSchools) : 0}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
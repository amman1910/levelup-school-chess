import React, { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer } from 'recharts';
import './AdminAnalyticsOverview.css';

const AdminAttendanceTrends = ({ sessions, classes }) => {
  const [chartData, setChartData] = useState([]);
  const [selectedSchool, setSelectedSchool] = useState('');
  const [allSchools, setAllSchools] = useState([]);

  useEffect(() => {
    if (!sessions || !classes) return;

    const schoolSet = new Set();
    const grouped = {};

    classes.forEach((cls) => {
      const classId = cls.id;
      const className = cls.className || 'Unknown';
      const school = cls.school || 'Unknown';
      const studentIds = cls.studentsId || [];

      schoolSet.add(school);

      const relatedSessions = sessions.filter(s => s.classId === classId);
      let totalAttendance = 0;

      relatedSessions.forEach((session) => {
        const attendance = session.attendance || {};
        totalAttendance += Object.values(attendance).filter(p => p).length;
      });

      const totalPossible = studentIds.length * relatedSessions.length || 1;
      const attendancePercentage = ((totalAttendance / totalPossible) * 100).toFixed(1);

      grouped[classId] = {
        className,
        school,
        attendancePercentage: parseFloat(attendancePercentage)
      };
    });

    const data = Object.values(grouped);
    setAllSchools([...schoolSet]);
    setChartData(data);
  }, [sessions, classes]);

  const filteredChartData = selectedSchool
    ? chartData.filter(c => c.school === selectedSchool)
    : chartData;

  return (
    <div className="trainer-analytics-page">
      <h2>Attendance Trends</h2>
      <p className="subtitle">Track attendance percentage per class</p>

      {/* KPIs */}
      <div className="analytics-kpi-grid">
        <div className="kpi-card">
          <div className="kpi-title">📊 Total Classes</div>
          <div className="kpi-value">{filteredChartData.length}</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-title">📈 Avg Attendance</div>
          <div className="kpi-value">
            {filteredChartData.length > 0
              ? (
                filteredChartData.reduce((sum, c) => sum + c.attendancePercentage, 0) /
                filteredChartData.length
              ).toFixed(1)
              : '0'
            }%
          </div>
        </div>
      </div>

      {/* Filter */}
      <div className="filters">
        <label>
          School:
          <select value={selectedSchool} onChange={(e) => setSelectedSchool(e.target.value)}>
            <option value="">All</option>
            {allSchools.map((school, idx) => (
              <option key={idx} value={school}>{school}</option>
            ))}
          </select>
        </label>
        
        <label>
          Min Attendance (%):
          <input
            type="number"
            value={minAttendance}
            onChange={(e) => setMinAttendance(Number(e.target.value))}
            placeholder="e.g. 70"
            min="0"
            max="100"
            style={{ width: '80px', marginLeft: '10px' }}
          />
        </label>

        <button onClick={() => { setSelectedSchool(''); setMinAttendance(0); }}>Clear Filters</button>
</div>

      {/* Table */}
      <div className="trainer-table-wrapper" style={{ marginTop: '2rem' }}>
        <table className="trainer-table">
          <thead>
            <tr>
              <th>Class</th>
              <th>School</th>
              <th>Sessions</th>
              <th>Students</th>
              <th>Present</th>
              <th>Attendance %</th>
            </tr>
          </thead>
          <tbody>
            {filteredChartData.map((item, i) => (
              <tr key={i}>
                <td>{item.className}</td>
                <td>{item.school}</td>
                <td>{item.sessionCount}</td>
                <td>{item.studentCount}</td>
                <td>{item.actualAttendance}</td>
                <td>{item.attendancePercentage}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Chart */}
      <div className="chart-container">
        <ResponsiveContainer width="100%" height={350}>
          <BarChart data={filteredChartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="className" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="attendancePercentage" fill="#5e3c8f" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default AdminAttendanceTrends;




import React, { useEffect, useState } from 'react';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import { db } from '../firebase';
import './TrainerSchools.css';
import {
  School, Users, BookOpen, Clock,
  BarChart, ChevronDown, ChevronUp
} from 'lucide-react';
import {
  CircularProgressbar,
  buildStyles
} from 'react-circular-progressbar';
import 'react-circular-progressbar/dist/styles.css';

const TrainerSchools = () => {
  const [schoolsData, setSchoolsData] = useState([]);
  const [expandedSchool, setExpandedSchool] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchSchoolsData = async () => {
      const user = JSON.parse(localStorage.getItem('user'));
      if (!user?.uid) return;

      const q = query(collection(db, 'classes'), where('assignedTrainer', '==', user.uid));
      const snapshot = await getDocs(q);

      const schoolMap = {};

      for (const docSnap of snapshot.docs) {
        const data = docSnap.data();
        const schoolName = data.school || 'Unknown School';
        const classId = docSnap.id;
        const studentCount = data.studentsId?.length || 0;

        if (!schoolMap[schoolName]) {
          schoolMap[schoolName] = {
            schoolName,
            classes: [],
            totalStudents: 0,
          };
        }

        const sessionQuery = query(collection(db, 'sessions'), where('classesId', '==', classId));
        const sessionSnapshot = await getDocs(sessionQuery);
        const sessionCount = sessionSnapshot.size;

        const classObj = {
          className: data.className,
          classId,
          studentCount,
          sessionCount,
          progress: sessionCount * 10,
        };

        schoolMap[schoolName].classes.push(classObj);
        schoolMap[schoolName].totalStudents += studentCount;
      }

      const schoolsArray = Object.values(schoolMap);
      setSchoolsData(schoolsArray);
    };

    fetchSchoolsData();
  }, []);

  const toggleExpand = (schoolName) => {
    setExpandedSchool(prev => (prev === schoolName ? null : schoolName));
  };

  return (
    <div className="schools-page">
      <div className="school-cards">
        {schoolsData.map(school => {
          const totalProgress = Math.floor(
            school.classes.reduce((sum, c) => sum + c.progress, 0) / (school.classes.length || 1)
          );

          const isExpanded = expandedSchool === school.schoolName;

          return (
            <div key={school.schoolName} className={`school-card`}>
              <div className="school-inner">
                <div className="card-header" onClick={() => toggleExpand(school.schoolName)}>
                  <div className="header-top">
                    <h3><School size={20} /> {school.schoolName}</h3>
                    {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                  </div>
                  <p><BookOpen size={16} /> Classes: {school.classes.length}</p>
                  <p><Users size={16} /> Students: {school.totalStudents}</p>
                  <div className="progress-circle">
                    <CircularProgressbar
                      value={totalProgress}
                      text={`${totalProgress}%`}
                      styles={buildStyles({
                        textColor: '#5e3c8f',
                        pathColor: '#e9c44c',
                        trailColor: '#f5f5f5'
                      })}
                    />
                  </div>
                </div>

                {isExpanded && (
                  <div className="school-details">
                    {school.classes.map(cls => (
                      <div key={cls.classId} className="class-info">
                        <h4><BookOpen size={16} /> {cls.className}</h4>
                        <p><Users size={14} /> Students: {cls.studentCount}</p>
                        <p><Clock size={14} /> Sessions: {cls.sessionCount}</p>
                        <p><BarChart size={14} /> Progress: {cls.progress}%</p>

                        <div className="progress-circle">
                          <CircularProgressbar
                            value={cls.progress}
                            text={`${cls.progress}%`}
                            styles={buildStyles({
                              textColor: '#5e3c8f',
                              pathColor: '#e9c44c',
                              trailColor: '#f5f5f5'
                            })}
                          />
                        </div>

                        <button
                          className="view-sessions-btn"
                          onClick={() => navigate(`/trainer-area/class-sessions/${cls.classId}`)}
                        >
                          View Sessions
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default TrainerSchools;




import React, { useEffect, useState } from 'react';
import { db } from '../firebase';
import { collection, addDoc, getDoc, doc, query, where, getDocs } from 'firebase/firestore';
import { useLocation, useNavigate } from 'react-router-dom';
import './TrainerMeetingForm.css';

const TrainerMeetingForm = () => {
  const [date, setDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [method, setMethod] = useState('In-Person');
  const [sessionCount, setSessionCount] = useState(1);
  const [school, setSchool] = useState('');
  const [availableSchools, setAvailableSchools] = useState([]);
  const [group, setGroup] = useState('');
  const [availableGroups, setAvailableGroups] = useState([]);
  const [topic, setTopic] = useState('');
  const [students, setStudents] = useState([]);
  const [attendance, setAttendance] = useState({});
  const [materialRating, setMaterialRating] = useState(0);
  const [studentRating, setStudentRating] = useState(0);
  const [notes, setNotes] = useState('');
  const [photo, setPhoto] = useState(null);

  const location = useLocation();
  const navigate = useNavigate();
  const sessionData = location.state;

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user'));
    if (!user || user.role !== 'trainer') navigate('/login');
  }, [navigate]);

  useEffect(() => {
    if (sessionData) {
      if (sessionData.date) {
        const d = new Date(sessionData.date);
        setDate(d.toISOString().split('T')[0]);
        setStartTime(d.toTimeString().slice(0, 5));
      }
      setGroup(sessionData.className || '');
      fetchStudentsByClassId(sessionData.classesId);
    } else {
      fetchTrainerSchools();
    }
  }, [sessionData]);

  const fetchTrainerSchools = async () => {
    const user = JSON.parse(localStorage.getItem('user'));
    if (!user?.uid) return;
    const q = query(collection(db, 'classes'), where('assignedTrainer', '==', user.uid));
    const snapshot = await getDocs(q);
    const schools = new Set();
    snapshot.forEach(docSnap => {
      const data = docSnap.data();
      if (data.school) schools.add(data.school);
    });
    setAvailableSchools(Array.from(schools));
  };

  const fetchGroupsBySchool = async (selectedSchool) => {
    const user = JSON.parse(localStorage.getItem('user'));
    if (!user?.uid) return;
    const q = query(collection(db, 'classes'),
      where('assignedTrainer', '==', user.uid),
      where('school', '==', selectedSchool)
    );
    const snapshot = await getDocs(q);
    const groups = snapshot.docs.map(doc => ({
      id: doc.id,
      name: doc.data().className
    }));
    setAvailableGroups(groups);
  };

  const fetchStudentsByClassId = async (classId) => {
    if (!classId) return;
    try {
      const classDoc = await getDoc(doc(db, 'classes', classId));
      if (!classDoc.exists()) return;
      const classData = classDoc.data();
      const studentIds = classData.studentsId || [];

      const fetchedStudents = await Promise.all(
        studentIds.map(async (id) => {
          const studentDoc = await getDoc(doc(db, 'students', id));
          return studentDoc.exists() ? { id: studentDoc.id, ...studentDoc.data() } : null;
        })
      );

      const validStudents = fetchedStudents.filter(Boolean);
      setStudents(validStudents);
    } catch (err) {
      console.error('Error fetching students:', err);
    }
  };

  const handleSchoolChange = async (e) => {
    const selected = e.target.value;
    setSchool(selected);
    setGroup('');
    setStudents([]);
    setAvailableGroups([]);
    await fetchGroupsBySchool(selected);
  };

  const handleGroupChange = async (e) => {
    const selected = e.target.value;
    setGroup(selected);
    const selectedGroup = availableGroups.find(g => g.name === selected);
    if (selectedGroup) {
      await fetchStudentsByClassId(selectedGroup.id);
    }
  };

  const handleAttendance = (id) => {
    setAttendance(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const user = JSON.parse(localStorage.getItem('user'));
    const trainerId = user?.uid;

    const data = {
      trainerId,
      date,
      startTime,
      topic,
      method,
      sessionCount,
      school,
      group,
      attendance,
      materialRating,
      studentRating,
      notes,
      createdAt: new Date(),
    };

    try {
      await addDoc(collection(db, 'meetingReports'), data);
      alert('Session recorded successfully!');
      navigate('/trainer-area/sessions');
    } catch (err) {
      alert('Error saving session');
      console.error(err);
    }
  };

  const renderStars = (value, setter) => (
    <div className="star-rating">
      {[1, 2, 3, 4, 5].map((star) => (
        <span
          key={star}
          className={value >= star ? 'star filled' : 'star'}
          onClick={() => setter(star)}>
          ★
        </span>
      ))}
    </div>
  );

  return (
    <div className="meeting-form">
      <h2>Log a New Training Session</h2>
      <form onSubmit={handleSubmit}>
        <section>
          <h3>Session Info</h3>
          <label>Date: <input type="date" value={date} onChange={(e) => setDate(e.target.value)} required /></label>
          <label>Start Time: <input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} required /></label>
          <label>Session Topic: <input type="text" value={topic} onChange={(e) => setTopic(e.target.value)} required /></label>
          <label>Method:
            <select value={method} onChange={(e) => setMethod(e.target.value)}>
              <option value="In-Person">In-Person</option>
              <option value="Online">Online</option>
            </select>
          </label>
          <label>Number of Sessions: <input type="number" min="1" value={sessionCount} onChange={(e) => setSessionCount(e.target.value)} /></label>

          {/* 🔽 New: Choose School and Class */}
          {!sessionData && (
            <>
              <label>School:
                <select value={school} onChange={handleSchoolChange} required>
                  <option value="">Select School</option>
                  {availableSchools.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </label>

              <label>Class:
                <select value={group} onChange={handleGroupChange} required>
                  <option value="">Select Class</option>
                  {availableGroups.map(g => <option key={g.id} value={g.name}>{g.name}</option>)}
                </select>
              </label>
            </>
          )}

          {/* ✅ أو مدخل جاهز */}
          {sessionData && (
            <label>Class Name: <input type="text" value={group} disabled /></label>
          )}
        </section>

        <section>
          <h3>Attendance</h3>
          <div className="student-grid">
            {students.map(s => (
              <label key={s.id}>
                <input type="checkbox" checked={attendance[s.id] || false} onChange={() => handleAttendance(s.id)} />
                {s.fullName || s.id}
              </label>
            ))}
          </div>
        </section>

        <section>
          <h3>Rating</h3>
          <label>Material Rating: {renderStars(materialRating, setMaterialRating)}</label>
          <label>Student Rating: {renderStars(studentRating, setStudentRating)}</label>
        </section>

        <section>
          <h3>Upload</h3>
          <label>Upload Image:
            <input type="file" onChange={(e) => setPhoto(e.target.files[0])} />
          </label>
        </section>

        <section>
          <h3>Notes</h3>
          <label>Trainer Notes:
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Any notes or feedback..." />
          </label>
        </section>

        <button type="submit">Save Session</button>
      </form>
    </div>
  );
};

export default TrainerMeetingForm;




import React, { useEffect, useState } from 'react';
import { db } from '../firebase';
import { collection, addDoc, getDoc, doc, query, where, getDocs, updateDoc } from 'firebase/firestore';
import { useLocation, useNavigate } from 'react-router-dom';
import './TrainerMeetingForm.css';

const TrainerMeetingForm = () => {
  const [date, setDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [method, setMethod] = useState('In-Person');
  const [sessionCount, setSessionCount] = useState('1');
  const [duration, setDuration] = useState(60);
  const [school, setSchool] = useState('');
  const [schoolId, setSchoolId] = useState('');
  const [availableSchools, setAvailableSchools] = useState([]);
  const [group, setGroup] = useState('');
  const [classId, setClassId] = useState('');
  const [availableGroups, setAvailableGroups] = useState([]);
  const [topic, setTopic] = useState('');
  const [students, setStudents] = useState([]);
  const [attendance, setAttendance] = useState({});
  const [materialRating, setMaterialRating] = useState(0);
  const [studentRating, setStudentRating] = useState(0);
  const [notes, setNotes] = useState('');
  const [status, setStatus] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const location = useLocation();
  const navigate = useNavigate();
  const sessionData = location.state;
  
  // Check if this is an edit operation
  // If sessionData exists and has an id, it means we're editing an existing session
  const isEditing = sessionData?.id && !sessionData?.isRecording ? true : false;
  const isRecording = sessionData?.isRecording || false;
  const sessionId = sessionData?.id || null;

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user'));
    if (!user || user.role !== 'trainer') navigate('/login');
  }, [navigate]);

  useEffect(() => {
    // Debug: Check what data we received
    console.log('sessionData received:', sessionData);
    console.log('isEditing:', isEditing);
    console.log('isRecording:', isRecording);
    console.log('sessionId:', sessionId);
    
    if (sessionData) {
      // If editing existing session, populate all fields
      // If recording, populate only basic fields (date, school, duration, topic if exists)
      if (sessionData.date) {
        // Handle date whether it's string or object
        let dateValue = '';
        if (typeof sessionData.date === 'string') {
          // If it's a string, check if it contains time and extract just the date part
          if (sessionData.date.includes(' ')) {
            dateValue = sessionData.date.split(' ')[0];
          } else {
            dateValue = sessionData.date;
          }
        } else if (sessionData.date && sessionData.date.seconds) {
          // Timestamp object
          const d = new Date(sessionData.date.seconds * 1000);
          dateValue = d.toISOString().split('T')[0];
        }
        setDate(dateValue);
      }
      
      // Always populate these basic fields
      setGroup(sessionData.className || '');
      setClassId(sessionData.classId || sessionData.fullData?.classId || '');
      setSchoolId(sessionData.fullData?.schoolId || sessionData.school || '');
      setSchool(sessionData.fullData?.schoolId || sessionData.school || '');
      setDuration(sessionData.fullData?.duration || sessionData.duration || 60);
      
      // For recording mode, only populate topic if it exists, leave other fields empty for user input
      if (isRecording) {
        setTopic(sessionData.topic || sessionData.fullData?.topic || '');
        // Leave other fields empty for the trainer to fill
        setStartTime('');
        setMethod('In-Person');
        setSessionCount('1');
        setMaterialRating(0);
        setStudentRating(0);
        setNotes('');
        setAttendance({});
      } else if (isEditing) {
        // For editing mode, populate all existing fields
        setStartTime(sessionData.startTime || '');
        setTopic(sessionData.topic || sessionData.fullData?.topic || '');
        setMethod(sessionData.method || sessionData.fullData?.method || 'In-Person');
        setSessionCount(sessionData.fullData?.sessionCount || '1');
        setMaterialRating(sessionData.fullData?.materialRating || 0);
        setStudentRating(sessionData.fullData?.studentRating || 0);
        setNotes(sessionData.fullData?.notes || '');
        setStatus(sessionData.fullData?.status || false);
        
        // Initialize attendance for existing session
        if (sessionData.fullData?.attendance) {
          setAttendance(sessionData.fullData.attendance);
        }
      }
      
      if (sessionData.classId || sessionData.fullData?.classId) {
        fetchStudentsByClassId(sessionData.classId || sessionData.fullData?.classId);
      }
    } else {
      fetchTrainerSchools();
    }
  }, [sessionData]);

  const fetchTrainerSchools = async () => {
    const user = JSON.parse(localStorage.getItem('user'));
    if (!user?.uid) return;
    
    try {
      // Get all classes where this trainer is assigned
      const classesQuery = query(collection(db, 'classes'), where('assignedTrainer', '==', user.uid));
      const classesSnapshot = await getDocs(classesQuery);
      const uniqueSchools = new Set();
      
      classesSnapshot.forEach(docSnap => {
        const data = docSnap.data();
        if (data.school) {
          uniqueSchools.add(data.school); // School name
        }
      });
      
      // Convert to array of school names
      const schoolsArray = Array.from(uniqueSchools).map(schoolName => ({
        name: schoolName
      }));
      
      setAvailableSchools(schoolsArray);
    } catch (error) {
      console.error('Error fetching schools:', error);
    }
  };

  const fetchGroupsBySchool = async (selectedSchool) => {
    const user = JSON.parse(localStorage.getItem('user'));
    if (!user?.uid) return;
    
    try {
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
    } catch (error) {
      console.error('Error fetching groups:', error);
    }
  };

  const fetchStudentsByClassId = async (selectedClassId) => {
    if (!selectedClassId) return;
    
    try {
      const classDoc = await getDoc(doc(db, 'classes', selectedClassId));
      if (!classDoc.exists()) return;
      
      const classData = classDoc.data();
      const studentIds = classData.studentsId || [];

      const fetchedStudents = await Promise.all(
        studentIds.map(async (id) => {
          try {
            const studentDoc = await getDoc(doc(db, 'students', id));
            return studentDoc.exists() ? { id: studentDoc.id, ...studentDoc.data() } : null;
          } catch (error) {
            console.error(`Error fetching student ${id}:`, error);
            return null;
          }
        })
      );

      const validStudents = fetchedStudents.filter(Boolean);
      setStudents(validStudents);
      
      // Initialize attendance for existing session only in edit mode
      if (sessionData && sessionData.fullData?.attendance && !isRecording) {
        setAttendance(sessionData.fullData.attendance);
      }
    } catch (err) {
      console.error('Error fetching students:', err);
    }
  };

  const handleSchoolChange = async (e) => {
    const selectedSchoolName = e.target.value;
    
    setSchool(selectedSchoolName); // Store the school name
    setSchoolId(selectedSchoolName); // schoolId is the school name, not document ID
    setGroup('');
    setClassId('');
    setStudents([]);
    setAvailableGroups([]);
    setAttendance({});
    
    if (selectedSchoolName) {
      await fetchGroupsBySchool(selectedSchoolName);
    }
  };

  const handleGroupChange = async (e) => {
    const selected = e.target.value;
    setGroup(selected);
    
    const selectedGroup = availableGroups.find(g => g.name === selected);
    if (selectedGroup) {
      setClassId(selectedGroup.id);
      await fetchStudentsByClassId(selectedGroup.id);
    }
  };

  const handleAttendance = (studentId) => {
    setAttendance(prev => ({ ...prev, [studentId]: !prev[studentId] }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const user = JSON.parse(localStorage.getItem('user'));
    const trainerId = user?.uid;

    if (!trainerId) {
      alert('User not found. Please log in again.');
      return;
    }

    if (!classId) {
      alert('Please select a class.');
      return;
    }

    if (!date) {
      alert('Please select a date.');
      return;
    }

    const sessionDataToSave = {
      trainerId,
      date: date, // Save the selected date as string
      startTime,
      topic,
      method: method.toLowerCase(),
      sessionCount,
      duration: Number(duration),
      schoolId: schoolId, // This is the school name
      classId,  // This is the document ID from classes collection
      attendance,
      materialRating: Number(materialRating),
      studentRating: Number(studentRating),
      notes,
      status: true, // Always true when saving (completed session)
    };

    try {
      if ((isEditing || isRecording) && sessionId) {
        // Update existing session
        console.log('Updating session with ID:', sessionId);
        const sessionRef = doc(db, 'sessions', sessionId);
        await updateDoc(sessionRef, sessionDataToSave);
        setSuccessMessage('Session updated successfully!');
      } else {
        // Create new session
        console.log('Creating new session');
        await addDoc(collection(db, 'sessions'), sessionDataToSave);
        setSuccessMessage('Session recorded successfully!');
      }
      
      // Navigate after a brief delay to show the success message
      setTimeout(() => {
        navigate('/trainer-area/sessions');
      }, 2000);
      
    } catch (err) {
      console.error('Error in handleSubmit:', err);
      alert((isEditing || isRecording) ? 'Error updating session' : 'Error saving session');
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
      {/* Success Message */}
      {successMessage && (
        <div style={{
          position: 'fixed',
          top: '20px',
          left: '50%',
          transform: 'translateX(-50%)',
          background: '#27ae60',
          color: 'white',
          padding: '15px 25px',
          borderRadius: '8px',
          zIndex: 1000,
          fontWeight: 'bold'
        }}>
          {successMessage}
        </div>
      )}
      
      <h2>
        {isEditing ? 'Edit Training Session' : 
         isRecording ? 'Record Training Session' : 
         'Record Training Session'}
      </h2>
      <form onSubmit={handleSubmit}>
        <section>
          <h3>Session Info</h3>
          
          <label>
            Date:
            <input 
              type="date" 
              value={date} 
              onChange={(e) => setDate(e.target.value)} 
              required 
            />
          </label>
          
          <label>
            Start Time:
            <input 
              type="time" 
              value={startTime} 
              onChange={(e) => setStartTime(e.target.value)} 
              required 
            />
          </label>
          
          <label>
            Duration (minutes):
            <input 
              type="number" 
              min="1" 
              value={duration} 
              onChange={(e) => setDuration(e.target.value)} 
              required 
            />
          </label>
          
          <label>
            Session Topic:
            <input 
              type="text" 
              value={topic} 
              onChange={(e) => setTopic(e.target.value)} 
              placeholder="e.g., Chess basics, Opening principles"
              required 
            />
          </label>
          
          <label>
            Method:
            <select value={method} onChange={(e) => setMethod(e.target.value)}>
              <option value="In-Person">In-Person</option>
              <option value="Online">Online</option>
            </select>
          </label>
          
          <label>
            Session Number:
            <input 
              type="text" 
              value={sessionCount} 
              onChange={(e) => setSessionCount(e.target.value)}
              placeholder="e.g., 1, 2, 3..."
            />
          </label>

          {/* School and Class Selection - Only show if not editing OR if new session */}
          {!sessionData && (
            <>
              <label>
                School:
                <select value={school} onChange={handleSchoolChange} required>
                  <option value="">Select School</option>
                  {availableSchools.map(s => (
                    <option key={s.name} value={s.name}>{s.name}</option>
                  ))}
                </select>
              </label>

              <label>
                Class:
                <select value={group} onChange={handleGroupChange} required>
                  <option value="">Select Class</option>
                  {availableGroups.map(g => (
                    <option key={g.id} value={g.name}>{g.name}</option>
                  ))}
                </select>
              </label>
            </>
          )}

          {/* Pre-filled class for existing sessions */}
          {sessionData && (
            <>
              <label>
                School:
                <input type="text" value={school} disabled />
              </label>
              <label>
                Class Name:
                <input type="text" value={group} disabled />
              </label>
            </>
          )}
        </section>

        <section>
          <h3>Attendance</h3>
          {students.length === 0 ? (
            <p>No students found. Please select a class first.</p>
          ) : (
            <div className="student-grid">
              {students.map(student => (
                <label key={student.id}>
                  <input 
                    type="checkbox" 
                    checked={attendance[student.id] || false} 
                    onChange={() => handleAttendance(student.id)} 
                  />
                  {student.fullName || student.id}
                </label>
              ))}
            </div>
          )}
        </section>

        <section>
          <h3>Rating</h3>
          <label>
            Material Rating:
            {renderStars(materialRating, setMaterialRating)}
          </label>
          <label>
            Student Rating:
            {renderStars(studentRating, setStudentRating)}
          </label>
        </section>

        <section>
          <h3>Notes</h3>
          <label>
            Trainer Notes:
            <textarea 
              value={notes} 
              onChange={(e) => setNotes(e.target.value)} 
              placeholder="Any notes, observations, or feedback about the session..."
              rows="4"
            />
          </label>
        </section>

        <button type="submit">
          {isEditing ? 'Update Session' : 
           isRecording ? 'Complete Session' : 
           'Save Session'}
        </button>
      </form>
    </div>
  );
};

export default TrainerMeetingForm;
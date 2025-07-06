import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next'; // הוספת useTranslation
import { db } from '../firebase';
import { collection, addDoc, getDoc, doc, query, where, getDocs, updateDoc, Timestamp, increment } from 'firebase/firestore';
import { useLocation, useNavigate } from 'react-router-dom';
import './TrainerMeetingForm.css';

const TrainerMeetingForm = () => {
  const { t } = useTranslation(); // הוספת hook לתרגום
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

  // פונקציה לרישום פעולות ב-adminLogs
  const logTrainerAction = async (actionType, description, targetId = null) => {
    try {
      // קבלת פרטי המשתמש הנוכחי
      const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
      const trainerName = `${currentUser.firstName || ''} ${currentUser.lastName || ''}`.trim() || currentUser.email || 'Unknown Trainer';

      const logEntry = {
        actionType,
        adminName: trainerName, // משתמש באותו שדה כמו אדמין
        description,
        targetType: 'session',
        timestamp: new Date(),
        targetId: targetId || null,
        adminId: currentUser.uid || currentUser.id || null
      };

      await addDoc(collection(db, 'adminLogs'), logEntry);
      console.log('Trainer action logged:', logEntry);
    } catch (err) {
      console.error('Error logging trainer action:', err);
      // אל תעצור את הפעולה אם הלוג נכשל
    }
  };

  // Helper function to convert Timestamp to date input format (YYYY-MM-DD)
  const timestampToDateInput = (timestamp) => {
    if (!timestamp) return '';
    
    let dateObj;
    if (timestamp.seconds) {
      // Firestore Timestamp
      dateObj = new Date(timestamp.seconds * 1000);
    } else if (timestamp instanceof Date) {
      dateObj = timestamp;
    } else if (typeof timestamp === 'string') {
      dateObj = new Date(timestamp);
    } else {
      return '';
    }
    
    // Format as YYYY-MM-DD for date input
    return dateObj.toISOString().split('T')[0];
  };

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
      // Handle date using originalDate (Timestamp) when available, fallback to date
      const dateToUse = sessionData.originalDate || sessionData.fullData?.date;
      if (dateToUse) {
        const dateValue = timestampToDateInput(dateToUse);
        setDate(dateValue);
        console.log('Setting date to:', dateValue);
      }
      
      // Handle start time using originalStartTime when available
      const startTimeToUse = sessionData.originalStartTime || sessionData.fullData?.startTime || sessionData.startTime;
      if (startTimeToUse) {
        setStartTime(startTimeToUse);
        console.log('Setting start time to:', startTimeToUse);
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
        // For recording, we keep the date and startTime from the original session
        // but allow editing of other fields
        setMethod('In-Person');
        setSessionCount('1');
        setMaterialRating(0);
        setStudentRating(0);
        setNotes('');
        setAttendance({});
      } else if (isEditing) {
        // For editing mode, populate all existing fields
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
      alert(t('messages.error'));
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

    // Convert date string to Timestamp for Firestore
    const dateTimestamp = Timestamp.fromDate(new Date(date));

    const sessionDataToSave = {
      trainerId,
      date: dateTimestamp, // Save as Timestamp
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
      let actionDescription = '';
      let actionType = '';
      let targetSessionId = sessionId;

      if ((isEditing || isRecording) && sessionId) {
        // Update existing session
        console.log('Updating session with ID:', sessionId);
        const sessionRef = doc(db, 'sessions', sessionId);
        await updateDoc(sessionRef, sessionDataToSave);
        
        if (isRecording) {
          actionType = 'record-session';
          actionDescription = `Recorded a session for class "${group}" at ${school} on ${date}`;
        } else {
          actionType = 'edit-session';
          actionDescription = `Updated a session for class "${group}" at ${school} from ${date}`;
        }
        
        setSuccessMessage(t('trainerMeeting.sessionUpdated'));
      } else {
        // Create new session
        console.log('Creating new session');
        const docRef = await addDoc(collection(db, 'sessions'), sessionDataToSave);
        targetSessionId = docRef.id;
        
        actionType = 'add-session';
        actionDescription = `Recorded a new session for class "${group}" at ${school} on ${date}`;
        
        setSuccessMessage(t('trainerMeeting.sessionRecorded'));
      }

      // רישום פעולה ב-adminLogs
      await logTrainerAction(
        actionType,
        actionDescription,
        targetSessionId
      );

      // עדכון sessions_attended לתלמידים שנכחו
      if (!isEditing) { // רק אם זה לא עריכה של session קיים
        const attendedStudents = Object.keys(attendance).filter(studentId => attendance[studentId]);
        for (const studentId of attendedStudents) {
          try {
            await updateDoc(doc(db, 'students', studentId), {
              sessions_attended: increment(1)
            });
            console.log(`Updated sessions_attended for student ${studentId}`);
          } catch (error) {
            console.error(`Error updating sessions_attended for student ${studentId}:`, error);
            // לא נעצור את הפעולה אם העדכון נכשל
          }
        }
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
          background: '#d4edda',
          color: '#155724',
          padding: '15px 25px',
          borderRadius: '8px',
          zIndex: 1000,
          fontWeight: 'bold'
        }}>
          {successMessage}
        </div>
      )}
      
      <h2>
        {isEditing ? t('trainerMeeting.editTrainingSession') : 
         isRecording ? t('trainerMeeting.recordTrainingSession') : 
         t('trainerMeeting.recordTrainingSession')}
      </h2>
      <form onSubmit={handleSubmit}>
        <section>
          <h3>{t('trainerMeeting.sessionInfo')}</h3>
          
          <label>
            {t('trainerMeeting.date')}:
            <input 
              type="date" 
              value={date} 
              onChange={(e) => setDate(e.target.value)} 
              required 
            />
          </label>
          
          <label>
            {t('trainerMeeting.startTime')}:
            <input 
              type="time" 
              value={startTime} 
              onChange={(e) => setStartTime(e.target.value)} 
              required 
            />
          </label>
          
          <label>
            {t('trainerMeeting.duration')}:
            <input 
              type="number" 
              min="1" 
              value={duration} 
              onChange={(e) => setDuration(e.target.value)} 
              required 
            />
          </label>
          
          <label>
            {t('trainerMeeting.sessionTopic')}:
            <input 
              type="text" 
              value={topic} 
              onChange={(e) => setTopic(e.target.value)} 
              placeholder={t('trainerMeeting.topicPlaceholder')}
              required 
            />
          </label>
          
          <label>
            {t('trainerMeeting.method')}:
            <select value={method} onChange={(e) => setMethod(e.target.value)}>
              <option value="In-Person">{t('trainerMeeting.inPerson')}</option>
              <option value="Online">{t('trainerMeeting.online')}</option>
            </select>
          </label>
          
          <label>
            {t('trainerMeeting.sessionNumber')}:
            <input 
              type="text" 
              value={sessionCount} 
              onChange={(e) => setSessionCount(e.target.value)}
              placeholder={t('trainerMeeting.sessionNumberPlaceholder')}
            />
          </label>

          {/* School and Class Selection - Only show if not editing OR if new session */}
          {!sessionData && (
            <>
              <label>
                {t('trainerMeeting.school')}:
                <select value={school} onChange={handleSchoolChange} required>
                  <option value="">{t('trainerMeeting.selectSchool')}</option>
                  {availableSchools.map(s => (
                    <option key={s.name} value={s.name}>{s.name}</option>
                  ))}
                </select>
              </label>

              <label>
                {t('trainerMeeting.class')}:
                <select value={group} onChange={handleGroupChange} required>
                  <option value="">{t('trainerMeeting.selectClass')}</option>
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
                {t('trainerMeeting.school')}:
                <input type="text" value={school} disabled />
              </label>
              <label>
                {t('trainerMeeting.className')}:
                <input type="text" value={group} disabled />
              </label>
            </>
          )}
        </section>

        <section>
          <h3>{t('trainerMeeting.attendance')}</h3>
          {students.length === 0 ? (
            <p>{t('trainerMeeting.noStudents')}</p>
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
          <h3>{t('trainerMeeting.rating')}</h3>
          <label>
            {t('trainerMeeting.materialRating')}:
            {renderStars(materialRating, setMaterialRating)}
          </label>
          <label>
            {t('trainerMeeting.studentRating')}:
            {renderStars(studentRating, setStudentRating)}
          </label>
        </section>

        <section>
          <h3>{t('trainerMeeting.notes')}</h3>
          <label>
            {t('trainerMeeting.trainerNotes')}:
            <textarea 
              value={notes} 
              onChange={(e) => setNotes(e.target.value)} 
              placeholder={t('trainerMeeting.notesPlaceholder')}
              rows="4"
            />
          </label>
        </section>

        <button type="submit">
          {isEditing ? t('trainerMeeting.updateSession') : 
           isRecording ? t('trainerMeeting.completeSession') : 
           t('trainerMeeting.saveSession')}
        </button>
      </form>
    </div>
  );
};

export default TrainerMeetingForm;